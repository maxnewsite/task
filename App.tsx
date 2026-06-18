import React, { useState, useEffect } from 'react';
import { AppData, Board } from './types';
import { loadData, saveData } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { ProjectView } from './components/ProjectView';
import { TikTokReport } from './components/TikTokReport';

type View = 'dashboard' | 'tiktok';

const App: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [view, setView] = useState<View>('dashboard');

  useEffect(() => {
    const stored = loadData();
    setData(stored);
  }, []);

  useEffect(() => {
    if (data) {
      saveData(data);
    }
  }, [data]);

  const handleCreateBoard = (title: string, description: string) => {
    if (!data) return;
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title,
      description,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      columns: {
        'col-1': { id: 'col-1', title: 'To Do', taskIds: [] },
        'col-2': { id: 'col-2', title: 'In Progress', taskIds: [] },
        'col-3': { id: 'col-3', title: 'Done', taskIds: [] },
      },
      columnOrder: ['col-1', 'col-2', 'col-3'],
      tasks: {}
    };
    setData({
      ...data,
      boards: [...data.boards, newBoard],
      activeBoardId: newBoard.id
    });
  };

  const handleUpdateBoard = (updatedBoard: Board) => {
    if (!data) return;
    const timestampedBoard = { ...updatedBoard, lastUpdated: Date.now() };
    setData({
      ...data,
      boards: data.boards.map(b => b.id === updatedBoard.id ? timestampedBoard : b)
    });
  };

  const handleImportBoards = (importedBoards: Board[]) => {
    if (!data) return;
    const processedBoards = importedBoards.map((board, index) => ({
      ...board,
      id: `board-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      title: board.title.includes('(Imported)') ? board.title : `${board.title} (Imported)`,
      lastUpdated: Date.now(),
      description: board.description || '',
      createdAt: board.createdAt || Date.now()
    }));

    setData({
      ...data,
      boards: [...data.boards, ...processedBoards]
    });
  };

  const handleDeleteBoard = (boardId: string) => {
    if (!data) return;
    setData({
      ...data,
      boards: data.boards.filter(b => b.id !== boardId),
      activeBoardId: data.activeBoardId === boardId ? null : data.activeBoardId
    });
  };

  const handleExportAll = () => {
    if (!data) return;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `taskflow_database_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  if (!data) return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400">Loading TaskFlow...</div>;

  if (view === 'tiktok') {
    return <TikTokReport onBack={() => setView('dashboard')} />;
  }

  const activeBoard = data.activeBoardId
    ? data.boards.find(b => b.id === data.activeBoardId)
    : null;

  if (activeBoard) {
    return (
      <ProjectView
        board={activeBoard}
        onUpdateBoard={handleUpdateBoard}
        onBack={() => setData({ ...data, activeBoardId: null })}
      />
    );
  }

  return (
    <Dashboard
      boards={data.boards}
      onSelectBoard={(id) => setData({ ...data, activeBoardId: id })}
      onCreateBoard={handleCreateBoard}
      onImportBoards={handleImportBoards}
      onDeleteBoard={handleDeleteBoard}
      onExportAll={handleExportAll}
      onOpenTikTokReport={() => setView('tiktok')}
    />
  );
};

export default App;
