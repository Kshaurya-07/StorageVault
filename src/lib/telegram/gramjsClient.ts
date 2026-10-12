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
 * GramJsTelegramService: Real Telegram MTProto implementation.
 * Connects to Telegram's actual MTProto servers as a user client,
 * enabling direct, end-to-end access to the user's personal Saved Messages.
 */
export class GramJsTelegramService implements ITelegramService {
  private apiId: number;
  private apiHash: string;
  // Ephemeral in-memory client instances during authentication flow
  private static pendingClients: Map<
    string,
    { client: TelegramClient; session: StringSessionInstance }
  > = new Map();

  constructor(apiId: number, apiHash: string) {
    this.apiId = apiId;
    this.apiHash = apiHash;
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
    await client.connect();
    return { client, session };
  }

  async sendCode(phoneNumber: string): Promise<SendCodeResult> {
    const cleanPhone = phoneNumber.replace(/\s+/g, "");
    const { client, session } = await this.createClient("");

    try {
      const res = await client.sendCode(
        {
          apiId: this.apiId,
          apiHash: this.apiHash,
        },
        cleanPhone
      );

      GramJsTelegramService.pendingClients.set(cleanPhone, { client, session });

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
  }): Promise<SignInResult> {
    const { phoneNumber, phoneCodeHash, phoneCode } = params;
    const cleanPhone = phoneNumber.replace(/\s+/g, "");

    let pending = GramJsTelegramService.pendingClients.get(cleanPhone);
    if (!pending) {
      pending = await this.createClient("");
      GramJsTelegramService.pendingClients.set(cleanPhone, pending);
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
      GramJsTelegramService.pendingClients.delete(cleanPhone);

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
  }): Promise<SignInResult> {
    const cleanPhone = params.phoneNumber?.replace(/\s+/g, "") || "";
    const pending = GramJsTelegramService.pendingClients.get(cleanPhone);
    if (!pending) {
      throw new Error("No pending Telegram login session found for 2FA verification");
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
      GramJsTelegramService.pendingClients.delete(cleanPhone);

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
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
  }): Promise<UploadFileResult> {
    const { sessionString, fileBuffer, fileName } = params;
    const { client } = await this.createClient(sessionString);

    try {
      const customFile = new CustomFile(fileName, fileBuffer.length, "", fileBuffer);

      // In Telegram MTProto, "me" routes directly to the user's personal Saved Messages
      const result: any = await client.sendFile("me", {
        file: customFile,
        caption: `VAULT AI: ${fileName}`,
        forceDocument: true,
        workers: 1,
      });

      await client.disconnect();

      return {
        telegramMessageId: result.id,
        telegramFileReference: result.media?.document?.id?.toString(),
        fileSizeBytes: fileBuffer.length,
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
}
