import React from 'react';
import { Edit, Trash2, X, Plus } from 'lucide-react';
import Card from '../ui/Card';

const ScheduleCalendar = ({ 
  weekDates, 
  shifts, 
  groupedByTeacher, 
  offsetClasses, 
  fixedScheduleLeaves,
  allTeachersDetails,
  onSlotClick,
  onScheduleClick,
  onEditOffset,
  onCancelOffset,
  onDeleteOffset,

  supplementaryClasses = [], // Default to empty array
  testClasses = [], // Default to empty array
  onAddOffset, // New prop
  onEditSupplementary,
  onDeleteSupplementary,
  onEditTest,
  onDeleteTest
}) => {
  
  // Helper: Convert time string to minutes
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper: Check if time gap is >= 1 hour (60 minutes)
  const hasSignificantGap = (endTime, startTime) => {
    const endMinutes = timeToMinutes(endTime);
    const startMinutes = timeToMinutes(startTime);
    return startMinutes - endMinutes >= 30;
  };

  // Helper: Calculate free time slots (>= 1 hour)
  const getFreeTimeSlots = (teacherId, date, shift, allTeachersDetails) => {
    const teacher = allTeachersDetails.find(t => t._id === teacherId);
    if (!teacher || !teacher.fixedSchedules) {
      return []; // No fixed schedules
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = new Date(date).getDay();
    const dayName = dayNames[dayOfWeek];
    
    const shiftStartMinutes = timeToMinutes(shift.startTime);
    const shiftEndMinutes = timeToMinutes(shift.endTime);
    
    // Get all fixed schedules that start in this shift
    const fixedSchedulesInShift = teacher.fixedSchedules.filter(fs => {
      if (fs.dayOfWeek !== dayName) return false;
      
      // Check if on leave
      const isOnLeave = fixedScheduleLeaves.some(leave => {
        const leaveScheduleId = typeof leave.fixedScheduleId === 'object' ? leave.fixedScheduleId?._id : leave.fixedScheduleId;
        const leaveDate = new Date(leave.date).toISOString().split('T')[0];
        // Compare date and schedule ID
        // Note: 'date' argument to getFreeTimeSlots comes from weekDates.map which are YYYY-MM-DD strings
        return leaveScheduleId === fs._id && leaveDate === date;
      });
      
      if (isOnLeave) return false;

      const fsStartMinutes = timeToMinutes(fs.startTime);
      const fsEndMinutes = timeToMinutes(fs.endTime);
      return fsStartMinutes < shiftEndMinutes && fsEndMinutes > shiftStartMinutes;
    });
    
    // Get all offset classes for this teacher on this date that start in this shift
    const offsetClassesInShift = offsetClasses.filter(oc => {
      if (!oc.assignedTeacherId || (oc.status !== 'assigned' && oc.status !== 'completed')) return false;
      
      const ocTeacherId = typeof oc.assignedTeacherId === 'object' ? oc.assignedTeacherId._id : oc.assignedTeacherId;
      
      // Fix date comparison: ensure strictly string match or UTC date match
      const ocDateObj = new Date(oc.scheduledDate);
      const ocDateStr = ocDateObj.toLocaleDateString('sv-SE'); // YYYY-MM-DD in local time
      // or simpler manually
      const year = ocDateObj.getFullYear();
      const month = String(ocDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(ocDateObj.getDate()).padStart(2, '0');
      const formattedOcDate = `${year}-${month}-${day}`;

      if (ocTeacherId === teacherId && formattedOcDate === date) {
        const ocStartMinutes = timeToMinutes(oc.startTime);
        const ocEndMinutes = timeToMinutes(oc.endTime);
        return ocStartMinutes < shiftEndMinutes && ocEndMinutes > shiftStartMinutes;
      }
      return false;
    });

    // Get all substitute classes for this teacher on this date
    const substituteClassesInShift = fixedScheduleLeaves.filter(leave => {
      if (!leave.substituteTeacherId) return false;
      const subTeacherId = typeof leave.substituteTeacherId === 'object' ? leave.substituteTeacherId._id : leave.substituteTeacherId;
      
      const leaveDateObj = new Date(leave.date);
      const year = leaveDateObj.getFullYear();
      const month = String(leaveDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(leaveDateObj.getDate()).padStart(2, '0');
      const formattedLeaveDate = `${year}-${month}-${day}`;

      if (subTeacherId === teacherId && formattedLeaveDate === date && leave.fixedScheduleId) {
        const fsStartMinutes = timeToMinutes(leave.fixedScheduleId.startTime);
        const fsEndMinutes = timeToMinutes(leave.fixedScheduleId.endTime);
        return fsStartMinutes < shiftEndMinutes && fsEndMinutes > shiftStartMinutes;
      }
      return false;
    });

    // Get all supplementary classes for this teacher on this date
    const supplementaryClassesInShift = supplementaryClasses.filter(sc => {
      // Check for assigned teacher directly
      if (!sc.assignedTeacherId || (sc.status !== 'pending' && sc.status !== 'assigned' && sc.status !== 'completed')) return false;

      const scTeacherId = typeof sc.assignedTeacherId === 'object' ? sc.assignedTeacherId._id : sc.assignedTeacherId;

      const scDateObj = new Date(sc.scheduledDate);
      const year = scDateObj.getFullYear();
      const month = String(scDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(scDateObj.getDate()).padStart(2, '0');
      const formattedScDate = `${year}-${month}-${day}`;

      if (scTeacherId === teacherId && formattedScDate === date) {
        const scStartMinutes = timeToMinutes(sc.startTime);
        const scEndMinutes = timeToMinutes(sc.endTime);
        return scStartMinutes < shiftEndMinutes && scEndMinutes > shiftStartMinutes;
      }
      return false;
    });

    // Get all test classes for this teacher on this date
    const testClassesInShift = testClasses.filter(tc => {
      if (!tc.assignedTeacherId || (tc.status !== 'pending' && tc.status !== 'assigned' && tc.status !== 'completed')) return false;

      const tcTeacherId = typeof tc.assignedTeacherId === 'object' ? tc.assignedTeacherId._id : tc.assignedTeacherId;

      const tcDateObj = new Date(tc.scheduledDate);
      const year = tcDateObj.getFullYear();
      const month = String(tcDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(tcDateObj.getDate()).padStart(2, '0');
      const formattedTcDate = `${year}-${month}-${day}`;

      if (tcTeacherId === teacherId && formattedTcDate === date) {
        const tcStartMinutes = timeToMinutes(tc.startTime);
        const tcEndMinutes = timeToMinutes(tc.endTime);
        return tcStartMinutes < shiftEndMinutes && tcEndMinutes > shiftStartMinutes;
      }
      return false;
    });

    // Combine all busy schedules
    const allBusySchedules = [
      ...fixedSchedulesInShift,
      ...offsetClassesInShift.map(oc => ({
        startTime: oc.startTime,
        endTime: oc.endTime,
        isOffsetClass: true
      })),
      ...supplementaryClassesInShift.map(sc => ({
        startTime: sc.startTime,
        endTime: sc.endTime,
        isSupplementaryClass: true
      })),
      ...testClassesInShift.map(tc => ({
        startTime: tc.startTime,
        endTime: tc.endTime,
        isTestClass: true
      })),
      ...substituteClassesInShift.map(leave => ({
        startTime: leave.fixedScheduleId.startTime,
        endTime: leave.fixedScheduleId.endTime,
        isSubstitute: true
      }))
    ];

    if (allBusySchedules.length === 0) return [];

    // Sort by start time
    const sortedSchedules = allBusySchedules.sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    const freeSlots = [];

    // Adjust schedule times to be within shift boundaries
    const adjustedSchedules = sortedSchedules.map(schedule => {
      const scheduleStartMinutes = timeToMinutes(schedule.startTime);
      const scheduleEndMinutes = timeToMinutes(schedule.endTime);
      
      const effectiveStart = Math.max(scheduleStartMinutes, shiftStartMinutes);
      const effectiveEnd = Math.min(scheduleEndMinutes, shiftEndMinutes);
      
      return {
        ...schedule,
        effectiveStartTime: `${Math.floor(effectiveStart / 60).toString().padStart(2, '0')}:${(effectiveStart % 60).toString().padStart(2, '0')}`,
        effectiveEndTime: `${Math.floor(effectiveEnd / 60).toString().padStart(2, '0')}:${(effectiveEnd % 60).toString().padStart(2, '0')}`
      };
    });

    // Check gap between shift start and first schedule
    const firstSchedule = adjustedSchedules[0];
    if (hasSignificantGap(shift.startTime, firstSchedule.effectiveStartTime)) {
      freeSlots.push({
        start: shift.startTime,
        end: firstSchedule.effectiveStartTime
      });
    }

    // Check gaps between consecutive schedules
    for (let i = 0; i < adjustedSchedules.length - 1; i++) {
      const currentEnd = adjustedSchedules[i].effectiveEndTime;
      const nextStart = adjustedSchedules[i + 1].effectiveStartTime;
      if (hasSignificantGap(currentEnd, nextStart)) {
        freeSlots.push({
          start: currentEnd,
          end: nextStart
        });
      }
    }

    // Check gap between last schedule and shift end
    const lastSchedule = adjustedSchedules[adjustedSchedules.length - 1];
    if (hasSignificantGap(lastSchedule.effectiveEndTime, shift.endTime)) {
      freeSlots.push({
        start: lastSchedule.effectiveEndTime,
        end: shift.endTime
      });
    }

    return freeSlots;
  };

  // Duplicate helper from Dashboard.jsx (Consider moving to utils if used elsewhere)
  const abbreviateName = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    
    const initials = parts.slice(0, parts.length - 1).map(p => p.charAt(0).toUpperCase()).join('');
    const lastName = parts[parts.length - 1];
    const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
    
    return `${initials}${formattedLastName}`;
  };

  return (
    <Card noPadding className="overflow-hidden">
      <div className="p-4 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-secondary-900">Lịch làm việc tuần</h2>
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-success-200 border border-success-400 rounded"></div>
            <span className="text-secondary-600">Rảnh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-sky-300 border border-sky-500 rounded"></div>
            <span className="text-secondary-600">Giảng chính</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-indigo-200 border border-indigo-400 rounded"></div>
            <span className="text-secondary-600">Trợ giảng</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-purple-200 border border-purple-400 rounded"></div>
            <span className="text-secondary-600">Lớp offset</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-amber-200 border border-amber-400 rounded"></div>
            <span className="text-secondary-600">Lớp bổ trợ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-blue-200 border border-blue-400 rounded"></div>
            <span className="text-secondary-600">Lớp test</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span className="text-secondary-600">Dạy thay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-red-300 border border-red-500 rounded"></div>
            <span className="text-secondary-600">Xin nghỉ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-secondary-200 border border-secondary-400 rounded"></div>
            <span className="text-secondary-600">Bận</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-secondary-50">
              <th className="border border-secondary-200 p-3 text-left font-bold text-secondary-700 sticky left-0 bg-secondary-50 z-20 w-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Giáo viên</th>
              <th className="border border-secondary-200 p-3 text-center font-bold text-secondary-700 sticky left-40 bg-secondary-50 z-20 w-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Ca</th>
              {weekDates.map(date => {
                const dateObj = new Date(date);
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                const dayName = dayNames[dateObj.getDay()];
                const isToday = new Date().toISOString().split('T')[0] === date;
                
                return (
                  <th key={date} className={`border border-secondary-200 p-2 text-center w-32 ${isToday ? 'bg-primary-50' : ''}`}>
                    <div className={`font-bold ${isToday ? 'text-primary-700' : 'text-secondary-900'}`}>{dayName}</div>
                    <div className={`text-[10px] ${isToday ? 'text-primary-600' : 'text-secondary-500'}`}>{new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white">
            {Object.entries(groupedByTeacher).map(([teacherId, data]) => {
              const totalRows = shifts.length;
              
              return shifts.map((shift, shiftIndex) => (
                <tr key={`${teacherId}_${shift._id}`} className="hover:bg-secondary-50 transition-colors group/row">
                  {shiftIndex === 0 && (
                    <td 
                      rowSpan={totalRows} 
                      className="border border-secondary-200 p-3 font-semibold text-secondary-900 align-top sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover/row:bg-secondary-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                          {data.teacher?.name?.charAt(0)}
                        </div>
                        <span className="truncate" title={data.teacher?.name}>{abbreviateName(data.teacher?.name) || 'Unknown'}</span>
                      </div>
                    </td>
                  )}
                  <td className="border border-secondary-200 p-2 text-center bg-secondary-50/50 font-medium text-secondary-700 sticky left-40 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="text-[11px] font-bold">{shift.name}</div>
                    <div className="text-[9px] text-secondary-500">
                      {shift.startTime}-{shift.endTime}
                    </div>
                  </td>
                  {weekDates.map(date => {
                    const slotKey = `${date}_${shift._id}`;
                    const slot = data.slots[slotKey];
                    
                    // Logic to determine what to render (copied and adapted from original)
                    // Note: In a real refactor, this logic should be moved to a helper function or hook
                    // For now, we'll implement a simplified version that relies on passed props
                    
                    const { workShift, fixedSchedules } = slot || {};
                    
                    // Check for offset classes
                    const teacherOffsetClasses = offsetClasses.filter(oc => {
                      if (!oc.assignedTeacherId || (oc.status !== 'assigned' && oc.status !== 'completed')) return false;
                      const ocTeacherId = typeof oc.assignedTeacherId === 'object' ? oc.assignedTeacherId._id : oc.assignedTeacherId;
                      
                      // Fix date comparison here too
                      const ocDateObj = new Date(oc.scheduledDate);
                      const year = ocDateObj.getFullYear();
                      const month = String(ocDateObj.getMonth() + 1).padStart(2, '0');
                      const day = String(ocDateObj.getDate()).padStart(2, '0');
                      const formattedOcDate = `${year}-${month}-${day}`;
                      
                      if (ocTeacherId === teacherId && formattedOcDate === date) {
                        const ocStartMinutes = timeToMinutes(oc.startTime);
                        const shiftStartMinutes = timeToMinutes(shift.startTime);
                        const shiftEndMinutes = timeToMinutes(shift.endTime);
                        return ocStartMinutes >= shiftStartMinutes && ocStartMinutes < shiftEndMinutes;
                      }
                      return false;
                    });

                    // Check for substitute teaching
                    const substituteClasses = fixedScheduleLeaves.filter(leave => {
                      if (!leave.substituteTeacherId) return false;
                      const subTeacherId = typeof leave.substituteTeacherId === 'object' ? leave.substituteTeacherId._id : leave.substituteTeacherId;
                      
                      const leaveDateObj = new Date(leave.date);
                      const year = leaveDateObj.getFullYear();
                      const month = String(leaveDateObj.getMonth() + 1).padStart(2, '0');
                      const day = String(leaveDateObj.getDate()).padStart(2, '0');
                      const formattedLeaveDate = `${year}-${month}-${day}`;

                      if (subTeacherId === teacherId && formattedLeaveDate === date && leave.fixedScheduleId) {
                        const fsStartMinutes = timeToMinutes(leave.fixedScheduleId.startTime);
                        const shiftStartMinutes = timeToMinutes(shift.startTime);
                        const shiftEndMinutes = timeToMinutes(shift.endTime);
                        return fsStartMinutes >= shiftStartMinutes && fsStartMinutes < shiftEndMinutes;
                      }
                      return false;
                    });

                    // Calculate free slots if needed
                    // Note: We need allTeachersDetails here, but for simplicity let's assume data.teacher has fixedSchedules
                    // If not, we might need to pass allTeachersDetails as prop
                    // Let's use a simplified check for now or assume data.teacher is populated
                    
                    const hasFixedSchedules = fixedSchedules && fixedSchedules.length > 0;
                    const hasOffsetClasses = teacherOffsetClasses.length > 0;
                    const hasWorkShift = !!workShift;
                    
                    // Determine if we should show anything
                    // Logic: Show if (Has Offset) OR (Has Fixed) OR (Has WorkShift)
                    // But we also need to handle the "Free Slot" logic which is complex
                    
                    // For this component, we'll render based on what we have
                    
                    const renderContent = () => {
                      const allItems = [];

                      // Collect all fixed schedules with metadata
                      if (hasFixedSchedules) {
                        fixedSchedules.forEach((fs) => {
                          const isOnLeave = fixedScheduleLeaves.some(leave => {
                            const leaveScheduleId = typeof leave.fixedScheduleId === 'object' ? leave.fixedScheduleId?._id : leave.fixedScheduleId;
                            const leaveDate = new Date(leave.date).toISOString().split('T')[0];
                            return leaveScheduleId === fs._id && leaveDate === date;
                          });

                          const isEnded = fs.endDate && new Date(fs.endDate) < new Date(date);

                          allItems.push({
                            type: 'fixed',
                            startTime: fs.startTime,
                            data: fs,
                            isOnLeave,
                            isEnded
                          });
                        });
                      }

                      // Collect all offset classes with metadata
                      teacherOffsetClasses.forEach((oc) => {
                        allItems.push({
                          type: 'offset',
                          startTime: oc.startTime,
                          data: oc
                        });
                      });

                      // Collect all supplementary classes
                      const teacherSupplementaryClasses = supplementaryClasses.filter(sc => {
                        if (!sc.assignedTeacherId || (sc.status !== 'pending' && sc.status !== 'assigned' && sc.status !== 'completed')) return false;
                        const scTeacherId = typeof sc.assignedTeacherId === 'object' ? sc.assignedTeacherId._id : sc.assignedTeacherId;
                        
                        const scDateObj = new Date(sc.scheduledDate);
                        const year = scDateObj.getFullYear();
                        const month = String(scDateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(scDateObj.getDate()).padStart(2, '0');
                        const formattedScDate = `${year}-${month}-${day}`;
                        
                        if (scTeacherId === teacherId && formattedScDate === date) {
                          const scStartMinutes = timeToMinutes(sc.startTime);
                          const shiftStartMinutes = timeToMinutes(shift.startTime);
                          const shiftEndMinutes = timeToMinutes(shift.endTime);
                          return scStartMinutes >= shiftStartMinutes && scStartMinutes < shiftEndMinutes;
                        }
                        return false;
                      });

                      teacherSupplementaryClasses.forEach((sc) => {
                        allItems.push({
                          type: 'supplementary',
                          startTime: sc.startTime,
                          data: sc
                        });
                      });

                      // Collect all test classes
                      const teacherTestClasses = testClasses.filter(tc => {
                        if (!tc.assignedTeacherId || (tc.status !== 'pending' && tc.status !== 'assigned' && tc.status !== 'completed')) {
                          return false;
                        }
                        const tcTeacherId = typeof tc.assignedTeacherId === 'object' ? tc.assignedTeacherId._id : tc.assignedTeacherId;
                        
                        const tcDateObj = new Date(tc.scheduledDate);
                        const year = tcDateObj.getFullYear();
                        const month = String(tcDateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(tcDateObj.getDate()).padStart(2, '0');
                        const formattedTcDate = `${year}-${month}-${day}`;
                        
                        if (tcTeacherId === teacherId && formattedTcDate === date) {
                          const tcStartMinutes = timeToMinutes(tc.startTime);
                          const shiftStartMinutes = timeToMinutes(shift.startTime);
                          const shiftEndMinutes = timeToMinutes(shift.endTime);
                          return tcStartMinutes >= shiftStartMinutes && tcStartMinutes < shiftEndMinutes;
                        }
                        return false;
                      });

                      teacherTestClasses.forEach((tc) => {
                        allItems.push({
                          type: 'test',
                          startTime: tc.startTime,
                          data: tc
                        });
                      });

                      // Collect all substitute classes
                      substituteClasses.forEach((leave) => {
                        allItems.push({
                          type: 'substitute',
                          startTime: leave.fixedScheduleId.startTime,
                          data: leave
                        });
                      });

                      // Calculate free time slots if there are schedules AND there is a work shift
                      const hasSubstituteClasses = substituteClasses.length > 0;
                      const hasSupplementaryClasses = teacherSupplementaryClasses.length > 0;
                      const hasTestClasses = teacherTestClasses.length > 0;
                      const freeSlots = (hasFixedSchedules || hasOffsetClasses || hasSubstituteClasses || hasSupplementaryClasses || hasTestClasses) && hasWorkShift && allTeachersDetails
                        ? getFreeTimeSlots(teacherId, date, shift, allTeachersDetails)
                        : [];

                      // Add free slots to items
                      freeSlots.forEach((slot) => {
                        allItems.push({
                          type: 'free',
                          startTime: slot.start,
                          data: slot
                        });
                      });

                      // Sort ALL items by start time
                      allItems.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

                      // Render sorted items
                      const items = allItems.map((item, idx) => {
                        if (item.type === 'fixed') {
                          const fs = item.data;
                          const isOnLeave = item.isOnLeave;
                          
                          return (
                            <button
                              key={`fixed-${idx}`}
                              onClick={(e) => { e.stopPropagation(); onScheduleClick(teacherId, date, shift, fs, isOnLeave); }}
                              className={`w-full text-left text-[9px] px-1.5 py-1 rounded border transition-all mb-1 last:mb-0 shadow-sm ${
                                isOnLeave
                                  ? 'bg-red-200 text-red-900 border-red-400 hover:bg-red-300'
                                  : item.isEnded
                                  ? 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300'
                                  : fs.role === 'tutor'
                                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200'
                                  : 'bg-sky-200 text-sky-900 border-sky-400 hover:bg-sky-300'
                              }`}
                            >
                              <div className="font-bold truncate flex items-center gap-1">
                                {isOnLeave ? '🏖️' : item.isEnded ? '🏁' : '📚'} {fs.subjectId?.name || 'N/A'}
                                {item.isEnded && <span className="text-[7px] bg-gray-200 px-1 rounded text-gray-600 ml-auto">Kết thúc</span>}
                              </div>
                              <div className={`text-[8px] ${isOnLeave ? 'text-red-600' : item.isEnded ? 'text-gray-400' : 'text-sky-600'}`}>
                                {fs.startTime}-{fs.endTime}
                              </div>
                            </button>
                          );
                        } else if (item.type === 'substitute') {
                          const leave = item.data;
                          const fs = leave.fixedScheduleId;
                          
                          return (
                            <div
                              key={`sub-${idx}`}
                              className="w-full text-left text-[9px] px-1.5 py-1 rounded border bg-yellow-100 text-yellow-900 border-yellow-300 mb-1 last:mb-0 shadow-sm hover:bg-yellow-200 transition-colors"
                            >
                              <div className="font-bold truncate flex items-center gap-1">
                                🆘 Dạy thay
                              </div>
                              <div className="font-medium truncate text-yellow-700">
                                {fs.subjectId?.name || 'N/A'} - {fs.className}
                              </div>
                              <div className="text-[8px] text-yellow-600">
                                {fs.startTime}-{fs.endTime}
                              </div>
                              <div className="text-[7px] text-yellow-500 truncate" title={`Dạy thay cho ${leave.teacherId?.name || 'giáo viên'}`}>
                                GV: {leave.teacherId?.name || '...'}
                              </div>
                            </div>
                          );
                        } else if (item.type === 'supplementary') {
                          const sc = item.data;
                          
                          return (
                            <div
                              key={`supp-${idx}`}
                              className="w-full text-left text-[9px] px-1.5 py-1 rounded border bg-amber-100 text-amber-900 border-amber-300 relative group mb-1 last:mb-0 shadow-sm hover:border-amber-400 transition-all"
                            >
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded px-0.5 backdrop-blur-sm">
                                <button onClick={(e) => { e.stopPropagation(); onEditSupplementary && onEditSupplementary(sc); }} className="p-0.5 text-amber-600 hover:text-amber-700"><Edit className="w-2.5 h-2.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSupplementary && onDeleteSupplementary(sc); }} className="p-0.5 text-danger-600 hover:text-danger-700"><Trash2 className="w-2.5 h-2.5" /></button>
                              </div>
                              <div className="font-bold truncate pr-8 flex items-center gap-1">
                                🌱 {sc.className || 'Bổ trợ'}
                              </div>
                              <div className="text-[8px] text-amber-600">
                                {sc.startTime}-{sc.endTime}
                              </div>
                              <div className="text-[7px] text-amber-500 truncate">
                                {sc.subjectLevelId?.subjectId?.name}
                              </div>
                            </div>
                          );
                        } else if (item.type === 'offset') {
                          const oc = item.data;
                          
                          return (
                            <div
                              key={`offset-${idx}`}
                              className="w-full text-left text-[9px] px-1.5 py-1 rounded border bg-purple-100 text-purple-900 border-purple-300 relative group mb-1 last:mb-0 shadow-sm hover:border-purple-400 transition-all"
                            >
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded px-0.5 backdrop-blur-sm">
                                <button onClick={(e) => { e.stopPropagation(); onEditOffset(oc); }} className="p-0.5 text-primary-600 hover:text-primary-700"><Edit className="w-2.5 h-2.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); onCancelOffset(oc); }} className="p-0.5 text-warning-600 hover:text-warning-700"><X className="w-2.5 h-2.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteOffset(oc); }} className="p-0.5 text-danger-600 hover:text-danger-700"><Trash2 className="w-2.5 h-2.5" /></button>
                              </div>
                              <div className="font-bold truncate pr-2">
                                🔄 {oc.subjectLevelId?.subjectId?.name || 'Offset'}
                              </div>
                              <div className="text-[8px] text-purple-600">
                                {oc.startTime}-{oc.endTime}
                              </div>
                              <div className="text-[7px] text-purple-500 truncate">
                                {oc.className}
                              </div>
                            </div>
                          );
                        } else if (item.type === 'test') {
                          const tc = item.data;
                          
                          return (
                            <div
                              key={`test-${idx}`}
                              className="w-full text-left text-[9px] px-1.5 py-1 rounded border bg-blue-100 text-blue-900 border-blue-300 relative group mb-1 last:mb-0 shadow-sm hover:border-blue-400 transition-all"
                            >
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded px-0.5 backdrop-blur-sm">
                                <button onClick={(e) => { e.stopPropagation(); onEditTest && onEditTest(tc); }} className="p-0.5 text-blue-600 hover:text-blue-700"><Edit className="w-2.5 h-2.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteTest && onDeleteTest(tc); }} className="p-0.5 text-danger-600 hover:text-danger-700"><Trash2 className="w-2.5 h-2.5" /></button>
                              </div>
                              <div className="font-bold truncate pr-8 flex items-center gap-1">
                                📝 {tc.className || 'Test'}
                              </div>
                              <div className="text-[8px] text-blue-600">
                                {tc.startTime}-{tc.endTime}
                              </div>
                              <div className="text-[7px] text-blue-500 truncate">
                                {tc.subjectId?.name}
                              </div>
                            </div>
                          );
                        } else if (item.type === 'free') {
                          const slot = item.data;
                          
                          return (
                            <div
                              key={`free-${idx}`}
                              className="w-full text-left text-[9px] px-1.5 py-1 rounded border bg-success-50 text-success-800 border-success-200 mb-1 last:mb-0 shadow-sm group relative"
                            >
                              <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddOffset(teacherId, date, slot.start, slot.end);
                                  }}
                                  className="p-0.5 bg-white rounded border border-success-200 text-success-600 hover:bg-success-100"
                                  title="Thêm lớp Offset"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              <div className="font-bold truncate flex items-center gap-1">
                                ⏰ Rảnh
                              </div>
                              <div className="text-[8px] text-success-600">
                                {slot.start}-{slot.end}
                              </div>
                            </div>
                          );
                        }
                      });

                      // 3. Work Shift Status (if no specific items)
                      if (items.length === 0 && hasWorkShift) {
                        return (
                          <div className={`text-[10px] px-1.5 py-1 rounded border font-medium text-center ${
                            workShift.isOnLeave
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : workShift.isAvailable 
                              ? 'bg-success-50 text-success-800 border-success-200' 
                              : 'bg-secondary-100 text-secondary-600 border-secondary-200'
                          }`}>
                            {workShift.isOnLeave ? '🏖️ Nghỉ' : workShift.isAvailable ? '✓ Rảnh' : '🔒 Bận'}
                          </div>
                        );
                      }

                      return items;
                    };

                    return (
                      <td 
                        key={date} 
                        className="border border-secondary-200 p-1 align-top cursor-pointer hover:bg-primary-50/30 transition-colors h-16"
                        onClick={() => onSlotClick(teacherId, data.teacher?.name, date, shift)}
                      >
                        <div className="h-full flex flex-col justify-center">
                          {renderContent()}
                          {!hasFixedSchedules && !hasOffsetClasses && !hasWorkShift && (
                            <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-secondary-400 font-medium">+ Thêm</span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
            {Object.keys(groupedByTeacher).length === 0 && (
              <tr>
                <td colSpan={weekDates.length + 2} className="border border-secondary-200 p-12 text-center text-secondary-500">
                  Không có dữ liệu hiển thị
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ScheduleCalendar;
