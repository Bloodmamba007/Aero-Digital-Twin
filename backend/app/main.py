"""
FastAPI Backend Server & Real-Time WebSocket Telemetry Hub
"""
import asyncio
import time
import json
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.physics.engine_model import AeroPistonEnginePhysics
from app.ai.anomaly_detector import EngineAnomalyDetector
from app.ai.rul_estimator import EngineRULEstimator
from app.simulation.telemetry_generator import MissionScenarioEngine
from app.simulation.mission_replay import MissionReplayEngine

app = FastAPI(
    title="DRDO/IDEX MALE UAV Aero Piston Engine Digital Twin Core",
    description="Real-Time Health Monitoring, Fault Prediction, and Mission Reliability System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Instances
scenario_engine = MissionScenarioEngine()
anomaly_detector = EngineAnomalyDetector()
rul_estimator = EngineRULEstimator()
replay_engine = MissionReplayEngine()

# Connected WebSocket clients
connected_clients = set()
latest_system_state: Dict[str, Any] = {}

class ProfileRequest(BaseModel):
    profile_key: str

class FaultRequest(BaseModel):
    fault_name: str
    value: Any

class ReplayControlRequest(BaseModel):
    action: str  # "start", "pause", "resume", "seek"
    sortie_id: Optional[str] = None
    index: Optional[int] = None
    speed: Optional[float] = 1.0


@app.get("/api/status")
def get_system_status():
    return {
        "status": "ONLINE",
        "engine_model": "Aero Boxer 4-Cylinder Turbocharged (1352cc / 141 HP)",
        "aircraft_platform": "MALE UAV TAPAS-BH-201 / Archer-NG Class",
        "twin_sync_rate_hz": 10.0,
        "active_mission": scenario_engine.current_profile_key,
        "active_faults": {k: v for k, v in scenario_engine.active_faults.items() if v not in [None, 0.0, 1.0, False]},
        "is_replaying": replay_engine.is_replaying
    }


@app.get("/api/telemetry/latest")
def get_latest_telemetry():
    return latest_system_state


@app.post("/api/simulation/profile")
def set_mission_profile(req: ProfileRequest):
    scenario_engine.set_profile(req.profile_key)
    return {"status": "SUCCESS", "current_profile": req.profile_key}


@app.post("/api/simulation/fault")
def inject_fault(req: FaultRequest):
    scenario_engine.set_fault(req.fault_name, req.value)
    return {
        "status": "SUCCESS",
        "fault_name": req.fault_name,
        "value": req.value,
        "active_faults": scenario_engine.active_faults
    }


@app.post("/api/simulation/clear-faults")
def clear_all_faults():
    scenario_engine.clear_all_faults()
    return {"status": "SUCCESS", "message": "All injected faults cleared to nominal"}


@app.get("/api/replay/sorties")
def get_replay_sorties():
    return {"sorties": replay_engine.get_sorties_list()}


@app.post("/api/replay/control")
def control_replay(req: ReplayControlRequest):
    if req.action == "start" and req.sortie_id:
        replay_engine.start_replay(req.sortie_id)
    elif req.action == "pause":
        replay_engine.pause_replay()
    elif req.action == "resume":
        replay_engine.resume_replay()
    elif req.action == "seek" and req.index is not None:
        replay_engine.seek_replay(req.index)
    elif req.action == "stop":
        replay_engine.pause_replay()
        replay_engine.is_replaying = False

    return {
        "status": "SUCCESS",
        "is_replaying": replay_engine.is_replaying,
        "replay_sortie_id": replay_engine.replay_sortie_id,
        "replay_index": replay_engine.replay_index
    }


@app.get("/api/report/generate")
def generate_health_report():
    """Generates a formal DRDO/IDEX Airworthiness & Engine Health Certificate."""
    state = latest_system_state
    telemetry = state.get("telemetry", {})
    ai = state.get("ai_diagnostics", {})
    prognostics = state.get("prognostics", {})

    report = {
        "report_id": f"DRDO-EHI-{int(time.time())}",
        "timestamp_utc": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "organization": "DRDO / Aeronautical Development Establishment (ADE)",
        "department": "Department of Defence Production / IDEX",
        "aircraft_tail_no": "UAV-TAPAS-07",
        "engine_serial": "GTRE-AP-4C-0941",
        "mission_name": telemetry.get("mission_name", "Surveillance Sortie"),
        "accumulated_engine_hours": prognostics.get("accumulated_flight_hours", 342.5),
        "overall_health_index": prognostics.get("overall_health_index", 95.0),
        "anomaly_severity": ai.get("severity", "NOMINAL"),
        "anomaly_score": ai.get("anomaly_score", 4.0),
        "rul_projection_hours": prognostics.get("rul_hours", {}).get("mean", 850.0),
        "subsystem_health_audit": prognostics.get("subsystem_health", {}),
        "component_wear_audit": prognostics.get("wear_metrics", {}),
        "diagnosed_anomalies": ai.get("root_causes", []),
        "airworthiness_prescriptions": ai.get("maintenance_advisories", []),
        "operating_summary": {
            "max_rpm_recorded": telemetry.get("rpm", 4800),
            "max_cht_recorded": max(telemetry.get("cht", [120])),
            "max_egt_recorded": max(telemetry.get("egt", [790])),
            "min_oil_pressure_kpa": telemetry.get("oil_pressure_kpa", 380),
            "max_vibration_g": telemetry.get("vibration_rms_g", 1.2)
        },
        "certification_status": "GO FOR SORTIE" if ai.get("severity") in ["NOMINAL", "ADVISORY"] else "MAINTENANCE MANDATORY / GROUNDED"
    }
    return report


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            # Keep receiving any client messages or pings
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


async def telemetry_simulation_loop():
    """
    Continuous 10Hz background loop that steps physics, runs AI/ML diagnostics,
    computes RUL, and streams synchronized digital twin state to all connected clients.
    """
    global latest_system_state
    dt = 0.1  # 100 ms per step (10 Hz)
    
    while True:
        try:
            # 1. Step simulation
            actual_telemetry, ideal_twin, can_frames = scenario_engine.step(dt=dt)
            
            # 2. Evaluate AI/ML Anomaly Detection & Explainable Root Cause
            anomaly_report = anomaly_detector.evaluate(actual_telemetry, ideal_twin)
            
            # 3. Update Prognostics & RUL
            prognostics_report = rul_estimator.step_prognostics(
                actual_telemetry,
                anomaly_report,
                flight_dt_hours=(dt / 3600.0)
            )
            
            # 4. Check if replay is active
            replay_data = None
            if replay_engine.is_replaying:
                replay_data = replay_engine.step_replay()
                
            # 5. Record frame to memory buffer
            replay_engine.record_frame(actual_telemetry)
            
            # 6. Assemble complete digital twin package
            system_state = {
                "timestamp": round(time.time(), 3),
                "telemetry": actual_telemetry,
                "ideal_physics": ideal_twin,
                "ai_diagnostics": anomaly_report,
                "prognostics": prognostics_report,
                "can_bus": can_frames,
                "replay_state": replay_data,
                "active_faults": scenario_engine.active_faults,
                "mission_profile": scenario_engine.current_profile_key
            }
            
            latest_system_state = system_state
            
            # Broadcast to WebSockets
            if connected_clients:
                state_json = json.dumps(system_state)
                dead_clients = []
                for ws in connected_clients:
                    try:
                        await ws.send_text(state_json)
                    except Exception:
                        dead_clients.append(ws)
                for ws in dead_clients:
                    if ws in connected_clients:
                        connected_clients.remove(ws)
                        
        except Exception as e:
            print(f"Error in telemetry loop: {e}")
            
        await asyncio.sleep(dt)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(telemetry_simulation_loop())
