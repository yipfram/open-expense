import { describe, expect, it } from "vitest";

import { canCorrectInProcessView, getFinanceProcessStatusMeta } from "@/src/lib/finance-process";

describe("finance process presentation", () => {
  it("maps submitted and received labels for process workflow", () => {
    expect(getFinanceProcessStatusMeta("submitted").label).toBe("To validate");
    expect(getFinanceProcessStatusMeta("received").label).toBe("Validated");
  });

  it("allows corrections only while status is submitted", () => {
    expect(canCorrectInProcessView("submitted")).toBe(true);
    expect(canCorrectInProcessView("received")).toBe(false);
    expect(canCorrectInProcessView("draft")).toBe(false);
  });
});
