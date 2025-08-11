// src/components/PendingEnrollments.js
import React, { useState, useEffect, useMemo } from 'react';
import { db, functions } from '../firebaseConfig';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const PendingEnrollments = ({ currentUser, classes }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(null); // Track which request is being processed

    // Filter states
    const [selectedClass, setSelectedClass] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (!currentUser) return;

        let q = query(collection(db, "enrollmentRequests"), where("status", "==", "pending"));

        // Admins see all; instructors see only their assigned classes
        if (!currentUser.isAdmin) {
            q = query(q, where("leadInstructorId", "==", currentUser.uid));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pendingList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(pendingList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAction = async (requestId, action) => {
        setActionInProgress(requestId);
        const functionName = action === 'approve' ? 'approveEnrollment' : 'denyEnrollment';
        const actionFn = httpsCallable(functions, functionName);
        try {
            await actionFn({ requestId });
            // The real-time listener will automatically remove the item from the list
        } catch (error) {
            console.error(`Error performing action: ${action}`, error);
            alert(`Error: ${error.message}`);
        }
        setActionInProgress(null);
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const requestDate = req.requestDate.toDate();
            const isClassMatch = !selectedClass || req.classId === selectedClass;
            const isStartDateMatch = !startDate || requestDate >= new Date(startDate);
            const isEndDateMatch = !endDate || requestDate <= new Date(endDate);
            return isClassMatch && isStartDateMatch && isEndDateMatch;
        });
    }, [requests, selectedClass, startDate, endDate]);

    if (loading) return <div className="text-center p-8">Loading Pending Enrollments...</div>;

    return (
        <div className="container mx-auto p-4 bg-gray-50 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Pending Class Enrollments</h2>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-md">
                <div>
                    <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">Filter by Class</label>
                    <select id="class-filter" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        <option value="">All Classes</option>
                        {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-left">Student</th>
                            <th className="py-3 px-4 text-left">Class</th>
                            <th className="py-3 px-4 text-left">Request Date</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.length > 0 ? filteredRequests.map(req => (
                            <tr key={req.id} className="border-b hover:bg-gray-100">
                                <td className="py-3 px-4">{req.userName}</td>
                                <td className="py-3 px-4">{req.className}</td>
                                <td className="py-3 px-4">{req.requestDate.toDate().toLocaleDateString()}</td>
                                <td className="py-3 px-4 text-center space-x-2">
                                    <button 
                                        onClick={() => handleAction(req.id, 'approve')} 
                                        disabled={actionInProgress === req.id}
                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400">
                                        {actionInProgress === req.id ? '...' : 'Approve'}
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.id, 'deny')} 
                                        disabled={actionInProgress === req.id}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-gray-400">
                                        {actionInProgress === req.id ? '...' : 'Deny'}
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-500">No pending requests match your criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PendingEnrollments;