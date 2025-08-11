// src/components/AttendanceTabs.js
import React, { useState } from 'react';
import ClassAttendance from './ClassAttendance';
import PatrolAttendance from './PatrolAttendance';
import SupportAttendance from './SupportAttendance';
import InstructorAttendance from './InstructorAttendance';
import PendingEnrollments from './PendingEnrollments';
import PendingWaiverApprovals from './PendingWaiverApprovals'; // Import the new component for waivers

const AttendanceTabs = ({ currentUser, classes }) => {
    const [activeTab, setActiveTab] = useState('class');

    // This definition array controls which tabs are available and to whom.
    const tabs = [
        { id: 'class', label: 'Class Attendance', component: <ClassAttendance />, roles: ['Student', 'Instructor', 'Admin'] },
        { id: 'patrol', label: 'Patrol Attendance', component: <PatrolAttendance />, roles: ['Patroller', 'Admin'] },
        { id: 'support', label: 'Support Attendance', component: <SupportAttendance />, roles: ['Support', 'Admin'] },
        { id: 'instructor', label: 'Instructor Attendance', component: <InstructorAttendance />, roles: ['Instructor', 'Admin'] },
        { id: 'pending', label: 'Pending Enrollments', component: <PendingEnrollments currentUser={currentUser} classes={classes} />, roles: ['Instructor', 'Admin'] },
        // NEW: Add the Pending Waiver Approvals tab, visible only to specific roles
        { id: 'pending_waivers', label: 'Pending Waivers', component: <PendingWaiverApprovals currentUser={currentUser} />, roles: ['Instructor', 'Admin'] }
    ];

    // Filter tabs based on the current user's roles
    const visibleTabs = tabs.filter(tab => 
        currentUser.isAdmin || (tab.roles && tab.roles.some(role => currentUser.roles?.includes(role)))
    );

    const renderContent = () => {
        const activeTabData = visibleTabs.find(tab => tab.id === activeTab);
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