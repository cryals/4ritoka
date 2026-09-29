"""FastAPI entrypoint for the Fabriq simulation service."""

from __future__ import annotations

import asyncio
import os
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from python_service.schemas import ComparisonRequest, HealthResponse, SimulationRequest
from python_service.service import compare_simulations, run_simulation
from scenario.config_loader import ConfigurationError

SERVICE_VERSION = "1.0.0"
MAX_REQUEST_BYTES = int(os.getenv("FABRIQ_MAX_REQUEST_BYTES", "2097152"))
SIMULATION_TIMEOUT_SECONDS = float(os.getenv("FABRIQ_SIMULATION_TIMEOUT", "120"))

app = FastAPI(
    title="Fabriq Simulation API",
    version=SERVICE_VERSION,
    docs_url="/docs" if os.getenv("FABRIQ_API_DOCS", "false").lower() == "true" else None,
    redoc_url=None,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("FABRIQ_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def limit_request_size(request: Request, call_next: Any) -> JSONResponse:
    """Reject obviously oversized JSON payloads before parsing."""
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_REQUEST_BYTES:
                return JSONResponse(status_code=413, content={"detail": "Request body is too large"})
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
    return await call_next(request)


@app.exception_handler(ConfigurationError)
async def configuration_error_handler(
    _request: Request,
    exc: ConfigurationError,
) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(ValueError)
async def value_error_handler(_request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="fabriq-simulation", version=SERVICE_VERSION)


@app.get("/version")
def version() -> dict[str, str]:
    return {"version": SERVICE_VERSION}


@app.post("/simulate")
async def simulate(payload: SimulationRequest) -> dict[str, Any]:
    try:
        async with asyncio.timeout(SIMULATION_TIMEOUT_SECONDS):
            return await asyncio.to_thread(run_simulation, payload)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Simulation timed out") from exc


@app.post("/compare")
async def compare(payload: ComparisonRequest) -> dict[str, Any]:
    try:
        async with asyncio.timeout(SIMULATION_TIMEOUT_SECONDS):
            return await asyncio.to_thread(compare_simulations, payload.scenarios)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Comparison timed out") from exc
