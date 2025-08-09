// src/components/ClassClock.js
import React, { useState, useMemo, useEffect } from 'react';
import { LogIn, LogOut, ArrowLeft, Send } from 'lucide-react';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES } from '../constants';

const PinPad = ({ onPinChange, pin, pinLength = 4 }) => {
    // ... (PinPad component remains the same)
    const handleButtonClick = (num) => {
        if (pin.length < pinLength) {
            onPinChange(pin + num);
        }
    };
    const handleBackspace = () => { onPinChange(pin.slice(0, -1)); };
    const handleClear = () => { onPinChange(''); };
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

const ClassClock = ({ users, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut, branding, timeClocks }) => {
    const [view, setView] = useState('deviceLogin');
    const [devicePinInput, setDevicePinInput] = useState('');
    const [deviceLoginError, setDeviceLoginError] = useState('');
    const [loggedInDeviceName, setLoggedInDeviceName] = useState('');

    const [selectedUser, setSelectedUser] = useState(null);
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // Added for success messages
    const todayISO = new Date().toISOString().split('T')[0];

    const resetClockState = () => {
        setSelectedUser(null);
        setPinInput('');
        setError('');
        setMessage('');
        setView('userSelect');
    };

    useEffect(() => {
        let timer;
        if (message.includes('successfully')) {
            timer = setTimeout(() => {
                resetClockState();
            }, 5000); // 5 seconds
        }
        return () => clearTimeout(timer);
    }, [message]);


    const handleDeviceLogin = (e) => {
        e.preventDefault();
        setDeviceLoginError('');
        const validDevice = timeClocks.find(device => device.pin === devicePinInput && device.type === 'Class Clock');
        if (validDevice) {
            setLoggedInDeviceName(validDevice.name);
            setView('userSelect');
        } else {
            setDeviceLoginError('Invalid Class Clock PIN. Please try again.');
        }
        setDevicePinInput('');
    };
    
    const userGroups = useMemo(() => {
        const students = users.filter(u => u.role === 'Student');
        const instructors = users.filter(u => INSTRUCTOR_ROLES.includes(u.role));
        const support = users.filter(u => SUPPORT_ROLES.includes(u.role));
        return { students, instructors, support };
    }, [users]);

    const enrolledClasses = useMemo(() => {
        if (!selectedUser) return [];
        return classes.filter(c => selectedUser.enrolledClasses?.includes(c.id));
    }, [selectedUser, classes]);

    const userCheckIns = useMemo(() => {
        if (!selectedUser) return [];
        return dailyCheckIns.filter(ci => ci.studentId === selectedUser.uid && ci.checkInDate === todayISO && !ci.checkOutTime);
    }, [selectedUser, dailyCheckIns, todayISO]);


    const handleUserSelect = (userId) => {
        const user = users.find(u => u.id === userId);
        setSelectedUser(user);
        setView('pin');
        setError('');
    };

    const handlePinValidate = () => {
        if (selectedUser && selectedUser.timeClockPin === pinInput) {
            if (userCheckIns.length > 0) {
                setView('checkedInList');
            } else {
                setView('stationSelect');
            }
            setError('');
        } else {
            setError('Invalid PIN. Please try again.');
        }
        setPinInput('');
    };
    
    const handleBack = () => {
        setSelectedUser(null);
        setPinInput('');
        setError('');
        setView('userSelect');
    };

    const onCheckIn = (user, course, station) => {
        handleClassCheckIn(user, course, station);
        setMessage(`${user.firstName} checked in successfully!`);
    };

    const onCheckOut = (checkInId) => {
        handleClassCheckOut(checkInId);
        setMessage(`${selectedUser.firstName} checked out successfully!`);
    };

    const renderView = () => {
        switch (view) {
            case 'deviceLogin':
                return (
                     <form onSubmit={handleDeviceLogin} className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-6">
                        <div className="flex justify-center mb-4">
                            {branding && branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-20 w-auto" />}
                        </div>
                        <h1 className="text-2xl font-bold text-center text-gray-800">Class Clock Login</h1>
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
                );
            case 'userSelect':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-center">Select Your Name</h2>
                        <select onChange={(e) => handleUserSelect(e.target.value)} defaultValue="" className="w-full px-4 py-3 border rounded-lg">
                            <option value="" disabled>-- Please Select --</option>
                            <optgroup label="Students">
                                {userGroups.students.map(u => (<option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>))}
                            </optgroup>
                             <optgroup label="Instructors">
                                {userGroups.instructors.map(u => (<option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>))}
                            </optgroup>
                             <optgroup label="Support">
                                {userGroups.support.map(u => (<option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>))}
                            </optgroup>
                        </select>
                    </div>
                );
            case 'pin':
                return (
                    <div className="space-y-4">
                        <button onClick={handleBack} className="flex items-center text-sm text-accent hover:text-accent-hover"><ArrowLeft className="h-4 w-4 mr-1"/>Back</button>
                        <h2 className="text-2xl font-bold text-center">Welcome, {selectedUser.firstName}</h2>
                        <p className="text-center text-gray-500">Please enter your PIN</p>
                        <input 
                            type="password" 
                            value={pinInput} 
                            onChange={(e) => setPinInput(e.target.value)}
                            maxLength="4"
                            className="w-full px-4 py-3 border rounded-lg text-center tracking-widest text-xl" 
                        />
                        <PinPad onPinChange={setPinInput} pin={pinInput} />
                        <button onClick={handlePinValidate} className="w-full py-3 text-white bg-primary hover:bg-primary-hover rounded-lg font-semibold flex items-center justify-center">
                            <LogIn className="h-5 w-5 mr-2"/>Continue
                        </button>
                    </div>
                );
            case 'stationSelect':
                 return (
                    <div className="space-y-4">
                        <button onClick={handleBack} className="flex items-center text-sm text-accent hover:text-accent-hover"><ArrowLeft className="h-4 w-4 mr-1"/>Back</button>
                        <h2 className="text-2xl font-bold">Check In to a Station</h2>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                        {enrolledClasses.map(cls => (
                            <div key={cls.id} className="p-4 border rounded-lg">
                                <h3 className="font-bold text-lg">{cls.name}</h3>
                                <ul className="mt-2 space-y-2">
                                    {stations.filter(s => s.classId === cls.id).map(station => (
                                        <li key={station.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                            <span>{station.name}</span>
                                            <button onClick={() => onCheckIn(selectedUser, cls, station)} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center">
                                                <Send className="h-4 w-4 mr-1"/> Check In
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        </div>
                    </div>
                );
            case 'checkedInList':
                 return (
                    <div className="space-y-4">
                        <button onClick={handleBack} className="flex items-center text-sm text-accent hover:text-accent-hover"><ArrowLeft className="h-4 w-4 mr-1"/>Back</button>
                        <h2 className="text-2xl font-bold">Check Out of a Station</h2>
                         <ul className="mt-2 space-y-2">
                            {userCheckIns.map(ci => {
                                const station = stations.find(s => s.id === ci.stationId);
                                return (
                                    <li key={ci.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                        <span>{station ? station.name : 'Unknown Station'}</span>
                                        <button onClick={() => onCheckOut(ci.id)} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold flex items-center">
                                            <LogOut className="h-4 w-4 mr-1"/> Check Out
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
         <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
             {view === 'deviceLogin' ? (
                 renderView()
             ) : (
                 <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                     <div className="flex justify-center mb-6">
                        {branding && branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-16 w-auto" />}
                    </div>
                    {error && <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
                    {message && <p className="text-center text-green-500 bg-green-50 p-3 rounded-lg mb-4">{message}</p>}
                    {renderView()}
                </div>
             )}
        </div>
    );
};

export default ClassClock;