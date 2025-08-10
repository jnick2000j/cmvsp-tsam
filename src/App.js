import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, updateDoc, addDoc, getDocs, where, serverTimestamp, arrayRemove, arrayUnion, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES, PATROL_LEADER_ROLES, appId } from './constants';

// Import All Components
import AuthComponent from './components/AuthComponent';
import AdminPortal from './components/AdminPortal';
import MyStations from './components/MyStations';
import AttendanceTabs from './components/AttendanceTabs';
import CourseCatalog from './components/CourseCatalog';
import ProfileManagement from './components/ProfileManagement';
import CertificateModal from './components/CertificateModal';
import ConfirmationModal from './components/ConfirmationModal';
import Dashboard from './components/Dashboard';
import ShiftManagement from './components/ShiftManagement';
import TimeClock from './components/TimeClock';
import MyTraining from './components/MyTraining';
import Branding from './components/Branding';
import ClassClock from './components/ClassClock';

// --- SCHEDULING COMPONENTS ---
import MySchedule from './components/MySchedule';
import HelpUsOut from './components/HelpUsOut';
import ShiftTradeModal from './components/ShiftTradeModal'; // Import the new modal

import { generateClassPdf } from './utils/pdfGenerator';
import { LayoutDashboard, ClipboardList, Library, Shield, Calendar, HelpingHand, UserCheck } from 'lucide-react';

