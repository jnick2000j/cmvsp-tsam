// src/components/WaiverSigningModal.js
import React, { useState } from 'react';

const WaiverSigningModal = ({ isOpen, onClose, waiver, onSign }) => {
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');

    const handleSign = () => {
        if (!agreed) {
            setError("You must agree to the terms to proceed.");
            return;
        }
        onSign(waiver);
    };

    if (!isOpen || !waiver) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">{waiver.title}</h2>
                </div>
                <div className="p-6 overflow-y-auto flex-grow prose max-w-none">
                    <p className="text-gray-600">{waiver.content}</p>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                    <div className="mt-6 flex items-center">
                        <input
                            id="agree-checkbox"
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => {
                                setAgreed(e.target.checked);
                                if (e.target.checked) setError('');
                            }}
                            className="rounded text-indigo-600"
                        />
                        <label htmlFor="agree-checkbox" className="ml-2 text-sm text-gray-700">
                            I agree to the terms and conditions of this waiver.
                        </label>
                    </div>
                </div>
                <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                    <div className="flex justify-end items-center space-x-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSign} disabled={!agreed} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">Sign Waiver</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaiverSigningModal;
