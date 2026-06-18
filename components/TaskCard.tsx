import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { CheckSquare, Clock, AlignLeft, BarChart2, AlertCircle, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: string;
  onClick: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string, sourceColId: string) => void;
  onDrop: (e: React.DragEvent, targetTaskId: string, targetColId: string) => void;
  onDelete?: () => void;
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Super',
  2: 'Top',
  3: 'Normal',
  4: 'Low',
  5: 'Optional'
};

const IMPACT_LABELS: Record<number, string> = {
  1: 'Optional',
  2: 'Low',
  3: 'Normal',
  4: 'Top',
  5: 'Super'
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, columnId, onClick, onDragStart, onDrop, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const completedChecks = task.checklist.filter(c => c.isCompleted).length;
  const totalChecks = task.checklist.length;
  const progress = totalChecks === 0 ? 0 : Math.round((completedChecks / totalChecks) * 100);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Priority Color Logic
  const getPriorityColor = (p: number) => {
    if (p <= 1) return 'bg-red-100 text-red-900 border-red-200';
    if (p <= 2) return 'bg-orange-100 text-orange-900 border-orange-200';
    if (p <= 3) return 'bg-yellow-100 text-yellow-900 border-yellow-200';
    if (p <= 4) return 'bg-blue-100 text-blue-900 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onClick(task);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete && window.confirm("Are you sure you want to delete this activity?")) {
      onDelete();
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Drag Handlers for Reordering
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to Column
    setIsDragOver(false);
    onDrop(e, task.id, columnId);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id, columnId)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onClick(task)}
      className={`bg-white p-3 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing hover:shadow-md transition-all group mb-2 relative ${
        isDragOver ? 'border-t-4 border-t-blue-500 border-x-slate-200 border-b-slate-200' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-wrap gap-1 pr-6">
          <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${getPriorityColor(task.priority)}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
           <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200" title="Impact">
            {IMPACT_LABELS[task.impact]} Impact
          </span>
          {task.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-black font-medium border border-slate-200">
              {tag}
            </span>
          ))}
        </div>
        
        {/* 3 Dots Menu */}
        <div className="absolute top-2 right-2">
            <button 
                onClick={handleMenuToggle}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <MoreHorizontal size={16} />
            </button>
            
            {showMenu && (
                <div ref={menuRef} className="absolute right-0 top-6 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button 
                        onClick={handleEditClick} 
                        className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 ${onDelete ? 'rounded-t-md' : 'rounded-md'}`}
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                    {onDelete && (
                    <button 
                        onClick={handleDeleteClick} 
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-md"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                    )}
                </div>
            )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-black mb-1 group-hover:text-blue-800 transition-colors pr-2">
        {task.title}
      </h3>

      {task.description && (
        <div className="flex items-center text-xs text-black mb-2">
          <AlignLeft size={12} className="mr-1" />
          <span className="truncate max-w-[150px]">Has description</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
        <div className="flex gap-3">
          {totalChecks > 0 && (
            <div 
              className={`flex items-center text-xs px-1.5 py-0.5 rounded ${
                progress === 100 ? 'bg-green-100 text-green-900' : 'text-black'
              }`}
            >
              <CheckSquare size={12} className="mr-1" />
              <span>{completedChecks}/{totalChecks}</span>
            </div>
          )}
          {task.dependencies.length > 0 && (
             <div className="flex items-center text-xs text-purple-900" title="Dependencies">
               <AlertCircle size={12} className="mr-1" />
               <span>{task.dependencies.length}</span>
             </div>
          )}
        </div>
        
        {task.dueDate && (
          <div className={`flex items-center text-xs ml-auto ${
            new Date(task.dueDate) < new Date() ? 'text-red-700 font-bold' : 'text-black'
          }`}>
            <Clock size={12} className="mr-1" />
            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
      
      {totalChecks > 0 && progress < 100 && (
        <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </div>
  );
};