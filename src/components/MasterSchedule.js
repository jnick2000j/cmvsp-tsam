import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, setDoc } from 'firebase/firestore';
import ShiftEditModal from './ShiftEditModal'; // The new modal for editing
import { Edit } from 'lucide-react';

const MasterSchedule = ({ allUsers, patrols }) => {
    const [allShifts, setAllShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingShift, setEditingShift] = useState(null);

    useEffect(() => {
        const shiftsQuery = query(collection(db, 'shifts'), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(shiftsQuery, (snapshot) => {
            const shiftsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Ensure date is a JS Date object for easier manipulation
                date: doc.data().date.toDate() 
            }));
            setAllShifts(shiftsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleEditClick = (shift) => {
        setEditingShift(shift);
    };

    const handleCloseModal = () => {
        setEditingShift(null);
    };

    const handleUpdateShift = async (updatedShiftData) => {
        try {
            const shiftRef = doc(db, 'shifts', updatedShiftData.id);
            await setDoc(shiftRef, updatedShiftData, { merge: true });
            alert("Shift updated successfully!");
            handleCloseModal();
        } catch (error) {
            console.error("Error updating shift: ", error);
            alert("Failed to update shift.");
        }
    };

    if (isLoading) {
        return <div>Loading schedule...</div>;
    }

    return (
        <>
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Master Schedule</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patrol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allShifts.map(shift => {
                                const patrolName = patrols.find(p => p.id === shift.patrolId)?.name || 'Unknown Patrol';
                                return (
                                    <tr key={shift.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(shift.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patrolName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.startTime} - {shift.stopTime}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.assignments?.length || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEditClick(shift)} className="text-accent hover:text-accent-hover">
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingShift && (
                <ShiftEditModal
                    isOpen={!!editingShift}
                    onClose={handleCloseModal}
                    shiftToEdit={editingShift}
                    onSave={handleUpdateShift}
                    allUsers={allUsers}
                    patrols={patrols}
                />
            )}
        </>
    );
};

export default MasterSchedule;
