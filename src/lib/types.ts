export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type ConnectionStatus =
  | "DISCONNECTED"
  | "PENDING_CODE"
  | "PENDING_2FA"
  | "CONNECTED"
  | "REVOKED"
  | "EXPIRED";

export type FileCategory =
  | "DOCUMENT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "ARCHIVE"
  | "OTHER";

export type UploadStatus = "PENDING" | "UPLOADING" | "COMPLETED" | "FAILED";

export interface UserSession {
  userId: string;
  email: string;
  name?: string | null;
  /** Bumped on password change/reset; tokens carrying a stale version are rejected. */
  tokenVersion?: number;
}

export interface TelegramStatusResponse {
  connected: boolean;
  status: ConnectionStatus;
  telegramUserId?: string | null;
  telegramUsername?: string | null;
  telegramFirstName?: string | null;
  phoneNumber?: string | null;
  connectedAt?: string | null;
}

export interface FileMetadata {
  id: string;
  ownerUserId: string;
  telegramMessageId?: number | null;
  originalFilename: string;
  displayFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  category: FileCategory;
  uploadStatus: UploadStatus;
  isFavorite: boolean;
  isChunked?: boolean;
  uploadedAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface StorageAnalyticsData {
  totalFiles: number;
  totalSizeBytes: number;
  formattedTotalSize: string;
  categoryCounts: Record<FileCategory, number>;
  categorySizes: Record<FileCategory, number>;
  recentUploadsCount: number;
  largestFiles: FileMetadata[];
  uploadsByDate: { date: string; count: number; bytes: number }[];
}

export interface AiSearchResult {
  query: string;
  parsedFilters: {
    categories?: FileCategory[];
    minSizeBytes?: number;
    maxSizeBytes?: number;
    dateRange?: { from?: string; to?: string };
    keywords?: string[];
    tags?: string[];
  };
  explanation: string;
  matchedFiles: FileMetadata[];
  suggestedTags: string[];
}
