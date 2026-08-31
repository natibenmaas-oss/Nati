import { describe, expect, it } from "vitest";
import { estimateRecognitionAccuracy } from "@/lib/speech/estimate-accuracy";

describe("estimateRecognitionAccuracy", () => {
  it("returns 100 for an identical text", () => {
    const text = "הילד קרא ספר מעניין מאוד";
    expect(estimateRecognitionAccuracy(text, text)).toBe(100);
  });

  it("returns null when the recognized text is empty", () => {
    expect(estimateRecognitionAccuracy("", "הילד קרא ספר")).toBeNull();
  });

  it("returns null when the original text is empty", () => {
    expect(estimateRecognitionAccuracy("הילד קרא ספר", "")).toBeNull();
  });

  it("ignores punctuation and casing differences", () => {
    const original = "שלום, עולם! מה שלומך?";
    const recognized = "שלום עולם מה שלומך";
    expect(estimateRecognitionAccuracy(recognized, original)).toBe(100);
  });

  it("gives a partial score for a partially-matching transcript", () => {
    const original = "הכלב רץ מהר בגינה הגדולה";
    const recognized = "הכלב רץ לאט בבית הקטן";
    const score = estimateRecognitionAccuracy(recognized, original);
    expect(score).not.toBeNull();
    expect(score as number).toBeGreaterThan(0);
    expect(score as number).toBeLessThan(100);
  });

  it("does not exceed 100 or go below 0", () => {
    const score = estimateRecognitionAccuracy("מילה אחת בלבד", "טקסט שונה לגמרי בלי שום קשר");
    expect(score).not.toBeNull();
    expect(score as number).toBeGreaterThanOrEqual(0);
    expect(score as number).toBeLessThanOrEqual(100);
  });

  it("handles repeated words correctly via multiset matching (not naive set overlap)", () => {
    // "קרא קרא קרא" מול טקסט עם "קרא" פעם אחת בלבד - לא אמור לקבל 100%
    const original = "הוא קרא ספר אחד";
    const recognized = "קרא קרא קרא";
    const score = estimateRecognitionAccuracy(recognized, original);
    expect(score).not.toBeNull();
    expect(score as number).toBeLessThan(100);
  });
});
