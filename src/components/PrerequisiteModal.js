// src/components/PrerequisiteModal.js
import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, functions } from '../firebaseConfig'; // Import functions
import { httpsCallable } from 'firebase/functions'; // Import httpsCallable
import { Check, UploadCloud } from 'lucide-react';
import { appId } from '../constants';

const PrerequisiteModal = ({ isOpen, onClose, classToEnroll, user }) => {
    const [prereqData, setPrereqData] = useState({});
    const [files, setFiles] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !classToEnroll) return null;

    const handleFileChange = (prereqId, e) => {
        setFiles(prev => ({
            ...prev,
            [prereqId]: e.target.files[0]
        }));
    };

    const handleTextChange = (prereqId, e) => {
        setPrereqData(prev => ({
            ...prev,
            [prereqId]: { ...prev[prereqId], text: e.target.value }
        }));
    };

    const handleSubmit = async () => {
        setError('');
        
        // Validation check for required file uploads
        const missingFiles = classToEnroll.prerequisites
            .filter(p => p.requiresUpload && !files[p.id])
            .map(p => p.description);

        if (missingFiles.length > 0) {
            setError(`Please upload a file for the following prerequisite(s): ${missingFiles.join(', ')}`);
            return;
        }

        setIsLoading(true);
        try {
            const submissions = {};
            for (const prereq of classToEnroll.prerequisites) {
                if (prereq.requiresUpload && files[prereq.id]) {
                    const file = files[prereq.id];
                    const storage = getStorage();
                    const storageRef = ref(storage, `prerequisites/${user.uid}/${classToEnroll.id}/${prereq.id}_${file.name}`);
                    
                    const uploadTask = uploadBytes(storageRef, file);

                    await uploadTask;
                    const url = await getDownloadURL(storageRef);
                    submissions[prereq.id] = { url, fileName: file.name, description: prereq.description };
                } else if (!prereq.requiresUpload) {
                    submissions[prereq.id] = { text: prereqData[prereq.id]?.text || '', description: prereq.description };
                }
            }

            // Call the enrollStudent Cloud Function with the submissions
            const enrollStudent = httpsCallable(functions, 'enrollStudent');
            const result = await enrollStudent({
                classId: classToEnroll.id,
                studentId: user.uid,
                prerequisiteSubmissions: submissions
            });

            console.log("Enrollment result:", result.data);
            onClose();
            
        } catch (error) {
            console.error("Failed to submit prerequisites:", error);
            setError("An error occurred during submission. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Prerequisites for {classToEnroll.name}</h2>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <p className="text-sm text-gray-600">
                        This class requires you to submit the following prerequisites.
                    </p>
                    {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
                    <ul className="space-y-4">
                        {classToEnroll.prerequisites.map(prereq => (
                            <li key={prereq.id} className="p-4 border rounded-md bg-gray-50">
                                <div className="flex items-center space-x-2">
                                    <h4 className="font-semibold text-gray-800 flex-grow">{prereq.description}</h4>
                                    {prereq.requiresUpload && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">File Upload Required</span>}
                                </div>
                                <div className="mt-3">
                                    {prereq.requiresUpload ? (
                                        <>
                                            <input
                                                type="file"
                                                onChange={(e) => handleFileChange(prereq.id, e)}
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            />
                                            {files[prereq.id] && (
                                                <p className="mt-2 text-xs text-green-600 flex items-center">
                                                    <Check className="h-4 w-4 mr-1" />
                                                    {files[prereq.id].name} ready for upload.
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            onChange={(e) => handleTextChange(prereq.id, e)}
                                            placeholder="Enter relevant information..."
                                            className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                                        />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-white border rounded-md text-sm font-medium">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Submitting...' : 'Submit Prerequisites'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrerequisiteModal;