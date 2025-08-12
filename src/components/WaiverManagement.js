import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../firebaseConfig';
import WaiverTemplateCreator from './WaiverTemplateCreator';

const WaiverManagement = () => {
    const [waiverTemplates, setWaiverTemplates] = useState([]);
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);

    useEffect(() => {
        const templatesRef = collection(db, `artifacts/${appId}/public/data/waiverTemplates`);
        const unsubscribe = onSnapshot(templatesRef, (snapshot) => {
            const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWaiverTemplates(templates);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Waiver Management</h2>
                <button
                    onClick={() => setIsCreatorOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Create New Template
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {waiverTemplates.map(template => (
                            <tr key={template.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{template.title}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCreatorOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                        <WaiverTemplateCreator />
                        <button
                            onClick={() => setIsCreatorOpen(false)}
                            className="mt-4 w-full bg-gray-300 px-4 py-2 rounded-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaiverManagement;