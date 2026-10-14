import { TelegramClient, Api, sessions, client as tgClient } from "telegram";
type StringSessionInstance = InstanceType<typeof sessions.StringSession>;
const { StringSession } = sessions;
const { CustomFile } = tgClient.uploads;
import {
  ITelegramService,
  SendCodeResult,
  SignInResult,
  UploadFileResult,
  DownloadResult,
} from "./telegramService";

/**
 * Races a promise against a timer so network operations can never hang
 * forever. The underlying promise keeps running (it cannot be cancelled),
 * but the caller gets a proper error instead of an infinite hang.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Upload bound scaled by file size: 10s per MB, minimum 90s (small files
 * fail fast instead of hanging), maximum 15 minutes (large files get room).
 */
function uploadTimeoutMs(sizeBytes: number): number {
  const scaled = Math.ceil(sizeBytes / (1024 * 1024)) * 10_000;
  return Math.min(Math.max(scaled, 90_000), 15 * 60_000);
}

/**
 * GramJsTelegramService: Real Telegram MTProto implementation.
 * Connects to Telegram's actual MTProto servers as a user client,
 * enabling direct, end-to-end access to the user's personal Saved Messages.
 */
export class GramJsTelegramService implements ITelegramService {
  private apiId: number;
  private apiHash: string;
  // Ephemeral in-memory client instances during authentication flow.
  // Keyed by `${userId}:${phoneNumber}` so one user's flow can never
  // overwrite, observe, or steal another user's pending login.
  private static pendingClients: Map<
    string,
    { client: TelegramClient; session: StringSessionInstance; createdAt: number }
  > = new Map();

  /** Pending login clients expire after 10 minutes (abandoned flows are evicted). */
  private static readonly PENDING_TTL_MS = 10 * 60 * 1000;

  constructor(apiId: number, apiHash: string) {
    this.apiId = apiId;
    this.apiHash = apiHash;
  }

  private static pendingKey(userId: string, phoneNumber: string): string {
    return `${userId}:${phoneNumber.replace(/\s+/g, "")}`;
  }

  /** Remove one pending entry, disconnecting its client. */
  private static async evictPending(key: string): Promise<void> {
    const pending = GramJsTelegramService.pendingClients.get(key);
    if (pending) {
      GramJsTelegramService.pendingClients.delete(key);
      try {
        await pending.client.disconnect();
      } catch {
        // Best effort — the entry is gone regardless.
      }
    }
  }

  /** Drop all expired pending entries (prevents FD/memory leak from abandoned flows). */
  private static async sweepExpiredPending(): Promise<void> {
    const now = Date.now();
    for (const [key, pending] of GramJsTelegramService.pendingClients) {
      if (now - pending.createdAt > GramJsTelegramService.PENDING_TTL_MS) {
        await GramJsTelegramService.evictPending(key);
      }
    }
  }

  /** Fetch a live pending entry, evicting it if expired. Returns null when absent/expired. */
  private static async takePending(
    userId: string,
    phoneNumber: string
  ): Promise<{ client: TelegramClient; session: StringSessionInstance } | null> {
    const key = GramJsTelegramService.pendingKey(userId, phoneNumber);
    const pending = GramJsTelegramService.pendingClients.get(key);
    if (!pending) return null;
    if (Date.now() - pending.createdAt > GramJsTelegramService.PENDING_TTL_MS) {
      await GramJsTelegramService.evictPending(key);
      return null;
    }
    return pending;
  }

  private async createClient(sessionString: string = ""): Promise<{
    client: TelegramClient;
    session: StringSessionInstance;
  }> {
    const session = new StringSession(sessionString);
    const client = new TelegramClient(session, this.apiId, this.apiHash, {
      connectionRetries: 3,
      useWSS: false,
    });
    // connect() can hang indefinitely on flaky networks — bound it so a
    // stalled handshake surfaces as an error instead of hanging the request.
    await withTimeout(client.connect(), 30_000, "Telegram connect");
    return { client, session };
  }

  async sendCode(phoneNumber: string, userId: string): Promise<SendCodeResult> {
    const cleanPhone = phoneNumber.replace(/\s+/g, "");
    if (!userId) {
      throw new Error("A user scope is required to send a Telegram code.");
    }
    await GramJsTelegramService.sweepExpiredPending();
    const { client, session } = await this.createClient("");

    try {
      const res = await client.sendCode(
        {
          apiId: this.apiId,
          apiHash: this.apiHash,
        },
        cleanPhone
      );

      // Evict any stale entry for this user+phone before storing the new one.
      const key = GramJsTelegramService.pendingKey(userId, cleanPhone);
      await GramJsTelegramService.evictPending(key);
      GramJsTelegramService.pendingClients.set(key, {
        client,
        session,
        createdAt: Date.now(),
      });

      return {
        phoneCodeHash: res.phoneCodeHash,
        isCodeViaApp: res.isCodeViaApp || false,
      };
    } catch (err: any) {
      await client.disconnect();
      throw new Error(err.message || "Failed to send Telegram confirmation code");
    }
  }

