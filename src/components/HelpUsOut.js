import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { appId } from '../constants';

const HelpUsOut = ({ currentUser, users, shifts, courses }) => {
    const [activeTab, setActiveTab] = useState('openShifts');
    const [openShifts, setOpenShifts] = useState([]);
    const [trainingNeeds, setTrainingNeeds] = useState([]);

    useEffect(() => {
        const getOpenings = () => {
            // Open Shifts
            const openShiftRoles = [];
            shifts.forEach(shift => {
                shift.roles.forEach(role => {
                    const assignedCount = shift.assignments.filter(a => a.role === role.name).length;
                    const openSpots = role.target - assignedCount;
                    if (openSpots > 0) {
                        openShiftRoles.push({
                            shiftId: shift.id,
                            date: shift.date,
                            patrol: shift.patrolId,
                            role: role.name,
                            openSpots,
                        });
                    }
                });
            });
            setOpenShifts(openShiftRoles);

            // Training Needs
            const neededTrainingRoles = [];
            courses.forEach(course => {
                // Example for instructor roles, assuming 'instructors' is an array of assigned instructor IDs
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
                // You can add similar logic for support and skill roles
            });
            setTrainingNeeds(neededTrainingRoles);
        };

        getOpenings();
    }, [shifts, courses]);

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
            alert(`You have requested to sign up for ${shift.role} on ${shift.date}. Your request is pending approval.`);
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
                                    <p className="text-sm text-gray-600">{new Date(shift.date).toLocaleDateString()}</p>
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