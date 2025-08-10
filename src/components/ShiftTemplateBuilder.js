import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { PlusCircle, Trash2, Calendar, Save } from 'lucide-react';

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


const ShiftTemplateBuilder = ({ allUsers, patrols }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateData, setTemplateData] = useState({});
    // NEW: State for the date range to apply the template
    const [applyStartDate, setApplyStartDate] = useState('');
    const [applyEndDate, setApplyEndDate] = useState('');
    
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
        // Ensure recurrence object has default values if not present
        const data = {
            ...template,
            recurrence: template.recurrence || { type: 'weekly', interval: 1, days: [] }
        };
        setTemplateData(data);
    };

    const handleNewTemplate = () => {
        setSelectedTemplate(null);
        setTemplateData({
            name: '',
            patrol: '',
            roles: [{ name: '', target: 1 }],
            assignments: {},
            recurrence: { type: 'weekly', interval: 1, days: [] }
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTemplateData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (index, field, value) => {
        const newRoles = [...templateData.roles];
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

    const handleAssignmentChange = (roleName, userId) => {
        setTemplateData(prev => {
            const newAssignments = { ...(prev.assignments || {}) };
            if (!newAssignments[roleName]) {
                newAssignments[roleName] = [];
            }
            if (newAssignments[roleName].includes(userId)) {
                newAssignments[roleName] = newAssignments[roleName].filter(id => id !== userId);
            } else {
                newAssignments[roleName].push(userId);
            }
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
                setSelectedTemplate({ id: docRef.id, ...templateData }); // Select the new template
            }
            alert("Template saved successfully!");
            // Refetch templates to update the list
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
        if (!applyStartDate || !applyEndDate) {
            alert("Please select a Start Date and an End Date.");
            return;
        }
        const applyShiftTemplate = httpsCallable(functions, 'applyShiftTemplate');
        try {
            const result = await applyShiftTemplate({ 
                templateId: selectedTemplate.id, 
                startDate: applyStartDate, 
                endDate: applyEndDate 
            });
            alert(result.data.message);
        } catch (error) {
            console.error("Error applying template: ", error);
            alert(`Failed to apply template: ${error.message}`);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Template List */}
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
            {/* Right Column: Template Editor */}
            <div className="md:col-span-2">
                {templateData.name !== undefined ? (
                    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
                        <div className="flex justify-between items-center">
                            <input name="name" value={templateData.name} onChange={handleInputChange} placeholder="Template Name" className="text-xl font-bold w-full p-2 border rounded-md" />
                             <button onClick={handleSaveTemplate} className="ml-4 px-4 py-2 bg-green-500 text-white rounded-md flex items-center space-x-2 whitespace-nowrap"><Save size={18} /><span>Save</span></button>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Patrol</label>
                            <select name="patrol" value={templateData.patrol} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">-- Select a Patrol --</option>
                                {patrols.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold">Roles & Staffing</h3>
                            {templateData.roles?.map((role, index) => (
                                <div key={index} className="flex items-center space-x-2 mt-2">
                                    <input value={role.name} onChange={e => handleRoleChange(index, 'name', e.target.value)} placeholder="Role Name" className="p-2 border rounded-md flex-grow" />
                                    <input type="number" min="1" value={role.target} onChange={e => handleRoleChange(index, 'target', parseInt(e.target.value, 10))} placeholder="Target #" className="w-24 p-2 border rounded-md" />
                                    <button type="button" onClick={() => removeRole(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                </div>
                            ))}
                            <button onClick={addRole} className="mt-2 flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"><PlusCircle size={16} /><span>Add Role</span></button>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">Recurrence</h3>
                            <RecurrenceEditor recurrence={templateData.recurrence} setRecurrence={(newRecurrence) => setTemplateData(p => ({...p, recurrence: newRecurrence}))} />
                        </div>
                        
                        {selectedTemplate && (
                            <div className="mt-6 border-t pt-6">
                                <h3 className="text-lg font-semibold">Apply Template to Schedule</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                        <input type="date" value={applyStartDate} onChange={e => setApplyStartDate(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                                        <input type="date" value={applyEndDate} onChange={e => setApplyEndDate(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                </div>
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