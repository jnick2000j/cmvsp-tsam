// src/components/MyTraining.js
import React, { useState } from 'react';
import TrainingHistory from './TrainingHistory';

const EnrolledCourses = ({
  user,
  enrolledClassesDetails,
  setActiveClassId,
  handleCancelEnrollment,
}) => {
  return (
    <div className="space-y-8">
      {enrolledClassesDetails.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledClassesDetails.map(course => {
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
                    <button
                      onClick={() => setActiveClassId(course.id)}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover"
                    >
                      View Stations
                    </button>
                    <button
                      onClick={() => handleCancelEnrollment(course.id)}
                      disabled={!canCancel}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Cancel Enrollment
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


const MyTraining = (props) => {
  const [trainingView, setTrainingView] = useState('enrolled'); // enrolled, history

  const renderContent = () => {
    switch (trainingView) {
      case 'enrolled':
        return <EnrolledCourses {...props} />;
      case 'history':
        return <TrainingHistory {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setTrainingView('enrolled')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              trainingView === 'enrolled' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Enrolled Courses
          </button>
          <button
            onClick={() => setTrainingView('history')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              trainingView === 'history' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Training History
          </button>
        </nav>
      </div>
      {renderContent()}
    </div>
  );
};

export default MyTraining;