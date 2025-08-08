// src/components/OpportunitiesCatalog.js
import React from 'react';
import { addDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';
import Icon from './Icon';

const OpportunitiesCatalog = ({ stations, classes, user, addUpdate, instructorSignups }) => {

    const handleCancelRequest = async (stationId, skillId = null) => {
        if (!user || !db) return;

        let q = query(collection(db, `artifacts/${appId}/public/data/instructorSignups`), where("stationId", "==", stationId), where("instructorId", "==", user.uid));
        if (skillId) {
            q = query(q, where("skillId", "==", skillId));
        } else {
            q = query(q, where("skillId", "==", null));
        }

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });
            console.log("Sign-up request cancelled.");
        } catch (error) {
            console.error("Error cancelling request: ", error);
        }
    };

    const handleSignUp = async (station, skill = null) => {
        if (!user || !db || !station) return;

        const alreadySignedUp = instructorSignups.some(s => s.stationId === station.id && s.instructorId === user.uid && s.skillId === (skill ? skill.id : null));
        if (alreadySignedUp) {
            console.warn("You have already requested to sign up for this item.");
            return;
        }

        const isAssignedToStation = user.assignments?.[station.id] === true;
        const isAssignedToSkill = Array.isArray(user.assignments?.[station.id]) && user.assignments?.[station.id]?.includes(skill?.id);

        if (isAssignedToStation || isAssignedToSkill) {
            console.warn("You are already assigned to this item.");
            return;
        }

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/instructorSignups`), {
                instructorId: user.uid,
                instructorName: `${user.firstName} ${user.lastName}`,
                stationId: station.id,
                stationName: station.name,
                classId: station.classId,
                skillId: skill ? skill.id : null,
                skillText: skill ? skill.text : null,
                status: 'pending',
                requestedAt: new Date()
            });
            const signupText = skill ? `${user.firstName} ${user.lastName} signed up for skill "${skill.text}" in ${station.name}.` : `${user.firstName} ${user.lastName} signed up for all skills in ${station.name}.`;
            addUpdate('Handshake', signupText, 'System');
            alert("Your request has been sent.");
        } catch (error) {
            console.error("Error signing up: ", error);
            alert("There was an error submitting your request.");
        }
    };

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Teaching Opportunities</h2>
                    <p className="mt-1 text-sm text-gray-500">Browse and sign up for available stations or individual skills.</p>
                </div>
            </div>
            <div className="space-y-8">
                {stations.map(station => {
                    const isAssignedToStation = user.assignments?.[station.id] === true;
                    const isPendingForStation = instructorSignups.some(s => s.stationId === station.id && s.instructorId === user.uid && !s.skillId);
                    return (
                        <div key={station.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                            <div className="p-5 border-b bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full"><Icon name={station.icon} className="h-6 w-6" /></div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{station.name}</h3>
                                            <p className="text-sm text-gray-600">{classes.find(c => c.id === station.classId)?.name}</p>
                                        </div>
                                    </div>
                                    <div className="w-1/4">
                                        {isPendingForStation ? (
                                            <button onClick={() => handleCancelRequest(station.id)} className="w-full text-sm font-medium py-2 px-3 bg-red-100 text-red-700 rounded-md hover:bg-red-200">Cancel Request</button>
                                        ) : (
                                            <button onClick={() => handleSignUp(station)} disabled={isAssignedToStation} className="w-full text-sm font-medium py-2 px-3 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed">
                                                {isAssignedToStation ? 'Assigned' : 'Sign up for All'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="font-semibold text-gray-700 mb-3">Individual Skills</h4>
                                <ul className="space-y-2">
                                    {station.skills.map(skill => {
                                        const isAssignedToSkill = isAssignedToStation || (Array.isArray(user.assignments?.[station.id]) && user.assignments?.[station.id]?.includes(skill.id));
                                        const isPendingForSkill = instructorSignups.some(s => s.stationId === station.id && s.instructorId === user.uid && s.skillId === skill.id);
                                        return (
                                            <li key={skill.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                                <p className="text-sm text-gray-800">{skill.text}</p>
                                                <div className="w-1/4">
                                                    {isPendingForSkill ? (
                                                          <button onClick={() => handleCancelRequest(station.id, skill.id)} className="w-full text-xs font-medium py-1 px-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200">Cancel</button>
                                                        ) : (
                                                          <button onClick={() => handleSignUp(station, skill)} disabled={isAssignedToSkill} className="w-full text-xs font-medium py-1 px-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed">
                                                              {isAssignedToSkill ? 'Assigned' : 'Sign Up'}
                                                          </button>
                                                        )}
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default OpportunitiesCatalog;
