// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, updateDoc, addDoc, getDocs, deleteDoc, where, arrayUnion, arrayRemove, deleteField, orderBy, limit } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES, PATROL_LEADER_ROLES, appId } from './constants';

// Import All Components
import AuthComponent from './components/AuthComponent';
import AdminPortal from './components/AdminPortal';
import MyStations from './components/MyStations';
import AttendanceTabs from './components/AttendanceTabs';
import HelpTabs from './components/HelpTabs';
import CourseCatalog from './components/CourseCatalog';
import TrainingHistory from './components/TrainingHistory';
import ProfileManagement from './components/ProfileManagement';
import SkillsModal from './components/SkillsModal';
import WaiverSigningModal from './components/WaiverSigningModal';
import CertificateModal from './components/CertificateModal';
import ConfirmationModal from './components/ConfirmationModal';
import PrerequisiteUploadModal from './components/PrerequisiteUploadModal';
import Dashboard from './components/Dashboard';
import Scheduling from './components/Scheduling';
import TimeClock from './components/TimeClock';

import { generateClassPdf } from './utils/pdfGenerator';
import { LayoutDashboard, ClipboardList, Handshake, Library, Clock, User, Shield, Calendar, BarChart, Smartphone } from 'lucide-react';

export default function App() {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(true);
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
    
    // Existing State
    const [stations, setStations] = useState([]);
    const [classes, setClasses] = useState([]);
    const [waivers, setWaivers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [updates, setUpdates] = useState([]);
    const [instructorSignups, setInstructorSignups] = useState([]);
    const [supportSignups, setSupportSignups] = useState([]);
    const [dailyCheckIns, setDailyCheckIns] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [roleRequests, setRoleRequests] = useState([]);

    // Scheduling State
    const [shifts, setShifts] = useState([]);
    const [timeClockEntries, setTimeClockEntries] = useState([]);
    const [timeClocks, setTimeClocks] = useState([]);

    const [loginMessage, setLoginMessage] = useState(''); // Handles all login screen messages


    const [error, setError] = useState('');
    const [view, setView] = useState('dashboard');
    const [subView, setSubView] = useState('');
    const [activeClassId, setActiveClassId] = useState(null);
    const [pendingActionsPage, setPendingActionsPage] = useState(0);
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [selectedCheckInForSkills, setSelectedCheckInForSkills] = useState(null);
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [certificateData, setCertificateData] = useState(null);
    const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
    const [waiversToSign, setWaiversToSign] = useState([]);
    const [enrollmentClass, setEnrollmentClass] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [enrollmentError, setEnrollmentError] = useState(null);
    const [isPrerequisiteModalOpen, setIsPrerequisiteModalOpen] = useState(false);
    const [classForUpload, setClassForUpload] = useState(null);
    const [isUploading, setIsUploading] = useState(false);


    const isTimeClockView = window.location.pathname === '/timeclock';

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
                    // CRITICAL FIX: If the document doesn't exist, it's likely being created.
                    // We must wait for the listener to fire again when the doc is ready.
                    if (!userDoc.exists()) {
                        // This prevents signing out a user during the registration race condition.
                        return; 
                    }

                    const userData = userDoc.data();
                    if (userData.isApproved) {
                        setUser({ uid: authUser.uid, id: userDoc.id, ...userData });
                    } else {
                        signOut(auth);
                        setLoginMessage("Your account is pending administrator approval. Please wait for an email notification before logging in.");
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
        if (isAuthLoading || (!user && !isTimeClockView)) {
            setIsDataLoading(false);
            return;
        }

        const collectionsToWatch = {
            classes: setClasses,
            stations: setStations,
            waivers: setWaivers,
            users: setAllUsers,
            checkins: setCheckIns,
            dailyCheckIns: setDailyCheckIns,
            instructorSignups: setInstructorSignups,
            supportSignups: setSupportSignups,
            attendanceRecords: setAttendanceRecords,
            roleRequests: setRoleRequests,
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
        
        setIsDataLoading(false);

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user, isAuthLoading, isTimeClockView]);

    const myAssignments = useMemo(() => {
        if (!user) return [];
        const assignments = [];
        stations.forEach(s => { if (user.assignments && user.assignments[s.id]) assignments.push({ ...s, type: 'station' }); });
        classes.forEach(c => { if (c.leadInstructorId === user.uid) assignments.push({ ...c, type: 'class', id: c.id, name: `${c.name} (Lead)` }); });
        return assignments;
    }, [stations, classes, user]);
    
    const usersForApproval = useMemo(() => {
        return allUsers.filter(u => u.needsApproval);
    }, [allUsers]);

    const handleApproveUser = async (userId) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isApproved: true,
            needsApproval: false
        });
    };
    
    const handleSignOut = () => { setView('dashboard'); signOut(auth); };
    const handleNavClick = (mainView, sub = '') => { setView(mainView); setSubView(sub); };

    const handleConfirm = () => {
        if (confirmAction && typeof confirmAction.action === 'function') {
            confirmAction.action();
        }
        setConfirmAction(null);
    };
    
     const handleClockInOut = async (data) => {
        const { isGuest, userId, pin, name, agency, area, shiftType } = data;
        
        if (!isGuest) {
            const userToClock = allUsers.find(u => u.id === userId);
            if (!userToClock || userToClock.timeClockPin !== pin) {
                alert("Invalid PIN.");
                return;
            }
        }
        
        const activeEntryQuery = isGuest 
            ? query(collection(db, `artifacts/${appId}/public/data/timeClockEntries`), where("name", "==", name), where("agency", "==", agency), where("clockOutTime", "==", null))
            : query(collection(db, `artifacts/${appId}/public/data/timeClockEntries`), where("userId", "==", userId), where("clockOutTime", "==", null));

        const activeEntrySnapshot = await getDocs(activeEntryQuery);

        if (activeEntrySnapshot.empty) {
            await addDoc(collection(db, `artifacts/${appId}/public/data/timeClockEntries`), {
                isGuest,
                userId: isGuest ? null : userId,
                name: isGuest ? name : `${user.firstName} ${user.lastName}`,
                agency: isGuest ? agency : null,
                area,
                shiftType,
                clockInTime: new Date(),
                clockOutTime: null,
            });
        } else {
            const entryDoc = activeEntrySnapshot.docs[0];
            await updateDoc(doc(db, `artifacts/${appId}/public/data/timeClockEntries`, entryDoc.id), {
                clockOutTime: new Date()
            });
        }
    };


    if (isAuthLoading || ((user && !user.firstName) && !isTimeClockView)) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-600">Loading Application...</div></div>;
    }

    if (isTimeClockView) {
        return <TimeClock users={allUsers} onClockIn={handleClockInOut} onClockOut={handleClockInOut} branding={branding} timeClocks={timeClocks} />;
    }

    if (!user) {
        return <AuthComponent logoUrl={branding.siteLogo} loginTitle={branding.loginTitle} authMessage={loginMessage} setAuthMessage={setLoginMessage} />;
    }
    
    const isInstructor = user.isAdmin || INSTRUCTOR_ROLES.includes(user.role);
    const isSupport = SUPPORT_ROLES.includes(user.role);
    const isPatrolLeadership = user.isAdmin || PATROL_LEADER_ROLES.includes(user.ability);
    const hasSchedulingAccess = user.isAdmin || user.allowScheduling; 

    const renderContent = () => {
        switch (view) {
            case 'admin': return <AdminPortal {...{ currentUser: user, stations, classes, allUsers, setConfirmAction, waivers, branding, onBrandingUpdate: setBranding, onApproveUser: handleApproveUser }} />;
            case 'trainingHistory': return <TrainingHistory {...{ user, allUsers, classes, stations, checkIns, generateClassPdf }} />;
            case 'attendance': return <AttendanceTabs {...{ user, allUsers, classes, stations, attendanceRecords, subView, setSubView }} />;
            case 'help': return <HelpTabs {...{ user, stations, classes, addUpdate: () => {}, instructorSignups, supportSignups, subView, setSubView }} />;
            case 'catalog': return <CourseCatalog {...{ classes, user, allUsers, onEnrollClick: () => {}, enrollmentError, branding }} />;
            case 'profile': return <ProfileManagement {...{ user }} />;
            case 'scheduling': 
                return hasSchedulingAccess ? <Scheduling user={user} allUsers={allUsers} shifts={shifts} /> : <div>Access Denied</div>;
            case 'dashboard':
            default:
                return <Dashboard {...{ 
                    user, 
                    isInstructor,
                    isStudent: !isInstructor && !isSupport,
                    enrolledClassesDetails: classes.filter(c => user.enrolledClasses?.includes(c.id)), 
                    dailyCheckIns, 
                    setActiveClassId, 
                    myAssignments, 
                    attendanceRecords, 
                    classes, 
                    paginatedPendingActions: [], 
                    setPendingActionsPage, 
                    pendingActionsPage, 
                    allPendingActions: [],
                    timeClockEntries,
                    allUsers,
                    isPatrolLeadership: hasSchedulingAccess && isPatrolLeadership,
                    usersForApproval,
                    onApproveUser: handleApproveUser
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
                            <button onClick={() => handleNavClick('profile')} className="text-sm font-medium text-accent hover:text-accent-hover">My Profile</button>
                            <button onClick={handleSignOut} className="text-sm font-medium text-accent hover:text-accent-hover">Sign Out</button>
                        </div>
                    </div>
                    <nav className="flex space-x-4 border-t border-gray-200 -mb-px overflow-x-auto">
                        <button onClick={() => handleNavClick('dashboard')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'dashboard' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><LayoutDashboard className="mr-1.5 h-4 w-4" />My Dashboard</button>
                        {hasSchedulingAccess && <button onClick={() => handleNavClick('scheduling')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'scheduling' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Calendar className="mr-1.5 h-4 w-4" />Scheduling</button>}
                        {(isInstructor || user.isAdmin) && (<button onClick={() => handleNavClick('attendance', 'checkInOut')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'attendance' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><ClipboardList className="mr-1.5 h-4 w-4" />Training Attendance</button>)}
                        {((INSTRUCTOR_ROLES.includes(user.role) && user.isApproved) || user.isAdmin || isSupport) && (<button onClick={() => handleNavClick('help', 'teaching')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'help' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Handshake className="mr-1.5 h-4 w-4" />Help us Out!</button>)}
                        <button onClick={() => handleNavClick('catalog')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'catalog' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Library className="mr-1.5 h-4 w-4" />Course Catalog</button>
                        <button onClick={() => handleNavClick('trainingHistory')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'trainingHistory' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Clock className="mr-1.5 h-4 w-4" />My Training History</button>
                        {user.isAdmin && <button onClick={() => handleNavClick('admin')} className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center shrink-0 ${view === 'admin' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Shield className="mr-1.5 h-4 w-4" />Admin Portal</button>}
                    </nav>
                </div>
            </header>
            <main className="max-w-7xl mx-auto">
                {renderContent()}
            </main>
            <CertificateModal isOpen={isCertificateModalOpen} onClose={() => setIsCertificateModalOpen(false)} certificateData={certificateData} />
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