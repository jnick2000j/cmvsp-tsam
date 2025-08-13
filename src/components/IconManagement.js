// src/components/IconManagement.js
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';
import { appId } from '../constants';
import { UploadCloud, Trash2, CheckCircle, Copy } from 'lucide-react';
import Icon from './Icon';

const IconManagement = ({ icons, setIcons }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [newIconName, setNewIconName] = useState('');
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('Please select a valid image file (PNG, JPG, SVG, etc.).');
        }
    };

    const handleUpload = async () => {
        if (!file || !newIconName.trim()) {
            setError('Please provide a name and select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError('');
        setMessage('');

        try {
            // MODIFIED: Save to a dedicated 'icons' folder
            const storageRef = ref(storage, `artifacts/${appId}/public/icons/${newIconName.trim()}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const newIcon = { name: newIconName.trim(), url: downloadURL };
            await addDoc(collection(db, `artifacts/${appId}/public/data/icons`), newIcon);
            setIcons(prev => [...prev, newIcon]);

            setNewIconName('');
            setFile(null);
            setMessage('Icon uploaded successfully!');
        } catch (err) {
            setError('Failed to upload icon.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteIcon = async (iconId) => {
        if (window.confirm("Are you sure you want to delete this icon?")) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/icons`, iconId));
                setIcons(prev => prev.filter(icon => icon.id !== iconId));
                setMessage('Icon deleted successfully.');
            } catch (err) {
                setError('Failed to delete icon.');
                console.error(err);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900">Icon Management</h2>
            <p className="mt-1 text-sm text-gray-500">Upload and manage icons for classes and stations, separate from site branding.</p>
            {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            {message && <p className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</p>}
            
            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800">Upload New Icon</h3>
                <div className="mt-2 flex flex-col sm:flex-row items-center gap-4">
                    <input
                        type="text"
                        value={newIconName}
                        onChange={(e) => setNewIconName(e.target.value)}
                        placeholder="Enter a name for the icon"
                        className="flex-grow w-full sm:w-auto border-gray-300 rounded-md shadow-sm"
                    />
                    <input type="file" id="iconUpload" className="hidden" onChange={handleFileChange} />
                    <label htmlFor="iconUpload" className="w-full sm:w-auto text-center cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 whitespace-nowrap">
                        {file ? file.name : 'Choose File'}
                    </label>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !file || !newIconName}
                        className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover disabled:bg-indigo-300"
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>

            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800">Icon Library</h3>
                <ul className="mt-4 space-y-3">
                    {(icons || []).map((icon) => (
                        <li key={icon.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-4">
                                <img src={icon.url} alt={icon.name} className="h-10 w-10 object-contain" />
                                <span className="font-medium">{icon.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleDeleteIcon(icon.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
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

export default IconManagement;