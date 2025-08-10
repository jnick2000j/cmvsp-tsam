import React, { useState } from 'react';
import Scheduling from './Scheduling'; // Your existing schedule view component
import ShiftTemplateBuilder from './ShiftTemplateBuilder'; // The template component from before
import CreateIndividualShift from './CreateIndividualShift'; // The new component

const ShiftManagement = ({ currentUser, allUsers, patrols }) => {
    const [activeTab, setActiveTab] = useState('schedule');

    // Helper to render the tab button styles
    const tabClass = (tabName) => 
        `px-4 py-2 font-medium text-sm rounded-t-lg ${
            activeTab === tabName 
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700'
        }`;

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Shift Management</h1>
            <div className="flex border-b border-gray-200">
                <button className={tabClass('schedule')} onClick={() => setActiveTab('schedule')}>
                    Master Schedule
                </button>
                <button className={tabClass('create')} onClick={() => setActiveTab('create')}>
                    Create Individual Shifts
                </button>
                <button className={tabClass('templates')} onClick={() => setActiveTab('templates')}>
                    Templates
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'schedule' && (
                    <Scheduling currentUser={currentUser} allUsers={allUsers} patrols={patrols} />
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