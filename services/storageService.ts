import { AppData, Board, Task } from '../types';

const STORAGE_KEY = 'taskflow_ai_data_v3';

// Helper to get a date relative to today at a specific hour
const getRelativeDate = (dayOffset: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const INITIAL_DATA: AppData = {
  boards: [
    {
      id: 'board-1',
      title: 'Project Alpha',
      description: 'Main product launch for Q3. Includes marketing and dev tasks.',
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      columns: {
        'col-1': { id: 'col-1', title: 'To Do', taskIds: ['task-1', 'task-2', 'task-3', 'task-4'] },
        'col-2': { id: 'col-2', title: 'In Progress', taskIds: [] },
        'col-3': { id: 'col-3', title: 'Done', taskIds: [] },
        'col-4': { id: 'col-4', title: 'Abandoned', taskIds: [] },
      },
      columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'],
      tasks: {
        'task-1': {
          id: 'task-1',
          title: 'Launch Product',
          description: 'The ultimate activity. Release to the public.',
          priority: 1,
          impact: 5,
          checklist: [],
          tags: ['Milestone'],
          dependencies: ['task-2', 'task-3'],
          createdAt: Date.now(),
          dueDate: getRelativeDate(2, 14), // In 2 days at 2 PM
          duration: 90,
        },
        'task-2': {
          id: 'task-2',
          title: 'Develop Core Features',
          description: 'Implement the main functionality.',
          priority: 2,
          impact: 5,
          checklist: [],
          tags: ['Dev'],
          dependencies: [],
          createdAt: Date.now(),
          dueDate: getRelativeDate(0, 10), // Today at 10 AM
          duration: 120,
        },
        'task-3': {
          id: 'task-3',
          title: 'Marketing Campaign',
          description: 'Prepare social media and ads.',
          priority: 3,
          impact: 4,
          checklist: [],
          tags: ['Marketing'],
          dependencies: [],
          createdAt: Date.now(),
          dueDate: getRelativeDate(1, 11), // Tomorrow at 11 AM
          duration: 60,
        },
        'task-4': {
          id: 'task-4',
          title: 'Team Sync',
          description: 'Weekly sync with the engineering team.',
          priority: 4,
          impact: 3,
          checklist: [],
          tags: ['Meeting'],
          dependencies: [],
          createdAt: Date.now(),
          dueDate: getRelativeDate(0, 14), // Today at 2 PM
          duration: 45,
        },
      },
    },
  ],
  activeBoardId: null, // Default to null to show dashboard
};

// Helper to migrate legacy data
const migrateTask = (task: any): Task => {
  let priority = 3;
  if (typeof task.priority === 'string') {
    if (task.priority === 'high') priority = 1;
    else if (task.priority === 'medium') priority = 3;
    else if (task.priority === 'low') priority = 5;
  } else {
    priority = task.priority;
  }

  return {
    ...task,
    priority: priority || 3,
    impact: task.impact || 3,
    dependencies: task.dependencies || [],
    duration: task.duration || 60,
  };
};

export const loadData = (): AppData => {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) return INITIAL_DATA;

    const data = JSON.parse(dataStr);
    
    // Migration logic
    if (!data.boards) return INITIAL_DATA;

    data.boards.forEach((board: any) => {
      // Ensure new fields exist
      if (!board.description) board.description = '';
      if (!board.lastUpdated) board.lastUpdated = board.createdAt || Date.now();

      // Migrate Tasks
      Object.keys(board.tasks).forEach(key => {
        board.tasks[key] = migrateTask(board.tasks[key]);
      });

      // Migrate Columns
      const hasAbandoned = Object.values(board.columns).some((c: any) => c.title.toLowerCase() === 'abandoned');
      if (!hasAbandoned) {
        const newColId = `col-abandoned-${Date.now()}`;
        board.columns[newColId] = { id: newColId, title: 'Abandoned', taskIds: [] };
        board.columnOrder.push(newColId);
      }
    });

    return data;
  } catch (e) {
    console.error("Failed to load data", e);
    return INITIAL_DATA;
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};