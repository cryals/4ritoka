"""Validated HTTP contracts for the simulation service."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RunOverrides(BaseModel):
    """Optional per-run changes applied to a copied scenario."""

    model_config = ConfigDict(extra="forbid")

    batches_count: int | None = Field(default=None, ge=1, le=100_000)
    simulation_duration: float | None = Field(default=None, ge=0, le=10_000_000)
    seed: int | None = Field(default=None, ge=0, le=2_147_483_647)
    breakdown_probability: float | None = Field(default=None, ge=0, le=1)


class SimulationRequest(BaseModel):
    """Request accepted by the simulation endpoint."""

    model_config = ConfigDict(extra="forbid")

    scenario: dict[str, Any]
    overrides: RunOverrides = Field(default_factory=RunOverrides)


class ComparisonRequest(BaseModel):
    """Request for an in-memory comparison of several scenarios."""

    model_config = ConfigDict(extra="forbid")

    scenarios: list[SimulationRequest] = Field(min_length=2, max_length=20)


class HealthResponse(BaseModel):
    """Service health response."""

    status: str
    service: str
    version: str

