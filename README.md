# AI-Enabled Real-Time Digital Twin System for Aero Piston Engines in MALE UAVs

**Smart India Hackathon (SIH) Prototype**  
**Organization:** Defence Research and Development Organisation (DRDO)  
**Department:** Department of Defence Production / Innovations for Defence Excellence (iDEX)  
**Theme:** Robotics and Drones | **Category:** Software  
**Target Platform:** Medium Altitude Long Endurance (MALE) UAVs (TAPAS-BH-201 / Archer-NG Class)

---

## 1. Executive Summary

Medium Altitude Long Endurance (MALE) UAVs perform high-stakes 24–36 hour intelligence, surveillance, reconnaissance (ISR), and maritime patrol missions. Propulsion failure during flight causes mission abort, loss of high-value defence assets, or catastrophic recovery conditions. 

Conventional monitoring systems are strictly threshold-based and reactive—detecting failures only after damage has occurred. This indigenous **Digital Twin (DT) Framework** acts as a continuously synchronized virtual replica of the 4-cylinder turbocharged aero piston engine (Rotax 914/915 / DRDO indigenous boxer engine). By coupling **first-principles thermodynamics** with **unsupervised AI anomaly detection** and **exponential degradation prognostics**, the system detects latent faults up to hours in advance, calculates Remaining Useful Life (RUL), and generates airworthiness certificates.

---

## 2. Key Architecture & Features

```
                                  ┌────────────────────────┐
                                  │   Onboard Sensors &    │
                                  │ CAN Bus / J1939 Stream │
                                  └───────────┬────────────┘
                                              │ Telemetry (10 Hz)
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DIGITAL TWIN INTELLIGENCE CORE (FastAPI)                        │
│                                                                                        │
│   ┌──────────────────────────┐                      ┌──────────────────────────────┐   │
│   │ First-Principles Physics │                      │ Machine Learning &           │   │
│   │ Thermodynamic MVEM       │──(Ideal Baseline)───▶│ Isolation Forest             │   │
│   │ • Otto Cycle & P-V       │                      │ • 10-Feature Outlier Scorer  │   │
│   │ • ISA Altitude Lapse     │                      │ • Physics Residual Engine    │   │
│   │ • Turbo Boost / MAP      │                      └──────────────┬───────────────┘   │
│   └──────────────────────────┘                                     │                   │
│                                                                    ▼                   │
│   ┌──────────────────────────┐                      ┌──────────────────────────────┐   │
│   │ Mission Scenario Engine  │                      │ Explainable AI (XAI) &       │   │
│   │ • ISR Loiter (15k ft)    │                      │ Root Cause Analysis          │   │
│   │ • Tactical Climb (22k ft)│                      │ • Misfire, Clog, Leak, Vib   │   │
│   │ • Desert Soak (+45°C)    │                      │ • Prescriptive Maintenance   │   │
│   └──────────────────────────┘                      └──────────────┬───────────────┘   │
│                                                                    │                   │
│   ┌──────────────────────────┐                      ┌──────────────▼───────────────┐   │
│   │ Flight Data Recorder     │                      │ Prognostics & RUL Engine     │   │
│   │ & Mission Replay Engine  │                      │ • Subsystem Health Radar     │   │
│   │ • Forensic Scrubbing     │                      │ • 95% Confidence Interval RUL│   │
│   └──────────────────────────┘                      └──────────────────────────────┘   │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ WebSocket Streaming (100 ms)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          TACTICAL GCS GLASS COCKPIT (React + Vite)                     │
│                                                                                        │
│   ┌──────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐   │
│   │ 2.5D Animated Twin       │  │ Multi-Cylinder Thermal  │  │ Vibration FFT       │   │
│   │ • Boxer Kinematics       │  │ Parity (ΔCHT & ΔEGT)    │  │ Harmonic Orders     │   │
│   │ • Live Cylinder Heatmap  │  │ • 4 Cyl Individual Bars │  │ • 1X, 2X, Turbo     │   │
│   └──────────────────────────┘  └─────────────────────────┘  └─────────────────────┘   │
│                                                                                        │
│   ┌──────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐   │
│   │ Avionics Gauge Cluster   │  │ AI Health & RUL Panel   │  │ Mission Replay &    │   │
│   │ • RPM, MAP, Oil P/T, Bus │  │ • Explainable XAI Cards │  │ Fault Injector Deck │   │
│   └──────────────────────────┘  └─────────────────────────┘  └─────────────────────┘   │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ DRDO / IDEX Airworthiness & Propulsion Debriefing Certificate (PDF/Print)      │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mathematical & Physics Foundations

### A. Atmospheric Model (International Standard Atmosphere - ISA)
For altitudes up to 11,000 m (Troposphere):
$$T(h) = T_0 - L \cdot h$$
$$P(h) = P_0 \left(1 - \frac{L \cdot h}{T_0}\right)^{\frac{g_0 M}{R L}}$$
$$\rho(h) = \frac{P(h)}{R_{spec} \cdot T(h)}$$
Where $L = 0.0065\text{ K/m}$, $T_0 = 288.15\text{ K}$, $P_0 = 101,325\text{ Pa}$.

### B. Manifold Absolute Pressure (MAP) & Turbocharger Model
$$MAP = P_{ambient}(h) \cdot \left(1 + \frac{\text{Throttle}}{100} \cdot \beta_{boost} \cdot \frac{RPM}{5000}\right)$$
The electronic wastegate controller modulates turbine bypass to sustain $\approx 115\text{--}135\text{ kPa}$ MAP even at $15,000\text{--}22,000\text{ ft}$.

### C. Thermal Dynamics & Cylinder Heat Transfer
$$\frac{d(CHT_i)}{dt} = \frac{1}{C_{head}} \left[ \dot{Q}_{comb, i} - h_{cool} A (CHT_i - T_{coolant}) - h_{ram} A_{fin} (CHT_i - T_{amb}) \right]$$

### D. Physics Residual Formulation (Zero False-Alarm Principle)
$$\mathbf{r}(t) = \mathbf{y}_{measured}(t) - \mathbf{y}_{physics}(t)$$
$$\mathbf{r} = \left[ \Delta CHT_1 \dots \Delta CHT_4,\; \Delta EGT_1 \dots \Delta EGT_4,\; \Delta MAP,\; \Delta P_{oil},\; \Delta Vib \right]$$
Residuals isolate true physical degradation from ambient altitude / weather variations.

### E. Prognostic RUL Formulation
Remaining Useful Life is computed through non-linear degradation tracking:
$$RUL(t) = (TBO - t_{accum}) \cdot \left(\frac{EHI(t)}{100}\right)^{1.3}$$
With $95\%$ Confidence Bounds:
$$CI_{95\%} = \left[ RUL_{mean} \cdot (1 - 1.96 \cdot \sigma_d),\; RUL_{mean} \cdot (1 + 1.96 \cdot \sigma_d) \right]$$

---

## 4. Quickstart Guide (Clean Environment)

### Prerequisites:
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ (Tested on Node.js v24)
- Modern web browser (Chrome, Edge, Firefox)

### Option A: One-Click Startup (Windows)
Double-click `start_system.bat` or run:
```cmd
start_system.bat
```
*(Or in PowerShell: `.\start_system.ps1`)*

### Option B: Manual Startup

**Step 1: Start Backend**
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Step 2: Start Frontend**
```bash
cd frontend
npm run dev
```

**Step 3: Access Tactical Dashboard**
- Open your browser at: `http://localhost:5173`
- Backend API docs available at: `http://localhost:8000/docs`

