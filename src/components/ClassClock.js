import React, { useState, useMemo } from 'react';
import { Clock, ArrowLeft } from 'lucide-react';

const PinPad = ({ onPinSubmit, onPinChange, pin, disabled }) => {
    const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

    const handleButtonClick = (value) => {
        if (disabled) return;
        if (value === '⌫') {
            onPinChange(pin.slice(0, -1));
        } else if (pin.length < 4) {
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
                disabled={disabled || pin.length !== 4}
                className="w-full mt-4 h-14 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-400"
            >
                Submit
            </button>
        </div>
    );
};


const ClassClock = ({ users, classes, stations, dailyCheckIns, handleClassCheckIn, handleClassCheckOut, branding }) => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedStation, setSelectedStation] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [pin, setPin] = useState('');

    const activeStations = useMemo(() => {
        if (!selectedCourse) return [];
        return stations.filter(s => s.classId === selectedCourse.id);
    }, [selectedCourse, stations]);
    
    const attendees = useMemo(() => {
        if (!selectedCourse) return [];
        const enrolledUserIds = new Set(
            users.filter(u => u.enrolledClasses?.includes(selectedCourse.id)).map(u => u.id)
        );
        const instructorIds = new Set(selectedCourse.leadInstructorIds || []);
        
        return users.filter(u => enrolledUserIds.has(u.id) || instructorIds.has(u.id))
            .map(u => ({...u, isInstructor: instructorIds.has(u.id)}));

    }, [selectedCourse, users]);
    
    const handlePinSubmit = (submittedPin) => {
        if (!selectedUser) {
            alert("Please select your name first.");
            setPin('');
            return;
        }

        if (selectedUser.pin !== submittedPin) {
            alert("Invalid PIN. Please try again.");
            setPin('');
            return;
        }

        const activeCheckIn = dailyCheckIns.find(ci => ci.userId === selectedUser.uid && ci.stationId === selectedStation.id && !ci.checkOutTime);

        if (activeCheckIn) {
            handleClassCheckOut(activeCheckIn.id);
            alert(`${selectedUser.firstName} checked out successfully from ${selectedStation.name}.`);
        } else {
            handleClassCheckIn(selectedUser, selectedCourse, selectedStation);
            alert(`${selectedUser.firstName} checked in successfully to ${selectedStation.name}.`);
        }

        // Reset for the next person
        setSelectedUser(null);
        setPin('');
    };
    
    const handleUserSelect = (userId) => {
        const user = users.find(u => u.id === userId);
        setSelectedUser(user);
        setPin(''); // Clear pin when a new user is selected
    };

    // --- Main Rendering Logic ---

    // Step 1: Course Selection (Original Logic)
    if (!selectedCourse) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg text-center">
                    {branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="mx-auto h-24 mb-6" />}
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Select Your Course</h1>
                    <div className="space-y-3">
                        {classes.filter(c => !c.isCompleted).map(course => (
                            <button
                                key={course.id}
                                onClick={() => setSelectedCourse(course)}
                                className="w-full text-left p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                                <p className="text-lg font-semibold text-gray-900">{course.name}</p>
                                <p className="text-sm text-gray-500">{course.startDate}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    // Step 2: Station Selection (Original Logic)
    if (!selectedStation) {
         return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                 <div className="w-full max-w-lg text-center">
                    <button onClick={() => setSelectedCourse(null)} className="absolute top-6 left-6 flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={16} className="mr-1" /> Back to Courses
                    </button>
                    {branding.siteLogo && <img src={branding.siteLogo} alt="Logo" className="mx-auto h-24 mb-2" />}
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Select Your Station</h1>
                    <p className="text-md text-gray-600 mb-6">Course: {selectedCourse.name}</p>
                     <div className="space-y-3">
                         {activeStations.map(station => (
                             <button
                                 key={station.id}
                                 onClick={() => setSelectedStation(station)}
                                 className="w-full text-left p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                                <p className="text-lg font-semibold text-gray-900">{station.name}</p>
                             </button>
                         ))}
                    </div>
                 </div>
            </div>
         );
    }

    // Step 3: COMBINED User Selection + Pin Pad View
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                <div className="flex items-center mb-6">
                    <button onClick={() => setSelectedStation(null)} className="p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="ml-4 text-left">
                        <h1 className="text-2xl font-bold text-gray-800">{selectedStation.name}</h1>
                        <p className="text-sm text-gray-500">{selectedCourse.name}</p>
                    </div>
                </div>

                {/* Name Selection (from original code) */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">1. Select Your Name</label>
                    <select
                        value={selectedUser?.id || ''}
                        onChange={(e) => handleUserSelect(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Please select your name --</option>
                        {attendees.map(attendee => (
                            <option key={attendee.id} value={attendee.id}>
                                {attendee.firstName} {attendee.lastName} {attendee.isInstructor && '(Instructor)'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Pin Input and Pad */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. Enter Your 4-Digit PIN {selectedUser && `for ${selectedUser.firstName}`}
                    </label>
                    <div className="w-full max-w-xs mx-auto text-center mb-4">
                        <input
                            type="password"
                            readOnly
                            value={pin}
                            className="w-48 tracking-[1em] text-center text-3xl bg-gray-100 border-2 rounded-lg p-2"
                            placeholder="● ● ● ●"
                        />
                    </div>
                    <PinPad 
                        pin={pin} 
                        onPinChange={setPin} 
                        onPinSubmit={handlePinSubmit} 
                        disabled={!selectedUser} 
                    />
                </div>
            </div>
        </div>
    );
};

export default ClassClock;