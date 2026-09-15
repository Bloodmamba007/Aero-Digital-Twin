import React from 'react';

/**
 * Cylinder balance view.
 *
 * Absolute temperature thresholds misread at altitude: at 15,000 ft a healthy
 * engine cruises with CHT in the high 80s, which a fixed "below 90 = misfire"
 * rule flags as four simultaneous faults. Deviation from the cylinder pack is
 * altitude-invariant, so that is what drives the colour here; absolute values
 * stay as secondary text.
 *
 * The reference is the MEDIAN, not the mean. One dead cylinder pulls a
 * 4-sample mean far enough that the three healthy cylinders breach the
 * tolerance in the opposite direction — a real misfire would report as four
 * faults. The median is unmoved by a single outlier and isolates the culprit.
 */

const CHT_DEV_LIMIT = 15;   // °C from pack median before a cylinder is called out
const EGT_DEV_LIMIT = 120;  // °C from pack median

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function DeviationRow({ index, value, reference, limit, unit, precision = 0 }) {
  const dev = value - reference;
  const flagged = Math.abs(dev) > limit;
  const cold = flagged && dev < 0;

  // Bar is centred on the mean; half-width maps to 2x the limit.
  const half = Math.max(limit * 2, Math.abs(dev) * 1.15);
  const pct = Math.min(50, (Math.abs(dev) / half) * 50);
  const color = !flagged ? 'bg-ok/70' : cold ? 'bg-cold' : 'bg-crit';
  const textColor = !flagged ? 'text-zinc-200' : cold ? 'text-cold' : 'text-crit';

  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-2xs text-zinc-500 w-7 flex-shrink-0">#{index + 1}</span>

      <div className="relative flex-1 h-5 flex items-center">
        {/* mean axis */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.14]" />
        {/* tolerance band */}
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 h-4 w-[25%] -translate-x-1/2 rounded-sm bg-white/[0.035]" />
        {/* deviation bar */}
        <div
          className={`absolute h-[9px] rounded-sm transition-all duration-500 ${color}`}
          style={{
            width: `${Math.max(pct, 0.6)}%`,
            left: dev >= 0 ? '50%' : undefined,
            right: dev < 0 ? '50%' : undefined,
          }}
        />
      </div>

      <span className={`num text-[12.5px] w-14 text-right ${textColor}`}>
        {value.toFixed(precision)}
        <span className="unit !ml-0.5">{unit}</span>
      </span>

      <span className={`font-mono text-2xs w-12 text-right ${flagged ? textColor : 'text-zinc-600'}`}>
        {dev >= 0 ? '+' : ''}{dev.toFixed(precision)}
      </span>
    </div>
  );
}

function Block({ title, values, limit, unit, precision, redline }) {
  const ref = median(values);
  const spread = Math.max(...values) - Math.min(...values);
  const outliers = values.filter((v) => Math.abs(v - ref) > limit).length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="label">{title}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xs text-zinc-600">
            median <span className="text-zinc-400">{ref.toFixed(precision)}{unit}</span>
          </span>
          <span className={`font-mono text-2xs ${outliers ? 'text-crit' : 'text-zinc-600'}`}>
            spread <span className={outliers ? 'text-crit' : 'text-zinc-400'}>{spread.toFixed(precision)}{unit}</span>
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {values.map((v, i) => (
          <DeviationRow key={i} index={i} value={v} reference={ref} limit={limit} unit={unit} precision={precision} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
        <span className="font-mono text-2xs text-zinc-600">
          tolerance ±{limit}{unit} from pack median
        </span>
        {redline && <span className="font-mono text-2xs text-zinc-600">redline {redline}{unit}</span>}
      </div>
    </div>
  );
}

export default function CylinderAnalysis({ telemetry, aiDiagnostics }) {
  const cht = telemetry?.cht?.length ? telemetry.cht : [0, 0, 0, 0];
  const egt = telemetry?.egt?.length ? telemetry.egt : [0, 0, 0, 0];

  const chtRef = median(cht);
  const egtRef = median(egt);

  const flagged = cht
    .map((v, i) => ({ i, dev: v - chtRef, kind: 'CHT' }))
    .filter((c) => Math.abs(c.dev) > CHT_DEV_LIMIT)
    .concat(
      egt
        .map((v, i) => ({ i, dev: v - egtRef, kind: 'EGT' }))
        .filter((c) => Math.abs(c.dev) > EGT_DEV_LIMIT)
    );

  const balanced = flagged.length === 0;
  const hotCyl = Math.max(...cht) > 138;

  return (
    <section className="card p-4">
      <div className="sec-head">
        <h2 className="sec-title">Cylinder Balance</h2>
        <span className={`chip ${balanced && !hotCyl ? 'chip-ok' : 'chip-crit'}`}>
          {balanced && !hotCyl ? 'Balanced' : `${flagged.length} outlier${flagged.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="space-y-4">
        <Block title="Cylinder Head Temp" values={cht} limit={CHT_DEV_LIMIT} unit="°C" precision={1} redline={145} />
        <div className="border-t border-white/[0.06]" />
        <Block title="Exhaust Gas Temp" values={egt} limit={EGT_DEV_LIMIT} unit="°C" precision={0} redline={880} />
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06] text-xs">
        {balanced && !hotCyl ? (
          <span className="text-zinc-500">
            All four cylinders within tolerance of the pack median — combustion balance normal.
          </span>
        ) : (
          <span className="text-crit">
            {flagged.map((f) => `Cyl #${f.i + 1} ${f.kind} ${f.dev > 0 ? 'high' : 'low'}`).join(' · ')}
            {hotCyl && ' · CHT above redline'}
          </span>
        )}
      </div>
    </section>
  );
}
