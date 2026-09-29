import { describe, expect, it } from "vitest";
import { scenarioConfigSchema } from "./validation";

describe("scenarioConfigSchema", () => {
  it("accepts a minimal production line", () => {
    const result = scenarioConfigSchema.safeParse({
      scenario_name: "demo",
      simulation_duration: 10,
      stages: [{ stage_id: "cut", machines: [{ machine_id: "m1", processing_time: 1 }] }],
      batches: { count: 1, size: 1, route: ["cut"] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid probability", () => {
    const result = scenarioConfigSchema.safeParse({
      scenario_name: "demo",
      simulation_duration: 10,
      stages: [
        {
          stage_id: "cut",
          reject_probability: 2,
          machines: [{ machine_id: "m1", processing_time: 1 }],
        },
      ],
      batches: { count: 1 },
    });
    expect(result.success).toBe(false);
  });
});
