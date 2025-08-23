import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from '../firebaseConfig';
import { appId, INSTRUCTOR_ROLES } from '../constants';
import { PlusCircle, Trash2, ChevronLeft, Check, X, Plus, Paperclip, Video, AlertTriangle } from 'lucide-react';
import Icon from './Icon';

// MultiSelectDropdown for assigning instructors to skills
const MultiSelectDropdown = ({ options, selected, onChange }) => {
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

    const selectedNames = options.filter(opt => selected.includes(opt.id)).map(opt => `${opt.firstName} ${opt.lastName}`).join(', ');

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <span className="block truncate">{selectedNames || "Assign Instructors..."}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronLeft className="h-5 w-5 text-gray-400 transform rotate-[-90deg]" />
                </span>
            </button>
            {isOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {options.map(option => (
                        <li key={option.id} onClick={() => handleSelect(option.id)} className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white">
                            <span className="font-normal block truncate">{option.firstName} {option.lastName}</span>
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

const StationEditModal = ({ isOpen, onClose, stationToEdit, onSave, classes, allUsers, icons }) => {
    const [formData, setFormData] = useState({ name: '', iconUrl: '', skills: [], classId: '', date: '', startTime: '', endTime: '', hours: '', location: '', summary: '', supportNeeds: [], leadInstructorId: '', skillAssignments: {}, assets: [] });
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const instructors = useMemo(() => allUsers.filter(u => u.isAdmin || INSTRUCTOR_ROLES.includes(u.role)), [allUsers]);

    useEffect(() => {
        if (isOpen) {
            if (stationToEdit) {
                const normalizedSkills = (stationToEdit.skills || []).map((skill, index) => 
                    typeof skill === 'string' 
                        ? { id: `skill-${Date.now()}-${index}`, text: skill }
                        : { ...skill, id: skill.id || `skill-${Date.now()}-${index}` }
                );

                setFormData({
                    ...stationToEdit,
                    name: stationToEdit.name || '',
                    classId: stationToEdit.classId || '',
                    iconUrl: stationToEdit.iconUrl || '',
                    skills: normalizedSkills,
                    assets: stationToEdit.assets || [],
                    supportNeeds: stationToEdit.supportNeeds || [],
                    leadInstructorId: stationToEdit.leadInstructorId || '',
                    skillAssignments: stationToEdit.skillAssignments || {},
                });
            } else {
                setFormData({ name: '', iconUrl: '', skills: [{ id: Date.now().toString(), text: '' }], classId: classes[0]?.id || '', date: '', startTime: '', endTime: '', hours: '', location: '', summary: '', supportNeeds: [], leadInstructorId: '', skillAssignments: {}, assets: [] });
            }
        }
    }, [stationToEdit, classes, isOpen]);
    
    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSkillChange = (index, text) => {
        const newSkills = [...formData.skills];
        newSkills[index].text = text;
        setFormData({ ...formData, skills: newSkills });
    };

    const addSkill = () => {
        setFormData({ ...formData, skills: [...formData.skills, { id: Date.now().toString(), text: '' }] });
    };

    const removeSkill = (index) => {
        const skillToRemove = formData.skills[index];
        const newSkills = formData.skills.filter((_, i) => i !== index);
        const newSkillAssignments = {...formData.skillAssignments};
        if (skillToRemove && skillToRemove.id) {
            delete newSkillAssignments[skillToRemove.id];
        }
        setFormData({ ...formData, skills: newSkills, skillAssignments: newSkillAssignments });
    };

    const handleSupportChange = (index, field, value) => {
        const newNeeds = [...formData.supportNeeds];
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
        setFormData({ ...formData, supportNeeds: [...formData.supportNeeds, { id: Date.now().toString(), need: '', date: '', startTime: '', endTime: '', assignedUserId: '', assignedUserName: '' }] });
    };

    const removeSupportNeed = (index) => {
        const newNeeds = formData.supportNeeds.filter((_, i) => i !== index);
        setFormData({ ...formData, supportNeeds: newNeeds });
    };

    // --- Asset Management Functions ---
    const handleAddAsset = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);
        try {
            const storageRef = ref(storage, `station_assets/${formData.classId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const newAsset = {
                id: Date.now().toString(),
                name: file.name,
                url: downloadURL,
                type: file.type.startsWith('video') ? 'video' : 'file',
                isMandatory: false,
                storagePath: snapshot.ref.fullPath,
            };
            setFormData(prev => ({ ...prev, assets: [...prev.assets, newAsset] }));
        } catch (err) {
            console.error("Error uploading file:", err);
            setError("File upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddVideoLink = () => {
        const url = prompt("Please enter the video URL (e.g., YouTube, Vimeo):");
        if (url) {
            const newAsset = {
                id: Date.now().toString(),
                name: "Video Link",
                url: url,
                type: 'videoLink',
                isMandatory: false,
            };
            setFormData(prev => ({ ...prev, assets: [...prev.assets, newAsset] }));
        }
    };

    const handleToggleMandatory = (assetId) => {
        setFormData(prev => ({
            ...prev,
            assets: prev.assets.map(asset =>
                asset.id === assetId ? { ...asset, isMandatory: !asset.isMandatory } : asset
            ),
        }));
    };
    
    const handleDeleteAsset = async (assetToDelete) => {
        if (assetToDelete.storagePath) {
            const fileRef = ref(storage, assetToDelete.storagePath);
            try {
                await deleteObject(fileRef);
            } catch (err) {
                console.error("Error deleting file from storage:", err);
                setError("Could not delete the file from storage. Please check permissions.");
            }
        }
        setFormData(prev => ({
            ...prev,
            assets: prev.assets.filter(asset => asset.id !== assetToDelete.id),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.classId) {
            setError('Station Name and Class are required.');
            return;
        }

        const finalSkills = formData.skills.filter(s => s.text.trim() !== '');
        const finalNeeds = formData.supportNeeds.filter(n => n.need.trim() !== '');
        const finalSkillIds = new Set(finalSkills.map(s => s.id));
        const finalSkillAssignments = {};
        for (const skillId in formData.skillAssignments) {
            if (finalSkillIds.has(skillId)) {
                finalSkillAssignments[skillId] = formData.skillAssignments[skillId];
            }
        }

        const dataToSave = { ...formData, skills: finalSkills, supportNeeds: finalNeeds, skillAssignments: finalSkillAssignments };
        
        try {
            if (stationToEdit) {
                const stationRef = doc(db, `artifacts/${appId}/public/data/stations`, stationToEdit.id);
                await updateDoc(stationRef, dataToSave);
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/stations`), dataToSave);
            }
            onSave();
            onClose();
        } catch (err) {
            setError('Failed to save station data.');
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">{stationToEdit ? 'Edit Station' : 'Add New Station'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Class</label>
                                <select name="classId" value={formData.classId} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Station Name</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Start Time</label><input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">End Time</label><input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" /></div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 border-t pt-4 mt-4">Skills & Assignments</h3>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Lead Instructor</label>
                                <select name="leadInstructorId" value={formData.leadInstructorId} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                                    <option value="">-- Select a Lead --</option>
                                    {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.firstName} {inst.lastName}</option>)}
                                </select>
                            </div>
                            <div className="mt-4 space-y-3">
                                {formData.skills.map((skill, index) => (
                                    <div key={skill.id} className="grid grid-cols-3 gap-4 items-center">
                                        <input value={skill.text} onChange={(e) => handleSkillChange(index, e.target.value)} placeholder={`Skill #${index + 1}`} className="col-span-1 border-gray-300 rounded-md shadow-sm" />
                                        <div className="col-span-2 relative flex items-center">
                                            <div className="flex-grow">
                                                <MultiSelectDropdown
                                                    options={instructors}
                                                    selected={formData.skillAssignments[skill.id] || []}
                                                    onChange={(selectedInstructors) => {
                                                        setFormData(prev => ({ ...prev, skillAssignments: { ...prev.skillAssignments, [skill.id]: selectedInstructors } }));
                                                    }}
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeSkill(index)} className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addSkill} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"><PlusCircle size={16} className="mr-1" /> Add Skill</button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 border-t pt-4 mt-4">Support Needs</h3>
                            <div className="mt-2 space-y-2">
                                {formData.supportNeeds.map((need, index) => (
                                    <div key={need.id} className="grid grid-cols-5 gap-2 items-center">
                                        <input value={need.need} onChange={(e) => handleSupportChange(index, 'need', e.target.value)} placeholder="Need (e.g., Patient)" className="col-span-1 border-gray-300 rounded-md shadow-sm text-sm" />
                                        <input type="date" value={need.date} onChange={(e) => handleSupportChange(index, 'date', e.target.value)} className="col-span-1 border-gray-300 rounded-md shadow-sm text-sm" />
                                        <div className="flex items-center col-span-3">
                                            <input type="time" value={need.startTime} onChange={(e) => handleSupportChange(index, 'startTime', e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full text-sm" />
                                            <span className="mx-2 text-gray-500">to</span>
                                            <input type="time" value={need.endTime} onChange={(e) => handleSupportChange(index, 'endTime', e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full text-sm" />
                                            <select value={need.assignedUserId || ''} onChange={(e) => handleSupportChange(index, 'assignedUserId', e.target.value)} className="ml-2 border-gray-300 rounded-md shadow-sm text-sm">
                                                <option value="">Assign...</option>
                                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                                            </select>
                                            <button type="button" onClick={() => removeSupportNeed(index)} className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addSupportNeed} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"><PlusCircle size={16} className="mr-1" /> Add Support Need</button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2  border-t pt-4 mt-4">Station Assets</h3>
                            <div className="border rounded-lg p-4 bg-gray-50">
                                {formData.assets.map(asset => (
                                    <div key={asset.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            {asset.type === 'file' ? <Paperclip size={18} /> : <Video size={18} />}
                                            <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-xs">{asset.name}</a>
                                            {asset.isMandatory && <span className="text-xs font-semibold text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> Mandatory</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handleToggleMandatory(asset.id)} className={`text-xs px-2 py-1 rounded ${asset.isMandatory ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>
                                                {asset.isMandatory ? 'Set Optional' : 'Set Mandatory'}
                                            </button>
                                            <button type="button" onClick={() => handleDeleteAsset(asset)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                                {formData.assets.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No assets have been added to this station.</p>}

                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <label className="flex-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md py-2 px-4 text-center cursor-pointer">
                                        <input type="file" className="hidden" onChange={handleAddAsset} disabled={isUploading} />
                                        {isUploading ? 'Uploading...' : 'Upload File'}
                                    </label>
                                    <button type="button" onClick={handleAddVideoLink} className="flex-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md py-2 px-4">
                                        Add Video Link
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700">Save Station</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StationEditModal;