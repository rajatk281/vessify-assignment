import { describe, test, expect } from "bun:test";
import { extractTransaction } from "../src/lib/extractor";

// ─── Sample Texts from Assignment ────────────────────────────────────

const SAMPLE_1 = `Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
Balance after transaction: 18,420.50`;

const SAMPLE_2 = `Uber Ride * Airport Drop
12/11/2025 → ₹1,250.00 debited
Available Balance → ₹17,170.50`;

const SAMPLE_3 = `txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping`;

// ─── Test 1: Sample 1 — Standard multi-line statement ────────────────

describe("Extractor: Sample 1 (Standard multi-line)", () => {
  const result = extractTransaction(SAMPLE_1);

  test("extracts correct date", () => {
    const d = result.date;
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11); // December = 11
    expect(d.getDate()).toBe(11);
  });

  test("extracts correct amount", () => {
    expect(result.amount).toBe(420.0);
  });

  test("extracts meaningful description", () => {
    expect(result.description.toUpperCase()).toContain("STARBUCKS");
  });

  test("has high confidence", () => {
    expect(result.confidence).toBeGreaterThanOrEqual(0.66);
  });
});

// ─── Test 2: Sample 2 — Slash-date with ₹ symbol ────────────────────

describe("Extractor: Sample 2 (Slash date + ₹ symbol)", () => {
  const result = extractTransaction(SAMPLE_2);

  test("extracts correct date (DD/MM/YYYY)", () => {
    const d = result.date;
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(10); // November = 10
    expect(d.getDate()).toBe(12);
  });

  test("extracts correct ₹ amount", () => {
    expect(result.amount).toBe(1250.0);
  });

  test("extracts Uber Ride description", () => {
    expect(result.description.toLowerCase()).toContain("uber");
  });
});

// ─── Test 3: Sample 3 — Messy single-line ────────────────────────────

describe("Extractor: Sample 3 (Messy single-line)", () => {
  const result = extractTransaction(SAMPLE_3);

  test("extracts ISO date", () => {
    const d = result.date;
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11); // December
    expect(d.getDate()).toBe(10);
  });

  test("extracts ₹2,999.00 amount", () => {
    expect(result.amount).toBe(2999.0);
  });

  test("extracts Amazon description", () => {
    expect(result.description.toLowerCase()).toContain("amazon");
  });
});

// ─── Test 4: Edge cases ──────────────────────────────────────────────

describe("Extractor: Edge cases", () => {
  test("handles empty text gracefully", () => {
    const result = extractTransaction("");
    expect(result.description).toBe("Unknown Transaction");
    expect(result.amount).toBe(0);
    expect(result.confidence).toBe(0);
  });

  test("handles text with no recognizable patterns", () => {
    const result = extractTransaction("just some random text here");
    expect(result.amount).toBe(0);
    expect(result.confidence).toBeLessThan(1);
  });

  test("always returns a valid date", () => {
    const result = extractTransaction("no date here $50.00");
    expect(result.date).toBeInstanceOf(Date);
    expect(isNaN(result.date.getTime())).toBe(false);
  });
});

// ─── Test 5: Confidence scoring ──────────────────────────────────────

describe("Extractor: Confidence scoring", () => {
  test("full confidence when all 3 fields are extracted", () => {
    const result = extractTransaction(SAMPLE_1);
    expect(result.confidence).toBe(1.0);
  });

  test("zero confidence when nothing is extractable", () => {
    const result = extractTransaction("");
    expect(result.confidence).toBe(0);
  });

  test("partial confidence for partial data", () => {
    const result = extractTransaction("2025-12-10 unknown");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(1);
  });
});

// ─── Test 6: Data isolation shape ────────────────────────────────────

describe("Extractor: Return type correctness", () => {
  test("returns all required fields", () => {
    const result = extractTransaction(SAMPLE_1);
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("amount");
    expect(result).toHaveProperty("date");
    expect(result).toHaveProperty("confidence");
  });

  test("amount is always a number", () => {
    const result = extractTransaction(SAMPLE_2);
    expect(typeof result.amount).toBe("number");
    expect(isNaN(result.amount)).toBe(false);
  });

  test("confidence is between 0 and 1", () => {
    const result = extractTransaction(SAMPLE_3);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
