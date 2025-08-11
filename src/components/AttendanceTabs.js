import React, { useState } from 'react';
import ClassAttendance from './ClassAttendance';
import PatrolAttendance from './PatrolAttendance';

const AttendanceTabs = ({ user, allUsers, classes, stations, shifts, dailyCheckIns, handleClassCheckIn, handleClassCheckOut, handleShiftCheckIn, handleShiftCheckOut }) => {
    const [activeTab, setActiveTab] = useState('class');

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('class')}
                        className={`${
                            activeTab === 'class'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Class Check in & Out
                    </button>
                    <button
                        onClick={() => setActiveTab('patrol')}
                        className={`${
                            activeTab === 'patrol'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Patrol Check in & Out
                    </button>
                </nav>
            </div>
            <div className="mt-6">
                {activeTab === 'class' && (
                    <ClassAttendance
                        currentUser={user}
                        users={allUsers}
                        classes={classes}
                        stations={stations}
                        dailyCheckIns={dailyCheckIns}
                        handleClassCheckIn={handleClassCheckIn}
                        handleClassCheckOut={handleClassCheckOut}
                    />
                )}
                {activeTab === 'patrol' && (
                    <PatrolAttendance
                        currentUser={user}
                        users={allUsers}
                        shifts={shifts}
                        handleShiftCheckIn={handleShiftCheckIn}
                        handleShiftCheckOut={handleShiftCheckOut}
                    />
                )}
            </div>
        </div>
    );
};

export default AttendanceTabs;