  async signIn(params: {
    phoneNumber: string;
    phoneCodeHash: string;
    phoneCode: string;
    userId: string;
  }): Promise<SignInResult> {
    const { phoneNumber, phoneCodeHash, phoneCode, userId } = params;
    const cleanPhone = phoneNumber.replace(/\s+/g, "");

    let pending = await GramJsTelegramService.takePending(userId, cleanPhone);
    if (!pending) {
      // No live pending client (e.g. server restarted): start a fresh one so
      // signIn can still proceed with the code hash the user received.
      const fresh = await this.createClient("");
      const key = GramJsTelegramService.pendingKey(userId, cleanPhone);
      GramJsTelegramService.pendingClients.set(key, {
        ...fresh,
        createdAt: Date.now(),
      });
      pending = fresh;
    }
    const { client, session } = pending;

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: cleanPhone,
          phoneCodeHash,
          phoneCode,
        })
      );

      const me: any = await client.getMe();
      const sessionString = session.save();
      await GramJsTelegramService.evictPending(
        GramJsTelegramService.pendingKey(userId, cleanPhone)
      );

      return {
        needs2FA: false,
        telegramUserId: me?.id?.toString(),
        telegramUsername: me?.username,
        telegramFirstName: me?.firstName,
        sessionString,
      };
    } catch (err: any) {
      if (
        err.message?.includes("SESSION_PASSWORD_NEEDED") ||
        err.errorMessage === "SESSION_PASSWORD_NEEDED"
      ) {
        return {
          needs2FA: true,
        };
      }
      throw new Error(err.message || "Telegram verification code failed");
    }
  }

  async signIn2FA(params: {
    password: string;
    phoneNumber?: string;
    userId: string;
  }): Promise<SignInResult> {
    const cleanPhone = params.phoneNumber?.replace(/\s+/g, "") || "";
    const pending = await GramJsTelegramService.takePending(params.userId, cleanPhone);
    if (!pending) {
      throw new Error(
        "No pending Telegram login session found for 2FA verification (it may have expired — please request a new code)."
      );
    }
    const { client, session } = pending;

    try {
      await client.signInWithPassword({
        apiId: this.apiId,
        apiHash: this.apiHash,
      }, {
        password: async () => params.password,
        onError: (err: any) => {
          throw err;
        },
      });

      const me: any = await client.getMe();
      const sessionString = session.save();
      await GramJsTelegramService.evictPending(
        GramJsTelegramService.pendingKey(params.userId, cleanPhone)
      );

      return {
        needs2FA: false,
        telegramUserId: me?.id?.toString(),
        telegramUsername: me?.username,
        telegramFirstName: me?.firstName,
        sessionString,
      };
    } catch (err: any) {
      throw new Error(err.message || "Invalid Telegram 2FA cloud password");
    }
  }

  async uploadToSavedMessages(params: {
    sessionString: string;
    fileName: string;
    mimeType: string;
    fileBuffer?: Buffer;
    filePath?: string;
    fileSizeBytes?: number;
  }): Promise<UploadFileResult> {
    const { sessionString, fileBuffer, filePath, fileName } = params;
    const { client } = await this.createClient(sessionString);

    const size =
      typeof params.fileSizeBytes === "number"
        ? params.fileSizeBytes
        : fileBuffer?.length;
    if (size === undefined || size < 0) {
      throw new Error("Upload requires fileBuffer or filePath with fileSizeBytes.");
    }

    try {
      // When a filePath is supplied, gramjs reads the file from disk in
      // chunks (CustomBuffer slices via fs) for files above its internal
      // buffer threshold — the multi-GB payload is never fully held in RAM.
      const customFile = new CustomFile(fileName, size, filePath ?? "", fileBuffer);

      // In Telegram MTProto, "me" routes directly to the user's personal Saved Messages
      //
      // TIMEOUT: gramjs' internal upload loop retries a failed sender FOREVER
      // (its UPLOAD_TIMEOUT constant is defined but never used). Without our
      // own bound, a stalled network hangs this await indefinitely and the
      // HTTP request never completes ("1 uploading…" forever). Scale the
      // bound with file size so large uploads get room but small ones fail
      // fast with a retryable error.
      const result: any = await withTimeout(
        client.sendFile("me", {
          file: customFile,
          caption: `StorageVault: ${fileName}`,
          forceDocument: true,
          workers: 1,
        }),
        uploadTimeoutMs(size),
        "Telegram upload"
      );

      await client.disconnect();

      return {
        telegramMessageId: result.id,
        telegramFileReference: result.media?.document?.id?.toString(),
        fileSizeBytes: size,
      };
    } catch (err: any) {
      await client.disconnect();
      throw new Error(`Telegram upload failed: ${err.message}`);
    }
  }

  async downloadFromSavedMessages(params: {
    sessionString: string;
    messageId: number;
  }): Promise<DownloadResult> {
    const { sessionString, messageId } = params;
    const { client } = await this.createClient(sessionString);

    try {
      const messages: any = await client.getMessages("me", {
        ids: [messageId],
      });

      if (!messages || messages.length === 0 || !messages[0]?.media) {
        throw new Error(`Message ${messageId} not found in Saved Messages or has no media`);
      }

      const media = messages[0].media;
      const buffer = (await client.downloadMedia(media, {})) as Buffer;

      await client.disconnect();

      return {
        buffer,
        size: buffer.length,
        mimeType: media.document?.mimeType,
      };
    } catch (err: any) {
      await client.disconnect();
      throw new Error(`Telegram download failed: ${err.message}`);
    }
  }

  /**
   * Streaming download via gramjs `iterDownload`: yields the file in ~1MB
   * pieces without ever holding the whole file in RAM. The MTProto client is
   * disconnected when the iterator is exhausted or abandoned (try/finally on
   * the async generator).
   */
  async downloadStreamFromSavedMessages(params: {
    sessionString: string;
    messageId: number;
  }): Promise<AsyncIterable<Buffer>> {
    const { sessionString, messageId } = params;
    const { client } = await this.createClient(sessionString);

    let messages: any;
    try {
      messages = await client.getMessages("me", { ids: [messageId] });
    } catch (err: any) {
      await client.disconnect().catch(() => {});
      throw new Error(`Telegram download failed: ${err.message}`);
    }
    if (!messages || messages.length === 0 || !messages[0]?.media) {
      await client.disconnect().catch(() => {});
      throw new Error(`Message ${messageId} not found in Saved Messages or has no media`);
    }
    let media: any = messages[0].media;
    // Unwrap MessageMediaDocument -> Document (same as gramjs internals).
    const doc = media.document ? media.document : media;
    if (!doc || !doc.id || !doc.accessHash) {
      await client.disconnect().catch(() => {});
      throw new Error(`Message ${messageId} has no downloadable document`);
    }
    // Full-file location (empty thumbSize = the file itself, not a thumbnail),
    // mirroring gramjs' own _downloadDocument construction.
    const location = new Api.InputDocumentFileLocation({
      id: doc.id,
      accessHash: doc.accessHash,
      fileReference: doc.fileReference,
      thumbSize: "",
    });
    const fileSize = typeof doc.size === "bigint" ? doc.size : BigInt(doc.size || 0);

    async function* gen(): AsyncGenerator<Buffer> {
      try {
        for await (const chunk of client.iterDownload({
          file: location,
          fileSize,
          requestSize: 1024 * 1024, // 1MB pieces, matching gramjs' own default
        })) {
          yield Buffer.from(chunk as Buffer);
        }
      } finally {
        await client.disconnect().catch(() => {});
      }
    }
    return gen();
  }

  async deleteFromSavedMessages(params: {
    sessionString: string;
    messageId: number;
  }): Promise<boolean> {
    const { sessionString, messageId } = params;
    const { client } = await this.createClient(sessionString);

    try {
      await client.deleteMessages("me", [messageId], { revoke: true });
      await client.disconnect();
      return true;
    } catch (err: any) {
      await client.disconnect();
      throw new Error(`Telegram delete failed: ${err.message}`);
    }
  }

  async verifySession(sessionString: string): Promise<{
    valid: boolean;
    telegramUserId?: string;
    username?: string;
    firstName?: string;
  }> {
    try {
      const { client } = await this.createClient(sessionString);
      const me: any = await client.getMe();
      await client.disconnect();
      return {
        valid: true,
        telegramUserId: me?.id?.toString(),
        username: me?.username,
        firstName: me?.firstName,
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Server-side session revocation: terminates the MTProto authorization on
   * Telegram's servers so a stolen session string stops working.
   */
  async revokeSession(sessionString: string): Promise<void> {
    const { client } = await this.createClient(sessionString);
    try {
      await client.invoke(new Api.auth.LogOut());
    } finally {
      try {
        await client.disconnect();
      } catch {
        // Best effort.
      }
    }
  }
}
