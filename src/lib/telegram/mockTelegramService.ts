import {
  ITelegramService,
  SendCodeResult,
  SignInResult,
  UploadFileResult,
  DownloadResult,
} from "./telegramService";

interface MockSavedMessage {
  messageId: number;
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  fileSizeBytes: number;
  uploadedAt: Date;
}

/**
 * MockTelegramService: In-memory simulation of Telegram MTProto client and Saved Messages.
 * Used for automated tests, CI, and local evaluation without external SMS / API keys.
 * Strictly enforces per-session isolation.
 */
export class MockTelegramService implements ITelegramService {
  private static instance: MockTelegramService;

  // Map of sessionString -> Map<messageId, MockSavedMessage>
  private userSavedMessages: Map<string, Map<number, MockSavedMessage>> = new Map();
  private pendingCodes: Map<string, { phone: string; hash: string }> = new Map();
  private nextMessageId: number = 1000;

  public static getInstance(): MockTelegramService {
    if (!MockTelegramService.instance) {
      MockTelegramService.instance = new MockTelegramService();
    }
    return MockTelegramService.instance;
  }

  // Reset helper for tests
  public reset(): void {
    this.userSavedMessages.clear();
    this.pendingCodes.clear();
    this.nextMessageId = 1000;
  }

  async sendCode(phoneNumber: string, userId?: string): Promise<SendCodeResult> {
    if (!phoneNumber || phoneNumber.trim().length < 6) {
      throw new Error("PHONE_NUMBER_INVALID: Please enter a valid international phone number.");
    }
    const cleanPhone = phoneNumber.replace(/\s+/g, "");
    const phoneCodeHash = `mock_hash_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    // Scope pending codes per user, mirroring the real service.
    const key = userId ? `${userId}:${cleanPhone}` : cleanPhone;
    this.pendingCodes.set(key, { phone: cleanPhone, hash: phoneCodeHash });

    return {
      phoneCodeHash,
      isCodeViaApp: true,
    };
  }

  async signIn(params: {
    phoneNumber: string;
    phoneCodeHash: string;
    phoneCode: string;
    userId?: string;
  }): Promise<SignInResult> {
    const { phoneNumber, phoneCode } = params;
    const cleanPhone = phoneNumber.replace(/\s+/g, "");

    // Mock validation: code should be 5 digits (default test code 12345 or any 5 digits)
    if (!phoneCode || phoneCode.trim().length < 4) {
      throw new Error("PHONE_CODE_INVALID: The confirmation code is invalid.");
    }

    // If phone number ends in '2fa', simulate Telegram two-step password requirement
    if (cleanPhone.endsWith("2fa") || phoneCode === "99999") {
      return {
        needs2FA: true,
      };
    }

    const mockSession = `mock_session_tg_${cleanPhone.replace(/[^0-9]/g, "")}_${Date.now()}`;
    const sanitizedId = cleanPhone.replace(/[^0-9]/g, "") || "987654321";

    return {
      needs2FA: false,
      telegramUserId: sanitizedId,
      telegramUsername: `user_${sanitizedId.slice(-4)}`,
      telegramFirstName: "StorageVault User",
      sessionString: mockSession,
    };
  }

  async signIn2FA(params: { password: string; userId?: string }): Promise<SignInResult> {
    if (!params.password || params.password.length < 4) {
      throw new Error("PASSWORD_HASH_INVALID: Incorrect Telegram 2FA cloud password.");
    }

    const mockSession = `mock_session_2fa_${Date.now()}`;
    return {
      needs2FA: false,
      telegramUserId: "2fa_verified_user",
      telegramUsername: "vault_2fa_user",
      telegramFirstName: "Verified 2FA User",
      sessionString: mockSession,
    };
  }

  async uploadToSavedMessages(params: {
    sessionString: string;
    fileName: string;
    mimeType: string;
    fileBuffer?: Buffer;
    filePath?: string;
    fileSizeBytes?: number;
  }): Promise<UploadFileResult> {
    const { sessionString, fileName, mimeType } = params;
    if (!sessionString) {
      throw new Error("AUTH_KEY_UNREGISTERED: Unauthorized Telegram session.");
    }

    // The mock keeps everything in memory by design (tests only use tiny
    // fixtures); resolve a filePath to a buffer here.
    let fileBuffer = params.fileBuffer;
    if (!fileBuffer && params.filePath) {
      const { promises: fs } = await import("fs");
      fileBuffer = await fs.readFile(params.filePath);
    }
    if (!fileBuffer) {
      throw new Error("Upload requires fileBuffer or filePath.");
    }

    let userStorage = this.userSavedMessages.get(sessionString);
    if (!userStorage) {
      userStorage = new Map<number, MockSavedMessage>();
      this.userSavedMessages.set(sessionString, userStorage);
    }

    const messageId = ++this.nextMessageId;
    userStorage.set(messageId, {
      messageId,
      fileName,
      mimeType,
      fileBuffer,
      fileSizeBytes: fileBuffer.length,
      uploadedAt: new Date(),
    });

    return {
      telegramMessageId: messageId,
      telegramFileReference: `ref_mock_${messageId}`,
      fileSizeBytes: fileBuffer.length,
    };
  }

  async downloadFromSavedMessages(params: {
    sessionString: string;
    messageId: number;
  }): Promise<DownloadResult> {
    const { sessionString, messageId } = params;
    const userStorage = this.userSavedMessages.get(sessionString);

    if (!userStorage || !userStorage.has(messageId)) {
      throw new Error(`MESSAGE_ID_INVALID: File not found in user's Telegram Saved Messages (id=${messageId})`);
    }

    const msg = userStorage.get(messageId)!;
    return {
      buffer: msg.fileBuffer,
      mimeType: msg.mimeType,
      size: msg.fileSizeBytes,
    };
  }

  async deleteFromSavedMessages(params: {
    sessionString: string;
    messageId: number;
  }): Promise<boolean> {
    const { sessionString, messageId } = params;
    const userStorage = this.userSavedMessages.get(sessionString);
    if (!userStorage || !userStorage.has(messageId)) {
      return false;
    }
    userStorage.delete(messageId);
    return true;
  }

  async verifySession(sessionString: string): Promise<{
    valid: boolean;
    telegramUserId?: string;
    username?: string;
    firstName?: string;
  }> {
    if (!sessionString || !sessionString.startsWith("mock_session_")) {
      return { valid: false };
    }
    return {
      valid: true,
      telegramUserId: "mock_tg_id",
      username: "vault_user",
      firstName: "StorageVault User",
    };
  }

  /** Mock revocation: no-op (no real Telegram session exists). */
  async revokeSession(_sessionString: string): Promise<void> {
    return;
  }
}
