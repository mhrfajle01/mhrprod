import React, { useEffect, useState } from 'react';
import { fmtDuration, fmtMinShort } from '../../utils';

export default function Timer({ settings, log, updateLog }) {
  const [now, setNow] = useState(Date.now());
  const timer = log?.timer || {
    status: 'idle',
    accumulatedMs: 0,
    segmentStart: null,
    breakAccumMs: 0,
    breakSegmentStart: null
  };

  useEffect(() => {
    if (timer.status === 'running') {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [timer.status]);

  const elapsedMs = () => {
    let base = timer.accumulatedMs || 0;
    if (timer.status === 'running' && timer.segmentStart) {
      base += now - timer.segmentStart;
    }
    return base;
  };

  const breakMs = () => {
    let base = timer.breakAccumMs || 0;
    if (timer.breakSegmentStart) {
      base += now - timer.breakSegmentStart;
    }
    return base;
  };

  const prodMs = () => Math.max(0, elapsedMs() - breakMs());
  const onBreak = () => !!timer.breakSegmentStart;

  const handleStart = () => {
    updateLog({
      ...log,
      timer: { ...timer, status: 'running', segmentStart: Date.now(), startedAt: timer.startedAt || Date.now() }
    });
  };

  const handlePause = () => {
    if (timer.breakSegmentStart) handleEndBreak();
    else {
      updateLog({
        ...log,
        timer: { ...timer, status: 'paused', accumulatedMs: elapsedMs(), segmentStart: null }
      });
    }
  };

  const handleResume = () => {
    updateLog({
      ...log,
      timer: { ...timer, status: 'running', segmentStart: Date.now() }
    });
  };

  const handleStop = () => {
    if (timer.breakSegmentStart) handleEndBreak();
    else {
      updateLog({
        ...log,
        timer: { ...timer, status: 'stopped', accumulatedMs: elapsedMs(), segmentStart: null, stoppedAt: Date.now() }
      });
    }
  };

  const handleBreak = () => {
    if (timer.breakSegmentStart) handleEndBreak();
    else {
      updateLog({
        ...log,
        timer: { ...timer, breakSegmentStart: Date.now() }
      });
    }
  };

  const handleEndBreak = () => {
    updateLog({
      ...log,
      timer: { ...timer, breakAccumMs: breakMs(), breakSegmentStart: null }
    });
  };

  const brk = onBreak();
  const running = timer.status === 'running';
  const paused = timer.status === 'paused';
  const stopped = timer.status === 'stopped';
  const idle = timer.status === 'idle';

  return (
    <div className="panel" id="timerPanel">
      <p className="panel-title">
        <span>Shift clock</span>
        <span className={`timer-state ${brk ? 'paused' : timer.status}`}>
          {idle ? 'Not started' : stopped ? 'Closed' : paused ? 'Paused' : brk ? 'On break' : 'Running'}
        </span>
      </p>
      
      <div className={`timer-clock ${brk ? 'onbreak' : idle ? 'idle' : ''}`}>
        {fmtDuration(elapsedMs())}
      </div>
      
      <div className="timer-meta">
        <div><span className="tm-num">{fmtDuration(prodMs())}</span><span className="tm-lbl">production time</span></div>
        <div><span className="tm-num">{fmtDuration(breakMs())}</span><span className="tm-lbl">break taken</span></div>
        <div><span className="tm-num">{/* Earned break logic */ '0:00'}</span><span className="tm-lbl">break earned</span></div>
      </div>
      
      <div className="btn-row" id="timerButtons">
        {idle && <button className="btn btn-primary" onClick={handleStart}>Start shift</button>}
        {running && !brk && <button className="btn btn-ghost" onClick={handlePause}>Pause</button>}
        {paused && <button className="btn btn-ghost" onClick={handleResume}>Resume</button>}
        {!idle && !stopped && <button className="btn btn-ghost" onClick={handleStop}>Stop</button>}
        {stopped && <button className="btn btn-ghost" onClick={() => updateLog({...log, timer: {...timer, status: 'paused', stoppedAt: null}})}>Reopen</button>}
        {running && (
          <button className="btn btn-ghost" onClick={handleBreak}>
            {brk ? `End break · ${fmtMinShort((now - timer.breakSegmentStart) / 60000)}` : 'Take break'}
          </button>
        )}
      </div>
    </div>
  );
}
