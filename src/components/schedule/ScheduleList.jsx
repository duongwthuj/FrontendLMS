import React from 'react';
import { User, Calendar, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const ScheduleList = ({ groupedByTeacher }) => {
  return (
    <div className="space-y-4">
      {Object.entries(groupedByTeacher).map(([teacherId, data]) => {
        // Group slots by date
        const slotsByDate = {};
        Object.entries(data.slots).forEach(([slotKey, slot]) => {
          const date = slot.date;
          if (!slotsByDate[date]) {
            slotsByDate[date] = [];
          }
          slotsByDate[date].push(slot);
        });

        // Sort dates
        const sortedDates = Object.keys(slotsByDate).sort();

        return (
          <Card key={teacherId} className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 border-b border-secondary-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {data.teacher?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-secondary-900">
                  {data.teacher?.name || 'Unknown'}
                </h3>
                <p className="text-xs text-secondary-500 font-medium">
                  {data.teacher?.email}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedDates.map((date) => (
                <div key={date} className="border border-secondary-200 rounded-xl p-3 bg-secondary-50/50 hover:bg-white hover:shadow-sm transition-all">
                  <div className="font-bold text-sm text-secondary-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    {new Date(date).toLocaleDateString('vi-VN', { 
                      weekday: 'short', 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </div>
                  <div className="space-y-2">
                    {slotsByDate[date].map((slot, idx) => (
                      <div key={idx} className="space-y-1.5">
                        {/* Work Shift */}
                        {slot.workShift && (
                          <div 
                            className={`text-xs px-2 py-1.5 rounded-lg border flex items-center justify-between ${
                              slot.workShift.isAvailable 
                                ? 'bg-success-50 text-success-800 border-success-200' 
                                : 'bg-secondary-100 text-secondary-600 border-secondary-200'
                            }`}
                          >
                            <span className="font-medium">{slot.shift.name}</span>
                            <span className="text-[10px] opacity-80">{slot.shift.startTime}-{slot.shift.endTime}</span>
                            {!slot.workShift.isAvailable && <span className="ml-1">🔒</span>}
                          </div>
                        )}
                        
                        {/* Fixed Schedules */}
                        {slot.fixedSchedules.map((fs, fsIdx) => {
                          const isEnded = fs.endDate && new Date(fs.endDate) < new Date(date);
                          return (
                            <div 
                              key={fsIdx}
                              className={`text-xs px-2 py-1.5 rounded-lg border ${
                                isEnded 
                                  ? 'bg-gray-100 text-gray-500 border-gray-200' 
                                  : fs.role === 'tutor'
                                  ? 'bg-pink-50 text-pink-800 border-pink-200'
                                  : 'bg-primary-50 text-primary-800 border-primary-200'
                              }`}
                            >
                              <div className="font-bold mb-0.5 flex items-center gap-1">
                                {isEnded ? '🏁' : '📚'} {fs.subjectId?.name || 'N/A'}
                                {isEnded && <span className="text-[9px] bg-gray-200 px-1 rounded text-gray-600 ml-auto">Kết thúc</span>}
                              </div>
                              <div className={`flex items-center gap-1 text-[10px] ${isEnded ? 'text-gray-400' : 'text-primary-600'}`}>
                                <Clock className="w-3 h-3" />
                                {fs.startTime}-{fs.endTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
      {Object.keys(groupedByTeacher).length === 0 && (
        <Card className="p-12 text-center text-secondary-500 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-400">
            <Calendar className="w-8 h-8" />
          </div>
          <p className="font-medium">Không có lịch làm việc nào</p>
        </Card>
      )}
    </div>
  );
};

export default ScheduleList;
