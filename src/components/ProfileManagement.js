// src/components/ProfileManagement.js
import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';

const ProfileManagement = ({ user }) => {
    const [formData, setFormData] = useState({ ...user });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const dataToSave = { ...formData };
            if (dataToSave.isAffiliated) {
                dataToSave.primaryAgency = '';
            }
            delete dataToSave.id;
            delete dataToSave.uid;
            
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, dataToSave);
            setMessage("Profile updated successfully!");
        } catch (err) {
            setError("Failed to update profile.");
            console.error(err);
        }
    };

    const handlePasswordReset = async () => {
        setError('');
        setMessage('');
        try {
            await sendPasswordResetEmail(auth, user.email);
            setMessage(`A password reset link has been sent to ${user.email}.`);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
                    {message && <p className="text-green-500 bg-green-50 p-3 rounded-lg text-sm">{message}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700">First Name</label><input name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Last Name</label><input name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" name="email" value={formData.email || ''} disabled className="mt-1 w-full border-gray-300 rounded-md shadow-sm bg-gray-100" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Phone</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Street Address</label><input name="address" value={formData.address || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700">City</label><input name="city" value={formData.city || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">State</label><input name="state" value={formData.state || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Zip Code</label><input name="zip" value={formData.zip || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                    </div>
                    <div className="border-t pt-6 space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700">National Ski Patrol ID #</label><input name="nspId" value={formData.nspId || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        <div className="flex items-center">
                            <input type="checkbox" name="isAffiliated" id="isAffiliatedProfile" checked={formData.isAffiliated} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="isAffiliatedProfile" className="ml-2 block text-sm text-gray-900">I am affiliated with Crystal Mountain Ski Patrol</label>
                        </div>
                        {!formData.isAffiliated && (
                            <div><label className="block text-sm font-medium text-gray-700">Primary Agency / Patrol</label><input name="primaryAgency" value={formData.primaryAgency || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        )}
                    </div>
                    <div className="flex justify-end pt-6 border-t">
                        <button type="submit" className="px-6 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900">Account Security</h3>
                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm text-gray-600">Request an email to reset your password.</p>
                        <button onClick={handlePasswordReset} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">Change Password</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileManagement;
