import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { parseTimeToMinutes, shiftSpanMinutes } from '../../utils';

export default function Wizard({ initialSettings, updateSettings, isAuthed, onCancel }) {
  const [error, setError] = useState('');
  const [breakToDelete, setBreakToDelete] = useState(null);

  const defaultShortcuts = {
    toggleTimer: 'Ctrl+Space',
    stopTimer: 'Ctrl+Escape',
    takeBreak: 'Alt+B',
    focusBlock: 'Ctrl+Enter',
    exportData: 'Alt+E',
    gotoReports: 'Alt+R',
    gotoSettings: 'Alt+S',
    gotoTracker: 'Alt+T'
  };

  const captureShortcut = (e, field) => {
    e.preventDefault();
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
    
    let str = '';
    if (e.ctrlKey || e.metaKey) str += 'Ctrl+';
    if (e.altKey) str += 'Alt+';
    if (e.shiftKey) str += 'Shift+';
    
    let key = e.key === ' ' ? 'Space' : e.key;
    if (key.length === 1) key = key.toUpperCase();
    
    updateForm({ shortcuts: { ...form.shortcuts, [field]: str + key } });
  };

  const [form, setForm] = useState(() => {
    if (initialSettings) {
      return {
        ...initialSettings,
        shortcuts: { ...defaultShortcuts, ...(initialSettings.shortcuts || {}) }
      };
    }
    return {
      target: '',
      unit: '',
      start: '08:00',
      end: '16:00',
      blockMinutes: 60,
      adaptive: true,
      earnBreak: true,
      breaks: [],
      shortcuts: defaultShortcuts,
      wallpaper: ''
    };
  });

  const updateForm = (updates) => setForm(f => ({ ...f, ...updates }));

  const validateAll = () => {
    if (!(Number(form.target) > 0)) return 'Enter a target greater than zero.';
    if (!form.unit.trim()) return 'Enter a unit, like pcs or doc.';
    
    const sM = parseTimeToMinutes(form.start);
    const eM = parseTimeToMinutes(form.end);
    if (sM === null) return 'Set a start time.';
    if (eM === null) return 'Set an end time.';
    if (sM === eM) return 'Start and end can\'t be the same time.';
    
    const span = shiftSpanMinutes(form);
    for (let i = 0; i < form.breaks.length; i++) {
      const b = form.breaks[i];
      const bM = parseTimeToMinutes(b.start);
      if (bM === null) return `Break ${i + 1} needs a start time.`;
      const off = (((bM - sM) % 1440) + 1440) % 1440;
      if (off <= 0 || off >= span) return `Break ${i + 1} sits outside the shift window.`;
      if (!(b.minutes > 0)) return `Break ${i + 1} needs a length in minutes.`;
      if (off + b.minutes > span) return `Break ${i + 1} runs past the end of the shift.`;
    }
    
    if (form.wallpaper && !/^https?:\/\//i.test(form.wallpaper.trim())) {
      return 'Enter a full URL starting with http:// or https:// for the wallpaper';
    }
    return '';
  };

  const handleSave = async () => {
    const err = validateAll();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    
    try {
      await updateSettings({
        ...form,
        target: Number(form.target),
        blockMinutes: Number(form.blockMinutes),
        wallpaper: isAuthed ? form.wallpaper : ''
      });
    } catch (e) {
      setError("Failed to save shift: " + e.message);
    }
  };

  const addBreak = () => {
    updateForm({ breaks: [...form.breaks, { start: '12:00', minutes: 30, label: 'Break' }] });
  };

  const confirmRemoveBreak = () => {
    if (breakToDelete !== null) {
      updateForm({ breaks: form.breaks.filter((_, idx) => idx !== breakToDelete) });
      setBreakToDelete(null);
    }
  };

  const updateBreak = (i, field, val) => {
    const newBreaks = [...form.breaks];
    newBreaks[i] = { ...newBreaks[i], [field]: val };
    updateForm({ breaks: newBreaks });
  };

  return (
    <div className="panel" id="wizardPanel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="wiz-head" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '0' }}>
        <span className="wiz-title" style={{ fontSize: '1.2rem' }}>Settings</span>
      </div>

      <section>
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', color: 'var(--ink)' }}>Basic Setup</h3>
        <div className="field-row">
          <div className="field">
            <label>Target production</label>
            <input type="number" min="1" step="1" placeholder="e.g. 2000" 
              value={form.target} onChange={e => updateForm({ target: e.target.value })} />
          </div>
          <div className="field">
            <label>Unit (pcs, doc…)</label>
            <input type="text" maxLength="12" placeholder="pcs, doc, box…" 
              value={form.unit} onChange={e => updateForm({ unit: e.target.value })} />
          </div>
        </div>
      </section>

      <section>
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', color: 'var(--ink)' }}>Time & Blocks</h3>
        <p className="wiz-sub">Overnight shifts are fine — end time can be earlier than start.</p>
        <div className="field-row">
          <div className="field">
            <label>Shift starts</label>
            <input type="time" value={form.start} onChange={e => updateForm({ start: e.target.value })} />
          </div>
          <div className="field">
            <label>Shift ends</label>
            <input type="time" value={form.end} onChange={e => updateForm({ end: e.target.value })} />
          </div>
        </div>
        <div className="field-row single" style={{ marginTop: '12px' }}>
          <div className="field">
            <label>Track in blocks of</label>
            <select value={form.blockMinutes} onChange={e => updateForm({ blockMinutes: Number(e.target.value) })}>
              <option value={60}>60 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', color: 'var(--ink)' }}>Scheduled Breaks</h3>
        <p className="wiz-sub">Breaks are cut out of the target math entirely.</p>
        <div id="breakList">
          {form.breaks.length === 0 ? (
            <p className="history-empty" style={{marginBottom:'10px'}}>No scheduled breaks yet.</p>
          ) : (
            form.breaks.map((brk, i) => (
              <div key={i} className="break-edit">
                <input type="time" value={brk.start} onChange={e => updateBreak(i, 'start', e.target.value)} />
                <input type="number" min="5" max="240" step="5" placeholder="min" value={brk.minutes} onChange={e => updateBreak(i, 'minutes', Number(e.target.value))} />
                <input type="text" maxLength="16" placeholder="Lunch" value={brk.label} onChange={e => updateBreak(i, 'label', e.target.value)} />
                <button className="btn btn-ghost btn-small" type="button" onClick={() => setBreakToDelete(i)}>✕</button>
              </div>
            ))
          )}
        </div>
        <button className="btn btn-ghost btn-small" type="button" onClick={addBreak}>+ Add a break</button>
      </section>

      <section>
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', color: 'var(--ink)' }}>Smart Pacing</h3>
        <label className="switch">
          <span className="sw-text">
            <b>Adaptive block targets</b>
            <span>Recompute each remaining block's target from what's actually left.</span>
          </span>
          <input type="checkbox" checked={form.adaptive} onChange={e => updateForm({ adaptive: e.target.checked })} />
        </label>
        <label className="switch">
          <span className="sw-text">
            <b>Convert surplus into earned break</b>
            <span>Overproduction gets converted into real break minutes at your current rate.</span>
          </span>
          <input type="checkbox" checked={form.earnBreak} onChange={e => updateForm({ earnBreak: e.target.checked })} />
        </label>
      </section>

      <section>
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', color: 'var(--ink)' }}>Keyboard Shortcuts</h3>
        <p className="wiz-sub">Click a box and press a key to change.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="field">
            <label>Toggle Timer</label>
            <input type="text" readOnly value={form.shortcuts?.toggleTimer || ''} 
              onKeyDown={e => captureShortcut(e, 'toggleTimer')} />
          </div>
          <div className="field">
            <label>Stop Timer</label>
            <input type="text" readOnly value={form.shortcuts?.stopTimer || ''} 
              onKeyDown={e => captureShortcut(e, 'stopTimer')} />
          </div>
          <div className="field">
            <label>Take / End Break</label>
            <input type="text" readOnly value={form.shortcuts?.takeBreak || ''} 
              onKeyDown={e => captureShortcut(e, 'takeBreak')} />
          </div>
          <div className="field">
            <label>Focus Active Block</label>
            <input type="text" readOnly value={form.shortcuts?.focusBlock || ''} 
              onKeyDown={e => captureShortcut(e, 'focusBlock')} />
          </div>
          <div className="field">
            <label>Export Data</label>
            <input type="text" readOnly value={form.shortcuts?.exportData || ''} 
              onKeyDown={e => captureShortcut(e, 'exportData')} />
          </div>
          <div className="field">
            <label>Go to Reports</label>
            <input type="text" readOnly value={form.shortcuts?.gotoReports || ''} 
              onKeyDown={e => captureShortcut(e, 'gotoReports')} />
          </div>
          <div className="field">
            <label>Go to Settings</label>
            <input type="text" readOnly value={form.shortcuts?.gotoSettings || ''} 
              onKeyDown={e => captureShortcut(e, 'gotoSettings')} />
          </div>
          <div className="field">
            <label>Go to Tracker</label>
            <input type="text" readOnly value={form.shortcuts?.gotoTracker || ''} 
              onKeyDown={e => captureShortcut(e, 'gotoTracker')} />
          </div>
        </div>
      </section>

      {isAuthed && (
        <section>
          <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', color: 'var(--ink)' }}>Background</h3>
          <div className="field-row single">
            <div className="field">
              <label>Wallpaper image URL</label>
              <input type="url" placeholder="https://example.com/photo.jpg" value={form.wallpaper} onChange={e => updateForm({ wallpaper: e.target.value })} />
            </div>
          </div>
          <div className="btn-row" style={{marginTop:'4px'}}>
            <button className="btn btn-ghost btn-small" type="button" onClick={() => updateForm({ wallpaper: '' })}>Clear wallpaper</button>
          </div>
        </section>
      )}

      {error && <div className="wiz-errors" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      <div className="btn-row" style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', marginTop: '8px' }}>
        <span className="spacer"></span>
        {initialSettings && <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
      </div>
      
      {breakToDelete !== null && createPortal(
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999}}>
          <div className="panel" style={{maxWidth:'300px', textAlign:'center', margin:'20px'}}>
            <h3 style={{marginTop:0, color:'var(--bad)'}}>Delete Break?</h3>
            <p style={{fontSize:'0.9rem', color:'var(--ink-dim)'}}>Are you sure you want to remove this scheduled break?</p>
            <div className="btn-row" style={{justifyContent:'center', marginTop:'20px'}}>
              <button className="btn btn-ghost" onClick={() => setBreakToDelete(null)}>Cancel</button>
              <button className="btn btn-primary" style={{background:'var(--bad)', boxShadow:'0 4px 0 #8c3b29'}} onClick={confirmRemoveBreak}>Yes, Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
