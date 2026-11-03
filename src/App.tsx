import React, { useState } from 'react';
import { Sparkles, Code2, FileCheck2, Truck } from 'lucide-react';
import { EnhancedGameView } from './components/EnhancedGameView';
import { OriginalGameView } from './components/OriginalGameView';
import { DiagnosticReportModal } from './components/DiagnosticReportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'REMASTER' | 'ORIGINAL'>('REMASTER');
  const [showReport, setShowReport] = useState<boolean>(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col">
      {/* Top App Bar Navigation */}
      <header className="h-12 bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0">
        {/* App Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-600/30">
            <Truck size={16} />
          </div>
          <span className="font-black text-sm sm:text-base text-white tracking-tight">
            고속도로 저속주행 참교육
          </span>
          <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30 hidden md:inline">
            1차로 정속주행 격파 3D
          </span>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('REMASTER')}
            className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'REMASTER'
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={13} />
            <span>개선판 플레이</span>
          </button>

          <button
            onClick={() => setActiveTab('ORIGINAL')}
            className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ORIGINAL'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 size={13} />
            <span>원본 코드 실행</span>
          </button>

          <button
            onClick={() => setShowReport(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-black text-amber-300 hover:text-amber-200 hover:bg-slate-800/60 flex items-center gap-1 transition-all cursor-pointer"
            title="게임 진단 및 QA 결과 확인"
          >
            <FileCheck2 size={13} />
            <span className="hidden sm:inline">진단 리포트</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="relative flex-1 w-full h-[calc(100vh-3rem)] overflow-hidden">
        {activeTab === 'REMASTER' ? (
          <EnhancedGameView onOpenReport={() => setShowReport(true)} />
        ) : (
          <OriginalGameView />
        )}
      </main>

      {/* Diagnostic Report Modal */}
      <DiagnosticReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onPlayRemaster={() => setActiveTab('REMASTER')}
        onPlayOriginal={() => setActiveTab('ORIGINAL')}
      />
    </div>
  );
}
