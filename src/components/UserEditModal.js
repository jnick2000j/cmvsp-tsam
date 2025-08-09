// src/components/UserEditModal.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth as mainAuth, firebaseConfig } from '../firebaseConfig'; // Import firebaseConfig
import { INSTRUCTOR_ROLES, SUPPORT_ROLES, PATROLS, PATROL_LEADER_ROLES, PATROL_ROLES } from '../constants';
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const UserEditModal = ({ isOpen, onClose, userToEdit, onSave }) => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        if (userToEdit) {
            setFormData({ ...userToEdit, isAffiliated: userToEdit.isAffiliated !== false });
        } else {
            setFormData({ 
                firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zip: '', 
                role: 'Student', isAdmin: false, assignments: {}, nspId: '', isAffiliated: true, primaryAgency: '', 
                password: '', confirmPassword: '', patrolAssignment: '', ability: '', timeClockPin: '' 
            });
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
            if (userToEdit) {
                const dataToSave = { ...formData };
                if (dataToSave.isAffiliated) {
                    dataToSave.primaryAgency = '';
                }
                delete dataToSave.id; 
                delete dataToSave.uid;
                const userRef = doc(db, "users", userToEdit.id);
                await updateDoc(userRef, dataToSave);
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match.");
                    return;
                }
                if (formData.password.length < 6) {
                    setError("Password must be at least 6 characters long.");
                    return;
                }
                if (formData.timeClockPin && (formData.timeClockPin.length < 4 || !/^\d+$/.test(formData.timeClockPin))) {
                    setError("Time Clock PIN must be at least 4 digits and contain only numbers.");
                    return;
                }


                const tempAppName = `temp-user-creation-${Date.now()}`;
                const tempApp = initializeApp(firebaseConfig, tempAppName);
                const tempAuth = getAuth(tempApp);

                const userCredential = await createUserWithEmailAndPassword(tempAuth, formData.email, formData.password);
                await sendEmailVerification(userCredential.user);

                const dataToSave = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                    role: formData.role,
                    isAdmin: formData.isAdmin,
                    nspId: formData.nspId,
                    isAffiliated: formData.isAffiliated,
                    primaryAgency: formData.isAffiliated ? '' : formData.primaryAgency,
                    patrolAssignment: formData.patrolAssignment,
                    ability: formData.ability,
                    timeClockPin: formData.timeClockPin,
                    assignments: {},
                    enrolledClasses: [],
                    completedClasses: {},
                    uid: userCredential.user.uid,
                    isApproved: !INSTRUCTOR_ROLES.includes(formData.role),
                };
                
                await setDoc(doc(db, "users", userCredential.user.uid), dataToSave);
            }

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
                <div className="p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">{userToEdit ? 'Edit User' : 'Add User'}</h2></div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-4">
                        {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">First Name</label><input name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Last Name</label><input name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        
                        {!userToEdit && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700">Password</label><input name="password" type="password" value={formData.password || ''} onChange={handleInputChange} placeholder="Min. 6 characters" required className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Confirm Password</label><input name="confirmPassword" type="password" value={formData.confirmPassword || ''} onChange={handleInputChange} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            </div>
                        )}

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
                              <div><label className="block text-sm font-medium text-gray-700">National Ski Patrol ID #</label><input name="nspId" value={formData.nspId || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div className="flex items-center">
                                <input type="checkbox" name="isAffiliated" id="isAffiliatedEdit" checked={formData.isAffiliated} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                <label htmlFor="isAffiliatedEdit" className="ml-2 block text-sm text-gray-900">Affiliated with Crystal Mountain Ski Patrol</label>
                            </div>
                            {!formData.isAffiliated && (
                                 <div><label className="block text-sm font-medium text-gray-700">Primary Agency / Patrol</label><input name="primaryAgency" value={formData.primaryAgency || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
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
                            <div><label className="block text-sm font-medium text-gray-700">Permissions</label><label className="mt-2 flex items-center"><input type="checkbox" name="isAdmin" checked={formData.isAdmin || false} onChange={handleInputChange} className="rounded text-indigo-600" /> <span className="ml-2">Administrator</span></label></div>
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