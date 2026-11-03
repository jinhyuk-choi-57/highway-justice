import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Timer,
  Trophy,
  Gauge,
  Volume2,
  VolumeX,
  Camera,
  Play,
  RotateCcw,
  Pause,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Flame,
  Info,
  Keyboard,
} from 'lucide-react';
import { GameEngine, GameOverStats, CameraViewMode } from '../game/GameEngine';
import { soundManager } from '../audio/soundManager';

interface Props {
  onOpenReport?: () => void;
}

export const EnhancedGameView: React.FC<Props> = ({ onOpenReport }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI States
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('monster_rush_high_score') || '0', 10);
  });
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [speedKmh, setSpeedKmh] = useState<number>(120);
  const [combo, setCombo] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean; id: number } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('CHASE');
  const [gameOverData, setGameOverData] = useState<{
    reason: 'TIME_UP' | 'TANK_CRASH' | 'NO_LIVES';
    stats: GameOverStats;
  } | null>(null);

  // Initialize GameEngine
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, {
      onScoreUpdate: (newScore, currentHigh) => {
        setScore(newScore);
        setHighScore(currentHigh);
      },
      onLivesUpdate: (newLives) => {
        setLives(newLives);
      },
      onTimeUpdate: (newTime) => {
        setTimeLeft(newTime);
      },
      onSpeedUpdate: (kmh) => {
        setSpeedKmh(kmh);
      },
      onComboUpdate: (newCombo) => {
        setCombo(newCombo);
      },
      onFeedback: (text, isError) => {
        setFeedback({ text, isError, id: Date.now() });
      },
      onGameOver: (reason, stats) => {
        setGameOverData({ reason, stats });
        setGameState('GAMEOVER');

        if (reason === 'TIME_UP' || stats.isNewHigh) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      },
    });

    engineRef.current = engine;
    engine.animate();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Clear feedback banner after 900ms
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => {
      setFeedback(null);
    }, 900);
    return () => clearTimeout(t);
  }, [feedback]);

  // Global audio unlock listener on first user click/touch
  useEffect(() => {
    const unlockHandler = () => {
      soundManager.unlock();
    };
    window.addEventListener('pointerdown', unlockHandler, { once: true });
    window.addEventListener('keydown', unlockHandler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };
  }, []);

  const handleStartGame = useCallback(() => {
    if (!engineRef.current) return;
    soundManager.unlock();
    setGameState('PLAYING');
    engineRef.current.startGame();
  }, []);

  // 아무 키나 누르면 게임 재시작 (Game Over 상태일 때)
  useEffect(() => {
    if (gameState !== 'GAMEOVER') return;

    // 사망 직후 키를 연타하고 있던 경우 실수로 바로 재시작되는 것을 방지하기 위한 200ms 보호 딜레이
    const modalOpenTime = Date.now();
    const handleAnyKeyRestart = (e: KeyboardEvent) => {
      if (Date.now() - modalOpenTime < 200) return;
      e.preventDefault();
      handleStartGame();
    };

    window.addEventListener('keydown', handleAnyKeyRestart);
    return () => {
      window.removeEventListener('keydown', handleAnyKeyRestart);
    };
  }, [gameState, handleStartGame]);

  // 시작 화면에서도 스페이스나 엔터 또는 아무 키 누르면 즉시 시작
  useEffect(() => {
    if (gameState !== 'START') return;

    const handleStartKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
        e.preventDefault();
        handleStartGame();
      }
    };

    window.addEventListener('keydown', handleStartKey);
    return () => {
      window.removeEventListener('keydown', handleStartKey);
    };
  }, [gameState, handleStartGame]);

  const handleTogglePause = useCallback(() => {
    if (!engineRef.current) return;
    soundManager.unlock();
    const paused = engineRef.current.togglePause();
    setGameState(paused ? 'PAUSED' : 'PLAYING');
  }, []);

  const handleMoveLane = useCallback((dir: number) => {
    if (!engineRef.current) return;
    soundManager.unlock();
    engineRef.current.moveLane(dir);
  }, []);

  const handleToggleSound = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleCycleCamera = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.cycleCameraView();
    setCameraMode(engineRef.current.getViewMode());
  }, []);

  // Calculate Performance Grade
  const getGrade = (s: number, timeSurvived: number) => {
    if (s >= 25 && timeSurvived >= 60) return { grade: 'S+', title: '전설의 도로 수호신', color: 'text-amber-300' };
    if (s >= 18) return { grade: 'S', title: '고속도로 참교육 마스터', color: 'text-yellow-400' };
    if (s >= 12) return { grade: 'A', title: '쾌속의 몬스터 드라이버', color: 'text-blue-400' };
    if (s >= 6) return { grade: 'B', title: '초보 참교육 트러커', color: 'text-emerald-400' };
    return { grade: 'C', title: '정속주행 방관자', color: 'text-gray-400' };
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Display */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-5 pointer-events-none z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Lives (Hearts) */}
          <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-red-500/30 shadow-xl flex items-center gap-2">
            <span className="text-[11px] font-black text-red-400 tracking-wider uppercase hidden sm:inline">
              생명
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <Heart
                  key={i}
                  size={20}
                  className={`transition-all duration-300 ${
                    i < lives
                      ? 'text-red-500 fill-red-500 scale-100 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      : 'text-slate-700 fill-slate-800 scale-90 opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Center Timer & Speedometer */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Timer */}
            <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border border-amber-500/40 shadow-xl flex items-center gap-2 text-center">
              <Timer size={18} className="text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-amber-400/80 leading-none">남은 시간</span>
                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${
                    timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-300'
                  }`}
                >
                  {timeLeft}
                  <span className="text-xs font-bold text-amber-500/70 ml-0.5">초</span>
                </span>
              </div>
            </div>

            {/* Speedometer */}
            <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-2xl border border-cyan-500/30 shadow-xl flex items-center gap-2">
              <Gauge size={18} className="text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-cyan-400/80 leading-none">속도</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight leading-tight">
                  {speedKmh}
                  <span className="text-[10px] font-bold text-cyan-500/80 ml-0.5">km/h</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Cars Smashed & High Score */}
          <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-2xl border border-blue-500/40 shadow-xl flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase">
                <Trophy size={11} className="text-yellow-400" />
                <span>최고 {highScore}대</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{score}</span>
                <span className="text-xs font-bold text-blue-400">대 참교육</span>
              </div>
            </div>
          </div>
        </div>

        {/* Combo Indicator */}
        {combo >= 2 && (
          <div className="flex justify-center mt-2 pointer-events-none">
            <div className="bg-gradient-to-r from-orange-500/90 to-red-600/90 backdrop-blur-md text-white font-black text-sm sm:text-base px-4 py-1 rounded-full shadow-lg border border-amber-300/40 flex items-center gap-1.5 animate-bounce">
              <Flame size={16} className="text-yellow-300 fill-yellow-300" />
              <span>{combo} 연속 참교육 콤보 중!</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Feedback Banner (Smash / Missed notification - moved to the very top) */}
      {feedback && (
        <div className="absolute top-16 sm:top-20 left-0 right-0 flex justify-center items-center pointer-events-none z-20 transition-all duration-300">
          <div
            className={`px-6 py-2.5 rounded-full font-black text-lg sm:text-xl shadow-2xl backdrop-blur-md border transform scale-100 transition-all ${
              feedback.isError
                ? 'bg-red-500/90 border-red-300/60 text-white shadow-red-500/40'
                : 'bg-amber-400/90 border-yellow-200 text-slate-950 shadow-amber-400/40'
            }`}
          >
            {feedback.text}
          </div>
        </div>
      )}

      {/* Quick Utility Bar (Top Right floating) */}
      <div className="absolute top-20 right-4 sm:top-24 sm:right-6 flex flex-col gap-2 z-10 pointer-events-auto">
        <button
          onClick={handleToggleSound}
          title={isMuted ? '음소거 해제' : '음소거'}
          className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700/60 shadow-lg active:scale-95 transition-all"
        >
          {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-cyan-400" />}
        </button>

        <button
          onClick={handleCycleCamera}
          title={`카메라 뷰 변경 (현재: ${cameraMode})`}
          className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700/60 shadow-lg active:scale-95 transition-all flex items-center justify-center text-[11px] font-bold"
        >
          <Camera size={18} className="text-amber-400" />
        </button>

        {gameState === 'PLAYING' && (
          <button
            onClick={handleTogglePause}
            title="일시정지"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700/60 shadow-lg active:scale-95 transition-all"
          >
            <Pause size={18} className="text-slate-300" />
          </button>
        )}

        {onOpenReport && (
          <button
            onClick={onOpenReport}
            title="코드 진단 & QA 보고서 보기"
            className="p-2.5 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl border border-indigo-400/60 shadow-lg active:scale-95 transition-all"
          >
            <Info size={18} />
          </button>
        )}
      </div>

      {/* Bottom Controls / Mobile Buttons Dock */}
      <div className="absolute bottom-4 left-0 right-0 p-4 z-10 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4 pointer-events-auto">
          {/* Left Arrow Button */}
          <button
            onClick={() => handleMoveLane(-1)}
            disabled={gameState !== 'PLAYING'}
            className="flex-1 h-20 bg-slate-900/80 hover:bg-slate-800/90 active:bg-blue-600/80 border border-slate-700/70 hover:border-blue-400/60 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none backdrop-blur-md"
          >
            <ArrowLeft size={32} className="text-blue-400" />
            <span className="text-[11px] font-bold text-slate-300 mt-0.5">좌측 차선 (A / ←)</span>
          </button>

          {/* Lane Center Status Badge */}
          <div className="px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-center hidden sm:flex flex-col items-center shadow-lg">
            <span className="text-[10px] font-bold text-slate-400">조작 가이드</span>
            <span className="text-xs font-black text-amber-300">키보드 방향키</span>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => handleMoveLane(1)}
            disabled={gameState !== 'PLAYING'}
            className="flex-1 h-20 bg-slate-900/80 hover:bg-slate-800/90 active:bg-blue-600/80 border border-slate-700/70 hover:border-blue-400/60 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none backdrop-blur-md"
          >
            <ArrowRight size={32} className="text-blue-400" />
            <span className="text-[11px] font-bold text-slate-300 mt-0.5">우측 차선 (D / →)</span>
          </button>
        </div>
      </div>

      {/* Start Modal Screen */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900/95 border border-slate-700/80 p-6 sm:p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-red-600/20 border border-red-500/50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4 shadow-lg shadow-red-500/20">
              <Flame size={32} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              고속도로 저속주행 참교육
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
              고속도로 1차로는 법적으로 <strong className="text-amber-400">추월 전용 차로</strong>입니다!
              답답하게 차선을 막는 저속 주행 승용차를 몬스터 트럭으로 시원하게 밟아버리세요!
            </p>

            {/* Game Rules Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-6 text-left text-xs space-y-3">
              <div className="flex items-center gap-3 text-slate-200">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                  🚗
                </span>
                <span>
                  <strong className="text-blue-400">저속 승용차 (밟기):</strong> 차선을 맞춰 들이받으면{' '}
                  <span className="text-amber-300 font-bold">+1점 & 콤보</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-black">
                  🛡️
                </span>
                <span>
                  <strong className="text-red-400">장갑 탱크 (피하기):</strong> 부딪히면 무조건 즉시{' '}
                  <span className="text-red-400 font-bold">폭발 게임오버</span>!
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-black">
                  💔
                </span>
                <span>
                  <strong className="text-red-300">승용차 놓침:</strong> 밟지 못하고 보내면{' '}
                  <span className="text-red-400 font-bold">하트 1개 차감</span> (총 3개)
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                  🎮
                </span>
                <span>
                  <strong className="text-emerald-400">조작 방법:</strong> 좌/우 방향키, A/D 키 또는 하단 버튼
                </span>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-lg rounded-2xl shadow-xl shadow-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play size={20} className="fill-white" />
              <span>참교육 시작하기</span>
            </button>
          </div>
        </div>
      )}

      {/* Pause Modal Screen */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-2">일시정지 중</h2>
            <p className="text-xs text-slate-400 mb-6">숨을 고르고 다시 고속도로를 질주하세요!</p>
            <button
              onClick={handleTogglePause}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-base rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              게임 계속하기
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal Screen */}
      {gameState === 'GAMEOVER' && gameOverData && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900/95 border border-slate-700/80 p-6 sm:p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative">
            {/* Header Icon based on reason */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ${
                gameOverData.reason === 'TIME_UP'
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                  : 'bg-red-500/20 border border-red-500/50 text-red-500'
              }`}
            >
              {gameOverData.reason === 'TIME_UP' ? (
                <Trophy size={32} />
              ) : gameOverData.reason === 'TANK_CRASH' ? (
                <ShieldAlert size={32} />
              ) : (
                <Heart size={32} className="fill-red-500" />
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
              {gameOverData.reason === 'TIME_UP'
                ? '60초 완주 참교육 완료!'
                : gameOverData.reason === 'TANK_CRASH'
                ? '단단한 장갑 탱크 충돌!'
                : '참교육 실패 (하트 소진)'}
            </h2>
            <p className="text-slate-400 text-xs mb-5">
              {gameOverData.reason === 'TIME_UP'
                ? '제한 시간 60초 동안 도로의 질서를 바로잡았습니다.'
                : gameOverData.reason === 'TANK_CRASH'
                ? '탱크는 몬스터 트럭으로도 부술 수 없습니다. 피했어야 했습니다!'
                : '저속 승용차를 3대나 그냥 보내 차선이 꽉 막혔습니다.'}
            </p>

            {/* Score & Rank Highlight */}
            {(() => {
              const { grade, title, color } = getGrade(
                gameOverData.stats.score,
                gameOverData.stats.timeSurvived
              );
              return (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-5 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">참교육 등급:</span>
                    <span className={`text-xl font-black ${color}`}>{grade} ({title})</span>
                  </div>

                  <div className="flex items-baseline gap-2 my-1">
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-500">
                      {gameOverData.stats.score}
                    </span>
                    <span className="text-base font-bold text-slate-300">대 파괴</span>
                  </div>

                  {gameOverData.stats.isNewHigh && (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 rounded-full mt-1">
                      🎉 신기록 달성!
                    </span>
                  )}

                  {/* Detailed Stats Row */}
                  <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-800/80 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">최대 콤보</div>
                      <div className="text-base font-black text-orange-400">
                        {gameOverData.stats.maxCombo}연속
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">놓친 차량</div>
                      <div className="text-base font-black text-red-400">
                        {gameOverData.stats.carsMissed}대
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">질주 시간</div>
                      <div className="text-base font-black text-cyan-400">
                        {gameOverData.stats.timeSurvived}초
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Any Key Restart Hint */}
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2 mb-3 text-xs text-amber-300 font-bold flex items-center justify-center gap-2 animate-pulse">
              <Keyboard size={15} />
              <span>아무 키나 누르면 바로 다시 시작됩니다 (Press Any Key)</span>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={20} />
              <span>다시 참교육하기 (아무 키나 누르기)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
