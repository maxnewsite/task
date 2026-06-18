import React, { useState, useRef } from 'react';
import { Board } from '../types';
import { Plus, Upload, Download, Clock, Calendar, MoreVertical, Trash2, Layout, ArrowRight, FileText, FileVideo } from 'lucide-react';
import { Modal } from './Modal';

interface DashboardProps {
  boards: Board[];
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (title: string, description: string) => void;
  onImportBoards: (boards: Board[]) => void;
  onDeleteBoard: (boardId: string) => void;
  onExportAll: () => void;
  onOpenTikTokReport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  boards,
  onSelectBoard,
  onCreateBoard,
  onImportBoards,
  onDeleteBoard,
  onExportAll,
  onOpenTikTokReport
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onCreateBoard(newTitle, newDesc);
    setNewTitle('');
    setNewDesc('');
    setIsCreateModalOpen(false);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        let boardsToImport: Board[] = [];

        // Scenario 1: Full Database Backup (contains 'boards' array)
        // This handles the JSON format provided by "Backup Database"
        if (parsed.boards && Array.isArray(parsed.boards)) {
             boardsToImport = parsed.boards.filter((b: any) => b.id && b.columns && b.tasks);
        } 
        // Scenario 2: Single Project Export
        else if (parsed.id && parsed.columns && parsed.tasks) {
             boardsToImport = [parsed];
        }

        if (boardsToImport.length > 0) {
            onImportBoards(boardsToImport);
            alert(`Successfully imported ${boardsToImport.length} project(s).`);
        } else {
            alert('Invalid file format. Expected a TaskFlow Project or Database JSON.');
        }

      } catch (err) {
        console.error(err);
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow selecting the same file again
  };

  const exportBoard = (e: React.MouseEvent, board: Board) => {
    e.stopPropagation();
    const jsonString = JSON.stringify(board, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${board.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleDelete = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project? This cannot be undone.")) {
        onDeleteBoard(boardId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Projects</h1>
            <p className="text-slate-500 mt-1">Manage all your Kanban boards and tasks in one place.</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onOpenTikTokReport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <FileVideo size={16} /> TikTok Report
             </button>
             <button onClick={onExportAll} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <Download size={16} /> Backup Database
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <Upload size={16} /> Import Project
             </button>
             <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                <Plus size={18} /> New Project
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Card (Visual Shortcut) */}
            <div onClick={() => setIsCreateModalOpen(true)} className="group cursor-pointer flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 text-slate-400 transition-colors">
                    <Plus size={32} />
                </div>
                <span className="mt-3 font-medium text-slate-500 group-hover:text-blue-600">Create New Project</span>
            </div>

            {boards.map(board => (
                <div 
                    key={board.id} 
                    onClick={() => onSelectBoard(board.id)}
                    className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col h-48"
                >
                    <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-2">
                             <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mb-2 group-hover:scale-110 transition-transform origin-left">
                                <Layout size={20} />
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => exportBoard(e, board)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Export Project">
                                    <Download size={16} />
                                </button>
                                <button onClick={(e) => handleDelete(e, board.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete Project">
                                    <Trash2 size={16} />
                                </button>
                             </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors mb-1">{board.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{board.description || "No description provided."}</p>
                    </div>
                    
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1" title="Created At">
                                <Calendar size={12} />
                                {new Date(board.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1" title="Last Updated">
                                <Clock size={12} />
                                {new Date(board.lastUpdated).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="group-hover:translate-x-1 transition-transform text-blue-600">
                            <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Project">
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                <input 
                    type="text" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., Marketing Q3"
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Briefly describe the project goals..."
                />
            </div>
            <div className="flex justify-end pt-2">
                <button 
                    onClick={handleCreate}
                    disabled={!newTitle.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    Create Project
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};