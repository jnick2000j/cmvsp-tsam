// src/components/PendingEnrollmentDetailsModal.js
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

const PendingEnrollmentDetailsModal = ({ isOpen, onClose, enrollment, allUsers }) => {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !enrollment) return null;

    const handleAction = async (action) => {
        setIsLoading(true);
        try {
            const processEnrollmentFn = httpsCallable(functions, 'processEnrollmentApproval');
            await processEnrollmentFn({
                classId: enrollment.classId,
                studentId: enrollment.id,
                action, // 'approve' or 'deny'
            });
            alert(`Enrollment ${action}d successfully.`);
            onClose();
        } catch (error) {
            console.error(`Error ${action}ing enrollment:`, error);
            alert(`Failed to ${action} enrollment.`);
        } finally {
            setIsLoading(false);
        }
    };

    const classData = enrollment.class;
    const studentData = enrollment.user;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Review Enrollment</h2>
                    <p className="text-gray-500">{studentData?.firstName} {studentData?.lastName} for {classData?.name}</p>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* User Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                        <p className="mt-2 text-sm text-gray-600">Email: {studentData?.email}</p>
                        <p className="text-sm text-gray-600">Phone: {studentData?.phone}</p>
                    </div>

                    {/* Prerequisites */}
                    {classData?.prerequisites?.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Prerequisite Submissions</h3>
                            <ul className="mt-2 space-y-3">
                                {classData.prerequisites.map(prereq => {
                                    const submission = enrollment.prerequisiteSubmissions?.[prereq.id];
                                    return (
                                        <li key={prereq.id} className="p-3 border rounded-md bg-gray-50">
                                            <p className="font-medium text-gray-800">{prereq.description}</p>
                                            {submission?.url ? (
                                                <a href={submission.url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center text-sm text-indigo-600 hover:underline">
                                                    <FileText className="h-4 w-4 mr-1" />
                                                    {submission.fileName}
                                                </a>
                                            ) : submission?.text ? (
                                                <p className="mt-1 text-sm text-gray-700 italic">"{submission.text}"</p>
                                            ) : (
                                                <p className="mt-1 text-sm text-red-500">No submission provided.</p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Waiver Status */}
                    {classData?.requiredWaivers?.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Required Waivers</h3>
                            <ul className="mt-2 space-y-2">
                                {classData.requiredWaivers.map(waiverId => {
                                    const waiver = allUsers.find(u => u.id === waiverId); // This is likely incorrect, should be a separate waivers collection
                                    const isSigned = enrollment.waiverStatus?.[waiverId] === true;
                                    return (
                                        <li key={waiverId} className="flex items-center space-x-2">
                                            {isSigned ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500" />
                                            )}
                                            <span className="text-sm text-gray-700">Waiver Name ({isSigned ? 'Signed' : 'Not Signed'})</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                    <button type="button" onClick={() => handleAction('deny')} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-400">
                        Deny
                    </button>
                    <button type="button" onClick={() => handleAction('approve')} disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400">
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PendingEnrollmentDetailsModal;