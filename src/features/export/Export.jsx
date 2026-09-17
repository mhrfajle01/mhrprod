import React from 'react';

export default function Export({ log, updateLog }) {
  const handleExport = () => {
    if (!log) {
      alert("No data to export for today.");
      return;
    }
    
    let csv = 'Block,Target,Produced\n';
    const targets = log.blockTargets || [];
    const actuals = log.actuals || [];
    
    const maxLen = Math.max(targets.length, actuals.length);
    for (let i = 0; i < maxLen; i++) {
      const tgt = targets[i] || 0;
      const act = actuals[i] || 0;
      csv += `Block ${i + 1},${tgt},${act}\n`;
    }
    
    const totalTgt = targets.reduce((a, b) => a + b, 0);
    const totalAct = actuals.reduce((a, b) => a + Number(b || 0), 0);
    csv += `\nTOTAL,${totalTgt},${totalAct}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift_export_${log.date || 'today'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data for today? This will clear all production blocks and timer history. This cannot be undone.")) {
      updateLog({
        ...log,
        actuals: [],
        blockTargets: [],
        timer: {
          status: 'idle',
          accumulatedMs: 0,
          segmentStart: null,
          breakAccumMs: 0,
          breakSegmentStart: null
        }
      });
    }
  };

  return (
    <div className="panel" id="actionsPanel">
      <div className="actions">
        <button className="btn btn-primary" onClick={handleExport}>
          Export today (.csv)
        </button>
        <button className="btn btn-ghost" onClick={handleReset}>Reset day</button>
      </div>
      <p className="export-note">Download your data before it resets.</p>
    </div>
  );
}
