'use client';
import { useEffect, useState, useContext, createContext, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const defaultUser: User = {
    uid: 'default-user-uid',
    email: 'bahman.f.behtash@gmail.com',
    displayName: 'Bahman Behtash',
    photoURL: 'https://placehold.co/100x100/3b82f6/FFFFFF/png?text=BB',
    providerId: 'default',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
        creationTime: new Date().toUTCString(),
        lastSignInTime: new Date().toUTCString(),
    },
    providerData: [],
    // Add dummy implementations for methods to satisfy the type
    delete: async () => {},
    getIdToken: async () => 'mock-id-token',
    getIdTokenResult: async () => ({
        token: 'mock-id-token',
        expirationTime: '',
        authTime: '',
        issuedAtTime: '',
        signInProvider: null,
        signInSecondFactor: null,
        claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({}),
};


const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(defaultUser);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // In a real scenario, you might prefer the real user over the mock user.
                // For this mock setup, we can choose to either use the real user or stick with the mock.
                // Let's stick with the real user if they log in.
                setUser(currentUser);
                const userRef = doc(firestore, 'users', currentUser.uid);
                const userData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    lastLogin: serverTimestamp()
                };

                setDoc(userRef, userData, { merge: true }).catch(() => {
                    const permissionError = new FirestorePermissionError({
                        path: userRef.path,
                        operation: 'update',
                        requestResourceData: userData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            } else {
                 // If no real user, you could fall back to the mock user or null.
                 // Setting to null for a more realistic logout behavior.
                setUser(null);
            }
            setLoading(false);
        });

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

export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error signing in with Google: ", error);
    }
};

export const signOutWithGoogle = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
};
