import React, { useState } from 'react';
import CreateIndividualShift from './CreateIndividualShift';
import ShiftTemplateBuilder from './ShiftTemplateBuilder';
import MasterSchedule from './MasterSchedule'; // Import the new component

const ShiftManagement = ({ currentUser, allUsers, patrols }) => {
    const [activeTab, setActiveTab] = useState('master'); // Default to the new Master Schedule

    const tabClass = (tabName) =>
        `px-4 py-2 font-medium text-sm rounded-t-lg ${
            activeTab === tabName
                ? 'border-b-2 border-accent text-accent bg-accent/10'
                : 'text-gray-500 hover:text-gray-700'
        }`;

    return (
        <div className="p-4 sm:p-6">
            <div className="flex border-b border-gray-200">
                {/* NEW: Master Schedule Tab */}
                <button className={tabClass('master')} onClick={() => setActiveTab('master')}>
                    Master Schedule
                </button>
                <button className={tabClass('create')} onClick={() => setActiveTab('create')}>
                    Create Individual Shifts
                </button>
                {/* UPDATED: Renamed Tab */}
                <button className={tabClass('templates')} onClick={() => setActiveTab('templates')}>
                    Shift Templates
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'master' && (
                    <MasterSchedule allUsers={allUsers} patrols={patrols} />
                )}
                {activeTab === 'create' && (
                    <CreateIndividualShift allUsers={allUsers} patrols={patrols} />
                )}
                {activeTab === 'templates' && (
                    <ShiftTemplateBuilder currentUser={currentUser} allUsers={allUsers} patrols={patrols} />
                )}
            </div>
        </div>
    );
};

export default ShiftManagement;
