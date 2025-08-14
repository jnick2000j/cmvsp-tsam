// src/components/PendingActions.js
import React from 'react';
import { X, Check, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const PendingActions = ({ actions, onApprove, onDeny, onNext, onPrev, hasNext, hasPrev }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg">
            <h3 className="font-bold text-lg text-gray-800 p-4 border-b">Pending Actions</h3>
            <ul className="divide-y divide-gray-200">
                {actions.map(action => (
                    <li key={action.id} className="p-4 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{action.title}</p>
                            <p className="text-sm text-gray-500">{action.description}</p>
                            {action.data.prerequisiteDocumentUrl && (
                                <a
                                    href={action.data.prerequisiteDocumentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center mt-1"
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    View Prerequisite
                                </a>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => onDeny(action)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-full"><X className="h-4 w-4" /></button>
                            <button onClick={() => onApprove(action)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-full"><Check className="h-4 w-4" /></button>
                        </div>
                    </li>
                ))}
                {actions.length === 0 && <p className="p-4 text-sm text-gray-500">No pending actions.</p>}
            </ul>
            <div className="p-2 bg-gray-50 border-t flex justify-end space-x-2">
                <button onClick={onPrev} disabled={!hasPrev} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button onClick={onNext} disabled={!hasNext} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
        </div>
    );
};

export default PendingActions;
