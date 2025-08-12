import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, updateDoc, addDoc, getDocs, where, serverTimestamp, arrayRemove, arrayUnion, runTransaction } from 'firebase/firestore';
import { auth, db, functions } from './firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES, PATROL_LEADER_ROLES, PATROL_ADMIN_ROLES, appId, USERS, CLASSES } from './constants';

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
import ShiftTradeModal from './components/ShiftTradeModal';

import { generateClassPdf } from './utils/pdfGenerator';
import { LayoutDashboard, ClipboardList, Library, Shield, Calendar, HelpingHand, UserCheck, BookOpen, Palette } from 'lucide-react';

export default function App() {
    const [user, setUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [branding, setBranding] = useState({});
    const [stations, setStations] = useState([]);
    const [classes, setClasses] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [dailyCheckIns, setDailyCheckIns] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [timeClockEntries, setTimeClockEntries] = useState([]);
    const [timeClocks, setTimeClocks] = useState([]);
    const [enrollmentRequests, setEnrollmentRequests] = useState([]);
    const [loginMessage, setLoginMessage] = useState('');
    const [view, setView] = useState('dashboard');
    const [subView, setSubView] = useState('');
    const [activeClassId, setActiveClassId] = useState(null);
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [enrollmentError, setEnrollmentError] = useState(null);
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
                setBranding(data);
                const root = document.documentElement;
                root.style.setProperty('--color-primary', data.primaryColor || '#052D39');
                root.style.setProperty('--color-accent', data.accentColor || '#052D39');
                // You can add hover color variables here if they are in your branding data
            }
        });

        const unsubAuth = onAuthStateChanged(auth, (authUser) => {
            setLoginMessage('');
            if (authUser) {
                const unsubUser = onSnapshot(doc(db, "users", authUser.uid), (userDoc) => {
                    if (!userDoc.exists()) {
                        setIsAuthLoading(false);
                        return;
                    };
                    const userData = { id: userDoc.id, ...userDoc.data() };
                    if (userData.isApproved) {
                        setUser(authUser);
                        setCurrentUser(userData);
                    } else {
                        signOut(auth);
                        setLoginMessage("Your account is pending administrator approval.");
                    }
                    setIsAuthLoading(false);
                });
                return () => unsubUser();
            } else {
                setUser(null);
                setCurrentUser(null);
                setIsAuthLoading(false);
            }
        });
        return () => { unsubAuth(); unsubBranding(); };
    }, []);

    useEffect(() => {
        if (isAuthLoading || (!currentUser && !isTimeClockView && !isClassClockView)) {
            return;
        }

        const collectionsToWatch = {
            classes: setClasses,
            stations: setStations,
            users: setAllUsers,
            checkins: setCheckIns,
            dailyCheckIns: setDailyCheckIns,
            attendanceRecords: setAttendanceRecords,
            shifts: setShifts,
            timeClockEntries: setTimeClockEntries,
            timeclocks: setTimeClocks,
            enrollmentRequests: setEnrollmentRequests
        };

        const unsubscribers = Object.entries(collectionsToWatch).map(([name, setter]) => {
            const path = name === 'users'
                ? name
                : `artifacts/${appId}/public/data/${name}`;
            const q = query(collection(db, path));
            return onSnapshot(q, (snapshot) => {
                setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (err) => console.error(`Failed to load ${name}:`, err));
        });

        const tradeRequestsQuery = query(collection(db, `artifacts/${appId}/public/data/shiftTradeRequests`), where('status', 'in', ['pending_user_approval', 'pending_leader_approval']));
        const unsubTrades = onSnapshot(tradeRequestsQuery, (snapshot) => {
            setShiftTradeRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        unsubscribers.push(unsubTrades);

        return () => unsubscribers.forEach(unsub => unsub());
    }, [currentUser, isAuthLoading, isTimeClockView, isClassClockView]);

    const myAssignments = useMemo(() => {
        if (!currentUser) return [];
        const assignments = [];
        stations.forEach(s => { if (currentUser.assignments && currentUser.assignments[s.id]) assignments.push({ ...s, type: 'station' }); });
        classes.forEach(c => { if (c.leadInstructorId === currentUser.uid) assignments.push({ ...c, type: 'class', id: c.id, name: `${c.name} (Lead)` }); });
        return assignments;
    }, [stations, classes, currentUser]);

    const usersForApproval = useMemo(() => allUsers.filter(u => u.needsApproval), [allUsers]);

    const handleApproveUser = async (userId) => {
        await updateDoc(doc(db, 'users', userId), { isApproved: true, needsApproval: false });
    };

    const handleSignOut = () => { setView('dashboard'); signOut(auth); };
    const handleNavClick = (mainView, sub = '') => { setView(mainView); setSubView(sub); };
    const handleConfirm = () => { if (confirmAction?.action) confirmAction.action(); setConfirmAction(null); };

    const handleOpenTradeModal = (shift) => { setTradeableShift(shift); setIsTradeModalOpen(true); };
    const handleCloseTradeModal = () => { setTradeableShift(null); setIsTradeModalOpen(false); };

    const handleSubmitShiftTrade = async ({ requesterShift, requestedUser, requestedShift }) => {
        if (!currentUser || !requesterShift || !requestedUser || !requestedShift) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/shiftTradeRequests`), {
            requesterId: currentUser.uid,
            requesterName: `${currentUser.firstName} ${currentUser.lastName}`,
            requesterShiftId: requesterShift.id,
            requesterShiftInfo: `${new Date(requesterShift.date).toLocaleDateString()} - ${requesterShift.type}`,
            requestedUserId: requestedUser.id,
            requestedUserName: `${requestedUser.firstName} ${requestedUser.lastName}`,
            requestedShiftId: requestedShift.id,
            requestedShiftInfo: `${new Date(requestedShift.date).toLocaleDateString()} - ${requestedShift.type}`,
            status: 'pending_user_approval',
            approvals: { [currentUser.uid]: true },
            requestTimestamp: serverTimestamp(),
        });
        handleCloseTradeModal();
    };
    
    const handleUserApproveShiftTrade = async (tradeRequest) => {
        const tradeRequestRef = doc(db, `artifacts/${appId}/public/data/shiftTradeRequests`, tradeRequest.id);
        await updateDoc(tradeRequestRef, {
            status: 'pending_leader_approval',
            approvals: { ...tradeRequest.approvals, [currentUser.uid]: true }
        });
    };

    const handleDenyShiftTrade = async (tradeRequest) => {
        const tradeRequestRef = doc(db, `artifacts/${appId}/public/data/shiftTradeRequests`, tradeRequest.id);
        await updateDoc(tradeRequestRef, {
            status: 'denied',
            deniedBy: currentUser.uid,
            deniedByName: `${currentUser.firstName} ${currentUser.lastName}`
        });
    };

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
                    approvedBy: currentUser.uid,
                    approvedByName: `${currentUser.firstName} ${currentUser.lastName}`,
                    approvalTimestamp: serverTimestamp()
                };
                
                transaction.update(tradeRequestRef, approvalData);
                transaction.set(doc(logCollectionRef, tradeRequest.id), { ...tradeRequest, ...approvalData });
            });
        } catch (e) {
            console.error("Shift trade transaction failed: ", e);
        }
    };
    
    const handlePrerequisiteCheckin = async (course) => {
        const todayISO = new Date().toISOString().split('T')[0];
        const checkInData = {
            studentId: currentUser.uid,
            classId: course.id,
            checkInDate: todayISO,
            checkInTime: serverTimestamp(),
            status: 'pending',
        };
        await addDoc(collection(db, `artifacts/${appId}/public/data/dailyCheckIns`), checkInData);
    };

    const handleEnroll = async (classId) => {
        if (!currentUser) return;
        setEnrollmentError(null);
        
        const enrollInCourseFn = httpsCallable(functions, 'enrollInCourse');
        try {
            const result = await enrollInCourseFn({ classId });
            alert(result.data.message || 'Request submitted!');
        } catch (error) {
            console.error("Error enrolling in class: ", error);
            setEnrollmentError(error.message || "Failed to enroll. Please try again.");
        }
    };

    const handleCancelEnrollment = (classId) => {
        setConfirmAction({
            title: "Cancel Enrollment",
            message: "Are you sure you want to cancel your enrollment in this course? This action cannot be undone.",
            action: async () => {
                const userRef = doc(db, "users", currentUser.uid);
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
        try {
            if (!attendee || !course) {
                throw new Error("Attendee or course information is missing.");
            }
    
            const todayISO = new Date().toISOString().split('T')[0];
            const checkInData = {
                userId: attendee.uid,
                userName: `${attendee.firstName} ${attendee.lastName}`,
                role: attendee.role,
                classId: course.id,
                className: course.name,
                stationId: station ? station.id : null,
                stationName: station ? station.name : null,
                checkInDate: todayISO,
                checkInTime: serverTimestamp(),
                checkOutTime: null,
                status: 'pending',
            };
            
            const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/dailyCheckIns`), checkInData);
            console.log("Successfully checked in with document ID:", docRef.id);
        } catch (error) {
            console.error("Error during class check-in:", error);
            throw error;
        }
    };

    const handleClassCheckOut = async (checkInId) => {
        try {
            if (!checkInId) {
                throw new Error("No check-in ID provided for checkout.");
            }
            const checkInRef = doc(db, `artifacts/${appId}/public/data/dailyCheckIns`, checkInId);
            await updateDoc(checkInRef, {
                checkOutTime: serverTimestamp()
            });
            console.log("Successfully checked out for checkInId:", checkInId);
        } catch (error) {
            console.error("Error during class check-out:", error);
            throw error;
        }
    };
    
    const handleShiftCheckIn = async (user, shift, location) => {
        try {
            if (!user || !shift) {
                throw new Error("User or shift information is missing.");
            }
            const checkInData = {
                userId: user.uid,
                userName: `${user.firstName} ${user.lastName}`,
                shiftId: shift.id,
                shiftName: shift.name,
                location: location || "On-site",
                checkInTime: serverTimestamp(),
                checkOutTime: null,
            };
            await addDoc(collection(db, `artifacts/${appId}/public/data/shiftCheckIns`), checkInData);
        } catch (error) {
            console.error("Error during shift check-in:", error);
            throw error;
        }
    };

    const handleShiftCheckOut = async (checkInId) => {
        try {
            if (!checkInId) {
                throw new Error("No check-in ID provided for checkout.");
            }
            const checkInRef = doc(db, `artifacts/${appId}/public/data/shiftCheckIns`, checkInId);
            await updateDoc(checkInRef, {
                checkOutTime: serverTimestamp()
            });
        } catch (error) {
            console.error("Error during shift check-out:", error);
            throw error;
        }
    };

    if (isAuthLoading || (currentUser && !currentUser.firstName && !isTimeClockView && !isClassClockView)) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-600">Loading Application...</div></div>;
    }
    if (isTimeClockView) return <TimeClock {...{users: allUsers, timeClockEntries, onClockIn: handleClockIn, onClockOut: handleClockOut, branding, timeClocks}} />;
    if (isClassClockView) return <ClassClock {...{users: allUsers, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut, branding, timeClocks}} />;
    if (!currentUser) return <AuthComponent {...{logoUrl: branding.logoUrl, loginTitle: branding.loginTitle, authMessage: loginMessage, setAuthMessage: setLoginMessage}} />;

    const isInstructor = currentUser.isAdmin || (currentUser.roles && INSTRUCTOR_ROLES.some(role => currentUser.roles.includes(role)));
    const isPatrolLeadership = currentUser.isAdmin || (currentUser.roles && PATROL_LEADER_ROLES.some(role => currentUser.roles.includes(role)));
    const isPatrolAdmin = currentUser.isAdmin || (currentUser.roles && PATROL_ADMIN_ROLES.some(role => currentUser.roles.includes(role)));
    const canManageAttendance = isInstructor || isPatrolLeadership || isPatrolAdmin;


    const renderContent = () => {
        const enrolledClassesDetails = classes.filter(c => currentUser.enrolledClasses?.includes(c.id));
        if(activeClassId) {
            const activeClass = classes.find(c => c.id === activeClassId);
            return <MyStations activeClass={activeClass} stations={stations} onBack={() => setActiveClassId(null)} />
        }
        switch (view) {
            case 'admin': return <AdminPortal {...{ currentUser, stations, classes, allUsers, setConfirmAction, onApproveUser: handleApproveUser, branding }} />;
            case 'branding': return <Branding branding={branding} />;
            case 'myTraining':
                return <MyTraining {...{ user: currentUser, enrolledClassesDetails, dailyCheckIns, setActiveClassId, handlePrerequisiteCheckin, handleCancelEnrollment, allUsers, classes, stations, checkIns, generateClassPdf }} />;
            case 'attendance': 
                return <AttendanceTabs {...{ 
                    currentUser,
                    allUsers, 
                    classes, 
                    stations, 
                    shifts, 
                    dailyCheckIns,
                    enrollmentRequests,
                    timeClockEntries, 
                    handleClassCheckIn, 
                    handleClassCheckOut,
                    handleShiftCheckIn,
                    handleShiftCheckOut,
                    brandIconUrl: branding.brandIconUrl
                }} />;
            
            case 'catalog': 
                return <CourseCatalog user={user} currentUser={currentUser} classes={classes} handleEnroll={handleEnroll} />;

            case 'profile': return <ProfileManagement {...{ user: currentUser, setConfirmAction }} />;
            
            case 'mySchedule':
                return <MySchedule 
                    currentUser={currentUser}
                    allUsers={allUsers}
                    shifts={shifts}
                    timeClockEntries={timeClockEntries}
                    onTradeRequest={handleOpenTradeModal}
                />;
            case 'helpUsOut':
                return <HelpUsOut
                    currentUser={currentUser}
                    allUsers={allUsers}
                    shifts={shifts}
                    classes={classes}
                    stations={stations}
                />;
            case 'scheduleManagement':
                return isPatrolLeadership 
                    ? <ShiftManagement
                        currentUser={currentUser}
                        allUsers={allUsers}
                        patrols={stations.filter(s => s.type === 'patrol')}
                    />
                    : <div>Access Denied.</div>;
            case 'dashboard':
            default:
                return <Dashboard {...{
                    user: currentUser,
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
                            {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-10" />}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{branding.mainTitle}</h1>
                                <p className="text-sm text-gray-500">Welcome, <span className="font-semibold text-accent">{currentUser.firstName} {currentUser.lastName}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {currentUser.isAdmin && <button onClick={() => handleNavClick('branding')} className="text-sm font-medium text-accent hover:text-accent-hover flex items-center"><Palette size={18} className="mr-1"/> Site Branding</button>}
                            <button onClick={() => handleNavClick('profile')} className="text-sm font-medium text-accent hover:text-accent-hover">My Profile</button>
                            <button onClick={handleSignOut} className="text-sm font-medium text-accent hover:text-accent-hover">Sign Out</button>
                        </div>
                    </div>
                    <nav className="flex space-x-4 border-t border-gray-200 -mb-px overflow-x-auto">
                        <button onClick={() => handleNavClick('dashboard')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'dashboard' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><LayoutDashboard className="mr-1.5 h-4 w-4" />My Dashboard</button>
                        
                        <button onClick={() => handleNavClick('mySchedule')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'mySchedule' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Calendar className="mr-1.5 h-4 w-4" />My Schedule</button>
                        
                        <button onClick={() => handleNavClick('helpUsOut')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'helpUsOut' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><HelpingHand className="mr-1.5 h-4 w-4" />Help Us Out!</button>

                        <button onClick={() => handleNavClick('myTraining')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'myTraining' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Library className="mr-1.5 h-4 w-4" />My Training</button>
                        
                        <button onClick={() => handleNavClick('catalog')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'catalog' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><BookOpen className="mr-1.5 h-4 w-4" />Course Catalog</button>
                        
                        {canManageAttendance && (<button onClick={() => handleNavClick('attendance')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'attendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><ClipboardList className="mr-1.5 h-4 w-4" />Attendance Management</button>)}
                        
                        {isPatrolLeadership && <button onClick={() => handleNavClick('scheduleManagement')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'scheduleManagement' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><UserCheck className="mr-1.5 h-4 w-4" />Schedule Management</button>}

                        {currentUser.isAdmin && <button onClick={() => handleNavClick('admin')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'admin' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Shield className="mr-1.5 h-4 w-4" />Admin Portal</button>}
                    </nav>
                </div>
            </header>
            <main>
                {renderContent()}
            </main>
            {isTradeModalOpen && (
                <ShiftTradeModal
                    isOpen={isTradeModalOpen}
                    onClose={handleCloseTradeModal}
                    currentUser={currentUser}
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
