// src/components/UserEditModal.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES } from '../constants';

const UserEditModal = ({ isOpen, onClose, userToEdit, onSave }) => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        if (userToEdit) {
            setFormData({ ...userToEdit, isAffiliated: userToEdit.isAffiliated !== false });
        } else {
            setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zip: '', role: 'Student', isAdmin: false, assignments: {}, nspId: '', isAffiliated: true, primaryAgency: '' });
        }
    }, [userToEdit]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError('First name, last name, and email are required.');
            return;
        }

        try {
            const dataToSave = { ...formData };
            if (dataToSave.isAffiliated) {
                dataToSave.primaryAgency = '';
            }
            delete dataToSave.id; 
            delete dataToSave.uid;
            
            const userRef = doc(db, "users", userToEdit.id);
            await updateDoc(userRef, dataToSave);

            onSave();
            onClose();
        } catch (err) {
            setError('Failed to save user data.');
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">{userToEdit ? 'Edit User' : 'Add User'}</h2></div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">First Name</label><input name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Last Name</label><input name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select name="role" value={formData.role || 'Student'} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                    <option value="Student">Student</option>
                                    <optgroup label="Instructors">
                                        {INSTRUCTOR_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                    </optgroup>
                                    <optgroup label="Support & Patrollers">
                                        {SUPPORT_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                                <label className="mt-2 flex items-center">
                                    <input type="checkbox" name="isAdmin" checked={formData.isAdmin || false} onChange={handleInputChange} className="rounded text-primary" />
                                    <span className="ml-2">Administrator</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;
