import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        const result = await login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    } catch (err) {
        setError('Đã có lỗi xảy ra');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
         <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>
         <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
         <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"></div>
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          
          {/* Header Section */}
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 mb-4 shadow-lg">
                <ShieldCheck size={24} />
             </div>
             <h1 className="text-2xl font-bold text-slate-800 tracking-tight">LMS Connect</h1>
             <p className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-wider">Hệ thống Quản lý Đào tạo</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
                <div className="flex">
                  <div className="ml-2">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase ml-1">Tên đăng nhập</label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                    placeholder="Nhập username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                 <div className="flex items-center justify-between mb-1.5 ml-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Mật khẩu</label>
                 </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
                    {!loading && <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                </button>
            </div>

            <div className="mt-8 text-center">
                 <Link to="/register" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors">
                   Tạo tài khoản giảng viên mới
                </Link>
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

export default Login;
