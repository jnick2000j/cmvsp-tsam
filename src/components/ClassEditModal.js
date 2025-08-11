// src/components/ClassEditModal.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, updateDoc, addDoc, collection, arrayRemove, getDocs, deleteDoc } from 'firebase/firestore';
// MODIFICATION: Added 'functions' to the import
import { db, functions } from '../firebaseConfig';
// MODIFICATION: Added 'httpsCallable' to communicate with the backend
import { httpsCallable } from 'firebase/functions';
import { appId, INSTRUCTOR_ROLES, SUPPORT_ROLES } from '../constants';
import { PlusCircle, Trash2, ChevronLeft, Check } from 'lucide-react';

const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
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

    const handleSelect = (optionValue) => {
        const newSelected = selected.includes(optionValue)
            ? selected.filter(val => val !== optionValue)
            : [...selected, optionValue];
        onChange(newSelected);
    };

    const selectedNames = selected.join(', ');

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
                        <li key={option} onClick={() => handleSelect(option)} className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white">
                            <span className="font-normal block truncate">{option}</span>
                            {selected.includes(option) && (
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


const ClassEditModal = ({ isOpen, onClose, classToEdit, onSave, instructors, allUsers, currentUser, waivers, branding }) => {
    const [formData, setFormData] = useState({});
    const [numGroups, setNumGroups] = useState(1);
    // --- NEW: State for the enrollment feature ---
    const [enrolledStudentsList, setEnrolledStudentsList] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');


    const allRoles = useMemo(() => ['Student', ...INSTRUCTOR_ROLES, ...SUPPORT_ROLES], []);
    
    const getInitialFormData = useCallback(() => ({
        name: '', 
        startDate: '', 
        endDate: '', 
        hours: '', 
        location: '', 
        summary: '', 
        leadInstructorId: currentUser?.uid || '', 
        supportNeeds: [], 
        studentGroups: {}, 
        requiredWaivers: [], 
        isPrerequisiteUploadRequired: false, 
        isHidden: false, 
        visibleToRoles: [], 
        logoUrl: '', 
        isCompleted: false
    }), [currentUser]);

    // --- NEW: Fetches the list of enrolled students from the subcollection ---
    const fetchEnrolledStudents = useCallback(async (classId) => {
        if (!classId) return;
        try {
            const enrollmentsRef = collection(db, 'classes', classId, 'enrollments');
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
                setFormData(data);
                const maxGroup = Object.values(data.studentGroups || {}).reduce((max, num) => Math.max(max, num), 1);
                setNumGroups(maxGroup);
                // --- NEW: Fetch students when modal opens for an existing class ---
                fetchEnrolledStudents(classToEdit.id);
            } else {
                setFormData(getInitialFormData());
                setNumGroups(1);
                setEnrolledStudentsList([]); // Reset for new class
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

    const handleWaiverChange = (waiverId) => {
        setFormData(prev => {
            const currentWaivers = prev.requiredWaivers || [];
            const newWaivers = currentWaivers.includes(waiverId)
                ? currentWaivers.filter(id => id !== waiverId)
                : [...currentWaivers, waiverId];
            return { ...prev, requiredWaivers: newWaivers };
        });
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
            const enrollmentRef = doc(db, "classes", classToEdit.id, "enrollments", studentId);
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

    const handleManualEnroll = async () => {
        if (!selectedStudent) {
            alert("Please select a student to enroll.");
            return;
        }
        if (!classToEdit?.id) {
            alert("Cannot enroll student because the class has not been saved yet.");
            return;
        }

        const enrollStudentFn = httpsCallable(functions, 'enrollStudent');
        try {
            const result = await enrollStudentFn({ classId: classToEdit.id, studentId: selectedStudent });
            if (result.data.success) {
                alert(result.data.message);
                setSelectedStudent(''); // Reset dropdown
                fetchEnrolledStudents(classToEdit.id); // Refresh the list
            } else {
                throw new Error(result.data.message);
            }
        } catch (error) {
            console.error("Error enrolling student:", error);
            alert(`Enrollment failed: ${error.message}`);
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

    const canManageEnrollment = currentUser.isAdmin || currentUser.uid === formData.leadInstructorId;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">{classToEdit ? 'Edit Class' : 'Add New Class'}</h2></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div><label className="block text-sm font-medium text-gray-700">Class Name</label><input name="name" value={formData.name || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label className="block text-sm font-medium text-gray-700">Start Date</label><input type="date" name="startDate" value={formData.startDate || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                         <div><label className="block text-sm font-medium text-gray-700">End Date</label><input type="date" name="endDate" value={formData.endDate || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">Location</label><input name="location" value={formData.location || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Total Hours</label><input type="number" name="hours" value={formData.hours || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">Lead Instructor</label><select name="leadInstructorId" value={formData.leadInstructorId || ''} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">{instructors.map(i => <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>)}</select></div>
                    
                    {classToEdit && canManageEnrollment && (
                        <div>
                            <h3 className="text-md font-medium text-gray-900 border-t pt-4 mt-4">Manual Enrollment</h3>
                             <div className="mt-2 p-4 border rounded-md bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enroll a User</label>
                                <div className="flex items-center space-x-2">
                                    <select 
                                        value={selectedStudent} 
                                        onChange={(e) => setSelectedStudent(e.target.value)} 
                                        className="flex-grow border-gray-300 rounded-md shadow-sm"
                                    >
                                        <option value="">-- Select a user to enroll --</option>
                                        {allUsers.map(user => (
                                            <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={handleManualEnroll}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Enroll User
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
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
                                                    {canManageEnrollment && (
                                                        <button type="button" onClick={() => handleUnenrollStudent(student.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200">Unenroll</button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-gray-500 italic">No students are enrolled in this class yet.</p>}
                            </div>
                        </div>
                    )}

                    <div>
                         <h3 className="text-md font-medium text-gray-900 border-t pt-4 mt-4">Support Needs</h3>
                         <div className="space-y-3 mt-2">
                            {(formData.supportNeeds || []).map((need, index) => (
                                <div key={need.id} className="p-3 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div className="lg:col-span-3">
                                        <label className="block text-sm font-medium text-gray-600">Need Description</label>
                                        <input type="text" placeholder="e.g., Additional Instructor" value={need.need} onChange={(e) => handleSupportChange(index, 'need', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Date</label>
                                        <input type="date" value={need.date} onChange={(e) => handleSupportChange(index, 'date', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600">Start Time</label>
                                            <input type="time" value={need.startTime} onChange={(e) => handleSupportChange(index, 'startTime', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600">End Time</label>
                                            <input type="time" value={need.endTime} onChange={(e) => handleSupportChange(index, 'endTime', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="flex items-end space-x-2">
                                        <div className="flex-grow">
                                            <label className="block text-sm font-medium text-gray-600">Assign To</label>
                                            <select value={need.assignedUserId} onChange={(e) => handleSupportChange(index, 'assignedUserId', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                                <option value="">Unassigned</option>
                                                {allUsers.filter(u => Array.isArray(u.roles) && [...INSTRUCTOR_ROLES, ...SUPPORT_ROLES].some(role => u.roles.includes(role))).map(u => (
                                                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button type="button" onClick={() => removeSupportNeed(index)} className="p-2 text-red-600 hover:text-red-800">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                         <button type="button" onClick={addSupportNeed} className="mt-3 flex items-center px-3 py-2 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200">
                            <PlusCircle size={16} className="mr-2" />
                            Add Support Need
                         </button>
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