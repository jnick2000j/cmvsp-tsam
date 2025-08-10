import React, { useState, useMemo } from 'react';
import { Check, X, ArrowRightLeft } from 'lucide-react'; // Import the trade icon

const MySchedule = ({ currentUser, allUsers, shifts, timeClockEntries, onTradeRequest }) => {
    // State to manage the active sub-tab view
    const [view, setView] = useState('upcoming'); // 'upcoming' or 'history'

    const getUserName = (userId) => {
        if (!Array.isArray(allUsers) || !userId) return 'N/A';
        const userFound = allUsers.find(u => u.id === userId);
        return userFound ? `${userFound.firstName} ${userFound.lastName}` : 'N/A';
    };

    // Memoized list for the user's upcoming scheduled shifts
    const myScheduledShifts = useMemo(() => {
        if (!Array.isArray(shifts) || !currentUser?.id) return [];
        return shifts.filter(shift => {
            const isAssigned = shift.assignments?.some(a => a.userId === currentUser.id);
            const isLeader = shift.leaderId === currentUser.id || shift.assistantLeaderId === currentUser.id;
            return isAssigned || isLeader;
        });
    }, [shifts, currentUser?.id]);

    // Memoized list for the user's shift history
    const shiftHistory = useMemo(() => {
        if (!Array.isArray(myScheduledShifts) || !Array.isArray(timeClockEntries) || !currentUser?.id) return [];

        return myScheduledShifts.map(shift => {
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
    }, [myScheduledShifts, timeClockEntries, currentUser?.id]);

    const renderContent = () => {
        if (view === 'upcoming') {
            return (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">My Upcoming Shifts</h2>
                    {myScheduledShifts.length > 0 ? myScheduledShifts.map(shift => (
                        <div key={shift.id} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                            <div className="p-5 bg-gray-50 border-b">
                                <h3 className="text-lg font-bold text-gray-800">{new Date(shift.date).toDateString()} - {shift.type}</h3>
                                <p className="text-sm text-gray-600">Patrol: {shift.patrol}</p>
                                <p className="text-sm text-gray-600">Leader: {getUserName(shift.leaderId)}, Assistant: {getUserName(shift.assistantLeaderId)}</p>
                            </div>
                            {/* --- ADDED SHIFT TRADE BUTTON --- */}
                            <div className="p-4 bg-white flex justify-end">
                                <button
                                    onClick={() => onTradeRequest(shift)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                                >
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    Request Trade
                                </button>
                            </div>
                        </div>
                    )) : <p>You are not signed up for any upcoming shifts.</p>}
                </div>
            );
        }

        if (view === 'history') {
            return (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">My Shift History</h2>
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
                                {shiftHistory.length > 0 ? shiftHistory.map(shift => (
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
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">You have no past shifts.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
        return null;
    };

    const tabClass = (tabName) => 
        `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            view === tabName 
                ? 'border-accent text-accent' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setView('upcoming')} className={tabClass('upcoming')}>
                        My Upcoming Shifts
                    </button>
                    <button onClick={() => setView('history')} className={tabClass('history')}>
                        My Shift History
                    </button>
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default MySchedule;
