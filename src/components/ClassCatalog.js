// src/components/ClassCatalog.js
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { appId } from '../constants';

const ClassCatalog = ({ currentUser }) => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingClassId, setEnrollingClassId] = useState(null);

    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const classesRef = collection(db, `artifacts/${appId}/public/data/classes`);
                // Query for classes that are not hidden
                const q = query(classesRef, where("isHidden", "==", false));
                const snapshot = await getDocs(q);
                const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClasses(classList);
            } catch (error) {
                console.error("Error fetching class catalog:", error);
            }
            setLoading(false);
        };

        fetchClasses();
    }, []);

    const handleSelfEnroll = async (classId) => {
        if (!currentUser) {
            alert("You must be logged in to enroll.");
            return;
        }
        setEnrollingClassId(classId);
        const selfEnrollFn = httpsCallable(functions, 'selfEnroll');
        try {
            const result = await selfEnrollFn({ classId });
            if (result.data.success) {
                alert(result.data.message);
                // Optionally, you could update the UI to show the user is enrolled
                // For now, the button is just disabled
            } else {
                throw new Error(result.data.message);
            }
        } catch (error) {
            console.error("Self-enrollment failed:", error);
            alert(`Error: ${error.message}`);
        }
        setEnrollingClassId(null);
    };

    const isUserEnrolled = (classId) => {
        return currentUser?.enrolledClasses?.includes(classId);
    };

    if (loading) {
        return <div className="text-center p-8">Loading classes...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Course Catalog</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                    <div key={cls.id} className="border rounded-lg shadow-lg p-4 flex flex-col">
                        <h2 className="text-xl font-semibold mb-2">{cls.name}</h2>
                        <p className="text-gray-600 mb-1"><strong>Location:</strong> {cls.location || 'N/A'}</p>
                        <p className="text-gray-600 mb-1"><strong>Dates:</strong> {cls.startDate} to {cls.endDate}</p>
                        <p className="text-gray-700 mt-2 flex-grow">{cls.summary || 'No summary available.'}</p>
                        <div className="mt-4">
                            <button
                                onClick={() => handleSelfEnroll(cls.id)}
                                disabled={isUserEnrolled(cls.id) || enrollingClassId === cls.id}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isUserEnrolled(cls.id) ? 'Enrolled' : (enrollingClassId === cls.id ? 'Enrolling...' : 'Self-Enroll')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassCatalog;