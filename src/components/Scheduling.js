// src/components/Scheduling.js
import React, { useState, useMemo } from 'react';
import { Calendar, UserPlus, Send } from 'lucide-react';
import { PATROLS, PATROL_ROLES } from '../constants';

const Scheduling = ({ user, allUsers, shifts, onSignUp, onRequestSwap }) => {
    const [selectedPatrol, setSelectedPatrol] = useState(PATROLS[0]);

    const handleSignUp = (shiftId, role) => {
        if (onSignUp) {
            onSignUp(shiftId, role);
        }
    };

    const handleRequestSwap = (shiftId, currentUserId) => {
        // In a real app, this would open a modal to select a user to swap with
        if (onRequestSwap) {
            const targetUserId = prompt("Enter the ID of the user you want to swap with:");
            if (targetUserId) {
                onRequestSwap(shiftId, currentUserId, targetUserId);
            }
        }
    };

    const filteredShifts = useMemo(() => {
        return shifts.filter(shift => shift.patrol === selectedPatrol);
    }, [shifts, selectedPatrol]);

    const getUserName = (userId) => {
        const userFound = allUsers.find(u => u.id === userId);
        return userFound ? `${userFound.firstName} ${userFound.lastName}` : 'N/A';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Patrol Schedule</h1>
            <div className="mb-4">
                <select
                    value={selectedPatrol}
                    onChange={(e) => setSelectedPatrol(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm"
                >
                    {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div className="space-y-8">
                {filteredShifts.map(shift => (
                    <div key={shift.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-5 bg-gray-50 border-b">
                            <h3 className="text-lg font-bold text-gray-800">{shift.date} - {shift.type}</h3>
                            <p className="text-sm text-gray-600">Leader: {getUserName(shift.leaderId)}, Assistant: {getUserName(shift.assistantLeaderId)}</p>
                        </div>
                        <div className="p-5">
                            <ul className="space-y-2">
                                {PATROL_ROLES.map(role => {
                                    const assignment = shift.assignments.find(a => a.role === role);
                                    return (
                                        <li key={role} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                            <p className="text-sm text-gray-800">{role}</p>
                                            {assignment ? (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium">{getUserName(assignment.userId)}</span>
                                                    {assignment.userId === user.id && (
                                                        <button onClick={() => handleRequestSwap(shift.id, user.id)} className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200">Request Swap</button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button onClick={() => handleSignUp(shift.id, role)} className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 hover:bg-green-200">Sign Up</button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Scheduling;