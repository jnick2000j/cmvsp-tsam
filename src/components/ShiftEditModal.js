import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Trash2, Save, X } from 'lucide-react';
import { PATROL_ROLES, PATROL_LEADER_ROLES } from '../constants';

const ALL_PATROL_ROLES = [...new Set([...PATROL_ROLES, ...PATROL_LEADER_ROLES])];

const ShiftEditModal = ({ isOpen, onClose, shiftToEdit, onSave, allUsers, patrols }) => {
    const [shiftData, setShiftData] = useState({});
    const [assignments, setAssignments] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');

    useEffect(() => {
        if (shiftToEdit) {
            // Format date for the input field
            const date = new Date(shiftToEdit.date);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            
            setShiftData({ ...shiftToEdit, date: `${yyyy}-${mm}-${dd}` });
            setAssignments(shiftToEdit.assignments || []);
        }
    }, [shiftToEdit]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShiftData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (index, field, value) => {
        const newRoles = [...shiftData.roles];
        newRoles[index][field] = value;
        setShiftData(prev => ({ ...prev, roles: newRoles }));
    };

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

    const handleSave = () => {
        onSave({
            ...shiftData,
            date: new Date(shiftData.date), // Convert back to Date object before saving
            assignments: assignments
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Shift</h2>
                    <button onClick={onClose}><X className="h-6 w-6" /></button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Shift Date</label>
                            <input type="date" name="date" value={shiftData.date || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Patrol</label>
                            <select name="patrolId" value={shiftData.patrolId || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">-- Select a Patrol --</option>
                                {patrols.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Time</label>
                            <input type="time" name="startTime" value={shiftData.startTime || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stop Time</label>
                            <input type="time" name="stopTime" value={shiftData.stopTime || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Specific Staff</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <div>
                                <label htmlFor="role-assign-edit" className="block text-sm font-medium text-gray-700">Role</label>
                                <select id="role-assign-edit" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    <option value="">Select a Role to Assign</option>
                                    {ALL_PATROL_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="user-assign-edit" className="block text-sm font-medium text-gray-700">User</label>
                                <select id="user-assign-edit" onChange={e => handleAddAssignment(e.target.value)} disabled={!selectedRole} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value="">
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
                        <button onClick={onClose} type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-accent text-white font-semibold rounded-md shadow-sm hover:bg-accent-hover flex items-center">
                            <Save size={18} className="mr-2" />
                            Update Shift
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftEditModal;
