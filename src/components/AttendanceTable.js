// src/components/AttendanceTable.js
import React from 'react';

const AttendanceTable = ({ title, description, records, classes, stations }) => {
    const getAssignmentName = (record) => {
        if (record.stationId) {
            const station = stations.find(s => s.id === record.stationId);
            if (station) {
                const course = classes.find(c => c.id === station.classId);
                return `${station.name} (${course ? course.name : '...'})`;
            }
        }
        if (record.classId) {
            const course = classes.find(c => c.id === record.classId);
            return course ? course.name : 'General';
        }
        return 'N/A';
    };

    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
    const formatTime = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleTimeString() : '---';

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="mt-2 text-sm text-gray-700">{description}</p>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Assignment</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Check In</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Check Out</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {records.map((record) => (
                                        <tr key={record.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="font-medium text-gray-900">{record.userName}</div>
                                                <div className="text-gray-500">{record.userRole}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{getAssignmentName(record)}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(record.checkInTime)}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${record.checkOutTime ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                                                    {record.checkOutTime ? 'Checked Out' : 'Checked In'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatTime(record.checkInTime)}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatTime(record.checkOutTime)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {records.length === 0 && <p className="p-4 text-center text-sm text-gray-500">No attendance records found.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceTable;
