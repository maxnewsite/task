import React, { useState, useMemo } from 'react';
import { Board, Task, Column } from '../types';
import { TaskCard } from './TaskCard';
import { Modal } from './Modal';
import { TaskDetail } from './TaskDetail';
import { PriorityView, MatrixView, GraphView, CalendarView } from './AnalyticsViews';
import { Plus, Layout, Search, MoreHorizontal, BarChart2, Calendar, Network, ListOrdered, ArrowLeft } from 'lucide-react';

type ViewMode = 'board' | 'priority' | 'matrix' | 'graph' | 'calendar';

interface ProjectViewProps {
  board: Board;
  onUpdateBoard: (board: Board) => void;
  onBack: () => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ board, onUpdateBoard, onBack }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedSourceColId, setDraggedSourceColId] = useState<string | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Flatten tasks for analytics
  const allBoardTasks = useMemo(() => {
    // Find abandoned columns
    const abandonedColIds = (Object.values(board.columns) as Column[])
      .filter(col => col.title.trim().toLowerCase() === 'abandoned')
      .map(col => col.id);

    const abandonedTaskIds = new Set<string>();
    abandonedColIds.forEach(colId => {
      board.columns[colId].taskIds.forEach(taskId => abandonedTaskIds.add(taskId));
    });

    return (Object.values(board.tasks) as Task[]).filter(task => !abandonedTaskIds.has(task.id));
  }, [board]);


  // --- Logic ---
  const addColumn = () => {
    const newColId = `col-${Date.now()}`;
    const newCol: Column = { id: newColId, title: 'New List', taskIds: [] };
    
    onUpdateBoard({
      ...board,
      columns: { ...board.columns, [newColId]: newCol },
      columnOrder: [...board.columnOrder, newColId]
    });
  };

  const addTask = (columnId: string) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      title: 'New Activity',
      description: '',
      priority: 3,
      impact: 3,
      checklist: [],
      tags: [],
      dependencies: [],
      createdAt: Date.now()
    };

    onUpdateBoard({
      ...board,
      tasks: { ...board.tasks, [newTaskId]: newTask },
      columns: {
        ...board.columns,
        [columnId]: {
          ...board.columns[columnId],
          taskIds: [...board.columns[columnId].taskIds, newTaskId]
        }
      }
    });
    
    setEditingTask(newTask);
    setIsModalOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    onUpdateBoard({
      ...board,
      tasks: { ...board.tasks, [updatedTask.id]: updatedTask }
    });
    setEditingTask(updatedTask);
  };

  // Lightweight in-place update used by analytics views (matrix, priority, calendar, graph).
  // Does not touch editingTask so it works while the modal is closed.
  const handleAnalyticsTaskUpdate = (updatedTask: Task) => {
    onUpdateBoard({
      ...board,
      tasks: { ...board.tasks, [updatedTask.id]: updatedTask }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const newTasks = { ...board.tasks };
    delete newTasks[taskId];

    const newColumns = { ...board.columns };
    Object.keys(newColumns).forEach(colId => {
      newColumns[colId] = {
        ...newColumns[colId],
        taskIds: newColumns[colId].taskIds.filter(id => id !== taskId)
      };
    });

    onUpdateBoard({ ...board, tasks: newTasks, columns: newColumns });
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleUpdateColumnTitle = (colId: string, newTitle: string) => {
    onUpdateBoard({
      ...board,
      columns: {
        ...board.columns,
        [colId]: { ...board.columns[colId], title: newTitle }
      }
    });
  };

  const handleDeleteColumn = (colId: string) => {
    if (!window.confirm("Delete this list and all its tasks?")) return;
    
    const colTasks = board.columns[colId].taskIds;
    const newTasks = { ...board.tasks };
    colTasks.forEach(tId => delete newTasks[tId]);

    const newColumns = { ...board.columns };
    delete newColumns[colId];
    
    const newOrder = board.columnOrder.filter(id => id !== colId);

    onUpdateBoard({
      ...board,
      tasks: newTasks,
      columns: newColumns,
      columnOrder: newOrder
    });
  };

  // --- Drag and Drop ---
  const onTaskDragStart = (e: React.DragEvent, taskId: string, sourceColId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
    setDraggedSourceColId(sourceColId);
  };

  const onColumnDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColumnId(colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedTaskId && dragOverColId !== colId) setDragOverColId(colId);
  };

  // Handled when dropping on a specific Task Card (Insert logic)
  const onTaskDrop = (e: React.DragEvent, targetTaskId: string, targetColId: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    setDragOverColId(null);

    if (!draggedTaskId || !draggedSourceColId) return;
    if (draggedTaskId === targetTaskId) return;

    const sourceColumn = board.columns[draggedSourceColId];
    const destColumn = board.columns[targetColId];
    
    const newSourceTaskIds = sourceColumn.taskIds.filter(id => id !== draggedTaskId);
    let newDestTaskIds: string[];

    if (draggedSourceColId === targetColId) {
        // Same column reorder
        newDestTaskIds = [...newSourceTaskIds];
        const targetIndex = newDestTaskIds.indexOf(targetTaskId);
        if (targetIndex !== -1) {
            newDestTaskIds.splice(targetIndex, 0, draggedTaskId);
        } else {
            newDestTaskIds.push(draggedTaskId);
        }
        
        onUpdateBoard({
            ...board,
            columns: {
                ...board.columns,
                [draggedSourceColId]: { ...sourceColumn, taskIds: newDestTaskIds }
            }
        });
    } else {
        // Different column move
        newDestTaskIds = [...destColumn.taskIds];
        const targetIndex = newDestTaskIds.indexOf(targetTaskId);
        if (targetIndex !== -1) {
             newDestTaskIds.splice(targetIndex, 0, draggedTaskId);
        } else {
             newDestTaskIds.push(draggedTaskId);
        }

        onUpdateBoard({
            ...board,
            columns: {
                ...board.columns,
                [draggedSourceColId]: { ...sourceColumn, taskIds: newSourceTaskIds },
                [targetColId]: { ...destColumn, taskIds: newDestTaskIds }
            }
        });
    }
    
    setDraggedTaskId(null);
    setDraggedSourceColId(null);
  };

  // Handled when dropping on the Column background (Append logic)
  const onColumnDrop = (e: React.DragEvent, destColId: string) => {
    e.preventDefault();
    setDragOverColId(null);

    // Task Drop (Append to end)
    if (draggedTaskId && draggedSourceColId) {
        if (draggedSourceColId === destColId) {
            // Dragged to same column but not on a specific task -> Move to end
            const sourceColumn = board.columns[draggedSourceColId];
            const newSourceTaskIds = sourceColumn.taskIds.filter(id => id !== draggedTaskId);
            newSourceTaskIds.push(draggedTaskId);

             onUpdateBoard({
                ...board,
                columns: {
                    ...board.columns,
                    [draggedSourceColId]: { ...sourceColumn, taskIds: newSourceTaskIds }
                }
            });
        } else {
            // Dragged to different column -> Append to end
            const sourceColumn = board.columns[draggedSourceColId];
            const destColumn = board.columns[destColId];
            const newSourceTaskIds = sourceColumn.taskIds.filter(id => id !== draggedTaskId);
            const newDestTaskIds = [...destColumn.taskIds, draggedTaskId];
    
            onUpdateBoard({
                ...board,
                columns: {
                    ...board.columns,
                    [draggedSourceColId]: { ...sourceColumn, taskIds: newSourceTaskIds },
                    [destColId]: { ...destColumn, taskIds: newDestTaskIds }
                }
            });
        }
        setDraggedTaskId(null);
        setDraggedSourceColId(null);
        return;
    }

    // Column Reorder Drop
    if (draggedColumnId) {
        if (draggedColumnId !== destColId) {
            const newOrder = [...board.columnOrder];
            const oldIdx = newOrder.indexOf(draggedColumnId);
            const newIdx = newOrder.indexOf(destColId);
            
            if (oldIdx !== -1 && newIdx !== -1) {
                newOrder.splice(oldIdx, 1);
                newOrder.splice(newIdx, 0, draggedColumnId);
                onUpdateBoard({ ...board, columnOrder: newOrder });
            }
        }
        setDraggedColumnId(null);
    }
  };

  const NavButton = ({ mode, icon: Icon, label }: { mode: ViewMode, icon: any, label: string }) => (
    <button 
        onClick={() => setViewMode(mode)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === mode ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        <Icon size={18} />
        <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <header className="flex-none h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <input 
                type="text" 
                value={board.title}
                onChange={(e) => onUpdateBoard({ ...board, title: e.target.value })}
                className="font-bold text-slate-800 text-lg tracking-tight hidden md:block bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none transition-all w-64 lg:w-96 truncate"
            />
          </div>
          
          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

          <nav className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
             <NavButton mode="board" icon={Layout} label="Board" />
             <NavButton mode="priority" icon={ListOrdered} label="Priority" />
             <NavButton mode="matrix" icon={BarChart2} label="Matrix" />
             <NavButton mode="graph" icon={Network} label="Graph" />
             <NavButton mode="calendar" icon={Calendar} label="Calendar" />
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-2 text-slate-400" size={16} />
            <input type="text" placeholder="Search activities..." className="pl-9 pr-4 py-1.5 text-sm bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full w-48" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {viewMode === 'board' && (
             <div className="h-full overflow-x-auto overflow-y-hidden">
                <div className="h-full flex items-start p-6 gap-6 min-w-max">
                {board.columnOrder.map((colId) => {
                    const column = board.columns[colId];
                    const tasks = column.taskIds.map(id => board.tasks[id]).filter(Boolean);
                    return (
                    <div 
                        key={colId}
                        draggable
                        onDragStart={(e) => onColumnDragStart(e, colId)}
                        onDragOver={(e) => onDragOver(e, colId)}
                        onDrop={(e) => onColumnDrop(e, colId)}
                        className={`w-80 flex-shrink-0 flex flex-col max-h-full rounded-xl transition-all duration-200 ${
                            dragOverColId === colId ? 'bg-blue-50/80 ring-2 ring-blue-300' : 'bg-white'
                        } ${draggedColumnId === colId ? 'opacity-50 scale-95' : 'opacity-100 shadow-sm'}`}
                    >
                        <div className="flex items-center justify-between p-3 flex-none cursor-grab active:cursor-grabbing border-b border-transparent hover:border-slate-100">
                        <input 
                            className="font-semibold text-black bg-transparent border-transparent focus:border-blue-400 focus:ring-0 rounded px-1 py-0.5 truncate w-full mr-2"
                            value={column.title}
                            onChange={(e) => handleUpdateColumnTitle(colId, e.target.value)}
                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center">
                            <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full mr-2">{tasks.length}</span>
                            <button onClick={() => handleDeleteColumn(colId)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500"><MoreHorizontal size={16} /></button>
                        </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 pb-2 pt-2 scrollbar-hide space-y-2 min-h-[100px]">
                        {tasks.map((task, index) => (
                            <TaskCard 
                            key={task.id} 
                            task={task} 
                            index={index} 
                            columnId={colId}
                            onClick={() => { setEditingTask(task); setIsModalOpen(true); }}
                            onDragStart={onTaskDragStart}
                            onDrop={onTaskDrop}
                            onDelete={() => handleDeleteTask(task.id)}
                            />
                        ))}
                        {tasks.length === 0 && (
                            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">Drop here</div>
                        )}
                        </div>
                        <div className="p-2 flex-none">
                        <button onClick={() => addTask(colId)} className="w-full flex items-center gap-2 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium">
                            <Plus size={16} /> Add a card
                        </button>
                        </div>
                    </div>
                    );
                })}
                <div className="w-80 flex-shrink-0">
                    <button onClick={addColumn} className="w-full h-12 flex items-center justify-center gap-2 bg-white/50 hover:bg-white border border-dashed border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600 rounded-xl transition-all font-medium shadow-sm">
                        <Plus size={20} /> Add another list
                    </button>
                </div>
                </div>
             </div>
        )}

        {viewMode === 'priority' && <PriorityView tasks={allBoardTasks} onTaskClick={(t) => { setEditingTask(t); setIsModalOpen(true); }} onTaskUpdate={handleAnalyticsTaskUpdate} />}
        {viewMode === 'matrix' && <MatrixView tasks={allBoardTasks} onTaskClick={(t) => { setEditingTask(t); setIsModalOpen(true); }} onTaskUpdate={handleAnalyticsTaskUpdate} />}
        {viewMode === 'graph' && <GraphView tasks={allBoardTasks} onTaskClick={(t) => { setEditingTask(t); setIsModalOpen(true); }} onTaskUpdate={handleAnalyticsTaskUpdate} />}
        {viewMode === 'calendar' && <CalendarView tasks={allBoardTasks} onTaskClick={(t) => { setEditingTask(t); setIsModalOpen(true); }} onTaskUpdate={handleAnalyticsTaskUpdate} />}

      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        title={editingTask?.title}
      >
        {editingTask && (
          <TaskDetail 
            task={editingTask}
            allTasks={board.tasks}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        )}
      </Modal>
    </div>
  );
};