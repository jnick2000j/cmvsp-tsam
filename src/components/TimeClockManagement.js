// src/components/TimeClockManagement.js
import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const TimeClockManagement = ({ timeClocks, onSave, onDelete }) => {
    
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState('Time Clock'); // Default to Time Clock

    const handleAddNew = () => {
        if (!newDeviceName) {
            alert("Please enter a name for the new device.");
            return;
        }
        // Generate a random 10-digit PIN
        const pin = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        onSave({ name: newDeviceName, type: newDeviceType, pin });
        setNewDeviceName(''); // Clear input after saving
    };

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Time Clock Device Management</h2>
                    <p className="mt-1 text-sm text-gray-500">Create or remove authorized kiosk devices.</p>
                </div>
            </div>
            
            {/* Form for adding a new device */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Add New Device</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Device Name</label>
                        <input 
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            placeholder="e.g., Base Lodge Kiosk"
                            className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                     <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Device Type</label>
                        <select 
                            value={newDeviceType}
                            onChange={(e) => setNewDeviceType(e.target.value)}
                            className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                        >
                            <option>Time Clock</option>
                            <option>Class Clock</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                         <button 
                            onClick={handleAddNew} 
                            className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-primary text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary-hover"
                        >
                            <PlusCircle className="h-5 w-5 mr-2" /> Add and Generate PIN
                        </button>
                    </div>
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
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">10-Digit PIN</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {timeClocks.map((device) => (
                                        <tr key={device.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{device.name}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{device.type}</td>
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