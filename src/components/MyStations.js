// src/components/MyStations.js
import React, { useState } from 'react';
import SkillsModal from './SkillsModal';
import Icon from './Icon';
import { ChevronLeft } from 'lucide-react';

const MyStations = ({ activeClass, stations, onBack }) => {
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

    const classStations = stations.filter(s => s.classId === activeClass.id);

    const handleViewSkills = (station) => {
        setSelectedStation(station);
        setIsSkillsModalOpen(true);
    };

    return (
        <>
            <SkillsModal
                isOpen={isSkillsModalOpen}
                onClose={() => setIsSkillsModalOpen(false)}
                station={selectedStation}
            />
            <div className="p-4 sm:p-6 lg:p-8">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeClass.name}</h1>
                <p className="text-gray-600 mb-8">{activeClass.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classStations.map(station => (
                        <div key={station.id} className="bg-white rounded-xl shadow-lg flex flex-col">
                            <div className="p-5 flex-grow">
                                <div className="flex items-center space-x-4 mb-3">
                                    {/* MODIFIED: Pass station.iconUrl to the Icon component */}
                                    <div className="bg-gray-100 p-3 rounded-full">
                                        <Icon name={station.iconUrl} className="h-6 w-6 text-gray-700" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">{station.name}</h3>
                                </div>
                                <p className="text-sm text-gray-500">{station.description}</p>
                            </div>
                            <div className="p-4 bg-gray-50 border-t">
                                <button
                                    onClick={() => handleViewSkills(station)}
                                    className="w-full text-sm font-medium text-accent hover:text-accent-hover"
                                >
                                    View Skills
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                 {classStations.length === 0 && <p className="text-center text-gray-500 mt-12">No stations have been added to this class yet.</p>}
            </div>
        </>
    );
};

export default MyStations;