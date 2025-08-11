// src/components/AttendanceTabs.js
import React, { useState } from 'react';
import ClassAttendance from './ClassAttendance';
import PatrolAttendance from './PatrolAttendance';
import SupportAttendance from './SupportAttendance';
import InstructorAttendance from './InstructorAttendance';
import PendingEnrollments from './PendingEnrollments';
import PendingWaiverApprovals from './PendingWaiverApprovals';

const AttendanceTabs = ({
    currentUser,
    allUsers,
    classes,
    stations,
    shifts,
    dailyCheckIns,
    timeClockEntries,
    handleClassCheckIn,
    handleClassCheckOut,
    handleShiftCheckIn,
    handleShiftCheckOut
}) => {
    const [activeTab, setActiveTab] = useState('class');

    const tabs = [
        { id: 'class', label: 'Class Attendance', component: <ClassAttendance currentUser={currentUser} classes={classes} allUsers={allUsers} />, roles: ['Student', 'Instructor', 'Admin'] },
        { id: 'patrol', label: 'Patrol Attendance', component: <PatrolAttendance currentUser={currentUser} allUsers={allUsers} shifts={shifts} />, roles: ['Patroller', 'Admin'] },
        { id: 'support', label: 'Support Attendance', component: <SupportAttendance currentUser={currentUser} allUsers={allUsers} opportunities={stations} />, roles: ['Support', 'Admin'] },
        { id: 'instructor', label: 'Instructor Attendance', component: <InstructorAttendance currentUser={currentUser} classes={classes} allUsers={allUsers} />, roles: ['Instructor', 'Admin'] },
        { id: 'pending', label: 'Pending Enrollments', component: <PendingEnrollments currentUser={currentUser} classes={classes} />, roles: ['Instructor', 'Admin'] },
        { id: 'pending_waivers', label: 'Pending Waivers', component: <PendingWaiverApprovals currentUser={currentUser} />, roles: ['Instructor', 'Admin'] }
    ];

    const visibleTabs = tabs.filter(tab => 
        currentUser.isAdmin || (tab.roles && currentUser.roles && tab.roles.some(role => currentUser.roles.includes(role)))
    );

    const renderContent = () => {
        const activeTabData = visibleTabs.find(tab => tab.id === activeTab);
        if (!activeTabData && visibleTabs.length > 0) {
            setActiveTab(visibleTabs[0].id);
            return visibleTabs[0].component;
        }
        return activeTabData ? activeTabData.component : null;
    };

    return (
        <div>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default AttendanceTabs;