import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

const ShiftTradeModal = ({ isOpen, onClose, currentUser, shiftToTrade, allUsers, shifts, onSubmit }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedShiftId, setSelectedShiftId] = useState('');

    // Find users with the same patrol ability to trade with
    const eligibleUsers = useMemo(() => {
        if (!currentUser || !currentUser.ability || !allUsers) return [];
        return allUsers.filter(u => u.id !== currentUser.id && u.ability === currentUser.ability);
    }, [currentUser, allUsers]);

    // Find the selected user's upcoming shifts
    const targetUserShifts = useMemo(() => {
        if (!selectedUserId || !shifts) return [];
        return shifts.filter(s => s.assignments?.some(a => a.userId === selectedUserId));
    }, [selectedUserId, shifts]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const requestedUser = allUsers.find(u => u.id === selectedUserId);
        const requestedShift = shifts.find(s => s.id === selectedShiftId);
        onSubmit({
            requesterShift: shiftToTrade,
            requestedUser,
            requestedShift,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Request a Shift Trade</h2>
                    <button onClick={onClose}><X className="h-6 w-6" /></button>
                </div>
                
                <div className="mb-4 p-4 bg-gray-100 rounded-md">
                    <h3 className="font-semibold">Your Shift to Trade:</h3>
                    <p>{new Date(shiftToTrade.date).toDateString()} - {shiftToTrade.type}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Step 1: Select User to Trade With */}
                        <div>
                            <label htmlFor="trade-user" className="block text-sm font-medium text-gray-700">1. Choose a person to trade with:</label>
                            <select
                                id="trade-user"
                                value={selectedUserId}
                                onChange={(e) => {
                                    setSelectedUserId(e.target.value);
                                    setSelectedShiftId(''); // Reset shift selection
                                }}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
                            >
                                <option value="">Select a user...</option>
                                {eligibleUsers.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Step 2: Select Their Shift */}
                        {selectedUserId && (
                            <div>
                                <label htmlFor="trade-shift" className="block text-sm font-medium text-gray-700">2. Choose one of their shifts:</label>
                                <select
                                    id="trade-shift"
                                    value={selectedShiftId}
                                    onChange={(e) => setSelectedShiftId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
                                    disabled={targetUserShifts.length === 0}
                                >
                                    <option value="">Select a shift...</option>
                                    {targetUserShifts.length > 0 ? (
                                        targetUserShifts.map(shift => (
                                            <option key={shift.id} value={shift.id}>
                                                {new Date(shift.date).toDateString()} - {shift.type}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>This user has no upcoming shifts to trade.</option>
                                    )}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={!selectedUserId || !selectedShiftId}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-accent hover:bg-accent-hover disabled:bg-gray-400"
                        >
                            Submit Trade Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShiftTradeModal;
