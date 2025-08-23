import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Hourglass, Search } from 'lucide-react';
import Icon from './Icon';
import PrerequisiteModal from './PrerequisiteModal';
import WaiverSigningModal from './WaiverSigningModal'; // Import WaiverSigningModal
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

const CourseCatalog = ({ classes, waivers, user, allUsers, onEnrollClick, enrollmentError, onCancelEnrollment, branding }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [prerequisiteClass, setPrerequisiteClass] = useState(null);
    const [waiverClass, setWaiverClass] = useState(null); // State for waiver signing process

    const getLeadInstructorName = (instructorId) => {
        const instructor = allUsers.find(u => u.id === instructorId);
        return instructor ? `${instructor.firstName} ${instructor.lastName}` : 'N/A';
    };

    const visibleClasses = useMemo(() => {
        return classes
            .filter(course => {
                if (course.isHidden || course.isCompleted) {
                    return false;
                }
                if (course.visibleToRoles && course.visibleToRoles.length > 0) {
                    return course.visibleToRoles.includes(user.role);
                }
                return true;
            })
            .filter(course =>
                course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (getLeadInstructorName(course.leadInstructorId) || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [classes, searchTerm, user, allUsers]);

    const handleEnrollClick = (course) => {
        // Step 1: Check for Waivers first
        if (course.waiverIds && course.waiverIds.length > 0) {
            setWaiverClass(course);
        } // Step 2: Then check for prerequisites
        else if (course.prerequisites && course.prerequisites.length > 0) {
            setPrerequisiteClass(course);
        } else {
            // No waivers or prerequisites, enroll directly
            onEnrollClick(course.id);
        }
    };
    
    const handleWaiverConfirmation = (signatures) => {
        setWaiverClass(null); // Close waiver modal
        // After waivers are signed, check for prerequisites
        if (waiverClass.prerequisites && waiverClass.prerequisites.length > 0) {
            setPrerequisiteClass(waiverClass);
        } else {
            // If no prerequisites, proceed to enroll with signatures
            const enrollWithWaivers = httpsCallable(functions, 'enrollStudent');
            enrollWithWaivers({
                classId: waiverClass.id,
                studentId: user.uid,
                waiverSignatures: signatures,
            }).catch(err => {
                console.error("Enrollment after waiver signing failed:", err);
            });
        }
    };

    const handlePrerequisiteSubmit = () => {
        // This function will be called from PrerequisiteModal on successful submission.
        // It's assumed that the prerequisite modal will handle the cloud function call.
        setPrerequisiteClass(null);
    };

    const isEnrolled = (courseId) => user.enrolledClasses?.includes(courseId);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <WaiverSigningModal
                isOpen={!!waiverClass}
                onClose={() => setWaiverClass(null)}
                waiversToSign={waivers.filter(w => waiverClass?.waiverIds?.includes(w.id))}
                onConfirm={handleWaiverConfirmation}
            />
            <PrerequisiteModal
                isOpen={!!prerequisiteClass}
                onClose={() => setPrerequisiteClass(null)}
                classToEnroll={prerequisiteClass}
                user={user}
                onSuccess={handlePrerequisiteSubmit}
            />

            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                    {branding.siteLogo && <img src={branding.siteLogo} alt="Catalog Logo" className="h-12" />}
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
                    const isEnrolledInCourse = isEnrolled(course.id);
                    const isPast = new Date(course.endDate) < new Date();
                    const canCancel = (new Date(course.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60) > 24;

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
                                {isEnrolledInCourse ? (
                                     <button
                                        onClick={() => onCancelEnrollment(course.id)}
                                        disabled={!canCancel}
                                        className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Unenroll
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleEnrollClick(course)}
                                        disabled={isPast}
                                        className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isPast ? 'Closed' : 'Enroll Now'}
                                    </button>
                                )}
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