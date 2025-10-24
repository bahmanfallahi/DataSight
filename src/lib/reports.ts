'use client';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface Report {
    id: string;
    name: string;
    csvData: string;
    createdAt: Date;
    userId: string;
}

export const saveReport = async (name: string, csvData: string, userId: string) => {
    const reportsCollection = collection(firestore, 'datasight_data');
    const reportData = {
        name,
        csvData,
        createdAt: serverTimestamp(),
        userId,
    };

    return addDoc(reportsCollection, reportData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: reportsCollection.path,
            operation: 'create',
            requestResourceData: reportData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw to allow component to handle saving state
    });
};


export const getReports = async (userId: string): Promise<Report[]> => {
    try {
        const reportsCollection = collection(firestore, 'datasight_data');
        const q = query(reportsCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const reports: Report[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                name: data.name,
                csvData: data.csvData,
                // Ensure createdAt is a Date object, handling both Timestamp and string
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                userId: data.userId,
            });
        });
        
        // Sort reports by date descending in the client-side code
        reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return reports;
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            const reportsCollection = collection(firestore, 'datasight_data');
            const permissionError = new FirestorePermissionError({
                path: reportsCollection.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch reports from Firestore.");
    }
};

export const deleteReport = async (reportId: string): Promise<void> => {
    const reportRef = doc(firestore, 'datasight_data', reportId);
    
    return deleteDoc(reportRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: reportRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw to be caught by the component
    });
};
