import React, { useRef, useState } from 'react';
import { RotateCcw, Maximize2, ExternalLink, Keyboard, CheckCircle2 } from 'lucide-react';

export const OriginalGameView: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState<number>(0);
  const [hasFocus, setHasFocus] = useState<boolean>(false);

  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  const handleFocus = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      setHasFocus(true);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-slate-200">
            원작 코드 실시간 실행 환경 (Original Raw HTML)
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
            /public/assets/aistudio/ai_studio_code_e82c68ce.html
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFocus}
            className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
              hasFocus
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {hasFocus ? <CheckCircle2 size={14} /> : <Keyboard size={14} />}
            <span>{hasFocus ? '키보드 포커스 완료' : '키보드 조작 활성화'}</span>
          </button>

          <button
            onClick={handleReload}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all"
            title="원본 게임 다시 불러오기"
          >
            <RotateCcw size={16} />
          </button>

          <a
            href="/assets/aistudio/ai_studio_code_e82c68ce.html"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all"
            title="새 탭에서 열기"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Embedded Iframe */}
      <div className="relative flex-1 w-full h-full bg-black">
        <iframe
          key={key}
          ref={iframeRef}
          src="/assets/aistudio/ai_studio_code_e82c68ce.html"
          title="고속도로 저속주행 참교육 원작"
          className="w-full h-full border-0"
          onLoad={() => {
            // Give focus to iframe for immediate keyboard interaction
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.focus();
              setHasFocus(true);
            }
          }}
        />
      </div>
    </div>
  );
};
