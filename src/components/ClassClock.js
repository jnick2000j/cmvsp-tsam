import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Clock, ArrowLeft, LogIn, LogOut, Briefcase, ChevronRight, Delete } from 'lucide-react';

const PinPad = ({ onKeyPress, onClear, onDelete, onSubmit, disabled, pin, pinLength }) => {
    const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

    const handleButtonClick = (value) => {
        if (disabled) return;
        if (value === 'C') {
            onClear();
        } else if (value === '⌫') {
            onDelete();
        } else {
            onKeyPress(value);
        }
    };

    return (
        <div className={`w-full max-w-xs mx-auto ${disabled ? 'opacity-50' : ''}`}>
            <div className="grid grid-cols-3 gap-2">
                {buttons.map((btn) => (
                    <button
                        key={btn}
                        type="button"
                        onClick={() => handleButtonClick(btn)}
                        disabled={disabled && btn !== 'C' && btn !== '⌫'}
                        className="p-4 text-xl font-bold bg-gray-200 rounded-lg hover:bg-gray-300 aspect-square"
                    >
                        {btn}
                    </button>
                ))}
            </div>
            {onSubmit && (
                 <button
                    type="button"
                    onClick={onSubmit}
                    disabled={disabled || pin.length !== pinLength}
                    className="w-full mt-4 h-14 bg-primary text-white text-lg font-bold rounded-lg hover:bg-primary-hover disabled:bg-gray-400"
                >
                    Submit
                </button>
            )}
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
    
    const activityTimeoutRef = useRef(null);

    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const resetUser = useCallback(() => {
        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }
        setSelectedUser(null);
        setUserPin('');
        setMessage('');
        setView('login');
    }, []);

    const currentUserCheckIn = useMemo(() => {
        if (!selectedUser) return null;
        return dailyCheckIns.find(ci => ci.userId === selectedUser.uid && ci.checkInDate === todayISO && !ci.checkOutTime);
    }, [selectedUser, dailyCheckIns, todayISO]);

    useEffect(() => {
        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }

        if (view === 'class_selection' && selectedUser) {
            const timeoutDuration = 20000; // 20-second inactivity timeout
            
            activityTimeoutRef.current = setTimeout(() => {
                console.log(`Inactivity timeout reached. Returning to login.`);
                resetUser();
            }, timeoutDuration);
        }

        return () => {
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
        };
    }, [view, selectedUser, resetUser]);


    const handleDevicePinSubmit = (e) => {
        e.preventDefault();
        const authorizedDevice = timeClocks.find(tc => tc.pin === devicePin && tc.type === 'Class Clock');
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

    const handleUserLogin = (e) => {
        e.preventDefault();
        if (!selectedUser) {
            setMessage("Please select your name first.");
            setUserPin('');
            return;
        }
        if (String(selectedUser.timeClockPin) !== userPin) {
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
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        
        const course = classes.find(c => c.id === classId);
        try {
            await handleClassCheckIn(selectedUser, course, null);
            setView('message');
            setMessage(`Successfully clocked into class: ${course.name}.`);
            setTimeout(resetUser, 5000); // 5-second delay
        } catch (error) {
            console.error("Failed to check into class:", error);
            setMessage("Error: Could not check into the class. Please try again.");
            setTimeout(resetUser, 5000); // 5-second delay
        }
    };

    const handleStationSelect = async (stationId) => {
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);

        const station = stations.find(s => s.id === stationId);
        const course = classes.find(c => c.id === station.classId);
        try {
            await handleClassCheckIn(selectedUser, course, station);
            setView('message');
            setMessage(`Successfully checked into station: ${station.name}.`);
            setTimeout(resetUser, 5000); // 5-second delay
        } catch (error) {
            console.error("Failed to check into station:", error);
            setMessage("Error: Could not check into the station. Please try again.");
            setTimeout(resetUser, 5000); // 5-second delay
        }
    };

    const handleStationCheckout = async () => {
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        
        try {
            await handleClassCheckOut(currentUserCheckIn.id);
            setView('message');
            setMessage(`Successfully checked out of station.`);
            setTimeout(resetUser, 5000); // 5-second delay
        } catch (error) {
            console.error("Failed to check out of station:", error);
            setMessage("Error: Could not check out of the station. Please try again.");
            setTimeout(resetUser, 5000); // 5-second delay
        }
    };

    const handleClassCheckout = async () => {
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        
        try {
            await handleClassCheckOut(currentUserCheckIn.id);
            setView('message');
            setMessage(`Successfully checked out of class.`);
            setTimeout(resetUser, 5000); // 5-second delay
        } catch (error) {
            console.error("Failed to check out of class:", error);
            setMessage("Error: Could not check out of the class. Please try again.");
            setTimeout(resetUser, 5000); // 5-second delay
        }
    };

    const renderDeviceLogin = () => (
        <form onSubmit={handleDevicePinSubmit} className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="flex justify-center mb-4">
                {branding && branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-20 w-auto" />}
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-800">Training Clock Login</h1>
            {message && <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg">{message}</p>}
            
            <input
                type="password"
                value={devicePin}
                onChange={handleDevicePinChange}
                placeholder="Enter 10-Digit PIN"
                className="w-full px-4 py-3 border rounded-lg text-center tracking-widest text-xl focus:ring-2 focus:ring-accent"
                maxLength="10"
                autoFocus
            />
            <PinPad 
                pin={devicePin} 
                pinLength={10}
                onKeyPress={(key) => { if (devicePin.length < 10) setDevicePin(devicePin + key) }}
                onDelete={() => setDevicePin(devicePin.slice(0, -1))}
                onClear={() => setDevicePin('')}
            />
             <button type="submit" className="w-full py-3 text-white bg-primary hover:bg-primary-hover rounded-lg flex items-center justify-center font-semibold">
                <LogIn className="h-5 w-5 mr-2" />
                Login Device
            </button>
        </form>
    );

    const renderUserLogin = () => (
        <form onSubmit={handleUserLogin} className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-6">
             <div className="flex justify-center mb-4">
                {branding && branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-20 w-auto" />}
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-800">Training Class Login</h1>
            
            <div className="space-y-4">
                <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                        setSelectedUser(users.find(u => u.id === e.target.value));
                        setUserPin('');
                        setMessage('');
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-accent"
                >
                    <option value="">-- Select Your Name --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                        </option>
                    ))}
                </select>
                
                <input
                    type="password"
                    value={userPin}
                    onChange={handleUserPinChange}
                    placeholder="Enter Your PIN"
                    className="w-full px-4 py-3 border rounded-lg text-center tracking-widest text-xl focus:ring-2 focus:ring-accent"
                    maxLength="4"
                    disabled={!selectedUser}
                />
            </div>
            {message && <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg">{message}</p>}
            <PinPad 
                pin={userPin} 
                pinLength={4}
                onKeyPress={(key) => { if (userPin.length < 4) setUserPin(userPin + key) }}
                onDelete={() => setUserPin(userPin.slice(0, -1))}
                onClear={() => setUserPin('')}
                onSubmit={handleUserLogin}
                disabled={!selectedUser} 
            />
        </form>
    );

    const renderActionScreen = () => {
        if (!selectedUser) {
            return <p>Please select a user.</p>;
        }

        if (!currentUserCheckIn) {
            const enrolledClasses = classes.filter(c => selectedUser.enrolledClasses?.includes(c.id) && !c.isCompleted);
            return (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Welcome, {selectedUser.firstName}</h2>
                    <p className="mb-6">You are not clocked in. Please select a class to clock into.</p>
                    {enrolledClasses.length > 0 ? enrolledClasses.map(course => (
                        <button key={course.id} onClick={() => handleClassSelect(course.id)} className="w-full text-left p-4 mb-3 bg-white rounded-lg shadow hover:bg-gray-50 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{course.name}</p>
                                <p className="text-sm text-gray-500">{course.startDate}</p>
                            </div>
                            <LogIn className="h-5 w-5 text-green-500" />
                        </button>
                    )) : <p>No available classes for enrollment.</p>}
                </div>
            );
        }

        if (currentUserCheckIn && !currentUserCheckIn.stationId) {
            const availableStations = stations.filter(s => s.classId === currentUserCheckIn.classId);
            if (availableStations.length === 0) {
                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-2">You are now checked into {classes.find(c => c.id === currentUserCheckIn.classId)?.name}.</h2>
                        <p className="mb-6">There are no stations to select for this class. Returning to login shortly...</p>
                    </div>
                );
            }
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
    
    const renderMessageScreen = () => {
        return (
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">{message}</h2>
                <p>Returning to the login screen...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            {view === 'device_login' && renderDeviceLogin()}
            {view === 'login' && renderUserLogin()}
            {view === 'message' && renderMessageScreen()}

            {view === 'class_selection' && (
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