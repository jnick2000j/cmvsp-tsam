import React, { useState } from 'react';
import CreateIndividualShift from './CreateIndividualShift';
import ShiftTemplateBuilder from './ShiftTemplateBuilder';

const ShiftManagement = ({ currentUser, allUsers, patrols }) => {
    const [activeTab, setActiveTab] = 'create');

    const tabClass = (tabName) =>
        `px-4 py-2 font-medium text-sm rounded-t-lg ${
            activeTab === tabName
                ? 'border-b-2 border-accent text-accent bg-accent/10'
                : 'text-gray-500 hover:text-gray-700'
        }`;

    return (
        // The main h1 title has been removed from this component
        <div className="p-4 sm:p-6">
            <div className="flex border-b border-gray-200">
                <button className={tabClass('create')} onClick={() => setActiveTab('create')}>
                    Create Individual Shifts
                </button>
                <button className={tabClass('templates')} onClick={() => setActiveTab('templates')}>
                    Templates
                </button>
            </div>

            <div className="mt-6">
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
