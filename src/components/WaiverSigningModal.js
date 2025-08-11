// src/components/WaiverSigningModal.js
import React, { useState } from 'react';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import ReactMarkdown from 'react-markdown';

const WaiverSigningModal = ({ waiver, classId, currentUser, onClose }) => {
    const [signature, setSignature] = useState('');
    const [isSigning, setIsSigning] = useState(false);

    const handleSign = async () => {
        if (signature.trim().toLowerCase() !== currentUser.displayName.trim().toLowerCase()) {
            alert('Your signature must match your full name exactly.');
            return;
        }
        setIsSigning(true);
        const signWaiverFn = httpsCallable(functions, 'signWaiver');
        try {
            await signWaiverFn({ classId, waiverTemplateId: waiver.id, signature });
            alert('Waiver signed successfully!');
            onClose();
        } catch (error) {
            console.error('Error signing waiver:', error);
            alert(`Error: ${error.message}`);
        }
        setIsSigning(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-4">{waiver.title}</h2>
                <div className="prose max-w-none h-64 overflow-y-auto border p-4 mb-4">
                    <ReactMarkdown>{waiver.content}</ReactMarkdown>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Type your full name to sign:</label>
                    <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={currentUser.displayName} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                    <button onClick={handleSign} disabled={isSigning} className="px-4 py-2 text-white bg-green-600 rounded-md disabled:bg-gray-400">
                        {isSigning ? 'Submitting...' : 'Sign and Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WaiverSigningModal;