"""Application service that adapts HTTP payloads to the simulation engine."""

from __future__ import annotations

import random
from copy import deepcopy
from dataclasses import asdict, is_dataclass
from enum import Enum
from pathlib import Path
from typing import Any

from analytics import calculate_analytics
from engine import SimulationEngine
from reporting import build_report_payload
from scenario import build_scenario, load_config_dict

from python_service.schemas import RunOverrides, SimulationRequest


def run_simulation(request: SimulationRequest) -> dict[str, Any]:
    """Run one validated scenario and return a JSON-safe payload."""
    config = _apply_overrides(request.scenario, request.overrides)
    scenario_input = build_scenario(load_config_dict(config))
    seed = request.overrides.seed
    if seed is None:
        seed = scenario_input.scenario_config.seed

    result = SimulationEngine(
        production_line=scenario_input.production_line,
        batches=scenario_input.batches,
        simulation_duration=scenario_input.scenario_config.simulation_duration,
        scenario_name=scenario_input.scenario_config.name,
        rng=random.Random(seed),
    ).run()
    analytics = calculate_analytics(result)
    report = build_report_payload(
        result=result,
        analytics=analytics,
        scenario_description=scenario_input.scenario_config.description,
    )
    return {
        "scenario_name": result.scenario_name,
        "simulation_time": result.simulation_time,
        "seed": seed,
        "analytics": analytics.to_dict(),
        "report": report.to_dict(),
        "event_log": [_json_safe(row) for row in result.event_log],
        "raw_data": _json_safe(result.raw_data),
    }


def compare_simulations(requests: list[SimulationRequest]) -> dict[str, Any]:
    """Run and compare scenarios using the existing analytics contract."""
    typed_analytics = []
    runs = []
    for request in requests:
        run = run_simulation(request)
        runs.append(run)
        # Comparison rows are derived from the already serialized contract.
        # Re-running would double CPU time, so reconstruct the small typed DTO below.
        typed_analytics.append(run["analytics"])

    comparison = []
    for analytics in typed_analytics:
        general = analytics["general"]
        stages = analytics.get("stages", [])
        machines = analytics.get("machines", [])
        comparison.append(
            {
                "scenario_name": analytics["scenario_name"],
                "output_units": general["output_units"],
                "average_cycle_time": general["average_cycle_time"],
                "rejection_rate": general["rejection_rate"],
                "average_queue_length": _average(stages, "average_queue_length"),
                "average_wait_time": _average(stages, "average_wait_time"),
                "average_machine_utilization": _average(machines, "utilization"),
                "throughput": general["throughput"],
                "total_breakdowns": general["total_breakdowns"],
                "total_repair_time": general["total_repair_time"],
                "completion_rate": general["completion_rate"],
            }
        )
    return {"runs": runs, "comparison": comparison}


def _average(rows: list[dict[str, Any]], key: str) -> float:
    if not rows:
        return 0.0
    return sum(float(row.get(key, 0.0)) for row in rows) / len(rows)


def _apply_overrides(raw_config: dict[str, Any], overrides: RunOverrides) -> dict[str, Any]:
    config = deepcopy(raw_config)
    if overrides.batches_count is not None:
        config.setdefault("batches", {})["count"] = overrides.batches_count
    if overrides.simulation_duration is not None:
        config["simulation_duration"] = overrides.simulation_duration
    if overrides.seed is not None:
        config["seed"] = overrides.seed
    if overrides.breakdown_probability is not None:
        for stage in config.get("stages", []):
            for machine in stage.get("machines", []):
                machine["breakdown_probability"] = overrides.breakdown_probability
    return config


def _json_safe(value: Any) -> Any:
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, Enum):
        return value.value
    if is_dataclass(value):
        return {key: _json_safe(item) for key, item in asdict(value).items()}
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value
