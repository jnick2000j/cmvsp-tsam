import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';
import { PlusCircle, Edit, Trash2, FileSignature } from 'lucide-react';

const WaiverManagement = ({ waivers, setConfirmAction }) => {
    const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
    const [editingWaiver, setEditingWaiver] = useState(null);

    const handleOpenWaiverModal = (waiver = null) => {
        setEditingWaiver(waiver);
        setIsWaiverModalOpen(true);
    };

    const handleCloseWaiverModal = () => {
        setEditingWaiver(null);
        setIsWaiverModalOpen(false);
    };

    const handleSaveWaiver = async (waiverData) => {
        try {
            if (editingWaiver) {
                const waiverRef = doc(db, `artifacts/${appId}/public/data/waivers`, editingWaiver.id);
                await updateDoc(waiverRef, waiverData);
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/waivers`), waiverData);
            }
            handleCloseWaiverModal();
        } catch (error) {
            console.error("Error saving waiver:", error);
        }
    };

    const handleDeleteWaiver = (waiverId, waiverTitle) => {
        setConfirmAction({
            title: "Delete Waiver",
            message: `Are you sure you want to delete the waiver "${waiverTitle}"? This action cannot be undone.`,
            action: async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/waivers`, waiverId));
                } catch (error) {
                    console.error("Error deleting waiver:", error);
                }
            }
        });
    };

    return (
        <>
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Waiver Management</h2>
                    <p className="mt-1 text-sm text-gray-500">Create and manage waiver templates for class enrollments.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button onClick={() => handleOpenWaiverModal()} className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-hover">
                        <PlusCircle className="h-5 w-5 mr-2" /> Add New Waiver
                    </button>
                </div>
            </div>

            <div className="mt-6 flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {waivers.map((waiver) => (
                                        <tr key={waiver.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{waiver.title}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button onClick={() => handleOpenWaiverModal(waiver)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit className="h-5 w-5" /></button>
                                                <button onClick={() => handleDeleteWaiver(waiver.id, waiver.title)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            {isWaiverModalOpen && <WaiverEditModal waiver={editingWaiver} onSave={handleSaveWaiver} onClose={handleCloseWaiverModal} />}
        </>
    );
};

const WaiverEditModal = ({ waiver, onSave, onClose }) => {
    const [title, setTitle] = useState(waiver?.title || '');
    const [content, setContent] = useState(waiver?.content || '');

    const handleSubmit = () => {
        if (title && content) {
            onSave({ title, content });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-medium">{waiver ? 'Edit Waiver' : 'Create Waiver'}</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Waiver Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Waiver Content</label>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="10" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded-md">Save</button>
                </div>
            </div>
        </div>
    );
};

export default WaiverManagement;