export default function App() {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [branding, setBranding] = useState({
        siteLogo: null,
        logos: [],
        mainTitle: 'Training & Scheduling Attendance Management',
        loginTitle: 'Welcome',
        primary: '#052D39',
        primaryHover: '#b13710',
        accent: '#052D39',
        accentHover: '#b13710',
    });

    const [stations, setStations] = useState([]);
    const [classes, setClasses] = useState([]);
    const [waivers, setWaivers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [dailyCheckIns, setDailyCheckIns] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [timeClockEntries, setTimeClockEntries] = useState([]);
    const [timeClocks, setTimeClocks] = useState([]);
    const [loginMessage, setLoginMessage] = useState('');
    const [view, setView] = useState('dashboard');
    const [subView, setSubView] = useState('');
    const [activeClassId, setActiveClassId] = useState(null);
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [enrollmentError, setEnrollmentError] = useState(null);

    // --- State for Shift Trading ---
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [tradeableShift, setTradeableShift] = useState(null);
    const [shiftTradeRequests, setShiftTradeRequests] = useState([]);

    const isTimeClockView = window.location.pathname === '/timeclock';
    const isClassClockView = window.location.pathname === '/classclock';

    useEffect(() => {
        const brandingRef = doc(db, `artifacts/${appId}/public/data/branding`, 'settings');
        const unsubBranding = onSnapshot(brandingRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setBranding(prev => ({ ...prev, ...data }));
                const root = document.documentElement;
                root.style.setProperty('--color-primary', data.primary || '#052D39');
                root.style.setProperty('--color-primary-hover', data.primaryHover || '#b13710');
                root.style.setProperty('--color-accent', data.accent || '#052D39');
                root.style.setProperty('--color-accent-hover', data.accentHover || '#b13710');
            }
        });

        const unsubAuth = onAuthStateChanged(auth, (authUser) => {
            setLoginMessage('');
            if (authUser) {
                const unsubUser = onSnapshot(doc(db, "users", authUser.uid), (userDoc) => {
                    if (!userDoc.exists()) return;
                    const userData = userDoc.data();
                    if (userData.isApproved) {
                        setUser({ uid: authUser.uid, id: userDoc.id, ...userData });
                    } else {
                        signOut(auth);
                        setLoginMessage("Your account is pending administrator approval.");
                    }
                    setIsAuthLoading(false);
                });
                return () => unsubUser();
            } else {
                setUser(null);
                setIsAuthLoading(false);
            }
        });
        return () => { unsubAuth(); unsubBranding(); };
    }, []);

    useEffect(() => {
        if (isAuthLoading || (!user && !isTimeClockView && !isClassClockView)) {
            return;
        }

        const collectionsToWatch = {
            classes: setClasses,
            stations: setStations,
            waivers: setWaivers,
            users: setAllUsers,
            checkins: setCheckIns,
            dailyCheckIns: setDailyCheckIns,
            attendanceRecords: setAttendanceRecords,
            shifts: setShifts,
            timeClockEntries: setTimeClockEntries,
            timeclocks: setTimeClocks
        };

        const unsubscribers = Object.entries(collectionsToWatch).map(([name, setter]) => {
            let q = query(collection(db, name === 'users' ? 'users' : `artifacts/${appId}/public/data/${name}`));
            return onSnapshot(q, (snapshot) => {
                setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (err) => console.error(`Failed to load ${name}:`, err));
        });

        // --- MODIFIED: Listener for pending shift trade requests now includes multiple statuses ---
        const tradeRequestsQuery = query(collection(db, `artifacts/${appId}/public/data/shiftTradeRequests`), where('status', 'in', ['pending_user_approval', 'pending_leader_approval']));
        const unsubTrades = onSnapshot(tradeRequestsQuery, (snapshot) => {
            setShiftTradeRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        unsubscribers.push(unsubTrades);

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user, isAuthLoading, isTimeClockView, isClassClockView]);

    const myAssignments = useMemo(() => {
        if (!user) return [];
        const assignments = [];
        stations.forEach(s => { if (user.assignments && user.assignments[s.id]) assignments.push({ ...s, type: 'station' }); });
        classes.forEach(c => { if (c.leadInstructorId === user.uid) assignments.push({ ...c, type: 'class', id: c.id, name: `${c.name} (Lead)` }); });
        return assignments;
    }, [stations, classes, user]);

    const usersForApproval = useMemo(() => allUsers.filter(u => u.needsApproval), [allUsers]);

    const handleApproveUser = async (userId) => {
        await updateDoc(doc(db, 'users', userId), { isApproved: true, needsApproval: false });
    };

    const handleSignOut = () => { setView('dashboard'); signOut(auth); };
    const handleNavClick = (mainView, sub = '') => { setView(mainView); setSubView(sub); };
    const handleConfirm = () => { if (confirmAction?.action) confirmAction.action(); setConfirmAction(null); };

    // --- Shift Trading Handlers ---
    const handleOpenTradeModal = (shift) => { setTradeableShift(shift); setIsTradeModalOpen(true); };
    const handleCloseTradeModal = () => { setTradeableShift(null); setIsTradeModalOpen(false); };

    // MODIFIED: Initial submission now waits for the other user's approval
    const handleSubmitShiftTrade = async ({ requesterShift, requestedUser, requestedShift }) => {
        if (!user || !requesterShift || !requestedUser || !requestedShift) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/shiftTradeRequests`), {
            requesterId: user.uid,
            requesterName: `${user.firstName} ${user.lastName}`,
            requesterShiftId: requesterShift.id,
            requesterShiftInfo: `${new Date(requesterShift.date).toLocaleDateString()} - ${requesterShift.type}`,
            requestedUserId: requestedUser.id,
            requestedUserName: `${requestedUser.firstName} ${requestedUser.lastName}`,
            requestedShiftId: requestedShift.id,
            requestedShiftInfo: `${new Date(requestedShift.date).toLocaleDateString()} - ${requestedShift.type}`,
            status: 'pending_user_approval', // New initial status
            approvals: { [user.uid]: true }, // Requester implicitly approves
            requestTimestamp: serverTimestamp(),
        });
        handleCloseTradeModal();
    };
    
    // NEW: Handler for the second user to approve the trade
    const handleUserApproveShiftTrade = async (tradeRequest) => {
        const tradeRequestRef = doc(db, `artifacts/${appId}/public/data/shiftTradeRequests`, tradeRequest.id);
        await updateDoc(tradeRequestRef, {
            status: 'pending_leader_approval', // Now moves to leadership for final approval
            approvals: { ...tradeRequest.approvals, [user.uid]: true }
        });
    };

    // NEW: Handler for any party to deny/cancel the trade
    const handleDenyShiftTrade = async (tradeRequest) => {
        const tradeRequestRef = doc(db, `artifacts/${appId}/public/data/shiftTradeRequests`, tradeRequest.id);
        await updateDoc(tradeRequestRef, {
            status: 'denied',
            deniedBy: user.uid,
            deniedByName: `${user.firstName} ${user.lastName}`
        });
    };

    // MODIFIED: This is now the FINAL leadership approval step
    const handleApproveShiftTrade = async (tradeRequest) => {
        const requesterShiftRef = doc(db, `artifacts/${appId}/public/data/shifts`, tradeRequest.requesterShiftId);
        const requestedShiftRef = doc(db, `artifacts/${appId}/public/data/shifts`, tradeRequest.requestedShiftId);
        const tradeRequestRef = doc(db, `artifacts/${appId}/public/data/shiftTradeRequests`, tradeRequest.id);
        const logCollectionRef = collection(db, `artifacts/${appId}/public/data/shiftTradeLogs`);

        try {
            await runTransaction(db, async (transaction) => {
                const requesterShiftDoc = await transaction.get(requesterShiftRef);
                const requestedShiftDoc = await transaction.get(requestedShiftRef);

                if (!requesterShiftDoc.exists() || !requestedShiftDoc.exists()) throw "One of the shifts in the trade does not exist.";
                
                const requesterAssignment = requesterShiftDoc.data().assignments.find(a => a.userId === tradeRequest.requesterId);
                const requestedAssignment = requestedShiftDoc.data().assignments.find(a => a.userId === tradeRequest.requestedUserId);

                if (!requesterAssignment || !requestedAssignment) throw "Could not find user assignments in one of the shifts.";

                transaction.update(requesterShiftRef, { assignments: arrayRemove(requesterAssignment) });
                transaction.update(requesterShiftRef, { assignments: arrayUnion({ ...requesterAssignment, userId: tradeRequest.requestedUserId }) });
                
                transaction.update(requestedShiftRef, { assignments: arrayRemove(requestedAssignment) });
                transaction.update(requestedShiftRef, { assignments: arrayUnion({ ...requestedAssignment, userId: tradeRequest.requesterId }) });
                
                const approvalData = {
                    status: 'approved',
                    approvedBy: user.uid,
                    approvedByName: `${user.firstName} ${user.lastName}`,
                    approvalTimestamp: serverTimestamp()
                };
                
                transaction.update(tradeRequestRef, approvalData);
                transaction.set(doc(logCollectionRef, tradeRequest.id), { ...tradeRequest, ...approvalData });
            });
        } catch (e) {
            console.error("Shift trade transaction failed: ", e);
        }
    };
    
    // Omitted other handlers for brevity...
    const handlePrerequisiteCheckin = async (course) => {
        const todayISO = new Date().toISOString().split('T')[0];
        const checkInData = {
            studentId: user.uid,
            classId: course.id,
            checkInDate: todayISO,
            checkInTime: serverTimestamp(),
            status: 'pending',
        };
        await addDoc(collection(db, `artifacts/${appId}/public/data/dailyCheckIns`), checkInData);
    };

    const handleEnroll = async (classId) => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        try {
            await updateDoc(userRef, {
                enrolledClasses: arrayUnion(classId)
            });
        } catch (error) {
            console.error("Error enrolling in class: ", error);
            setEnrollmentError("Failed to enroll in the class. Please try again.");
        }
    };

    const handleCancelEnrollment = (classId) => {
        setConfirmAction({
            title: "Cancel Enrollment",
            message: "Are you sure you want to cancel your enrollment in this course? This action cannot be undone.",
            action: async () => {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    enrolledClasses: arrayRemove(classId)
                });
            }
        });
    };

    const handleClockIn = async (data) => {
        const { isGuest, userId, pin, name, agency, area, shiftType, patrol } = data;
        const userToClock = allUsers.find(u => u.id === userId);

        if (!isGuest && (!userToClock || userToClock.timeClockPin !== pin)) {
            alert("Invalid PIN.");
            return;
        }

        await addDoc(collection(db, `artifacts/${appId}/public/data/timeClockEntries`), {
            isGuest,
            userId: isGuest ? null : userId,
            name: isGuest ? name : `${userToClock.firstName} ${userToClock.lastName}`,
            agency: isGuest ? agency : null,
            area,
            shiftType,
            patrol,
            clockInTime: new Date(),
            clockOutTime: null,
        });
    };

    const handleClockOut = async (data) => {
        const { isGuest, userId, pin, name, agency } = data;
        const userToClock = allUsers.find(u => u.id === userId);

        if (!isGuest && (!userToClock || userToClock.timeClockPin !== pin)) {
            alert("Invalid PIN.");
            return;
        }

        const activeEntryQuery = isGuest
            ? query(collection(db, `artifacts/${appId}/public/data/timeClockEntries`), where("name", "==", name), where("agency", "==", agency), where("clockOutTime", "==", null))
            : query(collection(db, `artifacts/${appId}/public/data/timeClockEntries`), where("userId", "==", userId), where("clockOutTime", "==", null));

        const activeEntrySnapshot = await getDocs(activeEntryQuery);
        if (!activeEntrySnapshot.empty) {
            const entryDoc = activeEntrySnapshot.docs[0];
            await updateDoc(doc(db, `artifacts/${appId}/public/data/timeClockEntries`, entryDoc.id), {
                clockOutTime: new Date()
            });
        }
    };

    const handleClassCheckIn = async (attendee, course, station) => {
        const todayISO = new Date().toISOString().split('T')[0];
        const checkInData = {
            userId: attendee.uid,
            role: attendee.role,
            classId: course.id,
            stationId: station.id,
            checkInDate: todayISO,
            checkInTime: serverTimestamp(),
            status: 'pending',
        };
        await addDoc(collection(db, `artifacts/${appId}/public/data/dailyCheckIns`), checkInData);
    };

    const handleClassCheckOut = async (checkInId) => {
        const checkInRef = doc(db, `artifacts/${appId}/public/data/dailyCheckIns`, checkInId);
        await updateDoc(checkInRef, {
            checkOutTime: serverTimestamp()
        });
    };

    if (isAuthLoading || (user && !user.firstName && !isTimeClockView && !isClassClockView)) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-600">Loading Application...</div></div>;
    }
    if (isTimeClockView) return <TimeClock {...{users: allUsers, timeClockEntries, onClockIn: handleClockIn, onClockOut: handleClockOut, branding, timeClocks}} />;
    if (isClassClockView) return <ClassClock {...{users: allUsers, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut, branding, timeClocks}} />;
    if (!user) return <AuthComponent {...{logoUrl: branding.siteLogo, loginTitle: branding.loginTitle, authMessage: loginMessage, setAuthMessage: setLoginMessage}} />;

    const isInstructor = user.isAdmin || INSTRUCTOR_ROLES.includes(user.role);
    const isPatrolLeadership = user.isAdmin || PATROL_LEADER_ROLES.includes(user.ability);
    const hasSchedulingAccess = user.isAdmin || user.allowScheduling;

    const renderContent = () => {
        const enrolledClassesDetails = classes.filter(c => user.enrolledClasses?.includes(c.id));
        if(activeClassId) {
            const activeClass = classes.find(c => c.id === activeClassId);
            return <MyStations activeClass={activeClass} stations={stations} onBack={() => setActiveClassId(null)} />
        }
        switch (view) {
            case 'admin': return <AdminPortal {...{ currentUser: user, stations, classes, allUsers, setConfirmAction, waivers, onApproveUser: handleApproveUser, branding }} />;
            case 'siteBranding': return <div className="p-4 sm:p-6 lg:p-8"><Branding branding={branding} onUpdate={setBranding} /></div>;
            case 'myTraining':
                return <MyTraining {...{ user, enrolledClassesDetails, dailyCheckIns, setActiveClassId, handlePrerequisiteCheckin, handleCancelEnrollment, allUsers, classes, stations, checkIns, generateClassPdf }} />;
            case 'attendance': return <AttendanceTabs {...{ user, allUsers, classes, stations, attendanceRecords, subView, setSubView }} />;
            case 'catalog': return <CourseCatalog {...{ classes, user, allUsers, onEnrollClick: handleEnroll, enrollmentError, branding }} />;
            case 'profile': return <ProfileManagement {...{ user, setConfirmAction }} />;
            
            case 'mySchedule':
                return <MySchedule 
                    currentUser={user}
                    allUsers={allUsers}
                    shifts={shifts}
                    timeClockEntries={timeClockEntries}
                    onTradeRequest={handleOpenTradeModal}
                />;
            case 'helpUsOut':
                return <HelpUsOut
                    currentUser={user}
                    allUsers={allUsers}
                    shifts={shifts}
                    classes={classes}
                    stations={stations}
                />;
            case 'scheduleManagement':
                return isPatrolLeadership 
                    ? <ShiftManagement
                        currentUser={user}
                        allUsers={allUsers}
                        patrols={stations.filter(s => s.type === 'patrol')}
                      />
                    : <div>Access Denied.</div>;
            case 'dashboard':
            default:
                return <Dashboard {...{
                    user,
                    isInstructor,
                    isStudent: !isInstructor,
                    enrolledClassesDetails,
                    dailyCheckIns,
                    setActiveClassId,
                    handlePrerequisiteCheckin,
                    handleCancelEnrollment,
                    myAssignments,
                    attendanceRecords,
                    classes,
                    paginatedPendingActions: [],
                    setPendingActionsPage: () => {},
                    pendingActionsPage: 0,
                    allPendingActions: [],
                    timeClockEntries,
                    allUsers,
                    isPatrolLeadership,
                    usersForApproval,
                    onApproveUser: handleApproveUser,
                    shiftTradeRequests,
                    onApproveShiftTrade: handleApproveShiftTrade,
                    onUserApproveShiftTrade: handleUserApproveShiftTrade,
                    onDenyShiftTrade: handleDenyShiftTrade
                }} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            {branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-10" />}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{branding.mainTitle}</h1>
                                <p className="text-sm text-gray-500">Welcome, <span className="font-semibold text-accent">{user.firstName} {user.lastName}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user.isAdmin && <button onClick={() => handleNavClick('siteBranding')} className="text-sm font-medium text-accent hover:text-accent-hover">Site Branding</button>}
                            <button onClick={() => handleNavClick('profile')} className="text-sm font-medium text-accent hover:text-accent-hover">My Profile</button>
                            <button onClick={handleSignOut} className="text-sm font-medium text-accent hover:text-accent-hover">Sign Out</button>
                        </div>
                    </div>
                    <nav className="flex space-x-4 border-t border-gray-200 -mb-px overflow-x-auto">
                        <button onClick={() => handleNavClick('dashboard')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'dashboard' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><LayoutDashboard className="mr-1.5 h-4 w-4" />My Dashboard</button>
                        
                        <button onClick={() => handleNavClick('mySchedule')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'mySchedule' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Calendar className="mr-1.5 h-4 w-4" />My Schedule</button>
                        
                        <button onClick={() => handleNavClick('helpUsOut')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'helpUsOut' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><HelpingHand className="mr-1.5 h-4 w-4" />Help Us Out!</button>

                        <button onClick={() => handleNavClick('myTraining')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'myTraining' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Library className="mr-1.5 h-4 w-4" />My Training</button>
                        
                        <button onClick={() => handleNavClick('catalog')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'catalog' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Library className="mr-1.5 h-4 w-4" />Course Catalog</button>
                        
                        {isInstructor && (<button onClick={() => handleNavClick('attendance', 'checkInOut')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'attendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><ClipboardList className="mr-1.5 h-4 w-4" />Attendance Management</button>)}
                        
                        {isPatrolLeadership && <button onClick={() => handleNavClick('scheduleManagement')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'scheduleManagement' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><UserCheck className="mr-1.5 h-4 w-4" />Schedule Management</button>}

                        {user.isAdmin && <button onClick={() => handleNavClick('admin')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'admin' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Shield className="mr-1.5 h-4 w-4" />Admin Portal</button>}
                    </nav>
                </div>
            </header>
            <main className="max-w-7xl mx-auto">
                {renderContent()}
            </main>
            {/* --- Render Shift Trade Modal --- */}
            {isTradeModalOpen && (
                <ShiftTradeModal
                    isOpen={isTradeModalOpen}
                    onClose={handleCloseTradeModal}
                    currentUser={user}
                    shiftToTrade={tradeableShift}
                    allUsers={allUsers}
                    shifts={shifts}
                    onSubmit={handleSubmitShiftTrade}
                />
            )}
            <CertificateModal isOpen={isCertificateModalOpen} onClose={() => setIsCertificateModalOpen(false)} certificateData={null} />
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={confirmAction?.title || "Confirm Action"}
                message={confirmAction?.message || "Are you sure?"}
            />
        </div>
    );
}
