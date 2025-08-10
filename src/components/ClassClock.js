import React, { useState, useMemo } from 'react';
import { Clock, ArrowLeft, LogIn, LogOut, Briefcase, ChevronRight } from 'lucide-react';

const PinPad = ({ onPinSubmit, onPinChange, pin, pinLength, disabled }) => {
    const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

    const handleButtonClick = (value) => {
        if (disabled) return;
        if (value === '⌫') {
            onPinChange(pin.slice(0, -1));
        } else if (pin.length < pinLength) {
            onPinChange(pin + value);
        }
    };

    return (
        <div className={`w-full max-w-xs mx-auto ${disabled ? 'opacity-50' : ''}`}>
            <div className="grid grid-cols-3 gap-2">
                {buttons.map((btn, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleButtonClick(btn)}
                        disabled={!btn || disabled}
                        className={`h-16 text-2xl font-semibold rounded-lg transition-colors ${
                            btn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-transparent'
                        }`}
                    >
                        {btn}
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={() => onPinSubmit(pin)}
                disabled={disabled || pin.length !== pinLength}
                className="w-full mt-4 h-14 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-400"
            >
                Submit
            </button>
        </div>
    );
};


const ClassClock = ({ users, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut, branding, timeClocks }) => {
    const [view, setView] = useState('device_login'); // Start with device login
    const [devicePin, setDevicePin] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPin, setUserPin] = useState('');
    const [message, setMessage] = useState('');
    const todayISO = new Date().toISOString().split('T')[0];

    const currentUserCheckIn = useMemo(() => {
        if (!selectedUser) return null;
        return dailyCheckIns.find(ci => ci.userId === selectedUser.uid && ci.checkInDate === todayISO && !ci.checkOutTime);
    }, [selectedUser, dailyCheckIns, todayISO]);

    const handleDevicePinSubmit = (submittedPin) => {
        const authorizedDevice = timeClocks.find(tc => tc.pin === submittedPin);
        if (authorizedDevice) {
            setMessage('');
            setView('login');
        } else {
            setMessage("Invalid Device PIN. Access Denied.");
            setDevicePin('');
        }
    };

    const handleUserLogin = (submittedPin) => {
        if (!selectedUser) {
            setMessage("Please select your name first.");
            setUserPin('');
            return;
        }
        if (selectedUser.pin !== submittedPin) {
            setMessage("Invalid PIN. Please try again.");
            setUserPin('');
            return;
        }
        setMessage('');
        setView('class_selection');
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
        setView('login'); // Go back to user selection, not device login
    };

    // --- RENDER LOGIC ---

    const renderDeviceLogin = () => (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">Device Authorization</h1>
            <p className="text-center text-gray-600 mb-6">Enter the 10-digit device PIN to continue.</p>
            <div className="w-full max-w-xs mx-auto text-center mb-4">
                <input
                    type="password"
                    readOnly
                    value={devicePin}
                    onChange={(e) => setDevicePin(e.target.value)} // Allow typing
                    className="w-full tracking-[0.5em] text-center text-3xl bg-gray-100 border-2 rounded-lg p-2"
                    placeholder="**********"
                    maxLength="10"
                />
            </div>
            {message && <p className="text-red-500 text-center text-sm mb-2">{message}</p>}
            <PinPad 
                pin={devicePin} 
                onPinChange={setDevicePin} 
                onPinSubmit={handleDevicePinSubmit} 
                pinLength={10}
            />
        </div>
    );

    const renderUserLogin = () => (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">Class Clock</h1>
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
                <div className="w-full max-w-xs mx-auto text-center mb-4">
                    <input
                        type="password"
                        readOnly
                        value={userPin}
                        className="w-48 tracking-[1em] text-center text-3xl bg-gray-100 border-2 rounded-lg p-2"
                        placeholder="● ● ● ●"
                    />
                </div>
                {message && <p className="text-red-500 text-center text-sm mb-2">{message}</p>}
                <PinPad 
                    pin={userPin} 
                    onPinChange={setUserPin} 
                    onPinSubmit={handleUserLogin} 
                    pinLength={4}
                    disabled={!selectedUser} 
                />
            </div>
        </div>
    );

    const renderActionScreen = () => {
        // Not clocked in at all
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

        // Clocked into a class, but not a station
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

        // Clocked into a station
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