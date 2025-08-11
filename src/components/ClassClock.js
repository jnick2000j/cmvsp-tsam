import React, { useState, useMemo, useEffect } from 'react';
import { Clock, ArrowLeft, LogIn, LogOut, Briefcase, ChevronRight, Delete } from 'lucide-react';

const PinPad = ({ onKeyPress, onClear, onDelete, onSubmit, disabled, pin, pinLength }) => {
    return (
        <div className={`w-full max-w-xs mx-auto ${disabled ? 'opacity-50' : ''}`}>
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button key={num} onClick={() => onKeyPress(num.toString())} disabled={disabled} className="py-4 text-2xl font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-150 ease-in-out">
                        {num}
                    </button>
                ))}
                <button onClick={onClear} disabled={disabled} className="py-4 text-xl font-bold text-gray-700 bg-yellow-400 rounded-lg hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-150 ease-in-out">
                    Clear
                </button>
                <button onClick={() => onKeyPress('0')} disabled={disabled} className="py-4 text-2xl font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-150 ease-in-out">
                    0
                </button>
                <button onClick={onDelete} disabled={disabled} className="py-4 text-xl font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-150 ease-in-out flex items-center justify-center">
                    <Delete size={24} />
                </button>
            </div>
             <button
                type="button"
                onClick={onSubmit}
                disabled={disabled || pin.length !== pinLength}
                className="w-full mt-4 h-14 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-400"
            >
                Submit
            </button>
        </div>
    );
};


