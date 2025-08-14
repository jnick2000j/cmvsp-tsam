// src/components/EnrolledCourses.js
import React from 'react';
import { LogOut } from 'lucide-react';

const EnrolledCourses = ({
  user,
  enrolledClassesDetails,
  dailyCheckIns,
  setActiveClassId,
  handlePrerequisiteCheckin,
  handleCancelEnrollment
}) => {
  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      {enrolledClassesDetails.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledClassesDetails.map(course => {
            const todaysCheckIn = dailyCheckIns.find(
              dc => dc.studentId === user.uid && dc.classId === course.id && dc.checkInDate === todayISO
            );
            const canCancel = (new Date(course.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60) > 24;

            return (
              <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                <div className="p-5 border-b flex-grow">
                  <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                  <p className="text-sm text-gray-500">{course.startDate}</p>
                  {course.studentGroups?.[user.uid] && (
                    <p className="text-sm font-semibold text-indigo-600 mt-1">
                      Your Group: Group {course.studentGroups[user.uid]}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-gray-50 border-t space-y-2">
                  {todaysCheckIn?.status === 'approved' ? (
                    <button
                      onClick={() => setActiveClassId(course.id)}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Go to Stations
                    </button>
                  ) : todaysCheckIn?.status === 'pending' ? (
                    <p className="text-center text-sm font-medium text-yellow-700">Check-in Pending</p>
                  ) : (
                    <button
                      onClick={() => handlePrerequisiteCheckin(course)}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Check In for Today
                    </button>
                  )}
                  <button
                    onClick={() => handleCancelEnrollment(course.id)}
                    disabled={!canCancel}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cancel Enrollment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Enrolled Courses</h2>
          <p className="text-gray-500">You are not enrolled in any courses yet. Visit the Course Catalog to get started.</p>
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;