import React from 'react';
import { Filter, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const ScheduleFilters = ({
  filterTeacher,
  setFilterTeacher,
  teachers,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  filterTimePeriod,
  setFilterTimePeriod,
  viewMode,
  setViewMode,
  onCurrentWeekClick,
  onPrevWeek,
  onNextWeek
}) => {
  return (
    <Card className="mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-secondary-500">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Bộ lọc:</span>
          </div>
          
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white min-w-[200px]"
          >
            <option value="">Tất cả giáo viên</option>
            {teachers.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          <select
            value={filterTimePeriod}
            onChange={(e) => setFilterTimePeriod(e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white min-w-[160px]"
          >
            <option value="">Tất cả thời gian</option>
            <option value="morning">🌅 Sáng (8h-12h)</option>
            <option value="afternoon">☀️ Chiều (13h-17h)</option>
            <option value="evening">🌆 Tối (17h-21h)</option>
          </select>

          <div className="flex items-center gap-2 bg-secondary-50 p-1 rounded-lg border border-secondary-200">
            <button 
              onClick={onPrevWeek}
              className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-secondary-500 hover:text-secondary-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 px-2">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 p-0 w-[110px] text-secondary-700 font-medium"
              />
              <span className="text-secondary-400">-</span>
              <input
                type="date"
                value={filterEndDate}
                min={filterStartDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 p-0 w-[110px] text-secondary-700 font-medium"
              />
            </div>

            <button 
              onClick={onNextWeek}
              className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-secondary-500 hover:text-secondary-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCurrentWeekClick}
            className="text-primary-600 hover:bg-primary-50 border border-primary-200"
          >
            Tuần này
          </Button>
        </div>

        <div className="flex gap-2 w-full lg:w-auto bg-secondary-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              viewMode === 'calendar' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Bảng tuần
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              viewMode === 'list' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <User className="w-4 h-4" />
            Theo giáo viên
          </button>
        </div>
      </div>
    </Card>
  );
};

export default ScheduleFilters;
