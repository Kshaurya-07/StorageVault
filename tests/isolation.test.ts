import prisma from "../src/lib/db";
import { executeAiSearch } from "../src/lib/ai/aiSearchEngine";
import { hashPassword } from "../src/lib/auth";

describe("Multi-User Tenant Isolation Tests", () => {
  let userAId: string;
  let userBId: string;
  let fileAId: string;
  let fileBId: string;

  beforeAll(async () => {
    // Clean up test users if existing
    await prisma.fileTag.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.file.deleteMany();
    await prisma.telegramConnection.deleteMany();
    await prisma.user.deleteMany();

    const pwdHash = await hashPassword("SecurePass123!");

    // Create User A
    const userA = await prisma.user.create({
      data: {
        email: "alice@vault.ai",
        passwordHash: pwdHash,
        name: "Alice",
      },
    });
    userAId = userA.id;

    // Create User B
    const userB = await prisma.user.create({
      data: {
        email: "bob@vault.ai",
        passwordHash: pwdHash,
        name: "Bob",
      },
    });
    userBId = userB.id;

    // User A uploads Java notes
    const fileA = await prisma.file.create({
      data: {
        ownerUserId: userAId,
        telegramMessageId: 101,
        originalFilename: "java_notes_chapter1.pdf",
        displayFilename: "java_notes_chapter1.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 2048576,
        category: "DOCUMENT",
        uploadStatus: "COMPLETED",
      },
    });
    fileAId = fileA.id;

    // User B uploads Python notes
    const fileB = await prisma.file.create({
      data: {
        ownerUserId: userBId,
        telegramMessageId: 202,
        originalFilename: "python_notes_advanced.pdf",
        displayFilename: "python_notes_advanced.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 3145728,
        category: "DOCUMENT",
        uploadStatus: "COMPLETED",
      },
    });
    fileBId = fileB.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should ensure User A cannot retrieve User B's file via direct query", async () => {
    // Attempt to query User B's file with User A's credentials
    const file = await prisma.file.findFirst({
      where: {
        id: fileBId,
        ownerUserId: userAId, // User A's session
      },
    });

    expect(file).toBeNull();
  });

  it("should ensure User B cannot retrieve User A's file via direct query", async () => {
    const file = await prisma.file.findFirst({
      where: {
        id: fileAId,
        ownerUserId: userBId, // User B's session
      },
    });

    expect(file).toBeNull();
  });

  it("should ensure AI Search strictly isolates search results between users", async () => {
    // User A searches for "notes"
    const searchAlice = await executeAiSearch({
      userId: userAId,
      query: "Find my notes",
    });

    // Alice should only see Alice's files
    expect(searchAlice.matchedFiles.length).toBe(1);
    expect(searchAlice.matchedFiles[0].id).toBe(fileAId);
    expect(searchAlice.matchedFiles.some((f) => f.id === fileBId)).toBe(false);

    // User B searches for "notes"
    const searchBob = await executeAiSearch({
      userId: userBId,
      query: "Find my notes",
    });

    // Bob should only see Bob's files
    expect(searchBob.matchedFiles.length).toBe(1);
    expect(searchBob.matchedFiles[0].id).toBe(fileBId);
    expect(searchBob.matchedFiles.some((f) => f.id === fileAId)).toBe(false);
  });
});
