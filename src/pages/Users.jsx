import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, User, Key, Plus, Edit, Trash2, Eye, EyeOff, RefreshCw, Users as UsersIcon, UserCheck } from 'lucide-react';
import { adminAPI, teachersAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useNotification } from '../components/ui/NotificationProvider';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'user', // Default is teacher
    teacherId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, teachersResponse] = await Promise.all([
        adminAPI.getAllUsers(),
        teachersAPI.getAll({ limit: 1000 })
      ]);
      setUsers(usersResponse.data || []);
      setTeachers(teachersResponse.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Lỗi tải dữ liệu: ' + error.message, 'error');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        await adminAPI.updateUser(editingId, formData);
        showNotification('Cập nhật tài khoản thành công!', 'success');
      } else {
        // Create
        await adminAPI.createUser(formData);
        showNotification('Tạo tài khoản thành công!', 'success');
      }
      setShowModal(false);
      resetForm();
      loadData(); // Reload users
    } catch (error) {
      showNotification('Lỗi: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await adminAPI.deleteUser(id);
        showNotification('Xóa tài khoản thành công', 'success');
        loadData();
      } catch (error) {
        showNotification('Lỗi khi xóa: ' + error.message, 'error');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingId(user._id);
    setFormData({
      name: user.name,
      username: user.username,
      password: '', // Leave empty to keep unchanged
      role: user.role,
      teacherId: user.teacherId?._id || ''
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'user',
      teacherId: ''
    });
    setShowPassword(false);
  };

  const generatePassword = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
      let password = "";
      for (let i = 0; i < 10; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setFormData(prev => ({ ...prev, password }));
      setShowPassword(true);
  }

  const getRoleBadge = (role) => {
      const variants = {
          admin: 'danger',
          st: 'warning',
          user: 'success'
      };
      const labels = {
          admin: 'Quản trị viên',
          st: 'Học vụ',
          user: 'Giáo viên'
      };
      return <Badge variant={variants[role] || 'neutral'}>{labels[role] || role}</Badge>;
  }

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-xl font-bold text-secondary-900">Danh sách tài khoản</h1>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="shadow-lg shadow-primary-500/30">
          <Plus className="w-5 h-5 mr-2" />
          Thêm tài khoản
        </Button>
      </div>

      <Card noPadding className="overflow-hidden border border-secondary-200 shadow-sm">
        {/* Filters & Search - Glassmorphism hint */}
        <div className="p-4 border-b border-secondary-200 bg-white/50 backdrop-blur-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-secondary-50 border-transparent focus:bg-white border focus:border-primary-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-100">
            <thead className="bg-secondary-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                  Username
                </th>
                 <th className="px-6 py-4 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                  Mật khẩu gốc
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                  Liên kết
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-secondary-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-100">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-primary-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-primary-700 font-bold text-sm">
                          {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-secondary-900 group-hover:text-primary-700 transition-colors">{user.name}</div>
                        <div className="text-xs text-secondary-500">ID: {user._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-secondary-900 font-medium">
                        <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-xs font-bold mr-2">@</span>
                        {user.username}
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    {user.originalPassword ? (
                         <div className="flex items-center group/pass cursor-pointer">
                            <div className="flex items-center text-sm font-mono text-secondary-600 bg-secondary-50 border border-secondary-200 px-3 py-1.5 rounded-lg w-fit transition-all hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50">
                                <Key className="w-3 h-3 mr-2 text-secondary-400 group-hover/pass:text-primary-500" />
                                {user.originalPassword}
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-secondary-400 italic">Đã đổi / Ẩn</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                   {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.teacherId ? (
                         <div className="text-sm text-secondary-600 flex flex-col">
                             <span className="font-medium text-primary-700">{user.teacherId.name}</span>
                             <span className="text-xs text-secondary-400">{user.teacherId.email}</span>
                         </div>
                    ) : (
                        <span className="text-sm text-secondary-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-secondary-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-secondary-400" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900">Không tìm thấy tài khoản</h3>
            </div>
          )}
        </div>
      </Card>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-secondary-100">
              <div className="bg-white px-8 pt-8 pb-8">
                <h3 className="text-2xl font-bold text-secondary-900 mb-6 flex items-center">
                    <div className={`p-3 rounded-xl mr-4 ${editingId ? 'bg-blue-50 text-blue-600' : 'bg-primary-50 text-primary-600'}`}>
                        {editingId ? <Edit className="w-6 h-6"/> : <Plus className="w-6 h-6"/>}
                    </div>
                    {editingId ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Họ tên <span className="text-danger-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-secondary-900 placeholder:font-normal"
                          placeholder="Ví dụ: Nguyễn Văn A"
                        />
                      </div>
                      
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Username <span className="text-danger-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-secondary-400 font-medium">@</span>
                            <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full pl-8 pr-4 py-3 bg-white border border-secondary-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-secondary-900"
                            disabled={!!editingId}
                            placeholder="username"
                            />
                        </div>
                        {editingId && <p className="text-xs text-secondary-400 mt-1 pl-1">Không thể thay đổi username</p>}
                      </div>

                      <div className="col-span-2 md:col-span-1">
                         <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Vai trò
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="user">Giáo viên (User)</option>
                          <option value="st">Học vụ (ST)</option>
                          <option value="admin">Quản trị viên (Admin)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Mật khẩu {editingId && <span className="text-xs font-normal text-secondary-500">(Để trống nếu không đổi)</span>}
                        </label>
                        <div className="relative group/input">
                            <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            required={!editingId}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-4 pr-24 py-3 bg-white border border-secondary-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono tracking-wide"
                            placeholder={editingId ? "••••••••" : "Nhập mật khẩu..."}
                            />
                            <div className="absolute right-2 top-2 flex gap-1 bg-white pl-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-50 transition-colors"
                                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    className="p-2 text-primary-500 hover:text-primary-700 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1 bg-primary-50/50"
                                    title="Tạo mật khẩu ngẫu nhiên"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="text-xs font-medium">Random</span>
                                </button>
                            </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Liên kết Giáo viên (Nếu là GV)
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 w-4 h-4 text-secondary-400" />
                            <select
                            value={formData.teacherId}
                            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                            >
                            <option value="">-- Không liên kết --</option>
                            {teachers.map(teacher => (
                                <option key={teacher._id} value={teacher._id}>
                                {teacher.name} ({teacher.email})
                                </option>
                            ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        <p className="text-xs text-secondary-500 mt-2 flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            Chọn giáo viên để đồng bộ dữ liệu giảng dạy và lịch học.
                        </p>
                      </div>
                  </div>

                  <div className="mt-8 flex gap-3 justify-end pt-5 border-t border-secondary-100">
                    <Button
                      variant="secondary"
                      onClick={() => setShowModal(false)}
                      type="button"
                    >
                      Hủy bỏ
                    </Button>
                    <Button type="submit">
                      {editingId ? 'Lưu thay đổi' : 'Tạo tài khoản'}
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

export default Users;
