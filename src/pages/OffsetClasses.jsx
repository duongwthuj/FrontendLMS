import React, { useState, useEffect } from 'react';
import { Plus, Zap, RefreshCw, Check, X, Eye, Edit, Trash2, AlertCircle, CheckCircle, Info, BookMarked, TrendingUp, Search, Filter, MoreVertical, Calendar, Clock, RotateCcw } from 'lucide-react';
import { offsetClassesAPI, teachersAPI, subjectsAPI, googleSheetsAPI } from '../services/api';
import { format } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const OffsetClasses = () => {
  const [offsetClasses, setOffsetClasses] = useState([]);
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
    externalTeacher: { name: '', email: '' }
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('');
  
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
  const [showSyncModal, setShowSyncModal] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [groupByEmail, setGroupByEmail] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  
  // Weekly Duty Generation State
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [dutyType, setDutyType] = useState('TYPE_1');
  const [dutyDateRange, setDutyDateRange] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
  });
  const [isExternalTeacher, setIsExternalTeacher] = useState(false);

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
  }, [filterStatus, filterDateFrom, filterDateTo, filterTeacher, showAll]);

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
      
      if (filterTeacher) {
        params.teacherId = filterTeacher;
      }
      
      if (!showAll) {
        params.limit = 50;
      }
      
      const [offsetRes, teachersRes, subjectsRes, levelsRes] = await Promise.all([
        offsetClassesAPI.getAll(params),
        teachersAPI.getAll({ limit: 1000 }),
        subjectsAPI.getAll(),
        subjectsAPI.getAllLevels(),
      ]);

      setOffsetClasses(offsetRes.data || []);
      setTeachers(teachersRes.data || []);
      setSubjects(subjectsRes.data || []);
      setSubjectLevels(levelsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleGenerateDuty = async () => {
    try {
      setLoading(true);
      await offsetClassesAPI.weeklyDuty({
        fromDate: dutyDateRange.fromDate,
        toDate: dutyDateRange.toDate,
        type: dutyType
      });
      
      // Close modal and refresh
      setShowDutyModal(false);
      loadData();
      
      // Show success message (you might want to add a toast notification system here)
      showNotification('Tạo lịch trực thành công!', 'success');
      
    } catch (error) {
      console.error('Error generating duty:', error);
      showNotification('Lỗi tạo lịch trực: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleAutoAssign = async (id) => {
    showConfirm('Bạn có muốn tự động phân công giáo viên cho lớp này?', async () => {
      try {
        const response = await offsetClassesAPI.autoAssign(id);
        if (response.success && response.data) {
          setOffsetClasses(prev => 
            prev.map(oc => 
              oc._id === id 
                ? { ...oc, ...response.data, status: 'assigned' }
                : oc
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

  const handleAutoAssignAll = async () => {
    const pendingClasses = offsetClasses.filter(
      oc => oc.status === 'pending' && !oc.assignedTeacherId
    );

    if (pendingClasses.length === 0) {
      showNotification('Không có lớp nào cần phân công!', 'info');
      return;
    }

    showConfirm(`Bạn có muốn tự động phân công ${pendingClasses.length} lớp đang chờ xử lý?`, async () => {
      setAutoAssigning(true);
      let successCount = 0;
      let failCount = 0;

      try {
        for (const offsetClass of pendingClasses) {
          try {
            await offsetClassesAPI.autoAssign(offsetClass._id);
            successCount++;
          } catch (error) {
            console.error(`Failed to assign class ${offsetClass._id}:`, error);
            failCount++;
          }
        }

        const message = `Hoàn tất! Thành công: ${successCount} lớp, Thất bại: ${failCount} lớp`;
        showNotification(message, failCount === 0 ? 'success' : 'warning');
        loadData();
      } catch (error) {
        console.error('Error in auto assign all:', error);
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      } finally {
        setAutoAssigning(false);
      }
    });
  };

  const handleReallocate = async (id) => {
    showConfirm('Bạn có muốn tái phân bổ giáo viên khác?', async () => {
      try {
        await offsetClassesAPI.reallocate(id);
        showNotification('Đã tái phân bổ giáo viên thành công!', 'success');
        loadData();
      } catch (error) {
        console.error('Error reallocating:', error);
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      }
    });
  };

  const handleRevertToPending = async (id) => {
    showConfirm('Bạn có chắc chắn muốn đưa lớp này về trạng thái chờ xử lý? Giáo viên hiện tại sẽ bị hủy phân công.', async () => {
      try {
        await offsetClassesAPI.revertToPending(id);
        showNotification('Đã chuyển về trạng thái chờ xử lý!', 'success');
        loadData();
      } catch (error) {
        console.error('Error reverting to pending:', error);
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      }
    });
  };

  const handleBulkRevert = async (classIds) => {
    if (classIds.length === 0) return;
    
    showConfirm(
      `Bạn có chắc muốn đưa ${classIds.length} lớp về trạng thái chờ xử lý?`,
      async () => {
        try {
          let successCount = 0;
          let failCount = 0;
          
          for (const id of classIds) {
            try {
              await offsetClassesAPI.revertToPending(id);
              successCount++;
            } catch (error) {
              failCount++;
              console.error(`Failed to revert ${id}:`, error);
            }
          }
          
          showNotification(
            `Đã rollback ${successCount} lớp thành công${failCount > 0 ? `, ${failCount} lớp thất bại` : ''}`,
            failCount === 0 ? 'success' : 'warning'
          );
          
          await loadData();
          setSelectedClasses(new Set());
        } catch (error) {
          showNotification('Có lỗi xảy ra khi rollback hàng loạt', 'error');
        }
      }
    );
  };


  const handleMarkCompleted = async (id) => {
    try {
      await offsetClassesAPI.markCompleted(id);
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
      await offsetClassesAPI.cancel(id, reason);
      showNotification('Đã hủy lớp offset!', 'success');
      loadData();
    } catch (error) {
      console.error('Error cancelling:', error);
      showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
    }
  };

  const handleEdit = (offsetClass) => {
    if (offsetClass) {
      setEditingId(offsetClass._id);
      setActiveSubjectId(offsetClass.subjectLevelId?.subjectId?._id || '');
      
      const isExternal = !offsetClass.assignedTeacherId && !!offsetClass.externalTeacher?.name;
      setIsExternalTeacher(isExternal);

      setFormData({
        className: offsetClass.className || '',
        subjectLevelId: offsetClass.subjectLevelId?._id || '',
        scheduledDate: offsetClass.scheduledDate ? format(new Date(offsetClass.scheduledDate), 'yyyy-MM-dd') : '',
        startTime: offsetClass.startTime || '',
        endTime: offsetClass.endTime || '',
        reason: offsetClass.reason || '',
        meetingLink: offsetClass.meetingLink || '',
        notes: offsetClass.notes || '',
        assignedTeacherId: offsetClass.assignedTeacherId?._id || '',
        externalTeacher: offsetClass.externalTeacher || { name: '', email: '' }
      });
      setShowModal(true);
    }
  };

  const handleDelete = async (id) => {
    showConfirm('Bạn có chắc chắn muốn xóa lớp offset này?', async () => {
      try {
        await offsetClassesAPI.delete(id);
        showNotification('Đã xóa lớp offset thành công!', 'success');
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
    setIsExternalTeacher(false);
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
      externalTeacher: { name: '', email: '' }
    });
  };

  const handleSyncFromGoogleSheets = async () => {
    try {
      setSyncing(true);
      const response = await googleSheetsAPI.sync();
      showNotification(`Đồng bộ thành công! ${response.message || ''}`, 'success');
      loadData();
      setShowSyncModal(false);
    } catch (error) {
      console.error('Error syncing from Google Sheets:', error);
      showNotification(`Lỗi đồng bộ: ${error.message}`, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmitWithAutoAssignment = async (e) => {
    e.preventDefault();
    try {
      // Validation
      if (!formData.subjectLevelId || !formData.className || !formData.scheduledDate || !formData.startTime || !formData.endTime) {
         showNotification('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'error');
         return;
      }
      
      setAutoAssigning(true);

      const payload = { ...formData };
      
      if (isExternalTeacher) {
          if (!payload.externalTeacher.name || !payload.externalTeacher.email) {
              showNotification('Vui lòng nhập tên và email giáo viên ngoài', 'error');
              setAutoAssigning(false);
              return;
          }
          payload.assignedTeacherId = null; 
      } else {
          payload.externalTeacher = undefined;
          if (!payload.assignedTeacherId) payload.assignedTeacherId = undefined; 
      }

      if (editingId) {
        await offsetClassesAPI.update(editingId, payload);
        showNotification('Cập nhật thành công', 'success');
      } else {
        const res = await offsetClassesAPI.createWithAssignment(payload);
        
        if (res.autoAssigned) {
          showNotification('Đã tạo và tự động phân công!', 'success');
        } else if (payload.externalTeacher) {
           showNotification('Đã tạo và phân công giáo viên ngoài!', 'success');
        } else if (payload.assignedTeacherId) {
          showNotification('Đã tạo và phân công giáo viên!', 'success');
        } else {
          showNotification('Đã tạo lớp (chưa tìm được GV phù hợp)', 'warning');
        }
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving offset class:', error);
      showNotification(`Lỗi: ${error.message}`, 'error');
    } finally {
      setAutoAssigning(false);
    }
  };

  // Toggle all classes in a group
  const toggleGroupSelection = (classes) => {
    const classIds = classes.map(c => c._id);
    const newSelected = new Set(selectedClasses);
    
    // Placeholder to ensure I read the file first before replacing blindly.
// I will use `view_file` to find the Action Menu part.
    const allSelected = classIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      // Deselect all
      classIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all
      classIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedClasses(newSelected);
  };

  // Check if all classes in group are selected
  const isGroupFullySelected = (classes) => {
    return classes.length > 0 && classes.every(c => selectedClasses.has(c._id));
  };

  // Bulk auto-assign for selected classes
  const handleBulkAutoAssign = async (classIds) => {
    if (classIds.length === 0) return;
    
    showConfirm(
      `Bạn có chắc muốn tự động phân công ${classIds.length} lớp?`,
      async () => {
        setAutoAssigning(true);
        try {
          let successCount = 0;
          let failCount = 0;
          
          for (const id of classIds) {
            try {
              await offsetClassesAPI.autoAssign(id);
              successCount++;
            } catch (error) {
              failCount++;
              console.error(`Failed to auto-assign ${id}:`, error);
            }
          }
          
          showNotification(
            `Đã phân công ${successCount} lớp thành công${failCount > 0 ? `, ${failCount} lớp thất bại` : ''}`,
            failCount === 0 ? 'success' : 'warning'
          );
          
          await loadData();
          setSelectedClasses(new Set());
        } catch (error) {
          showNotification('Có lỗi xảy ra khi phân công hàng loạt', 'error');
        } finally {
          setAutoAssigning(false);
        }
      }
    );
  };

  // Bulk complete for selected classes
  const handleBulkComplete = async (classIds) => {
    if (classIds.length === 0) return;
    
    showConfirm(
      `Bạn có chắc muốn đánh dấu hoàn thành ${classIds.length} lớp?`,
      async () => {
        try {
          const response = await offsetClassesAPI.bulkComplete(classIds);
          
          showNotification(
            response.message || `Đã hoàn thành ${response.successCount} lớp${response.failCount > 0 ? `, ${response.failCount} lớp thất bại` : ''}`,
            response.failCount === 0 ? 'success' : 'warning'
          );
          
          await loadData();
          setSelectedClasses(new Set());
        } catch (error) {
          showNotification('Có lỗi xảy ra khi hoàn thành hàng loạt', 'error');
        }
      }
    );
  };

  // Bulk delete for selected classes
  const handleBulkDelete = async (classIds) => {
    if (classIds.length === 0) return;
    
    showConfirm(
      `Bạn có chắc muốn xóa ${classIds.length} lớp? Hành động này không thể hoàn tác!`,
      async () => {
        try {
          const response = await offsetClassesAPI.bulkDelete(classIds);
          
          showNotification(
            response.message || `Đã xóa ${response.successCount} lớp${response.failCount > 0 ? `, ${response.failCount} lớp thất bại` : ''}`,
            response.failCount === 0 ? 'success' : 'warning'
          );
          
          await loadData();
          setSelectedClasses(new Set());
        } catch (error) {
          showNotification('Có lỗi xảy ra khi xóa hàng loạt', 'error');
        }
      }
    );
  };

  // Bulk cancel for selected classes
  const handleBulkCancel = async (classIds) => {
    if (classIds.length === 0) return;
    
    showConfirm(
      `Bạn có chắc muốn hủy ${classIds.length} lớp?`,
      async () => {
        try {
          let successCount = 0;
          let failCount = 0;
          
          for (const id of classIds) {
            try {
              await offsetClassesAPI.cancel(id);
              successCount++;
            } catch (error) {
              failCount++;
              console.error(`Failed to cancel ${id}:`, error);
            }
          }
          
          showNotification(
            `Đã hủy ${successCount} lớp${failCount > 0 ? `, ${failCount} lớp thất bại` : ''}`,
            failCount === 0 ? 'success' : 'warning'
          );
          
          await loadData();
          setSelectedClasses(new Set());
        } catch (error) {
          showNotification('Có lỗi xảy ra khi hủy hàng loạt', 'error');
        }
      }
    );
  };


  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      assigned: 'primary',
      completed: 'success',
      cancelled: 'danger',
      rejected: 'neutral', // or a specific variant for rejected
    };
    const labels = {
      pending: 'Chờ xử lý',
      assigned: 'Đã phân công',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      rejected: 'Đã từ chối',
    };
    
    return (
      <Badge variant={variants[status] || 'neutral'}>
        {labels[status] || status}
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

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4 animate-scale-up">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-green-50 rounded-full">
                <RefreshCw className={`w-6 h-6 text-green-600 ${syncing ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-secondary-900 mb-2">
                  Đồng bộ từ Google Sheets
                </h3>
                <p className="text-sm text-secondary-600">
                  Đồng bộ dữ liệu lớp offset từ Google Sheets. Quá trình này có thể mất vài giây.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowSyncModal(false)}
                disabled={syncing}
              >
                Hủy
              </Button>
              <Button
                variant="success"
                onClick={handleSyncFromGoogleSheets}
                disabled={syncing}
                isLoading={syncing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Quản lý Lớp Offset</h1>
          <p className="text-secondary-500 mt-1">Quản lý và phân công lớp bù</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm lớp offset
          </Button>

          <Button
            onClick={() => setShowDutyModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Tạo lịch trực
          </Button>

          <Button
            variant="success"
            onClick={handleAutoAssignAll}
            disabled={autoAssigning || !offsetClasses.some(oc => oc.status === 'pending' && !oc.assignedTeacherId)}
            isLoading={autoAssigning}
          >
            <Zap className="w-4 h-4 mr-2" />
            Tự động phân công tất cả
          </Button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedClasses.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-2xl border border-secondary-200 p-2 pl-6 pr-2 flex items-center gap-6 z-40 animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="bg-secondary-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedClasses.size}
            </span>
            <span className="text-sm font-medium text-secondary-600">Lớp được chọn</span>
          </div>
          
          <div className="h-4 w-px bg-secondary-300"></div>
          
          <div className="flex items-center gap-2">
            {/* Show different buttons based on filterStatus */}
            {filterStatus === 'completed' ? (
              // Rollback button for completed only
              <button
                onClick={() => handleBulkRevert(Array.from(selectedClasses))}
                className="p-2 hover:bg-warning-50 text-warning-600 rounded-full transition-colors flex items-center gap-2 group"
                title="Rollback về chờ xử lý"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="sr-only group-hover:not-sr-only text-sm font-medium pr-1">Rollback</span>
              </button>
            ) : filterStatus === 'cancelled' || filterStatus === 'rejected' ? (
              // Rollback (uncancel) button for cancelled/rejected
              <button
                onClick={() => handleBulkRevert(Array.from(selectedClasses))}
                className="p-2 hover:bg-success-50 text-success-600 rounded-full transition-colors flex items-center gap-2 group"
                title="Không hủy - đưa về chờ xử lý"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="sr-only group-hover:not-sr-only text-sm font-medium pr-1">Không hủy</span>
              </button>
            ) : (
              // Normal buttons for pending/assigned/all
              <>
                <button
                  onClick={() => handleBulkAutoAssign(Array.from(selectedClasses))}
                  className="p-2 hover:bg-success-50 text-success-600 rounded-full transition-colors flex items-center gap-2 group"
                  title="Phân công tự động"
                >
                  <Zap className="w-5 h-5" />
                  <span className="sr-only group-hover:not-sr-only text-sm font-medium pr-1">Phân công</span>
                </button>
                
                <button
                  onClick={() => handleBulkComplete(Array.from(selectedClasses))}
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors flex items-center gap-2 group"
                  title="Đánh dấu hoàn thành"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="sr-only group-hover:not-sr-only text-sm font-medium pr-1">Hoàn thành</span>
                </button>
              </>
            )}
            
            {/* Delete button - always show */}
            <button
              onClick={() => handleBulkDelete(Array.from(selectedClasses))}
              className="p-2 hover:bg-danger-50 text-danger-600 rounded-full transition-colors flex items-center gap-2 group"
              title="Xóa"
            >
              <Trash2 className="w-5 h-5" />
              <span className="sr-only group-hover:not-sr-only text-sm font-medium pr-1">Xóa</span>
            </button>
            
            {/* Cancel selection - always show */}
            <button
              onClick={() => setSelectedClasses(new Set())}
              className="p-2 hover:bg-secondary-100 text-secondary-500 rounded-full transition-colors"
              title="Hủy chọn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500 uppercase tracking-wide font-semibold">Tổng lớp offset</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {offsetClasses.filter(oc => oc.status !== 'cancelled').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-danger-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500 uppercase tracking-wide font-semibold">Chưa có giáo viên</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {offsetClasses.filter(oc => !oc.assignedTeacherId && oc.status !== 'cancelled').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-success-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500 uppercase tracking-wide font-semibold">Đã phân công</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {offsetClasses.filter(oc => oc.status === 'assigned').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500 uppercase tracking-wide font-semibold">Hoàn thành</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {offsetClasses.filter(oc => oc.status === 'completed').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card className="p-4 bg-secondary-50 border-secondary-200">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-secondary-700 mr-2">Tạo nhanh:</span>
          
          <button
            onClick={() => {
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);
              setFormData({
                ...formData,
                scheduledDate: tomorrow.toISOString().split('T')[0],
                startTime: '19:30',
                endTime: '21:00'
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors shadow-sm"
          >
            ⚡ Lớp tối mai 19h30
          </button>
          
          <button
            onClick={() => {
              const today = new Date();
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);
              setFormData({
                ...formData,
                scheduledDate: nextWeek.toISOString().split('T')[0],
                startTime: '13:30',
                endTime: '15:00'
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors shadow-sm"
          >
            📅 Tuần sau chiều
          </button>
          
          <div className="h-6 w-px bg-secondary-300 mx-2"></div>
          
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Làm mới
          </button>

          <div className="h-6 w-px bg-secondary-300 mx-2"></div>

          <button
            onClick={() => setShowSyncModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
          >
            📥 Đồng bộ từ Google Sheets
          </button>
        </div>
      </Card>

      {/* Filters & Table */}
      <Card noPadding className="overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-secondary-200 bg-white space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Chờ xử lý' },
              { key: 'assigned', label: 'Đã phân công' },
              { key: 'completed', label: 'Hoàn thành' },
              { key: 'cancelled', label: 'Đã hủy' },
              { key: 'rejected', label: 'Đã từ chối' }
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
                    {status.key === 'all' ? offsetClasses.length : 
                     offsetClasses.filter(oc => oc.status === status.key).length}
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

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary-700">Giáo viên:</span>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="px-3 py-1.5 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-w-[180px]"
              >
                <option value="">Tất cả giáo viên</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {filterTeacher && (
                <button
                  onClick={() => setFilterTeacher('')}
                  className="p-1.5 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Xóa bộ lọc giáo viên"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-2 mr-4">
                <input
                  type="checkbox"
                  id="groupByEmail"
                  checked={groupByEmail}
                  onChange={(e) => setGroupByEmail(e.target.checked)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="groupByEmail" className="text-sm text-secondary-700 cursor-pointer select-none">
                  Gom nhóm theo yêu cầu (Cells)
                </label>
              </div>

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
                <th className="px-6 py-3 text-left">
                  <input 
                    type="checkbox" 
                    checked={offsetClasses.length > 0 && selectedClasses.size === offsetClasses.length}
                    onChange={() => {
                      if (selectedClasses.size === offsetClasses.length && offsetClasses.length > 0) {
                        setSelectedClasses(new Set());
                      } else {
                        setSelectedClasses(new Set(offsetClasses.map(oc => oc._id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </th>
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
            {groupByEmail ? (
              // Grouped view
              Object.entries(
                offsetClasses.reduce((groups, offsetClass) => {
                  // Group by Email + SentTime to identify specific requests (cells)
                  // key format: email|timestamp
                  const email = offsetClass.studentEmail ? offsetClass.studentEmail.toLowerCase().trim() : 'others';
                  const timestamp = offsetClass.emailSentTime 
                    ? new Date(offsetClass.emailSentTime).toISOString() 
                    : 'manual';
                  
                  const key = `${email}:::${timestamp}`;

                  if (!groups[key]) {
                    groups[key] = [];
                  }
                  groups[key].push(offsetClass);
                  return groups;
                }, {})
              ).sort((a, b) => {
                 const [keyA, classesA] = a;
                 const [keyB, classesB] = b;
                 
                 // Sort 'Khác' to the bottom
                 if (keyA === 'Khác') return 1;
                 if (keyB === 'Khác') return -1;
                 
                 // Sort by date (newest first) based on scheduledDate of the first class in group
                 const dateA = new Date(classesA[0]?.scheduledDate || 0);
                 const dateB = new Date(classesB[0]?.scheduledDate || 0);
                 return dateB - dateA;
              }).map(([groupKey, classes]) => {
                const isCompositeKey = groupKey.includes(':::');
                const rawEmail = isCompositeKey ? groupKey.split(':::')[0] : groupKey;
                const email = rawEmail === 'others' ? 'Khác' : rawEmail;
                
                const rawTime = isCompositeKey ? groupKey.split(':::')[1] : null;
                const sentTime = rawTime !== 'manual' ? rawTime : null;
                
                return (
                <React.Fragment key={groupKey}>
                  {/* Spacing row for visual separation */}
                  <tr className="h-4 bg-secondary-50">
                    <td colSpan="7" className="border-b-4 border-secondary-300"></td>
                  </tr>
                  
                  <tr className="bg-gradient-to-r from-secondary-200 to-secondary-100 border-y-2 border-secondary-300 shadow-sm">
                    <td colSpan="7" className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        {/* Left side: Email info with checkbox */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isGroupFullySelected(classes)}
                            onChange={() => toggleGroupSelection(classes)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            title="Chọn tất cả lớp trong nhóm"
                          />
                          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                            <span className="text-2xl">📧</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-secondary-900 text-base">
                                 {email}
                               </span>
                               <span className="px-2.5 py-1 rounded-full bg-blue-500 text-white text-xs font-bold shadow-sm">
                                 {classes.length} lớp
                               </span>
                            </div>
                            {sentTime && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-secondary-500">
                                <Clock className="w-3 h-3" />
                                <span>Gửi lúc: {format(new Date(sentTime), 'HH:mm dd/MM/yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>


                  {classes.map((offsetClass) => {
                    const isToday = new Date(offsetClass.scheduledDate).toDateString() === new Date().toDateString();
                    const statusColors = {
                      pending: 'border-l-4 border-l-yellow-400 bg-yellow-50/30',
                      assigned: 'border-l-4 border-l-blue-500 bg-blue-50/30',
                      completed: 'border-l-4 border-l-green-500 bg-green-50/30',
                      cancelled: 'border-l-4 border-l-gray-400 bg-gray-50/30'
                    };
                    const pulseClass = isToday ? 'animate-pulse' : '';
                    
                    return (
                    <tr key={offsetClass._id} className={`hover:bg-secondary-100 transition-all ${statusColors[offsetClass.status] || ''} ${pulseClass}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedClasses.has(offsetClass._id)}
                          onChange={() => {
                            const newSelected = new Set(selectedClasses);
                            if (newSelected.has(offsetClass._id)) {
                              newSelected.delete(offsetClass._id);
                            } else {
                              newSelected.add(offsetClass._id);
                            }
                            setSelectedClasses(newSelected);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-secondary-700">
                                {offsetClass.subjectLevelId?.subjectId?.code || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-secondary-900">
                                {offsetClass.subjectLevelId?.subjectId?.name || 'Chưa có môn học'}
                              </span>
                              <span className="px-1.5 py-0.5 bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-wider rounded">
                                HP{offsetClass.subjectLevelId?.semester || '?'}
                              </span>
                            </div>
                            <div className="text-sm text-secondary-600 mb-1 font-mono">
                              {offsetClass.className}
                            </div>
                            {offsetClass.reason && (
                              <div className="text-xs text-secondary-500 mt-1 line-clamp-1 italic">
                                "{offsetClass.reason}"
                              </div>
                            )}
                            {offsetClass.meetingLink && (
                              <div className="mt-1">
                                <a 
                                  href={offsetClass.meetingLink} 
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
                            {format(new Date(offsetClass.scheduledDate), 'dd/MM/yyyy')}
                          </div>
                          <div className="flex items-center text-sm text-secondary-600">
                            <Clock className="w-4 h-4 mr-2 text-secondary-400" />
                            {offsetClass.startTime} - {offsetClass.endTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {offsetClass.assignedTeacherId ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                              <span className="text-primary-700 text-xs font-bold">
                                {offsetClass.assignedTeacherId.name?.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-secondary-900 truncate">
                                {offsetClass.assignedTeacherId.name}
                              </div>
                              <div className="text-xs text-secondary-500 truncate">
                                {offsetClass.assignedTeacherId.email}
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
                          {offsetClass.notes ? (
                            <p className="line-clamp-2">{offsetClass.notes}</p>
                          ) : (
                            <span className="text-secondary-400 italic text-xs">Không có ghi chú</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(offsetClass.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          {(offsetClass.status === 'pending' || offsetClass.status === 'assigned' || offsetClass.status === 'completed' || offsetClass.status === 'rejected') && (
                            <button
                              onClick={() => handleEdit(offsetClass)}
                              className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Auto-assign */}
                          {offsetClass.status === 'pending' && !offsetClass.assignedTeacherId && (
                            <button
                              onClick={() => handleAutoAssign(offsetClass._id)}
                              className="p-1.5 text-secondary-500 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                              title="Tự động phân công"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          )}

                          {/* Rejected Actions: Move back to pending */}
                          {offsetClass.status === 'rejected' && (
                            <button
                              onClick={() => handleRevertToPending(offsetClass._id)}
                              className="p-1.5 text-secondary-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Đưa vào chờ xử lý"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Reallocate & Complete */}
                          {offsetClass.status === 'assigned' && (
                            <>
                              <button
                                onClick={() => handleReallocate(offsetClass._id)}
                                className="p-1.5 text-secondary-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Tái phân bổ"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRevertToPending(offsetClass._id)}
                                className="p-1.5 text-secondary-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Về chờ xử lý"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMarkCompleted(offsetClass._id)}
                                className="p-1.5 text-secondary-500 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                                title="Hoàn thành"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {/* Cancel */}
                          {(offsetClass.status === 'pending' || offsetClass.status === 'assigned') && (
                            <button
                              onClick={() => handleCancel(offsetClass._id)}
                              className="p-1.5 text-secondary-500 hover:text-warning-600 hover:bg-warning-50 rounded transition-colors"
                              title="Hủy lớp"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Delete */}
                          {(offsetClass.status === 'cancelled' || offsetClass.status === 'completed' || offsetClass.status === 'rejected') && (
                            <button
                              onClick={() => handleDelete(offsetClass._id)}
                              className="p-1.5 text-secondary-500 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </React.Fragment>
                );
              })
            ) : (
              // Standard View
              offsetClasses.map((offsetClass) => {
                const isToday = new Date(offsetClass.scheduledDate).toDateString() === new Date().toDateString();
                const statusColors = {
                  pending: 'border-l-4 border-l-yellow-400 bg-yellow-50/30',
                  assigned: 'border-l-4 border-l-blue-500 bg-blue-50/30',
                  completed: 'border-l-4 border-l-green-500 bg-green-50/30',
                  cancelled: 'border-l-4 border-l-gray-400 bg-gray-50/30'
                };
                const pulseClass = isToday ? 'animate-pulse' : '';
                
                return (
                <tr key={offsetClass._id} className={`hover:bg-secondary-100 transition-all ${statusColors[offsetClass.status] || ''} ${pulseClass}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedClasses.has(offsetClass._id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedClasses);
                        if (e.target.checked) {
                          newSelected.add(offsetClass._id);
                        } else {
                          newSelected.delete(offsetClass._id);
                        }
                        setSelectedClasses(newSelected);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-secondary-700">
                            {offsetClass.subjectLevelId?.subjectId?.code || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-secondary-900">
                            {offsetClass.subjectLevelId?.subjectId?.name || 'Chưa có môn học'}
                          </span>
                          <span className="px-1.5 py-0.5 bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-wider rounded">
                            HP{offsetClass.subjectLevelId?.semester || '?'}
                          </span>
                        </div>
                        <div className="text-sm text-secondary-600 mb-1 font-mono">
                          {offsetClass.className}
                        </div>
                        {offsetClass.reason && (
                          <div className="text-xs text-secondary-500 mt-1 line-clamp-1 italic">
                            "{offsetClass.reason}"
                          </div>
                        )}
                        {offsetClass.meetingLink && (
                          <div className="mt-1">
                            <a 
                              href={offsetClass.meetingLink} 
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
                        {format(new Date(offsetClass.scheduledDate), 'dd/MM/yyyy')}
                      </div>
                      <div className="flex items-center text-sm text-secondary-600">
                        <Clock className="w-4 h-4 mr-2 text-secondary-400" />
                        {offsetClass.startTime} - {offsetClass.endTime}
                        {/* DEBUG LOG */}
                        {console.log('Row Data:', offsetClass._id, offsetClass.externalTeacher, offsetClass.assignedTeacherId)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {offsetClass.assignedTeacherId || offsetClass.externalTeacher?.name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                          <span className="text-primary-700 text-xs font-bold">
                            {offsetClass.assignedTeacherId?.name?.charAt(0) || offsetClass.externalTeacher?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-secondary-900 truncate">
                            {offsetClass.assignedTeacherId?.name || offsetClass.externalTeacher?.name || 'Không rõ'}
                          </div>
                          <div className="text-xs text-secondary-500 truncate">
                            {offsetClass.assignedTeacherId?.email || offsetClass.externalTeacher?.email || ''}
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
                      {offsetClass.notes ? (
                        <p className="line-clamp-2">{offsetClass.notes}</p>
                      ) : (
                        <span className="text-secondary-400 italic text-xs">Không có ghi chú</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(offsetClass.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit */}
                      {(offsetClass.status === 'pending' || offsetClass.status === 'assigned' || offsetClass.status === 'completed' || offsetClass.status === 'rejected') && (
                        <button
                          onClick={() => handleEdit(offsetClass)}
                          className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Auto-assign */}
                      {offsetClass.status === 'pending' && !offsetClass.assignedTeacherId && (
                        <button
                          onClick={() => handleAutoAssign(offsetClass._id)}
                          className="p-1.5 text-secondary-500 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                          title="Tự động phân công"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      )}

                      {/* Rejected Actions: Move back to pending */}
                      {offsetClass.status === 'rejected' && (
                        <button
                          onClick={() => handleRevertToPending(offsetClass._id)}
                          className="p-1.5 text-secondary-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Đưa vào chờ xử lý"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Reallocate & Complete */}
                      {offsetClass.status === 'assigned' && (
                        <>
                          <button
                            onClick={() => handleReallocate(offsetClass._id)}
                            className="p-1.5 text-secondary-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Tái phân bổ"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRevertToPending(offsetClass._id)}
                            className="p-1.5 text-secondary-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Về chờ xử lý"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMarkCompleted(offsetClass._id)}
                            className="p-1.5 text-secondary-500 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                            title="Hoàn thành"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {/* Cancel */}
                      {(offsetClass.status === 'pending' || offsetClass.status === 'assigned') && (
                        <button
                          onClick={() => handleCancel(offsetClass._id)}
                          className="p-1.5 text-secondary-500 hover:text-warning-600 hover:bg-warning-50 rounded transition-colors"
                          title="Hủy lớp"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Delete */}
                      {(offsetClass.status === 'cancelled' || offsetClass.status === 'completed' || offsetClass.status === 'rejected') && (
                        <button
                          onClick={() => handleDelete(offsetClass._id)}
                          className="p-1.5 text-secondary-500 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            )}
            </tbody>
          </table>

          {offsetClasses.length === 0 && (
            <div className="text-center py-12 bg-white">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookMarked className="w-8 h-8 text-secondary-400" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900">Chưa có lớp offset nào</h3>
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
                    {editingId ? 'Chỉnh sửa lớp offset' : 'Tạo lớp offset mới'}
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
                      placeholder="VD: TE-C-PA-711-2020BLG-0094"
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
                    
                    {/* Quick Time Presets */}
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
                        <input
                          type="time"
                          required
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                    <div className="space-y-4">
                      
                      <select
                        value={isExternalTeacher ? 'external' : (formData.assignedTeacherId || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'external') {
                            setIsExternalTeacher(true);
                            setFormData({ ...formData, assignedTeacherId: '' });
                          } else {
                            setIsExternalTeacher(false);
                            setFormData({ ...formData, assignedTeacherId: val });
                          }
                        }}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      >
                        <option value="">🤖 Tự động phân công (khuyến nghị)</option>
                        <option value="external">👤 Giáo viên ngoài (Nhập tay)</option>
                        <optgroup label="Giáo viên trong hệ thống">
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            👨‍🏫 {teacher.name}
                          </option>
                        ))}
                        </optgroup>
                      </select>

                      {/* External Teacher Inputs */}
                       {isExternalTeacher && (
                        <div className="p-4 bg-gray-50 border border-secondary-200 rounded-lg space-y-3 animate-fade-in">
                          <h4 className="text-sm font-bold text-secondary-800 border-b border-secondary-200 pb-2">
                             Thông tin giáo viên ngoài
                          </h4>
                          <div>
                            <label className="block text-xs font-semibold text-secondary-600 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              required={isExternalTeacher}
                              value={formData.externalTeacher?.name || ''}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                externalTeacher: { ...formData.externalTeacher, name: e.target.value } 
                              })}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                              placeholder="Nhập tên giáo viên"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-secondary-600 mb-1">Email <span className="text-red-500">*</span></label>
                            <input 
                              type="email" 
                              required={isExternalTeacher}
                              value={formData.externalTeacher?.email || ''}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                externalTeacher: { ...formData.externalTeacher, email: e.target.value } 
                              })}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                              placeholder="Nhập email giáo viên"
                            />
                          </div>
                        </div>
                      )}

                      {!isExternalTeacher && (
                        <p className="text-xs text-primary-600 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Hệ thống sẽ tự động chọn giáo viên phù hợp nhất nếu để trống
                        </p>
                      )}
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
                          placeholder="VD: Giáo viên nghỉ ốm"
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

      {/* Weekly Duty Modal */}
      {showDutyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Tạo Lịch Trực Tuần</h2>
              <button
                onClick={() => setShowDutyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại Lịch
                </label>
                <select
                  value={dutyType}
                  onChange={(e) => setDutyType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="TYPE_1">Loại 1 (T2, T4, T6: 19:30 | CN: 09:30)</option>
                  <option value="TYPE_2">Loại 2 (T3, T5, T7, CN: 19:30)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={dutyDateRange.fromDate}
                    onChange={(e) => setDutyDateRange({...dutyDateRange, fromDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={dutyDateRange.toDate}
                    onChange={(e) => setDutyDateRange({...dutyDateRange, toDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <p className="font-semibold">Lưu ý:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Sẽ tạo 3 lớp cho mỗi khung giờ.</li>
                  <li>Tự động phân công giáo viên ít giờ dạy nhất.</li>
                  <li>Chỉ tạo lịch cho các ngày nằm trong khoảng đã chọn.</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowDutyModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleGenerateDuty}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Tạo lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffsetClasses;
