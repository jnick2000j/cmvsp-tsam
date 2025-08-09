// src/components/InstructorAttendance.js
import React, { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { INSTRUCTOR_ROLES } from '../constants';

const InstructorAttendance = ({ classes, allUsers, attendanceRecords, stations }) => {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const classOptions = useMemo(() => {
        return classes.map(c => ({ value: c.id, label: c.name }));
    }, [classes]);

    const instructors = useMemo(() => {
        return allUsers.filter(u => u.isAdmin || INSTRUCTOR_ROLES.includes(u.role));
    }, [allUsers]);

    const filteredAttendance = useMemo(() => {
        if (!selectedClassId) return [];

        let records = attendanceRecords.filter(rec => {
            const station = stations.find(s => s.id === rec.stationId);
            const isForThisClass = station && station.classId === selectedClassId;
            const isInstructorRecord = instructors.some(inst => inst.id === rec.userId);
            return isForThisClass && isInstructorRecord;
        });

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            records = records.filter(rec => {
                const user = instructors.find(u => u.id === rec.userId);
                return user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(lowercasedFilter);
            });
        }

        return records;
    }, [selectedClassId, searchTerm, attendanceRecords, stations, instructors]);

    const downloadPdf = () => {
        const selectedClass = classes.find(c => c.id === selectedClassId);
        if (!selectedClass) return;

        const doc = new jsPDF();
        doc.text(`Instructor Attendance for: ${selectedClass.name}`, 14, 16);

        const tableColumn = ["Instructor Name", "Station", "Check-in Time", "Check-out Time", "Duration (min)"];
        const tableRows = [];

        filteredAttendance.forEach(record => {
            const user = instructors.find(u => u.id === record.userId);
            const station = stations.find(s => s.id === record.stationId);
            const checkInTime = record.checkInTime ? new Date(record.checkInTime.seconds * 1000) : null;
            const checkOutTime = record.checkOutTime ? new Date(record.checkOutTime.seconds * 1000) : null;

            let duration = 'N/A';
            if (checkInTime && checkOutTime) {
                const diffMs = checkOutTime - checkInTime;
                duration = Math.round(diffMs / 60000);
            }

            const rowData = [
                user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                station ? station.name : 'Class Lead',
                checkInTime ? checkInTime.toLocaleTimeString() : 'N/A',
                checkOutTime ? checkOutTime.toLocaleTimeString() : 'N/A',
                duration
            ];
            tableRows.push(rowData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`instructor_attendance_${selectedClass.name.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">View Instructor Attendance</h2>
                <button
                    onClick={downloadPdf}
                    disabled={!selectedClassId || filteredAttendance.length === 0}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                >
                    <option value="">-- Select a Class --</option>
                    {classOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md"
                        disabled={!selectedClassId}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (min)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {selectedClassId ? filteredAttendance.map(record => {
                            const user = instructors.find(u => u.id === record.userId);
                            const station = stations.find(s => s.id === record.stationId);
                            const checkInTime = record.checkInTime ? new Date(record.checkInTime.seconds * 1000) : null;
                            const checkOutTime = record.checkOutTime ? new Date(record.checkOutTime.seconds * 1000) : null;

                            let duration = 'N/A';
                            if (checkInTime && checkOutTime) {
                                const diffMs = checkOutTime - checkInTime;
                                duration = Math.round(diffMs / 60000);
                            }

                            return (
                                <tr key={record.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user ? `${user.firstName} ${user.lastName}` : 'Loading...'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{station ? station.name : 'Class Lead'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{checkInTime ? checkInTime.toLocaleTimeString() : ''}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{checkOutTime ? checkOutTime.toLocaleTimeString() : ''}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{duration}</td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                    Please select a class to view instructor attendance.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstructorAttendance;