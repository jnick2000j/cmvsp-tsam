import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId } from '../constants';
import Icon from './Icon';
import { ArrowLeft, CheckSquare, Square, Paperclip, Video, AlertTriangle } from 'lucide-react';

const MyStations = ({ activeClass, stations, onBack, user }) => {
    const [completedSkills, setCompletedSkills] = useState(user?.completedSkills || {});
    const [completedAssets, setCompletedAssets] = useState(user?.completedAssets || {});

    useEffect(() => {
        setCompletedSkills(user?.completedSkills || {});
        setCompletedAssets(user?.completedAssets || {});
    }, [user]);

    const handleSkillToggle = async (stationId, skill) => {
        const userRef = doc(db, 'users', user.uid);
        const skillPath = `completedSkills.${stationId}`;

        if (completedSkills[stationId]?.includes(skill)) {
            await updateDoc(userRef, { [skillPath]: arrayRemove(skill) });
        } else {
            await updateDoc(userRef, { [skillPath]: arrayUnion(skill) });
        }
    };
    
    // --- NEW: Asset Completion Logic ---
    const handleAssetToggle = async (stationId, assetId) => {
        const userRef = doc(db, 'users', user.uid);
        const assetPath = `completedAssets.${stationId}`;

        if (completedAssets[stationId]?.includes(assetId)) {
            await updateDoc(userRef, { [assetPath]: arrayRemove(assetId) });
        } else {
            await updateDoc(userRef, { [assetPath]: arrayUnion(assetId) });
        }
    };

    const classStations = stations.filter(s => s.classId === activeClass.id);
    
    // --- NEW: Station Completion Logic ---
    const isStationComplete = (station) => {
        const mandatoryAssets = station.assets?.filter(a => a.isMandatory) || [];
        if (mandatoryAssets.length === 0) return true; // No mandatory assets, so it's complete
        
        const completedMandatoryAssets = completedAssets[station.id] || [];
        return mandatoryAssets.every(asset => completedMandatoryAssets.includes(asset.id));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft className="mr-2" size={18} /> Back to My Training
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{activeClass.name}</h1>
            <p className="mt-1 text-gray-600">{activeClass.description}</p>
            
            <div className="mt-8 space-y-6">
                {classStations.map(station => (
                    <div key={station.id} className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isStationComplete(station) ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <Icon name={station.icon} className="h-10 w-10 text-accent" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{station.name}</h2>
                                    <p className="text-sm text-gray-500">{station.description}</p>
                                </div>
                            </div>

                            {/* --- NEW: Display Assets --- */}
                            {station.assets && station.assets.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <h3 className="text-md font-semibold text-gray-700 mb-2">Resources</h3>
                                    <ul className="space-y-2">
                                        {station.assets.map(asset => (
                                            <li key={asset.id} className="flex items-center justify-between text-sm">
                                                <a href={asset.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                                                    {asset.type.includes('video') ? <Video size={16} /> : <Paperclip size={16} />}
                                                    {asset.name}
                                                </a>
                                                {asset.isMandatory && (
                                                    <button onClick={() => handleAssetToggle(station.id, asset.id)} className="flex items-center gap-1.5 text-xs font-medium">
                                                        {completedAssets[station.id]?.includes(asset.id) ? <CheckSquare size={16} className="text-green-600" /> : <Square size={16} className="text-gray-400" />}
                                                        Mark as Complete
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* --- Skills Checklist --- */}
                            <div className="mt-4 pt-4 border-t">
                                <h3 className="text-md font-semibold text-gray-700 mb-2">Skills Checklist</h3>
                                <ul className="space-y-2">
                                    {station.skills.map(skill => (
                                        <li key={skill} className="flex items-center">
                                            <button onClick={() => handleSkillToggle(station.id, skill)} className="flex items-center w-full text-left">
                                                {completedSkills[station.id]?.includes(skill) ? <CheckSquare size={20} className="mr-2 text-green-600" /> : <Square size={20} className="mr-2 text-gray-400" />}
                                                <span className="text-sm">{skill}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyStations;