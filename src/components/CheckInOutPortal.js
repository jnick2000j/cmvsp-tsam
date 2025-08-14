// src/components/CheckInOutPortal.js
import React, { useState, useMemo } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId, INSTRUCTOR_ROLES, SUPPORT_ROLES } from '../constants';
import { LogIn, LogOut } from 'lucide-react';

const CheckInOutPortal = ({ user, classes, allUsers, attendanceRecords, stations }) => {
    const [selectedClassId, setSelectedClassId] = useState('');
    const todayISO = new Date().toISOString().split('T')[0];

    const handleManualCheckIn = async (attendee, classId) => {
        const checkInData = {
            userId: attendee.id,
            userRole: attendee.role,
            classId: classId,
            stationId: 'class_check_in', // Generic ID for main class check-in
            checkInDate: todayISO,
            checkInTime: serverTimestamp(),
            status: 'approved', // Manual check-ins are auto-approved
            checkedInBy: user.uid,
        };
        await addDoc(collection(db, `artifacts/${appId}/public/data/attendanceRecords`), checkInData);
    };

    const handleManualCheckOut = async (recordId) => {
        const recordRef = doc(db, `artifacts/${appId}/public/data/attendanceRecords`, recordId);
        await updateDoc(recordRef, {
            checkOutTime: serverTimestamp(),
            checkedOutBy: user.uid,
        });
    };

    const classRoster = useMemo(() => {
        if (!selectedClassId) return null;
        const selectedClass = classes.find(c => c.id === selectedClassId);
        if (!selectedClass) return null;

        const leadInstructor = allUsers.find(u => u.id === selectedClass.leadInstructorId);
        const instructors = allUsers.filter(u => selectedClass.instructors?.includes(u.id));
        const support = allUsers.filter(u => selectedClass.supportNeeds?.some(s => s.assignedUserId === u.id));
        const students = allUsers.filter(u => u.enrolledClasses?.includes(selectedClass.id));

        return { leadInstructor, instructors, support, students };
    }, [selectedClassId, classes, allUsers]);

    const getAttendanceStatus = (userId) => {
        const record = attendanceRecords.find(r => r.userId === userId && r.classId === selectedClassId && r.checkInDate === todayISO && !r.checkOutTime);
        return record;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Class Check In/Out</h2>
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Select a Class to Manage</label>
                <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="mt-1 w-full md:w-1/2 border-gray-300 rounded-md shadow-sm"
                >
                    <option value="">-- Select a Class --</option>
                    {classes.filter(c => !c.isCompleted).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {classRoster && (
                <div className="space-y-6">
                    {/* Instructors Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">Instructors & Support</h3>
                        <ul className="space-y-2">
                            {[classRoster.leadInstructor, ...classRoster.instructors, ...classRoster.support].filter(Boolean).map(person => {
                                const attendanceRecord = getAttendanceStatus(person.id);
                                return (
                                    <li key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{person.firstName} {person.lastName}</p>
                                            <p className="text-xs text-gray-500">{person.role}</p>
                                        </div>
                                        {attendanceRecord ? (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-semibold text-green-600">Checked In</span>
                                                <button onClick={() => handleManualCheckOut(attendanceRecord.id)} className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                                    <LogOut className="inline h-4 w-4 mr-1"/> Check Out
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleManualCheckIn(person, selectedClassId)} className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                                                <LogIn className="inline h-4 w-4 mr-1"/> Check In
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    {/* Students Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">Participants</h3>
                        <ul className="space-y-2">
                            {classRoster.students.map(student => {
                                const attendanceRecord = getAttendanceStatus(student.id);
                                return (
                                    <li key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                                            <p className="text-xs text-gray-500">{student.role}</p>
                                        </div>
                                        {attendanceRecord ? (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-semibold text-green-600">Checked In</span>
                                                <button onClick={() => handleManualCheckOut(attendanceRecord.id)} className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                                    <LogOut className="inline h-4 w-4 mr-1"/> Check Out
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleManualCheckIn(student, selectedClassId)} className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                                                <LogIn className="inline h-4 w-4 mr-1"/> Check In
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckInOutPortal;