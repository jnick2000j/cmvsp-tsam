import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';
import { Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import EnrolledStudentDetailsModal from './EnrolledStudentDetailsModal';

const ViewAttendance = ({ courses, allUsers, waivers }) => {
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [enrollmentDetails, setEnrollmentDetails] = useState(null);

    const classOptions = useMemo(() => {
        return courses.map(c => ({ value: c.id, label: c.name }));
    }, [courses]);

    useEffect(() => {
        if (selectedCourseId) {
            const enrollmentsRef = collection(db, `artifacts/${appId}/public/data/classes`, selectedCourseId, 'enrollments');
            const q = query(enrollmentsRef, where('status', '==', 'approved'));
            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const studentData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const studentList = allUsers
                    .filter(user => studentData.some(e => e.id === user.id))
                    .map(student => ({
                        ...student,
                        enrollmentData: studentData.find(e => e.id === student.id)
                    }));

                setEnrolledStudents(studentList);
            });
            return () => unsubscribe();
        } else {
            setEnrolledStudents([]);
        }
    }, [selectedCourseId, allUsers]);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return enrolledStudents;
        const lowercasedFilter = searchTerm.toLowerCase();
        return enrolledStudents.filter(student => 
            `${student.firstName} ${student.lastName}`.toLowerCase().includes(lowercasedFilter) ||
            student.email.toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, enrolledStudents]);

    const handleViewDetails = async (student) => {
        setSelectedStudent(student);
        setEnrollmentDetails(student.enrollmentData);
    };

    const downloadPdf = () => {
        const selectedClass = courses.find(c => c.id === selectedCourseId);
        if (!selectedClass) return;

        const doc = new jsPDF();
        doc.text(`Class Roster for: ${selectedClass.name}`, 14, 16);
        
        const tableColumn = ["Name", "Email", "Phone"];
        const tableRows = [];

        filteredStudents.forEach(student => {
            const rowData = [
                `${student.firstName} ${student.lastName}`,
                student.email,
                student.phone || 'N/A'
            ];
            tableRows.push(rowData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`roster_${selectedClass.name.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">View Class Roster & Attendance</h2>
                    <button 
                        onClick={downloadPdf} 
                        disabled={!selectedCourseId || filteredStudents.length === 0}
                        className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download Roster
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                     <select 
                        value={selectedCourseId} 
                        onChange={(e) => setSelectedCourseId(e.target.value)}
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
                            disabled={!selectedCourseId}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {selectedCourseId ? filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                        <button onClick={() => handleViewDetails(student)} className="text-indigo-600 hover:text-indigo-900">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Please select a class to view the roster.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <EnrolledStudentDetailsModal
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                student={selectedStudent}
                waivers={waivers}
                enrollmentDetails={enrollmentDetails}
            />
        </>
    );
};

export default ViewAttendance;