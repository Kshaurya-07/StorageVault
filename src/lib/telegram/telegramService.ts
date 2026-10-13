export interface SendCodeResult {
  phoneCodeHash: string;
  isCodeViaApp: boolean;
}

export interface SignInResult {
  needs2FA?: boolean;
  telegramUserId?: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  sessionString?: string;
}

export interface UploadFileResult {
  telegramMessageId: number;
  telegramFileReference?: string;
  fileSizeBytes: number;
}

export interface DownloadResult {
  buffer: Buffer;
  mimeType?: string;
  size?: number;
}

export interface ITelegramService {
  /**
   * Sends a Telegram login code. `userId` scopes the pending MTProto client so
   * one user's flow can never overwrite or observe another's.
   */
  sendCode(phoneNumber: string, userId: string): Promise<SendCodeResult>;
  signIn(params: {
    phoneNumber: string;
    phoneCodeHash: string;
    phoneCode: string;
    userId: string;
  }): Promise<SignInResult>;
  signIn2FA(params: {
    password: string;
    phoneNumber?: string;
    phoneCodeHash?: string;
    userId: string;
  }): Promise<SignInResult>;
  uploadToSavedMessages(params: {
    sessionString: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
  }): Promise<UploadFileResult>;
  downloadFromSavedMessages(params: {
    sessionString: string;
    messageId: number;
  }): Promise<DownloadResult>;
  deleteFromSavedMessages(params: {
    sessionString: string;
    messageId: number;
  }): Promise<boolean>;
  verifySession(sessionString: string): Promise<{
    valid: boolean;
    telegramUserId?: string;
    username?: string;
    firstName?: string;
  }>;
  /**
   * Best-effort server-side session revocation (Telegram auth.logOut).
   * Optional so mocks/tests can omit or no-op it.
   */
  revokeSession?(sessionString: string): Promise<void>;
}

/**
 * Returns the configured TelegramService implementation.
 * Defaults to MockTelegramService when TELEGRAM_MODE is "mock" or when API credentials are unset.
 */
export async function getTelegramService(): Promise<ITelegramService> {
  const mode = process.env.TELEGRAM_MODE?.toLowerCase();
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (mode === "real" && apiId && apiHash && apiHash !== "your_telegram_api_hash_here") {
    const { GramJsTelegramService } = await import("./gramjsClient");
    return new GramJsTelegramService(parseInt(apiId, 10), apiHash);
  }

  // Fallback / default to high-fidelity Mock service
  const { MockTelegramService } = await import("./mockTelegramService");
  return MockTelegramService.getInstance();
}
