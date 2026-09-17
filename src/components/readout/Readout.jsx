import React from 'react';
import { formatNum } from '../../utils';

export default function Readout({ settings, log }) {
  const target = settings?.target || 0;
  
  const sumActuals = () => {
    if (!log || !log.actuals) return 0;
    return log.actuals.reduce((sum, v) => sum + (v === null || v === undefined ? 0 : (Number(v) || 0)), 0);
  };
  
  const produced = sumActuals();
  const remaining = Math.max(0, target - produced);
  const pct = target > 0 ? Math.min(100, (produced/target)*100) : 0;

  return (
    <div className="panel" id="readoutPanel">
      <p className="panel-title">Today's progress</p>
      <div className="readout">
        <div className="stat produced"><span className="num">{formatNum(produced)}</span><span className="lbl">Produced</span></div>
        <div className="stat target"><span className="num">{formatNum(target)}</span><span className="lbl">Target</span></div>
        <div className="stat remaining"><span className="num">{formatNum(remaining)}</span><span className="lbl">Remaining</span></div>
      </div>
      <div className="bar-track"><div className={`bar-fill ${pct >= 100 ? 'done' : ''}`} style={{width: `${pct}%`}}></div></div>
      <div className="bar-caption">
        <span>{Math.round(pct)}% of target</span>
        <span>{settings?.unit}</span>
      </div>
      {/* Pace line would go here */}
      <div className="pace-line">Clock running. Log a block to see pace.</div>
    </div>
  );
}
