import React, { useState } from 'react';

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

  const [showModal, setShowModal] = useState(false);

  const confirmReset = () => {
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
    setShowModal(false);
  };

  return (
    <div className="panel" id="actionsPanel">
      <div className="actions">
        <button className="btn btn-primary" onClick={handleExport}>
          Export today (.csv)
        </button>
        <button className="btn btn-ghost" onClick={() => setShowModal(true)}>Reset day</button>
      </div>
      <p className="export-note">Download your data before it resets.</p>
      
      {showModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999}}>
          <div className="panel" style={{maxWidth:'300px', textAlign:'center', margin:'20px'}}>
            <h3 style={{marginTop:0, color:'var(--bad)'}}>Reset Today?</h3>
            <p style={{fontSize:'0.9rem', color:'var(--ink-dim)'}}>This will clear all blocks and timers. This cannot be undone.</p>
            <div className="btn-row" style={{justifyContent:'center', marginTop:'20px'}}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{background:'var(--bad)', boxShadow:'0 4px 0 #8c3b29'}} onClick={confirmReset}>Yes, Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
