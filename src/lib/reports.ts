'use client';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where } from 'firebase/firestore';
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

    addDoc(reportsCollection, reportData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: reportsCollection.path,
            operation: 'create',
            requestResourceData: reportData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};


export const getReports = async (userId: string): Promise<Report[]> => {
    try {
        const reportsCollection = collection(firestore, 'datasight_data');
        const q = query(reportsCollection, where("userId", "==", userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const reports: Report[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                name: data.name,
                csvData: data.csvData,
                createdAt: data.createdAt.toDate(),
                userId: data.userId,
            });
        });
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
