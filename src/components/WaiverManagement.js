import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import WaiverEditModal from './WaiverEditModal';
import ConfirmationModal from './ConfirmationModal';
import { WAIVERS } from '../constants';

const WaiverManagement = () => {
    const [waivers, setWaivers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWaiver, setSelectedWaiver] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [waiverToDelete, setWaiverToDelete] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, WAIVERS), (snapshot) => {
            const waiversData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWaivers(waiversData);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (waiver = null) => {
        setSelectedWaiver(waiver);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedWaiver(null);
    };

    const handleSaveWaiver = async (waiverData) => {
        if (selectedWaiver) {
            // Update existing waiver
            const waiverRef = doc(db, WAIVERS, selectedWaiver.id);
            await updateDoc(waiverRef, { ...waiverData, updatedAt: serverTimestamp() });
        } else {
            // Create new waiver
            await addDoc(collection(db, WAIVERS), { ...waiverData, createdAt: serverTimestamp() });
        }
        handleCloseModal();
    };

    const openConfirmModal = (waiver) => {
        setWaiverToDelete(waiver);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setWaiverToDelete(null);
        setIsConfirmModalOpen(false);
    };

    const handleDeleteWaiver = async () => {
        if (waiverToDelete) {
            await deleteDoc(doc(db, WAIVERS, waiverToDelete.id));
            closeConfirmModal();
        }
    };

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Waiver Management</h2>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        Create New Waiver
                    </button>
                </div>
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {waivers.length > 0 ? waivers.map(waiver => (
                                    <tr key={waiver.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{waiver.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenModal(waiver)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openConfirmModal(waiver)}
                                                className="text-red-600 hover:text-red-900 font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" className="text-center py-10 text-gray-500">No waivers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <WaiverEditModal
                    waiver={selectedWaiver}
                    onClose={handleCloseModal}
                    onSave={handleSaveWaiver}
                />
            )}
            {isConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={closeConfirmModal}
                    onConfirm={handleDeleteWaiver}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete the waiver "${waiverToDelete?.title}"? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

export default WaiverManagement;
