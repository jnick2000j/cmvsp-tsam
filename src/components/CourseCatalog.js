import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, query, where, getDocs, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ENROLLMENTS, CLASSES, USERS, WAIVERS } from '../constants';
import WaiverSigningModal from './WaiverSigningModal';

const CourseCatalog = ({ user }) => {
    const [courses, setCourses] = useState([]);
    const [users, setUsers] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
    const [classToEnroll, setClassToEnroll] = useState(null);
    const [requiredWaivers, setRequiredWaivers] = useState([]);

    useEffect(() => {
        const unsubscribeCourses = onSnapshot(collection(db, CLASSES), snapshot => {
            const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(coursesData);
        });

        const unsubscribeUsers = onSnapshot(collection(db, USERS), snapshot => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
        });

        const unsubscribeEnrollments = onSnapshot(collection(db, ENROLLMENTS), snapshot => {
            const enrollmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEnrollments(enrollmentsData);
        });

        return () => {
            unsubscribeCourses();
            unsubscribeUsers();
            unsubscribeEnrollments();
        };
    }, []);

    const getUserName = (uid) => users.find(user => user.id === uid)?.name || 'Unknown';

    const requestEnrollment = async (classItem) => {
        try {
            await addDoc(collection(db, ENROLLMENTS), {
                classId: classItem.id,
                className: classItem.name,
                userId: user.uid,
                userName: user.displayName,
                status: 'pending',
                requestedAt: serverTimestamp(),
            });
            alert('Enrollment request sent!');
        } catch (error) {
            console.error("Error sending enrollment request: ", error);
            alert('Failed to send enrollment request.');
        }
    };

    const handleEnrollClick = async (classItem) => {
        if (classItem.waiverIds && classItem.waiverIds.length > 0) {
            const signedWaiversCollection = collection(db, `users/${user.uid}/signedWaivers`);
            const q = query(signedWaiversCollection, where('classId', '==', classItem.id));
            const signedWaiversSnapshot = await getDocs(q);
            const userSignedWaiverIds = signedWaiversSnapshot.docs.map(d => d.data().waiverId);

            const waiversToSign = [];
            for (const waiverId of classItem.waiverIds) {
                if (!userSignedWaiverIds.includes(waiverId)) {
                    const waiverDoc = await getDoc(doc(db, WAIVERS, waiverId));
                    if (waiverDoc.exists()) {
                        waiversToSign.push({ id: waiverDoc.id, ...waiverDoc.data() });
                    }
                }
            }

            if (waiversToSign.length > 0) {
                setClassToEnroll(classItem);
                setRequiredWaivers(waiversToSign);
                setIsWaiverModalOpen(true);
            } else {
                requestEnrollment(classItem);
            }
        } else {
            requestEnrollment(classItem);
        }
    };

    const handleWaiversSigned = () => {
        requestEnrollment(classToEnroll);
        setIsWaiverModalOpen(false);
        setClassToEnroll(null);
        setRequiredWaivers([]);
    };

    const getEnrollmentStatus = (classId) => {
        const enrollment = enrollments.find(e => e.classId === classId && e.userId === user.uid);
        if (enrollment) {
            return {
                status: enrollment.status,
                text: `Status: ${enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}`
            };
        }
        const course = courses.find(c => c.id === classId);
        if(course) {
            const enrolledCount = enrollments.filter(e => e.classId === classId && e.status === 'approved').length;
            if (enrolledCount >= course.slots) {
                return { status: 'full', text: 'Class Full' };
            }
        }
        return null;
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Course Catalog</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => {
                    const enrollmentStatus = getEnrollmentStatus(course.id);
                    const isButtonDisabled = enrollmentStatus?.status === 'pending' || enrollmentStatus?.status === 'approved' || enrollmentStatus?.status === 'full';
                    const buttonText = enrollmentStatus ? enrollmentStatus.text : 'Request to Enroll';

                    return (
                        <div key={course.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                                <p className="text-gray-600 mb-1"><strong>Instructor:</strong> {getUserName(course.instructor)}</p>
                                <p className="text-gray-600 mb-1"><strong>Date:</strong> {course.date}</p>
                                <p className="text-gray-600 mb-1"><strong>Time:</strong> {course.startTime} - {course.endTime}</p>
                                <p className="text-gray-600 mb-1"><strong>Location:</strong> {course.location}</p>
                                <p className="text-gray-600 mb-4"><strong>Description:</strong> {course.description}</p>
                            </div>
                            <button
                                onClick={() => handleEnrollClick(course)}
                                className={`w-full py-2 px-4 rounded font-bold text-white transition-colors ${isButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'}`}
                                disabled={isButtonDisabled}
                            >
                                {buttonText}
                            </button>
                        </div>
                    );
                })}
            </div>
            {isWaiverModalOpen && (
                <WaiverSigningModal
                    user={user}
                    classToEnroll={classToEnroll}
                    waivers={requiredWaivers}
                    onClose={() => setIsWaiverModalOpen(false)}
                    onSigned={handleWaiversSigned}
                />
            )}
        </div>
    );
};

export default CourseCatalog;
