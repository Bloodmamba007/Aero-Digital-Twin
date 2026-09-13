"""
High-Fidelity Telemetry Generator & Scenario Engine with CAN Bus / J1939 Frame Formatting
"""
import time
import math
import random
from typing import Dict, Any, Optional
from app.physics.engine_model import AeroPistonEnginePhysics

class MissionScenarioEngine:
    """
    Simulates operational UAV flight profiles and dynamically injects faults.
    Supports:
    - ISR Loiter (High altitude surveillance, 15,000 ft)
    - Tactical High-Altitude Climb (0 to 22,000 ft)
    - Hot Weather Desert Soak (Thar Desert, +45°C ambient)
    - Rapid Throttle Snap (Evasive maneuvers)
    """

    MISSION_PROFILES = {
        "ISR_LOITER": {
            "name": "ISR Surveillance Loiter",
            "description": "Standard 15,000 ft long-endurance reconnaissance mission at steady 74% cruise power.",
            "base_altitude_m": 4572.0,  # 15,000 ft
            "altitude_rate_mps": 0.0,
            "base_throttle_pct": 74.0,
            "throttle_oscillate": True,
            "airspeed_kts": 82.0,
            "oat_offset_c": -15.0  # Cold upper atmosphere
        },
        "ALTITUDE_CLIMB": {
            "name": "Tactical Altitude Climb",
            "description": "Aggressive climb from sea level to 22,000 ft testing turbocharger wastegate compensation.",
            "base_altitude_m": 500.0,
            "altitude_rate_mps": 25.0,  # Climbing ~1500 ft/min
            "max_altitude_m": 6700.0,  # 22,000 ft
            "base_throttle_pct": 92.0,
            "throttle_oscillate": False,
            "airspeed_kts": 95.0,
            "oat_offset_c": 0.0
        },
        "DESERT_HEAT_SOAK": {
            "name": "Hot Desert Operation (Thar/Pokhran)",
            "description": "Low-level loiter (1,500 ft) under harsh ambient heat (+45°C) maximizing engine cooling stress.",
            "base_altitude_m": 450.0,
            "altitude_rate_mps": 0.0,
            "base_throttle_pct": 82.0,
            "throttle_oscillate": True,
            "airspeed_kts": 78.0,
            "oat_offset_c": 30.0  # +45°C ambient ground temp
        },
        "SNAP_THROTTLE": {
            "name": "Rapid Throttle Snap & Transients",
            "description": "Cyclic throttle bursts from 35% to 100% testing governor response and torsional vibration.",
            "base_altitude_m": 2500.0,
            "altitude_rate_mps": 0.0,
            "base_throttle_pct": 65.0,
            "throttle_oscillate": True,
            "airspeed_kts": 105.0,
            "oat_offset_c": 5.0
        }
    }

    def __init__(self):
        self.current_profile_key = "ISR_LOITER"
        self.mission_time_s = 0.0
        self.sim_altitude_m = 4572.0
        self.active_faults = {
            "misfire_cyl": None,           # 1, 2, 3, 4 or None
            "clogged_injector_cyl": None,  # 1, 2, 3, 4 or None
            "cooling_degradation_factor": 1.0,  # 1.0 = normal, 0.4 = severe leak/clog
            "oil_leak_severity": 0.0,      # 0.0 to 1.0
            "bearing_wear_severity": 0.0,  # 0.0 to 1.0
            "turbo_wastegate_leak": False,
            "sensor_drift_map": 0.0        # Sensor offset in kPa
        }
        
        # Dual physics instances: one for actual engine (with faults), one for idealized digital twin model
        self.actual_engine = AeroPistonEnginePhysics()
        self.ideal_twin_engine = AeroPistonEnginePhysics()
        
    def set_profile(self, profile_key: str):
        if profile_key in self.MISSION_PROFILES:
            self.current_profile_key = profile_key
            cfg = self.MISSION_PROFILES[profile_key]
            self.sim_altitude_m = cfg["base_altitude_m"]
            self.mission_time_s = 0.0

    def set_fault(self, fault_name: str, value: Any):
        if fault_name in self.active_faults:
            self.active_faults[fault_name] = value

    def clear_all_faults(self):
        self.active_faults = {
            "misfire_cyl": None,
            "clogged_injector_cyl": None,
            "cooling_degradation_factor": 1.0,
            "oil_leak_severity": 0.0,
            "bearing_wear_severity": 0.0,
            "turbo_wastegate_leak": False,
            "sensor_drift_map": 0.0
        }

    def step(self, dt: float = 0.1) -> tuple:
        """
        Advances the mission simulation by dt seconds.
        Returns:
        - telemetry: Actual sensor readings from onboard ECU/CAN bus (including noise and active faults)
        - ideal_twin: Theoretical nominal readings from synchronized physics model
        - can_frames: Synthetic J1939 CAN frames
        """
        self.mission_time_s += dt
        cfg = self.MISSION_PROFILES[self.current_profile_key]
        
        # Compute dynamic altitude
        if cfg.get("altitude_rate_mps", 0.0) > 0:
            self.sim_altitude_m = min(cfg.get("max_altitude_m", 7000.0), self.sim_altitude_m + cfg["altitude_rate_mps"] * dt)
            
        # Compute dynamic throttle
        throttle = cfg["base_throttle_pct"]
        if self.current_profile_key == "SNAP_THROTTLE":
            # 12-second cycle: snap up to 98%, drop to 40%, snap to 85%
            t_mod = self.mission_time_s % 12.0
            if t_mod < 4.0:
                throttle = 98.0
            elif t_mod < 8.0:
                throttle = 38.0
            else:
                throttle = 85.0
        elif cfg.get("throttle_oscillate", False):
            # Minor pilot governor hunting / atmospheric turbulence (+/- 2%)
            throttle += math.sin(self.mission_time_s * 0.4) * 2.2
            
        throttle = max(10.0, min(100.0, throttle))
        
        # 1. Step actual engine (subject to faults)
        actual_data = self.actual_engine.step_thermodynamics(
            throttle_pct=throttle,
            altitude_m=self.sim_altitude_m,
            airspeed_kts=cfg["airspeed_kts"],
            oat_offset_c=cfg["oat_offset_c"],
            dt=dt,
            fault_states=self.active_faults
        )
        
        # Add slight sensor noise & sensor drift
        sensor_noise_rpm = random.gauss(0, 4.0)
        sensor_drift = self.active_faults.get("sensor_drift_map", 0.0)
        actual_data["rpm"] = max(0.0, actual_data["rpm"] + sensor_noise_rpm)
        actual_data["map_kpa"] += sensor_drift + random.gauss(0, 0.2)
        actual_data["map_inhg"] = round(actual_data["map_kpa"] * 0.2953, 2)
        actual_data["mission_time_s"] = round(self.mission_time_s, 1)
        actual_data["mission_profile"] = self.current_profile_key
        actual_data["mission_name"] = cfg["name"]
        
        # 2. Step idealized digital twin (clean physics with ZERO faults)
        ideal_data = self.ideal_twin_engine.step_thermodynamics(
            throttle_pct=throttle,
            altitude_m=self.sim_altitude_m,
            airspeed_kts=cfg["airspeed_kts"],
            oat_offset_c=cfg["oat_offset_c"],
            dt=dt,
            fault_states=None
        )
        
        # 3. Generate synthetic CAN / J1939 frames
        can_frames = self._synthesize_can_j1939(actual_data)
        
        return actual_data, ideal_data, can_frames

    def _synthesize_can_j1939(self, t: Dict[str, Any]) -> list:
        """
        Synthesizes standard Aerospace / Defence SAE J1939 CAN bus frames:
        - PGN 61444 (EEC1): Engine Speed (RPM), Torque
        - PGN 65262 (ET1): Engine Coolant Temp, Fuel Temp, Oil Temp
        - PGN 65263 (EFL_P1): Engine Oil Pressure, Boost Pressure (MAP)
        - PGN 65271 (VEP1): Electrical Bus Voltage, Alternator Current
        """
        frames = []
        # PGN 61444 (0x0CF00400) - EEC1
        rpm_raw = int(t["rpm"] * 8) & 0xFFFF
        torque_raw = int(t["torque_nm"] * 2) & 0xFF
        frames.append({
            "can_id": "0x0CF00400",
            "pgn": 61444,
            "name": "EEC1_Speed_Torque",
            "data_bytes": [0xF0, torque_raw, 0xFF, rpm_raw & 0xFF, (rpm_raw >> 8) & 0xFF, 0xFF, 0xFF, 0xFF],
            "timestamp": round(time.time(), 3)
        })
        
        # PGN 65262 (0x18FEEE00) - ET1
        coolant_raw = int(t["coolant_temp_c"] + 40) & 0xFF
        oil_t_raw = int(t["oil_temp_c"] + 40) & 0xFF
        frames.append({
            "can_id": "0x18FEEE00",
            "pgn": 65262,
            "name": "ET1_Temperatures",
            "data_bytes": [coolant_raw, 0x80, oil_t_raw, 0x80, 0xFF, 0xFF, 0xFF, 0xFF],
            "timestamp": round(time.time(), 3)
        })
        
        # PGN 65263 (0x18FEEF00) - EFL_P1
        oil_p_raw = int(t["oil_pressure_kpa"] / 4.0) & 0xFF
        boost_p_raw = int(t["map_kpa"] / 2.0) & 0xFF
        frames.append({
            "can_id": "0x18FEEF00",
            "pgn": 65263,
            "name": "EFL_P1_Pressures",
            "data_bytes": [0xFF, oil_p_raw, 0xFF, boost_p_raw, 0xFF, 0xFF, 0xFF, 0xFF],
            "timestamp": round(time.time(), 3)
        })
        return frames
