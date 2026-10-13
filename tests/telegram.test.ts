import { MockTelegramService } from "../src/lib/telegram/mockTelegramService";

describe("Telegram Saved Messages MTProto Integration", () => {
  let tgService: MockTelegramService;

  beforeEach(() => {
    tgService = MockTelegramService.getInstance();
    tgService.reset();
  });

  it("should send confirmation code for valid phone number", async () => {
    const res = await tgService.sendCode("+1234567890", "test-user");
    expect(res.phoneCodeHash).toBeDefined();
    expect(res.phoneCodeHash.startsWith("mock_hash_")).toBe(true);
    expect(res.isCodeViaApp).toBe(true);
  });

  it("should fail sendCode for invalid phone numbers", async () => {
    await expect(tgService.sendCode("12", "test-user")).rejects.toThrow("PHONE_NUMBER_INVALID");
  });

  it("should sign in successfully with valid phone code and return session string", async () => {
    const codeRes = await tgService.sendCode("+1234567890", "test-user");
    const signRes = await tgService.signIn({
      phoneNumber: "+1234567890",
      phoneCodeHash: codeRes.phoneCodeHash,
      phoneCode: "12345",
      userId: "test-user",
    });

    expect(signRes.needs2FA).toBe(false);
    expect(signRes.sessionString).toBeDefined();
    expect(signRes.sessionString?.startsWith("mock_session_")).toBe(true);
    expect(signRes.telegramUserId).toBe("1234567890");
  });

  it("should trigger 2FA challenge when required and complete with password", async () => {
    const codeRes = await tgService.sendCode("+19999999999", "test-user");
    const signRes = await tgService.signIn({
      phoneNumber: "+19999999999",
      phoneCodeHash: codeRes.phoneCodeHash,
      phoneCode: "99999", // triggers 2FA in mock
      userId: "test-user",
    });

    expect(signRes.needs2FA).toBe(true);
    expect(signRes.sessionString).toBeUndefined();

    // Now submit 2FA password
    const twoFaRes = await tgService.signIn2FA({ password: "myCloudPassword123", userId: "test-user" });
    expect(twoFaRes.needs2FA).toBe(false);
    expect(twoFaRes.sessionString).toBeDefined();
  });

  it("should upload file directly to personal Saved Messages and return message ID", async () => {
    const sessionString = "mock_session_user_alice";
    const buffer = Buffer.from("Hello Telegram Saved Messages");

    const upload = await tgService.uploadToSavedMessages({
      sessionString,
      fileBuffer: buffer,
      fileName: "notes.txt",
      mimeType: "text/plain",
    });

    expect(upload.telegramMessageId).toBeGreaterThan(0);
    expect(upload.fileSizeBytes).toBe(buffer.length);

    // Download it back
    const downloaded = await tgService.downloadFromSavedMessages({
      sessionString,
      messageId: upload.telegramMessageId,
    });

    expect(downloaded.buffer.toString()).toBe("Hello Telegram Saved Messages");
    expect(downloaded.mimeType).toBe("text/plain");

    // Delete it
    const deleted = await tgService.deleteFromSavedMessages({
      sessionString,
      messageId: upload.telegramMessageId,
    });
    expect(deleted).toBe(true);

    // Trying to download after deletion should fail
    await expect(
      tgService.downloadFromSavedMessages({
        sessionString,
        messageId: upload.telegramMessageId,
      })
    ).rejects.toThrow("MESSAGE_ID_INVALID");
  });

  it("should prevent User A from accessing User B's Telegram Saved Messages", async () => {
    const sessionAlice = "mock_session_alice";
    const sessionBob = "mock_session_bob";

    const uploadAlice = await tgService.uploadToSavedMessages({
      sessionString: sessionAlice,
      fileBuffer: Buffer.from("Alice's Secret Journal"),
      fileName: "alice_diary.txt",
      mimeType: "text/plain",
    });

    // Bob attempts to download Alice's Telegram message
    await expect(
      tgService.downloadFromSavedMessages({
        sessionString: sessionBob,
        messageId: uploadAlice.telegramMessageId,
      })
    ).rejects.toThrow("MESSAGE_ID_INVALID");
  });
});
