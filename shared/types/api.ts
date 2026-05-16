export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: { code: string; message: string };
}

export interface TopicQuery {
  page?: number;
  pageSize?: number;
  part?: 1 | 2 | 3;
  categoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'draft' | 'published' | 'offline';
  keyword?: string;
  sortBy?: 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TopicCreateRequest {
  part: 1 | 2 | 3;
  categoryId: number;
  title: string;
  content: string;
  prompts?: string[];
  questions: string[];
  examples: QuestionExample[];
  part2Example?: QuestionExample;
  relatedPart2Id?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status?: 'draft' | 'published';
}

export interface TopicBatchRequest {
  action: 'delete' | 'updateCategory' | 'updateDifficulty' | 'updateStatus' | 'publish' | 'offline';
  ids: number[];
  data?: {
    categoryId?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    status?: 'draft' | 'published' | 'offline';
  };
}

export interface VocabQuery {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  keyword?: string;
  sortBy?: 'updatedAt' | 'createdAt' | 'word';
  sortOrder?: 'asc' | 'desc';
}

export interface VocabCreateRequest {
  word: string;
  definition: string;
  example?: string;
  categoryId: number;
  relatedTopicIds?: number[];
  status?: 'draft' | 'published';
}

export interface VocabBatchRequest {
  action: 'delete' | 'updateCategory';
  ids: number[];
  data?: {
    categoryId?: number;
  };
}

export interface QuestionExample {
  simple: string;
  band7: string;
}

export interface ImportPreviewResult {
  topics: {
    total: number;
    new: number;
    duplicate: number;
    invalid: number;
    errors: Array<{ index: number; reason: string }>;
  };
  vocabularies: {
    total: number;
    new: number;
    duplicate: number;
    invalid: number;
    errors: Array<{ index: number; reason: string }>;
  };
}

export interface VersionCreateRequest {
  version: string;
  summary?: string;
}

export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

export interface SystemConfigResponse {
  currentVersion: string;
  importLimit: number;
  syncEnabled: boolean;
}