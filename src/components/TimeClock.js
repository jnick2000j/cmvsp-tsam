// src/components/TimeClock.js
import React, { useState } from 'react';
import { MOUNTAIN_AREAS, SHIFT_TYPES } from '../constants';
import { LogIn, LogOut } from 'lucide-react';

const TimeClock = ({ users, onClockIn, onClockOut, branding, timeClocks }) => {
    // Device Login State
    const [isDeviceLoggedIn, setIsDeviceLoggedIn] = useState(false);
    const [devicePinInput, setDevicePinInput] = useState('');
    const [deviceLoginError, setDeviceLoginError] = useState('');
    const [loggedInDeviceName, setLoggedInDeviceName] = useState('');

    // User Clock-in State
    const [selectedUserId, setSelectedUserId] = useState('');
    const [pin, setPin] = useState('');
    const [area, setArea] = useState(MOUNTAIN_AREAS[0]);
    const [shiftType, setShiftType] = useState(SHIFT_TYPES[0]);
    const [isGuest, setIsGuest] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestAgency, setGuestAgency] = useState('');
    const [message, setMessage] = useState('');

    const handleDeviceLogin = (e) => {
        e.preventDefault();
        setDeviceLoginError('');
        const validDevice = timeClocks.find(device => device.pin === devicePinInput);
        if (validDevice) {
            setLoggedInDeviceName(validDevice.name);
            setIsDeviceLoggedIn(true);
        } else {
            setDeviceLoginError('Invalid device PIN. Please try again.');
        }
        setDevicePinInput('');
    };

    const handleDeviceLogout = () => {
        setIsDeviceLoggedIn(false);
        setLoggedInDeviceName('');
        setDeviceLoginError('');
    };

    const handleClockIn = () => {
        setMessage('');
        if (isGuest) {
            if (!guestName || !guestAgency) {
                setMessage("Please enter guest name and agency.");
                return;
            }
            onClockIn({ isGuest: true, name: guestName, agency: guestAgency, area, shiftType });
            setGuestName('');
            setGuestAgency('');
        } else {
            if (!selectedUserId || !pin) {
                setMessage("Please select a user and enter a PIN.");
                return;
            }
            onClockIn({ isGuest: false, userId: selectedUserId, pin, area, shiftType });
            setPin('');
        }
        setMessage("Clocked in successfully!");
    };

    const handleClockOut = () => {
        setMessage('');
        if (isGuest) {
             if (!guestName || !guestAgency) {
                setMessage("Please enter guest name and agency.");
                return;
            }
            onClockOut({ isGuest: true, name: guestName, agency: guestAgency });
        } else {
            if (!selectedUserId || !pin) {
                setMessage("Please select a user and enter a PIN.");
                return;
            }
            onClockOut({ isGuest: false, userId: selectedUserId, pin });
            setPin('');
        }
        setMessage("Clocked out successfully!");
    };

    // Render Device Login Screen if not logged in
    if (!isDeviceLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
                <form onSubmit={handleDeviceLogin} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <div className="flex justify-center mb-4">
                        {branding && branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-20 w-auto" />}
                    </div>
                    <h1 className="text-2xl font-bold text-center text-gray-800">Device Login</h1>
                    {deviceLoginError && <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg">{deviceLoginError}</p>}
                    <div>
                        <label htmlFor="devicePin" className="block text-sm font-medium text-gray-700 mb-1">Enter 10-Digit Device PIN</label>
                        <input
                            type="password"
                            id="devicePin"
                            value={devicePinInput}
                            onChange={(e) => setDevicePinInput(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg text-center tracking-widest"
                            maxLength="10"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="w-full py-3 text-white bg-primary hover:bg-primary-hover rounded-lg flex items-center justify-center">
                        <LogIn className="h-5 w-5 mr-2" />
                        Login Device
                    </button>
                </form>
            </div>
        );
    }

    // Render Time Clock Screen if device is logged in
    return (
        <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 relative">
                <div className="absolute top-4 right-4">
                    <button onClick={handleDeviceLogout} className="text-xs text-gray-500 hover:text-red-600 flex items-center">
                        <LogOut className="h-4 w-4 mr-1" />
                        Logout Device
                    </button>
                </div>
                <h1 className="text-3xl font-bold text-center text-gray-800">Time Clock</h1>
                <p className="text-center text-sm text-gray-500 -mt-4">{loggedInDeviceName}</p>
                
                {message && <p className="text-center text-green-500">{message}</p>}
                
                <div className="flex items-center">
                    <input type="checkbox" id="guest" checked={isGuest} onChange={() => setIsGuest(!isGuest)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                    <label htmlFor="guest" className="ml-2 text-sm text-gray-700">Guest Patroller</label>
                </div>

                {isGuest ? (
                    <>
                        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 border rounded-lg" />
                        <input value={guestAgency} onChange={(e) => setGuestAgency(e.target.value)} placeholder="Primary Agency/Patrol" className="w-full px-4 py-3 border rounded-lg" />
                    </>
                ) : (
                    <>
                        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                            <option value="">-- Select Your Name --</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                        </select>
                        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter Your PIN" className="w-full px-4 py-3 border rounded-lg" />
                    </>
                )}


                <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                    {MOUNTAIN_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={shiftType} onChange={(e) => setShiftType(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                    {SHIFT_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>

                <div className="flex space-x-4">
                    <button onClick={handleClockIn} className="w-full py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg">Clock In</button>
                    <button onClick={handleClockOut} className="w-full py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg">Clock Out</button>
                </div>
            </div>
        </div>
    );
};

export default TimeClock;