// src/components/AttendanceTabs.js
import React, { useState } from 'react';
import ClassAttendance from './ClassAttendance';
import PatrolAttendance from './PatrolAttendance';
import SupportAttendance from './SupportAttendance';
import InstructorAttendance from './InstructorAttendance';
import PendingEnrollments from './PendingEnrollments';
import PendingWaiverApprovals from './PendingWaiverApprovals';

const AttendanceTabs = ({ currentUser, classes }) => {
    const [activeTab, setActiveTab] = useState('class');

    // This definition array controls which tabs are available and to whom.
    // THE FIX: Pass the required props (currentUser, classes) to ALL child components.
    const tabs = [
        { id: 'class', label: 'Class Attendance', component: <ClassAttendance currentUser={currentUser} classes={classes} />, roles: ['Student', 'Instructor', 'Admin'] },
        { id: 'patrol', label: 'Patrol Attendance', component: <PatrolAttendance currentUser={currentUser} />, roles: ['Patroller', 'Admin'] },
        { id: 'support', label: 'Support Attendance', component: <SupportAttendance currentUser={currentUser} />, roles: ['Support', 'Admin'] },
        { id: 'instructor', label: 'Instructor Attendance', component: <InstructorAttendance currentUser={currentUser} classes={classes} />, roles: ['Instructor', 'Admin'] },
        { id: 'pending', label: 'Pending Enrollments', component: <PendingEnrollments currentUser={currentUser} classes={classes} />, roles: ['Instructor', 'Admin'] },
        { id: 'pending_waivers', label: 'Pending Waivers', component: <PendingWaiverApprovals currentUser={currentUser} />, roles: ['Instructor', 'Admin'] }
    ];

    // Filter tabs based on the current user's roles
    const visibleTabs = tabs.filter(tab => 
        currentUser.isAdmin || (tab.roles && tab.roles.some(role => currentUser.roles?.includes(role)))
    );

    const renderContent = () => {
        // Find the active tab from the list of VISIBLE tabs
        const activeTabData = visibleTabs.find(tab => tab.id === activeTab);
        // If the active tab is not in the visible list (e.g., after a role change), default to the first visible tab
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
