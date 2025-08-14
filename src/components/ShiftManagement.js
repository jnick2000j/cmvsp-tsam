import React from 'react';
import ShiftCreator from './ShiftCreator'; // Import the new unified component

const ShiftManagement = ({ currentUser, allUsers, patrols }) => {
    return (
        <div className="p-4 sm:p-6">
            {/* The tabs have been removed, and we now render the single creator component */}
            <ShiftCreator
                currentUser={currentUser}
                allUsers={allUsers}
                patrols={patrols}
            />
        </div>
    );
};

export default ShiftManagement;