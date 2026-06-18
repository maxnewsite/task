import React, { useState } from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlignJustify } from 'lucide-react';

interface ViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const PRIORITY_LABELS: Record<number, string> = {
    1: 'Super',
    2: 'Top',
    3: 'Normal',
    4: 'Low',
    5: 'Optional'
};

// 1. Priority View (List sorted by priority 1-5)
export const PriorityView: React.FC<ViewProps> = ({ tasks, onTaskClick }) => {
  const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<number, Task[]>;
  tasks.forEach(t => {
    const p = Math.max(1, Math.min(5, t.priority || 3));
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(t);
  });

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Priority Breakdown</h2>
      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map(level => (
          <div key={level} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-4 py-3 font-bold text-sm border-b flex justify-between items-center ${
              level === 1 ? 'bg-red-50 text-red-800 border-red-100' : 
              level === 2 ? 'bg-orange-50 text-orange-800 border-orange-100' :
              level === 3 ? 'bg-yellow-50 text-yellow-800 border-yellow-100' :
              level === 4 ? 'bg-blue-50 text-blue-800 border-blue-100' :
              'bg-slate-50 text-slate-700 border-slate-100'
            }`}>
              <span>{PRIORITY_LABELS[level]} Priority</span>
              <span className="bg-white px-2 py-0.5 rounded text-xs border opacity-75">{grouped[level].length} tasks</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[level].length === 0 ? (
                 <div className="text-sm text-gray-400 italic">No activities in this priority level.</div>
              ) : (
                grouped[level].map(task => (
                  <div key={task.id} onClick={() => onTaskClick(task)} className="cursor-pointer hover:ring-2 ring-blue-400 rounded-lg">
                    <TaskCard task={task} index={0} columnId="view" onClick={onTaskClick} onDragStart={() => {}} />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Matrix View (Impact vs Priority)
export const MatrixView: React.FC<ViewProps> = ({ tasks, onTaskClick }) => {
  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <h2 className="text-2xl font-bold mb-4 text-slate-800">Impact / Priority Matrix</h2>
      <div className="flex-1 relative bg-white rounded-xl shadow-sm border border-slate-200 m-4 overflow-hidden">
        {/* Axis Labels */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-slate-400 tracking-widest uppercase text-center">
          Priority<br/><span className="text-[10px] opacity-75">(Optional &rarr; Super)</span>
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 tracking-widest uppercase text-center">
          Impact <span className="text-[10px] opacity-75">(Optional &rarr; Super)</span>
        </div>

        {/* Quadrant Lines */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {/* Top Left: Super Priority, Optional Impact */}
            <div className="border-r border-b border-dashed border-slate-200 bg-orange-50/20 p-2 flex items-start justify-start">
                <span className="text-xs text-orange-400 font-bold uppercase p-2">Quick Fix</span>
            </div>
            
            {/* Top Right: Super Priority, Super Impact */}
            <div className="border-b border-dashed border-slate-200 bg-red-50/20 p-2 flex items-start justify-end">
                <span className="text-xs text-red-400 font-bold uppercase p-2">Critical Focus</span>
            </div>
            
            {/* Bottom Left: Optional Priority, Optional Impact */}
            <div className="border-r border-dashed border-slate-200 bg-slate-50/20 p-2 flex items-end justify-start">
                <span className="text-xs text-slate-400 font-bold uppercase p-2">Eliminate</span>
            </div>
            
            {/* Bottom Right: Optional Priority, Super Impact */}
            <div className="bg-blue-50/20 p-2 flex items-end justify-end">
                <span className="text-xs text-blue-400 font-bold uppercase p-2">Strategic Plan</span>
            </div>
        </div>

        {/* Plot Area */}
        <div className="absolute inset-8">
           {tasks.map(task => {
             // Priority (Y): 1 (Top) to 5 (Bottom)
             const top = ((task.priority - 1) / 4) * 90 + 5; 
             // Impact (X): 1 (Left) to 5 (Right)
             const left = ((task.impact - 1) / 4) * 90 + 5;
             
             return (
               <div 
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer hover:scale-110 hover:z-10 transition-transform group"
                  style={{ top: `${top}%`, left: `${left}%` }}
               >
                 {task.priority}
                 <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-opacity">
                   {task.title}
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

// 3. Knowledge Graph View
export const GraphView: React.FC<ViewProps> = ({ tasks, onTaskClick }) => {
  const getDepth = (taskId: string, visited = new Set<string>()): number => {
    if (visited.has(taskId)) return 0; // Cycle detected
    visited.add(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies || task.dependencies.length === 0) return 0;
    
    const depths = task.dependencies.map(dId => getDepth(dId, new Set(visited)));
    return Math.max(...depths) + 1;
  };

  const levels: Record<number, Task[]> = {};
  tasks.forEach(t => {
    const depth = getDepth(t.id);
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(t);
  });

  const maxLevel = Math.max(...Object.keys(levels).map(Number));

  return (
    <div className="p-6 h-full overflow-hidden bg-slate-50 flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-slate-800">Activity Graph</h2>
      <div className="flex-1 overflow-auto bg-slate-100 rounded-xl border border-slate-200 relative p-8">
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
        </svg>
        <div className="flex gap-12 h-full min-w-max">
            {Array.from({ length: maxLevel + 1 }).map((_, i) => {
                const levelTasks = levels[i] || [];
                return (
                    <div key={i} className="w-64 flex flex-col justify-center gap-4 z-10">
                        <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            {i === 0 ? 'Foundation Activities' : i === maxLevel ? 'Ultimate Goal' : `Phase ${i}`}
                        </div>
                        {levelTasks.map(t => (
                            <div key={t.id} className="relative group">
                                <div onClick={() => onTaskClick(t)} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 transition-colors">
                                    <div className="text-xs font-bold text-black mb-1">P{t.priority}</div>
                                    <div className="text-sm font-semibold text-black">{t.title}</div>
                                    {t.dependencies.length > 0 && (
                                        <div className="mt-2 text-[10px] text-black">Depends on {t.dependencies.length} tasks</div>
                                    )}
                                </div>
                                {/* Draw connector hint */}
                                {t.dependencies.length > 0 && (
                                    <div className="absolute top-1/2 -left-4 w-4 h-px bg-slate-300"></div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

// 4. Calendar View (Supports Month and Week)
export const CalendarView: React.FC<ViewProps> = ({ tasks, onTaskClick }) => {
  const [viewType, setViewType] = useState<'month' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewType === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewType === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => setCurrentDate(new Date());

  const getPriorityBorderColor = (p: number) => {
    if (p <= 1) return 'border-red-500';
    if (p <= 2) return 'border-orange-500';
    if (p <= 3) return 'border-yellow-500';
    if (p <= 4) return 'border-blue-500'; // Low
    return 'border-slate-400'; // Optional
  };

  // Render Week View
  const renderWeekView = () => {
    // Calculate start of week (Sunday)
    const day = currentDate.getDay(); // 0 is Sunday
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white rounded-lg border border-slate-200">
            {/* Week Header */}
            <div className="flex border-b border-slate-200">
                <div className="w-16 flex-none border-r border-slate-200"></div>
                {weekDays.map(d => (
                    <div key={d.toISOString()} className="flex-1 py-3 text-center border-r border-slate-100 last:border-0">
                        <div className="text-xs font-semibold text-slate-400 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className={`text-xl font-bold mt-1 ${
                            d.toDateString() === new Date().toDateString() 
                                ? 'bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' 
                                : 'text-slate-700'
                        }`}>
                            {d.getDate()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="flex">
                    {/* Time Column */}
                    <div className="w-16 flex-none text-right pr-2 pt-2 space-y-[44px] border-r border-slate-200 bg-slate-50 text-xs text-slate-400 font-medium">
                        {hours.map(h => (
                            <div key={h} className="h-[60px] -mt-2">
                                {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                            </div>
                        ))}
                    </div>

                    {/* Days Columns & Grid Lines */}
                    <div className="flex-1 flex relative">
                        {/* Vertical Grid Lines */}
                        {weekDays.map((_, i) => (
                            <div key={i} className="flex-1 border-r border-slate-100 h-full min-h-[960px]"></div>
                        ))}

                        {/* Horizontal Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none w-full">
                            {hours.map((_, i) => (
                                <div key={i} className="h-[60px] border-b border-slate-100 w-full"></div>
                            ))}
                        </div>

                        {/* Tasks */}
                        {tasks.map(task => {
                            if (!task.dueDate) return null;
                            const taskDate = new Date(task.dueDate);
                            
                            // Check if task falls in this week
                            const timeDiff = taskDate.getTime() - startOfWeek.getTime();
                            const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
                            
                            if (dayDiff < 0 || dayDiff > 6) return null;

                            // Calculate Top position based on time (relative to 6 AM start)
                            const startHour = 6;
                            const taskHour = taskDate.getHours();
                            const taskMin = taskDate.getMinutes();
                            
                            if (taskHour < startHour) return null; // Too early to show?
                            
                            // Each hour is 60px height
                            const top = ((taskHour - startHour) * 60) + taskMin;
                            const height = task.duration || 60; // 1 min = 1px height
                            
                            const left = `${(dayDiff / 7) * 100}%`;
                            const width = `${100 / 7}%`;

                            return (
                                <div
                                    key={task.id}
                                    onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                    className={`absolute px-2 py-1 mx-1 rounded-md text-xs shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden border-l-4 bg-yellow-100 text-black ${getPriorityBorderColor(task.priority)}`}
                                    style={{
                                        top: `${top}px`,
                                        height: `${height}px`,
                                        left: `calc(${left})`,
                                        width: `calc(${width} - 8px)`,
                                        zIndex: 10
                                    }}
                                >
                                    <div className="font-bold truncate">{task.title}</div>
                                    <div className="opacity-90 truncate text-[10px]">
                                        {taskDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

    return (
         <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {blanks.map(b => <div key={`blank-${b}`} className="bg-slate-50/50 border-r border-b border-slate-100"></div>)}
                {days.map(d => {
                    const dateStr = new Date(currentYear, currentMonth, d).toISOString().split('T')[0];
                    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
                    const isToday = d === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

                    return (
                        <div key={d} className={`border-r border-b border-slate-100 p-2 min-h-[100px] overflow-hidden hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50' : ''}`}>
                            <div className={`text-xs font-bold mb-1 ${
                                isToday ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-500'
                            }`}>{d}</div>
                            
                            <div className="space-y-1">
                                {dayTasks.map(t => (
                                    <div 
                                        key={t.id} 
                                        onClick={() => onTaskClick(t)}
                                        className={`px-1.5 py-1 rounded text-[10px] truncate cursor-pointer bg-yellow-100 text-black border-l-2 ${getPriorityBorderColor(t.priority)}`}
                                    >
                                        {t.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="text-blue-600" />
                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                <button onClick={() => setViewType('month')} className={`px-3 py-1 text-sm font-medium rounded ${viewType === 'month' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Month</button>
                <button onClick={() => setViewType('week')} className={`px-3 py-1 text-sm font-medium rounded ${viewType === 'week' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Week</button>
            </div>
         </div>
         
         <div className="flex items-center gap-2">
             <button onClick={handlePrev} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600"><ChevronLeft size={16} /></button>
             <button onClick={handleToday} className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600">Today</button>
             <button onClick={handleNext} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600"><ChevronRight size={16} /></button>
         </div>
      </div>

      {viewType === 'week' ? renderWeekView() : renderMonthView()}
    </div>
  );
};
