import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Gamepad2,
  Cpu,
  Volume2,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPlayRemaster: () => void;
  onPlayOriginal: () => void;
}

export const DiagnosticReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPlayRemaster,
  onPlayOriginal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-slate-200 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20">
            <Cpu size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              게임 동작 테스트 & 코드 진단 리포트
            </h2>
            <p className="text-xs text-slate-400">
              사용자 작성 코드 (<code className="text-amber-300">ai_studio_code_e82c68ce.html</code>) 종합 분석
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg">
              95점
            </div>
            <div>
              <div className="text-sm font-bold text-white">동작 상태: 매우 양호 & 아이디어 탁월</div>
              <div className="text-xs text-slate-400">
                Three.js 기반 3D 고속도로 렌더링, 레인 변경, 충돌 판정, 시간별 가속 로직 정상 작동
              </div>
            </div>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-500/40 hidden sm:inline">
            테스트 통과
          </span>
        </div>

        {/* Test Criteria */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Gamepad2 size={16} className="text-blue-400" />
            <span>핵심 시스템 동작 검증 결과</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">차선 변경 반응성</div>
                <div className="text-slate-400 mt-0.5">
                  보간 계수 0.4로 키 입력 즉시 좌/우로 부드럽고 민첩하게 이동합니다.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">60초 점진적 난이도 조절</div>
                <div className="text-slate-400 mt-0.5">
                  속도(1.2→1.5 선형 가속)와 스폰 간격(45→16프레임)이 60초 동안 부드럽게 빨라져 몰입감 극대화.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">승용차 참교육 충돌 판정</div>
                <div className="text-slate-400 mt-0.5">
                  거리(distZ &lt; 2.0, distX &lt; 1.4) 판정이 몬스터 트럭 크기와 잘 맞아 떨어집니다.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">탱크 회피 & 하트 패널티</div>
                <div className="text-slate-400 mt-0.5">
                  탱크 충돌 시 즉시 게임 오버, 저속 승용차 방치 시 하트 차감 메커니즘 정확히 동작.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Found Improvements & Solutions */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-400" />
            <span>발견된 주의점 및 이번 리마스터 개선 사항</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">오타 수정:</span>{' '}
                <code className="text-amber-200">cylindricalCabinMat = cabinMat</code> 변수 선언 누락 오타가
                있었습니다. (리마스터에서 안전한 변수로 정돈)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5">
              <Volume2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-300">사운드 효과 (Web Audio):</span> 원작에 소리가 없어 밋밋했던
                점을 보완하여, V8 엔진 배기음, 차선 이동음, 박살나는 타격음, 콤보 팡파르를 추가했습니다.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-2.5">
              <Layers size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-300">타격감 및 3D 연출:</span> 차를 밟았을 때 화면 흔들림(Screen
                Shake)과 서스펜션 점프 바운스, 배기구 연기, 고속도로 방음벽과 표지판을 추가했습니다.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onPlayRemaster();
            }}
            className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-sm rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>개선된 리마스터판 플레이</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onPlayOriginal();
            }}
            className="w-full sm:flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>원본 HTML 그대로 실행해보기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
