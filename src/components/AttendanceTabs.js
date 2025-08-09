// src/components/AttendanceTabs.js
import React from 'react';
import { Users, GraduationCap, UserRoundCheck } from 'lucide-react';
import CheckInOutPortal from './CheckInOutPortal';
import AttendanceTable from './AttendanceTable';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES } from '../constants';

const AttendanceTabs = ({ user, allUsers, classes, stations, attendanceRecords, subView, setSubView }) => {
    
    // This filter now correctly shows all non-completed classes to instructors and admins.
    const authorizedClasses = classes.filter(c => !c.isCompleted);

    const renderSubView = () => {
        switch (subView) {
            case 'checkInOut':
                return <CheckInOutPortal user={user} classes={authorizedClasses} allUsers={allUsers} attendanceRecords={attendanceRecords} />;
            case 'participant':
                const participantRecords = attendanceRecords.filter(r => {
                    const recordUser = allUsers.find(u => u.id === r.userId);
                    return recordUser && recordUser.role === 'Student';
                });
                return <AttendanceTable
                    title="Participant Attendance"
                    description="A log of all student check-in and check-out times for relevant classes and stations."
                    records={participantRecords}
                    currentUser={user}
                    allUsers={allUsers}
                    classes={classes}
                    stations={stations}
                />;
            case 'instructional':
                const instructionalRecords = attendanceRecords.filter(r =>
                    INSTRUCTOR_ROLES.includes(r.userRole) || SUPPORT_ROLES.includes(r.userRole) || allUsers.find(u => u.id === r.userId)?.isAdmin
                );
                return <AttendanceTable
                    title="Instructor Attendance"
                    description="A log of all check-in and check-out times for instructors and support staff."
                    records={instructionalRecords}
                    currentUser={user}
                    allUsers={allUsers}
                    classes={classes}
                    stations={stations}
                />;
            default:
                 return <CheckInOutPortal user={user} classes={authorizedClasses} allUsers={allUsers} attendanceRecords={attendanceRecords} />;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setSubView('checkInOut')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'checkInOut' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><UserRoundCheck className="mr-2" size={18}/> Check In & Out</button>
                    <button onClick={() => setSubView('participant')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'participant' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Users className="mr-2" size={18}/> Participant Log</button>
                    <button onClick={() => setSubView('instructional')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'instructional' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><GraduationCap className="mr-2" size={18}/> Instructor Attendance</button>
                </nav>
            </div>
            {renderSubView()}
        </div>
    );
};

export default AttendanceTabs;