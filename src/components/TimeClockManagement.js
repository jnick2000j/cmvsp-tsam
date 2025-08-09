// src/components/TimeClockManagement.js
import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const TimeClockManagement = ({ timeClocks, onSave, onDelete }) => {
    
    const handleAddNew = () => {
        const name = prompt("Enter a name for the new time clock device (e.g., 'Base Lodge Kiosk'):");
        if (name) {
            // Generate a random 10-digit PIN
            const pin = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            onSave({ name, pin });
        }
    };

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Time Clock Device Management</h2>
                    <p className="mt-1 text-sm text-gray-500">Create or remove authorized time clock devices.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button 
                        onClick={handleAddNew} 
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary-hover"
                    >
                        <PlusCircle className="h-5 w-5 mr-2" /> Add New Device
                    </button>
                </div>
            </div>

            <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Device Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">10-Digit PIN</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {timeClocks.map((device) => (
                                        <tr key={device.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{device.name}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">{device.pin}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button onClick={() => onDelete(device.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeClockManagement;