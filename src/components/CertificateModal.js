// src/components/CertificateModal.js
import React from 'react';
import { Check, Mail, Download } from 'lucide-react';
import { generateClassPdf } from '../utils/pdfGenerator'; // Assuming you have this utility

const CertificateModal = ({ isOpen, onClose, certificateData }) => {
    if (!isOpen || !certificateData) return null;

    const { studentName, completedClass, stationsInClass, checkInsForClass } = certificateData;

    const handleEmail = () => {
        // In a real application, this would trigger a Firebase Cloud Function.
        console.log("Simulating email send...");
        console.log("To:", studentName);
        console.log("Subject: Your Certificate of Completion for " + completedClass.name);
        // The function would generate the PDF on the server, attach it, and send the email.
        alert("A copy of your certificate and skills report has been sent to your email.");
    };

    const handleDownload = () => {
        generateClassPdf(studentName, completedClass, stationsInClass, checkInsForClass);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                <div className="p-6 text-center bg-green-600 text-white rounded-t-2xl">
                    <h2 className="text-3xl font-bold">Certificate of Completion</h2>
                </div>
                <div className="p-8">
                    <p className="text-center text-lg text-gray-600 mb-6">This certifies that</p>
                    <h3 className="text-center text-4xl font-bold text-indigo-600 mb-6">{studentName}</h3>
                    <p className="text-center text-lg text-gray-600 mb-4">has successfully completed all required stations for the class</p>
                    <h4 className="text-center text-2xl font-semibold text-gray-800 mb-8">{completedClass.name}</h4>
                    <div className="bg-gray-50 p-6 rounded-lg mb-8">
                        <h5 className="font-bold text-gray-700 mb-3 text-center">Completed Stations:</h5>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {stationsInClass.map(station => (
                                <li key={station.id} className="flex items-center text-gray-600">
                                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                    <span>{station.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 rounded-b-2xl text-center">
                    <div className="mt-4 flex justify-center items-center space-x-4">
                        <button onClick={handleEmail} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center">
                            <Mail className="mr-2 h-4 w-4"/>Email Certificate
                        </button>
                        <button onClick={handleDownload} className="px-5 py-2.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 flex items-center">
                            <Download className="mr-2 h-4 w-4"/>Download Skills PDF
                        </button>
                        <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateModal;
