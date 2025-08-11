// src/components/MyTraining.js
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import WaiverSigningModal from './WaiverSigningModal'; // Ensure you have created this component
import TrainingHistory from './TrainingHistory'; // Keep for the history tab

// This new component will manage the display of each individual training request.
const TrainingRequestCard = ({ request, currentUser, allWaiverTemplates, classes }) => {
    const [isSigning, setIsSigning] = useState(false);
    const [waiverToSign, setWaiverToSign] = useState(null);
    const [signedWaivers, setSignedWaivers] = useState([]);
    const [requiredWaivers, setRequiredWaivers] = useState([]);

    // Fetch details about the class and the user's signed waivers for it
    useEffect(() => {
        const classInfo = classes.find(c => c.id === request.classId);
        if (classInfo && classInfo.requiredWaiverIds) {
            setRequiredWaivers(classInfo.requiredWaiverIds);
        }

        const q = query(
            collection(db, "signedWaivers"),
            where("userId", "==", currentUser.uid),
            where("classId", "==", request.classId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSignedWaivers(snapshot.docs.map(doc => doc.data()));
        });

        return () => unsubscribe();
    }, [request.classId, currentUser.uid, classes]);

    const getStatusInfo = () => {
        switch (request.status) {
            case 'pending_waivers':
                return { text: 'Pending Waivers', color: 'text-yellow-600', description: 'Action required: Please sign all required waivers.' };
            case 'pending_approval':
                return { text: 'Pending Approval', color: 'text-blue-600', description: 'Your request is awaiting review from an instructor or administrator.' };
            case 'approved':
                return { text: 'Enrolled', color: 'text-green-600', description: 'Your enrollment is confirmed.' };
            case 'denied':
                return { text: 'Denied', color: 'text-red-600', description: 'Your enrollment request was not approved.' };
            default:
                return { text: 'Unknown', color: 'text-gray-500', description: '' };
        }
    };

    const handleSignClick = (waiverTemplateId) => {
        const waiver = allWaiverTemplates[waiverTemplateId];
        if (waiver) {
            setWaiverToSign(waiver);
            setIsSigning(true);
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b flex-grow">
                <h3 className="text-lg font-bold text-gray-800">{request.className}</h3>
                <p className={`text-sm font-semibold ${statusInfo.color} mt-1`}>
                    Status: {statusInfo.text}
                </p>
                <p className="text-sm text-gray-500 mt-1">{statusInfo.description}</p>
            </div>

            {request.status === 'pending_waivers' && requiredWaivers.length > 0 && (
                <div className="p-4 bg-gray-50 border-t">
                    <h4 className="font-semibold text-sm mb-2">Required Waivers:</h4>
                    <ul className="space-y-2">
                        {requiredWaivers.map(waiverId => {
                            const waiverTemplate = allWaiverTemplates[waiverId];
                            const signedWaiver = signedWaivers.find(sw => sw.waiverTemplateId === waiverId);
                            const isSigned = !!signedWaiver;
                            const isApproved = isSigned && signedWaiver.status === 'approved';
                            const isPendingReview = isSigned && signedWaiver.status === 'pending_review';

                            return (
                                <li key={waiverId} className="flex justify-between items-center text-sm">
                                    <span>{waiverTemplate?.title || 'Loading waiver...'}</span>
                                    {isApproved ? (
                                        <span className="text-green-600 font-bold">Approved</span>
                                    ) : isPendingReview ? (
                                        <span className="text-blue-600 font-bold">Pending Review</span>
                                    ) : (
                                        <button
                                            onClick={() => handleSignClick(waiverId)}
                                            className="px-3 py-1 text-xs font-medium rounded-md text-white bg-accent hover:bg-accent-hover"
                                        >
                                            Sign Now
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            
            {isSigning && waiverToSign && (
                 <WaiverSigningModal 
                    waiver={waiverToSign}
                    classId={request.classId}
                    currentUser={currentUser}
                    onClose={() => setIsSigning(false)}
                />
            )}
        </div>
    );
};


const MyTraining = (props) => {
    const { currentUser, classes } = props;
    const [trainingView, setTrainingView] = useState('requests'); // requests, history
    const [requests, setRequests] = useState([]);
    const [waiverTemplates, setWaiverTemplates] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?.uid) return;
        setLoading(true);

        // Listen to the user's enrollment requests
        const q = query(collection(db, "enrollmentRequests"), where("userId", "==", currentUser.uid));
        const unsubRequests = onSnapshot(q, (snapshot) => {
            const fetchedRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(fetchedRequests);
            setLoading(false);
        });

        // Fetch all waiver templates once
        const unsubWaivers = onSnapshot(collection(db, "waiverTemplates"), (snapshot) => {
            const templates = {};
            snapshot.forEach(doc => {
                templates[doc.id] = { id: doc.id, ...doc.data() };
            });
            setWaiverTemplates(templates);
        });

        return () => {
            unsubRequests();
            unsubWaivers();
        };
    }, [currentUser]);

    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-8">Loading your training details...</div>;
        }

        switch (trainingView) {
            case 'requests':
                return (
                    <div className="space-y-8">
                        {requests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {requests.map(req => (
                                    <TrainingRequestCard 
                                        key={req.id}
                                        request={req}
                                        currentUser={currentUser}
                                        allWaiverTemplates={waiverTemplates}
                                        classes={classes}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Training Requests</h2>
                                <p className="text-gray-500">You have not requested to enroll in any courses yet.</p>
                            </div>
                        )}
                    </div>
                );
            case 'history':
                return <TrainingHistory {...props} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setTrainingView('requests')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            trainingView === 'requests' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        My Requests
                    </button>
                    <button
                        onClick={() => setTrainingView('history')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            trainingView === 'history' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        My Training History
                    </button>
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default MyTraining;