---

## 5. Demonstration Flow for SIH Evaluators

1. **Nominal Operational Telemetry**:
   - Observe the 2.5D animated boxer engine: rotating crankshaft, reciprocating pistons, and dynamic emerald thermal gradients across all 4 cylinders.
   - Inspect the live Avionics Cluster: RPM, Boost (MAP), Oil Pressure, Fuel Flow, and 14V Bus.
2. **Interactive Fault Injection**:
   - Click **"CYL #3 MISFIRE"**: Watch Cylinder #3 immediately cool down in the twin, EGT drop, torsional vibration spike, and the AI Anomaly Score surge to 85+.
   - View the **Explainable AI (XAI) Card**: Notice exact root cause diagnosis ("Cylinder #3 Severe Combustion Misfire - Confidence 96.5%") and prescriptive maintenance action ("Immediate Sortie Abort. Inspect Spark Plug on Cyl #3").
   - Click **"OIL SCAVENGE LINE LEAK"**: Observe oil pressure dropping below 200 kPa, triggering a CRITICAL alert and drastic RUL penalty.
3. **Mission Scenarios**:
   - Switch to **"Tactical Climb (0 to 22,000 ft)"**: Observe ambient pressure dropping while turbocharger wastegate compensates to maintain manifold boost.
   - Switch to **"Desert Heat (+45°C)"**: Witness elevated thermal stress and coolant heat dissipation dynamics.
4. **Historical Sortie Replay**:
   - Select **"TAPAS Sortie #108 - Cyl #3 Ignition Drop"** and click **Replay Sortie**.
   - Scrub through pre-recorded flight data to forensically analyze in-flight failure inception.
5. **Airworthiness Debriefing Certificate**:
   - Click **"Health Report"** in the top navigation bar to generate the official DRDO-formatted Airworthiness and Health Debriefing Certificate ready for export/printing.

---

## 6. Defence & Industry Deployment Roadmap

- **Phase 1 (Current Prototype)**: High-fidelity software demonstrator, MVEM physics model, hybrid ML anomaly detection, and tactical GCS interface.
- **Phase 2 (Hardware-in-the-Loop - HIL)**: Integration with Physical CAN Bus transceiver (SocketCAN / NI-XNET) connected to Rotax 914/915 engine test-cell ECU.
- **Phase 3 (Edge AI Onboard Module)**: Quantizing the Isolation Forest and physics equations onto an onboard NVIDIA Jetson Orin / STM32H7 dual-core microcontroller for real-time onboard edge diagnostics without ground station telemetry dependence.
- **Phase 4 (Fleet-Level Digital Twin)**: Federated learning across multiple UAV squadrons (e.g. Western and Northern Command) for aggregated aero piston engine reliability tracking.
