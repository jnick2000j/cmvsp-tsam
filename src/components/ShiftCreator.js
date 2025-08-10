import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { PlusCircle, Trash2, Save, Edit, X, Clock, CheckCircle } from 'lucide-react';
import { PATROL_ROLES, PATROL_LEADER_ROLES, appId, PATROLS, MOUNTAIN_AREAS } from '../constants';

const ALL_PATROL_ROLES = [...new Set([...PATROL_ROLES, ...PATROL_LEADER_ROLES])];

// Recurrence Editor Sub-component
const RecurrenceEditor = ({ recurrence, setRecurrence }) => {
    const handleRecurrenceChange = (field, value) => {
        setRecurrence({ ...recurrence, [field]: value });
    };

    const toggleDay = (day) => {
        const currentDays = recurrence.days || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        handleRecurrenceChange('days', newDays);
    };

    const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

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

// Template Manager Component
const TemplateManager = ({ templates, setTemplates, allUsers }) => {
    const [editingTemplate, setEditingTemplate] = useState(null);

    const handleSaveTemplate = async (templateData) => {
        if (!templateData.name) {
            alert("Template name is required.");
            return;
        }
        try {
            if (templateData.id) {
                const templateRef = doc(db, `artifacts/${appId}/public/data/shiftTemplates`, templateData.id);
                await updateDoc(templateRef, templateData);
                setTemplates(templates.map(t => t.id === templateData.id ? templateData : t));
                alert("Template updated successfully!");
            } else {
                const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/shiftTemplates`), templateData);
                setTemplates([...templates, { id: docRef.id, ...templateData }]);
                alert("Template created successfully!");
            }
            setEditingTemplate(null);
        } catch (error) {
            console.error("Error saving template: ", error);
            alert("Failed to save template.");
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/shiftTemplates`, templateId));
                setTemplates(templates.filter(t => t.id !== templateId));
                alert("Template deleted successfully!");
            } catch (error) {
                console.error("Error deleting template: ", error);
                alert("Failed to delete template.");
            }
        }
    };

    if (editingTemplate) {
        return <TemplateEditor template={editingTemplate} onSave={handleSaveTemplate} onCancel={() => setEditingTemplate(null)} allUsers={allUsers} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Shift Templates</h2>
                <button onClick={() => setEditingTemplate({})} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700">
                    <PlusCircle size={18} />
                    <span>New Template</span>
                </button>
            </div>
            <div className="space-y-2">
                {templates.map(template => (
                    <div key={template.id} className="p-4 bg-gray-100 rounded-md flex justify-between items-center">
                        <span>{template.name}</span>
                        <div className="space-x-2">
                            <button onClick={() => setEditingTemplate(template)} className="p-2 text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteTemplate(template.id)} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Template Editor Component
const TemplateEditor = ({ template, onSave, onCancel, allUsers }) => {
    const [templateData, setTemplateData] = useState(template);
    const [assignments, setAssignments] = useState(template.assignments || []);
    const [selectedRole, setSelectedRole] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTemplateData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (index, field, value) => {
        const newRoles = [...(templateData.roles || [])];
        newRoles[index][field] = value;
        setTemplateData(prev => ({ ...prev, roles: newRoles }));
    };

    const addRole = () => setTemplateData(prev => ({ ...prev, roles: [...(prev.roles || []), { name: '', target: 1 }] }));
    const removeRole = (index) => setTemplateData(prev => ({ ...prev, roles: templateData.roles.filter((_, i) => i !== index) }));
    
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
        onSave({ ...templateData, assignments });
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{template.id ? 'Edit Template' : 'Create New Template'}</h2>
                <button onClick={onCancel} className="p-2 text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Template Name</label>
                <input type="text" name="name" value={templateData.name || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Patrol</label>
                    <select name="patrolId" value={templateData.patrolId} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                        <option value="">-- Select a Patrol --</option>
                        {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input type="time" name="startTime" value={templateData.startTime} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Stop Time</label>
                    <input type="time" name="stopTime" value={templateData.stopTime} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                </div>
            </div>
             <div>
                <h3 className="text-lg font-semibold">Roles & Staffing Targets</h3>
                {(templateData.roles || []).map((role, index) => (
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Specific Staff (optional)</h3>
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
            <div className="flex justify-end border-t pt-6 space-x-3">
                <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700">
                    <Save size={18} />
                    <span>Save Template</span>
                </button>
            </div>
        </div>
    );
};

// Scheduled Shifts Manager Component
const ScheduledShiftsManager = ({ allUsers }) => {
    const [shifts, setShifts] = useState([]);
    const [editingShift, setEditingShift] = useState(null);

    const fetchShifts = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/shifts`));
            const fetchedShifts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate().toISOString().split('T')[0]
            }));
            setShifts(fetchedShifts);
        } catch (error) {
            console.error("Error fetching shifts: ", error);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const handleUpdateShift = async (shiftData) => {
        try {
            const shiftRef = doc(db, `artifacts/${appId}/public/data/shifts`, shiftData.id);
            await updateDoc(shiftRef, {
                ...shiftData,
                date: new Date(shiftData.date)
            });
            setShifts(shifts.map(s => s.id === shiftData.id ? shiftData : s));
            setEditingShift(null);
            alert("Shift updated successfully!");
        } catch (error) {
            console.error("Error updating shift: ", error);
            alert("Failed to update shift.");
        }
    };

    if (editingShift) {
        return <ShiftEditor shift={editingShift} onSave={handleUpdateShift} onCancel={() => setEditingShift(null)} allUsers={allUsers} />;
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Scheduled Shifts</h2>
            <div className="space-y-4">
                {shifts.map(shift => (
                    <div key={shift.id} className="p-4 bg-gray-100 rounded-md">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold">{shift.patrolId} - {shift.date}</p>
                                <p className="text-sm text-gray-600">{shift.startTime} - {shift.stopTime}</p>
                            </div>
                            <button onClick={() => setEditingShift(shift)} className="p-2 text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold">Staffing</h4>
                            {shift.roles.map((role, index) => {
                                const assignedCount = shift.assignments.filter(a => a.role === role.name).length;
                                return (
                                    <div key={index} className="flex justify-between items-center mt-1">
                                        <span>{role.name}</span>
                                        <span className={`${assignedCount < role.target ? 'text-red-500' : 'text-green-500'}`}>
                                            {assignedCount} / {role.target}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Shift Editor Component
const ShiftEditor = ({ shift, onSave, onCancel, allUsers }) => {
    const [shiftData, setShiftData] = useState(shift);
    const [assignments, setAssignments] = useState(shift.assignments || []);
    const [selectedRole, setSelectedRole] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShiftData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (index, field, value) => {
        const newRoles = [...(shiftData.roles || [])];
        newRoles[index][field] = value;
        setShiftData(prev => ({ ...prev, roles: newRoles }));
    };

    const addRole = () => setShiftData(prev => ({ ...prev, roles: [...(prev.roles || []), { name: '', target: 1 }] }));
    const removeRole = (index) => setShiftData(prev => ({ ...prev, roles: shiftData.roles.filter((_, i) => i !== index) }));

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

    const handleReassign = (userId, newRole) => {
        setAssignments(assignments.map(a => a.userId === userId ? { ...a, role: newRole } : a));
    };

    const handleSave = () => {
        onSave({ ...shiftData, assignments });
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Edit Shift</h2>
                <button onClick={onCancel} className="p-2 text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Shift Date</label>
                    <input type="date" name="date" value={shiftData.date} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Patrol</label>
                    <select name="patrolId" value={shiftData.patrolId} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                        <option value="">-- Select a Patrol --</option>
                        {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
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
                {(shiftData.roles || []).map((role, index) => (
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Assignments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mb-4">
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
                                    <span>{a.name}</span>
                                    <div className="flex items-center space-x-2">
                                        <select value={a.role} onChange={(e) => handleReassign(a.userId, e.target.value)} className="p-1 border rounded-md text-sm">
                                            {ALL_PATROL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <button type="button" onClick={() => handleRemoveAssignment(a.userId)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div className="flex justify-end border-t pt-6 space-x-3">
                <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700">
                    <Save size={18} />
                    <span>Save Changes</span>
                </button>
            </div>
        </div>
    );
};

// MODIFICATION: New component for patrol attendance
const PatrolAttendance = ({ allUsers }) => {
    const [selectedPatrol, setSelectedPatrol] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState(null);
    const [shiftTrades, setShiftTrades] = useState([]);

    useEffect(() => {
        const fetchShiftData = async () => {
            if (selectedPatrol && selectedDate) {
                const shiftId = `${selectedPatrol}-${selectedDate}`;
                const shiftRef = doc(db, `artifacts/${appId}/public/data/shifts`, shiftId);
                const shiftSnap = await getDocs(shiftRef);
                if (shiftSnap.exists()) {
                    setShift({ id: shiftSnap.id, ...shiftSnap.data() });
                } else {
                    setShift(null);
                }

                // Fetch shift trades for this shift
                const tradesRef = collection(db, `artifacts/${appId}/public/data/shiftTrades`);
                const q = query(tradesRef, where("shiftId", "==", shiftId), where("status", "==", "pending"));
                const tradesSnapshot = await getDocs(q);
                setShiftTrades(tradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        };
        fetchShiftData();
    }, [selectedPatrol, selectedDate]);

    const handleClockInOut = async (userId, type) => {
        // This would interact with a timekeeping collection in Firestore
        alert(`${type} for user ${userId} at ${new Date().toLocaleTimeString()}`);
    };

    const handleApproveTrade = async (tradeId) => {
        const tradeRef = doc(db, `artifacts/${appId}/public/data/shiftTrades`, tradeId);
        await updateDoc(tradeRef, { status: "approved" });
        setShiftTrades(shiftTrades.filter(t => t.id !== tradeId));
        alert("Trade approved!");
    };
    
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Patrol Attendance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select value={selectedPatrol} onChange={e => setSelectedPatrol(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm">
                    <option value="">-- Select Patrol --</option>
                    {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" />
            </div>

            {shift ? (
                <div>
                    {/* Staffing Info and other components would go here */}
                    <h3 className="text-lg font-semibold">Staffing</h3>
                     {shift.roles.map((role, index) => {
                        const assignedCount = shift.assignments.filter(a => a.role === role.name).length;
                        return (
                            <div key={index} className="flex justify-between items-center mt-1">
                                <span>{role.name}</span>
                                <span className={`${assignedCount < role.target ? 'text-red-500' : 'text-green-500'}`}>
                                    {assignedCount} / {role.target}
                                </span>
                            </div>
                        );
                    })}

                    <h3 className="text-lg font-semibold mt-4">Pending Trades</h3>
                    {shiftTrades.map(trade => (
                        <div key={trade.id} className="p-2 bg-yellow-100 rounded-md flex justify-between items-center">
                            <span>{trade.requestingUserName} for {trade.userToCoverName}</span>
                            <button onClick={() => handleApproveTrade(trade.id)} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Approve</button>
                        </div>
                    ))}

                    <h3 className="text-lg font-semibold mt-4">Patrollers</h3>
                    {shift.assignments.map(assignment => (
                        <div key={assignment.userId} className="p-2 border-b">
                           <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{assignment.name}</p>
                                    <p className="text-sm">{assignment.role}</p>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => handleClockInOut(assignment.userId, 'Clock In')} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">In</button>
                                    <button onClick={() => handleClockInOut(assignment.userId, 'Clock Out')} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Out</button>
                                </div>
                           </div>
                           <div className="text-sm mt-2">
                                <p>Clock In: N/A, Clock Out: N/A</p>
                                <div className="flex items-center space-x-2 mt-1">
                                    <select className="p-1 border rounded-md text-sm">
                                        <option>Unassigned</option>
                                        {MOUNTAIN_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                     <select value={assignment.role} className="p-1 border rounded-md text-sm">
                                        {ALL_PATROL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                           </div>
                        </div>
                    ))}
                </div>
            ) : <p>No shift found for this patrol on this date.</p>}
        </div>
    );
};


const ShiftCreator = ({ allUsers }) => {
    const [activeTab, setActiveTab] = useState('single');
    const initialShiftData = {
        date: '',
        startTime: '',
        stopTime: '',
        patrolId: '',
        roles: [{ name: '', target: 1 }],
        name: '',
        recurrence: { type: 'daily', days: [], startDate: '', endDate: '', interval: 1 }
    };
    const [shiftData, setShiftData] = useState(initialShiftData);
    const [assignments, setAssignments] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [shiftTemplates, setShiftTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    const fetchTemplates = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/shiftTemplates`));
            const templates = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setShiftTemplates(templates);
        } catch (error) {
            console.error("Error fetching shift templates: ", error);
        }
    };
    
    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (selectedTemplateId) {
            const template = shiftTemplates.find(t => t.id === selectedTemplateId);
            if (template) {
                setShiftData({
                    ...initialShiftData,
                    ...template,
                    name: template.name || '',
                    patrolId: template.patrolId || '',
                    startTime: template.startTime || '',
                    stopTime: template.stopTime || '',
                    roles: template.roles || [{ name: '', target: 1 }],
                    recurrence: template.recurrence || { type: 'daily', days: [], startDate: '', endDate: '', interval: 1 },
                });
                setAssignments(template.assignments || []);
            }
        } else {
            setShiftData(initialShiftData);
            setAssignments([]);
        }
    }, [selectedTemplateId, shiftTemplates]);


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
            setShiftData(initialShiftData);
            setAssignments([]);
        } catch (error) {
            console.error("Error saving shift: ", error);
            alert("Failed to save shift.");
        }
    };

    const handleSaveAndUseRecurring = async () => {
        if (!shiftData.patrolId || !shiftData.recurrence.startDate || !shiftData.recurrence.endDate) {
            alert("Patrol, Start Date, and End Date are required for recurring shifts.");
            return;
        }

        const templateName = shiftData.name || `Recurring ${shiftData.patrolId} @ ${shiftData.startTime}`;

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/shiftTemplates`), {
                name: templateName,
                patrolId: shiftData.patrolId,
                startTime: shiftData.startTime,
                stopTime: shiftData.stopTime,
                roles: shiftData.roles,
                assignments: assignments,
                recurrence: shiftData.recurrence,
            });
            alert(`Recurring shift "${templateName}" saved successfully!`);
            setShiftData(initialShiftData);
            setAssignments([]);
            setSelectedTemplateId('');
            fetchTemplates();
        } catch (error) {
            console.error("Error saving recurring shift: ", error);
            alert("Failed to save recurring shift.");
        }
    };

    const handleSaveAsNewTemplate = async () => {
        if (!newTemplateName) {
            alert("Please enter a name for the new template.");
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
                recurrence: activeTab === 'recurring' ? shiftData.recurrence : { type: 'daily', days: [], startDate: '', endDate: '', interval: 1 }
            });
            alert(`Template "${newTemplateName}" saved successfully!`);
            setIsTemplateModalOpen(false);
            setNewTemplateName('');
            fetchTemplates();
        } catch (error) {
            console.error("Error saving as new template: ", error);
            alert("Failed to save as new template.");
        }
    };

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
                <div className="mb-6">
                    <div className="flex border-b border-gray-200">
                        <button onClick={() => { setActiveTab('single'); setSelectedTemplateId(''); }} className={`px-4 py-2 font-medium text-sm ${activeTab === 'single' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>
                            Create Single Shift
                        </button>
                        <button onClick={() => setActiveTab('recurring')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'recurring' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>
                            Create Recurring Shift
                        </button>
                        <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'templates' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>
                            Shift Templates
                        </button>
                        <button onClick={() => setActiveTab('scheduled')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'scheduled' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>
                            Scheduled Shifts
                        </button>
                        {/* MODIFICATION: New tab for patrol attendance */}
                        <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'attendance' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>
                            Patrol Attendance
                        </button>
                    </div>
                </div>

                {(activeTab === 'single' || activeTab === 'recurring') && (
                    <div className="space-y-6">
                        {activeTab === 'recurring' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Choose Existing Template</label>
                                <select
                                    value={selectedTemplateId}
                                    onChange={e => setSelectedTemplateId(e.target.value)}
                                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                                >
                                    <option value="">-- Start with a blank shift --</option>
                                    {shiftTemplates.map(template => (
                                        <option key={template.id} value={template.id}>{template.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeTab === 'single' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Shift Date</label>
                                    <input type="date" name="date" value={shiftData.date} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Patrol</label>
                                <select name="patrolId" value={shiftData.patrolId} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                    <option value="">-- Select a Patrol --</option>
                                    {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
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

                        {activeTab === 'recurring' && (
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

                        <div className="flex justify-end border-t pt-6 space-x-3">
                            {activeTab === 'single' && (
                                <button onClick={handleSaveSingleShift} className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700">
                                    <Save size={18} />
                                    <span>Save Shift</span>
                                </button>
                            )}
                            {activeTab === 'recurring' && (
                                <>
                                    <button onClick={() => setIsTemplateModalOpen(true)} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700">
                                        Save as New Template
                                    </button>
                                    <button onClick={handleSaveAndUseRecurring} className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700">
                                        <Save size={18} />
                                        <span>Save and Use Recurring Shift</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'templates' && (
                    <TemplateManager templates={shiftTemplates} setTemplates={setShiftTemplates} allUsers={allUsers} />
                )}

                {activeTab === 'scheduled' && (
                    <ScheduledShiftsManager allUsers={allUsers} />
                )}

                {activeTab === 'attendance' && (
                    <PatrolAttendance allUsers={allUsers} />
                )}
            </div>

            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Save as New Template</h2>
                        <div>
                            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">New Template Name</label>
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
                            <button onClick={handleSaveAsNewTemplate} className="bg-accent text-white py-2 px-4 rounded-md">Save Template</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShiftCreator;
