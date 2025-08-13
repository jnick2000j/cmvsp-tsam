// src/components/PendingEnrollmentManagement.js
import React, { useState } from 'react';
import PendingEnrollmentDetailsModal from './PendingEnrollmentDetailsModal'; // New component for details modal
import { UserX, CheckCircle, XCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

const PendingEnrollmentManagement = ({ pendingEnrollments, allUsers, classes }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);

    const handleViewDetails = (enrollment) => {
        const user = allUsers.find(u => u.id === enrollment.id);
        const cls = classes.find(c => c.id === enrollment.classId);
        
        setSelectedEnrollment({
            ...enrollment,
            user,
            class: cls,
        });
        setIsModalOpen(true);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <PendingEnrollmentDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                enrollment={selectedEnrollment}
                allUsers={allUsers}
            />
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pending Enrollments</h2>
                    <p className="mt-1 text-sm text-gray-500">Review and approve or deny class enrollment requests with prerequisites.</p>
                </div>
            </div>

            <div className="mt-6 flow-root">
                {pendingEnrollments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Class</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Submitted At</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {pendingEnrollments.map((enrollment) => {
                                    const student = allUsers.find(u => u.id === enrollment.id);
                                    const cls = classes.find(c => c.id === enrollment.classId);
                                    return (
                                        <tr key={`${enrollment.id}-${enrollment.classId}`}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {student ? `${student.firstName} ${student.lastName}` : 'Unknown User'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {cls?.name || 'Unknown Class'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {enrollment.enrolledAt?.toDate().toLocaleDateString()}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button onClick={() => handleViewDetails(enrollment)} className="text-indigo-600 hover:text-indigo-900">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <UserX className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg">No pending enrollments found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingEnrollmentManagement;