// src/components/WaiverManagement.js
import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const WaiverManagement = ({ waivers, setConfirmAction }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingWaiver, setEditingWaiver] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [error, setError] = useState('');

    const handleEdit = (waiver) => {
        setEditingWaiver(waiver);
        setFormData(waiver);
        setIsEditing(true);
    };

    const handleNew = () => {
        setEditingWaiver(null);
        setFormData({ title: '', content: '' });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            setError("Title and content are required.");
            return;
        }

        try {
            if (editingWaiver) {
                await updateDoc(doc(db, `artifacts/${appId}/public/data/waivers`, editingWaiver.id), formData);
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/waivers`), formData);
            }
            setIsEditing(false);
            setEditingWaiver(null);
            setFormData({ title: '', content: '' });
        } catch (e) {
            console.error("Error saving waiver:", e);
            setError("Failed to save waiver.");
        }
    };

    const handleDeleteClick = (waiverId) => {
        setConfirmAction({
            title: "Delete Waiver",
            message: "Are you sure you want to delete this waiver? This action cannot be undone.",
            action: async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/waivers`, waiverId));
                } catch (e) {
                    console.error("Error deleting waiver:", e);
                    setError("Failed to delete waiver.");
                }
            }
        });
    };

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Waiver Management</h2>
                    <p className="mt-1 text-sm text-gray-500">Create, edit, and manage waivers assigned to classes.</p>
                </div>
                {!isEditing && (
                    <div className="mt-4 sm:mt-0">
                        <button onClick={handleNew} className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary-hover">
                            <PlusCircle className="h-5 w-5 mr-2" /> Add New Waiver
                        </button>
                    </div>
                )}
            </div>
            {isEditing ? (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <form onSubmit={handleSave}>
                        <div className="space-y-4">
                            {error && <p className="text-red-500">{error}</p>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Waiver Title</label>
                                <input name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Waiver Content</label>
                                <textarea name="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows="10" className="mt-1 w-full border-gray-300 rounded-md shadow-sm"></textarea>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover">Save Waiver</button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="mt-6 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
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
                                                    <button onClick={() => handleEdit(waiver)} className="text-accent hover:text-accent-hover mr-4">
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(waiver.id)} className="text-red-600 hover:text-red-900">
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaiverManagement;
