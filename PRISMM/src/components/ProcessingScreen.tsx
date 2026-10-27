import React, { useState, useEffect } from 'react';
import { ProjectJob } from '../types';
import { ReconstructionStepper } from './ReconstructionStepper';
import { Interactive3DModal } from './Interactive3DModal';
import { supabase } from '../lib/supabase';

export interface UploadProgress {
  uploaded: number;
  total: number;
}

interface ProcessingScreenProps {
  project?: ProjectJob | null;
  uploadProgress?: UploadProgress | null;
  uploadError?: string | null;
  onBackToProjects: () => void;
  onComplete?: () => void;
  onUpdateStep?: (step: number) => void;
  onNavigateToUpload?: () => void;
  onNavigateToDetails?: () => void;
}

export interface ReconstructionStageDef {
  id: number;
  title: string;
  ongoingDesc: string;
  completedDesc: string;
}

export interface ReconstructionJobRow {
  job_id: string;
  project_id: string;
  status: string;
  stage: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export const STAGE_NAME_TO_STEP: Record<string, number> = {
  'Image Ingestion': 1,
  'Spatial Reconstruction': 2,
  'Gaussian Splatting': 3,
  'SPZ Generation': 4,
  'Model Preparation': 5
};

export function getStepFromStage(stageName?: string | null): number {
  if (!stageName) return 1;
  const normalized = stageName.trim().toLowerCase();
  for (const [name, step] of Object.entries(STAGE_NAME_TO_STEP)) {
    if (name.toLowerCase() === normalized) {
      return step;
    }
  }
  return 1;
}

export const RECONSTRUCTION_STAGES: ReconstructionStageDef[] = [
  {
    id: 1,
    title: "Image Ingestion",
    ongoingDesc: "Uploading and validating the photographic dataset to Supabase Storage.",
    completedDesc: "Photographic dataset validated and stored in Supabase Storage."
  },
  {
    id: 2,
    title: "Spatial Reconstruction",
    ongoingDesc: "COLMAP is performing feature extraction, feature matching, and camera pose estimation.",
    completedDesc: "Spatial reconstruction completed and scene geometry generated."
  },
  {
    id: 3,
    title: "Gaussian Splatting",
    ongoingDesc: "Generating the Gaussian Splat representation from the reconstructed scene.",
    completedDesc: "Gaussian Splat representation generated successfully."
  },
  {
    id: 4,
    title: "SPZ Generation",
    ongoingDesc: "Converting the Gaussian Splat representation into the SPZ format.",
    completedDesc: "SPZ model generated and stored in Supabase Storage."
  },
  {
    id: 5,
    title: "Model Preparation",
    ongoingDesc: "Preparing the reconstructed model for browser-based visualization.",
    completedDesc: "Reconstructed model is ready for interactive exploration."
  }
];

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  project,
  uploadProgress,
  uploadError,
  onBackToProjects,
  onComplete,
  onUpdateStep
}) => {
  const [job, setJob] = useState<ReconstructionJobRow | null>(null);
  const [show3DModal, setShow3DModal] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState<boolean>(false);

  const effectiveUploadProgress: UploadProgress | null = uploadProgress
    ? uploadProgress
    : (project?.photographsCount && project.photographsCount > 0
        ? { uploaded: project.photographsCount, total: project.photographsCount }
        : null);

  const dbStep = job?.stage ? getStepFromStage(job.stage) : 1;
  const isUploadFinished = Boolean(
    effectiveUploadProgress &&
    effectiveUploadProgress.total > 0 &&
    effectiveUploadProgress.uploaded >= effectiveUploadProgress.total
  );
  const fallbackStep = isUploadFinished ? Math.max(2, project?.currentStep || 2) : (project?.currentStep || 1);

  const isCompleted = job?.status === 'completed' || project?.status === 'completed';
  const currentStep = isCompleted
    ? 5
    : Math.max(dbStep, fallbackStep);

  const activeStage = RECONSTRUCTION_STAGES[currentStep - 1] || RECONSTRUCTION_STAGES[0];

  useEffect(() => {
    const projectId = project?.id;
    if (!projectId || projectId === 'draft') return;

    let isMounted = true;

    const fetchJob = async () => {
      try {
        const { data, error } = await supabase
          .from('reconstruction_jobs')
          .select('job_id, project_id, status, stage, started_at, completed_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Error querying reconstruction_jobs:', error.message);
          return;
        }

        if (data && isMounted) {
          setJob(data as ReconstructionJobRow);
          const step = getStepFromStage(data.stage);
          onUpdateStep?.(step);

          if (data.status === 'completed') {
            onComplete?.();
          }
        }
      } catch (err) {
        console.warn('Failed to fetch reconstruction_jobs:', err);
      }
    };

    fetchJob();

    if (isCompleted) {
      return () => {
        isMounted = false;
      };
    }

    const interval = setInterval(() => {
      fetchJob();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [project?.id, isCompleted, onComplete, onUpdateStep]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCopyLink = () => {
    const shareUrl = project?.shareUrl || (project?.id ? `https://prism.app/share/${project.id}` : 'https://prism.app');
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#06080c] text-slate-100 flex flex-col justify-start pb-20 font-sans antialiased">
      {/* Functional Reconstruction Stepper */}
      <ReconstructionStepper
        currentStage={3}
        isProcessingFinished={isCompleted}
        onBackToProjects={onBackToProjects}
      />

      <main className="w-full max-w-[1240px] mx-auto px-6 sm:px-8 pt-8 flex-1 flex flex-col justify-start animate-page-enter">
        {/* Page Title & Description Header */}
        <div className="mb-9 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] sm:text-[34px] font-semibold text-white tracking-[-0.015em] leading-tight mb-2">
              {project?.name || 'Reconstruction Project'}
            </h1>
            <p className="text-[#8494a8] text-[14.5px] font-normal leading-relaxed">
              {project?.description || "Multi-angle photogrammetry capture for 3D Gaussian Splat reconstruction."}
            </p>
          </div>
        </div>

        {/* Main Reconstruction Status Card Container */}
        <section className="bg-[#0b1017] border border-[#141c26] rounded-2xl p-8 sm:p-10 lg:p-12 mb-6 shadow-2xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Stepper Column: 5-stage tracker, all completed when finished */}
            <div className="lg:col-span-6 flex flex-col">
              {RECONSTRUCTION_STAGES.map((stage, idx) => {
                const stepNum = stage.id;
                const isStepCompleted = isCompleted || stepNum < currentStep;
                const isStepActive = !isCompleted && stepNum === currentStep;
                const isLast = idx === RECONSTRUCTION_STAGES.length - 1;

                return (
                  <div key={stage.id} className="flex items-start gap-5 relative">
                    <div className="flex flex-col items-center self-stretch">
                      {isStepCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-[#ea580c] flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.35)] shrink-0 z-10 transition-all duration-300">
                          <svg className="w-4 h-4 text-[#0b1017] stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        </div>
                      ) : isStepActive ? (
                        <div className="w-8 h-8 rounded-full border-2 border-[#ea580c] bg-[#0b1017] flex items-center justify-center shrink-0 z-10 shadow-[0_0_18px_rgba(234,88,12,0.4)] transition-all duration-300">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#ea580c] animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-[#242e3e] bg-[#0b1017] shrink-0 z-10 transition-all duration-300"></div>
                      )}

                      {!isLast && (
                        <div
                          className={`w-[2px] flex-1 min-h-[34px] my-1 transition-all duration-500 ${
                            isStepCompleted
                              ? 'bg-[#ea580c]'
                              : isStepActive
                              ? 'stepper-dashed-line'
                              : 'bg-[#1a2330]'
                          }`}
                        ></div>
                      )}
                    </div>

                    <div className="pt-0.5 pb-5">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3
                          className={`text-[15.5px] font-medium leading-none tracking-tight transition-colors duration-300 ${
                            isStepActive || isStepCompleted ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {stage.title}
                        </h3>
                        {isStepActive && (
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#ea580c] bg-[#ea580c]/15 border border-[#ea580c]/30 px-2 py-0.5 rounded-full">
                            In Progress
                          </span>
                        )}
                        {isStepCompleted && (
                          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[13px] font-normal leading-normal transition-colors duration-300 ${
                          isStepCompleted
                            ? 'text-[#718197]'
                            : isStepActive
                            ? 'text-slate-200'
                            : 'text-[#4e5c70]'
                        }`}
                      >
                        {isStepCompleted ? stage.completedDesc : stage.ongoingDesc}
                      </p>

                      {/* Live Upload Counter for Stage 1 (Image Ingestion) */}
                      {stage.id === 1 && effectiveUploadProgress && effectiveUploadProgress.total > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[12.5px] text-slate-300">
                          <span className="text-[#ea580c] font-semibold">{effectiveUploadProgress.uploaded}</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-300">{effectiveUploadProgress.total}</span>
                          <span className="text-slate-400 font-sans text-[12px] ml-1">uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Status Panel: Canonical position & hierarchy */}
            <div className="lg:col-span-6 flex items-center justify-center lg:border-l lg:border-[#151c27] lg:pl-10 xl:pl-12 py-2">
              <div className="w-full bg-[#080c12]/95 border border-[#141b25] rounded-2xl p-8 sm:p-9 shadow-inner">
                {!isCompleted ? (
                  /* Processing State */
                  <div>
                    {/* Spinner and Status Row */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                        <svg className="animate-spin w-9 h-9" fill="none" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" stroke="#251a14" strokeLinecap="round" strokeWidth="3"></circle>
                          <path
                            d="M20 4 C28.8366 4 36 11.1634 36 20 C36 24.5 34.2 28.5 31.2 31.5"
                            stroke="#ea580c"
                            strokeLinecap="round"
                            strokeWidth="3.2"
                          ></path>
                        </svg>
                      </div>
                      <div>
                        <span className="text-[#ea580c] font-semibold text-[13px] tracking-[0.14em] uppercase select-none block">
                          {job?.status?.toLowerCase() === 'failed' || uploadError
                            ? 'Reconstruction Failed'
                            : (job?.status?.toLowerCase() === 'pending' && currentStep === 1)
                            ? 'Reconstruction Pending'
                            : 'Reconstruction in progress'}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">
                          Stage {currentStep} of 5 • {activeStage.title}
                        </span>
                      </div>
                    </div>

                    <p className="text-[#7b8a9e] text-[13.5px] leading-relaxed font-normal min-h-[44px]">
                      {activeStage.ongoingDesc}
                    </p>

                    {/* Metadata Info Rows */}
                    <div className="mt-5 pt-4 border-t border-white/5 space-y-2.5 text-xs font-mono text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Current Stage</span>
                        <span className="text-[#ea580c] font-medium">{activeStage.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status</span>
                        <span className="text-slate-200 capitalize font-medium">
                          {uploadError
                            ? 'Failed'
                            : (job?.status?.toLowerCase() === 'failed')
                            ? 'Failed'
                            : (job?.status?.toLowerCase() === 'pending' && currentStep === 1)
                            ? 'Pending'
                            : 'Running'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Model Format</span>
                        <span className="text-slate-200 font-medium">3D Gaussian Splat (.spz)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Model Size</span>
                        <span className="text-slate-400 italic">Calculating...</span>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                        <span className="font-semibold block mb-0.5">Upload Error</span>
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Completed State: Same container, same spacing, View 3D Model action */
                  <div>
                    {/* Status Header */}
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <div className="w-9 h-9 rounded-full bg-[#ea580c]/15 border border-[#ea580c]/40 flex items-center justify-center text-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.25)] shrink-0">
                        <svg className="w-5 h-5 stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-semibold text-[13.5px] tracking-[0.14em] uppercase select-none block">
                          Reconstruction Completed
                        </span>
                        <span className="text-slate-400 text-xs font-mono">
                          Digital twin ready for exploration
                        </span>
                      </div>
                    </div>

                    <p className="text-[#7b8a9e] text-[13px] leading-relaxed font-normal mb-4">
                      Reconstructed model is ready for interactive exploration.
                    </p>

                    {/* VIEW 3D MODEL SECTION (Slightly increased in size) */}
                    <div
                      onClick={() => setShow3DModal(true)}
                      onMouseMove={handleMouseMove}
                      className="w-full overflow-hidden rounded-xl bg-[#07090e] relative aspect-[16/10] min-h-[220px] sm:min-h-[240px] border border-white/10 group cursor-pointer select-none mb-4"
                      title="Click to view interactive 3D model"
                    >
                      {/* Base subtle dot grid */}
                      <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-40 group-hover:opacity-75"
                        style={{
                          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: 'center'
                        }}
                      ></div>

                      {/* Cursor spotlight */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-screen"
                        style={{
                          backgroundImage: 'radial-gradient(rgba(255, 170, 85, 0.75) 1.5px, transparent 1.5px)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: 'center',
                          WebkitMaskImage: `radial-gradient(240px 240px at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 80%)`,
                          maskImage: `radial-gradient(240px 240px at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 80%)`
                        }}
                      ></div>

                      {/* Radial glow */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, rgba(249, 150, 57, 0.16), rgba(255, 122, 41, 0.05) 50%, transparent 80%)`
                        }}
                      ></div>

                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]"></div>

                      {/* Centered Content */}
                      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3 backdrop-blur-[1px]">
                        <div className="w-12 h-12 rounded-full bg-[#161c26]/90 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-[#ea580c] group-hover:border-[#ea580c]/40 group-hover:shadow-[0_0_24px_rgba(234,88,12,0.35)] transition-all">
                          <svg className="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" x2="12" y1="22.08" y2="12"></line>
                          </svg>
                        </div>
                        <div className="flex items-center gap-2 text-sm sm:text-[15px] font-medium text-slate-200 group-hover:text-white transition-colors">
                          <span className="tracking-wide">View 3D Model</span>
                          <span className="text-[#ea580c] transition-transform group-hover:translate-x-1.5 text-base">→</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Info Rows: Model Format & Model Size */}
                    <div className="pt-3.5 border-t border-white/10 space-y-2.5 text-xs font-mono text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Model Format</span>
                        <span className="text-slate-200 font-medium">3D Gaussian Splat (.spz)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Model Size</span>
                        <span className="text-slate-200 font-medium">18.4 MB</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Banner */}
        <aside className="bg-[#0b1017] border border-[#141c26] rounded-xl px-7 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 max-w-3xl">
            <div className="w-10 h-10 rounded-full border border-[#232d3c] flex items-center justify-center text-slate-300 shrink-0">
              {!isCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="12" x2="12" y1="16" y2="12"></line>
                  <line x1="12" x2="12.01" y1="8" y2="8"></line>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              )}
            </div>
            <div className="space-y-0.5">
              <h4 className="text-white text-[14px] font-medium tracking-tight">
                {!isCompleted ? "You can leave this page." : "Reconstruction is complete."}
              </h4>
              <p className="text-[#728296] text-[12.5px] leading-normal font-normal">
                {!isCompleted
                  ? "The reconstruction will continue to run in the background. You can return to your projects at any time to check the status."
                  : "Your 3D spatial model is ready. You can explore the digital twin at any time from your workspace."}
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto flex items-center gap-3 justify-end">
            {isCompleted && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 hover:border-white/20 bg-[#0c1118] text-[13px] font-medium text-slate-200 transition duration-150 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  ></path>
                </svg>
                <span>{copied ? 'Copied Link!' : 'Share Link'}</span>
              </button>
            )}

            <button
              onClick={onBackToProjects}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg border border-[#202937] hover:border-[#2d3a4d] bg-[#0c1118] hover:bg-[#111722] text-[13px] font-medium text-slate-200 transition duration-150 ease-in-out shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span>Back to Projects</span>
            </button>
          </div>
        </aside>
      </main>

      {/* Fullscreen 3D Spatial Viewer Modal */}
      {show3DModal && project && (
        <Interactive3DModal project={project} onClose={() => setShow3DModal(false)} />
      )}
    </div>
  );
};
