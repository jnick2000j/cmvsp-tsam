// src/components/WaiverTemplateCreator.js
import React, { useState } from 'react';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const WaiverTemplateCreator = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) {
            alert('Title and content are required.');
            return;
        }
        setIsSubmitting(true);
        const createWaiverTemplateFn = httpsCallable(functions, 'createWaiverTemplate');
        try {
            await createWaiverTemplateFn({ title, content });
            alert('Waiver template created successfully!');
            setTitle('');
            setContent('');
        } catch (error) {
            console.error('Error creating waiver template:', error);
            alert(`Error: ${error.message}`);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Create Waiver Template</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="waiver-title" className="block text-sm font-medium text-gray-700">Waiver Title</label>
                    <input type="text" id="waiver-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div className="mb-4">
                    <label htmlFor="waiver-content" className="block text-sm font-medium text-gray-700">Waiver Content (supports Markdown)</label>
                    <textarea id="waiver-content" value={content} onChange={(e) => setContent(e.target.value)} rows="10" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    {isSubmitting ? 'Creating...' : 'Create Template'}
                </button>
            </form>
        </div>
    );
};

export default WaiverTemplateCreator;