const ClassClock = ({ users, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut, branding, timeClocks }) => {
    const [view, setView] = useState('device_login');
    const [devicePin, setDevicePin] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPin, setUserPin] = useState('');
    const [message, setMessage] = useState('');
    const todayISO = new Date().toISOString().split('T')[0];
    
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const currentUserCheckIn = useMemo(() => {
        if (!selectedUser) return null;
        return dailyCheckIns.find(ci => ci.userId === selectedUser.uid && ci.checkInDate === todayISO && !ci.checkOutTime);
    }, [selectedUser, dailyCheckIns, todayISO]);

    const handleDevicePinSubmit = () => {
        const authorizedDevice = timeClocks.find(tc => tc.pin === devicePin);
        if (authorizedDevice) {
            setMessage('');
            setView('login');
        } else {
            setMessage("Invalid Device PIN. Access Denied.");
            setDevicePin('');
        }
    };
    
    const handleDevicePinChange = (e) => {
        const newPin = e.target.value;
        if (/^\d*$/.test(newPin) && newPin.length <= 10) {
            setDevicePin(newPin);
        }
    };

    const handleUserLogin = () => {
        if (!selectedUser) {
            setMessage("Please select your name first.");
            setUserPin('');
            return;
        }
        if (selectedUser.pin !== userPin) {
            setMessage("Invalid PIN. Please try again.");
            setUserPin('');
            return;
        }
        setMessage('');
        setView('class_selection');
    };

    const handleUserPinChange = (e) => {
        const newPin = e.target.value;
        if (/^\d*$/.test(newPin) && newPin.length <= 4) {
            setUserPin(newPin);
        }
    };

    const handleClassSelect = async (classId) => {
        const course = classes.find(c => c.id === classId);
        await handleClassCheckIn(selectedUser, course, null);
        alert(`Successfully clocked into class: ${course.name}.`);
        resetUser();
    };

    const handleStationSelect = async (stationId) => {
        const station = stations.find(s => s.id === stationId);
        const course = classes.find(c => c.id === station.classId);
        await handleClassCheckIn(selectedUser, course, station);
        alert(`Successfully checked into station: ${station.name}.`);
        resetUser();
    };

    const handleStationCheckout = async () => {
        await handleClassCheckOut(currentUserCheckIn.id);
        alert(`Successfully checked out of station.`);
        resetUser();
    };

    const handleClassCheckout = async () => {
        await handleClassCheckOut(currentUserCheckIn.id);
        alert(`Successfully checked out of class.`);
        resetUser();
    };

    const resetUser = () => {
        setSelectedUser(null);
        setUserPin('');
        setMessage('');
        setView('login');
    };

    const renderDeviceLogin = () => (
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-4xl font-bold text-center text-gray-800">Training Clock Login</h2>
            
            <div className="text-center">
                <p className="text-6xl font-mono font-bold text-gray-900 tracking-wider">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xl text-gray-500">
                    {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            
            <p className="text-center text-gray-600">Enter the 10-digit device PIN to continue.</p>
            
            <div className="relative">
                <input
                    type="password"
                    value={devicePin}
                    onChange={handleDevicePinChange}
                    placeholder="**********"
                    maxLength="10"
                    className="w-full px-4 py-3 text-3xl tracking-[0.2em] text-center bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
            </div>

            {message && <p className="text-red-500 text-center text-sm mb-2">{message}</p>}
            
            <PinPad 
                pin={devicePin} 
                pinLength={10}
                onKeyPress={(key) => { if (devicePin.length < 10) setDevicePin(devicePin + key) }}
                onDelete={() => setDevicePin(devicePin.slice(0, -1))}
                onClear={() => setDevicePin('')}
                onSubmit={handleDevicePinSubmit}
            />
        </div>
    );

    const renderUserLogin = () => (
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-4xl font-bold text-center text-gray-800">Training Class Login</h2>
            
            <div className="text-center">
                <p className="text-6xl font-mono font-bold text-gray-900 tracking-wider">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xl text-gray-500">
                    {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">1. Select Your Name</label>
                <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                        setSelectedUser(users.find(u => u.id === e.target.value));
                        setUserPin('');
                        setMessage('');
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Please select your name --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    2. Enter Your PIN {selectedUser && `for ${selectedUser.firstName}`}
                </label>
                <div className="relative">
                    <input
                        type="password"
                        value={userPin}
                        onChange={handleUserPinChange}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-4 py-3 text-3xl tracking-[0.5em] text-center bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={!selectedUser}
                    />
                </div>
                {message && <p className="text-red-500 text-center text-sm mt-2 mb-2">{message}</p>}
                <PinPad 
                    pin={userPin} 
                    pinLength={4}
                    onKeyPress={(key) => { if (userPin.length < 4) setUserPin(userPin + key) }}
                    onDelete={() => setUserPin(userPin.slice(0, -1))}
                    onClear={() => setUserPin('')}
                    onSubmit={handleUserLogin}
                    disabled={!selectedUser} 
                />
            </div>
        </div>
    );

    const renderActionScreen = () => {
        if (!currentUserCheckIn) {
            const enrolledClasses = classes.filter(c => selectedUser.enrolledClasses?.includes(c.id) && !c.isCompleted);
            return (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Welcome, {selectedUser.firstName}</h2>
                    <p className="mb-6">You are not clocked in. Please select a class to clock into.</p>
                    {enrolledClasses.map(course => (
                        <button key={course.id} onClick={() => handleClassSelect(course.id)} className="w-full text-left p-4 mb-3 bg-white rounded-lg shadow hover:bg-gray-50 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{course.name}</p>
                                <p className="text-sm text-gray-500">{course.startDate}</p>
                            </div>
                            <LogIn className="h-5 w-5 text-green-500" />
                        </button>
                    ))}
                </div>
            );
        }

        if (currentUserCheckIn && !currentUserCheckIn.stationId) {
            const availableStations = stations.filter(s => s.classId === currentUserCheckIn.classId);
            return (
                <div>
                    <h2 className="text-2xl font-bold mb-2">You are clocked into {classes.find(c => c.id === currentUserCheckIn.classId)?.name}.</h2>
                    <p className="mb-6">Please select a station to check into.</p>
                    {availableStations.map(station => (
                        <button key={station.id} onClick={() => handleStationSelect(station.id)} className="w-full text-left p-4 mb-3 bg-white rounded-lg shadow hover:bg-gray-50 flex justify-between items-center">
                            <p className="font-semibold">{station.name}</p>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>
                    ))}
                </div>
            );
        }

        if (currentUserCheckIn && currentUserCheckIn.stationId) {
            const currentStation = stations.find(s => s.id === currentUserCheckIn.stationId);
            return (
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">You are checked into {currentStation?.name}.</h2>
                    <p className="text-gray-600 mb-6">What would you like to do?</p>
                    <div className="space-y-4">
                        <button onClick={handleStationCheckout} className="w-full p-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 flex items-center justify-center">
                            <LogOut className="mr-2 h-5 w-5" /> Check Out of Station
                        </button>
                        <button onClick={handleClassCheckout} className="w-full p-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center">
                            <LogOut className="mr-2 h-5 w-5" /> Check Out of Class
                        </button>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            {branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="mx-auto h-24 mb-6" />}
            
            {view === 'device_login' && renderDeviceLogin()}
            {view === 'login' && renderUserLogin()}

            {view !== 'login' && view !== 'device_login' && (
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative">
                     <button onClick={resetUser} className="absolute top-6 left-6 flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={16} className="mr-1" /> Back to User Select
                    </button>
                    <div className="mt-8">
                        {renderActionScreen()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassClock;