import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench,
  FileCheck,
  Calendar,
  Layers
} from 'lucide-react';

export default function HealthReportModal({ isOpen, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/report/generate')
        .then((res) => res.json())
        .then((data) => {
          setReport(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-tactical-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        
        {/* Modal Header */}
        <div className="bg-tactical-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 uppercase tracking-wider">
                Propulsion Health & Airworthiness Debriefing Certificate
              </h3>
              <span className="text-xs font-mono-code text-cyan-400">
                DRDO / DDP / IDEX DEFENCE PROPULSION AUDIT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono-code text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="p-6 text-slate-200 font-mono-code text-xs space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Generating debriefing report from telemetry...</div>
          ) : report ? (
            <>
              {/* Mission Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-tactical-950/70 p-4 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">REPORT ID</span>
                  <span className="font-bold text-slate-100">{report.report_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">AIRCRAFT TAIL</span>
                  <span className="font-bold text-cyan-400">{report.aircraft_tail_no}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">ENGINE SERIAL</span>
                  <span className="font-bold text-slate-100">{report.engine_serial}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">FLIGHT ACCUMULATED</span>
                  <span className="font-bold text-slate-100">{report.accumulated_engine_hours} HRS</span>
                </div>
              </div>

              {/* Airworthiness Decision Banner */}
              <div className={`p-4 rounded-lg border flex items-center justify-between ${
                report.certification_status === 'GO FOR SORTIE'
                  ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-500 text-red-300'
              }`}>
                <div className="flex items-center gap-3">
                  {report.certification_status === 'GO FOR SORTIE' ? (
                    <FileCheck className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                  )}
                  <div>
                    <span className="text-xs text-slate-400 uppercase block">AIRWORTHINESS DISPATCH DECISION</span>
                    <span className="font-display font-bold text-lg tracking-wider">
                      {report.certification_status}
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono-code">
                  <span className="text-[10px] text-slate-400 block">HEALTH INDEX</span>
                  <span className="text-2xl font-bold">{report.overall_health_index}%</span>
                </div>
              </div>

              {/* Subsystem Health Audit */}
              <div>
                <span className="text-slate-400 font-bold block mb-2">1. SUBSYSTEM HEALTH ASSESSMENT</span>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {Object.entries(report.subsystem_health_audit || {}).map(([sub, val]) => (
                    <div key={sub} className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">{sub}</span>
                      <span className="font-bold text-sm text-cyan-300">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Component Wear Breakdown */}
              <div>
                <span className="text-slate-400 font-bold block mb-2">2. HARDWARE DEGRADATION AUDIT</span>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  {Object.entries(report.component_wear_audit || {}).map(([comp, val]) => (
                    <div key={comp} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 uppercase">{comp.replace('_pct', '').replace(/_/g, ' ')}</span>
                      <span className={`font-bold ${val > 50 ? 'text-amber-400' : 'text-slate-200'}`}>{val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnosed In-Flight Faults */}
              <div>
                <span className="text-slate-400 font-bold block mb-2">3. ANOMALY LOG & ROOT CAUSE ANALYSIS</span>
                {report.diagnosed_anomalies?.length === 0 ? (
                  <p className="text-emerald-400 text-xs bg-slate-950 p-3 rounded border border-slate-800">
                    No physical anomalies logged during mission profile.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {report.diagnosed_anomalies.map((f, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded border border-red-800/80">
                        <div className="flex justify-between text-red-400 font-bold mb-1">
                          <span>{f.title}</span>
                          <span>CONFIDENCE: {f.confidence}%</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{f.evidence}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Maintenance Advisories */}
              <div>
                <span className="text-slate-400 font-bold block mb-2">4. PRE-FLIGHT MAINTENANCE MANDATE</span>
                <div className="space-y-1.5">
                  {report.airworthiness_prescriptions?.map((p, i) => (
                    <div key={i} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-200">{p.action}</span>
                      <span className="text-cyan-400 text-[10px] whitespace-nowrap ml-3">{p.downtime_est}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DRDO Certification Sign-off */}
              <div className="border-t border-slate-800 pt-4 flex justify-between items-end text-slate-500 text-[10px]">
                <div>
                  <span>Aeronautical Development Establishment (ADE)</span>
                  <br />
                  <span>Digital Twin Diagnostic Core v1.0.0</span>
                </div>
                <div className="text-right">
                  <span>CHIEF PROPULSION ENGINEER SIGN-OFF</span>
                  <div className="border-b border-slate-700 w-48 mt-4 mb-1" />
                  <span>AUTONOMOUS AI-TWIN VERIFIED</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}
