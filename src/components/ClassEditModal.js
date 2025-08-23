import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, updateDoc, addDoc, collection, arrayRemove, getDocs, deleteDoc } from 'firebase/firestore';
import { db, functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { appId, INSTRUCTOR_ROLES, SUPPORT_ROLES } from '../constants';
import { PlusCircle, Trash2, ChevronLeft, Check } from 'lucide-react';
import Icon from './Icon';

const MultiSelectDropdown = ({ options, selected, onChange, placeholder, displayField = 'title' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionId) => {
        const newSelected = selected.includes(optionId)
            ? selected.filter(id => id !== optionId)
            : [...selected, optionId];
        onChange(newSelected);
    };

    const selectedNames = options
        .filter(opt => selected.includes(opt.id))
        .map(opt => opt[displayField] || `${opt.firstName} ${opt.lastName}`)
        .join(', ');

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <span className="block truncate">{selectedNames || placeholder}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronLeft className="h-5 w-5 text-gray-400 transform rotate-[-90deg]" />
                </span>
            </button>
            {isOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {options.map(option => (
                        <li key={option.id} onClick={() => handleSelect(option.id)} className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white">
                            <span className="font-normal block truncate">{option[displayField] || `${option.firstName} ${option.lastName}`}</span>
                            {selected.includes(option.id) && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                    <Check className="h-5 w-5" />
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


const ClassEditModal = ({ isOpen, onClose, classToEdit, onSave, instructors, allUsers, currentUser, waivers, branding, icons }) => {
    const [formData, setFormData] = useState({});
    const [numGroups, setNumGroups] = useState(1);
    const [enrolledStudentsList, setEnrolledStudentsList] = useState([]);

    const allRoles = useMemo(() => ['Student', ...INSTRUCTOR_ROLES, ...SUPPORT_ROLES], []);
    
    const getInitialFormData = useCallback(() => ({
        name: '', 
        iconUrl: '', 
        startDate: '', 
        endDate: '', 
        hours: '', 
        location: '', 
        summary: '', 
        leadInstructorId: currentUser?.uid || '', 
        supportNeeds: [], 
        studentGroups: {}, 
        prerequisites: [],
        waiverIds: [], // ADDED: waiverIds to initial state
        isHidden: false, 
        visibleToRoles: [], 
        logoUrl: '', 
        isCompleted: false
    }), [currentUser]);

    const fetchEnrolledStudents = useCallback(async (classId) => {
        if (!classId) return;
        try {
            const enrollmentsRef = collection(db, `artifacts/${appId}/public/data/classes`, classId, 'enrollments');
            const snapshot = await getDocs(enrollmentsRef);
            const studentIds = snapshot.docs.map(doc => doc.id);
            const enrolled = allUsers.filter(user => studentIds.includes(user.id));
            setEnrolledStudentsList(enrolled);
        } catch (error) {
            console.error("Error fetching enrolled students:", error);
            setEnrolledStudentsList([]);
        }
    }, [allUsers]);

    useEffect(() => {
        if (isOpen) {
            if (classToEdit) {
                const data = {
                    ...getInitialFormData(), 
                    ...classToEdit,
                };
                const normalizedPrerequisites = (data.prerequisites || []).map((prereq, index) => ({
                    ...prereq,
                    id: prereq.id || `prereq-${Date.now()}-${index}`
                }));

                setFormData({
                    ...data,
                    prerequisites: normalizedPrerequisites,
                    waiverIds: classToEdit.waiverIds || [], // Ensure waiverIds is loaded
                });
                const maxGroup = Object.values(data.studentGroups || {}).reduce((max, num) => Math.max(max, num), 1);
                setNumGroups(maxGroup);
                fetchEnrolledStudents(classToEdit.id);
            } else {
                setFormData(getInitialFormData());
                setNumGroups(1);
                setEnrolledStudentsList([]);
            }
        }
    }, [classToEdit, isOpen, getInitialFormData, fetchEnrolledStudents]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };
    
    const handleRoleVisibilityChange = (selectedRoles) => {
        setFormData({ ...formData, visibleToRoles: selectedRoles });
    };

    const handleWaiverChange = (selectedIds) => {
        setFormData(prev => ({ ...prev, waiverIds: selectedIds }));
    };

    const handlePrereqChange = (index, field, value) => {
        const newPrerequisites = [...(formData.prerequisites || [])];
        newPrerequisites[index][field] = value;
        setFormData({ ...formData, prerequisites: newPrerequisites });
    };
    
    const addPrerequisite = () => {
        setFormData(prev => ({
            ...prev,
            prerequisites: [...(prev.prerequisites || []), { id: Date.now().toString(), description: '', requiresUpload: false }]
        }));
    };

    const removePrerequisite = (index) => {
        const newPrerequisites = formData.prerequisites.filter((_, i) => i !== index);
        setFormData({ ...formData, prerequisites: newPrerequisites });
    };
    
    const handleSupportChange = (index, field, value) => {
        const newNeeds = [...(formData.supportNeeds || [])];
        if (field === 'assignedUserId') {
            const selectedUser = allUsers.find(u => u.id === value);
            newNeeds[index].assignedUserId = value;
            newNeeds[index].assignedUserName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '';
        } else {
            newNeeds[index][field] = value;
        }
        setFormData({ ...formData, supportNeeds: newNeeds });
    };

    const addSupportNeed = () => {
        const currentNeeds = formData.supportNeeds || [];
        setFormData({ ...formData, supportNeeds: [...currentNeeds, { id: Date.now().toString(), need: '', date: '', startTime: '', endTime: '', assignedUserId: '', assignedUserName: '' }] });
    };

    const removeSupportNeed = (index) => {
        const newNeeds = formData.supportNeeds.filter((_, i) => i !== index);
        setFormData({ ...formData, supportNeeds: newNeeds });
    };

    const handleRandomAssign = () => {
        const studentIds = enrolledStudentsList.map(s => s.id);

        for (let i = studentIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [studentIds[i], studentIds[j]] = [studentIds[j], studentIds[i]];
        }

        const newStudentGroups = {};
        studentIds.forEach((studentId, index) => {
            newStudentGroups[studentId] = (index % numGroups) + 1;
        });

        setFormData({ ...formData, studentGroups: newStudentGroups });
    };

    const handleManualGroupChange = (studentId, group) => {
        setFormData({ ...formData, studentGroups: { ...formData.studentGroups, [studentId]: parseInt(group, 10) } });
    };
    
    const handleUnenrollStudent = async (studentId) => {
        if (!classToEdit) return;
        try {
            const enrollmentRef = doc(db, `artifacts/${appId}/public/data/classes`, classToEdit.id, "enrollments", studentId);
            await deleteDoc(enrollmentRef);

            const userRef = doc(db, "users", studentId);
            await updateDoc(userRef, {
                enrolledClasses: arrayRemove(classToEdit.id)
            });

            fetchEnrolledStudents(classToEdit.id);
        } catch (error) {
            console.error("Error unenrolling student:", error);
            alert("An error occurred while unenrolling the student.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return;
        
        const dataToSave = { ...formData };
        if (dataToSave.isCompleted && !dataToSave.completedDate) {
            dataToSave.completedDate = new Date();
        }

        try {
            if (classToEdit) {
                await updateDoc(doc(db, `artifacts/${appId}/public/data/classes`, classToEdit.id), dataToSave);
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/classes`), dataToSave);
            }
            onSave();
            onClose();
        } catch (err) { console.error(err); }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">{classToEdit ? 'Edit Class' : 'Add New Class'}</h2></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Class Name</label>
                        <input name="name" value={formData.name || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Icon</label>
                        <select name="iconUrl" value={formData.iconUrl || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                            <option value="">-- Select an icon --</option>
                            {(icons || []).map(icon => (
                                <option key={icon.id} value={icon.url}>{icon.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">Start Date</label><input type="date" name="startDate" value={formData.startDate || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">End Date</label><input type="date" name="endDate" value={formData.endDate || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">Lead Instructor</label><select name="leadInstructorId" value={formData.leadInstructorId || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">{instructors.map(i => <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>)}</select></div>

                    {classToEdit && (
                        <div>
                            <h3 className="text-md font-medium text-gray-900 border-t pt-4 mt-4">Group & Enrollment Management</h3>
                            <div className="flex items-center space-x-2 mt-2">
                                <label className="text-sm font-medium">Number of Groups:</label>
                                <input type="number" value={numGroups} onChange={(e) => setNumGroups(parseInt(e.target.value, 10) || 1)} min="1" className="w-20 border-gray-300 rounded-md shadow-sm" />
                                <button type="button" onClick={handleRandomAssign} className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300">Randomly Assign</button>
                            </div>
                            <div className="mt-4 max-h-48 overflow-y-auto border rounded-md p-2">
                                <h4 className="font-semibold mb-2">Enrolled Students ({enrolledStudentsList.length})</h4>
                                {enrolledStudentsList.length > 0 ? (
                                    <ul className="space-y-2">
                                        {enrolledStudentsList.map(student => (
                                            <li key={student.id} className="flex justify-between items-center p-1 bg-gray-50 rounded">
                                                <span className="text-sm">{student.firstName} {student.lastName}</span>
                                                <div className="flex items-center space-x-2">
                                                    <select value={formData.studentGroups[student.id] || ''} onChange={(e) => handleManualGroupChange(student.id, e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm p-1">
                                                        <option value="">Unassigned</option>
                                                        {[...Array(numGroups)].map((_, i) => <option key={i+1} value={i+1}>Group {i+1}</option>)}
                                                    </select>
                                                    <button type="button" onClick={() => handleUnenrollStudent(student.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200">Unenroll</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-gray-500 italic">No students are enrolled in this class yet.</p>}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h3 className="text-md font-medium text-gray-900 border-t pt-4 mt-4">Prerequisites</h3>
                        <p className="mt-1 text-sm text-gray-500">Define the requirements users must meet before enrolling.</p>
                        <div className="mt-4 space-y-3">
                            {(formData.prerequisites || []).map((prereq, index) => (
                                <div key={prereq.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                                    <div className="flex-grow grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Description</label>
                                            <input
                                                type="text"
                                                name="description"
                                                value={prereq.description}
                                                onChange={(e) => handlePrereqChange(index, 'description', e.target.value)}
                                                className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-sm"
                                                placeholder="e.g., Provide CPR Certification"
                                            />
                                        </div>
                                        <div className="flex items-center mt-4">
                                            <label className="inline-flex items-center text-sm font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    name="requiresUpload"
                                                    checked={prereq.requiresUpload}
                                                    onChange={(e) => handlePrereqChange(index, 'requiresUpload', e.target.checked)}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                />
                                                <span className="ml-2">Requires File Upload</span>
                                            </label>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removePrerequisite(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-md">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addPrerequisite} className="flex items-center text-primary-dark hover:text-primary-hover text-sm font-medium">
                                <PlusCircle className="mr-2" size={18} /> Add Prerequisite
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-medium text-gray-900 border-t pt-4 mt-4">Waivers</h3>
                        <p className="mt-1 text-sm text-gray-500">Select one or more waivers that must be signed for this class.</p>
                        <div className="mt-4">
                            <MultiSelectDropdown
                                options={waivers || []}
                                selected={formData.waiverIds || []}
                                onChange={handleWaiverChange}
                                placeholder="Assign Waivers..."
                                displayField="title"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-md font-medium text-gray-900 border-t pt-4 mt-4">Support Needs</h3>
                        <p className="mt-1 text-sm text-gray-500">Add instructors or other personnel to assist with this class.</p>
                        <div className="mt-4 space-y-3">
                            {(formData.supportNeeds || []).map((need, index) => (
                                <div key={need.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><label className="block text-xs font-medium text-gray-500">Need</label><input type="text" name="need" value={need.need} onChange={(e) => handleSupportChange(index, 'need', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-sm" placeholder="e.g., Lead Instructor, Paramedic" /></div>
                                        <div><label className="block text-xs font-medium text-gray-500">Date</label><input type="date" name="date" value={need.date} onChange={(e) => handleSupportChange(index, 'date', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-sm" /></div>
                                        <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-medium text-gray-500">Start</label><input type="time" name="startTime" value={need.startTime} onChange={(e) => handleSupportChange(index, 'startTime', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-sm" /></div><div><label className="block text-xs font-medium text-gray-500">End</label><input type="time" name="endTime" value={need.endTime} onChange={(e) => handleSupportChange(index, 'endTime', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-sm" /></div></div>
                                        <div><label className="block text-xs font-medium text-gray-500">Assigned To</label><select name="assignedUserId" value={need.assignedUserId} onChange={(e) => handleSupportChange(index, 'assignedUserId', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-sm"><option value="">Unassigned</option>{instructors.map(i => <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>)}</select></div>
                                    </div>
                                    <button type="button" onClick={() => removeSupportNeed(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-md"><Trash2 size={18} /></button>
                                </div>
                            ))}
                            <button type="button" onClick={addSupportNeed} className="flex items-center text-primary-dark hover:text-primary-hover text-sm font-medium"><PlusCircle className="mr-2" size={18} /> Add Support Need</button>
                        </div>
                    </div>
                    
                    <div className="mt-4 border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700">Visible To Roles</label>
                        <MultiSelectDropdown 
                            options={(allRoles || []).map(r => ({id: r, title: r}))}
                            selected={formData.visibleToRoles || []}
                            onChange={handleRoleVisibilityChange}
                            placeholder="Select roles"
                            displayField="title"
                        />
                    </div>
                    <div className="mt-4 border-t pt-4">
                        <label className="inline-flex items-center text-sm font-medium text-gray-700">
                            <input type="checkbox" name="isHidden" checked={formData.isHidden || false} onChange={handleInputChange} className="rounded border-gray-300 text-indigo-600 shadow-sm" />
                            <span className="ml-2">Hide from Course Catalog</span>
                        </label>
                    </div>
                    <div className="mt-4 border-t pt-4">
                        <label className="inline-flex items-center text-sm font-medium text-gray-700">
                            <input type="checkbox" name="isCompleted" checked={formData.isCompleted || false} onChange={handleInputChange} className="rounded border-gray-300 text-indigo-600 shadow-sm" />
                            <span className="ml-2">Mark as Completed</span>
                        </label>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white border rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Class</button>
                </div>
            </form>
        </div>
    );
};

export default ClassEditModal;