// src/components/Branding.js
import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';

const Branding = ({ branding }) => {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [titles, setTitles] = useState({ mainTitle: '', loginTitle: '' });
    const [colors, setColors] = useState({
        primary: '#052D39',
        primaryHover: '#b13710',
        accent: '#052D39',
        accentHover: '#b13710',
    });

    useEffect(() => {
        if (branding) {
            setTitles({
                mainTitle: branding.mainTitle || 'Training & Scheduling Attendance Management',
                loginTitle: branding.loginTitle || 'Welcome',
            });
            setColors({
                primary: branding.primary || '#052D39',
                primaryHover: branding.primaryHover || '#b13710',
                accent: branding.accent || '#052D39',
                accentHover: branding.accentHover || '#b13710',
            });
        }
    }, [branding]);

    const handleTitleChange = (e) => {
        const { name, value } = e.target;
        setTitles(prev => ({ ...prev, [name]: value }));
    };

    const handleColorChange = (e) => {
        const { name, value } = e.target;
        setColors(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveBranding = async () => {
        setError('');
        setMessage('');
        try {
            const brandingRef = doc(db, `artifacts/${appId}/public/data/branding`, 'settings');
            await setDoc(brandingRef, { ...titles, ...colors }, { merge: true });
            setMessage('Branding settings updated successfully!');
        } catch (err) {
            setError('Failed to save branding settings.');
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900">Branding Settings</h2>
            <p className="mt-1 text-sm text-gray-500">Manage the titles and color scheme for the application.</p>
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
                            <label htmlFor="primary" className="block text-sm font-medium text-gray-700">Primary Button</label>
                            <input type="color" name="primary" id="primary" value={colors.primary} onChange={handleColorChange} className="mt-1 h-10 w-full border-gray-300 rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="primaryHover" className="block text-sm font-medium text-gray-700">Primary Hover</label>
                            <input type="color" name="primaryHover" id="primaryHover" value={colors.primaryHover} onChange={handleColorChange} className="mt-1 h-10 w-full border-gray-300 rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="accent" className="block text-sm font-medium text-gray-700">Accent/Link</label>
                            <input type="color" name="accent" id="accent" value={colors.accent} onChange={handleColorChange} className="mt-1 h-10 w-full border-gray-300 rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="accentHover" className="block text-sm font-medium text-gray-700">Accent Hover</label>
                            <input type="color" name="accentHover" id="accentHover" value={colors.accentHover} onChange={handleColorChange} className="mt-1 h-10 w-full border-gray-300 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSaveBranding} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover">Save Branding Settings</button>
            </div>
        </div>
    );
};

export default Branding;
