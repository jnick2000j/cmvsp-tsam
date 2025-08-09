// src/components/ShiftManagement.js
import React, { useState, useMemo } from 'react';
import { PATROLS, SHIFT_TYPES, PATROL_ROLES, PATROL_LEADER_ROLES } from '../constants';
import { PlusCircle, Save, XCircle, Edit, Trash2 } from 'lucide-react';

const ShiftManagement = ({ shifts, users, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    
    const leaders = useMemo(() => users.filter(u => PATROL_LEADER_ROLES.includes(u.ability)), [users]);
    const patrollers = useMemo(() => users.filter(u => PATROL_ROLES.includes(u.ability) || PATROL_LEADER_ROLES.includes(u.ability)), [users]);

    const handleSave = async (shiftData) => {
        await onSave(shiftData);
        setIsEditing(false);
        setEditingShift(null);
    };
    
    const handleNew = () => {
        setEditingShift({ 
            date: new Date().toISOString().split('T')[0], 
            type: SHIFT_TYPES[0], 
            patrol: PATROLS[0], 
            leaderId: '', 
            assistantLeaderId: '', 
            assignments: [] 
        });
        setIsEditing(true);
    };
    
    const handleEdit = (shift) => {
        setEditingShift(shift);
        setIsEditing(true);
    };

    const ShiftForm = ({ shift, onCancel }) => {
        const [formData, setFormData] = useState(shift);

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };
        
        const handleAssignmentChange = (role, userId) => {
            let newAssignments = [...formData.assignments];
            const existingIndex = newAssignments.findIndex(a => a.role === role);
            
            if (userId) { // If a user is selected
                if (existingIndex > -1) {
                    newAssignments[existingIndex].userId = userId;
                } else {
                    newAssignments.push({ role, userId });
                }
            } else { // If '-- Unassigned --' is selected
                newAssignments = newAssignments.filter(a => a.role !== role);
            }
            
            setFormData({...formData, assignments: newAssignments});
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-lg mt-4 border">
                <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit Shift' : 'Create New Shift'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/></div>
                    <div><label className="block text-sm font-medium text-gray-700">Shift Type</label><select name="type" value={formData.type} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">{SHIFT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700">Patrol</label><select name="patrol" value={formData.patrol} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">{PATROLS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700">Shift Leader</label><select name="leaderId" value={formData.leaderId} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"><option value="">-- Select Leader --</option>{leaders.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700">Assistant Leader</label><select name="assistantLeaderId" value={formData.assistantLeaderId} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"><option value="">-- Select Assistant --</option>{leaders.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}</select></div>
                </div>
                 <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold text-gray-800">Assignments</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-2">
                        {PATROL_ROLES.filter(r => r !== 'Guest Patroller').map(role => (
                            <div key={role}>
                                <label className="block text-sm font-medium text-gray-700">{role}</label>
                                 <select value={formData.assignments.find(a => a.role === role)?.userId || ''} onChange={(e) => handleAssignmentChange(role, e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-sm">
                                    <option value="">-- Unassigned --</option>
                                    {patrollers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onCancel} className="px-4 py-2 text-sm bg-gray-200 rounded-md flex items-center"><XCircle className="h-4 w-4 mr-1"/>Cancel</button>
                    <button onClick={() => handleSave(formData)} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover flex items-center"><Save className="h-4 w-4 mr-1"/>Save Shift</button>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
                    <p className="mt-1 text-sm text-gray-500">Create, edit, and manage patrol shifts and assignments.</p>
                </div>
                {!isEditing && (
                <div className="mt-4 sm:mt-0">
                    <button onClick={handleNew} className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary-hover">
                        <PlusCircle className="h-5 w-5 mr-2" /> Add New Shift
                    </button>
                </div>
                )}
            </div>

            {isEditing && <ShiftForm shift={editingShift} onCancel={() => setIsEditing(false)} />}
            
            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                             <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Patrol</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Leader</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {shifts.map(shift => (
                                        <tr key={shift.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{shift.date}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{shift.type}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{shift.patrol}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{users.find(u => u.id === shift.leaderId)?.lastName || 'N/A'}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button onClick={() => handleEdit(shift)} className="text-accent hover:text-accent-hover mr-4"><Edit className="h-5 w-5" /></button>
                                                <button onClick={() => onDelete(shift.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftManagement;