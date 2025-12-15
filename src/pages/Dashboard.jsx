import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// import axios from 'axios'; // Removed raw axios usage
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  Users, 
  BookMarked, 
  Calendar, 
  TrendingUp, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Layers,
  ClipboardCheck, // Import icon for Test Class
  BookOpen // Import BookOpen
} from 'lucide-react';
import { dashboardAPI, teachersAPI } from '../services/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-500">{title}</p>
          <h3 className="text-2xl font-bold text-secondary-900 mt-2">{value}</h3>
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trend > 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% so với tháng trước
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color] || colorStyles.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

const PersonalDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyStats = async () => {
             try {
                 // const token = localStorage.getItem('token'); // Handled by interceptor
                 const res = await dashboardAPI.getMyStats();
                 console.log("Dashboard API Response:", res);
                 setData(res.data);
             } catch (error) {
                 console.error("Error fetching personal stats", error);
             } finally {
                 setLoading(false);
             }
        };
        fetchMyStats();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>Không có dữ liệu.</div>;

    const { stats = {}, upcomingClasses = [] } = data || {};

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-secondary-900">Tổng quan cá nhân</h1>
            

             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <Card className="p-6 bg-gradient-to-br from-indigo-500 to-primary-600 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100 font-medium">Giờ dạy tháng này</p>
                            <h3 className="text-3xl font-bold mt-2">{stats.hoursMonth || 0}h</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                             <Clock className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>
                
                <Card className="p-6 bg-white border border-secondary-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-secondary-500 font-medium">Giờ Test (Tháng)</p>
                            <h3 className="text-3xl font-bold mt-2 text-secondary-900">{stats.testHours || 0}h</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                             <ClipboardCheck className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white border border-secondary-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-secondary-500 font-medium">Lớp Bổ trợ (Tháng)</p>
                            <h3 className="text-3xl font-bold mt-2 text-secondary-900">{stats.supplementaryCount || 0}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg">
                             <Layers className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                 <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-secondary-500 font-medium">Lớp sắp tới (7 ngày)</p>
                            <h3 className="text-3xl font-bold mt-2 text-secondary-900">{stats.upcomingCount || 0}</h3>
                        </div>
                         <div className="p-2 bg-orange-50 rounded-lg">
                             <Calendar className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </Card>
             </div>

             <Card className="p-6">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-secondary-900">Lịch giảng dạy tuần này</h2>
                    <span className="text-sm font-medium text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full">
                        Today + 6 days
                    </span>
                 </div>

                 {upcomingClasses.length > 0 ? (
                     <div className="space-y-6">
                        {/* Grroup by Date */}
                        {Object.entries(upcomingClasses.reduce((groups, cls) => {
                            const dateStr = new Date(cls.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
                            if (!groups[dateStr]) groups[dateStr] = [];
                            groups[dateStr].push(cls);
                            return groups;
                        }, {})).map(([dateLabel, classes], idx) => (
                             <div key={idx} className="relative pl-6 border-l-2 border-secondary-200 last:border-0 pb-6 last:pb-0">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-500"></div>
                                <h3 className="text-sm font-bold text-secondary-500 uppercase tracking-wider mb-3">{dateLabel}</h3>

                                <div className="space-y-3">
                                     {classes.map((cls, classIdx) => (
                                         <div key={classIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-secondary-200 rounded-xl hover:shadow-md transition-shadow">
                                             <div className="flex items-start gap-4">
                                                 <div className={`p-3 rounded-xl mt-1 sm:mt-0 ${
                                                     cls.type === 'Fixed' ? 'bg-indigo-50 text-indigo-600' :
                                                     cls.type === 'Offset' ? 'bg-orange-50 text-orange-600' :
                                                     cls.type === 'Test' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'
                                                 }`}>
                                                     {cls.type === 'Fixed' ? <BookOpen size={20}/> :
                                                      cls.type === 'Offset' ? <BookMarked size={20}/> :
                                                      cls.type === 'Test' ? <ClipboardCheck size={20}/> : <Layers size={20}/>}
                                                 </div>
                                                 <div>
                                                     <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-secondary-900 text-lg">
                                                            {cls.className}
                                                        </h4>
                                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                                            cls.type === 'Fixed' ? 'bg-indigo-100 text-indigo-700' :
                                                            cls.type === 'Offset' ? 'bg-orange-100 text-orange-700' :
                                                            cls.type === 'Test' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {cls.type === 'Fixed' ? 'Lớp chính' :
                                                             cls.type === 'Offset' ? 'Lớp bù/thay' :
                                                             cls.type === 'Test' ? 'Lớp Test' : 'Bổ trợ'}
                                                        </span>
                                                     </div>
                                                     <p className="text-sm text-secondary-600 font-medium mb-1">{cls.subject}</p>
                                                     <div className="flex items-center gap-4 text-sm text-secondary-500">
                                                         <span className="flex items-center gap-1.5 bg-secondary-50 px-2 py-1 rounded-md">
                                                             <Clock size={14} className="text-primary-500"/> {cls.time}
                                                         </span>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                </div>
                             </div>
                        ))}
                     </div>
                 ) : (
                     <div className="text-center py-12 bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                             <Calendar className="w-8 h-8 text-secondary-400" />
                         </div>
                         <h3 className="text-lg font-medium text-secondary-900">Không có lịch dạy</h3>
                         <p className="text-secondary-500 mt-1">Bạn không có lớp học nào trong 7 ngày tới.</p>
                     </div>
                 )}
             </Card>
        </div>
    );
};



// Main Dashboard Component
const Dashboard = () => {
  const { user } = useAuth(); // Helper to check role
  
  if (user?.role === 'admin') {
      return <AdminDashboard />;
  }
  
  return <PersonalDashboard />;
};

// Rename the original Dashboard to AdminDashboard
const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
      totalTeachers: 0,
      totalOffsetClasses: 0,
      pendingClasses: 0,
      assignedClasses: 0,
      completedClasses: 0,
      totalSupplementaryClasses: 0,
      totalTestClasses: 0,
    });
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('all');
    const [dateRange, setDateRange] = useState({
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    const [offsetData, setOffsetData] = useState([]);
    const [supplementaryData, setSupplementaryData] = useState([]);
    const [testClassData, setTestClassData] = useState([]);
    const [teacherHoursData, setTeacherHoursData] = useState([]);
  
    useEffect(() => {
      loadData();
    }, [selectedTeacher, dateRange]);
  
    const loadData = async () => {
      try {
        setLoading(true);
  
        // Load teachers (only active)
        const teachersRes = await teachersAPI.getAll({ limit: 1000, status: 'active' });
        const teachersData = teachersRes.data || teachersRes || [];
        setTeachers(Array.isArray(teachersData) ? teachersData : []);
  
        // Load teaching hours statistics
        const teachingHoursRes = await dashboardAPI.getTeachingHours({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          teacherId: selectedTeacher !== 'all' ? selectedTeacher : undefined
        });
  
        const teacherStats = teachingHoursRes.data || [];
        const summary = teachingHoursRes.summary || {};
  
        // Load offset classes statistics
        const offsetStatsRes = await dashboardAPI.getOffsetClassStatistics({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            teacherId: selectedTeacher !== 'all' ? selectedTeacher : undefined
        });
  
        const offsetStats = offsetStatsRes.data || {};
  
        // Load test class statistics
        const testClassStatsRes = await dashboardAPI.getTestClassStatistics({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            teacherId: selectedTeacher !== 'all' ? selectedTeacher : undefined
        });
        const testClassStats = testClassStatsRes.data || {};
  
        // Update stats
        setStats({
          totalTeachers: summary.totalTeachers || 0,
          totalOffsetClasses: offsetStats.total || 0,
          pendingClasses: offsetStats.pending || 0,
          assignedClasses: offsetStats.assigned || 0,
          completedClasses: offsetStats.completed || 0,
          totalSupplementaryClasses: summary.totalSupplementaryClasses || 0,
          totalTestClasses: testClassStats.total || 0,
        });
  
        // Prepare data for charts
        const sortedStats = [...teacherStats].sort((a, b) => b.totalHours - a.totalHours).slice(0, 100);
  
        // Helper to abbreviate name: "Trần Hoàng Long" -> "THLong"
        const abbreviateName = (name) => {
          if (!name) return '';
          const parts = name.trim().split(/\s+/);
          if (parts.length === 1) return parts[0];
          
          const initials = parts.slice(0, parts.length - 1).map(p => p.charAt(0).toUpperCase()).join('');
          const lastName = parts[parts.length - 1]; // First name in VN context
          const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
          
          return `${initials}${formattedLastName}`;
        };
  
        setOffsetData(
          sortedStats.map(t => [abbreviateName(t.teacherName), t.offsetClassCount || 0])
        );
  
        setSupplementaryData(
          sortedStats.map(t => [abbreviateName(t.teacherName), t.supplementaryClassCount || 0])
        );
  
        // Data for Test Classes chart
        setTestClassData(
          sortedStats.map(t => {
            const count = testClassStats.byTeacher && testClassStats.byTeacher[t.teacherId] 
              ? testClassStats.byTeacher[t.teacherId].total 
              : 0;
            return [abbreviateName(t.teacherName), count];
          })
        );
  
        setTeacherHoursData(
          sortedStats.map(t => [abbreviateName(t.teacherName), t.totalHours || 0])
        );
  
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };
  
    // Chart Configuration using existing chartTheme and commonOptions if defined globally or re-defined here.
    // They were defined inside Dashboard component originally. I need to include them.
    const chartTheme = {
      primary: '#6366f1', // Indigo 500
      secondary: '#a5b4fc', // Indigo 300
      success: '#22c55e', // Green 500
      warning: '#eab308', // Yellow 500
      danger: '#ef4444', // Red 500
      grid: '#e2e8f0', // Slate 200
      text: '#64748b', // Slate 500
    };
  
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            font: { family: 'Inter', size: 12 },
            color: chartTheme.text,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: chartTheme.text, font: { family: 'Inter' } },
        },
        y: {
          grid: { color: chartTheme.grid, borderDash: [4, 4] },
          ticks: { color: chartTheme.text, font: { family: 'Inter' } },
          beginAtZero: true,
        },
      },
    };
  
    const offsetClassesChartData = {
      labels: offsetData.map(([name]) => name),
      datasets: [
        {
          label: 'Số lớp offset',
          data: offsetData.map(([, count]) => count),
          backgroundColor: chartTheme.primary,
          borderRadius: 6,
          barThickness: 20,
        },
      ],
    };
  
    const supplementaryClassesChartData = {
      labels: supplementaryData.map(([name]) => name),
      datasets: [
        {
          label: 'Số lớp bổ trợ',
          data: supplementaryData.map(([, count]) => count),
          backgroundColor: chartTheme.warning,
          borderRadius: 6,
          barThickness: 20,
        },
      ],
    };
  
    const teachingHoursChartData = {
      labels: teacherHoursData.map(([name]) => name),
      datasets: [
        {
          label: 'Số giờ dạy',
          data: teacherHoursData.map(([, hours]) => hours.toFixed(1)),
          backgroundColor: chartTheme.success,
          borderRadius: 6,
          barThickness: 20,
        },
      ],
    };
  
    const testClassesChartData = {
      labels: testClassData.map(([name]) => name),
      datasets: [
        {
          label: 'Số lớp Test',
          data: testClassData.map(([, count]) => count),
          backgroundColor: '#f97316', // Orange 500
          borderRadius: 6,
          barThickness: 20,
        },
      ],
    };
  
    const statusChartData = {
      labels: ['Chưa có GV', 'Đã phân công', 'Hoàn thành'],
      datasets: [
        {
          data: [stats.pendingClasses, stats.assignedClasses, stats.completedClasses],
          backgroundColor: [chartTheme.danger, chartTheme.primary, chartTheme.success],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  
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
            <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
            <p className="text-secondary-500 mt-1">Tổng quan hoạt động hệ thống</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="hidden md:flex">
              <Clock className="w-4 h-4 mr-2" />
              Cập nhật: {format(new Date(), 'HH:mm')}
            </Button>
          </div>
        </div>
  
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-secondary-700 min-w-max">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Bộ lọc:</span>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-4 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
                <option value="all">Tất cả giáo viên</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
  
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
  
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
        </Card>
  
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tổng giáo viên"
            value={stats.totalTeachers}
            icon={Users}
            color="indigo"
          />
          <StatsCard
            title="Lớp Test"
            value={stats.totalTestClasses}
            icon={ClipboardCheck}
            color="purple"
          />
  
          <StatsCard
            title="Lớp Offset"
            value={stats.totalOffsetClasses}
            icon={BookMarked}
            color="blue"
          />
        </div>
  
        {/* Charts Grid Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-secondary-900">Thống kê giờ dạy</h3>
              <select className="text-xs bg-secondary-50 border-none rounded-lg px-2 py-1 text-secondary-600 focus:ring-0">
                <option>Tháng này</option>
                <option>Tháng trước</option>
              </select>
            </div>
            <div className="h-80">
              <Bar data={teachingHoursChartData} options={commonOptions} />
            </div>
          </Card>
  
          {/* Status Chart */}
          <Card>
            <h3 className="text-lg font-bold text-secondary-900 mb-6">Trạng thái lớp</h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut 
                data={statusChartData} 
                options={{
                  ...commonOptions,
                  cutout: '70%',
                  plugins: {
                    ...commonOptions.plugins,
                    legend: { position: 'bottom' }
                  },
                  scales: { display: false } // REMOVED: Invalid for Doughnut
                }} 
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-secondary-500">Chờ</p>
                <p className="font-bold text-danger-600">{stats.pendingClasses}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Đã gán</p>
                <p className="font-bold text-primary-600">{stats.assignedClasses}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Xong</p>
                <p className="font-bold text-success-600">{stats.completedClasses}</p>
              </div>
            </div>
          </Card>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Classes Chart */}
          <Card>
            <h3 className="text-lg font-bold text-secondary-900 mb-6">Phân bố lớp Test</h3>
            <div className="h-80">
              <Bar data={testClassesChartData} options={commonOptions} />
            </div>
          </Card>
  
          {/* Supplementary Classes Chart */}
          <Card>
            <h3 className="text-lg font-bold text-secondary-900 mb-6">Phân bố lớp Bổ trợ</h3>
            <div className="h-80">
              <Bar data={supplementaryClassesChartData} options={commonOptions} />
            </div>
          </Card>
  
          {/* Offset Classes Chart */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-bold text-secondary-900 mb-6">Phân bố lớp Offset</h3>
            <div className="h-80">
              <Bar data={offsetClassesChartData} options={commonOptions} />
            </div>
          </Card>
        </div>
      </div>
    );
  };

export default Dashboard;
