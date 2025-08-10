import React, { useState, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Clock, LogIn, LogOut, Briefcase, ChevronRight } from 'lucide-react';

const ClassClock = ({ users, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut, branding, timeClocks }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [pin, setPin] = useState('');
    const [message, setMessage] = useState('');
    const [view, setView] = useState('login'); // login, options, station_checkin
    const [selectedClass, setSelectedClass] = useState(null);

    const todayISO = new Date().toISOString().split('T')[0];

    // Find the user's current check-in status
    const currentUserCheckIn = useMemo(() => {
        if (!selectedUser) return null;
        return dailyCheckIns.find(ci => ci.userId === selectedUser.id && ci.checkInDate === todayISO && !ci.checkOutTime);
    }, [selectedUser, dailyCheckIns, todayISO]);

    const handleLogin = () => {
        if (!selectedUser || !pin) {
            setMessage("Please select your name and enter your PIN.");
            return;
        }
        if (selectedUser.pin !== pin) {
            setMessage("Invalid PIN. Please try again.");
            return;
        }
        setMessage('');
        setView('options');
    };

    const handleClassClockIn = async (classId) => {
        const course = classes.find(c => c.id === classId);
        await handleClassCheckIn(selectedUser, course, null); // Assuming station is null for class check-in
        setMessage(`You have successfully clocked into ${course.name}. Would you like to check into a station?`);
        // This is a simplified confirmation. A more robust solution might use a different view state.
    };

    const handleStationCheckIn = async (stationId) => {
        const station = stations.find(s => s.id === stationId);
        const course = classes.find(c => c.id === station.classId);
        await handleClassCheckIn(selectedUser, course, station);
        reset();
        alert(`Successfully checked into station: ${station.name}`);
    };

    const handleStationCheckOut = async () => {
        await handleClassCheckOut(currentUserCheckIn.id);
        reset();
        alert("Successfully checked out of the station.");
    };

    const handleClassCheckOutAction = async () => {
        await handleClassCheckOut(currentUserCheckIn.id);
        reset();
        alert("Successfully checked out of the class.");
    };

    const reset = () => {
        setSelectedUser(null);
        setPin('');
        setMessage('');
        setView('login');
        setSelectedClass(null);
    };

    const renderLogin = () => (
        <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-2">Class Clock-In</h2>
            <p className="text-center text-gray-600 mb-6">Select your name and enter your PIN to begin.</p>
            <div className="space-y-4">
                <select onChange={(e) => setSelectedUser(users.find(u => u.id === e.target.value))} className="w-full p-3 border rounded-md">
                    <option>Select your name...</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
                </select>
                <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter your PIN" className="w-full p-3 border rounded-md" />
                <button onClick={handleLogin} className="w-full p-3 bg-accent text-white rounded-md font-semibold hover:bg-accent-hover">
                    Continue
                </button>
                {message && <p className="text-red-500 text-center mt-4">{message}</p>}
            </div>
        </div>
    );

    const renderOptions = () => {
        if (!currentUserCheckIn) {
            // User is not clocked into any class today
            const enrolledClasses = classes.filter(c => selectedUser.enrolledClasses?.includes(c.id));
            return (
                <div className="w-full max-w-lg">
                    <h2 className="text-2xl font-bold mb-4">Welcome, {selectedUser.firstName}</h2>
                    <p className="mb-6">Please clock into your class for today.</p>
                    <div className="space-y-3">
                        {enrolledClasses.map(course => (
                            <button key={course.id} onClick={() => handleClassClockIn(course.id)} className="w-full text-left p-4 bg-white rounded-lg shadow hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{course.name}</p>
                                    <p className="text-sm text-gray-500">{course.startDate}</p>
                                </div>
                                <LogIn className="h-5 w-5 text-green-500" />
                            </button>
                        ))}
                    </div>
                     <button onClick={reset} className="mt-6 text-sm text-gray-600 hover:underline">Not {selectedUser.firstName}? Log out.</button>
                </div>
            );
        }

        if (currentUserCheckIn && !currentUserCheckIn.stationId) {
            // User is clocked into a class, but not a station
            return (
                <div className="w-full max-w-lg text-center">
                    <h2 className="text-2xl font-bold mb-2">You are clocked into {classes.find(c => c.id === currentUserCheckIn.classId)?.name}.</h2>
                    <p className="text-gray-600 mb-6">What would you like to do?</p>
                    <div className="space-y-4">
                        <button onClick={() => setView('station_checkin')} className="w-full p-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center">
                            <Briefcase className="mr-2 h-5 w-5" /> Check Into a Station
                        </button>
                        <button onClick={handleClassCheckOutAction} className="w-full p-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center">
                            <LogOut className="mr-2 h-5 w-5" /> Check Out of Class
                        </button>
                    </div>
                     <button onClick={reset} className="mt-8 text-sm text-gray-600 hover:underline">Done</button>
                </div>
            );
        }

        if (currentUserCheckIn && currentUserCheckIn.stationId) {
            // User is clocked into a class AND a station
            const currentStation = stations.find(s => s.id === currentUserCheckIn.stationId);
            return (
                 <div className="w-full max-w-lg text-center">
                    <h2 className="text-2xl font-bold mb-2">You are checked into {currentStation.name}.</h2>
                    <p className="text-gray-600 mb-6">What would you like to do?</p>
                    <div className="space-y-4">
                         <button onClick={handleStationCheckOut} className="w-full p-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 flex items-center justify-center">
                            <LogOut className="mr-2 h-5 w-5" /> Check Out of Station
                        </button>
                        <button onClick={handleClassCheckOutAction} className="w-full p-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center">
                            <LogOut className="mr-2 h-5 w-5" /> Check Out of Class
                        </button>
                    </div>
                     <button onClick={reset} className="mt-8 text-sm text-gray-600 hover:underline">Done</button>
                </div>
            );
        }
    };
    
    const renderStationCheckIn = () => {
        const availableStations = stations.filter(s => s.classId === currentUserCheckIn.classId);
        return (
             <div className="w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Select a Station</h2>
                <div className="space-y-3">
                    {availableStations.map(station => (
                        <button key={station.id} onClick={() => handleStationCheckIn(station.id)} className="w-full text-left p-4 bg-white rounded-lg shadow hover:bg-gray-50 flex justify-between items-center">
                            <p className="font-semibold">{station.name}</p>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>
                    ))}
                </div>
                <button onClick={() => setView('options')} className="mt-6 text-sm text-gray-600 hover:underline">Back to options</button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" style={{'--accent': branding.accent, '--accent-hover': branding.accentHover}}>
            {branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="h-16 mb-8" />}
            {view === 'login' && renderLogin()}
            {view === 'options' && renderOptions()}
            {view === 'station_checkin' && renderStationCheckIn()}
        </div>
    );
};

export default ClassClock;
