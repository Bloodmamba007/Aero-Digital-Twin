"""
Thermodynamic and Physics-based Engine Models for MALE UAV Aero Piston Engines
"""
import math
from typing import Dict, Any, Tuple

class AeroAtmosphereISA:
    """
    International Standard Atmosphere (ISA) Model up to 11,000m (Tropopause)
    Calculates ambient pressure, temperature, and air density vs altitude.
    """
    P0 = 101325.0       # Sea level pressure (Pa)
    T0 = 288.15         # Sea level temperature (K) -> 15°C
    L = 0.0065          # Temperature lapse rate (K/m)
    g0 = 9.80665        # Gravity (m/s^2)
    R_gas = 287.05      # Specific gas constant for dry air (J/(kg*K))

    @classmethod
    def get_atmospheric_state(cls, altitude_m: float, oat_delta_k: float = 0.0) -> Dict[str, float]:
        """
        altitude_m: Altitude in meters
        oat_delta_k: Deviation from standard temperature (e.g. +15K for hot desert)
        """
        alt = max(0.0, min(altitude_m, 11000.0))
        t_std = cls.T0 - cls.L * alt
        t_ambient = t_std + oat_delta_k
        
        # Pressure lapse (barometric formula)
        p_ambient = cls.P0 * math.pow(1.0 - (cls.L * alt / cls.T0), (cls.g0 / (cls.R_gas * cls.L)))
        # Air density rho = P / (R * T)
        rho_ambient = p_ambient / (cls.R_gas * t_ambient)
        
        return {
            "altitude_m": alt,
            "altitude_ft": alt * 3.28084,
            "t_ambient_k": t_ambient,
            "t_ambient_c": t_ambient - 273.15,
            "p_ambient_pa": p_ambient,
            "p_ambient_inhg": p_ambient * 0.0002953,
            "rho_ambient_kgm3": rho_ambient,
            "density_ratio_sigma": rho_ambient / 1.225
        }


class AeroPistonEnginePhysics:
    """
    Physics-based Mean Value Engine Model (MVEM) for 4-Stroke Turbocharged Boxer Aero Engine
    Inspired by Rotax 914 / 915 iS / DRDO indigenously developed UAV propulsion systems.
    
    Engine Specs:
    - 4 cylinders horizontally opposed, 4-stroke
    - Total Displacement: 1352 cc (1.352 L)
    - Bore: 84.0 mm, Stroke: 61.0 mm
    - Compression Ratio: 8.2:1 (turbocharged)
    - Max Continuous Power: 100 kW (135 HP) @ 5500 RPM
    - Takeoff / Max Power: 104 kW (141 HP) @ 5800 RPM
    - Dual Electronic Ignition & FADEC injection
    - Liquid-cooled cylinder heads & air-cooled cylinder barrels (hybrid cooling)
    - Integrated dry sump lubrication with external oil tank
    """

    def __init__(self):
        self.displacement_m3 = 1.352e-3
        self.num_cylinders = 4
        self.compression_ratio = 8.2
        self.lhv_fuel = 43.5e6  # Lower Heating Value of avgas/mogas (J/kg)
        self.stoich_afr = 14.7  # Stoichiometric air-fuel ratio
        
        # State thermal storage for dynamic lag
        self.cht = [118.0, 119.5, 117.8, 120.2]  # Cylinder Head Temps in deg C
        self.egt = [780.0, 785.0, 778.0, 790.0]  # Exhaust Gas Temps in deg C
        self.oil_temp = 95.0                     # Oil temp in deg C
        self.oil_pressure_kpa = 380.0            # Oil pressure in kPa
        self.coolant_temp = 85.0                 # Coolant temperature in deg C
        self.turbo_rpm = 95000.0                 # Turbocharger shaft RPM
        self.map_kpa = 101.3                     # Manifold Absolute Pressure
        self.engine_rpm = 4800.0                 # Engine RPM
        
    def step_thermodynamics(
        self,
        throttle_pct: float,
        altitude_m: float,
        airspeed_kts: float = 85.0,
        oat_offset_c: float = 0.0,
        dt: float = 0.1,
        fault_states: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Evolves engine physics by dt seconds given environmental and pilot inputs.
        """
        faults = fault_states or {}
        
        # 1. Atmospheric conditions
        atmo = AeroAtmosphereISA.get_atmospheric_state(altitude_m, oat_delta_k=oat_offset_c)
        p_amb = atmo["p_ambient_pa"]
        t_amb_k = atmo["t_ambient_k"]
        rho_amb = atmo["rho_ambient_kgm3"]
        
        # 2. RPM dynamics from throttle demand
        target_rpm = 2200.0 + (throttle_pct / 100.0) * 3600.0
        # Misfire or governor issues can damp target RPM
        if faults.get("misfire_cyl") is not None:
            target_rpm *= 0.88
            
        rpm_response_rate = 3.5  # rad/s response
        self.engine_rpm += (target_rpm - self.engine_rpm) * min(1.0, rpm_response_rate * dt)
        
        # 3. Turbocharger and Manifold Pressure (MAP)
        # Wastegate controls boost ratio (up to ~1.45 bar / 145 kPa absolute at full throttle)
        base_boost_ratio = 1.0 + (throttle_pct / 100.0) * 0.45 * (self.engine_rpm / 5000.0)
        
        # High altitude wastegate compensation:
        # Turbocharger spins faster at high altitude to maintain ~120-135 kPa MAP
        altitude_boost_demand = min(1.35, 1.0 + (altitude_m / 8000.0) * 0.4)
        target_turbo_rpm = 60000.0 + (throttle_pct / 100.0) * 75000.0 * altitude_boost_demand
        
        # Check turbocharger degradation / wastegate leak fault
        if faults.get("turbo_wastegate_leak", False):
            base_boost_ratio = 1.0 + (base_boost_ratio - 1.0) * 0.45
            target_turbo_rpm *= 0.7
            
        self.turbo_rpm += (target_turbo_rpm - self.turbo_rpm) * min(1.0, 2.0 * dt)
        
        target_map_pa = p_amb * base_boost_ratio
        # Clamp to realistic Rotax 914/915 MAP limit (~155 kPa max)
        target_map_pa = min(155000.0, max(p_amb * 0.35, target_map_pa))
        self.map_kpa += ((target_map_pa / 1000.0) - self.map_kpa) * min(1.0, 6.0 * dt)
        map_inhg = self.map_kpa * 0.2953
        
        # 4. Air mass flow and volumetric efficiency
        volumetric_efficiency = 0.82 + 0.12 * (self.engine_rpm / 5800.0) - 0.05 * math.pow(self.engine_rpm / 5800.0, 2)
        rho_manifold = (self.map_kpa * 1000.0) / (287.05 * (t_amb_k + 20.0))  # After intercooler
        m_dot_air = volumetric_efficiency * (self.displacement_m3 * (self.engine_rpm / 60.0) / 2.0) * rho_manifold  # kg/s
        
        # 5. Fuel injection & Air-Fuel Ratio (AFR)
        lambda_target = 0.88 if throttle_pct > 80.0 else 0.98  # Rich for high-power cooling
        afr_actual = self.stoich_afr * lambda_target
        m_dot_fuel = m_dot_air / afr_actual  # kg/s
        fuel_flow_lph = (m_dot_fuel * 3600.0) / 0.74  # Liters per hour (AvGas density 0.74 kg/L)
        
        # 6. Engine Power and Torque
        indicated_thermal_eff = 0.48 * (1.0 - math.pow(1.0 / self.compression_ratio, 0.28))
        indicated_power_w = m_dot_fuel * self.lhv_fuel * indicated_thermal_eff
        
        # Friction & pumping losses (typically 10-18 kW at high RPM)
        friction_power_w = 1800.0 + 380.0 * math.pow(self.engine_rpm / 1000.0, 1.7)
        brake_power_w = max(5000.0, indicated_power_w - friction_power_w)
        brake_hp = brake_power_w / 745.7
        torque_nm = (brake_power_w / (2.0 * math.pi * (self.engine_rpm / 60.0))) if self.engine_rpm > 100 else 0.0
        bsfc_g_kwh = ((m_dot_fuel * 3600.0 * 1000.0) / (brake_power_w / 1000.0))
        
        # 7. Thermal Dynamics: CHT and EGT per cylinder
        # Baseline heat generation proportional to indicated power
        cyl_power_share = [0.25, 0.25, 0.25, 0.25]
        
        # Apply cylinder-specific faults:
        misfire_cyl = faults.get("misfire_cyl")
        clogged_injector_cyl = faults.get("clogged_injector_cyl")
        
        if misfire_cyl is not None and 1 <= misfire_cyl <= 4:
            cyl_power_share[misfire_cyl - 1] = 0.03  # Lost combustion
        elif clogged_injector_cyl is not None and 1 <= clogged_injector_cyl <= 4:
            cyl_power_share[clogged_injector_cyl - 1] = 0.14  # Lean/starved combustion
            
        # Cooling air heat transfer coefficient (ram air proportional to airspeed)
        h_ram = 15.0 + 1.2 * airspeed_kts
        # Coolant circulation heat transfer
        cooling_degradation = faults.get("cooling_degradation_factor", 1.0)
        h_coolant = (85.0 + 0.02 * self.engine_rpm) * cooling_degradation
        
        # Target steady state coolant temp
        target_coolant = 75.0 + (brake_hp / 140.0) * 28.0 + (atmo["t_ambient_c"] - 15.0) * 0.35
        if cooling_degradation < 0.8:
            target_coolant += (1.0 - cooling_degradation) * 55.0  # Coolant boil risk
        self.coolant_temp += (target_coolant - self.coolant_temp) * min(1.0, 0.2 * dt)
        
        # Dynamic update of each cylinder CHT & EGT
        for i in range(4):
            # Liquid-cooled cylinder head keeps CHT well-regulated around 108-124 deg C under nominal conditions
            head_cooling_effect = 1.0 if cooling_degradation >= 0.8 else max(0.4, cooling_degradation / 0.8)
            target_cht_i = self.coolant_temp + (18.0 + (brake_hp / 140.0) * 15.0 + (3.0 if i in [1, 3] else 0.0)) / head_cooling_effect
            
            # If misfire, cylinder cools down toward ambient
            if misfire_cyl == (i + 1):
                target_cht_i = self.coolant_temp * 0.75 + atmo["t_ambient_c"] * 0.25
                
            self.cht[i] += (target_cht_i - self.cht[i]) * min(1.0, 0.3 * dt)
            
            # EGT Target
            if misfire_cyl == (i + 1):
                target_egt_i = 180.0 + atmo["t_ambient_c"]  # No combustion flame
            elif clogged_injector_cyl == (i + 1):
                # Starved lean burn initially causes high peak flame temp, then flameout
                target_egt_i = 890.0  # Dangerously hot lean exhaust
            else:
                base_egt = 740.0 + (throttle_pct / 100.0) * 110.0 - (10.0 if lambda_target < 0.9 else 0.0)
                # Altitude enrichment effect
                target_egt_i = base_egt + (altitude_m / 1000.0) * 4.0 + (i * 3.5 - 5.0)
                
            self.egt[i] += (target_egt_i - self.egt[i]) * min(1.0, 1.2 * dt)
            
        # 8. Oil circuit dynamics (Pressure & Temp)
        # Viscosity decreases as temp rises
        oil_leak = faults.get("oil_leak_severity", 0.0)  # 0.0 to 1.0
        target_oil_temp = 82.0 + (brake_hp / 140.0) * 32.0 + (atmo["t_ambient_c"] - 15.0) * 0.4
        if oil_leak > 0.3:
            target_oil_temp += oil_leak * 45.0  # Reduced oil volume heats up rapidly
            
        self.oil_temp += (target_oil_temp - self.oil_temp) * min(1.0, 0.15 * dt)
        
        # Oil pressure: driven by engine gear pump proportional to RPM, clamped by relief valve
        nominal_oil_p = 220.0 + (self.engine_rpm / 5800.0) * 260.0 - (self.oil_temp - 90.0) * 1.5
        nominal_oil_p = max(120.0, min(550.0, nominal_oil_p))
        if oil_leak > 0.0:
            nominal_oil_p *= max(0.15, (1.0 - oil_leak * 0.75))
            
        self.oil_pressure_kpa += (nominal_oil_p - self.oil_pressure_kpa) * min(1.0, 1.5 * dt)
        
        # 9. Electrical & Ignition
        alternator_current_a = 18.0 + (brake_hp / 140.0) * 12.0
        bus_voltage_v = 14.2 - (0.8 if faults.get("alternator_degradation", False) else 0.0)
        battery_soc_pct = 98.0 if bus_voltage_v > 13.5 else 82.0
        
        # 10. Vibration & Harmonic Signatures
        # Baseline vibration RMS in G
        base_vib_rms = 0.85 + (self.engine_rpm / 5800.0) * 1.4
        bearing_wear = faults.get("bearing_wear_severity", 0.0)
        if bearing_wear > 0:
            base_vib_rms += bearing_wear * 3.8
        if misfire_cyl is not None:
            base_vib_rms += 2.5  # Heavy asymmetric torsional wobble
            
        # Harmonic peaks (1X = crank, 2X = piston reciprocating, high freq = turbo)
        harmonic_1x = base_vib_rms * 0.45 + (1.8 if misfire_cyl else 0.0)
        harmonic_2x = base_vib_rms * 0.30 + (bearing_wear * 1.5)
        high_freq_turb = (self.turbo_rpm / 120000.0) * 1.1 + (bearing_wear * 1.2)
        
        return {
            "timestamp_iso": "",
            "rpm": round(self.engine_rpm, 1),
            "throttle_pct": round(throttle_pct, 1),
            "altitude_ft": round(atmo["altitude_ft"], 0),
            "altitude_m": round(altitude_m, 1),
            "airspeed_kts": round(airspeed_kts, 1),
            "oat_c": round(atmo["t_ambient_c"], 1),
            "density_ratio_sigma": round(atmo["density_ratio_sigma"], 3),
            "map_kpa": round(self.map_kpa, 1),
            "map_inhg": round(map_inhg, 2),
            "turbo_rpm": round(self.turbo_rpm, 0),
            "brake_hp": round(brake_hp, 1),
            "torque_nm": round(torque_nm, 1),
            "bsfc_g_kwh": round(bsfc_g_kwh, 1),
            "fuel_flow_lph": round(fuel_flow_lph, 2),
            "cht": [round(c, 1) for c in self.cht],
            "egt": [round(e, 1) for e in self.egt],
            "coolant_temp_c": round(self.coolant_temp, 1),
            "oil_temp_c": round(self.oil_temp, 1),
            "oil_pressure_kpa": round(self.oil_pressure_kpa, 1),
            "oil_pressure_psi": round(self.oil_pressure_kpa * 0.145038, 1),
            "bus_voltage_v": round(bus_voltage_v, 2),
            "alternator_current_a": round(alternator_current_a, 1),
            "battery_soc_pct": round(battery_soc_pct, 1),
            "vibration_rms_g": round(base_vib_rms, 2),
            "vibration_spectrum": {
                "harmonic_1x_g": round(harmonic_1x, 2),
                "harmonic_2x_g": round(harmonic_2x, 2),
                "high_freq_turb_g": round(high_freq_turb, 2),
                "spectral_bins": self._generate_fft_bins(base_vib_rms, harmonic_1x, harmonic_2x)
            },
            "ignition_advance_deg": round(24.0 - (self.map_kpa / 150.0) * 8.0, 1),
            "injection_pulse_ms": round(2.5 + (m_dot_fuel * 1000.0) * 1.8, 2)
        }

    def _generate_fft_bins(self, rms: float, h1: float, h2: float) -> list:
        """
        Generates 32 spectral bins representing 0 Hz to 2000 Hz for FFT visualization.
        """
        bins = []
        crank_hz = (self.engine_rpm / 60.0)
        for i in range(32):
            f = i * 62.5  # 0 to 2000 Hz in steps of ~62.5 Hz
            val = 0.08 * rms
            # Peak near 1X crank speed
            if abs(f - crank_hz) < 40:
                val += h1 * 0.95
            # Peak near 2X crank speed
            if abs(f - 2 * crank_hz) < 40:
                val += h2 * 0.85
            # Peak near turbo blade pass frequency (~1500 Hz)
            if abs(f - 1500) < 80:
                val += rms * 0.4
            bins.append(round(val, 3))
        return bins
