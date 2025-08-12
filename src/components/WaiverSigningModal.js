import React, { useState, useRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';

const WaiverSigningModal = ({ user, classToEnroll, waivers, onClose, onSigned }) => {
    const [currentWaiverIndex, setCurrentWaiverIndex] = useState(0);
    const sigPad = useRef(null);
    const [error, setError] = useState('');

    const currentWaiver = waivers[currentWaiverIndex];

    const clearSignature = () => {
        if (sigPad.current) {
            sigPad.current.clear();
        }
    };

    const handleSign = async () => {
        if (sigPad.current.isEmpty()) {
            setError('Please provide a signature before proceeding.');
            return;
        }
        setError('');

        const signature = sigPad.current.getTrimmedCanvas().toDataURL('image/png');

        try {
            await addDoc(collection(db, `users/${user.uid}/signedWaivers`), {
                userId: user.uid,
                userName: user.displayName,
                waiverId: currentWaiver.id,
                waiverTitle: currentWaiver.title,
                classId: classToEnroll.id,
                className: classToEnroll.name,
                signature,
                signedAt: serverTimestamp(),
            });

            if (currentWaiverIndex < waivers.length - 1) {
                setCurrentWaiverIndex(currentWaiverIndex + 1);
                clearSignature();
            } else {
                onSigned();
            }
        } catch (err) {
            console.error("Error saving signature: ", err);
            setError("Could not save signature. Please try again.");
        }
    };

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-800 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-2xl leading-6 font-bold text-gray-900" id="modal-title">
                                    {currentWaiver.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Please read and sign waiver {currentWaiverIndex + 1} of {waivers.length} to continue.
                                </p>
                                <div className="mt-4 prose prose-sm max-w-none h-64 overflow-y-auto border p-4 rounded-md bg-gray-50"
                                     dangerouslySetInnerHTML={{ __html: currentWaiver.content.replace(/\n/g, '<br />') }}>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Please sign below:</label>
                                    <div className="border border-gray-300 rounded-md bg-white">
                                        <SignatureCanvas
                                            ref={sigPad}
                                            penColor='black'
                                            canvasProps={{ className: 'w-full h-40 rounded-md' }}
                                        />
                                    </div>
                                    <button onClick={clearSignature} className="text-sm text-blue-600 hover:text-blue-800 mt-1">
                                        Clear Signature
                                    </button>
                                </div>
                                {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSign}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {currentWaiverIndex < waivers.length - 1 ? 'Sign and Next' : 'Sign and Complete Enrollment'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaiverSigningModal;
