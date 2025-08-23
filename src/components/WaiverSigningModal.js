import React, { useState } from 'react';
import { Check } from 'lucide-react';

const WaiverSigningModal = ({ isOpen, onClose, waiversToSign, onConfirm }) => {
    const [signatures, setSignatures] = useState({});
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSignatureChange = (waiverId, value) => {
        setSignatures(prev => ({ ...prev, [waiverId]: value }));
    };

    const handleConfirmSigning = () => {
        const unsignedWaivers = waiversToSign.filter(w => !signatures[w.id]);
        if (unsignedWaivers.length > 0) {
            setError('Please sign all waivers to continue.');
            return;
        }
        setError('');
        onConfirm(signatures);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Please Sign Required Waivers</h2>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {waiversToSign.map(waiver => (
                        <div key={waiver.id} className="p-4 border rounded-md">
                            <h3 className="font-bold text-lg mb-2">{waiver.title}</h3>
                            <div className="prose prose-sm max-w-none h-48 overflow-y-auto border p-2 rounded-md bg-gray-50">
                                <p>{waiver.content}</p>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Type your full name to sign:
                                </label>
                                <input
                                    type="text"
                                    onChange={(e) => handleSignatureChange(waiver.id, e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {error && <p className="px-6 text-sm text-red-600">{error}</p>}
                <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={handleConfirmSigning} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center">
                        <Check className="h-5 w-5 mr-2" /> Confirm and Enroll
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WaiverSigningModal;