import React from 'react';
import MyScheduledShifts from './MyScheduledShifts'; // Use the new, focused component

/**
 * The "My Schedule" tab's main component.
 * It now only shows the user's scheduled shifts.
 */
const MySchedule = ({ currentUser, allUsers, shifts }) => {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4 text-gray-800">My Upcoming Shifts</h1>
            <MyScheduledShifts 
                user={currentUser} 
                allUsers={allUsers} 
                shifts={shifts || []}
            />
        </div>
    );
};

export default MySchedule;