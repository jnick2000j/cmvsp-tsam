// src/components/PrerequisiteUploadModal.js
import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

const PrerequisiteUploadModal = ({ isOpen, onClose, onUpload, className, isUploading }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Optional: Add file type/size validation here
            setFile(selectedFile);
            setError('');
        }
    };

    const handleUploadClick = () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        onUpload(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Upload Prerequisite Document</h3>
                    <p className="mt-1 text-sm text-gray-600">A document is required to check into the class: <span className="font-semibold">{className}</span>.</p>
                    <div className="mt-4">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <span className="p-2">{file ? file.name : 'Select a file'}</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </div>
                                    <p className="text-xs text-gray-500">PDF, PNG, JPG, DOCX up to 10MB</p>
                                </div>
                            </div>
                        </label>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleUploadClick}
                        disabled={isUploading || !file}
                    >
                        {isUploading ? 'Uploading...' : 'Upload and Check In'}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrerequisiteUploadModal;
