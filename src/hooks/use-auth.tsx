'use client';
import { useEffect, useState, useContext, createContext, ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    signOut, 
    type User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import type { SignInData } from '@/components/auth-form';
import type { AddUserData } from '@/components/add-user-form';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

interface SignUpParams {
    newUser: AddUserData;
    adminEmail: string;
    adminPassword: string;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const value = { user, loading };

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

const createUserProfileDocument = async (user: User, additionalData?: { displayName?: string }) => {
    const userRef = doc(firestore, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const { email, uid } = user;
        const displayName = additionalData?.displayName || user.displayName || email?.split('@')[0];
        
        const profileData = {
            uid,
            email,
            displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        };

        return setDoc(userRef, profileData).catch((err) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'create',
                requestResourceData: profileData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw err;
        });
    } else {
        // Update last login timestamp
        return setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true }).catch((err) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { lastLogin: 'serverTimestamp' },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
}

export const signUpWithEmail = async ({ newUser, adminEmail, adminPassword }: SignUpParams) => {
    // 1. Create the new user. This will unfortunately sign the admin out and sign in as the new user.
    const { user: newAuthUser } = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);

    // 2. Create the Firestore document for the new user.
    await createUserProfileDocument(newAuthUser, { displayName: newUser.displayName });

    // 3. Sign the new user out to restore the admin's session.
    await signOut(auth);

    // 4. Sign the admin back in.
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

    return newAuthUser;
};


export const signInWithEmail = async ({ email, password }: SignInData) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    // We only update the last login time, profile is created on sign up.
    const userRef = doc(firestore, 'users', user.uid);
    setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true }).catch((err) => {
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
        // Optionally, you can show a toast to the user here
    }
};
