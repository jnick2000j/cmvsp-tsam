// src/components/Scheduling.js
import React, { useState, useMemo } from 'react';
import { PATROLS, PATROL_ROLES } from '../constants';
import { Check, UserPlus, X } from 'lucide-react';

const Scheduling = ({ user, allUsers, shifts, timeClockEntries, onSignUp, onRequestSwap }) => {
    const [scheduleView, setScheduleView] = useState('scheduled'); // scheduled, open, history

    // FIX: Add a guard clause to prevent crashes if allUsers is not available.
    const getUserName = (userId) => {
        if (!Array.isArray(allUsers)) return 'N/A';
        const userFound = allUsers.find(u => u.id === userId);
        return userFound ? `${userFound.firstName} ${userFound.lastName}` : 'N/A';
    };

    // Memoized list of the current user's scheduled shifts
    const myScheduledShifts = useMemo(() => {
        // FIX: Ensure 'shifts' is an array before calling .filter to prevent errors.
        if (!Array.isArray(shifts) || !user?.id) return [];
        
        return shifts.filter(shift => {
            // FIX: Use optional chaining (?.) for safer property access.
            const isAssigned = shift.assignments?.some(a => a.userId === user.id);
            const isLeader = shift.leaderId === user.id || shift.assistantLeaderId === user.id;
            return isAssigned || isLeader;
        });
    }, [shifts, user?.id, allUsers]);

    // Memoized list of open shifts
    const openShifts = useMemo(() => {
        // FIX: Ensure 'shifts' is an array.
        if (!Array.isArray(shifts)) return [];

        const openSpots = [];
        shifts.forEach(shift => {
            // Defensive checks for required shift properties
            if (!shift || !Array.isArray(shift.assignments)) return;

            const assignedUserIds = new Set(shift.assignments.map(a => a.userId));
            if (shift.leaderId) assignedUserIds.add(shift.leaderId);
            if (shift.assistantLeaderId) assignedUserIds.add(shift.assistantLeaderId);

            const requiredRoles = new Set(PATROL_ROLES.filter(r => r !== 'Guest Patroller'));

            shift.assignments.forEach(a => {
                requiredRoles.delete(a.role);
            });
            
            if (!shift.leaderId) requiredRoles.add('Patrol Shift Leader');
            if (!shift.assistantLeaderId) requiredRoles.add('Assistant Patrol Shift Leader');
            
            if (requiredRoles.size > 0) {
                openSpots.push({ ...shift, openRoles: Array.from(requiredRoles) });
            }
        });
        return openSpots;
    }, [shifts]);
    
    // Memoized shift history
    const shiftHistory = useMemo(() => {
        // FIX: Rely on the already-safe myScheduledShifts and check timeClockEntries.
        if (!Array.isArray(timeClockEntries) || !user?.id) return [];

        return myScheduledShifts.map(shift => {
            const entry = timeClockEntries.find(e => 
                e.userId === user.id && 
                e.clockInTime?.seconds && // Safely check for .seconds
                new Date(e.clockInTime.seconds * 1000).toDateString() === new Date(shift.date).toDateString()
            );
            return {
                ...shift,
                status: entry ? 'Attended' : 'Missed',
                // FIX: Use optional chaining for safer access to time properties.
                clockIn: entry?.clockInTime?.seconds ? new Date(entry.clockInTime.seconds * 1000).toLocaleTimeString() : 'N/A',
                clockOut: entry?.clockOutTime?.seconds ? new Date(entry.clockOutTime.seconds * 1000).toLocaleTimeString() : 'N/A'
            };
        });
    }, [myScheduledShifts, timeClockEntries, user?.id]);


    const renderContent = () => {
        switch (scheduleView) {
            case 'scheduled':
                return (
                    <div>
                        {myScheduledShifts.map(shift => (
                            <div key={shift.id} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                                <div className="p-5 bg-gray-50 border-b">
                                    <h3 className="text-lg font-bold text-gray-800">{new Date(shift.date).toDateString()} - {shift.type}</h3>
                                    <p className="text-sm text-gray-600">Patrol: {shift.patrol}</p>
                                    <p className="text-sm text-gray-600">Leader: {getUserName(shift.leaderId)}, Assistant: {getUserName(shift.assistantLeaderId)}</p>
                                </div>
                            </div>
                        ))}
                        {myScheduledShifts.length === 0 && <p>You are not signed up for any upcoming shifts.</p>}
                    </div>
                );
            case 'open':
                return (
                    <div>
                        {openShifts.map(shift => (
                             <div key={shift.id} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                                <div className="p-5 bg-gray-50 border-b">
                                     <h3 className="text-lg font-bold text-gray-800">{new Date(shift.date).toDateString()} - {shift.type}</h3>
                                     <p className="text-sm text-gray-600">Patrol: {shift.patrol}</p>
                                </div>
                                <div className="p-5">
                                    <h4 className="font-semibold mb-2">Available Roles:</h4>
                                    <ul className="space-y-2">
                                        {shift.openRoles.map(role => (
                                            <li key={role} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                                <span>{role}</span>
                                                <button className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 hover:bg-green-200 flex items-center">
                                                    <UserPlus className="h-4 w-4 mr-1"/> Sign Up
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                        {openShifts.length === 0 && <p>There are no open shifts at this time.</p>}
                    </div>
                );
            case 'history':
                return (
                     <div className="bg-white rounded-xl shadow-lg p-5">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Shift Type</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Clock In</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Clock Out</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {shiftHistory.map(shift => (
                                    <tr key={shift.id}>
                                        <td className="px-3 py-2 whitespace-nowrap">{new Date(shift.date).toLocaleDateString()}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{shift.type}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${shift.status === 'Attended' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {shift.status === 'Attended' ? <Check className="h-3 w-3 mr-1"/> : <X className="h-3 w-3 mr-1"/>}
                                                {shift.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">{shift.clockIn}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{shift.clockOut}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {shiftHistory.length === 0 && <p>You have no past shifts.</p>}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setScheduleView('scheduled')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${scheduleView === 'scheduled' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Scheduled Shifts</button>
                    <button onClick={() => setScheduleView('open')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${scheduleView === 'open' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Open Shifts</button>
                    <button onClick={() => setScheduleView('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${scheduleView === 'history' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>My Shift History</button>
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default Scheduling;