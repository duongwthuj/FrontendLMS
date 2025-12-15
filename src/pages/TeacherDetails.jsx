import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, BookOpen, Calendar, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { teachersAPI, subjectsAPI } from '../services/api';

const TeacherDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectLevels, setSubjectLevels] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [expandedDays, setExpandedDays] = useState({}); // Track which days are expanded
  const [expandedSubjects, setExpandedSubjects] = useState({}); // Track which subjects are expanded
  const [levelForm, setLevelForm] = useState({
    subjectLevelId: '',
    certifications: []
  });
  const [scheduleForm, setScheduleForm] = useState({
    subjectId: '',
    className: '',
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    meetingLink: '',
    notes: '',
    startDate: '', // Ngày bắt đầu (bắt buộc)
    endDate: '', // Ngày kết thúc (không bắt buộc)
    role: 'teacher'
  });

  useEffect(() => {
    loadData();
    loadSubjects();
  }, [id]);

  const loadData = async () => {
    try {
      const response = await teachersAPI.getDetails(id);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      const subjectsWithLevels = await Promise.all(
        (response.data || []).map(async (subject) => {
          try {
            const detailResponse = await subjectsAPI.getWithLevels(subject._id);
            return detailResponse.data;
          } catch (error) {
            return subject;
          }
        })
      );
      setSubjects(subjectsWithLevels);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    setSubjectLevels(subject?.levels || []);
    setSelectedSubject(subjectId);
    setSelectedLevels([]);
  };

  const handleLevelToggle = (levelId) => {
    setSelectedLevels(prev => {
      if (prev.includes(levelId)) {
        return prev.filter(id => id !== levelId);
      } else {
        return [...prev, levelId];
      }
    });
  };

  const handleSelectAllLevels = () => {
    if (selectedLevels.length === subjectLevels.length) {
      setSelectedLevels([]);
    } else {
      setSelectedLevels(subjectLevels.map(level => level._id));
    }
  };

  const handleAddLevel = async (e) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        await teachersAPI.updateLevel(id, editingLevel._id, levelForm);
      } else {
        // Thêm nhiều levels cùng lúc
        if (selectedLevels.length === 0) {
          alert('Vui lòng chọn ít nhất một học phần');
          return;
        }
        
        for (const levelId of selectedLevels) {
          await teachersAPI.addLevel(id, {
            subjectLevelId: levelId,
            certifications: []
          });
        }
      }
      setShowLevelModal(false);
      setLevelForm({ subjectLevelId: '', certifications: [] });
      setEditingLevel(null);
      setSubjectLevels([]);
      setSelectedSubject('');
      setSelectedLevels([]);
      loadData();
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditLevel = (level) => {
    setEditingLevel(level);
    setLevelForm({
      subjectLevelId: level.subjectLevelId._id,
      certifications: level.certifications || []
    });
    
    // Tìm subject và load levels
    const subjectId = level.subjectLevelId.subjectId;
    const subject = subjects.find(s => s._id === subjectId);
    setSubjectLevels(subject?.levels || []);
    setShowLevelModal(true);
  };

  const handleDeleteLevel = async (levelId) => {
    if (!confirm('Bạn có chắc muốn xóa trình độ này?')) return;
    try {
      await teachersAPI.deleteLevel(id, levelId);
      loadData();
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await teachersAPI.updateSchedule(id, editingSchedule._id, scheduleForm);
      } else {
        await teachersAPI.addSchedule(id, scheduleForm);
      }
      setShowScheduleModal(false);
      setScheduleForm({
        subjectId: '',
        className: '',
        dayOfWeek: 'Monday',
        startTime: '08:00',
        endTime: '10:00',
        meetingLink: '',
        notes: '',
        startDate: '',
        endDate: '',
        role: 'teacher'
      });
      setEditingSchedule(null);
      loadData();
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      subjectId: schedule.subjectId?._id || schedule.subjectLevelId?.subjectId?._id || '',
      className: schedule.className,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      meetingLink: schedule.meetingLink || '',
      notes: schedule.notes || '',
      startDate: schedule.startDate ? schedule.startDate.split('T')[0] : '',
      endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
      role: schedule.role || 'teacher'
    });
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Bạn có chắc muốn xóa lịch này?')) return;
    try {
      await teachersAPI.deleteSchedule(id, scheduleId);
      loadData();
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  // Group schedules by day of week
  const groupSchedulesByDay = () => {
    if (!data?.fixedSchedules) return {};
    
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayNames = {
      'Monday': 'Thứ 2',
      'Tuesday': 'Thứ 3',
      'Wednesday': 'Thứ 4',
      'Thursday': 'Thứ 5',
      'Friday': 'Thứ 6',
      'Saturday': 'Thứ 7',
      'Sunday': 'Chủ nhật'
    };
    
    const grouped = {};
    daysOrder.forEach(day => {
      const schedules = data.fixedSchedules.filter(s => s.dayOfWeek === day);
      if (schedules.length > 0) {
        grouped[day] = {
          name: dayNames[day],
          schedules: schedules.sort((a, b) => a.startTime.localeCompare(b.startTime))
        };
      }
    });
    
    return grouped;
  };

  const toggleDay = (day) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const toggleSubject = (subjectId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  // Group teacher levels by subject
  const groupLevelsBySubject = () => {
    if (!data?.teacherLevels) return {};
    
    const grouped = {};
    data.teacherLevels.forEach(level => {
      const subjectId = level.subjectLevelId?.subjectId?._id;
      const subjectName = level.subjectLevelId?.subjectId?.name;
      
      if (!subjectId || !subjectName) return;
      
      if (!grouped[subjectId]) {
        grouped[subjectId] = {
          name: subjectName,
          levels: []
        };
      }
      
      grouped[subjectId].levels.push(level);
    });
    
    // Sort levels by name within each subject
    Object.values(grouped).forEach(subject => {
      subject.levels.sort((a, b) => 
        (a.subjectLevelId?.name || '').localeCompare(b.subjectLevelId?.name || '')
      );
    });
    
    return grouped;
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Không tìm thấy giáo viên</div>;

  return (
    <div>
      <Link to="/teachers" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
        <ArrowLeft className="w-5 h-5" />
        Quay lại danh sách
      </Link>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 text-3xl font-semibold">
                {data.name.charAt(0)}
              </span>
            </div>
            <div className="ml-6">
              <h1 className="text-3xl font-bold text-gray-800">{data.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {data.email}
                </div>
                {data.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {data.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Số lớp offset tối đa</p>
            <p className="text-3xl font-bold text-primary-600">{data.maxOffsetClasses || 0}</p>
            <p className="text-sm text-gray-600 mt-1">
              Hiện tại: {data.currentOffsetCount || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Trình độ giảng dạy
            </h2>
            <button
              onClick={() => {
                setEditingLevel(null);
                setLevelForm({ subjectLevelId: '', certifications: [] });
                setSubjectLevels([]);
                setSelectedSubject('');
                setSelectedLevels([]);
                setShowLevelModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Thêm trình độ
            </button>
          </div>
          <div className="space-y-2">
            {data.teacherLevels && data.teacherLevels.length > 0 ? (
              (() => {
                const groupedLevels = groupLevelsBySubject();
                return Object.keys(groupedLevels).length > 0 ? (
                  Object.entries(groupedLevels).map(([subjectId, subjectData]) => (
                    <div key={subjectId} className="border rounded-lg overflow-hidden">
                      {/* Subject Header - Clickable */}
                      <button
                        onClick={() => toggleSubject(subjectId)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">📚 {subjectData.name}</span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                            {subjectData.levels.length} học phần
                          </span>
                        </div>
                        {expandedSubjects[subjectId] ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      
                      {/* Level Details - Expandable */}
                      {expandedSubjects[subjectId] && (
                        <div className="p-3 space-y-2 bg-white">
                          {subjectData.levels.map((level) => (
                            <div key={level._id} className="border rounded-lg p-3 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-800">
                                      {level.subjectLevelId?.name || 'Unknown'}
                                    </span>
                                  </div>
                                  {level.certifications && level.certifications.length > 0 && (
                                    <div className="mt-1">
                                      <p className="text-xs text-gray-500 mb-1">Chứng chỉ:</p>
                                      <div className="space-y-0.5">
                                        {level.certifications.map((cert, idx) => (
                                          <p key={idx} className="text-xs text-gray-600 pl-2">• {cert.name}</p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => handleEditLevel(level)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Chỉnh sửa"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLevel(level._id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Chưa có thông tin trình độ</p>
                );
              })()
            ) : (
              <p className="text-gray-500 text-center py-4">Chưa có thông tin trình độ</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Lịch cố định
            </h2>
            <button
              onClick={() => {
                setEditingSchedule(null);
                setScheduleForm({
                  subjectId: '',
                  className: '',
                  dayOfWeek: 'Monday',
                  startTime: '08:00',
                  endTime: '10:00',
                  meetingLink: '',
                  notes: '',
                  role: 'teacher'
                });
                setShowScheduleModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Thêm lịch
            </button>
          </div>
          <div className="space-y-2">
            {data.fixedSchedules && data.fixedSchedules.length > 0 ? (
              (() => {
                const groupedSchedules = groupSchedulesByDay();
                return Object.keys(groupedSchedules).length > 0 ? (
                  Object.entries(groupedSchedules).map(([day, dayData]) => (
                    <div key={day} className="border rounded-lg overflow-hidden">
                      {/* Day Header - Clickable */}
                      <button
                        onClick={() => toggleDay(day)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{dayData.name}</span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                            {dayData.schedules.length} lớp
                          </span>
                        </div>
                        {expandedDays[day] ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      
                      {/* Schedule Details - Expandable */}
                      {expandedDays[day] && (
                        <div className="p-3 space-y-2 bg-white">
                          {dayData.schedules.map((schedule) => {
                            const isEnded = schedule.endDate && new Date(schedule.endDate) < new Date();
                            return (
                              <div key={schedule._id} className={`border rounded-lg p-3 ${isEnded ? 'bg-gray-100 border-gray-200' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`font-medium ${isEnded ? 'text-gray-500' : 'text-gray-800'}`}>{schedule.className}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded ${isEnded ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                                        ⏰ {schedule.startTime} - {schedule.endTime}
                                      </span>
                                      {isEnded && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 font-medium">
                                          Kết thúc
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-xs ${isEnded ? 'text-gray-400' : 'text-gray-600'}`}>
                                      📚 {schedule.subjectId?.name || schedule.subjectLevelId?.subjectId?.name || 'N/A'}
                                    </p>
                                    {schedule.meetingLink && (
                                      <p className={`text-xs truncate mt-1 ${isEnded ? 'text-gray-400' : 'text-blue-600'}`}>
                                        🔗 <a href={schedule.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                          {schedule.meetingLink}
                                        </a>
                                      </p>
                                    )}
                                    {schedule.notes && (
                                      <p className={`text-xs mt-1 ${isEnded ? 'text-gray-400' : 'text-gray-500'}`}>💬 {schedule.notes}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      onClick={() => handleEditSchedule(schedule)}
                                      className={`p-1 rounded ${isEnded ? 'text-gray-400 hover:bg-gray-200' : 'text-blue-600 hover:bg-blue-50'}`}
                                      title="Chỉnh sửa"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchedule(schedule._id)}
                                      className={`p-1 rounded ${isEnded ? 'text-gray-400 hover:bg-gray-200' : 'text-red-600 hover:bg-red-50'}`}
                                      title="Xóa"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Chưa có lịch cố định</p>
                );
              })()
            ) : (
              <p className="text-gray-500 text-center py-4">Chưa có lịch cố định</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal thêm/sửa trình độ */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingLevel ? 'Chỉnh sửa trình độ' : 'Thêm trình độ giảng dạy'}
            </h3>
            <form onSubmit={handleAddLevel}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn môn học *
                  </label>
                  <select
                    required
                    value={selectedSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={editingLevel}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>

                {subjectLevels.length > 0 && !editingLevel && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Chọn học phần * ({selectedLevels.length} đã chọn)
                      </label>
                      <button
                        type="button"
                        onClick={handleSelectAllLevels}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {selectedLevels.length === subjectLevels.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    </div>
                    <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                      {subjectLevels
                        .sort((a, b) => a.semester - b.semester)
                        .map((level) => (
                          <label
                            key={level._id}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLevels.includes(level._id)}
                              onChange={() => handleLevelToggle(level._id)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className="ml-3">
                              <span className="text-sm font-medium text-gray-900">
                                {level.name}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                (Học phần {level.semester})
                              </span>
                              {level.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{level.description}</p>
                              )}
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                {editingLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Học phần
                    </label>
                    <input
                      type="text"
                      value={editingLevel.subjectLevelId?.name || ''}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Không thể thay đổi học phần khi chỉnh sửa. Vui lòng xóa và thêm mới nếu muốn thay đổi.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 {editingLevel 
                      ? 'Chỉnh sửa thông tin trình độ hiện có'
                      : 'Chọn môn học và tick vào các học phần mà giáo viên có thể dạy. Có thể chọn nhiều học phần cùng lúc!'
                    }
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLevelModal(false);
                    setEditingLevel(null);
                    setLevelForm({ subjectLevelId: '', certifications: [] });
                    setSubjectLevels([]);
                    setSelectedSubject('');
                    setSelectedLevels([]);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  disabled={!editingLevel && selectedLevels.length === 0}
                >
                  {editingLevel ? 'Cập nhật' : `Thêm ${selectedLevels.length} học phần`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal thêm/sửa lịch cố định */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingSchedule ? 'Chỉnh sửa lịch cố định' : 'Thêm lịch cố định'}
            </h3>
            <form onSubmit={handleAddSchedule}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên lớp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lớp 10A1"
                    value={scheduleForm.className}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, className: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò
                  </label>
                  <select
                    value={scheduleForm.role || 'teacher'}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="teacher">Giảng chính</option>
                    <option value="tutor">Trợ giảng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn môn học *
                  </label>
                  <select
                    required
                    value={scheduleForm.subjectId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- Chọn môn học --</option>
                    {/* Lấy danh sách môn học từ trình độ giáo viên */}
                    {data.teacherLevels && 
                      [...new Set(data.teacherLevels.map(level => level.subjectLevelId?.subjectId?._id))]
                      .filter(Boolean)
                      .map(subjectId => {
                        const level = data.teacherLevels.find(l => l.subjectLevelId?.subjectId?._id === subjectId);
                        const subject = level?.subjectLevelId?.subjectId;
                        return subject ? (
                          <option key={subject._id} value={subject._id}>
                            {subject.name} ({subject.code})
                          </option>
                        ) : null;
                      })
                    }
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Chỉ hiển thị các môn học mà giáo viên có trình độ dạy
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thứ *
                    </label>
                    <select
                      required
                      value={scheduleForm.dayOfWeek}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="Monday">Thứ 2</option>
                      <option value="Tuesday">Thứ 3</option>
                      <option value="Wednesday">Thứ 4</option>
                      <option value="Thursday">Thứ 5</option>
                      <option value="Friday">Thứ 6</option>
                      <option value="Saturday">Thứ 7</option>
                      <option value="Sunday">Chủ nhật</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian dạy *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Bắt đầu</label>
                      <select
                        required
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">-- Chọn giờ --</option>
                        <option value="07:00">07:00</option>
                        <option value="07:30">07:30</option>
                        <option value="08:00">08:00</option>
                        <option value="08:30">08:30</option>
                        <option value="09:00">09:00</option>
                        <option value="09:30">09:30</option>
                        <option value="10:00">10:00</option>
                        <option value="10:30">10:30</option>
                        <option value="11:00">11:00</option>
                        <option value="11:30">11:30</option>
                        <option value="12:00">12:00</option>
                        <option value="12:30">12:30</option>
                        <option value="13:00">13:00</option>
                        <option value="13:30">13:30</option>
                        <option value="14:00">14:00</option>
                        <option value="14:30">14:30</option>
                        <option value="15:00">15:00</option>
                        <option value="15:30">15:30</option>
                        <option value="16:00">16:00</option>
                        <option value="16:30">16:30</option>
                        <option value="17:00">17:00</option>
                        <option value="17:30">17:30</option>
                        <option value="18:00">18:00</option>
                        <option value="18:30">18:30</option>
                        <option value="19:00">19:00</option>
                        <option value="19:30">19:30</option>
                        <option value="20:00">20:00</option>
                        <option value="20:30">20:30</option>
                        <option value="21:00">21:00</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Kết thúc</label>
                      <select
                        required
                        value={scheduleForm.endTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">-- Chọn giờ --</option>
                        <option value="07:30">07:30</option>
                        <option value="08:00">08:00</option>
                        <option value="08:30">08:30</option>
                        <option value="09:00">09:00</option>
                        <option value="09:30">09:30</option>
                        <option value="10:00">10:00</option>
                        <option value="10:30">10:30</option>
                        <option value="11:00">11:00</option>
                        <option value="11:30">11:30</option>
                        <option value="12:00">12:00</option>
                        <option value="12:30">12:30</option>
                        <option value="13:00">13:00</option>
                        <option value="13:30">13:30</option>
                        <option value="14:00">14:00</option>
                        <option value="14:30">14:30</option>
                        <option value="15:00">15:00</option>
                        <option value="15:30">15:30</option>
                        <option value="16:00">16:00</option>
                        <option value="16:30">16:30</option>
                        <option value="17:00">17:00</option>
                        <option value="17:30">17:30</option>
                        <option value="18:00">18:00</option>
                        <option value="18:30">18:30</option>
                        <option value="19:00">19:00</option>
                        <option value="19:30">19:30</option>
                        <option value="20:00">20:00</option>
                        <option value="20:30">20:30</option>
                        <option value="21:00">21:00</option>
                        <option value="21:30">21:30</option>
                        <option value="22:00">22:00</option>
                      </select>
                    </div>
                  </div>
                  {scheduleForm.startTime && scheduleForm.endTime && scheduleForm.startTime >= scheduleForm.endTime && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Giờ kết thúc phải sau giờ bắt đầu</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, startTime: '07:00', endTime: '09:00' })}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      🌅 Sáng: 7:00 - 9:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, startTime: '09:00', endTime: '11:00' })}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      ☀️ Trưa: 9:00 - 11:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, startTime: '13:00', endTime: '15:00' })}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      🌤️ Chiều: 13:00 - 15:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, startTime: '18:00', endTime: '20:00' })}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      🌙 Tối: 18:00 - 20:00
                    </button>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduleForm.startDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lịch cố định có hiệu lực từ ngày này</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.endDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                      min={scheduleForm.startDate}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Để trống nếu không có ngày kết thúc</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link meeting (Zoom, Google Meet...)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={scheduleForm.meetingLink}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    placeholder="Ghi chú về lịch dạy..."
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingSchedule(null);
                    setScheduleForm({
                      subjectId: '',
                      className: '',
                      dayOfWeek: 'Monday',
                      startTime: '08:00',
                      endTime: '10:00',
                      meetingLink: '',
                      notes: '',
                      startDate: '',
                      endDate: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={scheduleForm.startTime >= scheduleForm.endTime}
                >
                  {editingSchedule ? 'Cập nhật' : 'Thêm lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDetails;
