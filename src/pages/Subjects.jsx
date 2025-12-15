import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, X, BookOpen, Layers, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { subjectsAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    description: '',
    levels: []
  });
  const [levelForm, setLevelForm] = useState({
    levelNumber: 1,
    name: '',
    description: ''
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  // Auto hide notification
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

  const loadSubjects = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      showNotification('Không thể tải danh sách môn học', 'error');
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const subjectData = {
        name: formData.name,
        code: formData.code,
        description: formData.description
      };
      
      if (editingSubject) {
        await subjectsAPI.update(editingSubject._id, subjectData);
        showNotification('Cập nhật môn học thành công', 'success');
      } else {
        const response = await subjectsAPI.create(subjectData);
        
        if (response.data) {
          const subjectCode = formData.code.toUpperCase();
          for (let i = 1; i <= 12; i++) {
            const levelData = {
              semester: i,
              name: `${subjectCode}_HP${i}`,
              description: `Học phần ${i} của môn ${formData.name}`
            };
            await subjectsAPI.addLevel(response.data._id, levelData);
          }
        }
        showNotification('Tạo môn học mới thành công', 'success');
      }
      
      setShowModal(false);
      setFormData({ name: '', code: '', description: '', levels: [] });
      setEditingSubject(null);
      loadSubjects();
    } catch (error) {
      showNotification(error.response?.data?.message || error.message, 'error');
    }
  };

  const handleAddLevelToExisting = async (e) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        await subjectsAPI.updateLevel(selectedSubject._id, editingLevel._id, {
          semester: levelForm.levelNumber,
          name: levelForm.name,
          description: levelForm.description
        });
        showNotification('Cập nhật học phần thành công', 'success');
      } else {
        await subjectsAPI.addLevel(selectedSubject._id, {
          semester: levelForm.levelNumber,
          name: levelForm.name,
          description: levelForm.description
        });
        showNotification('Thêm học phần mới thành công', 'success');
      }
      setShowLevelModal(false);
      setLevelForm({ levelNumber: 1, name: '', description: '' });
      setSelectedSubject(null);
      setEditingLevel(null);
      loadSubjects();
    } catch (error) {
      showNotification(error.response?.data?.message || error.message, 'error');
    }
  };

  const openEditLevelModal = (subject, level) => {
    setSelectedSubject(subject);
    setEditingLevel(level);
    setLevelForm({
      levelNumber: level.semester,
      name: level.name,
      description: level.description || ''
    });
    setShowLevelModal(true);
  };

  const handleDeleteLevel = async (subjectId, levelId) => {
    if (!confirm('Bạn có chắc muốn xóa level này?')) return;
    try {
      await subjectsAPI.deleteLevel(subjectId, levelId);
      showNotification('Đã xóa học phần', 'success');
      loadSubjects();
    } catch (error) {
      showNotification(error.response?.data?.message || error.message, 'error');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!confirm('Bạn có chắc muốn xóa môn học này? Tất cả levels sẽ bị xóa.')) return;
    try {
      await subjectsAPI.delete(subjectId);
      showNotification('Đã xóa môn học', 'success');
      loadSubjects();
    } catch (error) {
      showNotification(error.response?.data?.message || error.message, 'error');
    }
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      levels: []
    });
    setShowModal(true);
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
            ${notification.type === 'info' ? 'bg-white border-primary-500' : ''}
          `}>
            <div className="flex-shrink-0">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-success-600" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-danger-600" />}
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Quản lý Môn học</h1>
          <p className="text-secondary-500 mt-1">Quản lý danh sách môn học và học phần</p>
        </div>
        <Button
          onClick={() => {
            setEditingSubject(null);
            setFormData({ name: '', code: '', description: '', levels: [] });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm môn học
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {subjects.map((subject) => (
          <Card key={subject._id} noPadding className="overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900">{subject.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="neutral" className="font-mono text-xs">
                        {subject.code}
                      </Badge>
                      <Badge variant="primary" className="text-xs">
                        {subject.levels?.length || 0} levels
                      </Badge>
                    </div>
                  </div>
                </div>
                {subject.description && (
                  <p className="text-sm text-secondary-600 ml-[52px]">{subject.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-[52px] md:ml-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSubject(subject);
                    setEditingLevel(null);
                    setLevelForm({ levelNumber: 1, name: '', description: '' });
                    setShowLevelModal(true);
                  }}
                  className="text-success-600 hover:text-success-700 hover:bg-success-50"
                  title="Thêm học phần"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(subject)}
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  title="Chỉnh sửa"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSubject(subject._id)}
                  className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSubject(subject._id)}
                  className="text-secondary-500"
                >
                  {expandedSubjects[subject._id] ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {expandedSubjects[subject._id] && (
              <div className="border-t border-secondary-100 bg-secondary-50/50 p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-secondary-700">
                  <Layers className="w-4 h-4" />
                  Danh sách Học phần (Levels)
                </div>
                
                {(!subject.levels || subject.levels.length === 0) ? (
                  <div className="text-center py-6 bg-white rounded-lg border border-dashed border-secondary-300">
                    <p className="text-secondary-500 text-sm italic">Chưa có học phần nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subject.levels
                      .sort((a, b) => a.semester - b.semester)
                      .map((level) => (
                        <div
                          key={level._id}
                          className="bg-white p-3 rounded-lg border border-secondary-200 shadow-sm hover:border-primary-300 transition-colors group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider rounded border border-primary-100">
                                  HP{level.semester}
                                </span>
                              </div>
                              <h4 className="font-medium text-secondary-900 truncate" title={level.name}>
                                {level.name}
                              </h4>
                              {level.description && (
                                <p className="text-xs text-secondary-500 mt-1 line-clamp-2" title={level.description}>
                                  {level.description}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditLevelModal(subject, level)}
                                className="p-1 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLevel(subject._id, level._id)}
                                className="p-1 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modal thêm/sửa môn học */}
      {showModal && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
            <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
              <h3 className="text-lg font-bold text-secondary-900">
                {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({ name: '', code: '', description: '', levels: [] });
                  setEditingSubject(null);
                }}
                className="text-secondary-400 hover:text-secondary-600 p-1 hover:bg-secondary-200 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Tên môn học <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Toán học"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Mã môn học <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: MATH101"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    placeholder="Mô tả chi tiết về môn học"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    rows="3"
                  />
                </div>

                {!editingSubject && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-primary-900 mb-1">Tự động tạo học phần</h5>
                        <p className="text-sm text-primary-800">
                          Khi tạo môn học mới, hệ thống sẽ tự động tạo <strong>12 học phần</strong> với mã:<br/>
                          <span className="font-mono text-xs bg-white/50 px-2 py-1 rounded mt-1 inline-block border border-primary-200">
                            {formData.code || 'MAMONHOC'}_HP1 ... {formData.code || 'MAMONHOC'}_HP12
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-secondary-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ name: '', code: '', description: '', levels: [] });
                      setEditingSubject(null);
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                  >
                    {editingSubject ? 'Cập nhật' : 'Tạo mới'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Modal thêm/sửa học phần */}
      {showLevelModal && selectedSubject && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-scale-up">
            <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-secondary-900">
                {editingLevel ? 'Chỉnh sửa Học phần' : 'Thêm Học phần'}
              </h3>
              <button
                onClick={() => {
                  setShowLevelModal(false);
                  setSelectedSubject(null);
                  setEditingLevel(null);
                  setLevelForm({ levelNumber: 1, name: '', description: '' });
                }}
                className="text-secondary-400 hover:text-secondary-600 p-1 hover:bg-secondary-200 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                <span className="text-xs text-secondary-500 uppercase tracking-wide font-semibold">Môn học</span>
                <p className="font-bold text-secondary-900">{selectedSubject.name}</p>
              </div>

              <form onSubmit={handleAddLevelToExisting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Số học phần <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={levelForm.levelNumber}
                    onChange={(e) => setLevelForm({ ...levelForm, levelNumber: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Tên học phần <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Lập trình cơ bản"
                    required
                    value={levelForm.name}
                    onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    placeholder="Mô tả nội dung học phần"
                    value={levelForm.description}
                    onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    rows="3"
                  />
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-secondary-100 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowLevelModal(false);
                      setSelectedSubject(null);
                      setEditingLevel(null);
                      setLevelForm({ levelNumber: 1, name: '', description: '' });
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                  >
                    {editingLevel ? 'Cập nhật' : 'Thêm'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Subjects;
