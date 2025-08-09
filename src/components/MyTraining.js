// src/components/MyTraining.js
import React, { useState } from 'react';
import TrainingHistory from './TrainingHistory';
import EnrolledCourses from './EnrolledCourses';

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