import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';
import EnrolledStudentDetailsModal from './EnrolledStudentDetailsModal';
import { X } from 'lucide-react';

const ClassRosterModal = ({ isOpen, onClose, classToView, allUsers, waivers }) => {
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [enrollmentDetails, setEnrollmentDetails] = useState(null);

    useEffect(() => {
        if (isOpen && classToView) {
            const fetchEnrollments = async () => {
                const enrollmentsRef = collection(db, `artifacts/${appId}/public/data/classes`, classToView.id, 'enrollments');
                const snapshot = await getDocs(enrollmentsRef);
                const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const studentList = allUsers.filter(user => enrollments.some(e => e.id === user.id));
                setEnrolledStudents(studentList.map(student => ({
                    ...student,
                    enrollmentData: enrollments.find(e => e.id === student.id)
                })));
            };
            fetchEnrollments();
        }
    }, [isOpen, classToView, allUsers]);

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setEnrollmentDetails(student.enrollmentData);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">Class Roster: {classToView.name}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                            {enrolledStudents.map(student => (
                                <li key={student.id} className="py-3 flex justify-between items-center">
                                    <span className="font-medium">{student.firstName} {student.lastName}</span>
                                    <button onClick={() => handleViewDetails(student)} className="text-sm text-indigo-600 hover:text-indigo-800">
                                        View Details
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {enrolledStudents.length === 0 && <p className="text-center text-gray-500">No students are enrolled in this class.</p>}
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-white border rounded-md text-sm font-medium">Close</button>
                    </div>
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

export default ClassRosterModal;