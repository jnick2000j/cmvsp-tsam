// src/components/CourseCatalog.js
import React, { useState, useEffect, useMemo } from 'react';
import { functions, db } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const CourseCatalog = ({ currentUser, classes }) => {
    const [enrollingClassId, setEnrollingClassId] = useState(null);
    const [enrollmentStatuses, setEnrollmentStatuses] = useState({});

    // This useEffect hook is the key fix. It sets up a real-time listener.
    useEffect(() => {
        // Only run the listener if the user is logged in.
        if (!currentUser?.uid) return;

        // Create a query to listen to enrollment requests specifically for the current user.
        const q = query(collection(db, "enrollmentRequests"), where("userId", "==", currentUser.uid));
        
        // onSnapshot creates a real-time connection.
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const statuses = {};
            // When the data changes in Firestore, this code runs automatically.
            snapshot.forEach(doc => {
                // Store the status ('pending', 'approved', etc.) for each class the user has interacted with.
                statuses[doc.data().classId] = doc.data().status;
            });
            // Update the component's state, which will re-render the UI with the correct button text.
            setEnrollmentStatuses(statuses);
        });

        // Cleanup function: when the component unmounts, stop listening to prevent memory leaks.
        return () => unsubscribe();
    }, [currentUser]); // This effect re-runs if the currentUser changes.

    const handleEnrollRequest = async (classId) => {
        setEnrollingClassId(classId);
        const enrollInCourseFn = httpsCallable(functions, 'enrollInCourse');
        try {
            const result = await enrollInCourseFn({ classId });
            alert(result.data.message);
        } catch (error) {
            console.error("Enrollment request failed:", error);
            alert(`Error: ${error.message}`);
        }
        setEnrollingClassId(null);
    };

    // This function determines the text and state of the button.
    const getButtonState = useMemo(() => (classId, isClosed) => {
        const status = enrollmentStatuses[classId];
        const isEnrolling = enrollingClassId === classId;

        if (isEnrolling) return { text: 'Submitting...', disabled: true, style: 'bg-yellow-500' };
        if (isClosed) return { text: 'Enrollment Closed', disabled: true, style: 'bg-gray-500' };
        
        switch (status) {
            case 'approved':
                return { text: 'Enrolled', disabled: true, style: 'bg-green-600' };
            case 'pending_approval':
            case 'pending_waivers': // Treat both pending states the same on this view
                return { text: 'Pending Approval', disabled: true, style: 'bg-yellow-500' };
            case 'denied':
                return { text: 'Request Denied', disabled: true, style: 'bg-red-600' };
            default:
                return { text: 'Request Enrollment', disabled: false, style: 'bg-blue-600 hover:bg-blue-700' };
        }
    }, [enrollmentStatuses, enrollingClassId]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Course Catalog</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => {
                    const buttonState = getButtonState(cls.id, cls.isClosedForEnrollment);
                    return (
                        <div key={cls.id} className="border rounded-lg shadow-lg p-4 flex flex-col bg-white">
                            <h2 className="text-xl font-semibold mb-2">{cls.name}</h2>
                            <p className="text-gray-600 mb-1"><strong>Location:</strong> {cls.location || 'N/A'}</p>
                            <p className="text-gray-600 mb-1"><strong>Dates:</strong> {cls.startDate} to {cls.endDate}</p>
                            <p className="text-gray-700 mt-2 flex-grow">{cls.summary || 'No summary available.'}</p>
                            <div className="mt-4">
                                <button
                                    onClick={() => handleEnrollRequest(cls.id)}
                                    disabled={buttonState.disabled}
                                    className={`w-full px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${buttonState.style} disabled:cursor-not-allowed`}
                                >
                                    {buttonState.text}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CourseCatalog;
