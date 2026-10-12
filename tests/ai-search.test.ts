import { parseNaturalLanguageQuery } from "../src/lib/ai/queryParser";

describe("AI Deterministic Query Parser", () => {
  it("should parse size constraint 'larger than 100 MB'", () => {
    const res = parseNaturalLanguageQuery("Show videos larger than 100 MB");
    expect(res.categories).toContain("VIDEO");
    expect(res.minSizeBytes).toBe(100 * 1024 * 1024);
  });

  it("should parse size constraint '< 10mb'", () => {
    const res = parseNaturalLanguageQuery("Show files < 10mb");
    expect(res.maxSizeBytes).toBe(10 * 1024 * 1024);
  });

  it("should parse date filters 'uploaded yesterday'", () => {
    const res = parseNaturalLanguageQuery("Show files uploaded yesterday");
    expect(res.dateFrom).toBeDefined();
    expect(res.dateTo).toBeDefined();
  });

  it("should parse date filters 'uploaded last week'", () => {
    const res = parseNaturalLanguageQuery("Show PDFs uploaded last week");
    expect(res.categories).toContain("DOCUMENT");
    expect(res.exactExtensions).toContain("pdf");
    expect(res.dateFrom).toBeDefined();
  });

  it("should extract keywords from 'Find my Java notes'", () => {
    const res = parseNaturalLanguageQuery("Find my Java notes");
    expect(res.keywords).toContain("java");
    expect(res.categories).toContain("DOCUMENT");
  });

  it("should extract keywords from 'Find my Navratri posters'", () => {
    const res = parseNaturalLanguageQuery("Find my Navratri posters");
    expect(res.keywords).toContain("navratri");
    expect(res.categories).toContain("IMAGE");
  });

  it("should extract keywords from 'Find my DBMS assignment'", () => {
    const res = parseNaturalLanguageQuery("Find my DBMS assignment");
    expect(res.keywords).toContain("dbms");
    expect(res.categories).toContain("DOCUMENT");
  });
});
