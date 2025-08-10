import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { PlusCircle, Trash2, Save } from 'lucide-react';

const CreateIndividualShift = ({ allUsers, patrols }) => {
    const [shiftData, setShiftData] = useState({
        date: '',
        patrolId: '',
        roles: [{ name: '', target: 1 }],
        assignments: {}
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShiftData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (index, field, value) => {
        const newRoles = [...shiftData.roles];
        newRoles[index][field] = value;
        setShiftData(prev => ({ ...prev, roles: newRoles }));
    };

    const addRole = () => {
        setShiftData(prev => ({
            ...prev,
            roles: [...(prev.roles || []), { name: '', target: 1 }]
        }));
    };

    const removeRole = (index) => {
        const newRoles = shiftData.roles.filter((_, i) => i !== index);
        setShiftData(prev => ({ ...prev, roles: newRoles }));
    };
    
    const handleSaveShift = async () => {
        if (!shiftData.date || !shiftData.patrolId) {
            alert("Date and Patrol are required to create a shift.");
            return;
        }

        // Create a unique, predictable ID for the shift
        const shiftId = `${shiftData.patrolId}-${shiftData.date}`;
        const shiftRef = doc(db, 'shifts', shiftId);

        try {
            // Use setDoc with merge: true to create or overwrite.
            await setDoc(shiftRef, {
                ...shiftData,
                date: new Date(shiftData.date), // Store as a Firestore timestamp
            }, { merge: true });

            alert("Shift saved successfully!");
            // Optionally reset the form
            setShiftData({
                date: '',
                patrolId: '',
                roles: [{ name: '', target: 1 }],
                assignments: {}
            });
        } catch (error) {
            console.error("Error saving shift: ", error);
            alert("Failed to save shift. See console for details.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Create a Single Shift</h2>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Shift Date</label>
                        <input type="date" name="date" value={shiftData.date} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Patrol</label>
                        <select name="patrolId" value={shiftData.patrolId} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                            <option value="">-- Select a Patrol --</option>
                            {patrols.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Roles & Staffing</h3>
                    {shiftData.roles.map((role, index) => (
                        <div key={index} className="flex items-center space-x-2 mt-2">
                            <input value={role.name} onChange={e => handleRoleChange(index, 'name', e.target.value)} placeholder="Role Name (e.g., Team Lead)" className="p-2 border rounded-md flex-grow" />
                            <input type="number" min="1" value={role.target} onChange={e => handleRoleChange(index, 'target', parseInt(e.target.value, 10))} placeholder="Target #" className="w-24 p-2 border rounded-md" />
                            <button type="button" onClick={() => removeRole(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    <button onClick={addRole} className="mt-2 flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"><PlusCircle size={16} /><span>Add Role</span></button>
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSaveShift} className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700">
                        <Save size={18} />
                        <span>Save Shift</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateIndividualShift;