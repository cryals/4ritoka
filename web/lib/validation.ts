import { z } from "zod";

const machineSchema = z
  .object({
    machine_id: z.string().trim().min(1),
    name: z.string().optional(),
    processing_time: z.number().nonnegative(),
    breakdown_probability: z.number().min(0).max(1).optional(),
    repair_time: z.number().nonnegative().optional(),
  })
  .passthrough();

const stageSchema = z
  .object({
    stage_id: z.string().trim().min(1),
    name: z.string().optional(),
    queue_limit: z.number().int().nonnegative().nullable().optional(),
    buffer_capacity: z.number().int().nonnegative().nullable().optional(),
    reject_probability: z.number().min(0).max(1).optional(),
    next_stage_id: z.string().nullable().optional(),
    machines: z.array(machineSchema).min(1),
  })
  .passthrough();

export const scenarioConfigSchema = z
  .object({
    scenario_name: z.string().trim().min(1).max(120),
    description: z.string().max(1000).optional(),
    simulation_duration: z.number().nonnegative().max(10_000_000),
    seed: z.number().int().nonnegative().nullable().optional(),
    stages: z.array(stageSchema).min(1).max(200),
    batches: z
      .object({
        mode: z.string().optional(),
        count: z.number().int().positive().max(100_000).optional(),
        size: z.number().int().positive().optional(),
        arrival_interval: z.number().nonnegative().optional(),
        route: z.array(z.string()).optional(),
        items: z.array(z.record(z.string(), z.unknown())).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const scenarioInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(""),
  config: scenarioConfigSchema,
});

export const runInputSchema = z
  .object({
    scenarioId: z.string().uuid().nullable().optional(),
    presetId: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .nullable()
      .optional(),
    overrides: z
      .object({
        batches_count: z.number().int().positive().max(100_000).optional(),
        simulation_duration: z.number().nonnegative().max(10_000_000).optional(),
        seed: z.number().int().nonnegative().max(2_147_483_647).optional(),
        breakdown_probability: z.number().min(0).max(1).optional(),
      })
      .default({}),
  })
  .refine((value) => Boolean(value.scenarioId || value.presetId), {
    message: "Select a saved scenario or preset",
  });

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10).max(200),
});

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`).join("; ");
}
