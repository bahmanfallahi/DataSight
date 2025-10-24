'use client';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile as AuthUserProfile } from '@/hooks/use-auth';

export interface UserProfile extends AuthUserProfile {
    role: 'admin' | 'expert';
}


export async function getAllUsers(): Promise<UserProfile[]> {
    const usersCollection = collection(firestore, 'users');
    try {
        const querySnapshot = await getDocs(usersCollection);
        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
                uid: doc.id,
                email: data.email,
                displayName: data.displayName || null,
                photoURL: data.photoURL || null,
                role: data.role || 'expert',
            });
        });
        return users;
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: usersCollection.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        console.error("Error fetching users:", e);
        throw new Error("Could not fetch users from Firestore.");
    }
}

export const deleteUser = async (uid: string): Promise<void> => {
    const userRef = doc(firestore, 'users', uid);
    
    return deleteDoc(userRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw to be caught by the component
    });
};
