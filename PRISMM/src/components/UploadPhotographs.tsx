import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { ProjectJob } from '../types';
import { INITIAL_PROJECT_PHOTOS } from '../data/mockProjects';
import { ReconstructionStepper, ReconstructionStage } from './ReconstructionStepper';
import { supabase } from '../lib/supabase';

interface UploadPhotographsProps {
  project: ProjectJob;
  initialFileMap?: Map<string, File>;
  onBack: () => void;
  onEditDetails: (currentPhotos: string[], fileMap?: Map<string, File>) => void;
  onPhotosChange?: (photos: string[], fileMap?: Map<string, File>) => void;
  onContinue: (payload: {
    projectId?: string;
    photos: string[];
    fileMap: Map<string, File>;
  }) => Promise<void> | void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// Sample dataset of 42 high-angle overlapping frames meeting the 40+ recommendation
const SAMPLE_42_PHOTOS = Array.from(
  { length: 42 },
  (_, i) => INITIAL_PROJECT_PHOTOS[i % INITIAL_PROJECT_PHOTOS.length]
);

// In-memory LRU / Map cache for generated low-resolution thumbnails
// Maps original full-res photo URL -> lightweight low-res thumbnail dataURL
const thumbnailCache = new Map<string, string>();

const TARGET_THUMB_WIDTH = 240;
const TARGET_THUMB_HEIGHT = 150;

/**
 * Generates or retrieves a lightweight, downscaled thumbnail (240x150)
 * to prevent GPU/browser memory lag when rendering dozens/hundreds of photographs.
 */
function getLowResThumbnail(url: string): Promise<string> {
  if (thumbnailCache.has(url)) {
    return Promise.resolve(thumbnailCache.get(url)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    // Allow cross-origin where possible for canvas downscaling
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_THUMB_WIDTH;
        canvas.height = TARGET_THUMB_HEIGHT;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';

          // Center-crop (cover) into aspect ratio 16:10
          const imgAspect = img.width / img.height;
          const targetAspect = TARGET_THUMB_WIDTH / TARGET_THUMB_HEIGHT;
          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;

          if (imgAspect > targetAspect) {
            sWidth = img.height * targetAspect;
            sx = (img.width - sWidth) / 2;
          } else {
            sHeight = img.width / targetAspect;
            sy = (img.height - sHeight) / 2;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, TARGET_THUMB_WIDTH, TARGET_THUMB_HEIGHT);
          const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          thumbnailCache.set(url, thumbDataUrl);
          resolve(thumbDataUrl);
          return;
        }
      } catch {
        // In case canvas is tainted or memory allocation fails, fallback cleanly
      }

      thumbnailCache.set(url, url);
      resolve(url);
    };

    img.onerror = () => {
      // In case crossOrigin='anonymous' is blocked by server CORS policy, fallback to direct url
      thumbnailCache.set(url, url);
      resolve(url);
    };

    img.src = url;
  });
}

/**
 * Performant Lazy Thumbnail Card
 * - Employs IntersectionObserver to avoid rendering/decoding off-screen thumbnails
 * - Renders low-res generated thumbnail (preserving original full-res internally for upload)
 * - Uses content-visibility: auto for native scroll virtualization
 */
