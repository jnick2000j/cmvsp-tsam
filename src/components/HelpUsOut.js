import React, { useState, useMemo } from 'react';
import { PATROL_ROLES } from '../constants';
import { Check, UserPlus, X } from 'lucide-react';

/**
 * This component powers the "Help Us Out!" main tab,
 * allowing users to find open shifts or view their past shift history.
 */
const HelpUsOut = ({ currentUser, allUsers, shifts, timeClockEntries }) => {
    const [scheduleView, setScheduleView] = useState('open'); // 'open' or 'history'

    const getUserName = (userId) => {
        if (!Array.isArray(allUsers)) return 'N/A';
        const userFound = allUsers.find(u => u.id === userId);
        return userFound ? `${userFound.firstName} ${userFound.lastName}` : 'N/A';
    };

    const openShifts = useMemo(() => {
        if (!Array.isArray(shifts)) return [];
        const openSpots = [];
        shifts.forEach(shift => {
            if (!shift || !Array.isArray(shift.assignments)) return;
            const assignedUserIds = new Set(shift.assignments.map(a => a.userId));
            if (shift.leaderId) assignedUserIds.add(shift.leaderId);
            if (shift.assistantLeaderId) assignedUserIds.add(shift.assistantLeaderId);
            const requiredRoles = new Set(PATROL_ROLES.filter(r => r !== 'Guest Patroller'));
            shift.assignments.forEach(a => requiredRoles.delete(a.role));
            if (!shift.leaderId) requiredRoles.add('Patrol Shift Leader');
            if (!shift.assistantLeaderId) requiredRoles.add('Assistant Patrol Shift Leader');
            if (requiredRoles.size > 0) {
                openSpots.push({ ...shift, openRoles: Array.from(requiredRoles) });
            }
        });
        return openSpots;
    }, [shifts]);
    
    const shiftHistory = useMemo(() => {
        if (!Array.isArray(shifts) || !Array.isArray(timeClockEntries) || !currentUser?.id) return [];
        
        const userShifts = shifts.filter(shift => {
             const isAssigned = shift.assignments?.some(a => a.userId === currentUser.id);
             const isLeader = shift.leaderId === currentUser.id || shift.assistantLeaderId === currentUser.id;
             return isAssigned || isLeader;
        });

        return userShifts.map(shift => {
            const entry = timeClockEntries.find(e => 
                e.userId === currentUser.id && 
                e.clockInTime?.seconds &&
                new Date(e.clockInTime.seconds * 1000).toDateString() === new Date(shift.date).toDateString()
            );
            return {
                ...shift,
                status: entry ? 'Attended' : 'Missed',
                clockIn: entry?.clockInTime?.seconds ? new Date(entry.clockInTime.seconds * 1000).toLocaleTimeString() : 'N/A',
                clockOut: entry?.clockOutTime?.seconds ? new Date(entry.clockOutTime.seconds * 1000).toLocaleTimeString() : 'N/A'
            };
        });
    }, [shifts, timeClockEntries, currentUser?.id]);

    const renderContent = () => {
        switch (scheduleView) {
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
                    <button onClick={() => setScheduleView('open')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${scheduleView === 'open' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Open Shifts</button>
                    <button onClick={() => setScheduleView('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${scheduleView === 'history' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>My Shift History</button>
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default HelpUsOut;