// src/components/TimeClock.js
import React, { useState } from 'react';
import { MOUNTAIN_AREAS, SHIFT_TYPES, PATROLS } from '../constants';
import { LogIn, LogOut } from 'lucide-react';

// PinPad component - now without its own submit button
const PinPad = ({ onPinChange, pin, pinLength = 10 }) => {
    const handleButtonClick = (num) => {
        if (pin.length < pinLength) {
            onPinChange(pin + num);
        }
    };

    const handleBackspace = () => {
        onPinChange(pin.slice(0, -1));
    };
    
    const handleClear = () => {
        onPinChange('');
    };

    const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

    return (
        <div className="w-full max-w-xs mx-auto">
            <div className="grid grid-cols-3 gap-2">
                {buttons.map((btn) => (
                    <button
                        type="button"
                        key={btn}
                        onClick={() => {
                            if (btn === 'C') handleClear();
                            else if (btn === '⌫') handleBackspace();
                            else handleButtonClick(btn);
                        }}
                        className="p-4 text-xl font-bold bg-gray-200 rounded-lg hover:bg-gray-300 aspect-square"
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
};


const TimeClock = ({ users, onClockIn, onClockOut, branding, timeClocks }) => {
    const [isDeviceLoggedIn, setIsDeviceLoggedIn] = useState(false);
    const [devicePinInput, setDevicePinInput] = useState('');
    const [deviceLoginError, setDeviceLoginError] = useState('');
    const [loggedInDeviceName, setLoggedInDeviceName] = useState('');

    const [selectedUserId, setSelectedUserId] = useState('');
    const [userPinInput, setUserPinInput] = useState('');
    const [area, setArea] = useState(MOUNTAIN_AREAS[0]);
    const [shiftType, setShiftType] = useState(SHIFT_TYPES[0]);
    const [patrol, setPatrol] = useState(PATROLS[0]);
    const [isGuest, setIsGuest] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestAgency, setGuestAgency] = useState('');
    const [message, setMessage] = useState('');

    const handleDeviceLogin = (e) => {
        e.preventDefault(); // Prevent form submission
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
            onClockIn({ isGuest: true, name: guestName, agency: guestAgency, area, shiftType, patrol });
            setGuestName('');
            setGuestAgency('');
        } else {
            if (!selectedUserId || !userPinInput) {
                setMessage("Please select a user and enter a PIN.");
                return;
            }
            onClockIn({ isGuest: false, userId: selectedUserId, pin: userPinInput, area, shiftType, patrol });
            setUserPinInput('');
        }
        setMessage("Clocked IN successfully!");
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
            if (!selectedUserId || !userPinInput) {
                setMessage("Please select a user and enter a PIN.");
                return;
            }
            onClockOut({ isGuest: false, userId: selectedUserId, pin: userPinInput });
            setUserPinInput('');
        }
        setMessage("Clocked OUT successfully!");
    };
    
    if (!isDeviceLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <form onSubmit={handleDeviceLogin} className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-6">
                    <div className="flex justify-center mb-4">
                        {branding && branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-20 w-auto" />}
                    </div>
                    <h1 className="text-2xl font-bold text-center text-gray-800">Device Login</h1>
                    {deviceLoginError && <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg">{deviceLoginError}</p>}
                    
                    <input
                        type="password"
                        value={devicePinInput}
                        onChange={(e) => setDevicePinInput(e.target.value)}
                        placeholder="Enter 10-Digit PIN"
                        className="w-full px-4 py-3 border rounded-lg text-center tracking-widest text-xl"
                        maxLength="10"
                        autoFocus
                    />
                    <PinPad onPinChange={setDevicePinInput} pin={devicePinInput} pinLength={10} />
                     <button type="submit" className="w-full py-3 text-white bg-primary hover:bg-primary-hover rounded-lg flex items-center justify-center font-semibold">
                        <LogIn className="h-5 w-5 mr-2" />
                        Login Device
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8 relative">
                <div className="absolute top-4 right-4">
                    <button onClick={handleDeviceLogout} className="text-xs text-gray-500 hover:text-red-600 flex items-center">
                        <LogOut className="h-4 w-4 mr-1" />
                        Logout Device
                    </button>
                </div>
                <div className="text-center mb-6">
                    {branding && branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-16 w-auto mx-auto" />}
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">Time Clock</h1>
                    <p className="text-sm text-gray-500">{loggedInDeviceName}</p>
                </div>
                
                {message && <p className="text-center text-green-500 mb-4">{message}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: User Info & Actions */}
                    <div className="space-y-4">
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
                            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                                <option value="">-- Select Your Name --</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                            </select>
                        )}
                        
                        <select value={patrol} onChange={(e) => setPatrol(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                            {PATROLS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        
                        <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                            {MOUNTAIN_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>

                        <select value={shiftType} onChange={(e) => setShiftType(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                            {SHIFT_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>

                        <div className="flex space-x-4 pt-4 border-t">
                            <button onClick={handleClockIn} className="w-full py-3 text-white bg-primary hover:bg-primary-hover rounded-lg font-semibold">IN</button>
                            <button onClick={handleClockOut} className="w-full py-3 text-white bg-primary hover:bg-primary-hover rounded-lg font-semibold">OUT</button>
                        </div>
                    </div>

                    {/* Right Column: Pin Pad */}
                    {!isGuest && (
                        <div className="flex flex-col items-center">
                             <input
                                type="password"
                                value={userPinInput}
                                onChange={(e) => setUserPinInput(e.target.value)}
                                placeholder="Enter Your PIN"
                                className="w-full max-w-xs px-4 py-3 border rounded-lg text-center tracking-widest text-xl mb-4"
                                maxLength="4"
                            />
                            <PinPad onPinChange={setUserPinInput} pin={userPinInput} pinLength={4} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimeClock;