import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import EngineDigitalTwin3D from './components/EngineDigitalTwin3D';
import AvionicsGauges from './components/AvionicsGauges';
import ThermalSpreadChart from './components/ThermalSpreadChart';
import VibrationSpectrum from './components/VibrationSpectrum';
import AIPredictivePanel from './components/AIPredictivePanel';
import MissionControlPanel from './components/MissionControlPanel';
import HealthReportModal from './components/HealthReportModal';
import PhysicsResidualModal from './components/PhysicsResidualModal';

export default function App() {
  const [systemState, setSystemState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isPhysicsOpen, setIsPhysicsOpen] = useState(false);
  const wsRef = useRef(null);

  // Connect to WebSocket with automatic reconnection
  useEffect(() => {
    let reconnectTimeout = null;

    const connect = () => {
      const host = window.location.hostname || '127.0.0.1';
      const wsUrl = `ws://${host}:8000/ws/telemetry`;
      
      let socket;
      try {
        socket = new WebSocket(wsUrl);
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 2000);
        return;
      }
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.telemetry) {
            setSystemState(data);
          }
        } catch (e) {
          console.error("Failed to parse telemetry:", e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 1500);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    // Fallback polling in case WebSockets are blocked
    const pollInterval = setInterval(() => {
      fetch('/api/telemetry/latest')
        .then(res => res.json())
        .then(data => {
          if (data && data.telemetry) {
            setSystemState(data);
          }
        })
        .catch(() => {});
    }, 1000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, []);

  const handleSelectProfile = async (profileKey) => {
    await fetch('/api/simulation/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_key: profileKey })
    });
  };

  const handleInjectFault = async (faultName, value) => {
    await fetch('/api/simulation/fault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fault_name: faultName, value: value })
    });
  };

  const handleClearFaults = async () => {
    await fetch('/api/simulation/clear-faults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const handleReplayControl = async (req) => {
    await fetch('/api/replay/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
  };

  // Safe defaults if still booting
  const telemetry = systemState?.telemetry || {
    rpm: 4800,
    altitude_ft: 15000,
    altitude_m: 4572,
    airspeed_kts: 85,
    oat_c: -15,
    map_kpa: 118,
    map_inhg: 34.8,
    cht: [118.0, 119.5, 117.8, 120.2],
    egt: [780.0, 785.0, 778.0, 790.0],
    oil_pressure_kpa: 380,
    oil_pressure_psi: 55.1,
    oil_temp_c: 95,
    coolant_temp_c: 85,
    vibration_rms_g: 1.25,
    fuel_flow_lph: 24.5,
    bsfc_g_kwh: 280,
    bus_voltage_v: 14.2,
    alternator_current_a: 22,
    mission_profile: 'ISR_LOITER',
    turbo_rpm: 95000,
    brake_hp: 115
  };

  const idealPhysics = systemState?.ideal_physics || telemetry;
  const aiDiagnostics = systemState?.ai_diagnostics || {
    anomaly_score: 5.0,
    is_anomalous: false,
    severity: 'NOMINAL',
    root_causes: [],
    physics_residuals: {
      cht_residuals_c: [0, 0, 0, 0],
      egt_residuals_c: [0, 0, 0, 0],
      map_residual_kpa: 0,
      oil_pressure_residual_kpa: 0,
      oil_temp_residual_c: 0,
      vibration_residual_g: 0
    },
    maintenance_advisories: [
      { priority: 'NORMAL', action: 'All propulsion subsystems operating in green envelope', downtime_est: 'Routine 50hr TBO' }
    ]
  };

  const prognostics = systemState?.prognostics || {
    overall_health_index: 95.0,
    accumulated_flight_hours: 342.5,
    subsystem_health: { combustion: 96, thermal: 94, lubrication: 98, mechanical: 95, electrical: 99 },
    wear_metrics: { valve_seat_wear_pct: 18.2, turbo_bearing_wear_pct: 22.4, piston_ring_wear_pct: 19.1, oil_degradation_pct: 28.5, spark_plug_erosion_pct: 31.0 },
    rul_hours: { mean: 852.0, lower_95_ci: 780.0, upper_95_ci: 920.0 }
  };

  return (
    <div className="min-h-screen bg-tactical-950 text-slate-100 flex flex-col font-sans">
      
      {/* Tactical GCS Header */}
      <Header
        telemetry={telemetry}
        isConnected={isConnected}
        aiDiagnostics={aiDiagnostics}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenPhysics={() => setIsPhysicsOpen(true)}
        onClearFaults={handleClearFaults}
        isReplaying={Boolean(systemState?.replay_state?.is_replay)}
      />

      {/* Main Glass Cockpit Content */}
      <main className="flex-1 p-3 sm:p-4 space-y-3 max-w-[1720px] mx-auto w-full">
        
        {/* Row 1: Avionics Cluster Gauges */}
        <AvionicsGauges telemetry={telemetry} />

        {/* Row 2: Digital Twin 2.5D Animated Engine (Left) + Multi-Cylinder Thermal Parity & Vibration FFT (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Main 2.5D Digital Twin Visualizer */}
          <div className="lg:col-span-7">
            <EngineDigitalTwin3D
              telemetry={telemetry}
              idealPhysics={idealPhysics}
              aiDiagnostics={aiDiagnostics}
            />
          </div>

          {/* Thermal Parity & Vibration Spectrum Waterfall */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <ThermalSpreadChart telemetry={telemetry} />
            <VibrationSpectrum telemetry={telemetry} />
          </div>

        </div>

        {/* Row 3: AI Predictive Analytics & Prognostics (Left) + Mission Profiles & Fault Injector (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          <div className="lg:col-span-6">
            <AIPredictivePanel
              aiDiagnostics={aiDiagnostics}
              prognostics={prognostics}
            />
          </div>

          <div className="lg:col-span-6">
            <MissionControlPanel
              currentProfile={systemState?.mission_profile || 'ISR_LOITER'}
              activeFaults={systemState?.active_faults}
              onSelectProfile={handleSelectProfile}
              onInjectFault={handleInjectFault}
              onClearFaults={handleClearFaults}
              replayState={systemState?.replay_state}
              onReplayControl={handleReplayControl}
            />
          </div>

        </div>

      </main>

      {/* Modals */}
      <HealthReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      <PhysicsResidualModal
        isOpen={isPhysicsOpen}
        onClose={() => setIsPhysicsOpen(false)}
        telemetry={telemetry}
        idealPhysics={idealPhysics}
        aiDiagnostics={aiDiagnostics}
      />

      {/* Tactical Status Footer */}
      <footer className="bg-tactical-900 border-t border-tactical-border/80 px-4 py-2 text-[11px] font-mono-code text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>DRDO ADE / DDP IDEX UAV HEALTH DIGITAL TWIN</span>
          <span>•</span>
          <span className="text-cyan-400">CAN 2.0B / SAE J1939 HIGH-SPEED BUS (500 kbps)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>ZERO-D THERMODYNAMIC MVEM</span>
          <span>•</span>
          <span>ISOLATION FOREST PROGNOSTICS</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">MIL-STD-1553B / STANAG 4586 READY</span>
        </div>
      </footer>

    </div>
  );
}
