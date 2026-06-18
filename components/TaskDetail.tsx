import React, { useState } from 'react';
import { Task, CheckItem, Board } from '../types';
import { Sparkles, Trash2, Plus, Calendar, Tag, Check, AlignLeft, X, Link as LinkIcon, AlertCircle, Clock, Search } from 'lucide-react';
import { generateSubtasks, generateBetterDescription } from '../services/geminiService';

interface TaskDetailProps {
  task: Task;
  allTasks: { [key: string]: Task }; // Needed for dependency selection
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
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

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, allTasks, onUpdate, onDelete }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newCheckItemText, setNewCheckItemText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isDepSelectOpen, setIsDepSelectOpen] = useState(false);
  const [depSearch, setDepSearch] = useState('');

  // Helper Handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ ...task, title: e.target.value });
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ ...task, description: e.target.value });
  
  const toggleCheckItem = (itemId: string) => {
    const updatedChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    onUpdate({ ...task, checklist: updatedChecklist });
  };

  const addCheckItem = () => {
    if (!newCheckItemText.trim()) return;
    const newItem: CheckItem = { id: Date.now().toString(), text: newCheckItemText.trim(), isCompleted: false };
    onUpdate({ ...task, checklist: [...task.checklist, newItem] });
    setNewCheckItemText('');
  };

  const removeCheckItem = (id: string) => onUpdate({ ...task, checklist: task.checklist.filter(i => i.id !== id) });

  const addTag = () => {
    if (!newTag.trim() || task.tags.includes(newTag.trim())) return;
    onUpdate({ ...task, tags: [...task.tags, newTag.trim()] });
    setNewTag('');
  };
  const removeTag = (t: string) => onUpdate({ ...task, tags: task.tags.filter(tag => tag !== t) });

  const toggleDependency = (depId: string) => {
    const newDeps = task.dependencies.includes(depId)
      ? task.dependencies.filter(id => id !== depId)
      : [...task.dependencies, depId];
    onUpdate({ ...task, dependencies: newDeps });
  };

  // Date Formatting for Input
  const getInputValue = (isoString?: string) => {
    if (!isoString) return '';
    // Format: YYYY-MM-DDThh:mm
    const date = new Date(isoString);
    // Simple local offset handling for input value
    const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    return localIso;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
        onUpdate({ ...task, dueDate: undefined });
        return;
    }
    const d = new Date(val);
    onUpdate({ ...task, dueDate: d.toISOString() });
  };
  
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(9, 0, 0, 0); // Default to 9 AM
    onUpdate({ ...task, dueDate: d.toISOString() });
  };


  // AI Actions
  const handleAiSubtasks = async () => {
    if (!process.env.API_KEY) { alert("Please set API_KEY env var"); return; }
    setIsAiLoading(true);
    try {
      const suggestions = await generateSubtasks(task.title, task.description);
      const newItems: CheckItem[] = suggestions.map((s, i) => ({ id: Date.now() + '-' + i, text: s, isCompleted: false }));
      onUpdate({ ...task, checklist: [...task.checklist, ...newItems] });
    } catch (e) { console.error(e); } finally { setIsAiLoading(false); }
  };

  const handleAiDescription = async () => {
    if (!process.env.API_KEY) { alert("Please set API_KEY env var"); return; }
    setIsAiLoading(true);
    try {
      const improved = await generateBetterDescription(task.title, task.description);
      onUpdate({ ...task, description: improved });
    } catch (e) { console.error(e); } finally { setIsAiLoading(false); }
  };

  const completedCount = task.checklist.filter(c => c.isCompleted).length;
  const totalCount = task.checklist.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Filter tasks for dependency selection
  const filteredTasks = (Object.values(allTasks) as Task[])
    .filter(t => t.id !== task.id)
    .filter(t => t.title.toLowerCase().includes(depSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-black uppercase tracking-wider">Activity Title</label>
        <input
          type="text"
          value={task.title}
          onChange={handleTitleChange}
          className="w-full text-2xl font-bold text-black border-none focus:ring-0 focus:outline-none p-0 bg-transparent placeholder-gray-400"
          placeholder="Task title..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Description, Checklist, Dependencies */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-black">
                <AlignLeft size={16} /> Description
              </label>
              <button onClick={handleAiDescription} disabled={isAiLoading} className="text-xs flex items-center gap-1 text-purple-700 hover:bg-purple-50 px-2 py-1 rounded">
                <Sparkles size={12} /> {isAiLoading ? 'Thinking...' : 'AI Rewrite'}
              </button>
            </div>
            <textarea
              value={task.description}
              onChange={handleDescriptionChange}
              rows={3}
              className="w-full p-3 rounded-lg border border-yellow-200 bg-yellow-50 focus:border-yellow-400 text-sm text-black placeholder-gray-500"
              placeholder="Add details..."
            />
          </div>

          {/* Dependencies Section */}
          <div className="space-y-3">
             <label className="flex items-center gap-2 text-sm font-semibold text-black">
                <LinkIcon size={16} /> Related Activities (Dependencies)
              </label>
              <div className="relative">
                <button 
                  onClick={() => setIsDepSelectOpen(!isDepSelectOpen)}
                  className="w-full flex items-center justify-between p-2 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-black hover:bg-yellow-100 transition-colors"
                >
                  <span>{task.dependencies.length > 0 ? `${task.dependencies.length} linked activities` : 'Select dependencies...'}</span>
                  <Plus size={14} />
                </button>
                
                {isDepSelectOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-hidden flex flex-col">
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-2 text-gray-400 pointer-events-none"/>
                            <input 
                                type="text"
                                value={depSearch}
                                onChange={(e) => setDepSearch(e.target.value)}
                                placeholder="Search tasks..."
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:border-blue-500 focus:outline-none placeholder-gray-400"
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    {/* List */}
                    <div className="overflow-y-auto max-h-48">
                        {filteredTasks.length === 0 ? (
                             <div className="p-3 text-center text-xs text-gray-400 italic">No matching activities found.</div>
                        ) : (
                            filteredTasks.map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => toggleDependency(t.id)}
                                className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                            >
                                <div className={`w-4 h-4 border rounded mr-3 flex-shrink-0 flex items-center justify-center transition-colors ${task.dependencies.includes(t.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                {task.dependencies.includes(t.id) && <Check size={10} className="text-white" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate text-black font-medium">{t.title}</span>
                                    <span className="text-[10px] text-gray-500 flex gap-2">
                                        <span className={PRIORITY_LABELS[t.priority] === 'Super' ? 'text-red-500' : ''}>{PRIORITY_LABELS[t.priority]} Priority</span>
                                        {t.tags.length > 0 && <span>• {t.tags[0]}</span>}
                                    </span>
                                </div>
                            </div>
                            ))
                        )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Dependencies List */}
              {task.dependencies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {task.dependencies.map(depId => {
                    const depTask = allTasks[depId];
                    if (!depTask) return null;
                    return (
                      <span key={depId} className="flex items-center gap-1 bg-purple-50 text-purple-900 px-2 py-1 rounded-md text-xs border border-purple-100 animate-in fade-in zoom-in duration-200">
                        <LinkIcon size={10} />
                        <span className="max-w-[150px] truncate">{depTask.title}</span>
                        <button onClick={() => toggleDependency(depId)} className="hover:text-red-600 ml-1 p-0.5 rounded-full hover:bg-purple-100 transition-colors"><X size={12}/></button>
                      </span>
                    );
                  })}
                </div>
              )}
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-black">
                <Check size={16} /> Checklist
              </label>
              <button onClick={handleAiSubtasks} disabled={isAiLoading} className="text-xs flex items-center gap-1 text-purple-700 hover:bg-purple-50 px-2 py-1 rounded">
                <Sparkles size={12} /> {isAiLoading ? 'Working...' : 'AI Plan'}
              </button>
            </div>
            {totalCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-black w-8">{Math.round(progress)}%</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <div className="space-y-2">
              {task.checklist.map(item => (
                <div key={item.id} className="flex items-start group">
                  <input type="checkbox" checked={item.isCompleted} onChange={() => toggleCheckItem(item.id)} className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <span className={`ml-3 flex-1 text-sm ${item.isCompleted ? 'text-gray-400 line-through' : 'text-black'}`}>{item.text}</span>
                  <button onClick={() => removeCheckItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 flex items-center bg-yellow-50 rounded-md border border-yellow-200 px-3 py-1.5 focus-within:border-yellow-400">
                <Plus size={16} className="text-black/50 mr-2" />
                <input 
                  type="text" 
                  value={newCheckItemText} 
                  onChange={(e) => setNewCheckItemText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && addCheckItem()} 
                  className="flex-1 text-sm border-none focus:ring-0 p-0 bg-transparent text-black placeholder-gray-500" 
                  placeholder="Add item" 
                />
              </div>
              <button onClick={addCheckItem} className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-black font-medium">Add</button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Metadata */}
        <div className="space-y-6">
          
          {/* Priority Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
               <label className="text-xs font-semibold text-black uppercase">Priority</label>
               <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                   task.priority === 1 ? 'bg-red-100 text-red-700' : 
                   task.priority === 5 ? 'bg-slate-100 text-slate-700' :
                   'bg-blue-50 text-blue-700'
               }`}>
                 {PRIORITY_LABELS[task.priority]}
               </span>
            </div>
            <input 
              type="range" min="1" max="5" step="1" 
              value={task.priority}
              onChange={(e) => onUpdate({...task, priority: parseInt(e.target.value)})}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
             <div className="flex justify-between text-[10px] text-gray-500 font-medium">
              <span>Super</span>
              <span>Optional</span>
            </div>
          </div>

          {/* Impact Slider */}
          <div className="space-y-2">
             <div className="flex justify-between items-center">
               <label className="text-xs font-semibold text-black uppercase">Impact</label>
               <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                   task.impact === 5 ? 'bg-purple-100 text-purple-700' :
                   task.impact === 1 ? 'bg-slate-100 text-slate-700' :
                   'bg-gray-100 text-black'
               }`}>
                   {IMPACT_LABELS[task.impact]}
               </span>
            </div>
            <input 
              type="range" min="1" max="5" step="1" 
              value={task.impact}
              onChange={(e) => onUpdate({...task, impact: parseInt(e.target.value)})}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-medium">
              <span>Optional</span>
              <span>Super</span>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-black uppercase">Due Date & Time</label>
              <div className="flex gap-1">
                <button onClick={() => setQuickDate(0)} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded text-black">Today</button>
                <button onClick={() => setQuickDate(1)} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded text-black">Tmrw</button>
              </div>
            </div>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-2.5 text-black" />
              <input 
                type="datetime-local" 
                value={getInputValue(task.dueDate)} 
                onChange={handleDateChange} 
                className="w-full pl-9 pr-3 py-2 text-sm border border-yellow-200 rounded-md bg-yellow-50 text-black focus:border-yellow-400" 
              />
            </div>
          </div>
          
          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-black uppercase">Duration (Minutes)</label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-2.5 text-black" />
              <input 
                type="number" 
                min="15" 
                step="15"
                value={task.duration || 60} 
                onChange={(e) => onUpdate({ ...task, duration: parseInt(e.target.value) })} 
                className="w-full pl-9 pr-3 py-2 text-sm border border-yellow-200 rounded-md bg-yellow-50 text-black focus:border-yellow-400" 
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-black uppercase">Tags</label>
            <div className="flex flex-wrap gap-2">
              {task.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-gray-100 text-black px-2 py-1 rounded text-xs font-medium">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
               <input 
                type="text" 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && addTag()} 
                className="flex-1 text-xs border border-yellow-200 bg-yellow-50 rounded px-2 py-1.5 text-black placeholder-gray-500 focus:border-yellow-400" 
                placeholder="New tag" 
               />
              <button onClick={addTag} className="bg-gray-100 px-2 rounded text-black hover:bg-gray-200"><Plus size={14} /></button>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button onClick={() => onDelete(task.id)} className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-md transition-colors text-sm font-medium">
              <Trash2 size={16} /> Delete Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};