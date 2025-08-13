// src/components/CourseCatalog.js
import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Hourglass, Search } from 'lucide-react';
import Icon from './Icon';
import PrerequisiteModal from './PrerequisiteModal'; // NEW: Import the prerequisite modal component

const CourseCatalog = ({ classes, user, allUsers, onEnrollClick, enrollmentError, logoUrl }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [prerequisiteClass, setPrerequisiteClass] = useState(null); // NEW: State to manage prerequisite modal

    const getLeadInstructorName = (instructorId) => {
        const instructor = allUsers.find(u => u.id === instructorId);
        return instructor ? `${instructor.firstName} ${instructor.lastName}` : 'N/A';
    };

    const visibleClasses = useMemo(() => {
        return classes
            .filter(course => {
                // Filter out hidden or completed classes
                if (course.isHidden || course.isCompleted) {
                    return false;
                }
                // Filter by role visibility
                if (course.visibleToRoles && course.visibleToRoles.length > 0) {
                    return course.visibleToRoles.includes(user.role);
                }
                return true; // Show if no roles are specified
            })
            .filter(course =>
                course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (getLeadInstructorName(course.leadInstructorId) || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [classes, searchTerm, user, allUsers, getLeadInstructorName]);

    const handleEnrollClick = (course) => {
        // NEW: Check for prerequisites and open modal if they exist
        if (course.prerequisites && course.prerequisites.length > 0) {
            setPrerequisiteClass(course);
        } else {
            // No prerequisites, proceed with original enrollment logic
            onEnrollClick(course.id);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* NEW: Prerequisite Modal */}
            <PrerequisiteModal
                isOpen={!!prerequisiteClass}
                onClose={() => setPrerequisiteClass(null)}
                classToEnroll={prerequisiteClass}
                user={user}
            />

            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                    {logoUrl && <img src={logoUrl} alt="Catalog Logo" className="h-12" />}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Course Catalog</h2>
                        <p className="mt-1 text-sm text-gray-500">Browse and enroll in available courses.</p>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md"
                        />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleClasses.map(course => {
                    const isEnrolled = user.enrolledClasses?.includes(course.id);
                    const isPast = new Date(course.endDate) < new Date();
                    return (
                        <div key={course.id} className={`bg-white rounded-xl shadow-lg overflow-hidden flex flex-col ${isPast ? 'opacity-60' : ''}`}>
                            <div className="p-5 border-b">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-4">
                                        {course.iconUrl && (
                                            <div className="bg-gray-100 p-3 rounded-full">
                                                <Icon name={course.iconUrl} className="h-6 w-6 text-gray-700" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                                            <p className="text-sm text-gray-500">Lead Instructor: {getLeadInstructorName(course.leadInstructorId)}</p>
                                        </div>
                                    </div>
                                    {isPast && <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">CLOSED</span>}
                                </div>
                            </div>
                            <div className="p-5 flex-grow space-y-3 text-sm">
                                {course.summary && <p className="text-gray-600">{course.summary}</p>}
                                <div className="flex items-center text-gray-500"><Calendar className="h-4 w-4 mr-2" /><span>{course.startDate} to {course.endDate}</span></div>
                                <div className="flex items-center text-gray-500"><MapPin className="h-4 w-4 mr-2" /><span>{course.location}</span></div>
                                <div className="flex items-center text-gray-500"><Hourglass className="h-4 w-4 mr-2" /><span>{course.hours} hours</span></div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t">
                                <button
                                    onClick={() => handleEnrollClick(course)}
                                    disabled={isEnrolled || isPast}
                                    className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 disabled:cursor-not-allowed"
                                >
                                    {isEnrolled ? 'Enrolled' : isPast ? 'Closed' : 'Enroll Now'}
                                </button>
                                {enrollmentError && enrollmentError.classId === course.id && (
                                    <p className="text-xs text-red-600 mt-2 text-center">{enrollmentError.message}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CourseCatalog;