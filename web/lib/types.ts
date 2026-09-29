export type Language = "ru" | "en";
export type RunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
  language: Language;
  createdAt: string;
};

export type Scenario = {
  id: string;
  userId: string;
  name: string;
  description: string;
  config: ScenarioConfig;
  formatVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ScenarioConfig = {
  scenario_name: string;
  description?: string;
  simulation_duration: number;
  seed?: number | null;
  stages: Array<{
    stage_id: string;
    name?: string;
    queue_limit?: number | null;
    buffer_capacity?: number | null;
    reject_probability?: number;
    next_stage_id?: string | null;
    machines: Array<{
      machine_id: string;
      name?: string;
      processing_time: number;
      breakdown_probability?: number;
      repair_time?: number;
    }>;
  }>;
  batches: {
    mode?: string;
    count?: number;
    size?: number;
    arrival_interval?: number;
    route?: string[];
    items?: Array<Record<string, unknown>>;
  };
  [key: string]: unknown;
};

export type GeneralMetrics = {
  total_batches: number;
  completed_batches: number;
  rejected_batches: number;
  simulation_time: number;
  output_units: number;
  rejected_units: number;
  completion_rate: number;
  rejection_rate: number;
  average_cycle_time: number;
  average_wait_time: number;
  throughput: number;
  total_breakdowns: number;
  total_repair_time: number;
  total_busy_time: number;
  total_idle_time: number;
};

export type StageMetrics = {
  stage_id: string;
  processed_batches: number;
  output_units: number;
  average_wait_time: number;
  average_processing_time: number;
  average_queue_length: number;
  max_queue_length: number;
  average_buffer_length: number;
  max_buffer_length: number;
  utilization: number;
  rejected_batches: number;
  breakdowns: number;
  downtime_time: number;
  completion_rate: number;
};

export type MachineMetrics = {
  machine_id: string;
  stage_id: string | null;
  busy_time: number;
  idle_time: number;
  downtime_time: number;
  breakdowns: number;
  repair_count: number;
  average_repair_time: number;
  utilization: number;
};

export type BatchMetrics = {
  batch_id: string;
  cycle_time: number;
  queue_wait_time: number;
  processing_time: number;
  stages_count: number;
  completed: boolean;
  rejected: boolean;
  waited_in_queue: boolean;
  status: string;
};

export type Analytics = {
  scenario_name: string;
  general: GeneralMetrics;
  stages: StageMetrics[];
  machines: MachineMetrics[];
  batches: BatchMetrics[];
};

export type EventLogRecord = {
  timestamp: number;
  event_type: string;
  batch_id: string | null;
  stage_id: string | null;
  machine_id: string | null;
  result: string;
  details: Record<string, unknown>;
};

export type SimulationPayload = {
  scenario_name: string;
  simulation_time: number;
  seed: number | null;
  analytics: Analytics;
  report: {
    bottleneck: Record<string, unknown>;
    recommendations: string[];
    performance_insights: Record<string, unknown>;
    [key: string]: unknown;
  };
  event_log: EventLogRecord[];
  raw_data: Record<string, unknown>;
};

export type SimulationRun = {
  id: string;
  scenarioId: string | null;
  scenarioName: string;
  status: RunStatus;
  seed: number | null;
  parameters: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  result?: SimulationPayload | null;
};
