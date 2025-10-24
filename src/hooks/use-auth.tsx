'use client';
import { useEffect, useState, useContext, createContext, ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    signOut, 
    type User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import type { SignInData } from '@/components/auth-form';
import type { AddUserData } from '@/components/add-user-form';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'admin' | 'expert';
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
}

interface SignUpParams {
    newUser: AddUserData;
    adminEmail: string;
    adminPassword: string;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(firestore, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data() as UserProfile);
                } else {
                    // This is a fallback for manually created users in Auth without a profile
                    const profile: UserProfile = {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
                        photoURL: currentUser.photoURL,
                        role: 'expert' // Safely default to 'expert'
                    };
                    await setDoc(userDocRef, { ...profile, createdAt: serverTimestamp() });
                    setUserProfile(profile);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const value = { user, userProfile, loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const createUserProfileDocument = async (user: User, additionalData: { displayName: string, role: 'admin' | 'expert' }) => {
    const userRef = doc(firestore, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const { email, uid } = user;
        const { displayName, role } = additionalData;
        
        const profileData: UserProfile = {
            uid,
            email,
            displayName,
            photoURL: user.photoURL,
            role,
        };

        return setDoc(userRef, { ...profileData, createdAt: serverTimestamp() }).catch((err) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'create',
                requestResourceData: profileData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw err;
        });
    }
}

export const signUpWithEmail = async ({ newUser, adminEmail, adminPassword }: SignUpParams) => {
    // This is a temporary auth instance to create the user without signing out the admin
    const { user: newAuthUser } = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
    
    await createUserProfileDocument(newAuthUser, {
      displayName: newUser.displayName,
      role: newUser.role,
    });
  
    // Sign out the newly created user and sign the admin back in.
    await signOut(auth);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  
    return newAuthUser;
};


export const signInWithEmail = async ({ email, password }: SignInData) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    const userRef = doc(firestore, 'users', user.uid);
    // Update last login time. Profile is fetched by AuthProvider on state change.
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true }).catch((err) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: { lastLogin: 'serverTimestamp' },
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return userCredential;
}


export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
};
