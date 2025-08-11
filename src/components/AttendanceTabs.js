import React, { useState } from 'react';
import PendingClassApprovals from './PendingClassApprovals';
import ClassAttendance from './ClassAttendance';

const AttendanceTabs = (props) => {
    const [activeTab, setActiveTab] = useState('approvals');

    const tabs = {
        approvals: { label: 'Pending Class Approvals', component: <PendingClassApprovals {...props} /> },
        checkin: { label: 'Class Check In & Out', component: <ClassAttendance {...props} /> },
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {Object.entries(tabs).map(([id, { label }]) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`${
                                activeTab === id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-4">
                {tabs[activeTab].component}
            </div>
        </div>
    );
};

export default AttendanceTabs;