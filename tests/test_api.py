"""HTTP contract tests for the FastAPI simulation adapter."""

from __future__ import annotations

import json
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


try:
    from fastapi.testclient import TestClient
    from python_service.main import app
except ImportError:  # pragma: no cover - keeps stdlib-only unittest usable
    TestClient = None  # type: ignore[assignment]
    app = None


@unittest.skipIf(TestClient is None, "FastAPI test dependencies are not installed")
class SimulationApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self.config = json.loads(Path("configs/base_scenario.json").read_text(encoding="utf-8"))

    def test_health(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_simulation_returns_web_contract(self) -> None:
        response = self.client.post(
            "/simulate",
            json={"scenario": self.config, "overrides": {"seed": 1}},
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["scenario_name"], "base_scenario")
        self.assertIn("general", body["analytics"])
        self.assertIn("recommendations", body["report"])
        self.assertGreater(len(body["event_log"]), 0)

    def test_invalid_scenario_returns_422(self) -> None:
        response = self.client.post("/simulate", json={"scenario": {}})
        self.assertEqual(response.status_code, 422)
        self.assertIn("detail", response.json())

    def test_fixed_seed_is_repeatable(self) -> None:
        payload = {"scenario": self.config, "overrides": {"seed": 11}}
        first = self.client.post("/simulate", json=payload).json()
        second = self.client.post("/simulate", json=payload).json()
        self.assertEqual(first["analytics"], second["analytics"])
        self.assertEqual(first["event_log"], second["event_log"])

    def test_all_presets_run_through_http_contract(self) -> None:
        for config_path in sorted(Path("configs").glob("*.json")):
            with self.subTest(config=config_path.name):
                config = json.loads(config_path.read_text(encoding="utf-8"))
                response = self.client.post(
                    "/simulate",
                    json={"scenario": config, "overrides": {"seed": 1}},
                )
                self.assertEqual(response.status_code, 200, response.text)

    def test_twenty_parallel_requests_complete(self) -> None:
        payload = {"scenario": self.config, "overrides": {"seed": 3}}

        def execute(_: int) -> int:
            with TestClient(app) as client:
                return client.post("/simulate", json=payload).status_code

        with ThreadPoolExecutor(max_workers=20) as pool:
            statuses = list(pool.map(execute, range(20)))
        self.assertEqual(statuses, [200] * 20)
