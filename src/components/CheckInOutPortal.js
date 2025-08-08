// src/components/CheckInOutPortal.js
import React from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId, INSTRUCTOR_ROLES, SUPPORT_ROLES } from '../constants';
import { UserRoundCheck, UserRoundMinus } from 'lucide-react';

const CheckInOutPortal = ({ user, classes, allUsers, attendanceRecords }) => {

    const handleCheckInOut = async (personId, classId, personRole, personName) => {
        if (!user || !db) return;

        const activeRecord = attendanceRecords.find(r => r.userId === personId && r.classId === classId && !r.checkOutTime);

        try {
            if (activeRecord) {
                const recordRef = doc(db, `artifacts/${appId}/public/data/attendanceRecords`, activeRecord.id);
                await updateDoc(recordRef, {
                    checkOutTime: new Date(),
                    checkOutBy: user.uid,
                    checkOutByName: `${user.firstName} ${user.lastName}`
                });
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/attendanceRecords`), {
                    userId: personId,
                    userName: personName,
                    userRole: personRole,
                    classId: classId,
                    checkInTime: new Date(),
                    checkOutTime: null,
                    checkInBy: user.uid,
                    checkInByName: `${user.firstName} ${user.lastName}`
                });
            }
        } catch (error) {
            console.error("Error checking in/out:", error);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Class Check-in & Check-out</h1>
            {classes.length > 0 ? (
                <div className="space-y-8">
                    {classes.map(cls => {
                        const members = allUsers.filter(u => u.enrolledClasses?.includes(cls.id) || INSTRUCTOR_ROLES.includes(u.role) || SUPPORT_ROLES.includes(u.role));

                        return (
                            <div key={cls.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="p-5 bg-gray-50 border-b">
                                    <h3 className="text-lg font-bold text-gray-800">{cls.name}</h3>
                                </div>
                                <div className="p-5">
                                    <ul className="divide-y divide-gray-200">
                                        {members.map(member => {
                                            const activeRecord = attendanceRecords.find(r => r.userId === member.id && r.classId === cls.id && !r.checkOutTime);
                                            const isCheckedIn = !!activeRecord;
                                            const role = member.role;

                                            return (
                                                <li key={member.id} className="flex justify-between items-center py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                                                        <p className="text-sm text-gray-500">{role}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {isCheckedIn ? 'Checked In' : 'Checked Out'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleCheckInOut(member.id, cls.id, role, `${member.firstName} ${member.lastName}`)}
                                                            className={`px-4 py-2 text-sm font-medium rounded-md text-white ${isCheckedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                                        >
                                                            {isCheckedIn ? <UserRoundMinus className="h-5 w-5" /> : <UserRoundCheck className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-500">You are not authorized to manage attendance for any classes.</p>
            )}
        </div>
    );
};

export default CheckInOutPortal;
