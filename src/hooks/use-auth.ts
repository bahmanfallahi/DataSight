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
import { useRouter } from 'next/navigation';

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
                try {
                    const userDocRef = doc(firestore, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        setUserProfile(userDoc.data() as UserProfile);
                    } else {
                        console.warn(`No profile found for user ${currentUser.uid}. They may have been created in Auth but not Firestore.`);
                        await signOut(auth);
                        setUser(null);
                        setUserProfile(null);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    await signOut(auth);
                    setUser(null);
                    setUserProfile(null);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup on unmount
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
        const photoURL = `https://avatar.vercel.sh/${email}.png`;
        
        const profileData: UserProfile = {
            uid,
            email,
            displayName,
            photoURL,
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
    const originalUser = auth.currentUser;
    if (!originalUser) {
        throw new Error("Admin user is not authenticated.");
    }

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
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        
        const userRef = doc(firestore, 'users', user.uid);
        setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true }).catch((err) => {
            if (err.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: { lastLogin: 'serverTimestamp' },
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                 console.error("Failed to update last login:", err);
            }
        });

        return userCredential;
    } catch (error) {
        throw error;
    }
}


export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
};

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return { user, loading };
}
