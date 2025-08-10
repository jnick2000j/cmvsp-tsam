import React, { useState, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { PATROL_ROLES, PATROL_LEADER_ROLES } from '../constants';

const ALL_PATROL_ROLES = [...new Set([...PATROL_ROLES, ...PATROL_LEADER_ROLES])];

const CreateIndividualShift = ({ allUsers, patrols }) => {
    const [shiftData, setShiftData] = useState({
        date: '',
        startTime: '',
        stopTime: '',
        patrolId: '',
        roles: [{ name: '', target: 1 }],
    });

    const [assignments, setAssignments] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');

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

    // CORRECTED: User filtering no longer depends on the selected patrol.
    const eligibleUsers = useMemo(() => {
        if (!selectedRole) return [];
        return allUsers.filter(user => user.ability === selectedRole);
    }, [selectedRole, allUsers]);

    const handleAddAssignment = (userId) => {
        if (!userId || assignments.some(a => a.userId === userId)) return;
        const user = allUsers.find(u => u.id === userId);
        setAssignments([...assignments, { userId: user.id, name: `${user.firstName} ${user.lastName}`, role: selectedRole }]);
    };

    const handleRemoveAssignment = (userId) => {
        setAssignments(assignments.filter(a => a.userId !== userId));
    };
    
    const handleSaveShift = async () => {
        if (!shiftData.date || !shiftData.patrolId || !shiftData.startTime || !shiftData.stopTime) {
            alert("Date, Patrol, Start Time, and Stop Time are required.");
            return;
        }

        const shiftId = `${shiftData.patrolId}-${shiftData.date}`;
        const shiftRef = doc(db, 'shifts', shiftId);

        try {
            await setDoc(shiftRef, {
                ...shiftData,
                assignments: assignments,
                date: new Date(shiftData.date),
            }, { merge: true });

            alert("Shift saved successfully!");
            setShiftData({
                date: '',
                startTime: '',
                stopTime: '',
                patrolId: '',
                roles: [{ name: '', target: 1 }],
            });
            setAssignments([]);
            setSelectedRole('');
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input type="time" name="startTime" value={shiftData.startTime} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Stop Time</label>
                        <input type="time" name="stopTime" value={shiftData.stopTime} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Roles & Staffing Targets</h3>
                    {shiftData.roles.map((role, index) => (
                        <div key={index} className="flex items-center space-x-2 mt-2">
                            <select 
                                value={role.name} 
                                onChange={e => handleRoleChange(index, 'name', e.target.value)} 
                                className="p-2 border rounded-md flex-grow"
                            >
                                <option value="">Select a Role...</option>
                                {ALL_PATROL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <input type="number" min="1" value={role.target} onChange={e => handleRoleChange(index, 'target', parseInt(e.target.value, 10))} placeholder="Target #" className="w-24 p-2 border rounded-md" />
                            <button type="button" onClick={() => removeRole(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    <button onClick={addRole} className="mt-2 flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"><PlusCircle size={16} /><span>Add Role</span></button>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Specific Staff</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div>
                            <label htmlFor="role-assign" className="block text-sm font-medium text-gray-700">Role</label>
                            <select id="role-assign" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="">Select a Role to Assign</option>
                                {ALL_PATROL_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="user-assign" className="block text-sm font-medium text-gray-700">User</label>
                            <select id="user-assign" onChange={e => handleAddAssignment(e.target.value)} disabled={!selectedRole} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value="">
                                <option value="">Select a User...</option>
                                {eligibleUsers.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
                            </select>
                        </div>
                    </div>
                     {assignments.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium text-gray-700">Assigned:</h4>
                            <ul className="mt-2 space-y-2">
                                {assignments.map(a => (
                                    <li key={a.userId} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                        <span>{a.name} ({a.role})</span>
                                        <button type="button" onClick={() => handleRemoveAssignment(a.userId)} className="text-red-600 hover:text-red-800">Remove</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t pt-6">
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
