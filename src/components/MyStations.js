// src/components/MyStations.js
import React, { useMemo } from 'react';
import { Clock, Users, Check, X } from 'lucide-react';

const MyStations = ({ user, stations, classes, checkIns, handleApproval, handleOpenSkillsModal }) => {
    const myStations = useMemo(() => {
        if (!user || !user.assignments) return [];
        return stations.filter(station => user.assignments[station.id]);
    }, [user, stations]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Assigned Stations</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myStations.length > 0 ? myStations.map(station => {
                    const pendingCheckIns = checkIns.filter(c => c.stationId === station.id && c.status === 'pending');
                    const activeCheckIns = checkIns.filter(c => c.stationId === station.id && c.status === 'checkedIn');
                    const className = classes.find(c => c.id === station.classId)?.name || 'Unknown Class';
                    const canManageStation = user.isAdmin || (user.assignments && user.assignments[station.id]);

                    return (
                        <div key={station.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                            <div className="p-5 border-b bg-gray-50 flex-grow">
                                <h3 className="text-lg font-bold text-gray-800">{station.name}</h3>
                                <p className="text-sm text-gray-500">{className}</p>
                                <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <Clock className="h-4 w-4 mr-1.5 text-yellow-500" />
                                    <span>{pendingCheckIns.length} Pending</span>
                                    <span className="mx-2">·</span>
                                    <Users className="h-4 w-4 mr-1.5 text-green-500" />
                                    <span>{activeCheckIns.length} Active</span>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col space-y-4">
                                {pendingCheckIns.length > 0 && (
                                    <div className="border border-yellow-200 rounded-lg overflow-hidden">
                                        <div className="bg-yellow-50 p-3 font-semibold text-sm text-yellow-800">Pending Check-in Requests</div>
                                        <ul className="divide-y divide-yellow-200">
                                            {pendingCheckIns.map(p => (
                                                <li key={p.id} className="flex justify-between items-center p-3">
                                                    <span className="text-sm text-gray-700">{p.userName}</span>
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => handleApproval(p.id, true)} disabled={!canManageStation} className="p-1.5 text-green-600 hover:bg-green-100 rounded-full disabled:text-gray-300">
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleApproval(p.id, false)} disabled={!canManageStation} className="p-1.5 text-red-600 hover:bg-red-100 rounded-full disabled:text-gray-300">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {activeCheckIns.length > 0 && (
                                    <div className="border border-green-200 rounded-lg overflow-hidden">
                                        <div className="bg-green-50 p-3 font-semibold text-sm text-green-800">Active Students</div>
                                        <ul className="divide-y divide-green-200">
                                            {activeCheckIns.map(a => (
                                                <li key={a.id} className="flex justify-between items-center p-3">
                                                    <span className="text-sm text-gray-700">{a.userName}</span>
                                                    <button onClick={() => handleOpenSkillsModal(a)} disabled={!canManageStation} className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:bg-gray-200 disabled:text-gray-500">
                                                        Manage Skills
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {pendingCheckIns.length === 0 && activeCheckIns.length === 0 && (
                                    <p className="text-center text-sm text-gray-500 py-4">No students at this station.</p>
                                )}
                            </div>
                        </div>
                    );
                }) : <p className="text-gray-500">You are not currently assigned to any stations.</p>}
            </div>
        </div>
    );
};

export default MyStations;
