import React from 'react';
import { 
  Gauge, 
  Fuel, 
  Droplet, 
  BatteryCharging, 
  Zap, 
  Thermometer, 
  Wind,
  Layers
} from 'lucide-react';

export default function AvionicsGauges({ telemetry }) {
  const rpm = telemetry?.rpm || 4800;
  const mapInhg = telemetry?.map_inhg || 29.92;
  const mapKpa = telemetry?.map_kpa || 101.3;
  const fuelFlowLph = telemetry?.fuel_flow_lph || 24.5;
  const bsfc = telemetry?.bsfc_g_kwh || 280;
  const oilPressurePsi = telemetry?.oil_pressure_psi || 55.0;
  const oilPressureKpa = telemetry?.oil_pressure_kpa || 380;
  const oilTempC = telemetry?.oil_temp_c || 95.0;
  const coolantTempC = telemetry?.coolant_temp_c || 85.0;
  const busVoltage = telemetry?.bus_voltage_v || 14.2;
  const alternatorCurrent = telemetry?.alternator_current_a || 22.0;
  const brakeHp = telemetry?.brake_hp || 112;

  // Percentage calculations for bar fills
  const rpmPct = Math.min(100, (rpm / 6200) * 100);
  const mapPct = Math.min(100, (mapKpa / 160) * 100);
  const oilPPct = Math.min(100, (oilPressureKpa / 550) * 100);
  const oilTPct = Math.min(100, (oilTempC / 140) * 100);

  return (
    <div className="bg-tactical-900 border border-tactical-border rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-tactical-border/80 mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h2 className="font-display font-bold text-sm tracking-wider uppercase text-slate-100">
            Avionics Propulsion Cluster
          </h2>
        </div>
        <span className="text-xs font-mono-code text-slate-400">FADEC CAN ID: 0x0CF00400</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* RPM Gauge */}
        <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono-code mb-1">
            <span>TACHOMETER</span>
            <span className="text-slate-500">MAX 5800</span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl font-bold font-mono-code tracking-tight ${rpm > 5600 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {Math.round(rpm)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono-code">RPM</span>
          </div>
          {/* Arc Progress */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1 flex">
            <div 
              className={`h-full transition-all duration-300 ${rpm > 5800 ? 'bg-red-500' : (rpm > 5500 ? 'bg-amber-500' : 'bg-emerald-500')}`}
              style={{ width: `${rpmPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono-code text-slate-500 mt-1">
            <span>IDLE</span>
            <span>CRUISE 4800</span>
            <span>5800 TO</span>
          </div>
        </div>

        {/* MAP (Manifold Absolute Pressure) Gauge */}
        <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono-code mb-1">
            <span>BOOST / MAP</span>
            <span className="text-cyan-400">{brakeHp} BHP</span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-bold font-mono-code tracking-tight text-cyan-300">
              {mapInhg.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono-code">inHg</span>
            <span className="text-[10px] text-slate-500 font-mono-code ml-1">({mapKpa} kPa)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${mapPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono-code text-slate-500 mt-1">
            <span>ATM 29.9</span>
            <span>BOOST +0.45 BAR</span>
          </div>
        </div>

        {/* Oil Circuit (Pressure & Temp) */}
        <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono-code mb-1">
            <span className="flex items-center gap-1"><Droplet className="w-3 h-3 text-amber-400" /> LUBRICATION</span>
            <span className={oilPressureKpa < 220 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}>
              {oilPressurePsi} PSI
            </span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <div>
              <span className={`text-xl font-bold font-mono-code tracking-tight ${oilPressureKpa < 220 ? 'text-red-400' : 'text-slate-100'}`}>
                {Math.round(oilPressureKpa)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono-code ml-1">kPa</span>
            </div>
            <div>
              <span className={`text-xl font-bold font-mono-code tracking-tight ${oilTempC > 115 ? 'text-amber-400' : 'text-slate-100'}`}>
                {Math.round(oilTempC)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono-code ml-1">°C</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full transition-all duration-300 ${oilPressureKpa < 220 ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${oilPPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono-code text-slate-500 mt-1">
            <span>MIN 150</span>
            <span>NORM 250-500</span>
          </div>
        </div>

        {/* Fuel Flow & BSFC */}
        <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono-code mb-1">
            <span className="flex items-center gap-1"><Fuel className="w-3 h-3 text-emerald-400" /> FUEL INJECTION</span>
            <span className="text-slate-400">{Math.round(bsfc)} g/kWh</span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-bold font-mono-code tracking-tight text-emerald-400">
              {fuelFlowLph.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono-code">L/HR</span>
            <span className="text-[10px] text-slate-500 font-mono-code ml-1">(AVGAS)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (fuelFlowLph / 40) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono-code text-slate-500 mt-1">
            <span>CRUISE ~24</span>
            <span>WOT ~38 L/H</span>
          </div>
        </div>

        {/* Electrical Bus & Alternator */}
        <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono-code mb-1">
            <span className="flex items-center gap-1"><BatteryCharging className="w-3 h-3 text-blue-400" /> ELECTRICAL</span>
            <span className="text-emerald-400">14V BUS</span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <div>
              <span className="text-xl font-bold font-mono-code tracking-tight text-blue-300">
                {busVoltage.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono-code ml-1">V</span>
            </div>
            <div>
              <span className="text-xl font-bold font-mono-code tracking-tight text-cyan-300">
                {alternatorCurrent.toFixed(0)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono-code ml-1">A</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (busVoltage / 15.0) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono-code text-slate-500 mt-1">
            <span>BATT 98%</span>
            <span>ALT CHARGING</span>
          </div>
        </div>

      </div>
    </div>
  );
}
