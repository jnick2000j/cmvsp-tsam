// src/components/PendingWaiverApprovals.js
import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const PendingWaiverApprovals = ({ currentUser }) => {
    const [pendingWaivers, setPendingWaivers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // A more complex query would be needed to filter by instructor
        const q = query(collection(db, "signedWaivers"), where("status", "==", "pending_review"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const waivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPendingWaivers(waivers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApprove = async (signedWaiverId) => {
        const approveWaiverFn = httpsCallable(functions, 'approveWaiver');
        try {
            await approveWaiverFn({ signedWaiverId });
            alert('Waiver approved!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    if (loading) return <div>Loading pending waivers...</div>;

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">Pending Waiver Approvals</h3>
            <div className="space-y-4">
                {pendingWaivers.map(waiver => (
                    <div key={waiver.id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                            <p><strong>Student:</strong> {waiver.userId}</p>
                            <p><strong>Waiver:</strong> {waiver.waiverTemplateId}</p>
                            <p><strong>Signature:</strong> "{waiver.signature}"</p>
                        </div>
                        <button onClick={() => handleApprove(waiver.id)} className="bg-green-500 text-white px-4 py-2 rounded-md">Approve Signature</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingWaiverApprovals;