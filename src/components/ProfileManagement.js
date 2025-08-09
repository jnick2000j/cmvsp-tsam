// src/components/ProfileManagement.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { User, Shield, Briefcase, Key } from 'lucide-react';

const ProfileManagement = ({ user }) => {
    const [formData, setFormData] = useState({});
    const [newPin, setNewPin] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                zip: user.zip || '',
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePasswordReset = async () => {
        setMessage('');
        setError('');
        try {
            await sendPasswordResetEmail(auth, user.email);
            setMessage('A password reset link has been sent to your email address.');
        } catch (err) {
            setError('Failed to send password reset email. Please try again.');
            console.error(err);
        }
    };
    
    const handlePinUpdate = async () => {
        setMessage('');
        setError('');

        if (!newPin || newPin.length < 4 || !/^\d+$/.test(newPin)) {
            setError("New Time Clock PIN must be at least 4 digits and contain only numbers.");
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { timeClockPin: newPin });
            setMessage('Your Time Clock PIN has been updated successfully.');
            setNewPin(''); // Clear the PIN field after successful submission
        } catch (err) {
            setError('Failed to update PIN. Please try again.');
            console.error(err);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
            });
            setMessage('Your profile has been updated successfully.');
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error(err);
        }
    };
    
    if (!user) return null;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Read-only Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gray-100 p-3 rounded-full">
                                <User className="h-8 w-8 text-gray-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{user.firstName} {user.lastName}</h2>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">Roles & Assignments</h3>
                            <ul className="text-sm text-gray-700 space-y-2">
                                <li className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-gray-400"/><strong>Training Role:</strong><span className="ml-2">{user.role}</span></li>
                                <li className="flex items-center"><Shield className="h-4 w-4 mr-2 text-gray-400"/><strong>Patrol Ability:</strong><span className="ml-2">{user.ability || 'N/A'}</span></li>
                                <li className="flex items-center"><Shield className="h-4 w-4 mr-2 text-gray-400"/><strong>Patrol Assignment:</strong><span className="ml-2">{user.patrolAssignment || 'N/A'}</span></li>
                            </ul>
                        </div>
                         {user.primaryAgency && (
                            <div className="pt-4 border-t">
                                <h3 className="font-bold text-gray-800 mb-2">Affiliation</h3>
                                <p className="text-sm text-gray-700">{user.primaryAgency}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Editable Form */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    {message && <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm mb-6">{message}</p>}
                    {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm mb-6">{error}</p>}
                    
                     <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div><label className="block text-sm font-medium text-gray-700">First Name</label><input name="firstName" value={formData.firstName} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Last Name</label><input name="lastName" value={formData.lastName} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            </div>
                            <div className="mt-4"><label className="block text-sm font-medium text-gray-700">Mobile Phone</label><input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold text-gray-800">Mailing Address</h3>
                             <div className="mt-4"><label className="block text-sm font-medium text-gray-700">Street Address</label><input name="address" value={formData.address} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div><label className="block text-sm font-medium text-gray-700">City</label><input name="city" value={formData.city} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">State</label><input name="state" value={formData.state} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" maxLength="2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Zip Code</label><input name="zip" value={formData.zip} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t">
                            <button type="submit" className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover">
                                Update Profile
                            </button>
                        </div>
                    </form>

                     <div className="pt-6 border-t mt-6">
                        <h3 className="text-lg font-semibold text-gray-800">Security</h3>
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">New Time Clock PIN</label>
                            <div className="flex items-center space-x-4 mt-1">
                                <input name="timeClockPin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" placeholder="Enter a new 4+ digit PIN"/>
                                <button type="button" onClick={handlePinUpdate} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover whitespace-nowrap">
                                    Update PIN
                                </button>
                            </div>
                        </div>
                        <div className="mt-4">
                            <button type="button" onClick={handlePasswordReset} className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover">
                                <Key className="h-4 w-4 mr-2" /> Send Password Reset Email
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfileManagement;
