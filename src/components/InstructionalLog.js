// src/components/InstructionalLog.js
import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InstructionalLog = ({ user, classes, stations, allUsers }) => {

    const instructionalLogData = useMemo(() => {
        const log = [];
        const instructorClasses = classes.filter(c => c.instructors?.includes(user.uid) || c.leadInstructorId === user.uid);

        instructorClasses.forEach(cls => {
            const assignedStations = stations.filter(s => s.classId === cls.id && s.instructors?.includes(user.uid));
            if (assignedStations.length > 0) {
                assignedStations.forEach(st => {
                    log.push({
                        date: cls.startDate,
                        activity: `Taught Station: ${st.name}`,
                        course: cls.name,
                        hours: 2, // Example value, this would need to be calculated or stored
                    });
                });
            } else {
                 log.push({
                    date: cls.startDate,
                    activity: `Lead Instructor`,
                    course: cls.name,
                    hours: 8, // Example value
                });
            }
        });

        return log.sort((a, b) => new Date(b.date) - new Date(a.date));

    }, [user, classes, stations]);

    const downloadPdf = () => {
        const doc = new jsPDF();
        doc.text(`Instructional Log for: ${user.firstName} ${user.lastName}`, 14, 16);
        
        const tableColumn = ["Date", "Course", "Activity", "Hours"];
        const tableRows = [];

        instructionalLogData.forEach(record => {
            const rowData = [
                record.date,
                record.course,
                record.activity,
                record.hours
            ];
            tableRows.push(rowData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`instructional_log_${user.lastName}.pdf`);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Instructional Log</h2>
                <button 
                    onClick={downloadPdf} 
                    disabled={instructionalLogData.length === 0}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-hover disabled:bg-gray-400"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                </button>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {instructionalLogData.map((record, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.course}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.activity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.hours}</td>
                            </tr>
                        ))}
                         {instructionalLogData.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                                    You have no instructional history recorded.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstructionalLog;