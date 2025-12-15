import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { scheduleAPI, teachersAPI, fixedScheduleLeaveAPI, offsetClassesAPI, subjectsAPI, supplementaryClassesAPI, testClassesAPI } from '../services/api';
import Button from '../components/ui/Button';
import ScheduleFilters from '../components/schedule/ScheduleFilters';
import ScheduleCalendar from '../components/schedule/ScheduleCalendar';
import ScheduleList from '../components/schedule/ScheduleList';
import { 
  CreateScheduleModal, 
  LeaveRequestModal, 
  QuickCreateModal, 
  OffsetClassModal, 
  FixedScheduleModal,

  SupplementaryClassModal,
  TestClassModal,
  // Import other modals if they were exported separately or handle them here if simple
} from '../components/schedule/ScheduleModals';
import { useNotification } from '../components/ui/NotificationProvider';

  // Helper functions
const toLocalISOString = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 10);
};

const getWeekDates = (startDate) => {
  const dates = [];
  const start = startDate ? new Date(startDate) : new Date();
  // If no startDate provided, find the start of current week (Sunday)
  if (!startDate) {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
  }
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(toLocalISOString(date));
  }
  return dates;
};

const getCurrentWeekRange = () => {
  const curr = new Date();
  // Adjust to get Monday as first day if needed, but keeping existing logic structure
  // correcting timezone output
  const first = curr.getDate() - curr.getDay(); 
  const last = first + 6;

  const firstDay = new Date(curr.setDate(first));
  const lastDay = new Date(curr.setDate(last));

  return {
    start: toLocalISOString(firstDay),
    end: toLocalISOString(lastDay)
  };
};

const getDefaultViewRange = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday
  
  // Calculate days remaining until Sunday
  // If today is Sunday (0), we want to show just today (dist=0) or maybe full next week?
  // Treat 0 as 7 to ensure we target the *upcoming* Sunday of this week context
  const dayIndex = currentDay === 0 ? 7 : currentDay;
  const daysUntilSunday = 7 - dayIndex;
  
  const end = new Date(today);
  end.setDate(today.getDate() + daysUntilSunday);
  
  return {
    start: toLocalISOString(today),
    end: toLocalISOString(end)
  };
};

import { useAuth } from '../context/AuthContext';

const Schedule = () => {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole('admin');

  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [fixedSchedules, setFixedSchedules] = useState([]);
  const [fixedScheduleLeaves, setFixedScheduleLeaves] = useState([]);
  const [offsetClasses, setOffsetClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectLevels, setSubjectLevels] = useState([]);
  const [allTeachersDetails, setAllTeachersDetails] = useState([]);
  const [supplementaryClasses, setSupplementaryClasses] = useState([]);
  const [testClasses, setTestClasses] = useState([]);

  // Filter states
  const defaultRange = getDefaultViewRange();
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(defaultRange.start);
  const [filterEndDate, setFilterEndDate] = useState(defaultRange.end);
  const [filterTimePeriod, setFilterTimePeriod] = useState(''); // morning, afternoon, evening, night
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [showOffsetClassForm, setShowOffsetClassForm] = useState(false);
  const [showFixedScheduleForm, setShowFixedScheduleForm] = useState(false);

  const [showSupplementaryClassForm, setShowSupplementaryClassForm] = useState(false);
  const [showTestClassForm, setShowTestClassForm] = useState(false);
  const [showCancelOffsetModal, setShowCancelOffsetModal] = useState(false);
  const [showEditOffsetModal, setShowEditOffsetModal] = useState(false);
  const [showDeleteOffsetModal, setShowDeleteOffsetModal] = useState(false);
  const [showEditSupplementaryModal, setShowEditSupplementaryModal] = useState(false);
  const [showDeleteSupplementaryModal, setShowDeleteSupplementaryModal] = useState(false);
  const [showEditTestModal, setShowEditTestModal] = useState(false);
  const [showDeleteTestModal, setShowDeleteTestModal] = useState(false);

  // Selection states
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [quickCreateData, setQuickCreateData] = useState(null);
  const [offsetToCancel, setOffsetToCancel] = useState(null);
  const [offsetToEdit, setOffsetToEdit] = useState(null);
  const [offsetToDelete, setOffsetToDelete] = useState(null);
  const [supplementaryToEdit, setSupplementaryToEdit] = useState(null);
  const [supplementaryToDelete, setSupplementaryToDelete] = useState(null);
  const [testToEdit, setTestToEdit] = useState(null);
  const [testToDelete, setTestToDelete] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    teacherId: '',
    startDate: '',
    endDate: '',
    isAvailable: true,
    isOnLeave: false
  });
  const [selectedSlots, setSelectedSlots] = useState({});
  const [dateRange, setDateRange] = useState([]);

  const [offsetClassFormData, setOffsetClassFormData] = useState({
    subjectLevelId: '',
    className: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    notes: '',
  });

  const [fixedScheduleFormData, setFixedScheduleFormData] = useState({
    subjectId: '',
    className: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    startDate: '',
    endDate: '',
  });

  const [supplementaryClassFormData, setSupplementaryClassFormData] = useState({
    subjectLevelId: '',
    className: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    notes: '',
  });

  const [testClassFormData, setTestClassFormData] = useState({
    subjectId: '',
    className: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    notes: '',
    assignedTeacherId: '',
    reason: ''
  });

  const [editOffsetForm, setEditOffsetForm] = useState({
    assignedTeacherId: '',
    scheduledDate: '',
    startTime: '',
    endTime: ''
  });

  const [editSupplementaryForm, setEditSupplementaryForm] = useState({
    assignedTeacherId: '',
    scheduledDate: '',
    startTime: '',
    endTime: ''
  });

  const [editTestForm, setEditTestForm] = useState({
    assignedTeacherId: '',
    scheduledDate: '',
    startTime: '',
    endTime: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        shiftsRes, 
        teachersRes, 
        workShiftsRes, 
        leavesRes, 
        offsetRes,
        subjectsRes
      ] = await Promise.all([
        scheduleAPI.getAllShifts(),
        teachersAPI.getAll({ limit: 1000, status: 'active' }),
        scheduleAPI.getWorkShifts(),
        fixedScheduleLeaveAPI.getAll(),
        offsetClassesAPI.getAll({ limit: 1000 }),
        subjectsAPI.getAll()
      ]);

      setShifts(shiftsRes.data);
      setTeachers(teachersRes.data);
      setWorkShifts(workShiftsRes.data);
      setFixedScheduleLeaves(leavesRes.data);
      setOffsetClasses(offsetRes.data);
      setSubjects(subjectsRes.data);

      try {
        const suppRes = await supplementaryClassesAPI.getAll({ limit: 1000 });
        const suppData = suppRes.data.data || suppRes.data || [];
        setSupplementaryClasses(suppData);
      } catch (err) {
        console.error('Error fetching supplementary classes:', err);
      }

      try {
        const testRes = await testClassesAPI.getAll({ limit: 1000 });
        const testData = testRes.data.data || testRes.data || [];
        setTestClasses(testData);
      } catch (err) {
        console.error('Error fetching test classes:', err);
      }

      // Fetch full details for teachers to get their fixed schedules
      const teacherDetailsPromises = teachersRes.data.map(t => teachersAPI.getDetails(t._id));
      const teacherDetailsRes = await Promise.all(teacherDetailsPromises);
      setAllTeachersDetails(teacherDetailsRes.map(res => res.data));
      
      // Extract all fixed schedules from teacher details
      const allFixedSchedules = [];
      teacherDetailsRes.forEach(res => {
        const teacher = res.data;
        if (teacher.fixedSchedules && teacher.fixedSchedules.length > 0) {
          console.log(`Teacher ${teacher.name} has ${teacher.fixedSchedules.length} fixed schedules:`, teacher.fixedSchedules);
          teacher.fixedSchedules.forEach(fs => {
            allFixedSchedules.push({
              ...fs,
              teacherId: teacher._id
            });
          });
        }
      });
      console.log('Total fixed schedules extracted:', allFixedSchedules.length, allFixedSchedules);
      setFixedSchedules(allFixedSchedules);

    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch subject levels when modal opens
  useEffect(() => {
    const fetchSubjectLevels = async () => {
      try {
        const res = await subjectsAPI.getAllLevels();
        setSubjectLevels(res.data || []);
      } catch (error) {
        console.error('Error fetching subject levels:', error);
      }
    };

    if (showOffsetClassForm || showSupplementaryClassForm) {
      fetchSubjectLevels();
    }
  }, [showOffsetClassForm, showSupplementaryClassForm]);

  // Handle date range calculation for Create Schedule Modal
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const dates = [];
      let curr = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      while (curr <= end) {
        dates.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
      setDateRange(dates);
      
      // Reset selected slots when date range changes
      setSelectedSlots({});
    } else {
      setDateRange([]);
    }
  }, [formData.startDate, formData.endDate]);

  // Handlers for selection
  const handleSlotToggle = (date, shiftId) => {
    const key = `${date}_${shiftId}`;
    setSelectedSlots(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAllSlots = () => {
    const allSelected = Object.values(selectedSlots).length > 0 && Object.values(selectedSlots).every(Boolean);
    const newSlots = {};
    
    dateRange.forEach(date => {
      shifts.forEach(shift => {
        newSlots[`${date}_${shift._id}`] = !allSelected;
      });
    });
    
    setSelectedSlots(newSlots);
  };

  const handleSelectDateRow = (date) => {
    const newSlots = { ...selectedSlots };
    const allInRowSelected = shifts.every(shift => newSlots[`${date}_${shift._id}`]);
    
    shifts.forEach(shift => {
      newSlots[`${date}_${shift._id}`] = !allInRowSelected;
    });
    
    setSelectedSlots(newSlots);
  };

  const handleSelectShiftColumn = (shiftId) => {
    const newSlots = { ...selectedSlots };
    const allInColSelected = dateRange.every(date => newSlots[`${date}_${shiftId}`]);
    
    dateRange.forEach(date => {
      newSlots[`${date}_${shiftId}`] = !allInColSelected;
    });
    
    setSelectedSlots(newSlots);
  };

  // Form Submissions
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedKeys = Object.entries(selectedSlots)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);

      if (selectedKeys.length === 0) {
        showNotification('Vui lòng chọn ít nhất một ca làm việc', 'warning');
        return;
      }

      const promises = selectedKeys.map(key => {
        const [date, shiftId] = key.split('_');
        return scheduleAPI.createWorkShift({
          teacherId: formData.teacherId,
          date,
          shiftId,
          isAvailable: formData.isAvailable,
          isOnLeave: formData.isOnLeave
        });
      });

      await Promise.all(promises);
      showNotification('Thêm lịch làm việc thành công', 'success');
      setShowModal(false);
      setFormData({ teacherId: '', startDate: '', endDate: '', isAvailable: true, isOnLeave: false });
      setSelectedSlots({});
      loadData();
    } catch (error) {
      console.error('Error creating work shifts:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi không xác định';
      showNotification(`Lỗi khi thêm lịch làm việc: ${errorMessage}`, 'error');
    }
  };

  const handleLeaveSubmit = async (substituteTeacherId = null) => {
    try {
      if (selectedSchedule.isOnLeave) {
        // Restore schedule (delete leave record)
        // Restore schedule (delete leave record)
        const leaveRecord = fixedScheduleLeaves.find(leave => {
          const leaveScheduleId = typeof leave.fixedScheduleId === 'object' ? leave.fixedScheduleId?._id : leave.fixedScheduleId;
          const leaveDate = new Date(leave.date).toISOString().split('T')[0];
          return leaveScheduleId === selectedSchedule.fixedSchedule._id && leaveDate === selectedSchedule.date;
        });

        if (leaveRecord) {
          // Fix: Pass ID directly
          await fixedScheduleLeaveAPI.delete(leaveRecord._id);
          showNotification('Đã phục hồi lịch dạy', 'success');
        } else {
          showNotification('Không tìm thấy dữ liệu nghỉ để phục hồi', 'error');
        }
      } else {
        // Create leave request
        await fixedScheduleLeaveAPI.create({
          teacherId: selectedSchedule.teacherId,
          fixedScheduleId: selectedSchedule.fixedSchedule._id,
          date: selectedSchedule.date,
          reason: 'Giáo viên xin nghỉ',
          substituteTeacherId: substituteTeacherId || null
        });
        showNotification('Đã xác nhận nghỉ', 'success');
      }
      
      setShowLeaveModal(false);
      setSelectedSchedule(null);
      loadData();
    } catch (error) {
      console.error('Error handling leave:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi không xác định';
      showNotification(`Có lỗi xảy ra: ${errorMessage}`, 'error');
    }
  };

  const handleOffsetClassSubmit = async (e) => {
    e.preventDefault();
    try {
      await offsetClassesAPI.create({
        ...offsetClassFormData,
        originalClassId: null, // New class, not replacement
        assignedTeacherId: quickCreateData.teacherId,
        scheduledDate: quickCreateData.date,
        status: 'assigned'
      });
      
      showNotification('Tạo lớp offset thành công', 'success');
      setShowOffsetClassForm(false);
      setShowQuickCreateModal(false);
      setOffsetClassFormData({
        subjectLevelId: '',
        className: '',
        startTime: '',
        endTime: '',
        meetingLink: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating offset class:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi không xác định';
      showNotification(`Lỗi khi tạo lớp offset: ${errorMessage}`, 'error');
    }
  };


  const handleSupplementaryClassSubmit = async (e) => {
    e.preventDefault();
    try {
      await supplementaryClassesAPI.createWithAssignment({
        ...supplementaryClassFormData,
        assignedTeacherId: quickCreateData.teacherId,
        scheduledDate: quickCreateData.date,
        status: 'assigned'
      });
      
      showNotification('Tạo lớp bổ trợ thành công', 'success');
      setShowSupplementaryClassForm(false);
      setShowQuickCreateModal(false);
      setSupplementaryClassFormData({
        subjectLevelId: '',
        className: '',
        startTime: '',
        endTime: '',
        meetingLink: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating supplementary class:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi không xác định';
      showNotification(`Lỗi khi tạo lớp bổ trợ: ${errorMessage}`, 'error');
    }
  };

  const handleTestClassSubmit = async (e) => {
    e.preventDefault();
    try {
      const createData = { ...testClassFormData };
      // Override with quickCreateData details if needed, but form should have them
      createData.scheduledDate = quickCreateData.date;
      
      let response;
      if (!createData.assignedTeacherId || createData.assignedTeacherId === '') {
        // Auto assign
        delete createData.assignedTeacherId;
        response = await testClassesAPI.createWithAssignment(createData);
        if (response.autoAssigned) {
          showNotification('Tạo lớp test và tự động phân công thành công', 'success');
        } else {
          showNotification('Tạo lớp test thành công nhưng không tìm thấy giáo viên phù hợp', 'warning');
        }
      } else {
        // Manual assign
        createData.status = 'pending';
        response = await testClassesAPI.create(createData);
        showNotification('Tạo lớp test thành công', 'success');
      }

      setShowTestClassForm(false);
      setShowQuickCreateModal(false);
      setTestClassFormData({
        subjectId: '',
        className: '',
        scheduledDate: '',
        startTime: '',
        endTime: '',
        meetingLink: '',
        notes: '',
        assignedTeacherId: '',
        reason: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating test class:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi không xác định';
      showNotification(`Lỗi khi tạo lớp test: ${errorMessage}`, 'error');
    }
  };

  const handleFixedScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(quickCreateData.date).getDay()];
      
      await teachersAPI.addSchedule(quickCreateData.teacherId, {
        ...fixedScheduleFormData,
        dayOfWeek
      });
      
      showNotification('Thêm lịch cố định thành công', 'success');
      setShowFixedScheduleForm(false);
      setShowQuickCreateModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating fixed schedule:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi không xác định';
      showNotification(`Lỗi khi thêm lịch cố định: ${errorMessage}`, 'error');
    }
  };

  // Data processing for views
  // Generate dates based on the selected date range
  const getDateRange = (startDate, endDate) => {
    const dates = [];
    if (!startDate || !endDate) return dates;
    
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };
  
  const weekDates = getDateRange(filterStartDate, filterEndDate);
  
  // Helper: Check if a time falls within a period
  const isTimeInPeriod = (time, period) => {
    if (!period) return true; // No filter applied
    
    const [hours] = time.split(':').map(Number);
    
    switch (period) {
      case 'morning':
        return hours >= 8 && hours < 12;
      case 'afternoon':
        return hours >= 13 && hours < 17;
      case 'evening':
        return hours >= 17 && hours < 21;
      default:
        return true;
    }
  };
  
  // Filter shifts based on time period
  const shiftsToDisplay = filterTimePeriod 
    ? shifts.filter(shift => isTimeInPeriod(shift.startTime, filterTimePeriod))
    : shifts;
  
  // Filter data
  const filteredWorkShifts = workShifts.filter(ws => {
    const wsDate = new Date(ws.date).toISOString().split('T')[0];
    const inDateRange = (!filterStartDate || wsDate >= filterStartDate) && 
                        (!filterEndDate || wsDate <= filterEndDate);
    const matchTeacher = !filterTeacher || ws.teacherId?._id === filterTeacher || ws.teacherId === filterTeacher;
    
    // Check if work shift's shift matches the time period filter
    const matchTimePeriod = !filterTimePeriod || 
      (ws.shiftId && isTimeInPeriod(ws.shiftId.startTime, filterTimePeriod));
    
    return inDateRange && matchTeacher && matchTimePeriod;
  });

  // Group by teacher
  const groupedByTeacher = {};
  
  // Initialize for filtered teachers
  const teachersToDisplay = filterTeacher 
    ? teachers.filter(t => t._id === filterTeacher)
    : teachers;

  teachersToDisplay.forEach(teacher => {
    groupedByTeacher[teacher._id] = {
      teacher,
      slots: {}
    };
  });

  // Fill slots with work shifts
  filteredWorkShifts.forEach(ws => {
    const teacherId = ws.teacherId?._id || ws.teacherId;
    if (!groupedByTeacher[teacherId]) return;

    const dateKey = new Date(ws.date).toISOString().split('T')[0];
    const slotKey = `${dateKey}_${ws.shiftId._id}`;
    
    if (!groupedByTeacher[teacherId].slots[slotKey]) {
      groupedByTeacher[teacherId].slots[slotKey] = {
        date: dateKey,
        shift: ws.shiftId,
        workShift: null,
        fixedSchedules: []
      };
    }
    groupedByTeacher[teacherId].slots[slotKey].workShift = ws;
  });

  // Add fixed schedules
  if (filterStartDate && filterEndDate) {
    console.log('Processing fixed schedules for dates:', weekDates);
    console.log('Total fixed schedules available:', fixedSchedules.length);
    
    weekDates.forEach(date => {
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(date).getDay()];
      
      teachersToDisplay.forEach(teacher => {
        // Find fixed schedules for this teacher on this day
        const teacherFixedSchedules = fixedSchedules.filter(fs => 
          (fs.teacherId?._id === teacher._id || fs.teacherId === teacher._id) &&
          fs.dayOfWeek === dayOfWeek &&
          new Date(fs.startDate) <= new Date(date) &&
          (!fs.endDate || new Date(fs.endDate) >= new Date(date))
        );

        if (teacherFixedSchedules.length > 0) {
          console.log(`Found ${teacherFixedSchedules.length} fixed schedules for ${teacher.name} on ${dayOfWeek} (${date}):`, teacherFixedSchedules);
          
          shiftsToDisplay.forEach(shift => {
            const slotKey = `${date}_${shift._id}`;
            
            // Filter schedules that start in this shift (not overlap)
            const schedulesInShift = teacherFixedSchedules.filter(fs => {
              // Convert times to minutes for accurate comparison
              const timeToMinutes = (timeStr) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return hours * 60 + minutes;
              };
              
              const fsStartMinutes = timeToMinutes(fs.startTime);
              const shiftStartMinutes = timeToMinutes(shift.startTime);
              const shiftEndMinutes = timeToMinutes(shift.endTime);
              
              // Only check if the schedule STARTS within this shift
              return fsStartMinutes >= shiftStartMinutes && fsStartMinutes < shiftEndMinutes;
            });

            if (schedulesInShift.length > 0) {
              console.log(`Adding ${schedulesInShift.length} schedules to ${teacher.name}'s ${shift.name} shift on ${date}`);
              if (!groupedByTeacher[teacher._id].slots[slotKey]) {
                groupedByTeacher[teacher._id].slots[slotKey] = {
                  date: date,
                  shift: shift,
                  workShift: null,
                  fixedSchedules: []
                };
              }
              // Merge unique fixed schedules
              const existingIds = new Set(groupedByTeacher[teacher._id].slots[slotKey].fixedSchedules.map(fs => fs._id));
              schedulesInShift.forEach(fs => {
                if (!existingIds.has(fs._id)) {
                  groupedByTeacher[teacher._id].slots[slotKey].fixedSchedules.push(fs);
                }
              });
            }
          });
        }
      });
    });
  }

  // Navigation handlers
  const handlePrevWeek = () => {
    const start = new Date(filterStartDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(filterEndDate);
    end.setDate(end.getDate() - 7);
    setFilterStartDate(start.toISOString().split('T')[0]);
    setFilterEndDate(end.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const start = new Date(filterStartDate);
    start.setDate(start.getDate() + 7);
    const end = new Date(filterEndDate);
    end.setDate(end.getDate() + 7);
    setFilterStartDate(start.toISOString().split('T')[0]);
    setFilterEndDate(end.toISOString().split('T')[0]);
  };

  const handleCurrentWeek = () => {
    const week = getDefaultViewRange();
    setFilterStartDate(week.start);
    setFilterEndDate(week.end);
  };

  // Interaction handlers
  const handleSlotClick = (teacherId, teacherName, date, shift) => {
    if (!canEdit) return; // Restrict creation
    setQuickCreateData({
      teacherId,
      teacherName,
      date,
      shift
    });
    setShowQuickCreateModal(true);
  };

  const handleScheduleClick = (teacherId, date, shift, fixedSchedule, isOnLeave) => {
    if (!canEdit) return; // Restrict editing
    setSelectedSchedule({
      teacherId,
      date,
      shift,
      fixedSchedule,
      isOnLeave
    });
    // Reset substitute teacher selection if any (though usually managed in modal)
    setShowLeaveModal(true);
  };

  // Offset class handlers
  const handleEditOffset = (offset) => {
    setOffsetToEdit(offset);
    setEditOffsetForm({
      assignedTeacherId: typeof offset.assignedTeacherId === 'object' ? offset.assignedTeacherId._id : offset.assignedTeacherId,
      scheduledDate: new Date(offset.scheduledDate).toISOString().split('T')[0],
      startTime: offset.startTime,
      endTime: offset.endTime
    });
    setShowEditOffsetModal(true);
  };

  const handleCancelOffset = (offset) => {
    setOffsetToCancel(offset);
    setShowCancelOffsetModal(true);
  };

  const handleDeleteOffset = (offset) => {
    setOffsetToDelete(offset);
    setShowDeleteOffsetModal(true);
  };

  const handleAddOffsetDirectly = (teacherId, date, startTime, endTime) => {
    setQuickCreateData({
      teacherId,
      date,
      // We don't have teacherName here easily, but OffsetClassModal uses quickCreateData.teacherId mostly?
      // Actually QuickCreateModal has teacherName. OffsetClassModal uses quickCreateData for defaults.
      // We should try to find teacherName if possible, or just pass ID.
      // The modal uses basic info.
    });
    setOffsetClassFormData(prev => ({
      ...prev,
      startTime: startTime || '',
      endTime: endTime || ''
    }));
    setShowOffsetClassForm(true);
  };

  const handleCancelOffsetSubmit = async () => {
    try {
      await offsetClassesAPI.cancel(offsetToCancel._id, { reason: cancelReason });
      showNotification('Đã hủy lớp offset', 'success');
      setShowCancelOffsetModal(false);
      setOffsetToCancel(null);
      setCancelReason('');
      loadData();
    } catch (error) {
      console.error('Error cancelling offset:', error);
      showNotification('Lỗi khi hủy lớp offset', 'error');
    }
  };

  const handleEditOffsetSubmit = async (e) => {
    e.preventDefault();
    try {
      const updates = {};
      if (editOffsetForm.assignedTeacherId) updates.assignedTeacherId = editOffsetForm.assignedTeacherId;
      if (editOffsetForm.scheduledDate) updates.scheduledDate = editOffsetForm.scheduledDate;
      if (editOffsetForm.startTime) updates.startTime = editOffsetForm.startTime;
      if (editOffsetForm.endTime) updates.endTime = editOffsetForm.endTime;

      await offsetClassesAPI.update(offsetToEdit._id, updates);
      showNotification('Cập nhật lớp offset thành công', 'success');
      setShowEditOffsetModal(false);
      setOffsetToEdit(null);
      loadData();
    } catch (error) {
      console.error('Error updating offset:', error);
      showNotification('Lỗi khi cập nhật lớp offset', 'error');
    }
  };

  const handleDeleteOffsetSubmit = async () => {
    try {
      await offsetClassesAPI.delete(offsetToDelete._id);
      showNotification('Đã xóa lớp offset', 'success');
      setShowDeleteOffsetModal(false);
      setOffsetToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting offset:', error);
      showNotification('Lỗi khi xóa lớp offset', 'error');
    }
  };

  // Handlers for supplementary classes
  const handleEditSupplementary = (sc) => {
    setSupplementaryToEdit(sc);
    setEditSupplementaryForm({
      assignedTeacherId: typeof sc.assignedTeacherId === 'object' ? sc.assignedTeacherId._id : sc.assignedTeacherId,
      scheduledDate: sc.scheduledDate ? new Date(sc.scheduledDate).toISOString().split('T')[0] : '',
      startTime: sc.startTime || '',
      endTime: sc.endTime || ''
    });
    setShowEditSupplementaryModal(true);
  };

  const handleDeleteSupplementary = (sc) => {
    setSupplementaryToDelete(sc);
    setShowDeleteSupplementaryModal(true);
  };

  const handleEditSupplementarySubmit = async (e) => {
    e.preventDefault();
    try {
      await supplementaryClassesAPI.update(supplementaryToEdit._id, editSupplementaryForm);
      showNotification('Cập nhật lớp bổ trợ thành công', 'success');
      setShowEditSupplementaryModal(false);
      setSupplementaryToEdit(null);
      loadData();
    } catch (error) {
      console.error('Error updating supplementary:', error);
      showNotification('Lỗi khi cập nhật lớp bổ trợ', 'error');
    }
  };

  const handleDeleteSupplementarySubmit = async () => {
    try {
      await supplementaryClassesAPI.delete(supplementaryToDelete._id);
      showNotification('Đã xóa lớp bổ trợ', 'success');
      setShowDeleteSupplementaryModal(false);
      setSupplementaryToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting supplementary:', error);
      showNotification('Lỗi khi xóa lớp bổ trợ', 'error');
    }
  };

  // Handlers for test classes
  const handleEditTest = (tc) => {
    setTestToEdit(tc);
    setEditTestForm({
      assignedTeacherId: typeof tc.assignedTeacherId === 'object' ? tc.assignedTeacherId._id : tc.assignedTeacherId,
      scheduledDate: tc.scheduledDate ? new Date(tc.scheduledDate).toISOString().split('T')[0] : '',
      startTime: tc.startTime || '',
      endTime: tc.endTime || ''
    });
    setShowEditTestModal(true);
  };

  const handleDeleteTest = (tc) => {
    setTestToDelete(tc);
    setShowDeleteTestModal(true);
  };

  const handleEditTestSubmit = async (e) => {
    e.preventDefault();
    try {
      await testClassesAPI.update(testToEdit._id, editTestForm);
      showNotification('Cập nhật lớp test thành công', 'success');
      setShowEditTestModal(false);
      setTestToEdit(null);
      loadData();
    } catch (error) {
      console.error('Error updating test:', error);
      showNotification('Lỗi khi cập nhật lớp test', 'error');
    }
  };

  const handleDeleteTestSubmit = async () => {
    try {
      await testClassesAPI.delete(testToDelete._id);
      showNotification('Đã xóa lớp test', 'success');
      setShowDeleteTestModal(false);
      setTestToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting test:', error);
      showNotification('Lỗi khi xóa lớp test', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Quản lý Lịch làm việc</h1>
          <p className="text-secondary-500 mt-1">Quản lý lịch dạy, lịch cố định và phân công giáo viên</p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowLeaveModal(true)}
              >
                Xin nghỉ phép
              </Button>
              <Button
                onClick={() => setShowModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm lịch làm việc
              </Button>
            </>
          )}
        </div>
      </div>

      <ScheduleFilters
        filterTeacher={filterTeacher}
        setFilterTeacher={setFilterTeacher}
        teachers={teachers}
        filterStartDate={filterStartDate}
        setFilterStartDate={setFilterStartDate}
        filterEndDate={filterEndDate}
        setFilterEndDate={setFilterEndDate}
        filterTimePeriod={filterTimePeriod}
        setFilterTimePeriod={setFilterTimePeriod}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onCurrentWeekClick={handleCurrentWeek}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
      />

      {viewMode === 'calendar' && (
        <ScheduleCalendar
          weekDates={weekDates}
          shifts={shiftsToDisplay}
          groupedByTeacher={groupedByTeacher}
          offsetClasses={offsetClasses}
          fixedScheduleLeaves={fixedScheduleLeaves}
          allTeachersDetails={allTeachersDetails}
          onSlotClick={handleSlotClick}
          onScheduleClick={handleScheduleClick}
          onEditOffset={handleEditOffset}
          onCancelOffset={handleCancelOffset}
          onDeleteOffset={handleDeleteOffset}
          onAddOffset={handleAddOffsetDirectly}
          supplementaryClasses={supplementaryClasses}
          testClasses={testClasses}
          onEditSupplementary={handleEditSupplementary}
          onDeleteSupplementary={handleDeleteSupplementary}
          onEditTest={handleEditTest}
          onDeleteTest={handleDeleteTest}
        />
      )}

      {viewMode === 'list' && (
        <ScheduleList groupedByTeacher={groupedByTeacher} />
      )}

      {/* Modals */}
      <CreateScheduleModal
        show={showModal}
        onClose={() => setShowModal(false)}
        formData={formData}
        setFormData={setFormData}
        teachers={teachers}
        dateRange={dateRange}
        shifts={shifts}
        selectedSlots={selectedSlots}
        handleSlotToggle={handleSlotToggle}
        handleSelectAllSlots={handleSelectAllSlots}
        handleSelectDateRow={handleSelectDateRow}
        handleSelectShiftColumn={handleSelectShiftColumn}
        handleSubmit={handleSubmit}
      />

      <LeaveRequestModal
        show={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        selectedSchedule={selectedSchedule}
        handleLeaveSubmit={handleLeaveSubmit}
        teachers={teachers}
      />

      <QuickCreateModal
        show={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        data={quickCreateData}
        onOpenOffsetForm={() => setShowOffsetClassForm(true)}
        onOpenFixedForm={() => setShowFixedScheduleForm(true)}

        onOpenSupplementaryForm={() => setShowSupplementaryClassForm(true)}
        onOpenTestForm={() => {
          setTestClassFormData(prev => ({ 
            ...prev, 
            assignedTeacherId: '', // Reset to allow auto-fill from quickCreateData
            scheduledDate: ''      // Reset date too
          }));
          setShowTestClassForm(true);
        }}
      />

      <OffsetClassModal
        show={showOffsetClassForm}
        onClose={() => setShowOffsetClassForm(false)}
        formData={offsetClassFormData}
        setFormData={setOffsetClassFormData}
        subjectLevels={subjectLevels}
        handleSubmit={handleOffsetClassSubmit}
        quickCreateData={quickCreateData}
      />

      <SupplementaryClassModal
        show={showSupplementaryClassForm}
        onClose={() => setShowSupplementaryClassForm(false)}
        formData={supplementaryClassFormData}
        setFormData={setSupplementaryClassFormData}
        subjectLevels={subjectLevels}
        handleSubmit={handleSupplementaryClassSubmit}
        quickCreateData={quickCreateData}
      />

      <FixedScheduleModal
        show={showFixedScheduleForm}
        onClose={() => setShowFixedScheduleForm(false)}
        formData={fixedScheduleFormData}
        setFormData={setFixedScheduleFormData}
        subjects={subjects}
        handleSubmit={handleFixedScheduleSubmit}
        quickCreateData={quickCreateData}
      />

      <TestClassModal
        show={showTestClassForm}
        onClose={() => setShowTestClassForm(false)}
        formData={testClassFormData}
        setFormData={setTestClassFormData}
        subjects={subjects}
        teachers={teachers}
        handleSubmit={handleTestClassSubmit}
        quickCreateData={quickCreateData}
      />

      {/* Cancel Offset Modal (Simple, so keeping inline or could move to ScheduleModals if reused) */}
      {showCancelOffsetModal && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold mb-4 text-warning-600">Hủy lớp offset</h3>
            <div className="space-y-4">
              <p className="text-secondary-700">Bạn có chắc chắn muốn hủy lớp offset này không?</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500"
                rows={3}
                required
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowCancelOffsetModal(false)} className="flex-1">Hủy</Button>
                <Button onClick={handleCancelOffsetSubmit} className="flex-1 bg-warning-600 hover:bg-warning-700 border-transparent text-white">Xác nhận hủy</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Offset Modal */}
      {showDeleteOffsetModal && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold mb-4 text-danger-600">Xóa lớp offset</h3>
            <p className="text-secondary-700 mb-6">Bạn có chắc chắn muốn xóa lớp offset này không? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteOffsetModal(false)} className="flex-1">Hủy</Button>
              <Button onClick={handleDeleteOffsetSubmit} className="flex-1 bg-danger-600 hover:bg-danger-700 border-transparent text-white">Xóa vĩnh viễn</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Offset Modal - Simplified for brevity, ideally move to ScheduleModals */}
      {showEditOffsetModal && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold mb-4 text-primary-600">Chỉnh sửa lớp offset</h3>
            <form onSubmit={handleEditOffsetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Giáo viên</label>
                <select
                  value={editOffsetForm.assignedTeacherId}
                  onChange={(e) => setEditOffsetForm({ ...editOffsetForm, assignedTeacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Giữ nguyên --</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Ngày</label>
                <input
                  type="date"
                  value={editOffsetForm.scheduledDate}
                  onChange={(e) => setEditOffsetForm({ ...editOffsetForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Bắt đầu</label>
                  <input
                    type="time"
                    value={editOffsetForm.startTime}
                    onChange={(e) => setEditOffsetForm({ ...editOffsetForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Kết thúc</label>
                  <input
                    type="time"
                    value={editOffsetForm.endTime}
                    onChange={(e) => setEditOffsetForm({ ...editOffsetForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowEditOffsetModal(false)} className="flex-1">Hủy</Button>
                <Button type="submit" className="flex-1">Cập nhật</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplementary Modal */}
      {showEditSupplementaryModal && supplementaryToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Sửa lớp bổ trợ</h3>
            <form onSubmit={handleEditSupplementarySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Giáo viên</label>
                <select
                  value={editSupplementaryForm.assignedTeacherId}
                  onChange={(e) => setEditSupplementaryForm({ ...editSupplementaryForm, assignedTeacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Ngày</label>
                <input
                  type="date"
                  value={editSupplementaryForm.scheduledDate}
                  onChange={(e) => setEditSupplementaryForm({ ...editSupplementaryForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Bắt đầu</label>
                  <input
                    type="time"
                    value={editSupplementaryForm.startTime}
                    onChange={(e) => setEditSupplementaryForm({ ...editSupplementaryForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Kết thúc</label>
                  <input
                    type="time"
                    value={editSupplementaryForm.endTime}
                    onChange={(e) => setEditSupplementaryForm({ ...editSupplementaryForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowEditSupplementaryModal(false)} className="flex-1">Hủy</Button>
                <Button type="submit" className="flex-1">Cập nhật</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Supplementary Modal */}
      {showDeleteSupplementaryModal && supplementaryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Xác nhận xóa lớp bổ trợ</h3>
            <p className="text-secondary-600 mb-4">Bạn có chắc muốn xóa lớp "<strong>{supplementaryToDelete.className}</strong>"?</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteSupplementaryModal(false)} className="flex-1">Hủy</Button>
              <Button variant="danger" onClick={handleDeleteSupplementarySubmit} className="flex-1">Xóa</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {showEditTestModal && testToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Sửa lớp test</h3>
            <form onSubmit={handleEditTestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Giáo viên</label>
                <select
                  value={editTestForm.assignedTeacherId}
                  onChange={(e) => setEditTestForm({ ...editTestForm, assignedTeacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Ngày</label>
                <input
                  type="date"
                  value={editTestForm.scheduledDate}
                  onChange={(e) => setEditTestForm({ ...editTestForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Bắt đầu</label>
                  <input
                    type="time"
                    value={editTestForm.startTime}
                    onChange={(e) => setEditTestForm({ ...editTestForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Kết thúc</label>
                  <input
                    type="time"
                    value={editTestForm.endTime}
                    onChange={(e) => setEditTestForm({ ...editTestForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowEditTestModal(false)} className="flex-1">Hủy</Button>
                <Button type="submit" className="flex-1">Cập nhật</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Test Modal */}
      {showDeleteTestModal && testToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Xác nhận xóa lớp test</h3>
            <p className="text-secondary-600 mb-4">Bạn có chắc muốn xóa lớp "<strong>{testToDelete.className}</strong>"?</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteTestModal(false)} className="flex-1">Hủy</Button>
              <Button variant="danger" onClick={handleDeleteTestSubmit} className="flex-1">Xóa</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Schedule;
