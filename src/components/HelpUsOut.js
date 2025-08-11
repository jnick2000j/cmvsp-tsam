import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { appId } from '../constants';

const HelpUsOut = ({ currentUser, users, shifts, courses }) => {
    const [activeTab, setActiveTab] = useState('openShifts');

    const openShifts = useMemo(() => {
        const openShiftRoles = [];
        if (shifts) {
            shifts.forEach(shift => {
                if (shift.roles) {
                    shift.roles.forEach(role => {
                        const assignedCount = shift.assignments ? shift.assignments.filter(a => a.role === role.name).length : 0;
                        const openSpots = role.target - assignedCount;
                        if (openSpots > 0) {
                            openShiftRoles.push({
                                shiftId: shift.id,
                                date: shift.date.toDate(), // Convert Firestore timestamp to Date
                                patrol: shift.patrolId,
                                role: role.name,
                                openSpots,
                            });
                        }
                    });
                }
            });
        }
        return openShiftRoles;
    }, [shifts]);

    const trainingNeeds = useMemo(() => {
        const neededTrainingRoles = [];
        if (courses) {
            courses.forEach(course => {
                const assignedInstructors = course.instructors ? course.instructors.length : 0;
                const instructorSpots = (course.instructorTarget || 1) - assignedInstructors;
                if (instructorSpots > 0) {
                    neededTrainingRoles.push({
                        courseId: course.id,
                        courseName: course.name,
                        role: 'Instructor',
                        openSpots: instructorSpots,
                    });
                }
            });
        }
        return neededTrainingRoles;
    }, [courses]);

    const handleShiftSignUp = async (shift) => {
        if (!currentUser) {
            alert("You must be logged in to sign up.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/shiftSignups`), {
                userId: currentUser.uid,
                userName: `${currentUser.firstName} ${currentUser.lastName}`,
                shiftId: shift.shiftId,
                role: shift.role,
                status: 'pending',
                requestDate: serverTimestamp(),
            });
            alert(`You have requested to sign up for ${shift.role} on ${shift.date.toLocaleDateString()}. Your request is pending approval.`);
        } catch (error) {
            console.error("Error signing up for shift: ", error);
            alert("There was an error with your request. Please try again.");
        }
    };

    const handleTrainingSignUp = async (need) => {
        if (!currentUser) {
            alert("You must be logged in to sign up.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/trainingSignups`), {
                userId: currentUser.uid,
                userName: `${currentUser.firstName} ${currentUser.lastName}`,
                courseId: need.courseId,
                role: need.role,
                status: 'pending',
                requestDate: serverTimestamp(),
            });
            alert(`You have requested to be an ${need.role} for ${need.courseName}. Your request is pending approval.`);
        } catch (error) {
            console.error("Error signing up for training role: ", error);
            alert("There was an error with your request. Please try again.");
        }
    };


    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Help Us Out!</h1>
            <div className="flex border-b mb-4">
                <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'openShifts' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('openShifts')}
                >
                    Open Shifts
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'trainingNeeds' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('trainingNeeds')}
                >
                    Training Needs
                </button>
            </div>

            {activeTab === 'openShifts' && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">Open Patrol Shifts</h2>
                    <div className="space-y-3">
                        {openShifts.length > 0 ? openShifts.map((shift, index) => (
                            <div key={index} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{shift.patrol} - {shift.role}</p>
                                    <p className="text-sm text-gray-600">{shift.date.toLocaleDateString()}</p>
                                    <p className="text-sm font-semibold text-green-600">{shift.openSpots} spot(s) open</p>
                                </div>
                                <button
                                    onClick={() => handleShiftSignUp(shift)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )) : <p>No open shifts at the moment. Check back later!</p>}
                    </div>
                </div>
            )}

            {activeTab === 'trainingNeeds' && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">Training Support Needs</h2>
                     <div className="space-y-3">
                        {trainingNeeds.length > 0 ? trainingNeeds.map((need, index) => (
                            <div key={index} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{need.courseName}</p>
                                    <p className="text-sm text-gray-600">Needed: {need.role}</p>
                                    <p className="text-sm font-semibold text-green-600">{need.openSpots} spot(s) open</p>
                                </div>
                                <button
                                    onClick={() => handleTrainingSignUp(need)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )) : <p>No training support needs at the moment. Check back later!</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpUsOut;