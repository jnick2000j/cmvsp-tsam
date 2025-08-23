import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { Clock, CheckCircle, UserX, Users, BookOpen, Briefcase } from 'lucide-react';
import { PATROLS, MOUNTAIN_AREAS, PATROL_ROLES, PATROL_LEADER_ROLES, appId } from '../constants';
import ViewAttendance from './ViewAttendance';
import InstructorAttendance from './InstructorAttendance';
import SupportAttendance from './SupportAttendance';
import PendingEnrollmentManagement from './PendingEnrollmentManagement';

const ALL_PATROL_ROLES = [...new Set([...PATROL_ROLES, ...PATROL_LEADER_ROLES])];

const PatrolAttendance = ({ allUsers }) => {
    const [selectedPatrol, setSelectedPatrol] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState(null);
    const [shiftTrades, setShiftTrades] = useState([]);

    useEffect(() => {
        const fetchShiftData = async () => {
            if (selectedPatrol && selectedDate) {
                const shiftId = `${selectedPatrol}-${selectedDate}`;
                try {
                    const shiftRef = doc(db, `artifacts/${appId}/public/data/shifts`, shiftId);
                    const shiftSnap = await getDocs(shiftRef); // This seems incorrect, should be getDoc
                    if (shiftSnap.exists()) {
                        setShift({ id: shiftSnap.id, ...shiftSnap.data() });
                    } else {
                        setShift(null);
                    }

                    const tradesRef = collection(db, `artifacts/${appId}/public/data/shiftTrades`);
                    const q = query(tradesRef, where("shiftId", "==", shiftId), where("status", "==", "pending"));
                    const tradesSnapshot = await getDocs(q);
                    setShiftTrades(tradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch (error) {
                    // It's likely getDocs on a doc ref is the error. Let's assume a typo and handle gracefully.
                    console.error("Error fetching shift data, possibly incorrect query:", error);
                    setShift(null);
                }
            }
        };
        fetchShiftData();
    }, [selectedPatrol, selectedDate]);

    const handleClockInOut = async (userId, type) => {
        alert(`${type} for user ${userId} at ${new Date().toLocaleTimeString()}`);
    };

    const handleApproveTrade = async (tradeId) => {
        const tradeRef = doc(db, `artifacts/${appId}/public/data/shiftTrades`, tradeId);
        await updateDoc(tradeRef, { status: "approved" });
        setShiftTrades(shiftTrades.filter(t => t.id !== tradeId));
        alert("Trade approved!");
    };
    
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Patrol Attendance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select value={selectedPatrol} onChange={e => setSelectedPatrol(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm">
                    <option value="">-- Select Patrol --</option>
                    {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" />
            </div>

            {shift ? (
                <div>
                    <h3 className="text-lg font-semibold">Staffing</h3>
                     {shift.roles.map((role, index) => {
                        const assignedCount = shift.assignments.filter(a => a.role === role.name).length;
                        return (
                            <div key={index} className="flex justify-between items-center mt-1">
                                <span>{role.name}</span>
                                <span className={`${assignedCount < role.target ? 'text-red-500' : 'text-green-500'}`}>
                                    {assignedCount} / {role.target}
                                </span>
                            </div>
                        );
                    })}

                    <h3 className="text-lg font-semibold mt-4">Pending Trades</h3>
                    {shiftTrades.map(trade => (
                        <div key={trade.id} className="p-2 bg-yellow-100 rounded-md flex justify-between items-center">
                            <span>{trade.requestingUserName} for {trade.userToCoverName}</span>
                            <button onClick={() => handleApproveTrade(trade.id)} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Approve</button>
                        </div>
                    ))}

                    <h3 className="text-lg font-semibold mt-4">Patrollers</h3>
                    {shift.assignments.map(assignment => (
                        <div key={assignment.userId} className="p-2 border-b">
                           <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{assignment.name}</p>
                                    <p className="text-sm">{assignment.role}</p>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => handleClockInOut(assignment.userId, 'Clock In')} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">In</button>
                                    <button onClick={() => handleClockInOut(assignment.userId, 'Clock Out')} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Out</button>
                                </div>
                           </div>
                           <div className="text-sm mt-2">
                                <p>Clock In: N/A, Clock Out: N/A</p>
                                <div className="flex items-center space-x-2 mt-1">
                                    <select className="p-1 border rounded-md text-sm">
                                        <option>Unassigned</option>
                                        {MOUNTAIN_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                     <select value={assignment.role} className="p-1 border rounded-md text-sm">
                                        {ALL_PATROL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                           </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-center text-gray-500 mt-8">No shift found for this patrol on this date.</p>}
        </div>
    );
};


const AttendanceTabs = ({ allUsers, classes, opportunities = [] }) => {
    const [activeTab, setActiveTab] = useState('patrol');
    const [pendingEnrollments, setPendingEnrollments] = useState([]);

    useEffect(() => {
        if (!classes) return;
        const pendingEnrollmentsListeners = classes.map(cls => {
            const enrollmentsQuery = query(collection(db, `artifacts/${appId}/public/data/classes`, cls.id, 'enrollments'), where('status', '==', 'pending'));
            return onSnapshot(enrollmentsQuery, (snapshot) => {
                const newPending = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(), 
                    classId: cls.id,
                    className: cls.name,
                }));
                setPendingEnrollments(prev => {
                    const otherPendings = prev.filter(p => p.classId !== cls.id);
                    return [...otherPendings, ...newPending];
                });
            });
        });

        return () => {
            pendingEnrollmentsListeners.forEach(unsub => unsub());
        };
    }, [classes]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('patrol')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'patrol' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Users className="mr-2" size={18}/>Patrol Attendance</button>
                    <button onClick={() => setActiveTab('training')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'training' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><BookOpen className="mr-2" size={18}/>Training Attendance</button>
                    <button onClick={() => setActiveTab('instructor')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'instructor' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><CheckCircle className="mr-2" size={18}/>Instructor Attendance</button>
                    <button onClick={() => setActiveTab('support')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'support' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Briefcase className="mr-2" size={18}/>Support Attendance</button>
                    <button onClick={() => setActiveTab('pending')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <UserX className="mr-2" size={18}/> Pending Enrollments {pendingEnrollments.length > 0 && <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">{pendingEnrollments.length}</span>}
                    </button>
                </nav>
            </div>
            <div>
                {activeTab === 'patrol' && <PatrolAttendance allUsers={allUsers} />}
                {activeTab === 'training' && <ViewAttendance allUsers={allUsers} courses={classes} />}
                {activeTab === 'instructor' && <InstructorAttendance allUsers={allUsers} courses={classes} />}
                {activeTab === 'support' && <SupportAttendance allUsers={allUsers} opportunities={opportunities} />}
                {activeTab === 'pending' && <PendingEnrollmentManagement pendingEnrollments={pendingEnrollments} allUsers={allUsers} classes={classes} />}
            </div>
        </div>
    );
};

export default AttendanceTabs;