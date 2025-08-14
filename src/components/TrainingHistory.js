// src/components/TrainingHistory.js
import React, { useMemo } from 'react';
import { Download, GraduationCap } from 'lucide-react';

const TrainingHistory = ({ user, allUsers, classes, stations, checkIns, generateClassPdf }) => {
    const history = useMemo(() => {
        if (!user) return [];

        const userHistory = {};
        (user.enrolledClasses || []).forEach(classId => {
            const course = classes.find(c => c.id === classId);
            if (course) {
                userHistory[classId] = { ...course, roles: new Set(['Student']), status: 'In Progress' };
            }
        });
        
        Object.keys(user.completedClasses || {}).forEach(classId => {
            if (userHistory[classId]) {
                userHistory[classId].status = 'Completed';
            }
        });

        Object.keys(user.assignments || {}).forEach(stationId => {
            const station = stations.find(s => s.id === stationId);
            if (station) {
                const classId = station.classId;
                if (!userHistory[classId]) {
                    const course = classes.find(c => c.id === classId);
                     if (course) {
                        userHistory[classId] = { ...course, roles: new Set(), status: 'N/A' };
                    }
                }
                userHistory[classId]?.roles.add('Instructor');
            }
        });
        
        const allNeeds = [...classes, ...stations].flatMap(item => item.supportNeeds || []);
        allNeeds.forEach(need => {
            if (need.assignedUserId === user.uid) {
                const classId = need.type === 'Class' ? need.parentId : stations.find(s => s.id === need.parentId)?.classId;
                 if (classId && !userHistory[classId]) {
                    const course = classes.find(c => c.id === classId);
                     if (course) {
                        userHistory[classId] = { ...course, roles: new Set(), status: 'N/A' };
                    }
                }
                if (classId) userHistory[classId]?.roles.add('Support');
            }
        });

        return Object.values(userHistory).map(item => ({...item, roles: Array.from(item.roles)}));
    }, [user, classes, stations, allUsers]);

    const handleDownload = (course) => {
        const studentCheckIns = checkIns.filter(c => c.userId === user.uid && stations.some(s => s.classId === course.id && s.id === c.stationId));
        const stationsForClass = stations.filter(s => s.classId === course.id);
        generateClassPdf(`${user.firstName} ${user.lastName}`, course, stationsForClass, studentCheckIns);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Training History</h1>
            <div className="space-y-4">
                {history.length > 0 ? history.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-800">{item.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-600">Role(s): {item.roles.join(', ')}</span>
                                {item.roles.includes('Student') && (
                                     <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                         {item.status}
                                     </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleDownload(item)} className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 flex items-center"><Download className="mr-2 h-4 w-4"/>Skills PDF</button>
                           {item.status === 'Completed' && (
                                <button onClick={() => handleDownload(item)} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"><GraduationCap className="mr-2 h-4 w-4"/>Certificate</button>
                            )}
                        </div>
                    </div>
                )) : <p className="text-gray-500">You have no training history yet.</p>}
            </div>
        </div>
    );
};

export default TrainingHistory;
