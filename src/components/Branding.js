// src/components/Branding.js
import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';
import { appId } from '../constants';

const Branding = ({ branding }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [titles, setTitles] = useState({ mainTitle: '', loginTitle: '' });
    const [colors, setColors] = useState({
        primaryColor: '#052D39',
        accentColor: '#052D39',
    });
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        if (branding) {
            setTitles({
                mainTitle: branding.appName || 'Training & Scheduling Attendance Management',
                loginTitle: branding.loginTitle || 'Welcome',
            });
            setColors({
                primaryColor: branding.primaryColor || '#052D39',
                accentColor: branding.accentColor || '#052D39',
            });
            setLogoUrl(branding.logoUrl || '');
        }
    }, [branding]);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setError('');
        setMessage('');
        const storageRef = ref(storage, `branding/${appId}/logo`);
        try {
            const uploadTask = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadTask.ref);
            setLogoUrl(downloadURL);
            
            // Immediately save the new logo URL
            const brandingRef = doc(db, `artifacts/${appId}/public/data/branding`, 'settings');
            await setDoc(brandingRef, { logoUrl: downloadURL }, { merge: true });

            setMessage('Logo uploaded successfully!');
        } catch (err) {
            setError('Failed to upload logo.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleTitleChange = (e) => {
        const { name, value } = e.target;
        setTitles(prev => ({ ...prev, [name]: value }));
    };

    const handleColorChange = (e) => {
        const { name, value } = e.target;
        setColors(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveBranding = async () => {
        try {
            const brandingRef = doc(db, `artifacts/${appId}/public/data/branding`, 'settings');
            await setDoc(brandingRef, { 
                appName: titles.mainTitle,
                loginTitle: titles.loginTitle,
                primaryColor: colors.primaryColor,
                accentColor: colors.accentColor,
                logoUrl: logoUrl 
            }, { merge: true });
            setMessage('Branding settings updated successfully!');
        } catch (err) {
            setError('Failed to save branding settings.');
            console.error(err);
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900">Branding & Logos</h2>
                <p className="mt-1 text-sm text-gray-500">Upload and manage logos and titles for the application.</p>
                {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                {message && <p className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</p>}
                
                <div className="mt-6 border-t pt-6 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800">Application Titles</h3>
                        <div>
                            <label htmlFor="mainTitle" className="block text-sm font-medium text-gray-700">Main Application Title</label>
                            <input type="text" name="mainTitle" id="mainTitle" value={titles.mainTitle} onChange={handleTitleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="loginTitle" className="block text-sm font-medium text-gray-700">Login Screen Title</label>
                            <input type="text" name="loginTitle" id="loginTitle" value={titles.loginTitle} onChange={handleTitleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800">Color Scheme</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">Primary</label>
                                <input type="color" name="primaryColor" id="primaryColor" value={colors.primaryColor} onChange={handleColorChange} className="mt-1 h-10 w-full border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700">Accent/Link</label>
                                <input type="color" name="accentColor" id="accentColor" value={colors.accentColor} onChange={handleColorChange} className="mt-1 h-10 w-full border-gray-300 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-800">Site Logo</h3>
                    <div className="mt-2 flex items-center space-x-4">
                        {logoUrl && <img src={logoUrl} alt="Current Logo" className="h-16 w-auto rounded-md" />}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>
                    {isUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveBranding} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover">Save Branding Settings</button>
                </div>
            </div>
        </div>
    );
};

export default Branding;
