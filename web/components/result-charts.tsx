"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationPayload } from "@/lib/types";

type QueuePoint = { timestamp: number; stage_id: string; queue_length: number };
type EventPoint = { timestamp: number; event_type: string; stage_id?: string | null };

export function ResultCharts({ result }: { result: SimulationPayload }) {
  const stageData = result.analytics.stages.map((stage) => ({
    name: stage.stage_id,
    utilization: Number((stage.utilization * 100).toFixed(1)),
    queue: Number(stage.average_queue_length.toFixed(2)),
    wait: Number(stage.average_wait_time.toFixed(2)),
  }));
  const machineData = result.analytics.machines.map((machine) => ({
    name: machine.machine_id,
    utilization: Number((machine.utilization * 100).toFixed(1)),
    downtime: Number(machine.downtime_time.toFixed(2)),
    breakdowns: machine.breakdowns,
  }));
  const queueRows = Array.isArray(result.raw_data.queue_lengths)
    ? (result.raw_data.queue_lengths as QueuePoint[])
    : [];
  const queueData = queueRows
    .slice(0, 500)
    .map((row) => ({ time: row.timestamp, queue: row.queue_length, stage: row.stage_id }));
  const batchData = result.analytics.batches.slice(0, 100).map((batch) => ({
    name: batch.batch_id,
    cycle: Number(batch.cycle_time.toFixed(2)),
    wait: Number(batch.queue_wait_time.toFixed(2)),
  }));
  const events = result.event_log as unknown as EventPoint[];
  const finalStage = result.analytics.stages.at(-1)?.stage_id;
  let completed = 0;
  const throughputData = events
    .filter((event) => event.event_type === "PROCESSING_FINISH" && event.stage_id === finalStage)
    .map((event) => ({ time: event.timestamp, completed: ++completed }));
  const timelineData = Array.from(
    events.reduce((buckets, event) => {
      const bucket = Math.floor(event.timestamp / 5) * 5;
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
      return buckets;
    }, new Map<number, number>()),
  ).map(([time, count]) => ({ time, count }));

  return (
    <div className="charts-grid">
      <ChartPanel summary="Загрузка каждого этапа в процентах." title="Загрузка этапов">
        <ResponsiveContainer height={300} width="100%">
          <BarChart data={stageData}>
            <CartesianGrid stroke="#d6d6d3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis unit="%" />
            <Tooltip />
            <Bar dataKey="utilization" fill="#0b0c0e" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel summary="Средняя очередь и ожидание по этапам." title="Давление потока">
        <ResponsiveContainer height={300} width="100%">
          <BarChart data={stageData}>
            <CartesianGrid stroke="#d6d6d3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="queue" fill="#ffcc00" stroke="#0b0c0e" />
            <Bar dataKey="wait" fill="#84878c" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel summary="Полезная загрузка и простой оборудования." title="Станки">
        <ResponsiveContainer height={300} width="100%">
          <BarChart data={machineData}>
            <CartesianGrid stroke="#d6d6d3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="utilization" fill="#0b0c0e" />
            <Bar dataKey="downtime" fill="#b42318" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel
        summary="Первые 500 замеров очереди; точные значения доступны в экспорте."
        title="Очередь во времени"
      >
        {queueData.length ? (
          <ResponsiveContainer height={300} width="100%">
            <LineChart data={queueData}>
              <CartesianGrid stroke="#d6d6d3" vertical={false} />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line dataKey="queue" dot={false} stroke="#0b0c0e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty">Замеры очереди отсутствуют.</div>
        )}
      </ChartPanel>
      <ChartPanel summary="Время полного прохождения и ожидание для первых 100 партий." title="Цикл партий">
        <ResponsiveContainer height={300} width="100%">
          <LineChart data={batchData}>
            <CartesianGrid stroke="#d6d6d3" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="cycle" dot={false} stroke="#0b0c0e" strokeWidth={2} />
            <Line dataKey="wait" dot={false} stroke="#ffcc00" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel
        summary="Количество отказов и время простоя по каждому станку."
        title="Распределение поломок"
      >
        <ResponsiveContainer height={300} width="100%">
          <BarChart data={machineData}>
            <CartesianGrid stroke="#d6d6d3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="breakdowns" fill="#b42318" />
            <Bar dataKey="downtime" fill="#84878c" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel summary="Накопленный выпуск готовых партий на последнем этапе." title="Выпуск во времени">
        <ResponsiveContainer height={300} width="100%">
          <LineChart data={throughputData}>
            <CartesianGrid stroke="#d6d6d3" vertical={false} />
            <XAxis dataKey="time" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line dataKey="completed" dot={false} stroke="#0b0c0e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel summary="Плотность событий движка по пятиминутным интервалам." title="Лента событий">
        <ResponsiveContainer height={300} width="100%">
          <BarChart data={timelineData}>
            <CartesianGrid stroke="#d6d6d3" vertical={false} />
            <XAxis dataKey="time" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#ffcc00" stroke="#0b0c0e" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
      <div className="chart-panel" style={{ gridColumn: "1 / -1" }}>
        <h3 className="chart-title">Табличная альтернатива графикам</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Этап</th>
                <th>Загрузка, %</th>
                <th>Средняя очередь</th>
                <th>Ожидание</th>
              </tr>
            </thead>
            <tbody>
              {stageData.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.utilization}</td>
                  <td>{row.queue}</td>
                  <td>{row.wait}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="chart-panel">
      <h3 className="chart-title">{title}</h3>
      <p className="chart-summary">{summary}</p>
      {children}
    </div>
  );
}
