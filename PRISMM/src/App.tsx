import { useState, useEffect, useCallback } from 'react';
import { ViewMode, ProjectJob, JobStatus } from './types';
import { INITIAL_PROJECT_PHOTOS } from './data/mockProjects';
import { supabase } from './lib/supabase';
import { SpatialTour } from './components/SpatialTour';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { CreateProject } from './components/CreateProject';
import { UploadPhotographs } from './components/UploadPhotographs';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ProjectDetail } from './components/ProjectDetail';

interface SupabaseProjectRow {
    project_id: string;
    session_id: string | null;
    name: string;
    status: string;
    created_at: string;
}

function formatProjectDate(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} ${year}, ${time}`;
}

function mapSupabaseRowToJob(row: SupabaseProjectRow): ProjectJob {
    const normalizedStatus = (
        row.status === 'completed' ||
            row.status === 'processing' ||
            row.status === 'pending' ||
            row.status === 'failed'
            ? row.status
            : 'pending'
    ) as JobStatus;

    return {
        id: row.project_id,
        name: row.name || 'Untitled Project',
        description: '',
        dateCreated: formatProjectDate(row.created_at),
        photographsCount: 0,
        status: normalizedStatus,
        currentStep: normalizedStatus === 'completed' ? 5 : 1,
        thumbnailUrl: '',
        modelFormat: '3D Gaussian Splat (.spz)',
        modelPath: '',
        shareUrl: '',
        photos: []
    };
}

export default function App() {
    const [view, setView] = useState<ViewMode>('tour');
    const [projects, setProjects] = useState<ProjectJob[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<string>('');
    const [draftProject, setDraftProject] = useState<{
        name: string;
        description: string;
        photos: string[];
        fileMap?: Map<string, File>;
    } | null>(null);
    const [committedDraftProjectId, setCommittedDraftProjectId] = useState<string | null>(null);
    const [transitionState, setTransitionState] = useState<'idle' | 'exiting-projects' | 'exiting-create'>('idle');

    const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
    const [createProjectError, setCreateProjectError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ uploaded: number; total: number } | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Ensures an active Supabase anonymous session and corresponding row in public.sessions
    const ensureSession = async (): Promise<string> => {
        let uid: string | undefined;

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
            uid = sessionData.session.user.id;
        } else {
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
            if (authError || !authData?.user?.id) {
                throw new Error(authError?.message || 'Failed to initialize anonymous session.');
            }
            uid = authData.user.id;
        }

        // Verify or insert session row in public.sessions
        const { data: existingSessions, error: checkError } = await supabase
            .from('sessions')
            .select('session_id')
            .eq('session_id', uid)
            .limit(1);

        if (checkError) {
            throw new Error(`Session verification failed: ${checkError.message}`);
        }

        if (!existingSessions || existingSessions.length === 0) {
            const { error: insertSessionError } = await supabase
                .from('sessions')
                .insert({ session_id: uid });

            if (insertSessionError && insertSessionError.code !== '23505') {
                throw new Error(`Failed to create session: ${insertSessionError.message}`);
            }
        }

        return uid;
    };

    const fetchProjects = useCallback(async () => {
        setIsLoadingProjects(true);
        setProjectsError(null);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('project_id, session_id, name, status, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            const mapped: ProjectJob[] = (data || []).map((row) =>
                mapSupabaseRowToJob(row as SupabaseProjectRow)
            );
            setProjects(mapped);
            if (mapped.length > 0) {
                setActiveProjectId((prev) => (prev ? prev : mapped[0].id));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unable to connect to Supabase.';
            setProjectsError(message);
        } finally {
            setIsLoadingProjects(false);
        }
    }, []);

    useEffect(() => {
        // Automatically ensure anonymous session exists on startup and load projects
        ensureSession()
            .then(() => fetchProjects())
            .catch((err) => {
                console.error('Session startup error:', err);
                fetchProjects();
            });
    }, [fetchProjects]);

    const handleStartCreateProject = () => {
        setCreateProjectError(null);
        setUploadProgress(null);
        setUploadError(null);
        setActiveProjectId('');
        setCommittedDraftProjectId(null);
        setDraftProject(null);
        setTransitionState('exiting-projects');
        setTimeout(() => {
            setView('create-project');
            setTransitionState('idle');
        }, 200);
    };

    const handleBackFromCreate = () => {
        setCreateProjectError(null);
        setTransitionState('exiting-create');
        setTimeout(() => {
            if (draftProject?.photos && draftProject.photos.length > 0) {
                setView('upload-photos');
            } else {
                setDraftProject(null);
                setCommittedDraftProjectId(null);
                setActiveProjectId('');
                setView('projects');
            }
            setTransitionState('idle');
        }, 180);
    };

    const updateProjects = (newProjects: ProjectJob[]) => {
        setProjects(newProjects);
    };

    const activeProject =
        projects.find((p) => p.id === activeProjectId) ||
        (committedDraftProjectId ? projects.find((p) => p.id === committedDraftProjectId) : undefined) ||
        projects[0];

    const handleCreateProjectSubmit = (data: { name: string; description: string; photos: string[] }) => {
        // 1. If user is editing an already-persisted project (has valid existing project_id), update it in Supabase
        if (activeProjectId && activeProjectId !== 'draft' && !committedDraftProjectId) {
            const existing = projects.find((p) => p.id === activeProjectId);
            if (existing) {
                supabase
                    .from('projects')
                    .update({ name: data.name })
                    .eq('project_id', activeProjectId)
                    .then(({ error }) => {
                        if (error) console.error('Error updating existing project name:', error.message);
                    });

                const updated = projects.map((p) =>
                    p.id === activeProjectId
                        ? { ...p, name: data.name, description: data.description }
                        : p
                );
                updateProjects(updated);
            }
        }

        // 2. Purely store draft details in local state. DO NOT create rows in projects table yet!
        setDraftProject((prev) => ({
            name: data.name,
            description: data.description,
            photos: data.photos && data.photos.length > 0 ? data.photos : (prev?.photos || []),
            fileMap: prev?.fileMap
        }));

        // 3. Move to upload-photographs view
        setView('upload-photos');
    };

    const handleUploadContinue = async (payload: {
        projectId?: string;
        photos: string[];
        fileMap: Map<string, File>;
    }) => {
        // START RECONSTRUCTION:
        // This is the first point where the new project is persisted to Supabase!
        // 1. Ensure anonymous session and DB session row exist
        const sessionId = await ensureSession();

        let targetProjectId = (activeProjectId && activeProjectId !== 'draft')
            ? activeProjectId
            : (committedDraftProjectId || (payload.projectId && payload.projectId !== 'draft' ? payload.projectId : null));

        // If new project that hasn't been created yet, create exactly one row in projects table
        if (!targetProjectId || targetProjectId === 'draft') {
            const { data: insertedData, error: insertError } = await supabase
                .from('projects')
                .insert({
                    session_id: sessionId,
                    name: draftProject?.name?.trim() || 'Indoor Reconstruction',
                    status: 'pending'
                })
                .select('project_id, session_id, name, status, created_at')
                .single();

            if (insertError || !insertedData) {
                throw new Error(insertError?.message || 'Failed to create project in Supabase.');
            }

            targetProjectId = (insertedData as SupabaseProjectRow).project_id;
            setCommittedDraftProjectId(targetProjectId);
            setActiveProjectId(targetProjectId);

            const newJob = mapSupabaseRowToJob(insertedData as SupabaseProjectRow);
            newJob.description = draftProject?.description || '';
            newJob.photos = payload.photos;
            newJob.photographsCount = payload.photos.length;
            newJob.status = 'processing';

            setProjects((prev) => [newJob, ...prev.filter((p) => p.id !== newJob.id)]);
        } else {
            setActiveProjectId(targetProjectId);
        }

        // 2. Create exactly one reconstruction_jobs row for the project BEFORE uploading
        const { data: existingJobs } = await supabase
            .from('reconstruction_jobs')
            .select('job_id')
            .eq('project_id', targetProjectId)
            .limit(1);

        if (!existingJobs || existingJobs.length === 0) {
            const { error: jobError } = await supabase
                .from('reconstruction_jobs')
                .insert({
                    project_id: targetProjectId,
                    status: 'pending',
                    stage: 'Image Ingestion'
                });

            if (jobError) {
                throw new Error(`Failed to initialize reconstruction job: ${jobError.message}`);
            }
        }

        // 3. Update state and IMMEDIATELY transition to Reconstruction Status / Processing screen
        const projectName = draftProject?.name?.trim() || 'Indoor Reconstruction';
        const projectDesc = draftProject?.description || '';

        setProjects((prev) => {
            const existing = prev.find((p) => p.id === targetProjectId);
            if (existing) {
                return prev.map((p) => {
                    if (p.id === targetProjectId) {
                        return {
                            ...p,
                            name: p.name || projectName,
                            description: p.description || projectDesc,
                            photographsCount: payload.photos.length,
                            status: 'processing' as const,
                            currentStep: 1,
                            photos: payload.photos
                        };
                    }
                    return p;
                });
            } else {
                const committedJob: ProjectJob = {
                    id: targetProjectId,
                    name: projectName,
                    description: projectDesc,
                    dateCreated: formatProjectDate(new Date().toISOString()),
                    photographsCount: payload.photos.length,
                    status: 'processing' as const,
                    currentStep: 1,
                    thumbnailUrl: '',
                    modelFormat: '3D Gaussian Splat (.spz)',
                    modelPath: '',
                    shareUrl: '',
                    photos: payload.photos
                };
                return [committedJob, ...prev];
            }
        });

        setActiveProjectId(targetProjectId);
        setUploadError(null);
        setUploadProgress({ uploaded: 0, total: payload.photos.length });
        setDraftProject(null);
        setCommittedDraftProjectId(null);
        setView('processing');

        // 4. Asynchronously upload images to project-images/{targetProjectId}/{image_id}.{extension}
        const { data: existingRows } = await supabase
            .from('uploaded_images')
            .select('file_path')
            .eq('project_id', targetProjectId);

        const existingPaths = new Set((existingRows || []).map((r) => r.file_path));
        const newlyUploadedStoragePaths: string[] = [];
        const newlyInsertedDbFilePaths: string[] = [];
        let successfulUploads = 0;

        try {
            for (let i = 0; i < payload.photos.length; i++) {
                const photoRef = payload.photos[i];
                const localFile = payload.fileMap.get(photoRef);

                let fileBlob: Blob;
                let extension = 'jpg';

                if (localFile) {
                    fileBlob = localFile;
                    const detectedExt = (localFile.name.split('.').pop() || '').toLowerCase();
                    if (detectedExt) extension = detectedExt;
                } else {
                    const res = await fetch(photoRef);
                    if (!res.ok) throw new Error(`Failed to load image for upload (#${i + 1}).`);
                    fileBlob = await res.blob();
                    if (fileBlob.type.includes('png')) extension = 'png';
                }

                const imageId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                const storagePath = `${targetProjectId}/${imageId}.${extension}`;
                const fullFilePath = `project-images/${storagePath}`;

                const { error: storageError } = await supabase.storage
                    .from('project-images')
                    .upload(storagePath, fileBlob, {
                        contentType: fileBlob.type || `image/${extension}`,
                        upsert: false
                    });

                if (storageError) {
                    throw new Error(`Storage upload failed: ${storageError.message}`);
                }

                newlyUploadedStoragePaths.push(storagePath);

                if (!existingPaths.has(fullFilePath)) {
                    const { error: dbError } = await supabase
                        .from('uploaded_images')
                        .insert({
                            project_id: targetProjectId,
                            file_path: fullFilePath,
                            uploaded_at: new Date().toISOString()
                        });

                    if (dbError) {
                        throw new Error(`Failed to record image metadata: ${dbError.message}`);
                    }
                    newlyInsertedDbFilePaths.push(fullFilePath);
                    existingPaths.add(fullFilePath);
                }

                // Increment ONLY after BOTH storage upload and metadata insertion succeed
                successfulUploads++;
                setUploadProgress({ uploaded: successfulUploads, total: payload.photos.length });
            }

            // 5. Advance to Spatial Reconstruction once all images and metadata have successfully uploaded
            if (successfulUploads === payload.photos.length) {
                const { error: updateJobError } = await supabase
                    .from('reconstruction_jobs')
                    .update({
                        stage: 'Spatial Reconstruction',
                        status: 'running',
                        started_at: new Date().toISOString()
                    })
                    .eq('project_id', targetProjectId);

                if (updateJobError) {
                    console.warn('Failed to advance reconstruction job stage:', updateJobError.message);
                }

                await supabase
                    .from('projects')
                    .update({ status: 'processing' })
                    .eq('project_id', targetProjectId);

                setProjects((prev) =>
                    prev.map((p) => {
                        if (p.id === targetProjectId) {
                            return {
                                ...p,
                                status: 'processing' as const,
                                currentStep: 2
                            };
                        }
                        return p;
                    })
                );
            }
        } catch (uploadError) {
            // FAILURE HANDLING:
            // Clean up partially uploaded Storage objects and related metadata from this attempt
            if (newlyUploadedStoragePaths.length > 0) {
                try {
                    await supabase.storage.from('project-images').remove(newlyUploadedStoragePaths);
                } catch (cleanupStorageErr) {
                    console.warn('Failed to clean up storage objects:', cleanupStorageErr);
                }
            }
            if (newlyInsertedDbFilePaths.length > 0) {
                try {
                    await supabase
                        .from('uploaded_images')
                        .delete()
                        .eq('project_id', targetProjectId)
                        .in('file_path', newlyInsertedDbFilePaths);
                } catch (cleanupDbErr) {
                    console.warn('Failed to clean up uploaded_images metadata:', cleanupDbErr);
                }
            }

            try {
                await supabase
                    .from('reconstruction_jobs')
                    .update({ status: 'failed' })
                    .eq('project_id', targetProjectId);
            } catch (failErr) {
                console.warn('Failed to update reconstruction job to failed:', failErr);
            }

            const errorMsg = uploadError instanceof Error ? uploadError.message : 'Upload failed.';
            setUploadError(errorMsg);
            setProjects((prev) =>
                prev.map((p) => {
                    if (p.id === targetProjectId) {
                        return {
                            ...p,
                            status: 'failed' as const
                        };
                    }
                    return p;
                })
            );
        }
    };

    const handleProcessingComplete = () => {
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id === activeProjectId) {
                    return {
                        ...p,
                        status: 'completed' as const,
                        currentStep: 5
                    };
                }
                return p;
            })
        );
        // Stay on canonical Reconstruction Status screen where state transitions to completed
    };

    const handleViewProject = (projectId: string) => {
        setActiveProjectId(projectId);
        setUploadProgress(null);
        setUploadError(null);
        setView('processing');
    };

    const handleDeleteProject = (projectId: string) => {
        setProjects((prev) => {
            const updated = prev.filter((p) => p.id !== projectId);
            if (activeProjectId === projectId && updated.length > 0) {
                setActiveProjectId(updated[0].id);
            }
            return updated;
        });
    };

    const handleStepUpdate = (step: number) => {
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id === activeProjectId) {
                    return { ...p, currentStep: step };
                }
                return p;
            })
        );
    };

    return (
        <div className="min-h-screen bg-[#05070b] text-[#f1f4f9] selection:bg-[#ea580c] selection:text-white">
            {/* Screen 1: Spatial Entry & Chambers Tour (Horizontal Sliding ONLY for Intro) */}
            {view === 'tour' && (
                <SpatialTour onEnterWorkspace={() => setView('projects')} />
            )}

            {/* Screen 2: Projects Dashboard (Standard Page) */}
            {view === 'projects' && (
                <div
                    className={
                        transitionState === 'exiting-projects'
                            ? 'animate-page-exit pointer-events-none'
                            : 'animate-page-enter'
                    }
                >
                    <ProjectsDashboard
                        projects={projects}
                        isLoading={isLoadingProjects}
                        errorMessage={projectsError}
                        onRetry={fetchProjects}
                        onCreateProject={handleStartCreateProject}
                        onViewProject={handleViewProject}
                        onDeleteProject={handleDeleteProject}
                        onReplayTour={() => setView('tour')}
                    />
                </div>
            )}

            {/* Screen 3: Create Project Form (Standard Page) */}
            {view === 'create-project' && (
                <div
                    className={
                        transitionState === 'exiting-create'
                            ? 'animate-page-exit pointer-events-none'
                            : 'animate-page-enter'
                    }
                >
                    <CreateProject
                        initialName={draftProject?.name || (activeProjectId && activeProjectId !== 'draft' ? activeProject?.name : '')}
                        initialDescription={draftProject?.description || (activeProjectId && activeProjectId !== 'draft' ? activeProject?.description : '')}
                        initialPhotos={draftProject?.photos || (activeProjectId && activeProjectId !== 'draft' ? activeProject?.photos : [])}
                        isSubmitting={isCreatingProject}
                        errorMessage={createProjectError}
                        onBack={handleBackFromCreate}
                        onSubmit={handleCreateProjectSubmit}
                    />
                </div>
            )}

            {/* Screen 4: Upload Photographs & Validate (Standard Page) */}
            {view === 'upload-photos' && (
                <UploadPhotographs
                    project={{
                        id: activeProjectId || committedDraftProjectId || 'draft',
                        name: draftProject?.name || (activeProjectId && activeProjectId !== 'draft' ? activeProject?.name : '') || 'New Reconstruction',
                        description: draftProject?.description || (activeProjectId && activeProjectId !== 'draft' ? activeProject?.description : '') || '',
                        dateCreated: activeProjectId && activeProjectId !== 'draft' ? activeProject?.dateCreated || 'Draft' : 'Draft',
                        photographsCount: draftProject?.photos?.length || (activeProjectId && activeProjectId !== 'draft' ? activeProject?.photographsCount : 0) || 0,
                        status: activeProject?.status || 'pending',
                        currentStep: activeProject?.currentStep || 1,
                        thumbnailUrl: draftProject?.photos?.[0] || activeProject?.thumbnailUrl || '',
                        modelFormat: '3D Gaussian Splat (.spz)',
                        modelPath: activeProject?.modelPath || '',
                        shareUrl: activeProject?.shareUrl || '',
                        photos: draftProject?.photos && draftProject.photos.length > 0 ? draftProject.photos : (activeProject?.photos || [])
                    }}
                    initialFileMap={draftProject?.fileMap}
                    onBack={() => {
                        setDraftProject(null);
                        setCommittedDraftProjectId(null);
                        setActiveProjectId('');
                        setView('projects');
                    }}
                    onPhotosChange={(updatedPhotos, updatedFileMap) => {
                        setDraftProject((prev) =>
                            prev
                                ? { ...prev, photos: updatedPhotos, fileMap: updatedFileMap || prev.fileMap }
                                : { name: '', description: '', photos: updatedPhotos, fileMap: updatedFileMap }
                        );
                    }}
                    onEditDetails={(currentPhotos, currentFileMap) => {
                        setDraftProject((prev) =>
                            prev
                                ? { ...prev, photos: currentPhotos, fileMap: currentFileMap || prev.fileMap }
                                : { name: '', description: '', photos: currentPhotos, fileMap: currentFileMap }
                        );
                        setView('create-project');
                    }}
                    onContinue={handleUploadContinue}
                />
            )}

            {/* Screen 5: Reconstruction Status & Processing (Standard Page) */}
            {view === 'processing' && (
                <ProcessingScreen
                    project={
                        activeProject || {
                            id: activeProjectId || committedDraftProjectId || '',
                            name: draftProject?.name || 'Indoor Reconstruction',
                            description: draftProject?.description || '',
                            dateCreated: formatProjectDate(new Date().toISOString()),
                            photographsCount: 0,
                            status: 'processing',
                            currentStep: 1,
                            thumbnailUrl: '',
                            photos: []
                        }
                    }
                    uploadProgress={uploadProgress}
                    uploadError={uploadError}
                    onBackToProjects={() => setView('projects')}
                    onComplete={handleProcessingComplete}
                    onUpdateStep={handleStepUpdate}
                    onNavigateToDetails={() => setView('create-project')}
                    onNavigateToUpload={() => setView('upload-photos')}
                />
            )}

            {/* Screen 6: Canonical Reconstruction Status Screen (Completed & Processing) */}
            {view === 'project-detail' && (
                <ProcessingScreen
                    project={
                        activeProject || {
                            id: activeProjectId || '',
                            name: 'Indoor Reconstruction',
                            description: '',
                            dateCreated: formatProjectDate(new Date().toISOString()),
                            photographsCount: 0,
                            status: 'completed',
                            currentStep: 5,
                            thumbnailUrl: '',
                            photos: []
                        }
                    }
                    uploadProgress={uploadProgress}
                    uploadError={uploadError}
                    onBackToProjects={() => setView('projects')}
                    onComplete={handleProcessingComplete}
                    onUpdateStep={handleStepUpdate}
                    onNavigateToDetails={() => setView('create-project')}
                    onNavigateToUpload={() => setView('upload-photos')}
                />
            )}
        </div>
    );
}
