// src/components/SupportOpportunities.js
import React, { useMemo } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';

const SupportOpportunities = ({ stations, classes, user, supportSignups }) => {
    const allNeeds = useMemo(() => {
        const needs = [];
        classes.forEach(c => {
            (c.supportNeeds || []).forEach(need => {
                needs.push({ ...need, type: 'Class', parentName: c.name, parentId: c.id });
            });
        });
        stations.forEach(s => {
            const className = classes.find(c => c.id === s.classId)?.name || 'Unknown Class';
            (s.supportNeeds || []).forEach(need => {
                needs.push({ ...need, type: 'Station', parentName: `${s.name} (${className})`, parentId: s.id });
            });
        });
        return needs;
    }, [stations, classes]);

    const handleSignUp = async (need) => {
        if (!user || !db) return;
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/supportSignups`), {
                userId: user.uid,
                userName: `${user.firstName} ${user.lastName}`,
                needId: need.id,
                needText: need.need,
                parentId: need.parentId,
                parentType: need.type,
                parentName: need.parentName,
                status: 'pending',
                requestedAt: new Date()
            });
            alert(`Your request to sign up for "${need.need}" has been submitted.`);
        } catch (error) {
            console.error("Error signing up for support role:", error);
            alert("There was an error submitting your request.");
        }
    };

    const isPending = (needId) => supportSignups.some(s => s.needId === needId && s.userId === user.uid);

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Support Opportunities</h2>
                    <p className="mt-1 text-sm text-gray-500">Browse and sign up for available support roles for classes and stations.</p>
                </div>
            </div>
            <div className="space-y-4">
                {allNeeds.length > 0 ? allNeeds.map(need => (
                    <div key={need.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-800">{need.need}</p>
                            <p className="text-sm text-gray-600">{need.parentName}</p>
                            <p className="text-xs text-gray-500 mt-1">{need.date} from {need.startTime} to {need.endTime}</p>
                            {need.assignedUserName && <p className="text-xs font-bold text-green-600 mt-1">Assigned to: {need.assignedUserName}</p>}
                        </div>
                        <button
                            onClick={() => handleSignUp(need)}
                            disabled={!!need.assignedUserId || isPending(need.id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {need.assignedUserId ? 'Filled' : isPending(need.id) ? 'Pending' : 'Sign Up'}
                        </button>
                    </div>
                )) : <p className="text-gray-500">No support opportunities are currently available.</p>}
            </div>
        </div>
    );
};

export default SupportOpportunities;
