// src/components/SkillsModal.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';

const SkillsModal = ({ isOpen, onClose, checkIn, station, user, classes }) => {
    const [completedSkills, setCompletedSkills] = useState({});
    const [editingFailureForSkillId, setEditingFailureForSkillId] = useState(null);
    const [failureDocumentation, setFailureDocumentation] = useState('');
    const [editingRemediationForSkillId, setEditingRemediationForSkillId] = useState(null);
    const [remediationDocumentation, setRemediationDocumentation] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && checkIn) {
            setCompletedSkills(checkIn.completedSkills || {});
            setError('');
        }
    }, [isOpen, checkIn]);

    if (!isOpen || !checkIn || !station) return null;

    const canManageAllSkills = user.isAdmin || (user.assignments && user.assignments[station.id] === true);

    const canManageSkill = (skillId) => {
        if (canManageAllSkills) return true;
        return Array.isArray(user.assignments?.[station.id]) && user.assignments[station.id].includes(skillId);
    };

    const handleSetSkillStatus = async (skillId, status) => {
        setError(''); // Clear previous errors
        if (status === 'fail') {
            setEditingRemediationForSkillId(null);
            setEditingFailureForSkillId(skillId);
            return;
        }
        if (status === 'remediate') {
            setEditingFailureForSkillId(null);
            setEditingRemediationForSkillId(skillId);
            return;
        }

        // Handle 'pass' status
        const newCompletedSkills = { ...completedSkills };
        if (newCompletedSkills[skillId]?.status === status) {
            if (newCompletedSkills[skillId].instructorId === user.uid || user.isAdmin) {
                delete newCompletedSkills[skillId];
            } else {
                setError("You do not have permission to change this status.");
                return;
            }
        } else {
            newCompletedSkills[skillId] = {
                status: 'pass',
                instructorId: user.uid,
                signature: `${user.firstName} ${user.lastName}`,
                timestamp: new Date(),
            };
        }

        setCompletedSkills(newCompletedSkills);
        try {
            const checkInRef = doc(db, `artifacts/${appId}/public/data/checkins`, checkIn.id);
            await updateDoc(checkInRef, { completedSkills: newCompletedSkills });
        } catch (err) { console.error("Error updating skills:", err); }
    };

    const handleSaveDocumentation = async (skillId, status, documentation) => {
        if (!documentation.trim()) {
            setError(`Please provide documentation for the '${status}' status.`);
            return;
        }
        const newCompletedSkills = { ...completedSkills };
        newCompletedSkills[skillId] = {
            status,
            documentation,
            instructorId: user.uid,
            signature: `${user.firstName} ${user.lastName}`,
            timestamp: new Date(),
        };

        setCompletedSkills(newCompletedSkills);
        try {
            const checkInRef = doc(db, `artifacts/${appId}/public/data/checkins`, checkIn.id);
            await updateDoc(checkInRef, { completedSkills: newCompletedSkills });
        } catch (err) { console.error("Error updating skills:", err); }

        setEditingFailureForSkillId(null);
        setFailureDocumentation('');
        setEditingRemediationForSkillId(null);
        setRemediationDocumentation('');
        setError('');
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleDateString();
        }
        return timestamp.toLocaleDateString();
    };

    const course = classes.find(c => c.id === station.classId);
    const studentGroup = course?.studentGroups?.[checkIn.userId];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">{station.name}</h2>
                    <p className="text-gray-600 mt-1">Signing off skills for <span className="font-semibold text-indigo-600">{checkIn.userName}</span> {studentGroup && `(Group ${studentGroup})`}</p>
                    {error && <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    <ul className="space-y-4">
                        {station.skills.map(skill => {
                            const signOffData = completedSkills[skill.id];
                            const isCompleted = !!signOffData;
                            const isPassed = isCompleted && signOffData.status === 'pass';
                            const isFailed = isCompleted && signOffData.status === 'fail';
                            const isRemediated = isCompleted && signOffData.status === 'remediate';

                            return (
                                <li key={skill.id} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-grow pr-4">
                                            <span className="text-gray-800">{skill.text}</span>
                                            {isPassed && <p className="text-xs text-green-600 mt-1">Passed: Signed by {signOffData.signature} on {formatDate(signOffData.timestamp)}</p>}
                                            {isRemediated && <p className="text-xs text-amber-600 mt-1">Passed with Remediation: Signed by {signOffData.signature} on {formatDate(signOffData.timestamp)}</p>}
                                            {isRemediated && <p className="text-xs text-gray-600 mt-1 italic">Note: {signOffData.documentation}</p>}
                                            {isFailed && <p className="text-xs text-red-600 mt-1">Failed: Signed by {signOffData.signature} on {formatDate(signOffData.timestamp)}</p>}
                                            {isFailed && <p className="text-xs text-gray-600 mt-1 italic">Note: {signOffData.documentation}</p>}
                                        </div>
                                        {canManageSkill(skill.id) && (
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleSetSkillStatus(skill.id, 'pass')} className={`px-3 py-1 text-xs font-semibold rounded-full ${isPassed ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>Pass</button>
                                                <button onClick={() => handleSetSkillStatus(skill.id, 'remediate')} className={`px-3 py-1 text-xs font-semibold rounded-full ${isRemediated ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}>Remediate</button>
                                                <button onClick={() => handleSetSkillStatus(skill.id, 'fail')} className={`px-3 py-1 text-xs font-semibold rounded-full ${isFailed ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>Fail</button>
                                            </div>
                                        )}
                                    </div>
                                    {editingFailureForSkillId === skill.id && (
                                        <div className="mt-3">
                                            <textarea value={failureDocumentation} onChange={(e) => setFailureDocumentation(e.target.value)} placeholder="Provide mandatory justification for failure..." className="w-full p-2 border rounded-md" rows="2"></textarea>
                                            <div className="flex justify-end space-x-2 mt-2">
                                                <button onClick={() => { setEditingFailureForSkillId(null); setError(''); }} className="px-3 py-1 text-xs bg-gray-200 rounded-md">Cancel</button>
                                                <button onClick={() => handleSaveDocumentation(skill.id, 'fail', failureDocumentation)} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md">Save Failure</button>
                                            </div>
                                        </div>
                                    )}
                                    {editingRemediationForSkillId === skill.id && (
                                        <div className="mt-3">
                                            <textarea value={remediationDocumentation} onChange={(e) => setRemediationDocumentation(e.target.value)} placeholder="Provide mandatory remediation notes..." className="w-full p-2 border rounded-md" rows="2"></textarea>
                                            <div className="flex justify-end space-x-2 mt-2">
                                                <button onClick={() => { setEditingRemediationForSkillId(null); setError(''); }} className="px-3 py-1 text-xs bg-gray-200 rounded-md">Cancel</button>
                                                <button onClick={() => handleSaveDocumentation(skill.id, 'remediate', remediationDocumentation)} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md">Save Remediation</button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                    <div className="flex justify-end items-center">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Done</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillsModal;
