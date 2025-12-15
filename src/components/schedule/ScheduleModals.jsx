import React from 'react';
import { X, Calendar, Users, Clock, Edit, Trash2, AlertCircle, Info, ClipboardCheck } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export const CreateScheduleModal = ({ 
  show, 
  onClose, 
  formData, 
  setFormData, 
  teachers, 
  dateRange, 
  shifts, 
  selectedSlots, 
  handleSlotToggle, 
  handleSelectAllSlots, 
  handleSelectDateRow, 
  handleSelectShiftColumn, 
  handleSubmit 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
          <h3 className="text-lg font-bold text-secondary-900">Thêm lịch làm việc</h3>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-1 hover:bg-secondary-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Chọn giáo viên <span className="text-danger-500">*</span>
              </label>
              <select
                required
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
                <option value="">-- Chọn giáo viên --</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Từ ngày <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Đến ngày <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-secondary-100 pt-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="isAvailable" className="text-sm font-medium text-secondary-700">
                  Có thể nhận lớp offset
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isOnLeave"
                  checked={formData.isOnLeave}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      isOnLeave: e.target.checked,
                      isAvailable: !e.target.checked
                    });
                  }}
                  className="w-4 h-4 text-warning-600 rounded focus:ring-warning-500"
                />
                <label htmlFor="isOnLeave" className="text-sm font-medium text-secondary-700">
                  Xin nghỉ (không tính vào giờ dạy)
                </label>
              </div>
            </div>

            {dateRange.length > 0 && shifts.length > 0 && (
              <div className="border border-secondary-200 rounded-lg p-4 bg-secondary-50/50">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-secondary-700">
                    Chọn ca làm việc <span className="text-danger-500">*</span> ({Object.values(selectedSlots).filter(Boolean).length} ca đã chọn)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllSlots}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {Object.keys(selectedSlots).length > 0 && Object.values(selectedSlots).every(Boolean) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-secondary-100">
                        <th className="border border-secondary-200 p-2 text-left font-medium text-secondary-700">Ngày</th>
                        {shifts.map(shift => (
                          <th key={shift._id} className="border border-secondary-200 p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectShiftColumn(shift._id)}
                              className="w-full hover:bg-secondary-200 rounded p-1 transition-colors"
                            >
                              <div className="font-medium text-secondary-900">{shift.name}</div>
                              <div className="text-xs text-secondary-500">{shift.startTime}-{shift.endTime}</div>
                            </button>
                          </th>
                        ))}
                        <th className="border border-secondary-200 p-2 text-center font-medium text-secondary-700">Chọn tất cả</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {dateRange.map(date => {
                        const dateObj = new Date(date);
                        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                        const dayName = dayNames[dateObj.getDay()];
                        
                        return (
                          <tr key={date} className="hover:bg-secondary-50 transition-colors">
                            <td className="border border-secondary-200 p-2 font-medium text-secondary-900">
                              <div>{new Date(date).toLocaleDateString('vi-VN')}</div>
                              <div className="text-xs text-secondary-500">{dayName}</div>
                            </td>
                            {shifts.map(shift => {
                              const key = `${date}_${shift._id}`;
                              return (
                                <td key={key} className="border border-secondary-200 p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedSlots[key] || false}
                                    onChange={() => handleSlotToggle(date, shift._id)}
                                    className="w-5 h-5 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 cursor-pointer"
                                  />
                                </td>
                              );
                            })}
                            <td className="border border-secondary-200 p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectDateRow(date)}
                                className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              >
                                Chọn hàng
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-secondary-100">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={Object.values(selectedSlots).filter(Boolean).length === 0}
              >
                Thêm {Object.values(selectedSlots).filter(Boolean).length > 0 ? `${Object.values(selectedSlots).filter(Boolean).length} ca` : 'lịch'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export const LeaveRequestModal = ({ show, onClose, selectedSchedule, handleLeaveSubmit, teachers }) => {
  const [substituteTeacherId, setSubstituteTeacherId] = React.useState('');
  const [hasSubstitute, setHasSubstitute] = React.useState(false);

  // Reset state when modal opens/closes or schedule changes
  React.useEffect(() => {
    if (show) {
      setSubstituteTeacherId('');
      setHasSubstitute(false);
    }
  }, [show, selectedSchedule]);

  if (!show || !selectedSchedule) return null;

  const isLeave = selectedSchedule.isOnLeave;

  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-scale-up">
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLeave ? 'bg-primary-50 border-primary-100' : 'bg-warning-50 border-warning-100'
        }`}>
          <h3 className={`text-lg font-bold ${isLeave ? 'text-primary-900' : 'text-warning-900'}`}>
            {isLeave ? '↩️ Phục hồi lịch dạy' : '🏖️ Xác nhận xin nghỉ'}
          </h3>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className={`rounded-lg p-4 border mb-4 ${
            isLeave ? 'bg-primary-50/50 border-primary-100' : 'bg-warning-50/50 border-warning-100'
          }`}>
            <h4 className={`font-medium mb-2 ${isLeave ? 'text-primary-900' : 'text-warning-900'}`}>
              Thông tin lớp học:
            </h4>
            <div className={`text-sm space-y-1 ${isLeave ? 'text-primary-800' : 'text-warning-800'}`}>
              <p>📚 <strong>Môn:</strong> {selectedSchedule.fixedSchedule?.subjectId?.name || 'N/A'}</p>
              <p>📅 <strong>Ngày:</strong> {new Date(selectedSchedule.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p>⏰ <strong>Giờ:</strong> {selectedSchedule.fixedSchedule?.startTime} - {selectedSchedule.fixedSchedule?.endTime}</p>
              <p>🕐 <strong>Ca:</strong> {selectedSchedule.shift?.name} ({selectedSchedule.shift?.startTime}-{selectedSchedule.shift?.endTime})</p>
            </div>
          </div>

          {!isLeave && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasSubstitute"
                  checked={hasSubstitute}
                  onChange={(e) => {
                    setHasSubstitute(e.target.checked);
                    if (!e.target.checked) setSubstituteTeacherId('');
                  }}
                  className="w-4 h-4 text-warning-600 rounded focus:ring-warning-500"
                />
                <label htmlFor="hasSubstitute" className="text-sm font-medium text-secondary-700">
                  Có giáo viên dạy thay?
                </label>
              </div>

              {hasSubstitute && (
                <div className="animate-fade-in">
                  <select
                    value={substituteTeacherId}
                    onChange={(e) => setSubstituteTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500 text-sm"
                  >
                    <option value="">-- Chọn giáo viên dạy thay --</option>
                    {teachers?.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button 
              onClick={() => {
                // Pass the substitute teacher ID to the parent handler
                handleLeaveSubmit(substituteTeacherId);
              }}
              className={`flex-1 ${isLeave ? 'bg-primary-600 hover:bg-primary-700' : 'bg-warning-600 hover:bg-warning-700 border-transparent text-white'}`}
            >
              {isLeave ? 'Xác nhận phục hồi' : 'Xác nhận xin nghỉ'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const QuickCreateModal = ({ 
  show, 
  onClose, 
  data, 
  onOpenOffsetForm, 
  onOpenFixedForm,
  onOpenSupplementaryForm,
  onOpenTestForm
}) => {
  if (!show || !data) return null;

  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl animate-scale-up">
        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
          <h3 className="text-lg font-bold text-secondary-900">➕ Tạo mới lịch dạy</h3>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-1 hover:bg-secondary-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-secondary-600">👤 Giáo viên:</span>
                <span className="font-medium text-secondary-900 ml-2">{data.teacherName}</span>
              </div>
              <div>
                <span className="text-secondary-600">📅 Ngày:</span>
                <span className="font-medium text-secondary-900 ml-2">
                  {new Date(data.date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">🕐 Ca:</span>
                <span className="font-medium text-secondary-900 ml-2">
                  {data.shift.name} ({data.shift.startTime}-{data.shift.endTime})
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button
              onClick={onOpenOffsetForm}
              className="p-6 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <span className="text-2xl">🔄</span>
                </div>
                <div>
                  <h4 className="font-bold text-secondary-900 mb-1 group-hover:text-purple-700">
                    Tạo lớp Offset
                  </h4>
                  <p className="text-sm text-secondary-600">
                    Tạo lớp bù/dạy thay cho học sinh
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={onOpenFixedForm}
              className="p-6 border-2 border-primary-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h4 className="font-bold text-secondary-900 mb-1 group-hover:text-primary-700">
                    Thêm lịch cố định
                  </h4>
                  <p className="text-sm text-secondary-600">
                    Thêm lịch dạy thường xuyên
                  </p>
                </div>
              </div>
            </button>
            <button
              onClick={onOpenSupplementaryForm}
              className="p-6 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <h4 className="font-bold text-secondary-900 mb-1 group-hover:text-green-700">
                    Tạo lớp bổ trợ
                  </h4>
                  <p className="text-sm text-secondary-600">
                    Lớp học thêm, ngoại khóa
                  </p>
                </div>
              </div>
            </button>
            
            <button
              onClick={onOpenTestForm}
              className="p-6 border-2 border-orange-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <ClipboardCheck className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-secondary-900 mb-1 group-hover:text-orange-700">
                    Tạo lớp Test
                  </h4>
                  <p className="text-sm text-secondary-600">
                    Lớp kiểm tra đánh giá
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const OffsetClassModal = ({ 
  show, 
  onClose, 
  formData, 
  setFormData, 
  subjectLevels,
  handleSubmit, 
  quickCreateData 
}) => {
  if (!show || !quickCreateData) return null;

  // Derive unique subjects from subjectLevels
  const subjects = React.useMemo(() => {
    const uniqueSubjects = {};
    subjectLevels.forEach(level => {
      if (level.subjectId && level.subjectId._id) {
        uniqueSubjects[level.subjectId._id] = level.subjectId;
      }
    });
    return Object.values(uniqueSubjects);
  }, [subjectLevels]);

  const [activeSubjectId, setActiveSubjectId] = React.useState('');

  // Sync activeSubjectId when formData.subjectLevelId changes (e.g. opening modal with data)
  React.useEffect(() => {
    if (formData.subjectLevelId && subjectLevels.length > 0) {
      const selectedLevel = subjectLevels.find(l => l._id === formData.subjectLevelId);
      if (selectedLevel?.subjectId?._id) {
        setActiveSubjectId(selectedLevel.subjectId._id);
      }
    } else if (!formData.subjectLevelId) {
      setActiveSubjectId('');
    }
  }, [formData.subjectLevelId, subjectLevels]);

  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
        <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-purple-50">
          <h3 className="text-lg font-bold text-purple-900">🔄 Tạo lớp Offset</h3>
          <button onClick={onClose} className="text-purple-400 hover:text-purple-600 p-1 hover:bg-purple-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Môn học <span className="text-danger-500">*</span>
              </label>
              <select
                required
                value={activeSubjectId}
                onChange={(e) => {
                  setActiveSubjectId(e.target.value);
                  setFormData({ ...formData, subjectLevelId: '' });
                }}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                 Học phần <span className="text-danger-500">*</span>
              </label>
              <select
                required
                value={formData.subjectLevelId}
                onChange={(e) => setFormData({ ...formData, subjectLevelId: e.target.value })}
                disabled={!activeSubjectId}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">-- Chọn học phần --</option>
                {subjectLevels
                  .filter(l => l.subjectId?._id === activeSubjectId)
                  .map(level => (
                    <option key={level._id} value={level._id}>
                      {level.displayName || `${level.subjectId?.name} - HP ${level.semester}`}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Mã lớp <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: TE-C-PA-711-2020BLG-0086"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-semibold text-gray-700">Gợi ý khung giờ nhanh</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Buổi sáng */}
                <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col gap-2 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-blue-800">
                    <span>🌅</span>
                    <span>Buổi sáng</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { start: '08:00', end: '09:30' },
                      { start: '09:30', end: '11:00' }
                    ].map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, startTime: slot.start, endTime: slot.end })}
                        className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-blue-200 text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all w-full text-center"
                      >
                        {slot.start} - {slot.end}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buổi chiều */}
                <div className="p-3 rounded-xl border border-orange-100 bg-orange-50/50 flex flex-col gap-2 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-orange-800">
                    <span>☀️</span>
                    <span>Buổi chiều</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { start: '13:30', end: '15:00' },
                      { start: '15:00', end: '16:30' },
                      { start: '16:30', end: '18:00' }
                    ].map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, startTime: slot.start, endTime: slot.end })}
                        className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-orange-200 text-orange-600 hover:text-orange-700 hover:border-orange-400 hover:bg-orange-50 transition-all w-full text-center"
                      >
                        {slot.start} - {slot.end}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buổi tối */}
                <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50 flex flex-col gap-2 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-purple-800">
                    <span>🌙</span>
                    <span>Buổi tối</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { start: '18:00', end: '19:30' },
                      { start: '19:30', end: '21:00' }
                    ].map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, startTime: slot.start, endTime: slot.end })}
                        className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-purple-200 text-purple-600 hover:text-purple-700 hover:border-purple-400 hover:bg-purple-50 transition-all w-full text-center"
                      >
                        {slot.start} - {slot.end}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Giờ bắt đầu <span className="text-danger-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Giờ kết thúc <span className="text-danger-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Link meeting
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Ghi chú
              </label>
              <textarea
                rows={3}
                placeholder="Nội dung cần lưu ý..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-secondary-100">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-purple-600 hover:bg-purple-700 border-transparent text-white"
              >
                Tạo lớp offset
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export const FixedScheduleModal = ({ 
  show, 
  onClose, 
  formData, 
  setFormData, 
  subjects, 
  handleSubmit, 
  quickCreateData 
}) => {
  if (!show || !quickCreateData) return null;

  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
        <div className="px-6 py-4 border-b border-primary-100 flex items-center justify-between bg-primary-50">
          <h3 className="text-lg font-bold text-primary-900">📚 Thêm lịch cố định</h3>
          <button onClick={onClose} className="text-primary-400 hover:text-primary-600 p-1 hover:bg-primary-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Môn học <span className="text-danger-500">*</span>
              </label>
              <select
                required
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Lớp <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 10A1, 11B2, ..."
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Vai trò
              </label>
              <select
                value={formData.role || 'teacher'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
                <option value="teacher">Giảng chính</option>
                <option value="tutor">Trợ giảng</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Giờ bắt đầu <span className="text-danger-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Giờ kết thúc <span className="text-danger-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Ngày bắt đầu <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-secondary-100">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
              >
                Thêm lịch cố định
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export const SupplementaryClassModal = ({ 
  show, 
  onClose, 
  formData, 
  setFormData, 
  subjectLevels,
  handleSubmit, 
  quickCreateData 
}) => {
  if (!show || !quickCreateData) return null;

  // Derive unique subjects from subjectLevels
  const subjects = React.useMemo(() => {
    const uniqueSubjects = {};
    subjectLevels.forEach(level => {
      if (level.subjectId && level.subjectId._id) {
        uniqueSubjects[level.subjectId._id] = level.subjectId;
      }
    });
    return Object.values(uniqueSubjects);
  }, [subjectLevels]);

  const [activeSubjectId, setActiveSubjectId] = React.useState('');

  // Sync activeSubjectId when formData.subjectLevelId changes
  React.useEffect(() => {
    if (formData.subjectLevelId && subjectLevels.length > 0) {
      const selectedLevel = subjectLevels.find(l => l._id === formData.subjectLevelId);
      if (selectedLevel?.subjectId?._id) {
        setActiveSubjectId(selectedLevel.subjectId._id);
      }
    } else if (!formData.subjectLevelId) {
      setActiveSubjectId('');
    }
  }, [formData.subjectLevelId, subjectLevels]);

  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
        <div className="px-6 py-4 border-b border-green-100 flex items-center justify-between bg-green-50">
          <h3 className="text-lg font-bold text-green-900">🌱 Tạo lớp bổ trợ</h3>
          <button onClick={onClose} className="text-green-400 hover:text-green-600 p-1 hover:bg-green-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Show selected teacher info */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-800 text-sm font-bold">
                {quickCreateData.teacherName?.charAt(0) || '?'}
              </div>
              <div>
                <div className="text-sm font-semibold text-green-900">
                  Giáo viên: {quickCreateData.teacherName || 'Chưa xác định'}
                </div>
                <div className="text-xs text-green-600">
                  Ngày: {quickCreateData.date ? new Date(quickCreateData.date).toLocaleDateString('vi-VN') : ''}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Môn học <span className="text-danger-500">*</span>
              </label>
              <select
                required
                value={activeSubjectId}
                onChange={(e) => {
                  setActiveSubjectId(e.target.value);
                  setFormData({ ...formData, subjectLevelId: '' });
                }}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Học phần <span className="text-danger-500">*</span>
              </label>
              <select
                required
                value={formData.subjectLevelId}
                onChange={(e) => setFormData({ ...formData, subjectLevelId: e.target.value })}
                disabled={!activeSubjectId}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">-- Chọn học phần --</option>
                {subjectLevels
                  .filter(l => l.subjectId?._id === activeSubjectId)
                  .map(level => (
                    <option key={level._id} value={level._id}>
                      {level.displayName || `${level.subjectId?.name} - HP ${level.semester}`}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tên lớp <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Lớp bổ trợ Toán..."
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-semibold text-gray-700">Gợi ý khung giờ nhanh</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Buổi sáng */}
                <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col gap-2 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-blue-800">
                    <span>🌅</span>
                    <span>Buổi sáng</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { start: '08:00', end: '08:45' },
                      { start: '08:45', end: '09:30' },
                      { start: '09:30', end: '10:15' },
                      { start: '10:15', end: '11:00' }
                    ].map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                           const [hours, mins] = slot.start.split(':').map(Number);
                           const date = new Date();
                           date.setHours(hours, mins + 45);
                           const endTime = date.toTimeString().slice(0, 5);
                           setFormData({ ...formData, startTime: slot.start, endTime: endTime })
                        }}
                        className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-blue-200 text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all w-full text-center"
                      >
                        {slot.start} (45')
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buổi chiều */}
                <div className="p-3 rounded-xl border border-orange-100 bg-orange-50/50 flex flex-col gap-2 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-orange-800">
                    <span>☀️</span>
                    <span>Buổi chiều</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { start: '13:30', end: '14:15' },
                      { start: '14:15', end: '15:00' },
                      { start: '15:00', end: '15:45' },
                      { start: '15:45', end: '16:30' },
                      { start: '16:30', end: '17:15' },
                      { start: '17:15', end: '18:00' }
                    ].map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                           const [hours, mins] = slot.start.split(':').map(Number);
                           const date = new Date();
                           date.setHours(hours, mins + 45);
                           const endTime = date.toTimeString().slice(0, 5);
                           setFormData({ ...formData, startTime: slot.start, endTime: endTime })
                        }}
                        className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-orange-200 text-orange-600 hover:text-orange-700 hover:border-orange-400 hover:bg-orange-50 transition-all w-full text-center"
                      >
                         {slot.start} (45')
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buổi tối */}
                <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50 flex flex-col gap-2 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-purple-800">
                    <span>🌙</span>
                    <span>Buổi tối</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { start: '18:00', end: '18:45' },
                      { start: '18:45', end: '19:30' },
                      { start: '19:30', end: '20:15' },
                      { start: '20:15', end: '21:00' }
                    ].map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                           const [hours, mins] = slot.start.split(':').map(Number);
                           const date = new Date();
                           date.setHours(hours, mins + 45);
                           const endTime = date.toTimeString().slice(0, 5);
                           setFormData({ ...formData, startTime: slot.start, endTime: endTime })
                        }}
                        className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-purple-200 text-purple-600 hover:text-purple-700 hover:border-purple-400 hover:bg-purple-50 transition-all w-full text-center"
                      >
                         {slot.start} (45')
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Giờ bắt đầu <span className="text-danger-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value;
                    let newEndTime = formData.endTime;
                    if (newStartTime) {
                      const [hours, mins] = newStartTime.split(':').map(Number);
                      const date = new Date();
                      date.setHours(hours, mins + 45);
                      newEndTime = date.toTimeString().slice(0, 5);
                    }
                    setFormData({ ...formData, startTime: newStartTime, endTime: newEndTime });
                  }}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Giờ kết thúc <span className="text-danger-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Link meeting
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Ghi chú
              </label>
              <textarea
                rows={3}
                placeholder="Nội dung cần lưu ý..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-secondary-100">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700 border-transparent text-white"
              >
                Tạo lớp bổ trợ
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export const TestClassModal = ({ 
  show, 
  onClose, 
  formData, 
  setFormData, 
  subjects, // Changed from subjectLevels to subjects
  teachers,
  handleSubmit, 
  quickCreateData 
}) => {
  if (!show || !quickCreateData) return null;

  // Initialize with quickCreateData if empty
  React.useEffect(() => {
    if (show && quickCreateData) {
      // Logic to auto-fill teacher if quickCreateData has teacherId
      if (quickCreateData.teacherId && !formData.assignedTeacherId) { // If teacher provided and not yet set
         setFormData(prev => ({ ...prev, assignedTeacherId: quickCreateData.teacherId }));
      }
      // Auto-fill date
      if (quickCreateData.date && !formData.scheduledDate) {
        setFormData(prev => ({ ...prev, scheduledDate: quickCreateData.date }));
      }
    }
  }, [show, quickCreateData]);

  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-orange-50">
          <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Tạo lớp Test
          </h3>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-1 hover:bg-secondary-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tên lớp <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                placeholder="VD: TEST-CLASS-001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Môn học <span className="text-danger-500">*</span>
                </label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Ngày học <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                Thời gian học
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-secondary-500 mb-1 block">Bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => {
                       const newStartTime = e.target.value;
                       let newEndTime = formData.endTime;
                       if (newStartTime) {
                         const [hours, mins] = newStartTime.split(':').map(Number);
                         const date = new Date();
                         date.setHours(hours, mins + 60); // 1 hour duration
                         newEndTime = date.toTimeString().slice(0, 5);
                       }
                       setFormData({ ...formData, startTime: newStartTime, endTime: newEndTime });
                    }}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary-500 mb-1 block">Kết thúc</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Phân công giáo viên
              </label>
               <select
                value={formData.assignedTeacherId || ''}
                onChange={(e) => setFormData({ ...formData, assignedTeacherId: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option value="">🤖 Tự động phân công</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    👨‍🏫 {teacher.name}
                  </option>
                ))}
              </select>
               <p className="text-xs text-secondary-500 mt-1">
                Tuỳ chọn: Để trống để hệ thống tự động tìm giáo viên phù hợp.
              </p>
            </div>
            
             <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Link meeting
                </label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="https://..."
                />
             </div>

            <div className="flex gap-3 pt-4 border-t border-secondary-100">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 border-transparent text-white">
                Tạo lớp Test
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
