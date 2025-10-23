'use client';
import { useState, useContext, createContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

// Create a mock user object
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
    // Set the default user and finish loading immediately.
    const [user] = useState<User | null>(defaultUser);
    const [loading] = useState(false);

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

// Mock the sign-in and sign-out functions since we have a default user.
export const signInWithGoogle = async () => {
    console.log("Sign-in is disabled; using default user.");
};

export const signOutWithGoogle = async () => {
    console.log("Sign-out is disabled; using default user.");
};
