import React, { useState, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { PlusCircle, Trash2, Save, Calendar } from 'lucide-react';
import { PATROL_ROLES, PATROL_LEADER_ROLES, appId } from '../constants';

const ALL_PATROL_ROLES = [...new Set([...PATROL_ROLES, ...PATROL_LEADER_ROLES])];

// Recurrence Editor Sub-component
const RecurrenceEditor = ({ recurrence, setRecurrence }) => {
    const handleRecurrenceChange = (field, value) => {
        setRecurrence(prev => ({ ...prev, [field]: value }));
    };

    const toggleDay = (day) => {
        const currentDays = recurrence.days || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        handleRecurrenceChange('days', newDays);
    };

    const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    // UPDATED: Determine the correct label for the interval
    const intervalLabel = useMemo(() => {
        switch (recurrence.type) {
            case 'daily': return 'day(s)';
            case 'weekly': return 'week(s)';
            case 'monthly': return 'month(s)';
            default: return '';
        }
    }, [recurrence.type]);

    return (
        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" id="start-date" value={recurrence.startDate || ''} onChange={(e) => handleRecurrenceChange('startDate', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" id="end-date" value={recurrence.endDate || ''} onChange={(e) => handleRecurrenceChange('endDate', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                    value={recurrence.type || 'daily'}
                    onChange={(e) => handleRecurrenceChange('type', e.target.value)}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                >
                    {/* NEW: Added Daily option */}
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Repeat Every</label>
                <div className="flex items-center mt-1">
                    <input
                        type="number"
                        min="1"
                        value={recurrence.interval || 1}
                        onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value, 10))}
                        className="w-20 border-gray-300 rounded-md shadow-sm"
                    />
                    <span className="ml-2 text-sm text-gray-600">{intervalLabel}</span>
                </div>
            </div>
            {/* UPDATED: Only show days of the week for 'weekly' frequency */}
            {recurrence.type === 'weekly' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Repeat On</label>
                    <div className="flex space-x-2 mt-2">
                        {daysOfWeek.map(day => (
                            <button key={day} type="button" onClick={() => toggleDay(day)} className={`w-10 h-10 rounded-full text-sm font-semibold ${recurrence.days?.includes(day) ? 'bg-accent text-white' : 'bg-white text-gray-700 border'}`}>
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const ShiftCreator = ({ allUsers, patrols }) => {
    const [creationMode, setCreationMode] = useState('single'); // 'single' or 'recurring'
    const [shiftData, setShiftData] = useState({
        date: '',
        startTime: '',
        stopTime: '',
        patrolId: '',
        roles: [{ name: '', target: 1 }],
        name: '', // For template name
        recurrence: { type: 'daily', days: [], startDate: '', endDate: '', interval: 1 } // Set default type to daily
    });
    const [assignments, setAssignments] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShiftData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (index, field, value) => {
        const newRoles = [...shiftData.roles];
        newRoles[index][field] = value;
        setShiftData(prev => ({ ...prev, roles: newRoles }));
    };

    const addRole = () => setShiftData(prev => ({ ...prev, roles: [...(prev.roles || []), { name: '', target: 1 }] }));
    const removeRole = (index) => setShiftData(prev => ({ ...prev, roles: shiftData.roles.filter((_, i) => i !== index) }));

    const eligibleUsers = useMemo(() => {
        if (!selectedRole || !shiftData.patrolId) return [];
        return allUsers.filter(user =>
            user.ability === selectedRole &&
            user.assignments &&
            user.assignments[shiftData.patrolId]
        );
    }, [selectedRole, shiftData.patrolId, allUsers]);

    const handleAddAssignment = (userId) => {
        if (!userId || assignments.some(a => a.userId === userId)) return;
        const user = allUsers.find(u => u.id === userId);
        setAssignments([...assignments, { userId: user.id, name: `${user.firstName} ${user.lastName}`, role: selectedRole }]);
    };

    const handleRemoveAssignment = (userId) => {
        setAssignments(assignments.filter(a => a.userId !== userId));
    };

    const handleSave = async () => {
        if (creationMode === 'single') {
            await handleSaveSingleShift();
        } else {
            await handleSaveTemplate();
        }
    };

    const handleSaveSingleShift = async () => {
        if (!shiftData.date || !shiftData.patrolId || !shiftData.startTime || !shiftData.stopTime) {
            alert("Date, Patrol, Start Time, and Stop Time are required.");
            return;
        }
        const shiftId = `${shiftData.patrolId}-${shiftData.date}`;
        const shiftRef = doc(db, `artifacts/${appId}/public/data/shifts`, shiftId);
        try {
            await setDoc(shiftRef, {
                patrolId: shiftData.patrolId,
                date: new Date(shiftData.date),
                startTime: shiftData.startTime,
                stopTime: shiftData.stopTime,
                roles: shiftData.roles,
                assignments: assignments,
            }, { merge: true });
            alert("Shift saved successfully!");
            // Reset form
        } catch (error) {
            console.error("Error saving shift: ", error);
            alert("Failed to save shift.");
        }
    };

    const handleSaveTemplate = async () => {
        if (!shiftData.name || !shiftData.patrolId) {
            alert("Template Name and Patrol are required.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/shiftTemplates`), {
                name: shiftData.name,
                patrolId: shiftData.patrolId,
                startTime: shiftData.startTime,
                stopTime: shiftData.stopTime,
                roles: shiftData.roles,
                assignments: assignments,
                recurrence: shiftData.recurrence,
            });
            alert("Template saved successfully!");
            // Reset form
        } catch (error) {
            console.error("Error saving template: ", error);
            alert("Failed to save template.");
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!newTemplateName) {
            alert("Please enter a name for the template.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/shiftTemplates`), {
                name: newTemplateName,
                patrolId: shiftData.patrolId,
                startTime: shiftData.startTime,
                stopTime: shiftData.stopTime,
                roles: shiftData.roles,
                assignments: assignments,
                recurrence: { days: [], startDate: '', endDate: '' }
            });
            alert(`Template "${newTemplateName}" saved successfully!`);
            setIsTemplateModalOpen(false);
            setNewTemplateName('');
        } catch (error) {
            console.error("Error saving as template: ", error);
            alert("Failed to save as template.");
        }
    };

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
                <div className="mb-6">
                    <div className="flex border-b border-gray-200">
                        <button onClick={() => setCreationMode('single')} className={`px-4 py-2 font-medium text-sm ${creationMode === 'single' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>
                            Create Single Shift
                        </button>
                        <button onClick={() => setCreationMode('recurring')} className={`px-4 py-2 font-medium text-sm ${creationMode === 'recurring' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>
                            Create Recurring Shift
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {creationMode === 'recurring' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Template Name</label>
                            <input type="text" name="name" value={shiftData.name} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {creationMode === 'single' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Shift Date</label>
                                <input type="date" name="date" value={shiftData.date} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        )}
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

                    {creationMode === 'recurring' && (
                        <div>
                            <h3 className="text-lg font-semibold">Recurrence</h3>
                            <RecurrenceEditor recurrence={shiftData.recurrence} setRecurrence={(r) => setShiftData(p => ({ ...p, recurrence: r }))} />
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold">Roles & Staffing Targets</h3>
                        {shiftData.roles.map((role, index) => (
                            <div key={index} className="flex items-center space-x-2 mt-2">
                                <select value={role.name} onChange={e => handleRoleChange(index, 'name', e.target.value)} className="p-2 border rounded-md flex-grow">
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
                                <select id="user-assign" onChange={e => handleAddAssignment(e.target.value)} disabled={!selectedRole || !shiftData.patrolId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value="">
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

                    <div className="flex justify-end border-t pt-6 space-x-3">
                        {creationMode === 'single' && (
                            <button onClick={() => setIsTemplateModalOpen(true)} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700">
                                Save as Template
                            </button>
                        )}
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700">
                            <Save size={18} />
                            <span>{creationMode === 'single' ? 'Save Shift' : 'Save Template'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Save Shift as Template</h2>
                        <div>
                            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">Template Name</label>
                            <input
                                type="text"
                                id="template-name"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setIsTemplateModalOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md">Cancel</button>
                            <button onClick={handleSaveAsTemplate} className="bg-accent text-white py-2 px-4 rounded-md">Save Template</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShiftCreator;