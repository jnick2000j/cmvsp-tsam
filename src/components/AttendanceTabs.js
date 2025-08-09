// src/components/AttendanceTabs.js
import React from 'react';
import { Users, GraduationCap, UserRoundCheck } from 'lucide-react';
import CheckInOutPortal from './CheckInOutPortal';
import AttendanceTable from './AttendanceTable';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES } from '../constants';
import InstructorAttendance from './InstructorAttendance';
import SupportAttendance from './SupportAttendance';

const AttendanceTabs = ({ user, allUsers, classes, stations, attendanceRecords, subView, setSubView }) => {
    
    const authorizedClasses = classes.filter(c => !c.isCompleted);

    const renderSubView = () => {
        switch (subView) {
            case 'participantAttendance':
                return <AttendanceTable
                    title="Participant Attendance"
                    description="A log of all student check-in and check-out times for relevant classes and stations."
                    records={attendanceRecords.filter(r => allUsers.find(u => u.id === r.userId)?.role === 'Student')}
                    currentUser={user}
                    allUsers={allUsers}
                    classes={classes}
                    stations={stations}
                />;
            case 'instructorAttendance':
                return <InstructorAttendance classes={classes} allUsers={allUsers} attendanceRecords={attendanceRecords} stations={stations} />;
            case 'supportAttendance':
                return <SupportAttendance classes={classes} allUsers={allUsers} attendanceRecords={attendanceRecords} stations={stations} />;
            case 'checkInOut':
            default:
                 return <CheckInOutPortal user={user} classes={authorizedClasses} allUsers={allUsers} attendanceRecords={attendanceRecords} stations={stations} />;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setSubView('checkInOut')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'checkInOut' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><UserRoundCheck className="mr-2" size={18}/> Class Check In/Out</button>
                    <button onClick={() => setSubView('participantAttendance')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'participantAttendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Users className="mr-2" size={18}/> Participant Attendance</button>
                    <button onClick={() => setSubView('instructorAttendance')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'instructorAttendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><GraduationCap className="mr-2" size={18}/> Instructor Attendance</button>
                    <button onClick={() => setSubView('supportAttendance')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'supportAttendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Users className="mr-2" size={18}/> Support Attendance</button>
                </nav>
            </div>
            {renderSubView()}
        </div>
    );
};

export default AttendanceTabs;