import React, { useMemo, useEffect, useState } from 'react';
import { buildTimeline, minutesToLabel, parseTimeToMinutes, shiftSpanMinutes, formatNum } from '../../utils';
import { recomputeTargets } from '../../targetsUtils';
import { playSuccessSound, Confetti } from '../../features/animations/Animations';

export default function Blocks({ settings, log, updateLog, isEditing }) {
  const [nowMin, setNowMin] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const slots = useMemo(() => {
    if (!settings) return [];
    return buildTimeline(settings);
  }, [settings]);

  // Ensure log.actuals and blockTargets are initialized properly
  useEffect(() => {
    if (!settings) return;
    const workSlots = slots.filter(s => s.type === 'work');
    const currentActuals = log?.actuals || [];
    
    let needsUpdate = false;
    let newActuals = currentActuals;
    
    if (currentActuals.length !== workSlots.length) {
      newActuals = new Array(workSlots.length).fill(null);
      needsUpdate = true;
    }
    
    if (needsUpdate || !log?.blockTargets) {
      const simulatedLog = { ...(log || {}), actuals: newActuals };
      const newBlockTargets = recomputeTargets(slots, settings, simulatedLog);
      updateLog({
        ...simulatedLog,
        blockTargets: newBlockTargets
      });
    }
  }, [slots, log, settings, updateLog]);

  const currentOffset = () => {
    if (!settings) return null;
    const startMin = parseTimeToMinutes(settings.start);
    const span = shiftSpanMinutes(settings);
    const d = new Date();
    const currMin = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
    const off = (((currMin - startMin) % 1440) + 1440) % 1440;
    return off < span ? off : null;
  };

  const currentSlotIndex = () => {
    const off = currentOffset();
    if (off === null) return -1;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (off >= s.offset && off < s.offset + s.minutes) return i;
    }
    return -1;
  };

  const handleActualChange = (wi, val) => {
    const safeLog = log || {};
    const newActuals = [...(safeLog.actuals || [])];
    
    if (val === '') {
      newActuals[wi] = null;
    } else {
      let numVal = parseFloat(val);
      
      // Always Cumulative Logic:
      let prevSum = 0;
      for (let i = 0; i < wi; i++) {
        if (newActuals[i] !== null && newActuals[i] !== undefined) {
          prevSum += Number(newActuals[i]);
        }
      }
      
      // If the user typed a valid number, we subtract prevSum to find the exact block actual.
      // We allow it to be negative momentarily while they type so the input string exactly matches what they see.
      numVal = numVal - prevSum;
      newActuals[wi] = numVal;
      // Check for success milestone
      const prevActual = Number(newActuals[wi] || 0) - numVal; // rough estimate of prev vs new
      const targetForBlock = log?.blockTargets?.[wi] || 0;
      
      if (numVal >= targetForBlock && targetForBlock > 0) {
        // Did we just cross the threshold? 
        playSuccessSound();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
    
    // Recompute blockTargets when actuals change
    const newBlockTargets = recomputeTargets(slots, settings, { ...safeLog, actuals: newActuals });
    
    updateLog({ ...safeLog, actuals: newActuals, blockTargets: newBlockTargets });
  };

  const locked = log?.timer?.status === 'stopped' && !isEditing;
  const nowSlot = currentSlotIndex();

  return (
    <div className="panel" id="hoursPanel">
      <Confetti active={showConfetti} />
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Block by block</span>
        <span id="adaptiveBadge" style={{ fontSize: '0.68rem', color: 'var(--ink-dim)' }}>
          {settings?.adaptive ? 'adaptive' : ''}
        </span>
      </div>
      <div id="hourList">
        {slots.map((slot, si) => {
          if (slot.type === 'break') {
            return (
              <div key={si} className="hour-row is-break">
                <div className="hour-time">{minutesToLabel(slot.startMin)} – {minutesToLabel(slot.endMin)}</div>
                <div className="hour-target">{slot.minutes} min</div>
                <div className="break-name">{slot.label}</div>
                <div className="hour-status"></div>
              </div>
            );
          }

          const wi = slot.workIndex;
          const actual = log?.actuals?.[wi];
          
          // Compute cumulative sum for the input box
          let sum = 0;
          let hasValue = false;
          for (let i = 0; i <= wi; i++) {
            if (log?.actuals?.[i] !== null && log?.actuals?.[i] !== undefined) {
              sum += Number(log?.actuals[i]);
              if (i === wi) hasValue = true;
            }
          }
          const displayVal = hasValue ? sum : null;

          const tgt = log?.blockTargets?.[wi] || 0; // Requires blockTargets computation
          let statusCls = '';
          if (actual !== null && actual !== undefined && actual !== '') {
            statusCls = Number(actual) >= tgt ? 'hit' : 'miss';
          }

          let rowCls = 'hour-row';
          if (nowSlot === si) rowCls += ' current';
          else if (nowSlot > si && nowSlot >= 0) rowCls += ' past';
          if (locked) rowCls += ' locked';

          return (
            <div key={si} className={rowCls}>
              <div className="hour-time">{minutesToLabel(slot.startMin)} – {minutesToLabel(slot.endMin)}</div>
              <div className="hour-target">
                target {formatNum(tgt)}
                {hasValue && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-dim)' }}>
                    this hr: {formatNum(actual)}
                  </div>
                )}
              </div>
              <input 
                id={nowSlot === si ? 'activeBlockInput' : undefined}
                type="number" 
                inputMode="decimal"
                pattern="[0-9]*"
                min="0" step="any" 
                placeholder="total count"
                value={displayVal === null || displayVal === undefined ? '' : displayVal}
                onChange={e => handleActualChange(wi, e.target.value)}
                disabled={locked}
                style={{ width: '85px', padding: '4px 6px', textAlign: 'right', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <div className={`hour-status ${statusCls}`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
