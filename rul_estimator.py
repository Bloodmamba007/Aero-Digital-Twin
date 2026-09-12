"""
Prognostics & Remaining Useful Life (RUL) Estimator for Aero Piston Engines
"""
import math
from typing import Dict, Any, List

class EngineRULEstimator:
    """
    Prognostic health assessment and degradation tracking engine.
    Calculates Remaining Useful Life (RUL) in flight hours and generates
    defense-standard health indices across all core propulsion subsystems.
    """

    def __init__(self, initial_tbo_hours: float = 1200.0, current_accumulated_hours: float = 342.5):
        self.tbo_hours = initial_tbo_hours  # Time Between Overhaul standard for aero boxer engines
        self.accumulated_hours = current_accumulated_hours
        
        # Degradation trackers (0.0 = pristine, 1.0 = end of life failure)
        self.valve_seat_wear = 0.18
        self.turbo_bearing_wear = 0.22
        self.piston_ring_wear = 0.19
        self.spark_plug_erosion = 0.31
        self.oil_degradation = 0.28
        
    def step_prognostics(
        self,
        telemetry: Dict[str, Any],
        anomaly_report: Dict[str, Any],
        flight_dt_hours: float = 0.001
    ) -> Dict[str, Any]:
        """
        Updates degradation metrics and projects RUL based on operating stress.
        """
        self.accumulated_hours += flight_dt_hours
        
        # Stress multipliers based on harsh operating conditions:
        rpm_ratio = telemetry["rpm"] / 5800.0
        cht_max = max(telemetry["cht"])
        oil_p = telemetry["oil_pressure_kpa"]
        oil_t = telemetry["oil_temp_c"]
        vib_g = telemetry["vibration_rms_g"]
        
        # Thermal stress factor (increases exponentially above 125°C)
        thermal_stress = 1.0 + max(0.0, (cht_max - 120.0) / 10.0) ** 1.8
        # Mechanical stress factor
        mech_stress = 1.0 + (rpm_ratio ** 2.2) * 1.5 + max(0.0, (vib_g - 1.5) * 2.0)
        # Lubrication stress factor
        lube_stress = 1.0 + max(0.0, (oil_t - 95.0) / 10.0) + max(0.0, (300.0 - oil_p) / 50.0)
        
        # Fault acceleration
        anomaly_factor = 1.0 + (anomaly_report["anomaly_score"] / 100.0) * 8.0
        
        # Incremental degradation
        base_rate = flight_dt_hours / (self.tbo_hours * 1.1)
        self.valve_seat_wear += base_rate * thermal_stress * 1.1
        self.turbo_bearing_wear += base_rate * (telemetry["turbo_rpm"] / 90000.0) * 1.4
        self.piston_ring_wear += base_rate * mech_stress
        self.oil_degradation += base_rate * lube_stress * 2.2
        self.spark_plug_erosion += base_rate * 1.3
        
        # Account for active faults
        for fault in anomaly_report.get("root_causes", []):
            code = fault["code"]
            if "MISFIRE" in code:
                self.spark_plug_erosion = min(1.0, self.spark_plug_erosion + 0.005)
            elif "LUBRICATION" in code or "OIL" in code:
                self.oil_degradation = min(1.0, self.oil_degradation + 0.008)
            elif "BEARING" in code:
                self.turbo_bearing_wear = min(1.0, self.turbo_bearing_wear + 0.01)
            elif "COOLING" in code:
                self.valve_seat_wear = min(1.0, self.valve_seat_wear + 0.007)
                
        # Subsystem Health Indices (100% = brand new, <40% = danger threshold)
        combustion_health = max(5.0, 100.0 - (self.valve_seat_wear * 45.0 + self.spark_plug_erosion * 35.0))
        thermal_health = max(5.0, 100.0 - (max(0.0, cht_max - 110.0) * 2.2 + (telemetry["coolant_temp_c"] - 80.0) * 1.5))
        lubrication_health = max(5.0, 100.0 - (self.oil_degradation * 70.0 + max(0.0, 320.0 - oil_p) * 0.3))
        mechanical_health = max(5.0, 100.0 - (self.turbo_bearing_wear * 50.0 + self.piston_ring_wear * 40.0 + (vib_g * 12.0)))
        electrical_health = max(10.0, min(100.0, (telemetry["bus_voltage_v"] / 14.2) * 85.0 + (telemetry["battery_soc_pct"] * 0.15)))
        
        # Penalize health if severe anomaly is active
        if anomaly_report["severity"] == "CRITICAL":
            combustion_health = min(combustion_health, 35.0)
            lubrication_health = min(lubrication_health, 30.0)
        elif anomaly_report["severity"] == "WARNING":
            thermal_health = min(thermal_health, 55.0)
            
        # Composite Overall Engine Health Index (EHI)
        overall_health_index = (
            combustion_health * 0.28 +
            thermal_health * 0.22 +
            lubrication_health * 0.25 +
            mechanical_health * 0.18 +
            electrical_health * 0.07
        )
        overall_health_index = max(2.0, min(100.0, overall_health_index))
        
        # RUL Projection (Hours remaining before mandatory overhaul or critical failure)
        # Standard nominal hours left = TBO - accumulated
        nominal_hours_remaining = max(0.0, self.tbo_hours - self.accumulated_hours)
        
        # Health-adjusted RUL
        rul_health_multiplier = (overall_health_index / 100.0) ** 1.3
        
        # If acute critical fault, RUL drops to hours or emergency minutes
        if anomaly_report["severity"] == "CRITICAL":
            rul_mean_hours = min(nominal_hours_remaining * 0.05, 12.0)
            rul_lower_bound = max(0.5, rul_mean_hours * 0.6)
            rul_upper_bound = rul_mean_hours * 1.4
        elif anomaly_report["severity"] == "WARNING":
            rul_mean_hours = min(nominal_hours_remaining * 0.45, 120.0)
            rul_lower_bound = rul_mean_hours * 0.8
            rul_upper_bound = rul_mean_hours * 1.25
        elif anomaly_report["severity"] == "CAUTION":
            rul_mean_hours = nominal_hours_remaining * 0.78
            rul_lower_bound = rul_mean_hours * 0.88
            rul_upper_bound = rul_mean_hours * 1.12
        else:
            rul_mean_hours = nominal_hours_remaining * rul_health_multiplier
            rul_lower_bound = rul_mean_hours * 0.92
            rul_upper_bound = rul_mean_hours * 1.08
            
        return {
            "accumulated_flight_hours": round(self.accumulated_hours, 2),
            "tbo_limit_hours": self.tbo_hours,
            "overall_health_index": round(overall_health_index, 1),
            "subsystem_health": {
                "combustion": round(combustion_health, 1),
                "thermal": round(thermal_health, 1),
                "lubrication": round(lubrication_health, 1),
                "mechanical": round(mechanical_health, 1),
                "electrical": round(electrical_health, 1)
            },
            "wear_metrics": {
                "valve_seat_wear_pct": round(min(100.0, self.valve_seat_wear * 100.0), 1),
                "turbo_bearing_wear_pct": round(min(100.0, self.turbo_bearing_wear * 100.0), 1),
                "piston_ring_wear_pct": round(min(100.0, self.piston_ring_wear * 100.0), 1),
                "oil_degradation_pct": round(min(100.0, self.oil_degradation * 100.0), 1),
                "spark_plug_erosion_pct": round(min(100.0, self.spark_plug_erosion * 100.0), 1)
            },
            "rul_hours": {
                "mean": round(rul_mean_hours, 1),
                "lower_95_ci": round(rul_lower_bound, 1),
                "upper_95_ci": round(rul_upper_bound, 1),
                "confidence_pct": 95.0
            }
        }
