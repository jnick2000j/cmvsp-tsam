import React, { useState, useMemo } from 'react';
import { LogOut } from 'lucide-react';

const ClassAttendance = ({ currentUser, allUsers, classes, stations, dailyCheckIns, handleClassCheckOut }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');

    // --- OPTIMIZATION ---
    // Convert arrays to maps for fast O(1) lookups inside the main loop.
    // This is much more performant than using .find() repeatedly inside a map.
    const classesMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);
    const stationsMap = useMemo(() => new Map(stations.map(s => [s.id, s])), [stations]);

    const attendanceData = useMemo(() => {
        // Filter check-ins by the selected date first.
        const dateFilteredCheckIns = dailyCheckIns.filter(ci => ci.checkInDate === selectedDate);
        
        const latestUserCheckin = {};

        // Process the filtered check-ins to find the latest one for each user.
        dateFilteredCheckIns.forEach(ci => {
            // If we haven't seen this user, or if this check-in is newer, store it.
            if (!latestUserCheckin[ci.userId] || new Date(ci.checkInTime.seconds * 1000) > new Date(latestUserCheckin[ci.userId].checkInTime.seconds * 1000)) {
                latestUserCheckin[ci.userId] = ci;
            }
        });

        // Convert the object of latest check-ins back into an array.
        let finalData = Object.values(latestUserCheckin);

        // If a specific class is selected, filter the data further.
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
            <h2 className="text-2xl font-bold mb-4">Class Check-in & Check-out</h2>
            <div className="flex flex-wrap space-x-0 sm:space-x-4 mb-4">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 border rounded mb-2 sm:mb-0 w-full sm:w-auto"
                />
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="p-2 border rounded w-full sm:w-auto"
                >
                    <option value="">All Classes</option>
                    {classes.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                </select>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
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
                            // Use the performant maps to find related data
                            const course = classesMap.get(checkIn.classId);
                            const station = stationsMap.get(checkIn.stationId);
                            const isCheckedIn = !checkIn.checkOutTime;

                            // --- STABILITY ---
                            // Check if the course exists before trying to render the manage button
                            const showManageButton = course && canManage(course) && isCheckedIn;

                            return (
                                <tr key={checkIn.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{checkIn.userName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{course?.name || 'Unknown Class'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{station?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isCheckedIn ? 'Checked In' : 'Checked Out'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {showManageButton && (
                                            <button onClick={() => handleClassCheckOut(checkIn.id)} className="text-red-600 hover:text-red-900" title="Check-out">
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