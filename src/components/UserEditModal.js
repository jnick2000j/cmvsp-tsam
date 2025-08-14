// src/components/UserEditModal.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES, PATROLS, PATROL_LEADER_ROLES, PATROL_ROLES, NSP_PATROLS } from '../constants';

const UserEditModal = ({ isOpen, onClose, userToEdit, onSave }) => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    
    const [selectedAgency, setSelectedAgency] = useState('');
    const [isOtherAgency, setIsOtherAgency] = useState(false);

    useEffect(() => {
        if (userToEdit) {
            const initialData = { ...userToEdit };
            const agency = initialData.primaryAgency || '';
            
            if (!agency) {
                // Default to Crystal Mountain Volunteer if no agency is set
                setSelectedAgency('Crystal Mountain - Volunteer Patrol');
                setIsOtherAgency(false);
                setFormData({
                    ...initialData,
                    primaryAgency: 'Crystal Mountain - Volunteer Patrol',
                    isAffiliated: true,
                });
            } else if (NSP_PATROLS.includes(agency)) {
                setSelectedAgency(agency);
                setIsOtherAgency(false);
                setFormData(initialData);
            } else {
                setSelectedAgency('Other');
                setIsOtherAgency(true);
                setFormData(initialData);
            }
        }
    }, [userToEdit]);

    if (!isOpen || !userToEdit) return null;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleAgencyChange = (e) => {
        const value = e.target.value;
        setSelectedAgency(value);

        if (value === 'Other') {
            setIsOtherAgency(true);
            setFormData({ ...formData, primaryAgency: '' });
        } else if (value === 'Not Affiliated') {
            setIsOtherAgency(false);
            setFormData({ ...formData, primaryAgency: '', isAffiliated: false, nspId: '' });
        } else {
            setIsOtherAgency(false);
            const isCmsp = value.includes('Crystal Mountain');
            setFormData({ ...formData, primaryAgency: value, isAffiliated: isCmsp });
        }
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
            
            if (selectedAgency === 'Not Affiliated') {
                dataToSave.primaryAgency = '';
                dataToSave.isAffiliated = false;
                dataToSave.nspId = '';
            } else if (selectedAgency === 'Other') {
                dataToSave.isAffiliated = false;
            } else {
                dataToSave.primaryAgency = selectedAgency;
                dataToSave.isAffiliated = selectedAgency.includes('Crystal Mountain');
            }

            delete dataToSave.id; 
            delete dataToSave.uid;
            
            const userRef = doc(db, "users", userToEdit.id);
            await updateDoc(userRef, dataToSave);
            
            onSave();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save user data.');
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">Edit User Profile</h2></div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-4">
                        {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">First Name</label><input name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Last Name</label><input name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        </div>
                        
                        <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" name="email" value={formData.email || ''} readOnly className="mt-1 w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" /></div>

                        <div><label className="block text-sm font-medium text-gray-700">Phone</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Street Address</label><input name="address" value={formData.address || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">City</label><input name="city" value={formData.city || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">State</label><input name="state" value={formData.state || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Zip Code</label><input name="zip" value={formData.zip || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        </div>
                        
                        <div className="border-t pt-4 space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Patrol Assignment</label>
                                    <select name="patrolAssignment" value={formData.patrolAssignment || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="">-- Select Patrol --</option>
                                        {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Patrol Ability / Role</label>
                                    <select name="ability" value={formData.ability || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="">-- Select Ability --</option>
                                        <optgroup label="Leadership">
                                            {PATROL_LEADER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                        </optgroup>
                                        <optgroup label="Patrollers & Support">
                                            {PATROL_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Time Clock PIN</label>
                                <input type="password" name="timeClockPin" value={formData.timeClockPin || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" placeholder="4+ digits"/>
                            </div>
                        </div>

                         <div className="border-t pt-4 space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Affiliation</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select value={selectedAgency} onChange={handleAgencyChange} className="w-full border-gray-300 rounded-md shadow-sm">
                                    <option value="Not Affiliated">Not Affiliated</option>
                                    <optgroup label="Host Patrol">
                                        {NSP_PATROLS.slice(0, 2).map(p => <option key={p} value={p}>{p}</option>)}
                                    </optgroup>
                                    <optgroup label="Other Patrols">
                                        {NSP_PATROLS.slice(2).map(p => <option key={p} value={p}>{p}</option>)}
                                    </optgroup>
                                    <option value="Other">Other (Please Specify)</option>
                                </select>
                                
                                {selectedAgency !== 'Not Affiliated' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">National Ski Patrol ID #</label>
                                        <input name="nspId" value={formData.nspId || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                )}
                            </div>
                            {isOtherAgency && (
                                 <div className="mt-4">
                                     <label className="block text-sm font-medium text-gray-700">Specify Other Agency Name</label>
                                     <input name="primaryAgency" value={formData.primaryAgency || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                 </div>
                             )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Training Role</label>
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
                                <div className="mt-2 space-y-2">
                                    <label className="flex items-center">
                                        <input type="checkbox" name="isAdmin" checked={formData.isAdmin || false} onChange={handleInputChange} className="rounded text-indigo-600" />
                                        <span className="ml-2">Administrator</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" name="allowScheduling" checked={formData.allowScheduling || false} onChange={handleInputChange} className="rounded text-indigo-600" />
                                        <span className="ml-2">Allow Scheduling System Access</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;