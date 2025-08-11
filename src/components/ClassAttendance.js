import React, { useState, useMemo } from 'react';
import { LogIn, LogOut } from 'lucide-react';

const ClassAttendance = ({ currentUser, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStationId, setSelectedStationId] = useState('');

    const classesMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);
    const stationsMap = useMemo(() => new Map(stations.map(s => [s.id, s])), [stations]);

    const attendanceData = useMemo(() => {
        let checkIns = dailyCheckIns.filter(ci => ci.checkInDate === selectedDate);
        if (selectedClassId) {
            checkIns = checkIns.filter(ci => ci.classId === selectedClassId);
        }
        if (selectedStationId) {
            checkIns = checkIns.filter(ci => ci.stationId === selectedStationId);
        }
        return checkIns;
    }, [dailyCheckIns, selectedDate, selectedClassId, selectedStationId]);
    
    const canManage = (checkIn) => {
        const course = classesMap.get(checkIn.classId);
        if (!currentUser || !course) return false;
        if (currentUser.isAdmin || course.leadInstructorId === currentUser.uid) return true;

        // Check for station instructor permissions
        const station = stationsMap.get(checkIn.stationId);
        if (station && station.instructors && station.instructors.includes(currentUser.uid)) {
            return true;
        }
        return false;
    };

    const availableStations = useMemo(() => {
        if (!selectedClassId) return stations;
        const course = classesMap.get(selectedClassId);
        if (!course || !course.stations) return [];
        return stations.filter(s => course.stations.includes(s.id));
    }, [selectedClassId, classes, stations, classesMap]);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Class Check In & Out</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 border rounded"
                />
                <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="">Filter by Class</option>
                    {classes.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                </select>
                <select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    className="p-2 border rounded"
                    disabled={!selectedClassId}
                >
                    <option value="">Filter by Station</option>
                    {availableStations.map(station => <option key={station.id} value={station.id}>{station.name}</option>)}
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
                            const isCheckedIn = !checkIn.checkOutTime;
                            const showManageButtons = canManage(checkIn);
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
                                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                        {showManageButtons && (
                                            isCheckedIn ? (
                                                <button onClick={() => handleClassCheckOut(checkIn.id)} className="text-red-600 hover:text-red-900" title="Check-out">
                                                    <LogOut className="h-5 w-5" />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleClassCheckIn(checkIn, classesMap.get(checkIn.classId), stationsMap.get(checkIn.stationId))} className="text-green-600 hover:text-green-900" title="Check-in again">
                                                    <LogIn className="h-5 w-5" />
                                                </button>
                                            )
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