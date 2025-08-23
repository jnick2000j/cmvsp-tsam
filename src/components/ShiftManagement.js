import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';
import MasterSchedule from './MasterSchedule';
import ShiftCreator from './ShiftCreator';
import PendingActions from './PendingActions'; // Assuming PendingActions will handle trade requests
import { Calendar, PlusCircle, Users } from 'lucide-react';

const ShiftManagement = ({ currentUser, allUsers, patrols }) => {
    const [managementView, setManagementView] = useState('schedule');
    const [shifts, setShifts] = useState([]);
    const [tradeRequests, setTradeRequests] = useState([]);

    useEffect(() => {
        const shiftsQuery = query(collection(db, `artifacts/${appId}/public/data/shifts`));
        const unsubscribeShifts = onSnapshot(shiftsQuery, (snapshot) => {
            setShifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const tradesQuery = query(
            collection(db, `artifacts/${appId}/public/data/shiftTradeRequests`),
            where('status', '==', 'pending_leader_approval')
        );
        const unsubscribeTrades = onSnapshot(tradesQuery, (snapshot) => {
            setTradeRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeShifts();
            unsubscribeTrades();
        };
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setManagementView('schedule')}
                        className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                            managementView === 'schedule' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Calendar className="mr-2" size={18} /> Master Schedule
                    </button>
                    <button
                        onClick={() => setManagementView('creator')}
                        className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                            managementView === 'creator' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <PlusCircle className="mr-2" size={18} /> Shift Creator
                    </button>
                    <button
                        onClick={() => setManagementView('trades')}
                        className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                            managementView === 'trades' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Users className="mr-2" size={18} /> Trade Requests
                        {tradeRequests.length > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                {tradeRequests.length}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {managementView === 'schedule' && (
                <MasterSchedule shifts={shifts} patrols={patrols} allUsers={allUsers} />
            )}
            {managementView === 'creator' && (
                <ShiftCreator patrols={patrols} allUsers={allUsers} />
            )}
            {managementView === 'trades' && (
                <PendingActions
                    shiftTradeRequests={tradeRequests}
                    onApproveShiftTrade={() => {}} // Pass your approval function here
                    onDenyShiftTrade={() => {}} // Pass your denial function here
                />
            )}
        </div>
    );
};

export default ShiftManagement;