import React, { useState, useMemo } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';
import { CheckCircle } from 'lucide-react';

const PendingClassApprovals = ({ currentUser, classes, enrollmentRequests }) => {
    const [selectedClass, setSelectedClass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState({});

    const pendingApprovals = useMemo(() => {
        let requests = enrollmentRequests.filter(req => req.status === 'pending_approval' || req.status === 'pending_waivers');
        if (selectedClass) {
            requests = requests.filter(req => req.classId === selectedClass);
        }
        return requests;
    }, [enrollmentRequests, selectedClass]);

    const canApprove = (course) => {
        if (!course || !currentUser) return false;
        return currentUser.isAdmin || course.leadInstructorId === currentUser.uid;
    };

    const handleApprove = async (requestId) => {
        setIsSubmitting(prev => ({ ...prev, [requestId]: true }));
        const approveEnrollmentFn = httpsCallable(functions, 'approveEnrollment');
        try {
            await approveEnrollmentFn({ requestId });
            alert('Enrollment approved successfully!');
        } catch (error) {
            console.error('Error approving enrollment:', error);
            alert(`Failed to approve enrollment: ${error.message}`);
        } finally {
            setIsSubmitting(prev => ({ ...prev, [requestId]: false }));
        }
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Pending Class Approvals</h2>
            <div className="flex space-x-4 mb-4">
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="">Filter by Class</option>
                    {classes.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                </select>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pendingApprovals.map(request => {
                            const course = classes.find(c => c.id === request.classId);
                            const showApproveButton = canApprove(course);
                            return (
                                <tr key={request.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{request.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{request.className}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(request.requestDate.seconds * 1000).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {request.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {showApproveButton && (
                                            <button
                                                onClick={() => handleApprove(request.id)}
                                                disabled={isSubmitting[request.id]}
                                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                title="Approve Enrollment"
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PendingClassApprovals;