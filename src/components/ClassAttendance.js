import React, { useState, useMemo } from 'react';
import { LogIn, LogOut } from 'lucide-react';

const ClassAttendance = ({ currentUser, users, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');

    const attendanceData = useMemo(() => {
        const dateFilteredCheckIns = dailyCheckIns.filter(ci => ci.checkInDate === selectedDate);
        
        const userStatus = {};

        dateFilteredCheckIns.forEach(ci => {
            if (!userStatus[ci.userId] || new Date(ci.checkInTime.seconds * 1000) > new Date(userStatus[ci.userId].checkInTime.seconds * 1000)) {
                userStatus[ci.userId] = ci;
            }
        });

        let finalData = Object.values(userStatus);

        if (selectedClass) {
            finalData = finalData.filter(ci => ci.classId === selectedClass);
        }

        return finalData;
    }, [dailyCheckIns, selectedDate, selectedClass]);

    const canManage = (course) => {
        if (!course || !currentUser) return false;
        if (currentUser.isAdmin) return true;
        if (course.leadInstructorId === currentUser.uid) return true;
        return false;
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Class Check in & Out</h2>
            <div className="flex space-x-4 mb-4">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 border rounded"
                />
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="">All Classes</option>
                    {classes.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                </select>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceData.map(checkIn => {
                            const user = users.find(u => u.uid === checkIn.userId);
                            const course = classes.find(c => c.id === checkIn.classId);
                            const station = stations.find(s => s.id === checkIn.stationId);
                            const isCheckedIn = !checkIn.checkOutTime;

                            return (
                                <tr key={checkIn.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{checkIn.userName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{checkIn.className || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{checkIn.stationName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isCheckedIn ? 'Checked In' : 'Checked Out'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {canManage(course) && isCheckedIn && (
                                            <button onClick={() => handleClassCheckOut(checkIn.id)} className="text-red-600 hover:text-red-900">
                                                <LogOut className="h-5 w-5" />
                                            </button>
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

export default ClassAttendance;