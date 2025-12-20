import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Mail, Phone, Search, Filter, MoreVertical } from 'lucide-react';
import { teachersAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    maxOffsetClasses: 5,
    status: 'active',
    role: 'fulltime',
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll({ limit: 1000 });
      setTeachers(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await teachersAPI.update(editingId, formData);
        setShowModal(false); // Only close modal immediately for updates
      } else {
        const response = await teachersAPI.create(formData);
        // Show account info if created
        if (response.data?.account) {
            alert(`Tạo giáo viên thành công!\n\nTài khoản đăng nhập:\nUsername: ${response.data.account.username}\nMật khẩu: ${response.data.account.password}\n\nVui lòng lưu lại thông tin này!`);
        }
        setShowModal(false);
      }
      
      setFormData({ name: '', email: '', phone: '', maxOffsetClasses: 5, status: 'active', role: 'fulltime' });
      setEditingId(null);
      loadTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleEdit = (teacher) => {
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      maxOffsetClasses: teacher.maxOffsetClasses || 5,
      status: teacher.status,
      role: teacher.role || 'fulltime',
    });
    setEditingId(teacher._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
      try {
        await teachersAPI.delete(id);
        loadTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Có lỗi xảy ra: ' + error.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'neutral',
      on_leave: 'warning',
    };
    const labels = {
      active: 'Đang hoạt động',
      inactive: 'Ngừng hoạt động',
      on_leave: 'Nghỉ phép',
    };
    return (
      <Badge variant={variants[status] || 'neutral'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Quản lý Giáo viên</h1>
          <p className="text-secondary-500 mt-1">Danh sách giáo viên trong hệ thống</p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: '', email: '', phone: '', maxOffsetClasses: 5, status: 'active', role: 'fulltime' });
            setEditingId(null);
            setShowModal(true);
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm giáo viên
        </Button>
      </div>

      <Card noPadding className="overflow-hidden">
        {/* Filters & Search */}
        <div className="p-4 border-b border-secondary-200 bg-secondary-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-secondary-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-white border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Giáo viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                   Số lớp offset tối đa
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                   Vai trò
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
              {filteredTeachers.map((teacher) => (
                <tr key={teacher._id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-primary-700 font-bold text-sm">
                          {teacher.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-secondary-900">{teacher.name}</div>
                        <div className="text-xs text-secondary-500">ID: {teacher._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm text-secondary-600">
                        <Mail className="w-4 h-4 mr-2 text-secondary-400" />
                        {teacher.email}
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center text-sm text-secondary-600">
                          <Phone className="w-4 h-4 mr-2 text-secondary-400" />
                          {teacher.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-secondary-900 bg-secondary-100 px-2 py-1 rounded-md">
                      {teacher.maxOffsetClasses || 0} lớp
                    </span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                       teacher.role === 'fulltime' 
                         ? 'bg-blue-100 text-blue-700' 
                         : 'bg-purple-100 text-purple-700'
                     }`}>
                       {teacher.role === 'parttime' ? 'Part-time' : 'Full-time'}
                     </span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(teacher.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/teachers/${teacher._id}`}
                        className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="p-2 text-secondary-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher._id)}
                        className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTeachers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-secondary-400" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900">Không tìm thấy giáo viên</h3>
              <p className="text-secondary-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc thêm giáo viên mới.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-secondary-900/75 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-xl font-bold text-secondary-900 mb-4">
                  {editingId ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Họ tên <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      placeholder="Nhập họ tên giáo viên"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Email <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      placeholder="example@domain.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        placeholder="0912..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Số lớp offset tối đa
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.maxOffsetClasses}
                        onChange={(e) =>
                          setFormData({ ...formData, maxOffsetClasses: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Ngừng hoạt động</option>
                      <option value="on_leave">Nghỉ phép</option>
                    </select>
                  </div>
                   <div>
                     <label className="block text-sm font-medium text-secondary-700 mb-1">
                       Vai trò
                     </label>
                     <select
                       value={formData.role}
                       onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                       className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                     >
                       <option value="fulltime">Full-time</option>
                       <option value="parttime">Part-time</option>
                     </select>
                   </div>
                   
                   <div className="mt-6 flex gap-3 justify-end pt-4 border-t border-secondary-100">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowModal(false);
                        setEditingId(null);
                        setFormData({ name: '', email: '', phone: '', maxOffsetClasses: 5, status: 'active', role: 'fulltime' });
                      }}
                    >
                      Hủy
                    </Button>
                    <Button type="submit">
                      {editingId ? 'Cập nhật' : 'Tạo mới'}
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

export default Teachers;
