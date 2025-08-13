// src/components/Branding.js
import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';
import { appId } from '../constants';
import { UploadCloud, Trash2 } from 'lucide-react';

const Branding = ({ branding }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [newLogoName, setNewLogoName] = useState('');
    const [file, setFile] = useState(null);
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

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('Please select a valid image file (PNG, JPG, etc.).');
        }
    };

    const handleUpload = async () => {
        if (!file || !newLogoName.trim()) {
            setError('Please provide a name and select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError('');
        setMessage('');

        try {
            const storageRef = ref(storage, `branding/${appId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const brandingRef = doc(db, `artifacts/${appId}/public/data/branding`, 'settings');
            const newLogo = { name: newLogoName.trim(), url: downloadURL };

            await setDoc(brandingRef, { logos: arrayUnion(newLogo) }, { merge: true });

            setNewLogoName('');
            setFile(null);
            document.getElementById('logoUpload').value = ''; // Clear the file input
            setMessage('Logo uploaded successfully!');
        } catch (err) {
            setError('Failed to upload logo. Check your Firebase rules and internet connection.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteLogo = async (logoToDelete) => {
        try {
            const brandingRef = doc(db, `artifacts/${appId}/public/data/branding`, 'settings');
            await updateDoc(brandingRef, {
                logos: arrayRemove(logoToDelete)
            });
            setMessage('Logo deleted successfully.');
        } catch (err) {
            setError('Failed to delete logo.');
            console.error(err);
        }
    };

    const handleSetSiteBranding = async (logoUrl) => {
        try {
            const brandingRef = doc(db, `artifacts/${appId}/public/data/branding`, 'settings');
            await setDoc(brandingRef, { siteLogo: logoUrl }, { merge: true });
            setMessage('Site logo updated successfully.');
        } catch (err) {
            setError('Failed to set site logo.');
            console.error(err);
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
            await setDoc(brandingRef, { ...titles, ...colors }, { merge: true });
            setMessage('Branding settings updated successfully!');
        } catch (err)
        {
            setError('Failed to save branding settings.');
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
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

            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800">Site Branding Logo</h3>
                <div className="mt-2 p-4 border rounded-lg flex items-center justify-center bg-gray-50 h-24 max-w-sm mx-auto">
                    {/* FIXED: Used optional chaining (?.) to prevent crash */}
                    {branding?.siteLogo ? <img src={branding.siteLogo} alt="Site Logo" className="max-h-full" /> : <p className="text-gray-500">No site logo selected.</p>}
                </div>
            </div>

            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800">Upload New Logo</h3>
                <div className="mt-2 flex flex-col sm:flex-row items-center gap-4">
                    <input
                        type="text"
                        value={newLogoName}
                        onChange={(e) => setNewLogoName(e.target.value)}
                        placeholder="Enter a name for the logo"
                        className="flex-grow w-full sm:w-auto border-gray-300 rounded-md shadow-sm"
                    />
                    <input type="file" id="logoUpload" className="hidden" onChange={handleFileChange} />
                    <label htmlFor="logoUpload" className="w-full sm:w-auto text-center cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 whitespace-nowrap">
                        {file ? file.name : 'Choose File'}
                    </label>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !file || !newLogoName}
                        className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover disabled:bg-indigo-300"
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>

            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800">Image Library</h3>
                <ul className="mt-4 space-y-3">
                    {/* FIXED: Used optional chaining (?.) for safety and consistency */}
                    {(branding?.logos || []).map((logo, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-4">
                                <img src={logo.url} alt={logo.name} className="h-10 w-10 object-contain" />
                                <span className="font-medium">{logo.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleSetSiteBranding(logo.url)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200">Set as Site Logo</button>
                                <button onClick={() => handleDeleteLogo(logo)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Branding;