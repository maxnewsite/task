export interface CheckItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: number; // 1 (Super Priority) to 5 (Low Priority)
  impact: number; // 1 (Low Impact) to 5 (High Impact)
  checklist: CheckItem[];
  dueDate?: string; // ISO Date string
  duration?: number; // Duration in minutes
  tags: string[];
  dependencies: string[]; // IDs of tasks this task depends on
  createdAt: number;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: { [key: string]: Column };
  columnOrder: string[];
  tasks: { [key: string]: Task };
  createdAt: number;
  lastUpdated: number;
}

export interface AppData {
  boards: Board[];
  activeBoardId: string | null;
}