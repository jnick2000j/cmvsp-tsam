// src/components/CourseCatalog.js
import React, { useState, useMemo } from 'react';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const CourseCatalog = ({ currentUser, classes }) => {
    const [enrollingClassId, setEnrollingClassId] = useState(null);

    const visibleClasses = useMemo(() => {
        return classes.filter(cls => {
            if (cls.isCompleted === true) {
                return false;
            }

            if (!Array.isArray(cls.visibleToRoles) || cls.visibleToRoles.length === 0) {
                return true;
            }

            return Array.isArray(currentUser.roles) && currentUser.roles.some(userRole => cls.visibleToRoles.includes(userRole));
        });
    }, [classes, currentUser]);

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

    if (!classes) {
        return <div className="text-center p-8">Loading classes...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Course Catalog</h1>
            {visibleClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleClasses.map(cls => {
                        const isClosed = cls.isClosedForEnrollment === true;
                        const isEnrolled = isUserEnrolled(cls.id);
                        
                        return (
                            <div key={cls.id} className="border rounded-lg shadow-lg p-4 flex flex-col bg-white">
                                <h2 className="text-xl font-semibold mb-2">{cls.name}</h2>
                                <p className="text-gray-600 mb-1"><strong>Location:</strong> {cls.location || 'N/A'}</p>
                                <p className="text-gray-600 mb-1"><strong>Dates:</strong> {cls.startDate} to {cls.endDate}</p>
                                <p className="text-gray-700 mt-2 flex-grow">{cls.summary || 'No summary available.'}</p>
                                <div className="mt-4">
                                    <button
                                        onClick={() => handleSelfEnroll(cls.id)}
                                        disabled={isEnrolled || isClosed || enrollingClassId === cls.id}
                                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isEnrolled ? 'Enrolled' : (isClosed ? 'Enrollment Closed' : (enrollingClassId === cls.id ? 'Enrolling...' : 'Self-Enroll'))}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center p-8 text-gray-500">
                    There are no courses matching your training roles available at this time.
                </div>
            )}
        </div>
    );
};

export default CourseCatalog;