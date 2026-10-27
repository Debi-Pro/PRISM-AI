import React from 'react';

export type ReconstructionStage = 1 | 2 | 3;

interface ReconstructionStepperProps {
  currentStage: ReconstructionStage;
  onNavigateStage?: (stage: ReconstructionStage) => void;
  onBackToProjects?: () => void;
  isProcessingFinished?: boolean;
}

const STAGES = [
  { id: 1 as const, name: 'Project Details', shortName: 'Details' },
  { id: 2 as const, name: 'Upload & Validate', shortName: 'Upload' },
  { id: 3 as const, name: 'Start Reconstruction', shortName: 'Reconstruct' }
];

export const ReconstructionStepper: React.FC<ReconstructionStepperProps> = ({
  currentStage,
  onBackToProjects,
  isProcessingFinished = false
}) => {
  return (
    <div className="w-full border-b border-white/[0.08] bg-[#06080c]/90 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Back Link */}
        {onBackToProjects && (
          <button
            onClick={onBackToProjects}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
            type="button"
          >
            <span>←</span>
            <span>Back to Projects</span>
          </button>
        )}

        {/* Stepper with glowing status ticks - STRICTLY DISPLAY ONLY / NON-CLICKABLE UNDER ALL CIRCUMSTANCES */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto py-1 pointer-events-none">
          {STAGES.map((stage, idx) => {
            const isCompleted = isProcessingFinished ? true : stage.id < currentStage;
            const isActive = isProcessingFinished ? false : stage.id === currentStage;

            return (
              <React.Fragment key={stage.id}>
                {/* Step Item - Strictly non-clickable */}
                <div className="flex items-center gap-2 select-none cursor-default pointer-events-none">
                  {/* Status Indicator (Tick when completed, glowing ring when active) */}
                  <div className="relative flex items-center justify-center pointer-events-none cursor-default transition-all duration-300">
                    {isCompleted ? (
                      /* Lit-up tick - Display only */
                      <div className="w-6 h-6 rounded-full bg-[#ea580c] text-black font-bold flex items-center justify-center shadow-[0_0_14px_rgba(234,88,12,0.7)] pointer-events-none cursor-default transition-all duration-300 scale-100 animate-in zoom-in-75">
                        <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                    ) : isActive ? (
                      /* Lit-up active ring - Display only */
                      <div className="w-6 h-6 rounded-full border-2 border-[#ea580c] text-[#ea580c] font-bold text-[11px] font-mono flex items-center justify-center bg-[#ea580c]/15 ring-4 ring-[#ea580c]/25 shadow-[0_0_12px_rgba(234,88,12,0.4)] pointer-events-none cursor-default transition-all duration-300 scale-100">
                        {stage.id}
                      </div>
                    ) : (
                      /* Pending - Display only */
                      <div className="w-6 h-6 rounded-full border border-white/20 text-slate-500 font-mono text-[11px] flex items-center justify-center bg-white/[0.02] pointer-events-none cursor-default transition-all duration-300">
                        {stage.id}
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-xs whitespace-nowrap cursor-default pointer-events-none transition-all duration-300 ${
                      isCompleted
                        ? 'text-slate-200 font-medium'
                        : isActive
                        ? 'text-white font-semibold drop-shadow-[0_0_8px_rgba(234,88,12,0.3)]'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="hidden md:inline">{stage.name}</span>
                    <span className="md:hidden">{stage.shortName}</span>
                  </span>
                </div>

                {/* Connecting Line with smooth fill animation */}
                {idx < STAGES.length - 1 && (
                  <div className="w-6 sm:w-12 h-[2px] rounded-full bg-white/10 overflow-hidden relative pointer-events-none">
                    <div
                      className={`h-full bg-[#ea580c] shadow-[0_0_8px_rgba(234,88,12,0.6)] transition-all duration-500 ease-out ${
                        stage.id < currentStage || isProcessingFinished ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Balance placeholder for flex centering on desktop */}
        <div className="hidden sm:block w-28 pointer-events-none"></div>
      </div>
    </div>
  );
};
