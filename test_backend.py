"""
Unit & Integration Test Script for Digital Twin Backend Core
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.physics.engine_model import AeroPistonEnginePhysics, AeroAtmosphereISA
from app.ai.anomaly_detector import EngineAnomalyDetector
from app.ai.rul_estimator import EngineRULEstimator
from app.simulation.telemetry_generator import MissionScenarioEngine

def test_engine():
    print("[1/4] Testing ISA Atmospheric Physics...")
    atmo_sl = AeroAtmosphereISA.get_atmospheric_state(0.0)
    assert abs(atmo_sl["p_ambient_pa"] - 101325.0) < 1.0
    atmo_hi = AeroAtmosphereISA.get_atmospheric_state(5000.0)
    assert atmo_hi["p_ambient_pa"] < atmo_sl["p_ambient_pa"]
    print(f"  -> Sea level: {atmo_sl['p_ambient_inhg']:.2f} inHg, 5000m: {atmo_hi['p_ambient_inhg']:.2f} inHg [PASSED]")

    print("[2/4] Testing Aero Piston Engine Thermodynamic Evolution...")
    engine = AeroPistonEnginePhysics()
    data = engine.step_thermodynamics(throttle_pct=80.0, altitude_m=3000.0, dt=1.0)
    assert data["rpm"] > 2000.0
    assert len(data["cht"]) == 4
    assert len(data["egt"]) == 4
    assert len(data["vibration_spectrum"]["spectral_bins"]) == 32
    print(f"  -> Generated RPM: {data['rpm']}, MAP: {data['map_kpa']} kPa, Power: {data['brake_hp']} BHP [PASSED]")

    print("[3/4] Testing AI Anomaly Detector & Explainability...")
    detector = EngineAnomalyDetector()
    ideal = engine.step_thermodynamics(throttle_pct=80.0, altitude_m=3000.0, dt=1.0)
    
    # Nominal test
    report_nom = detector.evaluate(data, ideal)
    assert report_nom["anomaly_score"] < 40.0
    assert report_nom["severity"] == "NOMINAL"
    print(f"  -> Nominal Score: {report_nom['anomaly_score']} ({report_nom['severity']}) [PASSED]")
    
    # Fault injection test (Cylinder 2 Misfire)
    engine_faulty = AeroPistonEnginePhysics()
    faulty_data = engine_faulty.step_thermodynamics(
        throttle_pct=80.0, altitude_m=3000.0, dt=1.0,
        fault_states={"misfire_cyl": 2}
    )
    report_fault = detector.evaluate(faulty_data, ideal)
    assert report_fault["is_anomalous"] is True
    assert any("MISFIRE_CYL_2" in f["code"] for f in report_fault["root_causes"])
    print(f"  -> Injected Misfire Score: {report_fault['anomaly_score']}, Diagnosed: {report_fault['root_causes'][0]['title']} [PASSED]")

    print("[4/4] Testing Prognostics & RUL Estimation...")
    rul_eng = EngineRULEstimator()
    prognostics = rul_eng.step_prognostics(faulty_data, report_fault, flight_dt_hours=0.1)
    assert prognostics["overall_health_index"] < 90.0
    assert prognostics["rul_hours"]["mean"] > 0
    print(f"  -> Overall Health: {prognostics['overall_health_index']}%, RUL: {prognostics['rul_hours']['mean']} hrs [PASSED]")

    print("\nALL BACKEND CORE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_engine()
