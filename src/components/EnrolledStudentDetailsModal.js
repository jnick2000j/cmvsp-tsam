import React from 'react';
import { X, FileText } from 'lucide-react';

const EnrolledStudentDetailsModal = ({ isOpen, onClose, student, waivers, enrollmentDetails }) => {
    if (!isOpen) return null;

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">{student.firstName} {student.lastName}'s Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-2">Signed Waivers</h3>
                        {enrollmentDetails?.waiverSignatures && Object.keys(enrollmentDetails.waiverSignatures).length > 0 ? (
                            <ul className="space-y-2">
                                {Object.entries(enrollmentDetails.waiverSignatures).map(([waiverId, signatureInfo]) => {
                                    const waiver = waivers.find(w => w.id === waiverId);
                                    return (
                                        <li key={waiverId} className="p-3 bg-gray-50 rounded-md">
                                            <p className="font-semibold text-gray-800">{waiver?.title || 'Unknown Waiver'}</p>
                                            <p className="text-sm text-gray-600"><strong>Signature:</strong> {signatureInfo.signature}</p>
                                            <p className="text-sm text-gray-500"><strong>Signed At:</strong> {formatTimestamp(signatureInfo.signedAt)}</p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No waivers were signed for this enrollment.</p>
                        )}
                    </div>
                    {/* You can add more sections here for prerequisites, etc. */}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-white border rounded-md text-sm font-medium">Close</button>
                </div>
            </div>
        </div>
    );
};

export default EnrolledStudentDetailsModal;