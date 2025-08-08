// src/components/HelpTabs.js
import React from 'react';
import { BookOpen, LifeBuoy } from 'lucide-react';
import OpportunitiesCatalog from './OpportunitiesCatalog';
import SupportOpportunities from './SupportOpportunities';

const HelpTabs = ({ user, stations, classes, addUpdate, instructorSignups, supportSignups, subView, setSubView }) => {
    const isInstructor = user.isAdmin || (user.role && user.isApproved);

    const renderSubView = () => {
        switch (subView) {
            case 'teaching':
                return isInstructor ? <OpportunitiesCatalog {...{ stations, classes, user, addUpdate, instructorSignups }} /> : <p className="p-4 text-gray-500">You must be an approved instructor to view teaching opportunities.</p>;
            case 'support':
                return <SupportOpportunities {...{ stations, classes, user, supportSignups }} />;
            default:
                return isInstructor ? <OpportunitiesCatalog {...{ stations, classes, user, addUpdate, instructorSignups }} /> : <SupportOpportunities {...{ stations, classes, user, supportSignups }} />;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setSubView('teaching')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'teaching' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><BookOpen className="mr-2" size={18}/> Teaching Opportunities</button>
                    <button onClick={() => setSubView('support')} className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${subView === 'support' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><LifeBuoy className="mr-2" size={18}/> Support Opportunities</button>
                </nav>
            </div>
            {renderSubView()}
        </div>
    );
};

export default HelpTabs;
