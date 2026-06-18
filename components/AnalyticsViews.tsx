import React, { useState, useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  GripVertical, Clock, CheckSquare, AlertCircle, Inbox
} from 'lucide-react';

interface ViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
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

type Tone = { bg: string; text: string; border: string; solid: string; ring: string };

const PRIORITY_TONE: Record<number, Tone> = {
  1: { bg: 'bg-red-100',    text: 'text-red-900',    border: 'border-red-300',    solid: 'bg-red-500',    ring: 'ring-red-300' },
  2: { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300', solid: 'bg-orange-500', ring: 'ring-orange-300' },
  3: { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-300', solid: 'bg-yellow-500', ring: 'ring-yellow-300' },
  4: { bg: 'bg-blue-100',   text: 'text-blue-900',   border: 'border-blue-300',   solid: 'bg-blue-500',   ring: 'ring-blue-300' },
  5: { bg: 'bg-slate-100',  text: 'text-slate-700',  border: 'border-slate-300',  solid: 'bg-slate-400',  ring: 'ring-slate-300' }
};

const clamp15 = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

// Inline priority cycler. Click cycles 1→2→3→4→5→1. Used everywhere for fast edits.
const PriorityChip: React.FC<{ task: Task; onTaskUpdate: (t: Task) => void; size?: 'sm' | 'md' }> = ({ task, onTaskUpdate, size = 'sm' }) => {
  const tone = PRIORITY_TONE[task.priority] || PRIORITY_TONE[3];
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskUpdate({ ...task, priority: task.priority === 5 ? 1 : task.priority + 1 });
  };
  const cls = size === 'md'
    ? 'text-xs px-2.5 py-1'
    : 'text-[10px] px-2 py-0.5';
  return (
    <button
      onClick={next}
      title={`Priority ${task.priority} (${PRIORITY_LABELS[task.priority]}). Click to cycle.`}
      className={`uppercase rounded-full font-bold border ${cls} ${tone.bg} ${tone.text} ${tone.border} hover:brightness-95 active:scale-95 transition`}
    >
      P{task.priority} · {PRIORITY_LABELS[task.priority]}
    </button>
  );
};

const ImpactChip: React.FC<{ task: Task; onTaskUpdate: (t: Task) => void }> = ({ task, onTaskUpdate }) => {
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskUpdate({ ...task, impact: task.impact === 5 ? 1 : task.impact + 1 });
  };
  return (
    <button
      onClick={next}
      title={`Impact ${task.impact} (${IMPACT_LABELS[task.impact]}). Click to cycle.`}
      className="text-[10px] uppercase px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:brightness-95 active:scale-95 transition"
    >
      I{task.impact} · {IMPACT_LABELS[task.impact]}
    </button>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// 1. PRIORITY VIEW — drag cards between priority groups
// ───────────────────────────────────────────────────────────────────────────────
export const PriorityView: React.FC<ViewProps> = ({ tasks, onTaskClick, onTaskUpdate }) => {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);

  const grouped = useMemo(() => {
    const g: Record<number, Task[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    tasks.forEach(t => {
      const p = clamp15(t.priority || 3);
      g[p].push(t);
    });
    return g;
  }, [tasks]);

  const onDrop = (level: number) => {
    setHoverLevel(null);
    if (!dragTaskId) return;
    const task = tasks.find(t => t.id === dragTaskId);
    setDragTaskId(null);
    if (!task || task.priority === level) return;
    onTaskUpdate({ ...task, priority: level });
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Priority Breakdown</h2>
        <span className="text-xs text-slate-500">Drag a card to a different priority — or click the priority chip to cycle.</span>
      </div>

      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map(level => {
          const tone = PRIORITY_TONE[level];
          const isHover = hoverLevel === level;
          return (
            <div
              key={level}
              onDragOver={(e) => { e.preventDefault(); if (hoverLevel !== level) setHoverLevel(level); }}
              onDragLeave={() => setHoverLevel(prev => (prev === level ? null : prev))}
              onDrop={() => onDrop(level)}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                isHover ? `ring-2 ${tone.ring} ${tone.bg}/40 border-transparent` : 'border-slate-200'
              }`}
            >
              <div className={`px-4 py-3 font-bold text-sm border-b flex justify-between items-center ${tone.bg} ${tone.text} ${tone.border}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${tone.solid}`}></span>
                  <span>P{level} · {PRIORITY_LABELS[level]} Priority</span>
                </div>
                <span className="bg-white px-2 py-0.5 rounded text-xs border opacity-75">{grouped[level].length} tasks</span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[120px]">
                {grouped[level].length === 0 ? (
                  <div className="col-span-full text-sm text-slate-400 italic flex items-center justify-center h-20 border-2 border-dashed border-slate-200 rounded-lg">
                    Drop here to set P{level}
                  </div>
                ) : (
                  grouped[level].map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        setDragTaskId(task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', task.id);
                      }}
                      onDragEnd={() => { setDragTaskId(null); setHoverLevel(null); }}
                      className={`group bg-white border border-slate-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all ${
                        dragTaskId === task.id ? 'opacity-40' : ''
                      }`}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap gap-1">
                          <PriorityChip task={task} onTaskUpdate={onTaskUpdate} />
                          <ImpactChip task={task} onTaskUpdate={onTaskUpdate} />
                        </div>
                        <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500 flex-none mt-0.5" />
                      </div>
                      <div className="text-sm font-semibold text-slate-800 mb-2 line-clamp-2">{task.title}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {task.checklist.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <CheckSquare size={12} />
                            {task.checklist.filter(c => c.isCompleted).length}/{task.checklist.length}
                          </span>
                        )}
                        {task.dependencies.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-purple-600">
                            <AlertCircle size={12} /> {task.dependencies.length}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`inline-flex items-center gap-1 ml-auto ${new Date(task.dueDate) < new Date() ? 'text-red-600 font-semibold' : ''}`}>
                            <Clock size={12} />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// 2. MATRIX VIEW — per-cell selector chip + side-panel expander
//    Click a cell chip to expand all tasks in that cell. Drag tasks from the
//    panel onto any other cell to reallocate (changes priority + impact).
// ───────────────────────────────────────────────────────────────────────────────
export const MatrixView: React.FC<ViewProps> = ({ tasks, onTaskClick, onTaskUpdate }) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ p: number; i: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ p: number; i: number } | null>(null);

  // 5×5 grid with cells of 20% each. Center of cell (p,i) is at (p-0.5)*20%.
  const cellCenterTop = (p: number) => (p - 0.5) * 20;
  const cellCenterLeft = (i: number) => (i - 0.5) * 20;

  // Reverse: clientX/Y → snapped (priority, impact)
  const coordsToPI = (clientX: number, clientY: number) => {
    const rect = plotRef.current!.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(99.99, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(99.99, ((clientY - rect.top) / rect.height) * 100));
    const impact = clamp15(Math.floor(xPct / 20) + 1);
    const priority = clamp15(Math.floor(yPct / 20) + 1);
    return { priority, impact };
  };

  // Pre-fill all 25 cells so iteration is stable
  const cells = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (let p = 1; p <= 5; p++) for (let i = 1; i <= 5; i++) m.set(`${p}-${i}`, []);
    tasks.forEach(t => {
      m.get(`${clamp15(t.priority)}-${clamp15(t.impact)}`)!.push(t);
    });
    return m;
  }, [tasks]);

  const selectedTasks = selectedCell
    ? cells.get(`${selectedCell.p}-${selectedCell.i}`) || []
    : [];

  const onDragOverPlot = (e: React.DragEvent) => {
    e.preventDefault();
    if (!plotRef.current) return;
    const { priority, impact } = coordsToPI(e.clientX, e.clientY);
    if (!hoverCell || hoverCell.p !== priority || hoverCell.i !== impact) {
      setHoverCell({ p: priority, i: impact });
    }
  };

  const onDropPlot = (e: React.DragEvent) => {
    e.preventDefault();
    setHoverCell(null);
    if (!dragTaskId || !plotRef.current) return;
    const task = tasks.find(t => t.id === dragTaskId);
    setDragTaskId(null);
    if (!task) return;
    const { priority, impact } = coordsToPI(e.clientX, e.clientY);
    if (task.priority === priority && task.impact === impact) return;
    onTaskUpdate({ ...task, priority, impact });
    // If the side panel was open, follow the moved task so the user can keep reallocating
    if (selectedCell && selectedCell.p === task.priority && selectedCell.i === task.impact) {
      setSelectedCell({ p: priority, i: impact });
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Impact / Priority Matrix</h2>
        <span className="text-xs text-slate-500">Click a cell badge to expand its tasks. Drag any task onto another cell to reallocate.</span>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Y axis labels */}
        <div className="flex flex-col w-12 flex-none">
          <div className="h-8" />
          <div className="flex-1 grid grid-rows-5 text-xs font-bold text-slate-400 uppercase tracking-wide text-right pr-2">
            {[1, 2, 3, 4, 5].map(p => (
              <div key={p} className="flex items-center justify-end">P{p}<br/>{PRIORITY_LABELS[p][0]}</div>
            ))}
          </div>
          <div className="h-8" />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* X axis labels (top) */}
          <div className="h-8 flex">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wide">
                I{i}<span className="opacity-60"> · {IMPACT_LABELS[i][0]}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Quadrant tints (decorative) */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
              <div className="bg-orange-50/40 p-2 flex items-start"><span className="text-[10px] text-orange-500 font-bold uppercase">Quick Wins</span></div>
              <div className="bg-red-50/40 p-2 flex items-start justify-end"><span className="text-[10px] text-red-500 font-bold uppercase">Critical Focus</span></div>
              <div className="bg-slate-50/40 p-2 flex items-end"><span className="text-[10px] text-slate-500 font-bold uppercase">Eliminate</span></div>
              <div className="bg-blue-50/40 p-2 flex items-end justify-end"><span className="text-[10px] text-blue-500 font-bold uppercase">Strategic</span></div>
            </div>

            {/* 5×5 snap grid with hover + selected highlights */}
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 pointer-events-none">
              {Array.from({ length: 25 }).map((_, idx) => {
                const p = Math.floor(idx / 5) + 1;
                const i = (idx % 5) + 1;
                const isHover = hoverCell?.p === p && hoverCell?.i === i;
                const isSel = selectedCell?.p === p && selectedCell?.i === i;
                const tone = PRIORITY_TONE[p];
                return (
                  <div
                    key={`${p}-${i}`}
                    className={`border-r border-b border-dashed border-slate-200 transition-colors ${
                      isSel ? `${tone.bg}/80 border-solid ${tone.border}` :
                      isHover ? `${tone.bg}/50` : ''
                    }`}
                  />
                );
              })}
            </div>

            {/* Drop area + per-cell selector chips */}
            <div
              ref={plotRef}
              onDragOver={onDragOverPlot}
              onDragLeave={() => setHoverCell(null)}
              onDrop={onDropPlot}
              className="absolute inset-0"
            >
              {Array.from(cells.entries()).map(([key, cellTasks]) => {
                if (cellTasks.length === 0) return null;
                const [pStr, iStr] = key.split('-');
                const p = parseInt(pStr, 10);
                const i = parseInt(iStr, 10);
                const tone = PRIORITY_TONE[p];
                const isSelected = selectedCell?.p === p && selectedCell?.i === i;
                const single = cellTasks.length === 1;
                const onlyTask = single ? cellTasks[0] : null;
                const previewTitles = cellTasks.slice(0, 3).map(t => t.title).join('\n');
                const more = cellTasks.length > 3 ? `\n…and ${cellTasks.length - 3} more` : '';

                return (
                  <button
                    key={key}
                    type="button"
                    draggable={single}
                    onDragStart={(e) => {
                      if (!onlyTask) return;
                      setDragTaskId(onlyTask.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', onlyTask.id);
                    }}
                    onDragEnd={() => { setDragTaskId(null); setHoverCell(null); }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCell(isSelected ? null : { p, i });
                    }}
                    title={`P${p} · I${i}${cellTasks.length > 1 ? ` — ${cellTasks.length} tasks` : ''}\n${previewTitles}${more}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full font-bold text-white shadow-lg ring-2 ring-white transition-all ${tone.solid} ${
                      isSelected ? 'scale-110 ring-4 ring-offset-1' : 'hover:scale-110 hover:z-20'
                    } ${single ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                    style={{ top: `${cellCenterTop(p)}%`, left: `${cellCenterLeft(i)}%` }}
                  >
                    <span className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-base leading-none">
                      {cellTasks.length}
                    </span>
                    <span className="text-[10px] uppercase opacity-90 leading-none whitespace-nowrap">
                      P{p}·I{i}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* X axis label (bottom) */}
          <div className="h-8 flex items-center justify-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Impact (low → high) →
            </div>
          </div>
        </div>

        {/* Side panel: tasks in selected cell (or hint) */}
        <aside className={`w-72 flex-none bg-white rounded-xl border shadow-sm flex flex-col transition-all ${
          selectedCell ? PRIORITY_TONE[selectedCell.p].border : 'border-slate-200'
        }`}>
          {selectedCell ? (
            <>
              <div className={`px-4 py-3 border-b text-sm font-bold flex items-center justify-between ${PRIORITY_TONE[selectedCell.p].bg} ${PRIORITY_TONE[selectedCell.p].text} ${PRIORITY_TONE[selectedCell.p].border}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_TONE[selectedCell.p].solid}`} />
                  Cell P{selectedCell.p} · I{selectedCell.i}
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-xs font-normal opacity-70 hover:opacity-100"
                >
                  Close
                </button>
              </div>
              <div className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 bg-slate-50">
                {PRIORITY_LABELS[selectedCell.p]} priority · {IMPACT_LABELS[selectedCell.i]} impact · {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                {selectedTasks.length === 0 ? (
                  <div className="text-xs text-slate-400 italic text-center py-6">
                    No tasks left in this cell — drop one here to populate it.
                  </div>
                ) : selectedTasks.map(task => {
                  const tone = PRIORITY_TONE[clamp15(task.priority)];
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        setDragTaskId(task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', task.id);
                      }}
                      onDragEnd={() => { setDragTaskId(null); setHoverCell(null); }}
                      onClick={() => onTaskClick(task)}
                      className={`group bg-white border-l-4 border border-slate-200 rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all ${tone.border.replace('border-', 'border-l-')}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <PriorityChip task={task} onTaskUpdate={onTaskUpdate} />
                        <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
                      </div>
                      <div className="text-xs font-semibold text-slate-800 line-clamp-2 mb-1">{task.title}</div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <ImpactChip task={task} onTaskUpdate={onTaskUpdate} />
                        {task.dueDate && (
                          <span className={`inline-flex items-center gap-1 ml-auto ${new Date(task.dueDate) < new Date() ? 'text-red-600 font-semibold' : ''}`}>
                            <Clock size={10} />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t border-slate-100 text-[11px] text-slate-500">
                Drag any card onto another matrix cell to reallocate (changes both priority &amp; impact).
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-slate-400">
              <div className="text-xs font-bold uppercase tracking-widest mb-2">Cell Viewer</div>
              <div className="text-xs leading-relaxed">
                Click any badge on the matrix to expand the tasks at that priority + impact, then drag them to any other cell to reallocate.
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// 3. GRAPH VIEW — dependency arrows + inline priority chip
// ───────────────────────────────────────────────────────────────────────────────
export const GraphView: React.FC<ViewProps> = ({ tasks, onTaskClick, onTaskUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});

  const taskMap = useMemo(() => {
    const m: Record<string, Task> = {};
    tasks.forEach(t => { m[t.id] = t; });
    return m;
  }, [tasks]);

  // Compute depth (with cycle protection) and group by level
  const { levels, maxLevel } = useMemo(() => {
    const depthCache: Record<string, number> = {};
    const compute = (id: string, stack = new Set<string>()): number => {
      if (depthCache[id] !== undefined) return depthCache[id];
      if (stack.has(id)) return 0;
      const t = taskMap[id];
      if (!t || !t.dependencies?.length) {
        depthCache[id] = 0;
        return 0;
      }
      const next = new Set(stack);
      next.add(id);
      const d = Math.max(...t.dependencies.map(dId => taskMap[dId] ? compute(dId, next) + 1 : 0));
      depthCache[id] = d;
      return d;
    };

    const lvls: Record<number, Task[]> = {};
    tasks.forEach(t => {
      const d = compute(t.id);
      if (!lvls[d]) lvls[d] = [];
      lvls[d].push(t);
    });
    const max = Object.keys(lvls).length ? Math.max(...Object.keys(lvls).map(Number)) : 0;
    return { levels: lvls, maxLevel: max };
  }, [tasks, taskMap]);

  // Re-measure positions whenever layout or task set changes
  const measure = () => {
    if (!containerRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();
    const next: typeof positions = {};
    tasks.forEach(t => {
      const el = nodeRefs.current[t.id];
      if (!el) return;
      const r = el.getBoundingClientRect();
      next[t.id] = {
        x: r.left - cRect.left + containerRef.current!.scrollLeft,
        y: r.top - cRect.top + containerRef.current!.scrollTop,
        w: r.width,
        h: r.height
      };
    });
    setPositions(next);
  };

  useLayoutEffect(() => {
    measure();
    // Run again next frame to catch font/layout settle
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [tasks.length, maxLevel]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Build SVG arrows: from each task to each of its dependencies
  const arrows: { from: string; to: string; d: string }[] = [];
  tasks.forEach(t => {
    t.dependencies.forEach(depId => {
      const a = positions[depId];
      const b = positions[t.id];
      if (!a || !b) return;
      // dependency (a) sits to the left, dependent (b) to the right
      const x1 = a.x + a.w;
      const y1 = a.y + a.h / 2;
      const x2 = b.x;
      const y2 = b.y + b.h / 2;
      const midX = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
      arrows.push({ from: depId, to: t.id, d });
    });
  });

  // SVG canvas size
  const svgSize = useMemo(() => {
    let maxX = 0, maxY = 0;
    Object.values(positions).forEach(p => {
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    });
    return { w: Math.max(maxX + 40, 800), h: Math.max(maxY + 40, 400) };
  }, [positions]);

  return (
    <div className="p-6 h-full overflow-hidden bg-slate-50 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Activity Graph</h2>
        <span className="text-xs text-slate-500">Arrows show dependencies. Click a P# chip to cycle priority.</span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-100 rounded-xl border border-slate-200 relative p-8"
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          width={svgSize.w}
          height={svgSize.h}
          style={{ minWidth: '100%', minHeight: '100%' }}
        >
          <defs>
            <marker id="arrow-head" viewBox="0 -5 10 10" refX="8" refY="0" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,-5 L10,0 L0,5" fill="#94a3b8" />
            </marker>
          </defs>
          {arrows.map((a, i) => (
            <path
              key={`${a.from}-${a.to}-${i}`}
              d={a.d}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrow-head)"
              opacity="0.7"
            />
          ))}
        </svg>

        <div className="flex gap-16 h-full min-w-max relative z-10">
          {Array.from({ length: maxLevel + 1 }).map((_, i) => {
            const lvlTasks = levels[i] || [];
            return (
              <div key={i} className="w-64 flex flex-col gap-4">
                <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {i === 0 ? 'Foundation' : i === maxLevel ? 'Goal' : `Phase ${i}`}
                </div>
                {lvlTasks.map(t => {
                  const tone = PRIORITY_TONE[clamp15(t.priority)];
                  return (
                    <div
                      key={t.id}
                      ref={el => { nodeRefs.current[t.id] = el; }}
                      onClick={() => onTaskClick(t)}
                      className={`bg-white p-3 rounded-lg border-2 shadow-sm cursor-pointer hover:shadow-md transition-all ${tone.border}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <PriorityChip task={t} onTaskUpdate={onTaskUpdate} />
                        {t.dependencies.length > 0 && (
                          <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                            <AlertCircle size={10} /> {t.dependencies.length}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-slate-800 line-clamp-2">{t.title}</div>
                      {t.checklist.length > 0 && (
                        <div className="mt-2 text-[10px] text-slate-500 inline-flex items-center gap-1">
                          <CheckSquare size={10} />
                          {t.checklist.filter(c => c.isCompleted).length}/{t.checklist.length}
                        </div>
                      )}
                    </div>
                  );
                })}
                {lvlTasks.length === 0 && (
                  <div className="text-xs text-slate-400 italic text-center">—</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// 4. CALENDAR VIEW — drag to reschedule + unscheduled sidebar
// ───────────────────────────────────────────────────────────────────────────────
export const CalendarView: React.FC<ViewProps> = ({ tasks, onTaskClick, onTaskUpdate }) => {
  const [viewType, setViewType] = useState<'month' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropHoverKey, setDropHoverKey] = useState<string | null>(null);

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

  const getPriorityBorderColor = (p: number) => PRIORITY_TONE[clamp15(p)].border.replace('border-', 'border-l-');

  const scheduled = tasks.filter(t => !!t.dueDate);
  const unscheduled = tasks.filter(t => !t.dueDate);

  // Update a task's dueDate to a given Date (keeps minute-precision)
  const rescheduleTo = (taskId: string, target: Date) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    onTaskUpdate({ ...t, dueDate: target.toISOString() });
  };

  // ── Month view ─────────────────────────────────────────────────────────────
  const renderMonthView = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
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
          {blanks.map(b => <div key={`blank-${b}`} className="bg-slate-50/50 border-r border-b border-slate-100" />)}
          {days.map(d => {
            const dayDate = new Date(year, month, d);
            const dateStr = dayDate.toISOString().split('T')[0];
            const dayTasks = scheduled.filter(t => t.dueDate!.startsWith(dateStr));
            const isToday = dayDate.toDateString() === new Date().toDateString();
            const cellKey = `m-${dateStr}`;
            const isHover = dropHoverKey === cellKey;

            return (
              <div
                key={d}
                onDragOver={(e) => { e.preventDefault(); if (!isHover) setDropHoverKey(cellKey); }}
                onDragLeave={() => setDropHoverKey(prev => prev === cellKey ? null : prev)}
                onDrop={() => {
                  setDropHoverKey(null);
                  if (!dragTaskId) return;
                  const existing = tasks.find(t => t.id === dragTaskId);
                  const target = new Date(year, month, d);
                  if (existing?.dueDate) {
                    const prev = new Date(existing.dueDate);
                    target.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                  } else {
                    target.setHours(9, 0, 0, 0);
                  }
                  rescheduleTo(dragTaskId, target);
                  setDragTaskId(null);
                }}
                className={`border-r border-b border-slate-100 p-2 min-h-[100px] overflow-hidden transition-colors ${
                  isHover ? 'bg-blue-50 ring-2 ring-blue-300' : isToday ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`text-xs font-bold mb-1 ${
                  isToday ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-500'
                }`}>{d}</div>

                <div className="space-y-1">
                  {dayTasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        setDragTaskId(t.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', t.id);
                      }}
                      onDragEnd={() => { setDragTaskId(null); setDropHoverKey(null); }}
                      onClick={() => onTaskClick(t)}
                      className={`px-1.5 py-1 rounded text-[10px] truncate cursor-grab active:cursor-grabbing bg-yellow-50 text-black border-l-2 ${getPriorityBorderColor(t.priority)} hover:bg-yellow-100`}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week view ──────────────────────────────────────────────────────────────
  const renderWeekView = () => {
    const day = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const startHour = 6;
    const endHour = 22;
    const hours = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);
    const slotHeight = 60; // px per hour

    // Convert drop coords to time
    const onDayDrop = (e: React.DragEvent, dayDate: Date) => {
      e.preventDefault();
      setDropHoverKey(null);
      if (!dragTaskId) return;
      const colEl = e.currentTarget as HTMLDivElement;
      const rect = colEl.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const totalMin = Math.max(0, offsetY); // px == minutes (slotHeight=60)
      const snapped = Math.round(totalMin / 15) * 15; // snap to 15-min
      const hour = startHour + Math.floor(snapped / 60);
      const minute = snapped % 60;
      const target = new Date(dayDate);
      target.setHours(hour, minute, 0, 0);
      rescheduleTo(dragTaskId, target);
      setDragTaskId(null);
    };

    return (
      <div className="flex flex-col h-full overflow-hidden bg-white rounded-lg border border-slate-200">
        <div className="flex border-b border-slate-200">
          <div className="w-16 flex-none border-r border-slate-200" />
          {weekDays.map(d => (
            <div key={d.toISOString()} className="flex-1 py-3 text-center border-r border-slate-100 last:border-0">
              <div className="text-xs font-semibold text-slate-400 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-xl font-bold mt-1 ${
                d.toDateString() === new Date().toDateString()
                  ? 'bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto'
                  : 'text-slate-700'
              }`}>{d.getDate()}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto relative">
          <div className="flex">
            <div className="w-16 flex-none text-right pr-2 pt-0 border-r border-slate-200 bg-slate-50 text-xs text-slate-400 font-medium">
              {hours.map(h => (
                <div key={h} style={{ height: slotHeight }} className="relative">
                  <span className="absolute top-0 right-2 -translate-y-1/2 bg-slate-50 px-1">
                    {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 flex">
              {weekDays.map(d => {
                const dayKey = `w-${d.toISOString().split('T')[0]}`;
                const isHover = dropHoverKey === dayKey;
                const dayTasks = scheduled.filter(t => {
                  const td = new Date(t.dueDate!);
                  return td.toDateString() === d.toDateString();
                });
                return (
                  <div
                    key={d.toISOString()}
                    onDragOver={(e) => { e.preventDefault(); if (!isHover) setDropHoverKey(dayKey); }}
                    onDragLeave={() => setDropHoverKey(prev => prev === dayKey ? null : prev)}
                    onDrop={(e) => onDayDrop(e, d)}
                    className={`flex-1 relative border-r border-slate-100 ${isHover ? 'bg-blue-50/70' : ''}`}
                    style={{ height: hours.length * slotHeight }}
                  >
                    {hours.map((_, i) => (
                      <div
                        key={i}
                        className="border-b border-slate-100"
                        style={{ height: slotHeight }}
                      />
                    ))}

                    {dayTasks.map(t => {
                      const td = new Date(t.dueDate!);
                      const h = td.getHours();
                      const m = td.getMinutes();
                      if (h < startHour || h >= endHour) return null;
                      const top = (h - startHour) * slotHeight + m;
                      const height = Math.max(28, t.duration || 60);
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            setDragTaskId(t.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', t.id);
                          }}
                          onDragEnd={() => { setDragTaskId(null); setDropHoverKey(null); }}
                          onClick={(e) => { e.stopPropagation(); onTaskClick(t); }}
                          className={`absolute left-1 right-1 px-2 py-1 rounded-md text-xs shadow-sm cursor-grab active:cursor-grabbing hover:brightness-95 overflow-hidden border-l-4 bg-yellow-50 text-black ${getPriorityBorderColor(t.priority)}`}
                          style={{ top, height, zIndex: 10 }}
                        >
                          <div className="font-bold truncate">{t.title}</div>
                          <div className="opacity-90 truncate text-[10px]">
                            {td.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <div className="flex items-center justify-between mb-4">
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

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {viewType === 'week' ? renderWeekView() : renderMonthView()}
        </div>

        {/* Unscheduled tasks sidebar */}
        <aside className="w-64 flex-none bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Inbox size={16} /> Unscheduled
            <span className="ml-auto text-xs font-normal text-slate-400">{unscheduled.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {unscheduled.length === 0 ? (
              <div className="text-xs text-slate-400 italic text-center py-6">Everything's on the calendar.</div>
            ) : unscheduled.map(t => {
              const tone = PRIORITY_TONE[clamp15(t.priority)];
              return (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    setDragTaskId(t.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', t.id);
                  }}
                  onDragEnd={() => { setDragTaskId(null); setDropHoverKey(null); }}
                  onClick={() => onTaskClick(t)}
                  className={`group bg-white border border-slate-200 rounded-lg p-2 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all border-l-4 ${tone.border.replace('border-', 'border-l-')}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <PriorityChip task={t} onTaskUpdate={onTaskUpdate} />
                    <GripVertical size={12} className="text-slate-300 group-hover:text-slate-500" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800 line-clamp-2">{t.title}</div>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500">
            Drag any card onto a day{viewType === 'week' ? '/time slot' : ''} to schedule it.
          </div>
        </aside>
      </div>
    </div>
  );
};
