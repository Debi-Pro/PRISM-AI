export type ViewMode = 
  | 'tour'
  | 'projects'
  | 'create-project'
  | 'upload-photos'
  | 'processing'
  | 'project-detail';

export type JobStatus = 'completed' | 'processing' | 'pending' | 'failed';

export interface ProjectJob {
  id: string;
  name: string;
  description?: string;
  dateCreated: string;
  photographsCount: number;
  status: JobStatus;
  currentStep: number; // 1 to 5
  thumbnailUrl: string;
  modelFormat?: string;
  modelPath?: string;
  shareUrl?: string;
  photos: string[];
}
