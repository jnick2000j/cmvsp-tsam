import React, { useState, useMemo } from 'react';
import { LogIn, LogOut, Edit } from 'lucide-react';

const PatrolAttendance = ({ currentUser, users, shifts, timeClockEntries, handleShiftCheckIn, handleShiftCheckOut }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedShift, setSelectedShift] = useState('');

    const attendanceData = useMemo(() => {
        const dateFilteredEntries = timeClockEntries.filter(entry => 
            new Date(entry.clockInTime.seconds * 1000).toISOString().split('T')[0] === selectedDate
        );

        if (selectedShift) {
            return dateFilteredEntries.filter(entry => entry.shiftId === selectedShift);
        }

        return dateFilteredEntries;
    }, [timeClockEntries, selectedDate, selectedShift]);
    
    const canManage = (shift) => {
        if (!currentUser) return false;
        if (currentUser.isAdmin) return true;
        // Add more specific patrol leadership roles here if needed
        return false;
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Patrol Check in & Out</h2>
            <div className="flex space-x-4 mb-4">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 border rounded"
                />
                <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="">All Shifts</option>
                    {shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                    ))}
                </select>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceData.map(entry => {
                            const isCheckedIn = !entry.clockOutTime;
                            return (
                                <tr key={entry.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{entry.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{entry.shiftType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{entry.area}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isCheckedIn ? 'Checked In' : 'Checked Out'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                                        {canManage() && isCheckedIn && (
                                            <>
                                                <button onClick={() => handleShiftCheckOut(entry.id)} className="text-red-600 hover:text-red-900"><LogOut className="h-5 w-5" /></button>
                                                <button className="text-blue-600 hover:text-blue-900"><Edit className="h-5 w-5" /></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PatrolAttendance;