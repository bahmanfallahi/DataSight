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
    role?: 'admin' | 'expert';
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
            setUser(currentUser);
            if (currentUser) {
                const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data() as UserProfile);
                } else {
                    // If user exists in Auth but not Firestore, create their profile
                    // This can happen for users created before the profile logic was in place
                    const profile = {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                        photoURL: currentUser.photoURL,
                        role: 'expert' // Default to 'expert' for safety
                    };
                    await setDoc(doc(firestore, 'users', currentUser.uid), {
                        ...profile,
                        createdAt: serverTimestamp()
                    });
                    setUserProfile(profile);
                }
            } else {
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
    // 1. Create the new user. This will unfortunately sign the admin out and sign in as the new user.
    const { user: newAuthUser } = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
    
    // 2. Create the Firestore document for the new user.
    await createUserProfileDocument(newAuthUser, {
      displayName: newUser.displayName,
      role: newUser.role,
    });
  
    // 3. Sign out the new user and sign the admin back in.
    await signOut(auth);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  
    return newAuthUser;
};


export const signInWithEmail = async ({ email, password }: SignInData) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
        // This is a fallback for users created manually in Auth but without a profile
        await createUserProfileDocument(user, { displayName: user.email!.split('@')[0], role: 'expert' });
    } else {
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true }).catch((err) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { lastLogin: 'serverTimestamp' },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    return userCredential;
}


export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
};
