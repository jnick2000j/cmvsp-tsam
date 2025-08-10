import React, { useState, useMemo } from 'react';
import { PATROL_ROLES, INSTRUCTOR_ROLES } from '../constants'; // Assuming INSTRUCTOR_ROLES is in constants
import { UserPlus, BookUser } from 'lucide-react';

const HelpUsOut = ({ currentUser, allUsers, shifts, classes, stations }) => {
    // State to manage the active sub-tab view
    const [view, setView] = useState('openShifts'); // 'openShifts' or 'trainingNeeds'

    // --- Open Shifts Logic (Existing) ---
    const openShifts = useMemo(() => {
        if (!Array.isArray(shifts)) return [];
        const openSpots = [];
        shifts.forEach(shift => {
            if (!shift || !Array.isArray(shift.assignments)) return;
            const assignedUserIds = new Set(shift.assignments.map(a => a.userId));
            if (shift.leaderId) assignedUserIds.add(shift.leaderId);
            if (shift.assistantLeaderId) assignedUserIds.add(shift.assistantLeaderId);
            const requiredRoles = new Set(PATROL_ROLES.filter(r => r !== 'Guest Patroller'));
            shift.assignments.forEach(a => requiredRoles.delete(a.role));
            if (!shift.leaderId) requiredRoles.add('Patrol Shift Leader');
            if (!shift.assistantLeaderId) requiredRoles.add('Assistant Patrol Shift Leader');
            if (requiredRoles.size > 0) {
                openSpots.push({ ...shift, openRoles: Array.from(requiredRoles) });
            }
        });
        return openSpots;
    }, [shifts]);

    // --- Training Needs Logic (New) ---
    const trainingNeeds = useMemo(() => {
        if (!currentUser) return [];
        const needs = [];

        const isAdminOrInstructor = currentUser.isAdmin || INSTRUCTOR_ROLES.includes(currentUser.role);

        // 1. Find classes needing instructors
        if (Array.isArray(classes)) {
            classes.forEach(course => {
                if (!course.leadInstructorId) {
                    needs.push({
                        id: `class-${course.id}`,
                        type: 'Class',
                        name: course.name,
                        neededRole: 'Lead Instructor',
                        details: `Requires certification for: ${course.certificationLevel}`
                    });
                }
            });
        }

        // 2. Find stations needing specific roles
        if (Array.isArray(stations)) {
            stations.forEach(station => {
                // Example logic: assume a station needs certain roles if not filled
                // This will depend on your data structure for station role requirements
                // For this example, let's assume a station has a `requiredRoles` array
                if(station.requiredRoles && Array.isArray(station.requiredRoles)) {
                    station.requiredRoles.forEach(role => {
                         needs.push({
                            id: `station-${station.id}-${role}`,
                            type: 'Station',
                            name: station.name,
                            neededRole: role,
                            details: `Fill a needed role at this station.`
                         });
                    });
                }
            });
        }
        
        // 3. Filter needs based on user's training role if they are not an admin/instructor
        if (isAdminOrInstructor) {
            return needs; // Admins/Instructors see all needs
        } else {
            // This logic assumes you have a way to map a user's `trainingRole` to the needs.
            // You'll need to define this mapping. For example:
            const userApplicableRoles = currentUser.trainingRole ? [currentUser.trainingRole, 'Lead Instructor'] : [];
            return needs.filter(need => userApplicableRoles.includes(need.neededRole));
        }

    }, [classes, stations, currentUser]);


    const renderContent = () => {
        if (view === 'openShifts') {
            return (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Open Shifts</h2>
                    <p className="text-gray-600 mb-6">Find an open shift below and sign up to help out!</p>
                     {openShifts.length > 0 ? openShifts.map(shift => (
                        <div key={shift.id} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                            <div className="p-5 bg-gray-50 border-b">
                                <h3 className="text-lg font-bold text-gray-800">{new Date(shift.date).toDateString()} - {shift.type}</h3>
                                <p className="text-sm text-gray-600">Patrol: {shift.patrol}</p>
                            </div>
                            <div className="p-5">
                                <h4 className="font-semibold mb-2">Available Roles:</h4>
                                <ul className="space-y-2">
                                    {shift.openRoles.map(role => (
                                        <li key={role} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                            <span>{role}</span>
                                            <button className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 hover:bg-green-200 flex items-center">
                                                <UserPlus className="h-4 w-4 mr-1"/> Sign Up
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )) : <p>There are no open shifts at this time. Check back later!</p>}
                </div>
            );
        }

        if (view === 'trainingNeeds') {
            return (
                <div>
                     <h2 className="text-xl font-bold text-gray-800 mb-4">Training Needs</h2>
                     <p className="text-gray-600 mb-6">Help us fill crucial instructor and support roles for our training programs.</p>
                     {trainingNeeds.length > 0 ? trainingNeeds.map(need => (
                        <div key={need.id} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                            <div className="p-5">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${need.type === 'Class' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-purple-50 text-purple-700 ring-purple-600/20'}`}>
                                    {need.type}
                                </span>
                                <h3 className="text-lg font-bold text-gray-800 mt-2">{need.name}</h3>
                                <p className="text-sm text-gray-600 font-semibold">Role Needed: {need.neededRole}</p>
                                <p className="text-sm text-gray-500 mt-1">{need.details}</p>
                                <div className="mt-4">
                                     <button className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 hover:bg-green-200 flex items-center">
                                        <BookUser className="h-4 w-4 mr-1"/> Volunteer
                                    </button>
                                </div>
                            </div>
                        </div>
                     )) : <p>There are no specific training needs at this time. Thank you for checking!</p>}
                </div>
            );
        }
        return null;
    };

    const tabClass = (tabName) => 
        `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            view === tabName 
                ? 'border-accent text-accent' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setView('openShifts')} className={tabClass('openShfits')}>
                        Open Shifts
                    </button>
                    <button onClick={() => setView('trainingNeeds')} className={tabClass('trainingNeeds')}>
                        Training Needs
                    </button>
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default HelpUsOut;
