import React, { useState } from 'react';
import { ProjectJob, JobStatus } from '../types';

interface ProjectsDashboardProps {
  projects: ProjectJob[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onCreateProject: () => void;
  onViewProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onReplayTour?: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  isLoading = false,
  errorMessage = null,
  onRetry,
  onCreateProject,
  onViewProject,
  onDeleteProject,
  onReplayTour
}) => {
  const [filter, setFilter] = useState<'all' | JobStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleCopyLink = (job: ProjectJob, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(job.shareUrl || `https://prism.app/share/${job.id}`);
    setCopiedId(job.id);
    setTimeout(() => {
      setCopiedId(null);
      setActiveMenuId(null);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-[#05070b] text-[#f1f4f9] selection:bg-[#ea580c] selection:text-white font-sans antialiased">
      {/* Subtle Warm Orange Glow in Top Header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.12)_0%,transparent_70%)] blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-10">
        {/* Simplified Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">PROJECTS</h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Manage and explore your 3D digital twins reconstructed from photographs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCreateProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(234,88,12,0.35)] cursor-pointer"
            >
              <span className="text-sm font-bold">+</span>
              <span>New Project</span>
            </button>
          </div>
        </header>

        {/* Filter Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-y border-white/[0.08] mb-8">
          {/* Tabs */}
          <nav className="flex items-center gap-5 text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'completed', label: 'Completed' },
                { id: 'processing', label: 'Processing' }
              ] as const
            ).map((tab) => {
              const count =
                tab.id === 'all'
                  ? projects.length
                  : projects.filter((p) => p.status === tab.id).length;
              const isActive = filter === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`py-1 transition-colors cursor-pointer flex items-center gap-2 font-medium ${
                    isActive
                      ? 'text-[#ea580c] font-semibold border-b-2 border-[#ea580c]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-[#ea580c]/20 text-[#ea580c]'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Search Box */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ea580c] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Projects Content Area */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#ea580c]/30 border-t-[#ea580c] animate-spin mb-4"></div>
            <p className="text-slate-400 text-xs font-mono tracking-wider uppercase">Loading projects...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-lg">error_outline</span>
            </div>
            <p className="text-rose-300 text-sm font-medium mb-1">Failed to load projects</p>
            <p className="text-slate-400 text-xs mb-5 font-light">{errorMessage}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Try Again
              </button>
            )}
          </div>
        ) : filteredProjects.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((job) => (
              <article
                key={job.id}
                onClick={() => onViewProject(job.id)}
                className="group relative rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#ea580c]/50 hover:shadow-[0_0_25px_rgba(234,88,12,0.15)] transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
                  <img
                    alt={job.name}
                    src={job.thumbnailUrl}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />

                  {/* Status Indicator in Top-Left */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/10">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        job.status === 'completed'
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                          : job.status === 'processing'
                          ? 'bg-[#ea580c] animate-ping'
                          : 'bg-slate-400'
                      }`}
                    ></span>
                    <span className="text-slate-200 capitalize">
                      {job.status === 'processing'
                        ? `Processing (${job.currentStep || 2}/5)`
                        : job.status}
                    </span>
                  </div>

                  {/* More Options Button in Top-Right */}
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === job.id ? null : job.id);
                      }}
                      className="w-7 h-7 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Options"
                    >
                      <span className="material-symbols-outlined text-sm">more_vert</span>
                    </button>

                    {/* Context Dropdown */}
                    {activeMenuId === job.id && (
                      <div
                        className="absolute right-0 top-full mt-1.5 w-40 rounded-lg bg-[#0c0e14] border border-white/15 shadow-xl py-1 z-30 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onViewProject(job.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm text-[#ea580c]">
                            view_in_ar
                          </span>
                          <span>View 3D Scene</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(job, e)}
                          className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">share</span>
                          <span>{copiedId === job.id ? 'Copied Link' : 'Copy Link'}</span>
                        </button>
                        <div className="h-px bg-white/10 my-1"></div>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProject(job.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-white group-hover:text-[#ea580c] transition-colors truncate">
                      {job.name}
                    </h2>
                    {job.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-light">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Line */}
                  <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>{job.photographsCount || 30} photos</span>
                      <span>·</span>
                      <span>{job.dateCreated}</span>
                    </div>

                    <span className="text-[#ea580c] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                      <span>Open</span>
                      <span className="text-xs">→</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          /* Clean Empty State */
          <div className="py-20 text-center">
            <p className="text-slate-400 text-sm mb-4">
              {searchQuery
                ? `No projects found matching "${searchQuery}".`
                : 'No projects found.'}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={onCreateProject}
                className="px-5 py-2.5 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-black font-semibold text-xs transition-colors cursor-pointer shadow-[0_0_20px_rgba(234,88,12,0.35)]"
              >
                Create New Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Return to Intro Page Button - Bottom Right */}
      {onReplayTour && (
        <aside aria-label="Return Navigation" className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={onReplayTour}
            className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#05070b]/90 border border-white/15 hover:border-[#ea580c] hover:bg-[#ea580c]/15 text-slate-300 hover:text-white backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(234,88,12,0.35)] transition-all duration-300 text-xs font-mono tracking-wider cursor-pointer"
            title="Return to Intro Page"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] group-hover:scale-125 transition-transform"></span>
            <span>Intro Page</span>
            <span className="text-sm font-sans transition-transform group-hover:-translate-x-0.5">←</span>
          </button>
        </aside>
      )}
    </div>
  );
};
