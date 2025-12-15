import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import axios from 'axios';
import { teachersAPI, subjectsAPI } from '../services/api'; // Reuse existing APIs
import { BookOpen, Calendar, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'levels', 'schedules'
  
  // State for Levels Management
  const [subjects, setSubjects] = useState([]);
  const [subjectLevels, setSubjectLevels] = useState([]);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [levelForm, setLevelForm] = useState({ subjectLevelId: '', certifications: [] });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevels, setSelectedLevels] = useState([]);

  // State for Schedules Management
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
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
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    fetchProfile();
    loadSubjects();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Use getMe to get ID, then fetch full details using teacher API
      // But getMe should return teacherId populate.
      // Let's rely on /api/auth/me for basic link, then fetch details if needed.
      // Actually, to get full teacherLevels and fixedSchedules, we might need /teachers/:id/details
      // The authController:getMe currently populates 'teacherId' which creates an object.
      // BUT it might not populate deep levels/schedules unless we updated getMe too.
      // Let's check authController.getMe again? 
      // It does: .populate('teacherId');
      // Teacher model virtuals 'teacherLevels' are not automatically populated unless we use .populate path.
      
      // Better approach: Get user -> Get teacherId -> Call getTeacherDetails
      const meRes = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
      });
      const teacherId = meRes.data.teacherId?._id;
      
      if (teacherId) {
          const detailRes = await teachersAPI.getDetails(teacherId);
          setProfile({ ...meRes.data, teacherDetails: detailRes.data });
      } else {
          setProfile(meRes.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
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

  // --- Level Handlers ---
  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    setSubjectLevels(subject?.levels || []);
    setSelectedSubject(subjectId);
    setSelectedLevels([]);
  };

  const handleLevelToggle = (levelId) => {
    setSelectedLevels(prev => prev.includes(levelId) ? prev.filter(id => id !== levelId) : [...prev, levelId]);
  };

  const handleSelectAllLevels = () => {
      if (selectedLevels.length === subjectLevels.length) setSelectedLevels([]);
      else setSelectedLevels(subjectLevels.map(level => level._id));
  };

  const handleAddLevel = async (e) => {
    e.preventDefault();
    const teacherId = profile.teacherId?._id;
    if (!teacherId) return;

    try {
      if (editingLevel) {
        await teachersAPI.updateLevel(teacherId, editingLevel._id, levelForm);
      } else {
        if (selectedLevels.length === 0) return alert('Vui lòng chọn ít nhất một học phần');
        for (const levelId of selectedLevels) {
          await teachersAPI.addLevel(teacherId, { subjectLevelId: levelId, certifications: [] });
        }
      }
      setShowLevelModal(false);
      resetLevelForm();
      fetchProfile();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteLevel = async (levelId) => {
      if (!confirm('Bạn có chắc muốn xóa trình độ này?')) return;
      try {
          await teachersAPI.deleteLevel(profile.teacherId?._id, levelId);
          fetchProfile();
      } catch (error) {
          alert('Lỗi: ' + (error.response?.data?.message || error.message));
      }
  };

  const resetLevelForm = () => {
      setLevelForm({ subjectLevelId: '', certifications: [] });
      setEditingLevel(null);
      setSubjectLevels([]);
      setSelectedSubject('');
      setSelectedLevels([]);
  };


  // --- Schedule Handlers ---
  const handleAddSchedule = async (e) => {
      e.preventDefault();
      const teacherId = profile.teacherId?._id;
      if (!teacherId) return;

      try {
          if (editingSchedule) {
              await teachersAPI.updateSchedule(teacherId, editingSchedule._id, scheduleForm);
          } else {
              await teachersAPI.addSchedule(teacherId, scheduleForm);
          }
          setShowScheduleModal(false);
          resetScheduleForm();
          fetchProfile();
      } catch (error) {
          alert('Lỗi: ' + (error.response?.data?.message || error.message));
      }
  };

  const handleDeleteSchedule = async (scheduleId) => {
      if (!confirm('Bạn có chắc muốn xóa lịch này?')) return;
      try {
          await teachersAPI.deleteSchedule(profile.teacherId?._id, scheduleId);
          fetchProfile();
      } catch (error) {
          alert('Lỗi: ' + (error.response?.data?.message || error.message));
      }
  };

  const resetScheduleForm = () => {
      setScheduleForm({
          subjectId: '', className: '', dayOfWeek: 'Monday', startTime: '08:00', endTime: '10:00',
          meetingLink: '', notes: '', startDate: '', endDate: '', role: 'teacher'
      });
      setEditingSchedule(null);
  };
    
  const toggleDay = (day) => {
    setExpandedDays(prev => ({...prev, [day]: !prev[day]}));
  };

  if (loading) return <div className="p-6">Đang tải thông tin...</div>;
  if (!profile) return <div className="p-6">Không tìm thấy thông tin người dùng.</div>;

  const teacher = profile.teacherDetails || {};
  const personalInfo = profile.teacherId || {};

  // Grouping Helpers
  const groupLevelsBySubject = () => {
      if (!teacher.teacherLevels) return {};
      const grouped = {};
      teacher.teacherLevels.forEach(level => {
          const subjectId = level.subjectLevelId?.subjectId?._id;
          const subjectName = level.subjectLevelId?.subjectId?.name;
          if (!subjectId) return;
          if (!grouped[subjectId]) grouped[subjectId] = { name: subjectName, levels: [] };
          grouped[subjectId].levels.push(level);
      });
      return grouped;
  };

  const groupSchedulesByDay = () => {
      if (!teacher.fixedSchedules) return {};
      const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayNames = { 'Monday': 'Thứ 2', 'Tuesday': 'Thứ 3', 'Wednesday': 'Thứ 4', 'Thursday': 'Thứ 5', 'Friday': 'Thứ 6', 'Saturday': 'Thứ 7', 'Sunday': 'Chủ nhật' };
      const grouped = {};
      daysOrder.forEach(day => {
          const schedules = teacher.fixedSchedules.filter(s => s.dayOfWeek === day);
          if (schedules.length > 0) grouped[day] = { name: dayNames[day], schedules };
          // Expand all days by default or logic
      });
      return grouped;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">Hồ Sơ Cá Nhân</h1>
        <p className="text-secondary-500 mt-1">Quản lý thông tin và lịch giảng dạy</p>
      </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
            <button 
                onClick={() => setActiveTab('info')}
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'info' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Thông tin chung
            </button>
            <button 
                onClick={() => setActiveTab('levels')}
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'levels' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Trình độ chuyên môn
            </button>
            <button 
                onClick={() => setActiveTab('schedules')}
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'schedules' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Lịch dạy cố định
            </button>
        </div>

      {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-700">Thông tin Tài khoản</h2>
            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-500">Tên đăng nhập</label>
                <div className="mt-1 text-gray-900">{profile.username}</div>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-500">Vai trò hệ thống</label>
                <div className="mt-1 text-gray-900 uppercase">{profile.role}</div>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-500">Ngày tham gia</label>
                <div className="mt-1 text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </div>
                </div>
            </div>
            </Card>

            <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-700">Thông tin Giáo viên</h2>
            {personalInfo.email ? (
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500">Họ và tên</label>
                    <div className="mt-1 text-gray-900 font-medium">{personalInfo.name}</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <div className="mt-1 text-gray-900">{personalInfo.email}</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Hình thức làm việc</label>
                    <div className="mt-1 text-gray-900 capitalize">{personalInfo.role}</div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-500">Số điện thoại</label>
                    <div className="mt-1 text-gray-900">{personalInfo.phone || 'Chưa cập nhật'}</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Ngày sinh</label>
                    <div className="mt-1 text-gray-900">
                    {personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </div>
                </div>
                </div>
            ) : (
                <div className="text-gray-500 italic">Chưa có thông tin cá nhân.</div>
            )}
            </Card>
        </div>
      )}

      {activeTab === 'levels' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Danh sách trình độ</h2>
                  <Button onClick={() => { resetLevelForm(); setShowLevelModal(true); }}>
                      <Plus className="w-4 h-4 mr-2" /> Thêm trình độ
                  </Button>
              </div>
              <div className="space-y-4">
               {Object.keys(groupLevelsBySubject()).length > 0 ? (
                   Object.entries(groupLevelsBySubject()).map(([subjectId, data]) => (
                       <Card key={subjectId} className="p-4">
                           <h3 className="font-bold text-lg mb-2 text-primary-700">{data.name}</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               {data.levels.map(level => (
                                   <div key={level._id} className="border p-3 rounded-lg bg-gray-50 flex justify-between items-start">
                                       <div>
                                            <div className="font-medium">{level.subjectLevelId?.name}</div>
                                            {level.certifications?.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {level.certifications.length} chứng chỉ
                                                </div>
                                            )}
                                       </div>
                                       <div className="flex gap-1">
                                            {/* Edit not implemented fully in modal for simplification, can delete/re-add */}
                                           <button onClick={() => handleDeleteLevel(level._id)} className="text-red-500 hover:bg-red-100 p-1 rounded">
                                               <Trash2 className="w-4 h-4"/>
                                           </button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </Card>
                   ))
               ) : (
                   <p className="text-gray-500 text-center">Chưa có thông tin trình độ.</p>
               )}
              </div>
          </div>
      )}

      {activeTab === 'schedules' && (
          <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Lịch dạy cố định</h2>
                  <Button onClick={() => { resetScheduleForm(); setShowScheduleModal(true); }}>
                      <Plus className="w-4 h-4 mr-2" /> Thêm lịch
                  </Button>
              </div>
              <div className="space-y-4">
                  {Object.keys(groupSchedulesByDay()).length > 0 ? (
                      Object.entries(groupSchedulesByDay()).map(([day, data]) => (
                        <Card key={day} className="p-0 overflow-hidden">
                            <div className="bg-gray-100 p-3 font-semibold text-gray-700 border-b">
                                {data.name}
                            </div>
                            <div className="p-4 space-y-3">
                                {data.schedules.map(schedule => (
                                    <div key={schedule._id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <div className="font-medium text-gray-900">{schedule.className}</div>
                                            <div className="text-sm text-gray-500">
                                                {schedule.startTime} - {schedule.endTime} | {schedule.subjectId?.name || 'N/A'}
                                            </div>
                                        </div>
                                         <div className="flex gap-2">
                                           <button onClick={() => { setEditingSchedule(schedule); setScheduleForm({
                                               ...schedule, 
                                               startDate: schedule.startDate?.split('T')[0],
                                               endDate: schedule.endDate?.split('T')[0],
                                               subjectId: schedule.subjectId?._id 
                                            }); setShowScheduleModal(true); }} className="text-blue-500 hover:bg-blue-100 p-1 rounded">
                                               <Edit className="w-4 h-4"/>
                                           </button>
                                           <button onClick={() => handleDeleteSchedule(schedule._id)} className="text-red-500 hover:bg-red-100 p-1 rounded">
                                               <Trash2 className="w-4 h-4"/>
                                           </button>
                                       </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                      ))
                  ) : (
                       <p className="text-gray-500 text-center">Chưa có lịch dạy cố định.</p>
                  )}
              </div>
          </div>
      )}

      {/* Modals */}
      {showLevelModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-lg p-6 w-full max-w-md">
                 <h3 className="text-xl font-bold mb-4">Thêm trình độ</h3>
                 <form onSubmit={handleAddLevel}>
                     <div className="mb-4">
                         <label className="block text-sm font-medium mb-1">Môn học</label>
                         <select className="w-full border rounded p-2" value={selectedSubject} onChange={(e) => handleSubjectChange(e.target.value)}>
                             <option value="">-- Chọn môn học --</option>
                             {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                         </select>
                     </div>
                     {selectedSubject && (
                         <div className="mb-4 max-h-60 overflow-y-auto border p-2 rounded">
                            {subjectLevels.map(lvl => (
                                <label key={lvl._id} className="flex items-center p-2 hover:bg-gray-50">
                                    <input type="checkbox" checked={selectedLevels.includes(lvl._id)} onChange={() => handleLevelToggle(lvl._id)} className="mr-2"/>
                                    {lvl.name}
                                </label>
                            ))}
                         </div>
                     )}
                     <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setShowLevelModal(false)}>Hủy</Button>
                        <Button type="submit">Lưu</Button>
                     </div>
                 </form>
             </div>
         </div>
      )}

      {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                 <h3 className="text-xl font-bold mb-4">{editingSchedule ? 'Sửa lịch' : 'Thêm lịch'}</h3>
                 <form onSubmit={handleAddSchedule} className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium mb-1">Tên lớp</label>
                         <input type="text" required value={scheduleForm.className} onChange={e => setScheduleForm({...scheduleForm, className: e.target.value})} className="w-full border rounded p-2"/>
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1">Môn học</label>
                         <select required value={scheduleForm.subjectId} onChange={e => setScheduleForm({...scheduleForm, subjectId: e.target.value})} className="w-full border rounded p-2">
                             <option value="">-- Chọn môn học --</option>
                             {/* Only show subjects teacher has levels for? Or all? Let's show all for flexibility or derived from teacherLevels */}
                             {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                         </select>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="block text-sm font-medium mb-1">Thứ</label>
                             <select className="w-full border rounded p-2" value={scheduleForm.dayOfWeek} onChange={e => setScheduleForm({...scheduleForm, dayOfWeek: e.target.value})}>
                                 {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                             </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Vai trò</label>
                            <select className="w-full border rounded p-2" value={scheduleForm.role} onChange={e => setScheduleForm({...scheduleForm, role: e.target.value})}>
                                <option value="teacher">Giảng chính</option>
                                <option value="tutor">Trợ giảng</option>
                            </select>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                         <div>
                             <label className="block text-sm font-medium mb-1">Bắt đầu</label>
                             <input type="time" required value={scheduleForm.startTime} onChange={e => setScheduleForm({...scheduleForm, startTime: e.target.value})} className="w-full border rounded p-2"/>
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1">Kết thúc</label>
                             <input type="time" required value={scheduleForm.endTime} onChange={e => setScheduleForm({...scheduleForm, endTime: e.target.value})} className="w-full border rounded p-2"/>
                         </div>
                     </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowScheduleModal(false)}>Hủy</Button>
                        <Button type="submit">Lưu</Button>
                     </div>
                 </form>
            </div>
          </div>
      )}

    </div>
  );
};

export default Profile;

