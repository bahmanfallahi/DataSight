'use client';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';

export interface Report {
    id: string;
    name: string;
    csvData: string;
    createdAt: Date;
}

export const saveReport = async (name: string, csvData: string) => {
    try {
        await addDoc(collection(firestore, 'reports'), {
            name,
            csvData,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error("Could not save report to Firestore.");
    }
};


export const getReports = async (): Promise<Report[]> => {
    try {
        const reportsCollection = collection(firestore, 'reports');
        const q = query(reportsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const reports: Report[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                name: data.name,
                csvData: data.csvData,
                createdAt: data.createdAt.toDate(),
            });
        });
        return reports;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch reports from Firestore.");
    }
};

    