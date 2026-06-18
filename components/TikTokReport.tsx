import React, { useRef, useState } from 'react';
import { ArrowLeft, Upload, FileVideo, Clock, Hash, MessageSquare, AlertCircle } from 'lucide-react';

interface TikTokReportProps {
  onBack: () => void;
}

interface TranscriptionPayload {
  videoId?: string;
  url?: string;
  author?: string;
  durationSeconds?: number;
  postedAt?: string;
  transcript?: string;
  hashtags?: string[];
  caption?: string;
  [key: string]: unknown;
}

export const TikTokReport: React.FC<TikTokReportProps> = ({ onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [payload, setPayload] = useState<TranscriptionPayload | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        setPayload(parsed);
      } catch (err) {
        console.error(err);
        setError('Could not parse JSON. Expected a TikTok transcription export.');
        setPayload(null);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const wordCount = payload?.transcript
    ? String(payload.transcript).trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">TikTok Transcription Report</h1>
            <p className="text-slate-500 text-sm mt-1">
              Upload a JSON file from your transcription pipeline to generate a structured report.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <FileVideo size={18} className="text-pink-500" />
              Source file
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
            >
              <Upload size={16} />
              {payload ? 'Replace file' : 'Upload JSON'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFile}
              accept=".json,application/json"
              className="hidden"
            />
          </div>

          {fileName && (
            <div className="text-sm text-slate-500">
              Loaded: <span className="font-mono text-slate-700">{fileName}</span>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {!payload && !error && (
            <div className="mt-6 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400">
              No file loaded. Expected shape:
              <pre className="mt-3 text-xs text-left text-slate-500 bg-slate-50 p-3 rounded max-w-md mx-auto overflow-auto">
{`{
  "videoId": "...",
  "url": "https://tiktok.com/...",
  "author": "@handle",
  "durationSeconds": 42,
  "postedAt": "2026-06-18T...",
  "caption": "...",
  "hashtags": ["..."],
  "transcript": "..."
}`}
              </pre>
            </div>
          )}
        </div>

        {payload && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Clock size={16} />} label="Duration" value={payload.durationSeconds ? `${payload.durationSeconds}s` : '—'} />
              <StatCard icon={<MessageSquare size={16} />} label="Words" value={wordCount.toString()} />
              <StatCard icon={<Hash size={16} />} label="Hashtags" value={String(payload.hashtags?.length ?? 0)} />
              <StatCard icon={<FileVideo size={16} />} label="Author" value={payload.author ?? '—'} />
            </div>

            <ReportSection title="Summary">
              <PlaceholderBlock label="AI-generated summary will appear here once the analysis pipeline is wired up." />
            </ReportSection>

            <ReportSection title="Key Themes">
              <PlaceholderBlock label="Theme extraction placeholder." />
            </ReportSection>

            <ReportSection title="Action Items">
              <PlaceholderBlock label="Suggested action items (tasks you might want to convert into Kanban cards) will be generated here." />
            </ReportSection>

            <ReportSection title="Transcript">
              <pre className="text-sm text-slate-700 bg-slate-50 p-4 rounded-md max-h-96 overflow-auto whitespace-pre-wrap font-mono">
                {payload.transcript || '(no transcript field in JSON)'}
              </pre>
            </ReportSection>

            <ReportSection title="Raw Payload">
              <pre className="text-xs text-slate-500 bg-slate-50 p-4 rounded-md max-h-72 overflow-auto font-mono">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </ReportSection>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
    <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide mb-1">
      {icon}
      {label}
    </div>
    <div className="text-lg font-semibold text-slate-800 truncate">{value}</div>
  </div>
);

const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
    <h2 className="font-semibold text-slate-800 mb-3">{title}</h2>
    {children}
  </div>
);

const PlaceholderBlock: React.FC<{ label: string }> = ({ label }) => (
  <div className="border border-dashed border-slate-300 rounded-md p-4 text-sm text-slate-400 bg-slate-50/50">
    {label}
  </div>
);
