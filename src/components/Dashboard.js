// src/components/Dashboard.js
import React, { useMemo } from 'react';
import { LogOut, UserCheck, CheckCircle, XCircle } from 'lucide-react'; // Added icons
import PendingActions from './PendingActions';

const Dashboard = ({
    user,
    isInstructor,
    isStudent,
    enrolledClassesDetails,
    dailyCheckIns,
    handlePrerequisiteCheckin,
    handleCancelEnrollment,
    setActiveClassId,
    myAssignments,
    classes,
    paginatedPendingActions,
    handleApproveAction,
    handleDenyAction,
    setPendingActionsPage,
    pendingActionsPage,
    allPendingActions,
    timeClockEntries,
    allUsers,
    isPatrolLeadership,
    usersForApproval,
    onApproveUser,
    // --- Updated props for multi-step shift trading ---
    shiftTradeRequests,
    onApproveShiftTrade,      // Final leadership approval
    onUserApproveShiftTrade,  // Second user's approval
    onDenyShiftTrade,         // Deny/cancel handler
}) => {

    const todayISO = new Date().toISOString().split('T')[0];

    const activeEntries = useMemo(() => timeClockEntries.filter(e => e.clockOutTime === null), [timeClockEntries]);

    const getUserName = (userId) => {
        const userFound = allUsers.find(u => u.id === userId);
        return userFound ? `${userFound.firstName} ${userFound.lastName}` : 'Guest';
    };

    const roleCounts = useMemo(() => activeEntries.reduce((acc, entry) => {
        const userFound = allUsers.find(u => u.id === entry.userId);
        const role = userFound ? userFound.ability : 'Guest Patroller';
        if (role) acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {}), [activeEntries, allUsers]);

    const areaCounts = useMemo(() => activeEntries.reduce((acc, entry) => {
        acc[entry.area] = (acc[entry.area] || 0) + 1;
        return acc;
    }, {}), [activeEntries]);
    
    // --- NEW: Filter requests based on who needs to act ---
    const requestsForMyApproval = useMemo(() => {
        if (!user || !shiftTradeRequests) return [];
        return shiftTradeRequests.filter(req => req.status === 'pending_user_approval' && req.requestedUserId === user.uid);
    }, [shiftTradeRequests, user]);

    const requestsForLeaderApproval = useMemo(() => {
        if (!shiftTradeRequests) return [];
        return shiftTradeRequests.filter(req => req.status === 'pending_leader_approval');
    }, [shiftTradeRequests]);


    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            {isStudent ? (
                <div className="space-y-12">
                    {enrolledClassesDetails.length > 0 ? (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Courses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {enrolledClassesDetails.map(course => {
                                    const todaysCheckIn = dailyCheckIns.find(dc => dc.studentId === user.uid && dc.classId === course.id && dc.checkInDate === todayISO);
                                    const canCancel = (new Date(course.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60) > 24;
                                    return (
                                        <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                                            <div className="p-5 border-b flex-grow">
                                                <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                                                <p className="text-sm text-gray-500">{course.startDate}</p>
                                                {course.studentGroups?.[user.uid] && <p className="text-sm font-semibold text-indigo-600 mt-1">Your Group: Group {course.studentGroups[user.uid]}</p>}
                                            </div>
                                            <div className="p-4 bg-gray-50 border-t space-y-2">
                                                {todaysCheckIn?.status === 'approved' ? (
                                                    <button onClick={() => setActiveClassId(course.id)} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Go to Stations</button>
                                                ) : todaysCheckIn?.status === 'pending' ? (
                                                    <p className="text-center text-sm font-medium text-yellow-700">Check-in Pending</p>
                                                ) : (
                                                    <button onClick={() => handlePrerequisiteCheckin(course)} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Check In for Today</button>
                                                )}
                                                <button onClick={() => handleCancelEnrollment(course.id)} disabled={!canCancel} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                                    <LogOut className="mr-2 h-4 w-4" /> Cancel Enrollment
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
                            <p className="text-gray-500">You are not enrolled in any courses yet. Visit the Course Catalog to get started.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="lg:col-span-3 space-y-8">
                    {isPatrolLeadership && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Patrol Shift Status</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white rounded-xl shadow-lg p-5">
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">Active Roles</h3>
                                    <ul className="space-y-1 text-sm">
                                        {Object.entries(roleCounts).map(([role, count]) => (
                                            <li key={role} className="flex justify-between"><span>{role}:</span><span className="font-semibold">{count}</span></li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white rounded-xl shadow-lg p-5">
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">Area Assignments</h3>
                                    <ul className="space-y-1 text-sm">
                                        {Object.entries(areaCounts).map(([area, count]) => (
                                            <li key={area} className="flex justify-between"><span>{area}:</span><span className="font-semibold">{count}</span></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-5">
                                <h3 className="font-bold text-lg text-gray-800 mb-4">Active Staff ({activeEntries.length})</h3>
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500">Name</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500">Area</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500">Clock In Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {activeEntries.map(entry => (
                                            <tr key={entry.id}>
                                                <td className="px-3 py-2 whitespace-nowrap">{entry.isGuest ? `${entry.name} (Guest)` : getUserName(entry.userId)}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{entry.area}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{new Date(entry.clockInTime.seconds * 1000).toLocaleTimeString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- PENDING ACTIONS SECTION (ADMIN/LEADERSHIP/USER) --- */}
                    {(user.isAdmin || isPatrolLeadership || requestsForMyApproval.length > 0) && (
                         <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Actions</h2>
                            
                            {/* NEW: Section for trades waiting on the current user */}
                            {requestsForMyApproval.length > 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Shift Trades Awaiting Your Approval</h3>
                                    <ul className="divide-y divide-gray-200">
                                        {requestsForMyApproval.map(request => (
                                            <li key={request.id} className="py-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        <span className="font-bold">{request.requesterName}</span> has requested to trade shifts.
                                                    </p>
                                                     <p className="text-sm text-gray-500 mt-1">
                                                        Their Shift: <span className="text-gray-700">{request.requesterShiftInfo}</span>
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        For Your Shift: <span className="text-gray-700">{request.requestedShiftInfo}</span>
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => onUserApproveShiftTrade(request)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1.5"/> Approve
                                                    </button>
                                                     <button
                                                        onClick={() => onDenyShiftTrade(request)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1.5"/> Deny
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* User Approvals (Admin only) */}
                            {user.isAdmin && usersForApproval.length > 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">New User Accounts for Approval</h3>
                                    <ul className="space-y-2">
                                        {usersForApproval.map(u => (
                                            <li key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                                                    <p className="text-sm text-gray-500">{u.email}</p>
                                                </div>
                                                <button onClick={() => onApproveUser(u.id)} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center">
                                                    <UserCheck className="h-4 w-4 mr-1.5"/> Approve
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* MODIFIED: Shift Trade Approvals (Now for Leadership only) */}
                            {isPatrolLeadership && requestsForLeaderApproval.length > 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Shift Trades Awaiting Final Approval</h3>
                                    <ul className="divide-y divide-gray-200">
                                        {requestsForLeaderApproval.map(request => (
                                            <li key={request.id} className="py-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Trade between <span className="font-bold">{request.requesterName}</span> and <span className="font-bold">{request.requestedUserName}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">Both parties have approved.</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => onApproveShiftTrade(request)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1.5"/> Finalize
                                                    </button>
                                                     <button
                                                        onClick={() => onDenyShiftTrade(request)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1.5"/> Deny
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Other Pending Actions (Admin only) */}
                            {user.isAdmin && (
                                <PendingActions
                                    actions={paginatedPendingActions}
                                    onApprove={handleApproveAction}
                                    onDeny={handleDenyAction}
                                    onNext={() => setPendingActionsPage(p => p + 1)}
                                    onPrev={() => setPendingActionsPage(p => p - 1)}
                                    hasNext={ (pendingActionsPage + 1) * 5 < allPendingActions.length}
                                    hasPrev={pendingActionsPage > 0}
                                />
                            )}
                        </div>
                    )}

                    {myAssignments.length > 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-5">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">My Training Assignments</h3>
                            <ul className="space-y-2">
                                {myAssignments.map(assignment => (
                                        <li key={assignment.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-800">{assignment.name}</p>
                                                <p className="text-sm text-gray-500">{assignment.type === 'station' ? classes.find(c => c.id === assignment.classId)?.name : 'Class Lead'}</p>
                                            </div>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
