import React, { useState } from 'react';
import ShiftTemplateBuilder from './ShiftTemplateBuilder';
import CreateIndividualShift from './CreateIndividualShift';

const ShiftManagement = ({ currentUser, allUsers, patrols }) => {
    // The 'schedule' tab has been removed. The default is now 'create'.
    const [activeTab, setActiveTab] = useState('create');

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
                {/* The "Master Schedule" button has been removed from here. */}
                <button className={tabClass('create')} onClick={() => setActiveTab('create')}>
                    Create Individual Shifts
                </button>
                <button className={tabClass('templates')} onClick={() => setActiveTab('templates')}>
                    Templates
                </button>
            </div>

            <div className="mt-6">
                {/* The rendering logic for the 'schedule' tab has been removed. */}
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