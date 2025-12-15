import React, { useState, useEffect } from 'react';
import { Plus, Zap, RefreshCw, Check, X, Eye, Edit, Trash2, AlertCircle, CheckCircle, Info, BookMarked, TrendingUp, Search, Filter, MoreVertical, Calendar, Clock, Layers } from 'lucide-react';
import { supplementaryClassesAPI, teachersAPI, subjectsAPI } from '../services/api';
import { format } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const SupplementaryClasses = () => {
  const [supplementaryClasses, setSupplementaryClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectLevels, setSubjectLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subjectLevelId: '',
    className: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    meetingLink: '',
    notes: '',
    assignedTeacherId: '',
  });
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Default to current month
  const [filterDateFrom, setFilterDateFrom] = useState(() => {
    const now = new Date();
    return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  });
  const [filterDateTo, setFilterDateTo] = useState(() => {
    const now = new Date();
    return format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
  });
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showAll, setShowAll] = useState(true);
  const [activeSubjectId, setActiveSubjectId] = useState('');

  // Auto hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog?.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterDateFrom, filterDateTo, showAll]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      if (filterDateFrom) {
        params.startDate = filterDateFrom;
      }
      
      if (filterDateTo) {
        params.endDate = filterDateTo;
      }
      
      if (!showAll) {
        params.limit = 50;
      }
      
      const [suppRes, teachersRes, subjectsRes, levelsRes] = await Promise.all([
        supplementaryClassesAPI.getAll(params),
        teachersAPI.getAll({ limit: 1000 }),
        subjectsAPI.getAll(),
        subjectsAPI.getAllLevels(),
      ]);

      setSupplementaryClasses(suppRes.data || []);
      setTeachers(teachersRes.data || []);
      setSubjects(subjectsRes.data || []);
      setSubjectLevels(levelsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmitWithAutoAssignment = async (e) => {
    e.preventDefault();
    try {
      setAutoAssigning(true);
      
      if (editingId) {
        const updateData = { ...formData };
        if (!updateData.assignedTeacherId || updateData.assignedTeacherId === '') {
          updateData.assignedTeacherId = null;
          updateData.status = 'pending';
        } else {
          updateData.status = 'pending';
        }
        
        await supplementaryClassesAPI.update(editingId, updateData);
        showNotification('Lớp bổ trợ đã được cập nhật thành công!', 'success');
      } else {
        const createData = { ...formData };
        if (!createData.assignedTeacherId || createData.assignedTeacherId === '') {
          createData.assignedTeacherId = null;
          delete createData.assignedTeacherId;
          
          const response = await supplementaryClassesAPI.createWithAssignment(createData);

          if (response.autoAssigned) {
            showNotification('Lớp bổ trợ đã được tạo và tự động phân công giáo viên thành công!', 'success');
          } else {
            showNotification('Lớp bổ trợ đã được tạo nhưng không tìm thấy giáo viên phù hợp. Vui lòng kiểm tra lại thời gian hoặc phân công thủ công.', 'warning');
          }
        } else {
          createData.status = 'pending';
          const response = await supplementaryClassesAPI.create(createData);
          showNotification('Lớp bổ trợ đã được tạo và phân công giáo viên thành công!', 'success');
        }
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving supplementary class:', error);
      if (error.message.includes('No suitable teacher found')) {
        showNotification('Không tìm thấy giáo viên phù hợp! Vui lòng kiểm tra lại thời gian hoặc phân công thủ công.', 'error');
      } else {
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      }
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleAutoAssign = async (id) => {
    showConfirm('Bạn có muốn tự động phân công giáo viên cho lớp này?', async () => {
      try {
        const response = await supplementaryClassesAPI.autoAssign(id);
        if (response.success && response.data) {
          setSupplementaryClasses(prev => 
            prev.map(sc => 
              sc._id === id 
                ? { ...sc, ...response.data, status: 'pending' }
                : sc
            )
          );
        }
        showNotification('Đã phân công giáo viên thành công!', 'success');
        setTimeout(() => loadData(), 1000);
      } catch (error) {
        console.error('Error auto-assigning:', error);
        if (error.message.includes('No suitable teacher found')) {
          showNotification('Không tìm thấy giáo viên phù hợp! Vui lòng phân công thủ công.', 'warning');
        } else {
          showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
        }
      }
    });
  };

  const handleReallocate = async (id) => {
    showConfirm('Bạn có muốn tái phân bổ giáo viên khác?', async () => {
      try {
        await supplementaryClassesAPI.reallocate(id);
        showNotification('Đã tái phân bổ giáo viên thành công!', 'success');
        loadData();
      } catch (error) {
        console.error('Error reallocating:', error);
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      }
    });
  };

  const handleMarkCompleted = async (id) => {
    try {
      await supplementaryClassesAPI.markCompleted(id);
      showNotification('Đã đánh dấu hoàn thành!', 'success');
      loadData();
    } catch (error) {
      console.error('Error marking completed:', error);
      showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Lý do hủy lớp:');
    if (!reason) return;

    try {
      await supplementaryClassesAPI.cancel(id, reason);
      showNotification('Đã hủy lớp bổ trợ!', 'success');
      loadData();
    } catch (error) {
      console.error('Error cancelling:', error);
      showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
    }
  };

  const handleEdit = (suppClass) => {
    setEditingId(suppClass._id);
    setActiveSubjectId(suppClass.subjectLevelId?.subjectId?._id || '');
    setFormData({
      subjectLevelId: suppClass.subjectLevelId?._id || '',
      className: suppClass.className || '',
      scheduledDate: format(new Date(suppClass.scheduledDate), 'yyyy-MM-dd'),
      startTime: suppClass.startTime || '',
      endTime: suppClass.endTime || '',
      reason: suppClass.reason || '',
      meetingLink: suppClass.meetingLink || '',
      notes: suppClass.notes || '',
      assignedTeacherId: suppClass.assignedTeacherId?._id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    showConfirm('Bạn có chắc chắn muốn xóa lớp bổ trợ này?', async () => {
      try {
        await supplementaryClassesAPI.delete(id);
        showNotification('Đã xóa lớp bổ trợ thành công!', 'success');
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      }
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      subjectLevelId: '',
      className: '',
      scheduledDate: '',
      startTime: '',
      endTime: '',
      reason: '',
      meetingLink: '',
      notes: '',
      assignedTeacherId: '',
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      assigned: 'primary',
      completed: 'success',
      cancelled: 'danger',
    };
    const labels = {
      pending: 'Chờ xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    
    // If status is 'assigned', treat as 'pending' for display
    const effectiveStatus = status === 'assigned' ? 'pending' : status;

    return (
      <Badge variant={variants[effectiveStatus] || 'neutral'}>
        {labels[effectiveStatus] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-secondary-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`
            max-w-md rounded-lg shadow-lg p-4 flex items-start gap-3 border-l-4
            ${notification.type === 'success' ? 'bg-white border-success-500' : ''}
            ${notification.type === 'error' ? 'bg-white border-danger-500' : ''}
            ${notification.type === 'warning' ? 'bg-white border-warning-500' : ''}
            ${notification.type === 'info' ? 'bg-white border-primary-500' : ''}
          `}>
            <div className="flex-shrink-0">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-success-600" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-danger-600" />}
              {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-warning-600" />}
              {notification.type === 'info' && <Info className="w-5 h-5 text-primary-600" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary-900">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4 animate-scale-up">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-warning-50 rounded-full">
                <AlertCircle className="w-6 h-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-secondary-900 mb-2">
                  Xác nhận
                </h3>
                <p className="text-sm text-secondary-600">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
              >
                Xác nhận
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Quản lý Lớp Bổ Trợ</h1>
          <p className="text-secondary-500 mt-1">Quản lý và phân công các lớp bổ trợ one-off</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm lớp bổ trợ
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500 uppercase tracking-wide font-semibold">Tổng lớp bổ trợ</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {supplementaryClasses.filter(sc => sc.status !== 'cancelled').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-danger-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500 uppercase tracking-wide font-semibold">Chưa có giáo viên</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {supplementaryClasses.filter(sc => !sc.assignedTeacherId && sc.status !== 'cancelled').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-danger-600" />
            </div>
          </div>
        </Card>

    

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500 uppercase tracking-wide font-semibold">Hoàn thành</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {supplementaryClasses.filter(sc => sc.status === 'completed').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filters & Table */}
      <Card noPadding className="overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-secondary-200 bg-white space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Chờ xử lý' },
              { key: 'completed', label: 'Hoàn thành' },
              { key: 'cancelled', label: 'Đã hủy' }
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setFilterStatus(status.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === status.key
                    ? 'bg-secondary-900 text-white shadow-md'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                {status.label}
                {filterStatus === status.key && (
                  <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                    {status.key === 'all' ? supplementaryClasses.length : 
                     status.key === 'pending' 
                       ? supplementaryClasses.filter(sc => sc.status === 'pending' || sc.status === 'assigned').length 
                       : supplementaryClasses.filter(sc => sc.status === status.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4 pt-4 border-t border-secondary-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-secondary-500" />
              <span className="text-sm font-medium text-secondary-700">Thời gian:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setFilterDateFrom(today);
                  setFilterDateTo(today);
                }}
                className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors"
              >
                Hôm nay
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const nextWeek = new Date(today);
                  nextWeek.setDate(today.getDate() + 7);
                  setFilterDateFrom(today.toISOString().split('T')[0]);
                  setFilterDateTo(nextWeek.toISOString().split('T')[0]);
                }}
                className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors"
              >
                7 ngày tới
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-3 py-1.5 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <span className="text-secondary-400">→</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-3 py-1.5 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              {(filterDateFrom || filterDateTo) && (
                <button
                  onClick={() => {
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
                  className="p-1.5 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Xóa bộ lọc"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-secondary-500">Hiển thị:</span>
              <button
                onClick={() => setShowAll(!showAll)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  showAll
                    ? 'bg-success-50 text-success-700 border border-success-200'
                    : 'bg-secondary-100 text-secondary-600 border border-secondary-200'
                }`}
              >
                {showAll ? 'Tất cả' : '50 dòng'}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Thông tin lớp học
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Giáo viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
            {supplementaryClasses.map((suppClass) => (
              <tr key={suppClass._id} className="hover:bg-secondary-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-secondary-700">
                          {suppClass.subjectLevelId?.subjectId?.code || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-secondary-900">
                          {suppClass.subjectLevelId?.subjectId?.name || 'Chưa có môn học'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-wider rounded">
                          HP{suppClass.subjectLevelId?.semester || '?'}
                        </span>
                      </div>
                      <div className="text-sm text-secondary-600 mb-1 font-mono">
                        {suppClass.className}
                      </div>
                      {suppClass.reason && (
                        <div className="text-xs text-secondary-500 mt-1 line-clamp-1 italic">
                          "{suppClass.reason}"
                        </div>
                      )}
                      {suppClass.meetingLink && (
                        <div className="mt-1">
                          <a 
                            href={suppClass.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
                          >
                            Link học online →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center text-sm font-medium text-secondary-900">
                      <Calendar className="w-4 h-4 mr-2 text-secondary-400" />
                      {format(new Date(suppClass.scheduledDate), 'dd/MM/yyyy')}
                    </div>
                    <div className="flex items-center text-sm text-secondary-600">
                      <Clock className="w-4 h-4 mr-2 text-secondary-400" />
                      {suppClass.startTime} - {suppClass.endTime}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {suppClass.assignedTeacherId ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                        <span className="text-primary-700 text-xs font-bold">
                          {suppClass.assignedTeacherId.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-secondary-900 truncate">
                          {suppClass.assignedTeacherId.name}
                        </div>
                        <div className="text-xs text-secondary-500 truncate">
                          {suppClass.assignedTeacherId.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-danger-50 border border-danger-100 rounded text-danger-700">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs font-medium">Chưa có GV</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-secondary-600 max-w-xs">
                    {suppClass.notes ? (
                      <p className="line-clamp-2">{suppClass.notes}</p>
                    ) : (
                      <span className="text-secondary-400 italic text-xs">Không có ghi chú</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(suppClass.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Edit */}
                    {(suppClass.status === 'pending' || suppClass.status === 'assigned') && (
                      <button
                        onClick={() => handleEdit(suppClass)}
                        className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Auto-assign */}
                    {suppClass.status === 'pending' && !suppClass.assignedTeacherId && (
                      <button
                        onClick={() => handleAutoAssign(suppClass._id)}
                        className="p-1.5 text-secondary-500 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                        title="Tự động phân công"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Reallocate & Complete */}
                    {(suppClass.status === 'assigned' || (suppClass.status === 'pending' && suppClass.assignedTeacherId)) && (
                      <>
                        <button
                          onClick={() => handleReallocate(suppClass._id)}
                          className="p-1.5 text-secondary-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Tái phân bổ"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMarkCompleted(suppClass._id)}
                          className="p-1.5 text-secondary-500 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                          title="Hoàn thành"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {/* Cancel */}
                    {(suppClass.status === 'pending' || suppClass.status === 'assigned') && (
                      <button
                        onClick={() => handleCancel(suppClass._id)}
                        className="p-1.5 text-secondary-500 hover:text-warning-600 hover:bg-warning-50 rounded transition-colors"
                        title="Hủy lớp"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Delete */}
                    {(suppClass.status === 'cancelled' || suppClass.status === 'completed') && (
                      <button
                        onClick={() => handleDelete(suppClass._id)}
                        className="p-1.5 text-secondary-500 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>

          {supplementaryClasses.length === 0 && (
            <div className="text-center py-12 bg-white">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookMarked className="w-8 h-8 text-secondary-400" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900">Chưa có lớp bổ trợ nào</h3>
              <p className="text-secondary-500 mt-1">Tạo lớp mới hoặc thay đổi bộ lọc để xem thêm.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-secondary-900/75 backdrop-blur-sm" onClick={handleCloseModal}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-secondary-900">
                    {editingId ? 'Chỉnh sửa lớp bổ trợ' : 'Tạo lớp bổ trợ mới'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmitWithAutoAssignment} className="space-y-6">
                  {/* Class Name */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Tên lớp <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      placeholder="VD: SUP-CLASS-001"
                    />
                  </div>

                  {/* Subject & Date Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
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
                        Học phần <span className="text-danger-500">*</span>
                      </label>
                      <select
                          required
                          value={formData.subjectLevelId}
                          onChange={(e) => setFormData({ ...formData, subjectLevelId: e.target.value })}
                          disabled={!activeSubjectId}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">-- Chọn học phần --</option>
                          {subjectLevels
                            .filter(l => l.subjectId?._id === activeSubjectId)
                            .map((level) => (
                              <option key={level._id} value={level._id}>
                                {level.subjectId?.name} - HP {level.semester}
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
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Time Section */}
                  <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                    <label className="block text-sm font-medium text-secondary-700 mb-3">
                      Thời gian học
                    </label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="time"
                          required
                          value={formData.startTime}
                          onChange={(e) => {
                            const newStartTime = e.target.value;
                            // Auto calculate end time (+45 mins)
                            let newEndTime = formData.endTime;
                             if (newStartTime) {
                              const [hours, mins] = newStartTime.split(':').map(Number);
                              const date = new Date();
                              date.setHours(hours, mins + 45);
                              newEndTime = date.toTimeString().slice(0, 5);
                            }
                            setFormData({ ...formData, startTime: newStartTime, endTime: newEndTime });
                          }}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          required
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Teacher Assignment */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Phân công giáo viên
                    </label>
                    <div className="space-y-2">
                      <select
                        value={formData.assignedTeacherId || ''}
                        onChange={(e) => setFormData({ ...formData, assignedTeacherId: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      >
                        <option value="">🤖 Tự động phân công (khuyến nghị)</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            👨‍🏫 {teacher.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-primary-600 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Hệ thống sẽ tự động chọn giáo viên phù hợp nhất nếu để trống
                      </p>
                    </div>
                  </div>

                  {/* Additional Info (Collapsible) */}
                  <div className="border-t border-secondary-100 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('advanced-section');
                        el.classList.toggle('hidden');
                      }}
                      className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium"
                    >
                      <span>Tùy chọn nâng cao</span>
                      <span className="text-xs">▼</span>
                    </button>
                    
                    <div id="advanced-section" className="hidden mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Link meeting
                        </label>
                        <input
                          type="url"
                          value={formData.meetingLink}
                          onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                          placeholder="https://meet.google.com/..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Lý do
                        </label>
                        <input
                          type="text"
                          value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                          placeholder="VD: Lớp tăng cường..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Ghi chú
                        </label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows="2"
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4 border-t border-secondary-100">
                    <Button
                      variant="secondary"
                      onClick={handleCloseModal}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={autoAssigning || (formData.startTime && formData.endTime && formData.startTime >= formData.endTime)}
                      isLoading={autoAssigning}
                      className="flex-1"
                    >
                      {editingId ? 'Cập nhật' : 'Tạo & Phân công'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplementaryClasses;
