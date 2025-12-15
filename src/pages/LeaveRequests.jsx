import React, { useState, useEffect } from 'react';
import { fixedScheduleLeaveAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, Calendar, User, BookOpen, Clock, Trash2, UserPlus, RefreshCcw } from 'lucide-react';

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    loadLeaves();
  }, [filterStartDate, filterEndDate]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      
      const response = await fixedScheduleLeaveAPI.getAll(params);
      setLeaves(response.data || []);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (leaveId) => {
    if (!confirm('Bạn có chắc chắn muốn phục hồi lịch dạy này?')) return;
    try {
      await fixedScheduleLeaveAPI.delete(leaveId);
      loadLeaves();
    } catch (error) {
      alert('Lỗi khi phục hồi: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Quản lý Yêu cầu nghỉ</h1>
          <p className="text-secondary-500 mt-1">Danh sách giáo viên xin nghỉ và thông tin dạy thay</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
             <label className="block text-sm font-medium text-secondary-700 mb-1">Từ ngày</label>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input 
                  type="date" 
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
             </div>
          </div>
          <div className="flex-1 min-w-[200px]">
             <label className="block text-sm font-medium text-secondary-700 mb-1">Đến ngày</label>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
             </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
            className="mb-[1px]"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Đặt lại
          </Button>
        </div>
      </Card>

      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary-500">Đang tải dữ liệu...</div>
        ) : leaves.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-secondary-400">
            <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-medium">Chưa có yêu cầu nghỉ nào</p>
            <p className="text-sm">Các yêu cầu xin nghỉ sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary-50 border-b border-secondary-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Giáo viên</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Thông tin lớp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Thời gian nghỉ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Lý do</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Dạy thay</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-secondary-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                          {leave.teacherId?.name?.charAt(0) || 'G'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-secondary-900">{leave.teacherId?.name || 'Unknown'}</div>
                          <div className="text-xs text-secondary-500">{leave.teacherId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                           {leave.fixedScheduleId?.className || 'N/A'}
                        </span>
                        <div className="text-sm text-secondary-600 flex items-center gap-1">
                           <BookOpen className="w-3 h-3" />
                           {leave.fixedScheduleId?.subjectId?.name || 'Môn học'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium text-secondary-900 flex items-center gap-1">
                             <Calendar className="w-4 h-4 text-secondary-400" />
                             {new Date(leave.date).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-secondary-500 flex items-center gap-1">
                             <Clock className="w-3 h-3" />
                             {leave.fixedScheduleId?.startTime} - {leave.fixedScheduleId?.endTime}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-sm text-secondary-600 line-clamp-2 max-w-[200px]" title={leave.reason}>
                          {leave.reason || 'Không có lý do'}
                       </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {leave.substituteTeacherId ? (
                          <div className="flex items-center gap-2">
                             <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-bold">
                                {leave.substituteTeacherId.name.charAt(0)}
                             </div>
                             <div>
                                <div className="text-sm font-medium text-secondary-900">{leave.substituteTeacherId.name}</div>
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                   <UserPlus className="w-3 h-3" />
                                   Đã phân công
                                </div>
                             </div>
                          </div>
                       ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                             Chưa có
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                       <Button 
                          variant="ghost" 
                          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                          onClick={() => handleRestore(leave._id)}
                          title="Phục hồi lịch dạy (Xoá yêu cầu nghỉ)"
                       >
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Phục hồi
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;
