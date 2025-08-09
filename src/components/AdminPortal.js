// src/components/AdminPortal.js
import React, { useState, useMemo, useEffect } from 'react';
import { doc, deleteDoc, updateDoc, query, where, getDocs, collection, addDoc, setDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { INSTRUCTOR_ROLES, appId } from '../constants';
import UserEditModal from './UserEditModal';
import StationEditModal from './StationEditModal';
import ClassEditModal from './ClassEditModal';
import WaiverManagement from './WaiverManagement';
import ShiftManagement from './ShiftManagement';
import TimeClockManagement from './TimeClockManagement';
import { Search, UserPlus, Edit, Trash2, Check, PlusCircle, Layers, BookOpen, UserCog, FileSignature, Mail, Copy, Calendar, Smartphone, X, CheckCircle, Shield, UserCheck } from 'lucide-react';
import Icon from './Icon';

const AdminPortal = ({ currentUser, stations, classes, allUsers, setConfirmAction, waivers, onApproveUser }) => {
    const [adminView, setAdminView] = useState('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isStationModalOpen, setIsStationModalOpen] = useState(false);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editingStation, setEditingStation] = useState(null);
    const [editingClass, setEditingClass] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [shifts, setShifts] = useState([]);
    const [timeClocks, setTimeClocks] = useState([]);

    useEffect(() => {
        const shiftsQuery = query(collection(db, `artifacts/${appId}/public/data/shifts`), orderBy("date", "desc"));
        const unsubscribeShifts = onSnapshot(shiftsQuery, (snapshot) => {
            setShifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const timeClocksQuery = query(collection(db, `artifacts/${appId}/public/data/timeclocks`));
        const unsubscribeTimeClocks = onSnapshot(timeClocksQuery, (snapshot) => {
            setTimeClocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeShifts();
            unsubscribeTimeClocks();
        };
    }, []);

    const instructors = useMemo(() => allUsers.filter(u => INSTRUCTOR_ROLES.includes(u.role) || u.isAdmin), [allUsers]);

    const handlePasswordReset = (email, name) => {
        setConfirmAction({
            title: "Reset Password",
            message: `Are you sure you want to send a password reset email to ${name} (${email})?`,
            action: async () => {
                try {
                    await sendPasswordResetEmail(auth, email);
                    setMessage(`Password reset email sent to ${email}.`);
                } catch (err) {
                    setError(`Failed to send password reset email: ${err.message}`);
                }
            }
        });
    };
    
    const handleCopyClass = async (classToCopy) => {
        setMessage('');
        setError('');
        try {
            const newClassData = { ...classToCopy, name: `${classToCopy.name} (Copy)` };
            delete newClassData.id;

            const newClassRef = await addDoc(collection(db, `artifacts/${appId}/public/data/classes`), newClassData);

            const stationsToCopy = stations.filter(s => s.classId === classToCopy.id);
            for (const station of stationsToCopy) {
                const newStationData = { ...station, classId: newClassRef.id };
                delete newStationData.id;
                await addDoc(collection(db, `artifacts/${appId}/public/data/stations`), newStationData);
            }
            setMessage(`Successfully copied class "${classToCopy.name}".`);
        } catch (err) {
            setError('Failed to copy class.');
            console.error(err);
        }
    };

    const handleCopyStation = async (stationToCopy) => {
        setMessage('');
        setError('');
        try {
            const newStationData = { ...stationToCopy, name: `${stationToCopy.name} (Copy)` };
            delete newStationData.id;
            await addDoc(collection(db, `artifacts/${appId}/public/data/stations`), newStationData);
            setMessage(`Successfully copied station "${stationToCopy.name}".`);
        } catch (err) {
            setError('Failed to copy station.');
            console.error(err);
        }
    };
    
    const handleDeactivateUserClick = (userId, userName) => {
        setConfirmAction({
            title: "Delete User Data",
            message: `This will delete the user's data record but will NOT delete their login account. You will need to delete their account manually in the Firebase Authentication console. Are you sure you want to proceed?`,
            action: async () => {
                setMessage('');
                setError('');
                try {
                    await deleteDoc(doc(db, "users", userId));
                    setMessage(`Successfully deleted data for ${userName}.`);
                } catch (err) {
                    console.error("Error deleting user document:", err);
                    setError('Failed to delete user data.');
                }
            }
        });
    };
    
    const handleSaveShift = async (shiftData) => {
        try {
            if (shiftData.id) {
                const shiftRef = doc(db, `artifacts/${appId}/public/data/shifts`, shiftData.id);
                await setDoc(shiftRef, shiftData, { merge: true });
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/shifts`), shiftData);
            }
        } catch(err) {
            console.error("Error saving shift:", err);
            setError("Failed to save the shift.");
        }
    };
    
    const handleDeleteShift = async (shiftId) => {
         try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/shifts`, shiftId));
        } catch(err) {
            console.error("Error deleting shift:", err);
            setError("Failed to delete the shift.");
        }
    };


    const handleEditUser = (user) => { setEditingUser(user); setIsUserModalOpen(true); };
    const handleCloseUserModal = () => { setIsUserModalOpen(false); setEditingUser(null); };

    const handleApproveInstructor = async (userId) => {
        try {
            await updateDoc(doc(db, "users", userId), { isApproved: true });
            setMessage("Instructor approved successfully.");
        } catch (err) {
            setError("Failed to approve instructor.");
        }
    };

    const handleEditStation = (station) => { setEditingStation(station); setIsStationModalOpen(true); };
    const handleAddStation = () => { setEditingStation(null); setIsStationModalOpen(true); };
    const handleCloseStationModal = () => { setIsStationModalOpen(false); setEditingStation(null); };
    const handleDeleteStationClick = (stationId, stationName) => {
        setConfirmAction({
            title: "Delete Station",
            message: `Are you sure you want to delete the station "${stationName}"? This action cannot be undone.`,
            action: async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/stations`, stationId));
                } catch (err) {
                    setError('Failed to delete station.');
                }
            }
        });
    };

    const handleEditClass = (cls) => { setEditingClass(cls); setIsClassModalOpen(true); };
    const handleAddClass = () => { setEditingClass(null); setIsClassModalOpen(true); };
    const handleCloseClassModal = () => { setIsClassModalOpen(false); setEditingClass(null); };
    const handleDeleteClassClick = (classId, className) => {
        setConfirmAction({
            title: "Delete Class",
            message: `Are you sure you want to delete the class "${className}" and all of its associated stations? This action is permanent.`,
            action: async () => {
                try {
                    const stationsToDeleteQuery = query(collection(db, `artifacts/${appId}/public/data/stations`), where("classId", "==", classId));
                    const stationSnapshot = await getDocs(stationsToDeleteQuery);
                    stationSnapshot.forEach(async (stationDoc) => {
                        await deleteDoc(doc(db, `artifacts/${appId}/public/data/stations`, stationDoc.id));
                    });
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/classes`, classId));
                } catch (err) {
                    setError('Failed to delete class and its stations.');
                }
            }
        });
    };
    
    const handleSaveTimeClock = async (timeClockData) => {
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/timeclocks`), timeClockData);
        } catch (err) {
            setError('Failed to save time clock device.');
            console.error(err);
        }
    };

    const handleDeleteTimeClock = async (timeClockId) => {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/timeclocks`, timeClockId));
        } catch (err) {
            setError('Failed to delete time clock device.');
            console.error(err);
        }
    };


    const filteredUsers = allUsers.filter(user => `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()) || (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())) || (user.ability && user.ability.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <>
            <UserEditModal isOpen={isUserModalOpen} onClose={handleCloseUserModal} userToEdit={editingUser} onSave={() => {}} />
            <StationEditModal isOpen={isStationModalOpen} onClose={handleCloseStationModal} stationToEdit={editingStation} onSave={() => {}} classes={classes} allUsers={allUsers} />
            <ClassEditModal isOpen={isClassModalOpen} onClose={handleCloseClassModal} classToEdit={editingClass} onSave={() => {}} instructors={instructors} allUsers={allUsers} currentUser={currentUser} waivers={waivers} />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setAdminView('classes')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${adminView === 'classes' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Layers className="mr-2" size={18}/> Class Management</button>
                        <button onClick={() => setAdminView('stations')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${adminView === 'stations' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><BookOpen className="mr-2" size={18}/> Station Management</button>
                        <button onClick={() => setAdminView('users')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${adminView === 'users' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><UserCog className="mr-2" size={18}/> User Management</button>
                        <button onClick={() => setAdminView('shifts')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${adminView === 'shifts' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Calendar className="mr-2" size={18}/> Shift Management</button>
                        <button onClick={() => setAdminView('timeclocks')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${adminView === 'timeclocks' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Smartphone className="mr-2" size={18}/> Time Clock Devices</button>
                        <button onClick={() => setAdminView('waivers')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${adminView === 'waivers' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><FileSignature className="mr-2" size={18}/> Waiver Management</button>
                    </nav>
                </div>
                
                 {adminView === 'users' && (
                    <>
                        <div className="sm:flex sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">User Accounts</h2>
                                <p className="mt-1 text-sm text-gray-500">Add, edit, and manage user roles and assignments.</p>
                            </div>
                        </div>
                        <div className="mt-6 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search users by name, email, or role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md" /></div>
                        <div className="mt-6 flow-root"><div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8"><div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8"><div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Training Role</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Patrol Ability</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                                <div className="text-gray-500">{user.email}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {user.role || 'N/A'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {user.ability || 'N/A'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {user.needsApproval ? (
                                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Pending Approval</span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Approved</span>
                                                )}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.needsApproval && (
                                                        <button onClick={() => onApproveUser(user.id)} className="text-green-600 hover:text-green-900" title="Approve User Account">
                                                            <UserCheck className="h-5 w-5"/>
                                                        </button>
                                                    )}
                                                    <button onClick={() => handlePasswordReset(user.email, `${user.firstName} ${user.lastName}`)} className="text-blue-600 hover:text-blue-900" title="Send Password Reset"><Mail className="h-5 w-5" /></button>
                                                    <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900" title="Edit User"><Edit className="h-5 w-5" /></button>
                                                    <button onClick={() => handleDeactivateUserClick(user.id, `${user.firstName} ${user.lastName}`)} className="text-red-600 hover:text-red-900 disabled:text-gray-300" disabled={user.id === currentUser.uid} title="Delete User Data"><Trash2 className="h-5 w-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div></div></div></div>
                    </>
                )}
                {adminView === 'classes' && <ClassEditModal isOpen={isClassModalOpen} onClose={handleCloseClassModal} classToEdit={editingClass} onSave={() => {}} instructors={instructors} allUsers={allUsers} currentUser={currentUser} waivers={waivers} />}
                {adminView === 'stations' && <StationEditModal isOpen={isStationModalOpen} onClose={handleCloseStationModal} stationToEdit={editingStation} onSave={() => {}} classes={classes} allUsers={allUsers} />}
                {adminView === 'shifts' && <ShiftManagement shifts={shifts} users={allUsers} onSave={handleSaveShift} onDelete={handleDeleteShift} />}
                {adminView === 'timeclocks' && <TimeClockManagement timeClocks={timeClocks} onSave={handleSaveTimeClock} onDelete={handleDeleteTimeClock} />}
                {adminView === 'waivers' && <WaiverManagement waivers={waivers} setConfirmAction={setConfirmAction} />}
            </div>
        </>
    );
};

export default AdminPortal;