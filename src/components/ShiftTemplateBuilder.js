import React, { useState, useEffect, useMemo } from 'react';
import { db, functions } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { PlusCircle, Trash2, Calendar, Save } from 'lucide-react';
// UPDATED: Import PATROLS directly from constants
import { PATROL_ROLES, PATROL_LEADER_ROLES, PATROLS } from '../constants';

const ALL_PATROL_ROLES = [...new Set([...PATROL_ROLES, ...PATROL_LEADER_ROLES])];

// Sub-component for a cleaner UI
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

    return (
        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                        type="date"
                        id="start-date"
                        value={recurrence.startDate || ''}
                        onChange={(e) => handleRecurrenceChange('startDate', e.target.value)}
                        className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                        type="date"
                        id="end-date"
                        value={recurrence.endDate || ''}
                        onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                        className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                    value={recurrence.type || 'weekly'}
                    onChange={(e) => handleRecurrenceChange('type', e.target.value)}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                >
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
                    <span className="ml-2 text-sm text-gray-600">{recurrence.type === 'weekly' ? 'week(s)' : 'month(s)'}</span>
                </div>
            </div>
            {recurrence.type === 'weekly' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Repeat On</label>
                    <div className="flex space-x-2 mt-2">
                        {daysOfWeek.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={`w-10 h-10 rounded-full text-sm font-semibold ${
                                    recurrence.days?.includes(day)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 border'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// UPDATED: The 'patrols' prop is no longer needed
const ShiftTemplateBuilder = ({ allUsers }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateData, setTemplateData] = useState({});
    const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState('');
    
    useEffect(() => {
        const fetchTemplates = async () => {
            const templatesCollection = collection(db, 'shiftTemplates');
            const snapshot = await getDocs(templatesCollection);
            const templatesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTemplates(templatesList);
        };
        fetchTemplates();
    }, []);

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        const data = {
            ...template,
            recurrence: template.recurrence || { type: 'weekly', interval: 1, days: [], startDate: '', endDate: '' },
            assignments: template.assignments || {}
        };
        setTemplateData(data);
    };

    const handleNewTemplate = () => {
        setSelectedTemplate(null);
        setTemplateData({
            name: '',
            patrol: '',
            startTime: '',
            stopTime: '',
            roles: [{ name: '', target: 1 }],
            assignments: {},
            recurrence: { type: 'weekly', interval: 1, days: [], startDate: '', endDate: '' }
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTemplateData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (index, field, value) => {
        const newRoles = [...(templateData.roles || [])];
        newRoles[index][field] = value;
        setTemplateData(prev => ({ ...prev, roles: newRoles }));
    };

    const addRole = () => {
        setTemplateData(prev => ({
            ...prev,
            roles: [...(prev.roles || []), { name: '', target: 1 }]
        }));
    };

    const removeRole = (index) => {
        const newRoles = templateData.roles.filter((_, i) => i !== index);
        setTemplateData(prev => ({ ...prev, roles: newRoles }));
    };

    const eligibleUsersForAssignment = useMemo(() => {
        if (!selectedRoleForAssignment) return [];
        return allUsers.filter(user => user.ability === selectedRoleForAssignment);
    }, [selectedRoleForAssignment, allUsers]);

    const handleAddAssignment = (userId) => {
        if (!userId || !selectedRoleForAssignment) return;
        setTemplateData(prev => {
            const newAssignments = { ...(prev.assignments || {}) };
            const currentAssigned = newAssignments[selectedRoleForAssignment] || [];
            if (!currentAssigned.includes(userId)) {
                newAssignments[selectedRoleForAssignment] = [...currentAssigned, userId];
            }
            return { ...prev, assignments: newAssignments };
        });
    };

    const handleRemoveAssignment = (role, userId) => {
        setTemplateData(prev => {
            const newAssignments = { ...prev.assignments };
            newAssignments[role] = newAssignments[role].filter(id => id !== userId);
            return { ...prev, assignments: newAssignments };
        });
    };
    
    const handleSaveTemplate = async () => {
        if (!templateData.name || !templateData.patrol) {
            alert("Template Name and Patrol are required.");
            return;
        }
        try {
            if (selectedTemplate) {
                const templateRef = doc(db, 'shiftTemplates', selectedTemplate.id);
                await updateDoc(templateRef, templateData);
            } else {
                const docRef = await addDoc(collection(db, 'shiftTemplates'), templateData);
                setSelectedTemplate({ id: docRef.id, ...templateData });
            }
            alert("Template saved successfully!");
            const snapshot = await getDocs(collection(db, 'shiftTemplates'));
            setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error saving template: ", error);
            alert("Failed to save template.");
        }
    };

    const handleApplyTemplate = async () => {
        if (!selectedTemplate) {
            alert("Please select a saved template to apply.");
            return;
        }
        if (!templateData.recurrence?.startDate || !templateData.recurrence?.endDate) {
            alert("Please set a Start Date and an End Date in the recurrence section.");
            return;
        }
        const applyShiftTemplate = httpsCallable(functions, 'applyShiftTemplate');
        try {
            const result = await applyShiftTemplate({ 
                templateId: selectedTemplate.id, 
                startDate: templateData.recurrence.startDate, 
                endDate: templateData.recurrence.endDate 
            });
            alert(result.data.message);
        } catch (error) {
            console.error("Error applying template: ", error);
            alert(`Failed to apply template: ${error.message}`);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h2 className="text-xl font-semibold mb-2">Templates</h2>
                <button onClick={handleNewTemplate} className="w-full mb-4 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Create New Template</button>
                <ul className="space-y-2">
                    {templates.map(template => (
                        <li key={template.id} onClick={() => handleSelectTemplate(template)} className={`p-3 rounded-md cursor-pointer text-sm font-medium ${selectedTemplate?.id === template.id ? 'bg-blue-100 text-blue-800' : 'bg-white hover:bg-gray-100 text-gray-700 border'}`}>
                            {template.name}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="md:col-span-2">
                {templateData.name !== undefined ? (
                    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
                        <div className="flex justify-between items-center">
                            <input name="name" value={templateData.name} onChange={handleInputChange} placeholder="Template Name" className="text-xl font-bold w-full p-2 border rounded-md" />
                            <button onClick={handleSaveTemplate} className="ml-4 px-4 py-2 bg-green-500 text-white rounded-md flex items-center space-x-2 whitespace-nowrap"><Save size={18} /><span>Save</span></button>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Patrol</label>
                            {/* UPDATED: This select now uses the imported PATROLS constant */}
                            <select name="patrol" value={templateData.patrol} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">-- Select a Patrol --</option>
                                {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Default Start Time</label>
                                <input type="time" name="startTime" value={templateData.startTime || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Default Stop Time</label>
                                <input type="time" name="stopTime" value={templateData.stopTime || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">Roles & Staffing Targets</h3>
                            {templateData.roles?.map((role, index) => (
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
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Specific Staff to Template</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div>
                                    <label htmlFor="role-assign" className="block text-sm font-medium text-gray-700">Role</label>
                                    <select id="role-assign" value={selectedRoleForAssignment} onChange={e => setSelectedRoleForAssignment(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                        <option value="">Select a Role to Assign</option>
                                        {ALL_PATROL_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="user-assign" className="block text-sm font-medium text-gray-700">User</label>
                                    <select id="user-assign" onChange={e => handleAddAssignment(e.target.value)} disabled={!selectedRoleForAssignment} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value="">
                                        <option value="">Select a User...</option>
                                        {eligibleUsersForAssignment.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
                                    </select>
                                </div>
                            </div>
                            {Object.keys(templateData.assignments || {}).length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-gray-700">Assigned:</h4>
                                    <ul className="mt-2 space-y-2">
                                        {Object.entries(templateData.assignments).map(([role, userIds]) => 
                                            userIds.map(userId => {
                                                const user = allUsers.find(u => u.id === userId);
                                                return (
                                                    <li key={userId} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                                        <span>{user ? `${user.firstName} ${user.lastName}` : 'Unknown User'} ({role})</span>
                                                        <button type="button" onClick={() => handleRemoveAssignment(role, userId)} className="text-red-600 hover:text-red-800">Remove</button>
                                                    </li>
                                                )
                                            })
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">Recurrence</h3>
                            <RecurrenceEditor recurrence={templateData.recurrence} setRecurrence={(newRecurrence) => setTemplateData(p => ({...p, recurrence: newRecurrence}))} />
                        </div>
                        
                        {selectedTemplate && (
                            <div className="mt-6 border-t pt-6">
                                <h3 className="text-lg font-semibold">Apply Template to Schedule</h3>
                                <p className="text-sm text-gray-600 mb-2">This will generate shifts based on the start and end dates defined in the recurrence settings above.</p>
                                <button onClick={handleApplyTemplate} className="mt-4 w-full p-2 bg-purple-600 text-white rounded-md flex items-center justify-center space-x-2 hover:bg-purple-700"><Calendar size={18} /><span>Apply to Schedule</span></button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 p-10 border-2 border-dashed rounded-lg">Select a template to edit or create a new one.</div>
                )}
            </div>
        </div>
    );
};

export default ShiftTemplateBuilder;