import React, { useMemo } from 'react';

/**
 * A dedicated component to display only the current user's scheduled shifts.
 */
const MyScheduledShifts = ({ user, allUsers, shifts }) => {
    
    const getUserName = (userId) => {
        if (!Array.isArray(allUsers)) return 'N/A';
        const userFound = allUsers.find(u => u.id === userId);
        return userFound ? `${userFound.firstName} ${userFound.lastName}` : 'N/A';
    };

    const myScheduledShifts = useMemo(() => {
        if (!Array.isArray(shifts) || !user?.id) return [];
        
        return shifts.filter(shift => {
            const isAssigned = shift.assignments?.some(a => a.userId === user.id);
            const isLeader = shift.leaderId === user.id || shift.assistantLeaderId === user.id;
            return isAssigned || isLeader;
        });
    }, [shifts, user?.id]);

    return (
        <div>
            {myScheduledShifts.map(shift => (
                <div key={shift.id} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                    <div className="p-5 bg-gray-50 border-b">
                        <h3 className="text-lg font-bold text-gray-800">{new Date(shift.date).toDateString()} - {shift.type}</h3>
                        <p className="text-sm text-gray-600">Patrol: {shift.patrol}</p>
                        <p className="text-sm text-gray-600">Leader: {getUserName(shift.leaderId)}, Assistant: {getUserName(shift.assistantLeaderId)}</p>
                    </div>
                </div>
            ))}
            {myScheduledShifts.length === 0 && <p>You are not signed up for any upcoming shifts.</p>}
        </div>
    );
};

export default MyScheduledShifts;