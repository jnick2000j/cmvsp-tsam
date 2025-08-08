// src/components/RecentUpdates.js
import React from 'react';
import Icon from './Icon';

const RecentUpdates = ({ updates }) => {
    const timeSince = (date) => {
        if (!date || !date.toDate) return 'just now';
        const seconds = Math.floor((new Date() - date.toDate()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "just now";
    };

    return (
        <div className="bg-white rounded-xl shadow-lg">
            <h3 className="font-bold text-lg text-gray-800 p-4 border-b">Recent Updates</h3>
            <ul className="divide-y divide-gray-200">
                {updates.map(update => (
                    <li key={update.id} className="p-4 flex space-x-3 hover:bg-gray-50">
                        <div className="bg-gray-100 p-2 rounded-full h-fit">
                           <Icon name={update.icon} className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-700">{update.text}</p>
                            <p className="text-xs text-gray-400 mt-1">{timeSince(update.timestamp)} by {update.actor}</p>
                        </div>
                    </li>
                ))}
                {updates.length === 0 && <p className="p-4 text-sm text-gray-500">No recent activity.</p>}
            </ul>
        </div>
    );
};

export default RecentUpdates;
