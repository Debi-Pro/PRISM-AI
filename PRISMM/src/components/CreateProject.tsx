import React, { useState, useEffect } from 'react';
import { INITIAL_PROJECT_PHOTOS } from '../data/mockProjects';
import { ReconstructionStepper, ReconstructionStage } from './ReconstructionStepper';

interface CreateProjectProps {
  initialName?: string;
  initialDescription?: string;
  initialPhotos?: string[];
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onBack: () => void;
  onSubmit: (projectData: { name: string; description: string; photos: string[] }) => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({
  initialName,
  initialDescription,
  initialPhotos,
  isSubmitting = false,
  errorMessage = null,
  onBack,
  onSubmit
}) => {
  const [name, setName] = useState(initialName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [currentStage, setCurrentStage] = useState<ReconstructionStage>(1);
  const [isMorphingAway, setIsMorphingAway] = useState(false);

  useEffect(() => {
    if (initialName !== undefined) {
      setName(initialName);
    }
  }, [initialName]);

  useEffect(() => {
    if (initialDescription !== undefined) {
      setDescription(initialDescription);
    }
  }, [initialDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isMorphingAway || isSubmitting) return;

    // Transition the stepper tick to Stage 2 and morph away the card
    setCurrentStage(2);
    setIsMorphingAway(true);

    setTimeout(() => {
      onSubmit({
        name: name.trim(),
        description: description.trim(),
        photos: initialPhotos || []
      });
    }, 420);
  };

  return (
    <div className="relative min-h-screen bg-[#05070b] text-slate-100 font-sans antialiased overflow-hidden">
      {/* Background Architectural Grid Matrix */}
      <div className="arch-grid-matrix opacity-40"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.12)_0%,transparent_70%)] blur-[80px] pointer-events-none"></div>

      {/* Functional Stepper with Stage Transition */}
      <ReconstructionStepper
        currentStage={currentStage}
        onBackToProjects={onBack}
      />

      <main
        className={`relative z-10 max-w-xl mx-auto py-12 px-6 transition-all duration-500 ease-out transform ${
          isMorphingAway
            ? 'opacity-0 scale-[0.92] -translate-y-8 blur-[10px] pointer-events-none'
            : 'opacity-100 scale-100 translate-y-0 blur-0'
        }`}
      >
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#080d16]/80 backdrop-blur-md p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">Create New Project</h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Enter your project details. You will upload and validate photographs in the next step.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="project-name">
                Project Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Master Living Room"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ea580c] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="project-description">
                Description <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="project-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 2BHK interior, natural afternoon lighting..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ea580c] transition-colors"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
                <span className="material-symbols-outlined text-sm text-rose-400 shrink-0 mt-0.5">error_outline</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.07]">
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-[#ea580c] hover:bg-[#f97316] text-black font-bold text-xs font-mono uppercase tracking-wider shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Continue to Upload →</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
