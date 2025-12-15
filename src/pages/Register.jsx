import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { User, Mail, Phone, Calendar, Briefcase, Lock, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        email: '',
        phone: '',
        teacherRole: 'parttime',
        dateOfBirth: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu nhập lại không khớp');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/auth/register', {
                username: formData.username,
                password: formData.password,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                teacherRole: formData.teacherRole,
                dateOfBirth: formData.dateOfBirth
            });

            if (response.data.token) {
                login(response.data, response.data.token);
                navigate('/schedule');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-slate-900 py-12">
             {/* Animated Background */}
              <div className="absolute inset-0 z-0 h-full overflow-hidden bg-slate-900">
                 <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                 <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>
                 <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
                 <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"></div>
              </div>

             {/* Centered Register Card */}
             <div className="relative z-10 w-full max-w-2xl px-4">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-10 border border-white/20">
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-slate-100">
                       <div>
                           <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Đăng ký tài khoản</h2>
                           <p className="mt-1 text-sm text-slate-500">Tạo hồ sơ giảng viên mới</p>
                       </div>
                       <Link to="/login" className="mt-4 sm:mt-0 inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                          <ArrowLeft size={16} className="mr-1"/> Quay lại đăng nhập
                       </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
                                <p className="text-sm text-red-700 ml-2">{error}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                           {/* Account Info Section */}
                           <div>
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Thông tin đăng nhập</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                 <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Tên đăng nhập</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                                          <User size={18} />
                                        </div>
                                        <input
                                          name="username"
                                          type="text"
                                          required
                                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                          placeholder="username"
                                          value={formData.username}
                                          onChange={handleChange}
                                        />
                                    </div>
                                 </div>
                                 
                                 <div className="hidden md:block"></div>

                                  <div>
                                     <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Mật khẩu</label>
                                     <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                                          <Lock size={18} />
                                        </div>
                                        <input
                                          name="password"
                                          type="password"
                                          required
                                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                          placeholder="••••••••"
                                          value={formData.password}
                                          onChange={handleChange}
                                        />
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Xác nhận</label>
                                     <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                                          <Lock size={18} />
                                        </div>
                                        <input
                                          name="confirmPassword"
                                          type="password"
                                          required
                                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                          placeholder="••••••••"
                                          value={formData.confirmPassword}
                                          onChange={handleChange}
                                        />
                                     </div>
                                  </div>
                              </div>
                           </div>

                           {/* Personal Info Section */}
                           <div>
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 mt-4">Hồ sơ cá nhân</h3>
                              <div className="space-y-4">
                                  <div>
                                     <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Họ và tên</label>
                                     <input
                                          name="name"
                                          type="text"
                                          required
                                          className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                          placeholder="Nguyễn Văn A"
                                          value={formData.name}
                                          onChange={handleChange}
                                      />
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                      <div>
                                         <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Email</label>
                                         <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                                              <Mail size={18} />
                                            </div>
                                            <input
                                              name="email"
                                              type="email"
                                              required
                                              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                              placeholder="email@example.com"
                                              value={formData.email}
                                              onChange={handleChange}
                                            />
                                         </div>
                                      </div>
                                      <div>
                                         <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Số điện thoại</label>
                                         <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                                              <Phone size={18} />
                                            </div>
                                            <input
                                              name="phone"
                                              type="tel"
                                              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                              placeholder="0912..."
                                              value={formData.phone}
                                              onChange={handleChange}
                                            />
                                         </div>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                      <div>
                                         <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Hình thức</label>
                                         <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                                              <Briefcase size={18} />
                                            </div>
                                            <select
                                              name="teacherRole"
                                              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm appearance-none bg-slate-50 focus:bg-white"
                                              value={formData.teacherRole}
                                              onChange={handleChange}
                                            >
                                                <option value="fulltime">Full-time</option>
                                                <option value="parttime">Part-time</option>
                                            </select>
                                         </div>
                                      </div>
                                      <div>
                                         <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Ngày sinh</label>
                                         <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                                              <Calendar size={18} />
                                            </div>
                                            <input
                                              name="dateOfBirth"
                                              type="date"
                                              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                              value={formData.dateOfBirth}
                                              onChange={handleChange}
                                            />
                                         </div>
                                      </div>
                                  </div>
                              </div>
                           </div>
                        </div>

                        <div className="pt-4">
                           <button
                                type="submit"
                                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'} 
                                {!loading && <ArrowRight size={16} className="ml-2" />}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-xs text-shadow">&copy; 2024 LMS Connect System</p>
                </div>
             </div>
        </div>
    );
};

export default Register;
