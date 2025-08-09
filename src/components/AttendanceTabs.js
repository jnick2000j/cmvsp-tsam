// src/components/AttendanceTabs.js
import React from 'react';
import CheckInOutPortal from './CheckInOutPortal';
import ViewAttendance from './ViewAttendance';
import InstructorAttendance from './InstructorAttendance';
import SupportAttendance from './SupportAttendance'; // Import the new component

const AttendanceTabs = ({ user, allUsers, classes, stations, attendanceRecords, subView, setSubView }) => {
    
    const handleTabClick = (view) => {
        setSubView(view);
    };
    
    const renderContent = () => {
        switch (subView) {
            case 'viewAttendance':
                return <ViewAttendance classes={classes} allUsers={allUsers} attendanceRecords={attendanceRecords} stations={stations}/>;
            case 'instructorAttendance':
                return <InstructorAttendance classes={classes} allUsers={allUsers} attendanceRecords={attendanceRecords} stations={stations} />;
            case 'supportAttendance': // Add new case
                return <SupportAttendance classes={classes} allUsers={allUsers} attendanceRecords={attendanceRecords} stations={stations} />;
            case 'checkInOut':
            default:
                return <CheckInOutPortal user={user} allUsers={allUsers} classes={classes} />;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button 
                        onClick={() => handleTabClick('checkInOut')} 
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${subView === 'checkInOut' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Check In/Out
                    </button>
                    <button 
                        onClick={() => handleTabClick('viewAttendance')} 
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${subView === 'viewAttendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Participant Attendance
                    </button>
                    <button 
                        onClick={() => handleTabClick('instructorAttendance')} 
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${subView === 'instructorAttendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Instructor Attendance
                    </button>
                    <button 
                        onClick={() => handleTabClick('supportAttendance')} 
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${subView === 'supportAttendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Support Attendance
                    </button>
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default AttendanceTabs;