interface LazyThumbnailCardProps {
  originalUrl: string;
  index: number;
  onRemove: (index: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const LazyThumbnailCard = memo<LazyThumbnailCardProps>(({
  originalUrl,
  index,
  onRemove,
  scrollContainerRef
}) => {
  const [isInView, setIsInView] = useState(false);
  const [thumbSrc, setThumbSrc] = useState<string | null>(() => thumbnailCache.get(originalUrl) || null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    // Use IntersectionObserver with 200px margin so images are ready right before entering visible scroll area
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        root: scrollContainerRef.current || null,
        rootMargin: '200px'
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  useEffect(() => {
    if (!isInView || thumbSrc) return;

    let isSubscribed = true;
    getLowResThumbnail(originalUrl).then((thumb) => {
      if (isSubscribed) {
        setThumbSrc(thumb);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [isInView, originalUrl, thumbSrc]);

  return (
    <div
      ref={cardRef}
      className="relative group aspect-[16/10] rounded-lg overflow-hidden bg-black/50 border border-white/10"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '150px 94px'
      }}
    >
      {isInView && thumbSrc ? (
        <img
          alt={`Photograph ${index + 1}`}
          className="w-full h-full object-cover brightness-[0.92] group-hover:scale-105 transition-transform duration-200"
          src={thumbSrc}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full bg-black/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-sm text-slate-600 animate-pulse">
            photo
          </span>
        </div>
      )}

      {/* Remove Photo Action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer opacity-80 group-hover:opacity-100 z-10"
        title="Remove photograph"
      >
        ✕
      </button>

      {/* Photo Index Badge */}
      <span className="absolute bottom-1 left-1.5 font-mono text-[9px] text-white/90 bg-black/70 px-1 rounded pointer-events-none z-10">
        #{index + 1}
      </span>
    </div>
  );
});

LazyThumbnailCard.displayName = 'LazyThumbnailCard';

export const UploadPhotographs: React.FC<UploadPhotographsProps> = ({
  project,
  initialFileMap,
  onBack,
  onEditDetails,
  onPhotosChange,
  onContinue
}) => {
  // Retains existing original full-resolution photos from draftProject or empty array
  const [photos, setPhotos] = useState<string[]>(project.photos || []);
  // Map of previewUrl -> File object for locally selected files
  const fileStoreRef = useRef<Map<string, File>>(new Map(initialFileMap || []));

  useEffect(() => {
    if (project.photos && project.photos.length > 0 && photos.length === 0) {
      setPhotos(project.photos);
    }
  }, [project.photos]);

  const [currentStage, setCurrentStage] = useState<ReconstructionStage>(2);
  const [isMorphingAway, setIsMorphingAway] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileFormatError, setFileFormatError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Pre-cache low-res thumbnails in background idle slices for smooth scrolling
  useEffect(() => {
    if (photos.length === 0) return;

    let timeoutId: number | null = null;
    let index = 0;

    const processNext = () => {
      if (index >= photos.length) return;
      const url = photos[index];
      index++;

      if (!thumbnailCache.has(url)) {
        getLowResThumbnail(url).finally(() => {
          timeoutId = window.setTimeout(processNext, 16);
        });
      } else {
        timeoutId = window.setTimeout(processNext, 4);
      }
    };

    timeoutId = window.setTimeout(processNext, 50);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [photos]);

  const handleRemovePhoto = (index: number) => {
    const removedUrl = photos[index];
    if (removedUrl) {
      fileStoreRef.current.delete(removedUrl);
    }
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    onPhotosChange?.(updated, fileStoreRef.current);
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const validUrls: string[] = [];
    const rejectedFiles: string[] = [];

    files.forEach((file) => {
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const isValid =
        ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
        ALLOWED_EXTENSIONS.includes(ext);

      if (isValid) {
        const objUrl = URL.createObjectURL(file);
        fileStoreRef.current.set(objUrl, file);
        validUrls.push(objUrl);
      } else {
        rejectedFiles.push(file.name);
      }
    });

    if (rejectedFiles.length > 0) {
      setFileFormatError(
        rejectedFiles.length === 1
          ? `Unsupported file format in "${rejectedFiles[0]}". Please upload JPG, JPEG, or PNG images only.`
          : `Unsupported file format in ${rejectedFiles.length} files (${rejectedFiles.slice(0, 3).join(', ')}${
              rejectedFiles.length > 3 ? '...' : ''
            }). Please upload JPG, JPEG, or PNG images only.`
      );
    } else {
      setFileFormatError(null);
    }

    if (validUrls.length > 0) {
      const updated = [...photos, ...validUrls];
      setPhotos(updated);
      onPhotosChange?.(updated, fileStoreRef.current);
    }
  };

  const handleLoadSamplePhotos = () => {
    setFileFormatError(null);
    setPhotos(SAMPLE_42_PHOTOS);
    onPhotosChange?.(SAMPLE_42_PHOTOS, fileStoreRef.current);
  };

  const handleClearAll = () => {
    fileStoreRef.current.clear();
    setPhotos([]);
    onPhotosChange?.([], fileStoreRef.current);
  };

  const handleTriggerEditDetails = () => {
    onEditDetails(photos, fileStoreRef.current);
  };

  const handleStartReconstruction = async () => {
    if (photos.length < 20 || isMorphingAway || isUploading) return;

    setIsUploading(true);
    setUploadErrorMessage(null);
    setUploadProgress({ current: 0, total: photos.length });

    try {
      // 1. Transition stepper tick from Stage 2 to Stage 3 and morph away
      setCurrentStage(3);
      setIsMorphingAway(true);

      // 2. Delegate project creation, image upload, and reconstruction job creation
      await onContinue({
        projectId: project.id !== 'draft' ? project.id : undefined,
        photos,
        fileMap: fileStoreRef.current
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during photograph upload.';
      setUploadErrorMessage(msg);
      setIsUploading(false);
      setUploadProgress(null);
      setCurrentStage(2);
      setIsMorphingAway(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080c] text-slate-100 font-sans antialiased text-sm select-none pb-24">
      {/* Functional Reconstruction Stepper with Stage Transition */}
      <ReconstructionStepper
        currentStage={currentStage}
        onBackToProjects={onBack}
      />

      <main
        className={`max-w-6xl mx-auto px-6 lg:px-8 pt-10 transition-all duration-500 ease-out transform ${
          isMorphingAway
            ? 'opacity-0 scale-[0.93] -translate-y-8 blur-[10px] pointer-events-none'
            : 'animate-page-enter opacity-100 scale-100 translate-y-0 blur-0'
        }`}
      >
        {/* Title And Project Details Row */}
        <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">
              Upload Photographs
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-light">
              Select 40+ overlapping photographs of the indoor space to build your 3D digital twin.
            </p>
          </div>

          {/* Project Details Card */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between sm:justify-start gap-4">
            <div className="flex flex-col text-left">
              <span className="text-white font-medium text-sm leading-snug">{project.name}</span>
              {project.description ? (
                <span className="text-slate-400 text-xs font-light max-w-xs truncate">
                  {project.description}
                </span>
              ) : (
                <span className="text-slate-500 text-xs font-light">Indoor reconstruction</span>
              )}
            </div>
            <button
              onClick={handleTriggerEditDetails}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/25 hover:bg-white/[0.04] transition-all text-xs cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Edit Details</span>
            </button>
          </div>
        </section>

        {/* Error notification for upload failure */}
        {uploadErrorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-rose-400 text-lg mt-0.5 flex-shrink-0">
                error_outline
              </span>
              <div>
                <p className="font-semibold text-rose-200">Upload failed</p>
                <p className="text-rose-300/90 mt-0.5 leading-relaxed">{uploadErrorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploadErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error notification for unsupported file formats */}
        {fileFormatError && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-rose-400 text-lg mt-0.5 flex-shrink-0">
                warning
              </span>
              <div>
                <p className="font-semibold text-rose-200">Unsupported file format</p>
                <p className="text-rose-300/90 mt-0.5 leading-relaxed">{fileFormatError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFileFormatError(null)}
              className="text-rose-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Dismiss warning"
            >
              ✕
            </button>
          </div>
        )}

        {/* Warning: Less than 20 photographs uploaded */}
        {photos.length > 0 && photos.length < 20 && (
          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3.5 shadow-lg">
            <span className="material-symbols-outlined text-amber-400 text-2xl flex-shrink-0 mt-0.5">
              warning
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-100 text-sm">
                  Low photograph count ({photos.length} uploaded)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Minimum 20 required
                </span>
              </div>
              <p className="text-amber-200/90 leading-relaxed text-xs">
                PRISM photogrammetry requires at least <strong>40+ overlapping photographs</strong> for dense 3D Gaussian Splatting and accurate spatial reconstruction. Uploading fewer than 20 images is insufficient and will cause reconstruction artifacts or camera registration failure.
              </p>
              <p className="text-amber-300 font-medium text-xs pt-1 flex items-center gap-1.5">
                <span>Please upload more photographs (at least 40+ recommended).</span>
              </p>
            </div>
          </div>
        )}

        {/* Hidden File Input for All Upload Triggers */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {/* SINGLE UNIFIED SECTION: Upload Images Here */}
        <section className="mt-6">
          {photos.length === 0 ? (
            /* State 1: Nothing uploaded yet -> "Upload images here" dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl py-16 px-6 flex flex-col items-center justify-center transition-all cursor-pointer group bg-white/[0.01] ${
                isDragging
                  ? 'border-[#ea580c] bg-[#ea580c]/10 shadow-[0_0_24px_rgba(234,88,12,0.15)]'
                  : 'border-white/15 hover:border-white/30 hover:bg-white/[0.02]'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-3 group-hover:scale-105 transition-transform duration-200">
                <span className="material-symbols-outlined text-3xl text-slate-300">
                  add_photo_alternate
                </span>
              </div>
              <h3 className="text-white text-base font-medium tracking-wide">
                Upload images here
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Drag and drop your photographs here, or click to browse
              </p>
              <button
                className="mt-4 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-200 text-black text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
                type="button"
              >
                Select Images from Device
              </button>
              <div className="mt-6 flex flex-col items-center gap-1.5 text-center">
                <p className="text-slate-500 text-xs font-light">
                  Supported formats: JPG, JPEG, PNG • Overlapping indoor vantage angles (40+ recommended)
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSamplePhotos();
                  }}
                  className="text-xs text-[#ea580c] hover:underline cursor-pointer pt-1"
                >
                  Or load sample dataset (42 photos)
                </button>
              </div>
            </div>
          ) : (
            /* State 2: Images uploaded -> High-performance thumbnail gallery */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`bg-white/[0.02] border rounded-2xl p-6 shadow-sm transition-all ${
                isDragging ? 'border-[#ea580c] bg-[#ea580c]/5' : 'border-white/[0.08]'
              }`}
            >
              {/* Top Header: Image count on top left */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                {/* Image Count on Top Left */}
                <div className="flex flex-wrap items-center gap-2.5 text-white font-medium text-xs">
                  <span className="tracking-wide text-slate-300">
                    <strong className="text-white font-semibold text-sm">{photos.length}</strong> photographs uploaded
                  </span>

                  {photos.length < 20 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Needs more images (min. 20, 40+ recommended)
                    </span>
                  )}
                  {photos.length >= 20 && photos.length < 40 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      Min met (40+ recommended for best quality)
                    </span>
                  )}
                  {photos.length >= 40 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      ✓ Optimal count for 3D Gaussian Splatting
                    </span>
                  )}
                </div>

                {/* Controls on Top Right */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Inside Scroller: 6 row-wise, 3 column-wise (18 visible for show) */}
              <div
                ref={scrollContainerRef}
                className="mt-5 max-h-[365px] overflow-y-auto pr-2 custom-inside-scrollbar"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {/* Uploaded Photo Thumbnails with Lazy Loading and Low-Res Optimization */}
                  {photos.map((photoUrl, index) => (
                    <LazyThumbnailCard
                      key={`${photoUrl}-${index}`}
                      originalUrl={photoUrl}
                      index={index}
                      onRemove={handleRemovePhoto}
                      scrollContainerRef={scrollContainerRef}
                    />
                  ))}

                  {/* Empty thumbnail with + icon at end of images when uploading */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group aspect-[16/10] rounded-lg border-2 border-dashed border-white/20 hover:border-[#ea580c] bg-white/[0.02] hover:bg-[#ea580c]/10 flex flex-col items-center justify-center cursor-pointer transition-all text-slate-400 hover:text-white"
                    title="Upload more photographs"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 group-hover:border-[#ea580c]/50 flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-xl text-slate-300 group-hover:text-[#ea580c] transition-colors">
                        add
                      </span>
                    </div>
                    <span className="text-[10px] font-medium mt-1 text-slate-400 group-hover:text-slate-200">
                      Add More
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Bottom Action Bar */}
        <div className="mt-8 flex items-center justify-end space-x-3.5">
          <button
            onClick={onBack}
            className="px-5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            type="button"
          >
            Cancel
          </button>

          {photos.length < 20 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 bg-white hover:bg-slate-200 text-black transition-all cursor-pointer shadow-sm disabled:opacity-50"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              <span>Upload</span>
            </button>
          ) : (
            <button
              onClick={handleStartReconstruction}
              disabled={isMorphingAway || isUploading}
              className="px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 bg-[#ea580c] hover:bg-[#f97316] text-black shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_25px_rgba(234,88,12,0.6)] cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              type="button"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin"></span>
                  <span>
                    Uploading {uploadProgress ? `${uploadProgress.current}/${uploadProgress.total}` : '...' }
                  </span>
                </>
              ) : (
                <>
                  <span>Start Reconstruction</span>
                  <span className="text-sm font-bold">→</span>
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
