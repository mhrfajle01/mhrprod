import React, { useState } from 'react';
import { parseTimeToMinutes, shiftSpanMinutes } from '../../utils';

const WIZ_STEPS = [
  { title: 'Daily target', key: 'target' },
  { title: 'Unit', key: 'unit' },
  { title: 'Shift hours', key: 'hours' },
  { title: 'Blocks', key: 'blocks' },
  { title: 'Breaks', key: 'breaks' },
  { title: 'Smart pacing', key: 'pacing' },
  { title: 'Background', key: 'bg' }
];

export default function Wizard({ initialSettings, updateSettings, isAuthed, onCancel }) {
  const visibleSteps = isAuthed ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5];
  const [stepIndex, setStepIndex] = useState(visibleSteps[0]);
  const [error, setError] = useState('');

  const [form, setForm] = useState(initialSettings || {
    target: '',
    unit: '',
    start: '08:00',
    end: '16:00',
    blockMinutes: 60,
    adaptive: true,
    earnBreak: true,
    breaks: [],
    wallpaper: ''
  });

  const updateForm = (updates) => setForm(f => ({ ...f, ...updates }));

  const validateStep = (idx) => {
    if (idx === 0 && !(Number(form.target) > 0)) return 'Enter a target greater than zero.';
    if (idx === 1 && !form.unit.trim()) return 'Enter a unit, like pcs or doc.';
    if (idx === 2) {
      const sM = parseTimeToMinutes(form.start);
      const eM = parseTimeToMinutes(form.end);
      if (sM === null) return 'Set a start time.';
      if (eM === null) return 'Set an end time.';
      if (sM === eM) return 'Start and end can\'t be the same time.';
    }
    if (idx === 4) {
      const sM = parseTimeToMinutes(form.start);
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
    }
    if (idx === 6 && form.wallpaper && !/^https?:\/\//i.test(form.wallpaper.trim())) {
      return 'Enter a full URL starting with http:// or https://';
    }
    return '';
  };

  const handleNext = async () => {
    const err = validateStep(stepIndex);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    
    const pos = visibleSteps.indexOf(stepIndex);
    if (pos < visibleSteps.length - 1) {
      setStepIndex(visibleSteps[pos + 1]);
    } else {
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
    }
  };

  const handlePrev = () => {
    const pos = visibleSteps.indexOf(stepIndex);
    if (pos > 0) setStepIndex(visibleSteps[pos - 1]);
  };

  const addBreak = () => {
    updateForm({ breaks: [...form.breaks, { start: '12:00', minutes: 30, label: 'Break' }] });
  };

  const removeBreak = (i) => {
    updateForm({ breaks: form.breaks.filter((_, idx) => idx !== i) });
  };

  const updateBreak = (i, field, val) => {
    const newBreaks = [...form.breaks];
    newBreaks[i] = { ...newBreaks[i], [field]: val };
    updateForm({ breaks: newBreaks });
  };

  const pos = visibleSteps.indexOf(stepIndex);
  
  return (
    <div className="panel" id="wizardPanel">
      <div className="wiz-head">
        <span className="wiz-title">{WIZ_STEPS[stepIndex].title}</span>
        <span className="wiz-step-label">Step {pos + 1} of {visibleSteps.length}</span>
      </div>
      <div className="wiz-dots">
        {visibleSteps.map((s, i) => (
          <div key={s} className={`wiz-dot ${i === pos ? 'active' : i < pos ? 'done' : ''}`}></div>
        ))}
      </div>

      {stepIndex === 0 && (
        <div className="wiz-step">
          <p className="wiz-sub">How many units are you aiming for today?</p>
          <div className="field-row single">
            <div className="field">
              <label>Target production</label>
              <input type="number" min="1" step="1" placeholder="e.g. 2000" 
                value={form.target} onChange={e => updateForm({ target: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="wiz-step">
          <p className="wiz-sub">What are you counting? Keep it short — it shows up in the report.</p>
          <div className="field-row single">
            <div className="field">
              <label>Unit</label>
              <input type="text" maxLength="12" placeholder="pcs, doc, box…" 
                value={form.unit} onChange={e => updateForm({ unit: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {stepIndex === 2 && (
        <div className="wiz-step">
          <p className="wiz-sub">The shift window. Overnight shifts are fine — end time can be earlier than start.</p>
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
        </div>
      )}

      {stepIndex === 3 && (
        <div className="wiz-step">
          <p className="wiz-sub">Smaller blocks give you faster feedback. 60 minutes suits most shifts.</p>
          <div className="field-row single">
            <div className="field">
              <label>Track in blocks of</label>
              <select value={form.blockMinutes} onChange={e => updateForm({ blockMinutes: Number(e.target.value) })}>
                <option value={60}>60 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 4 && (
        <div className="wiz-step">
          <p className="wiz-sub">Scheduled breaks are cut out of the target math entirely — they show as grey slots, not production slots.</p>
          <div id="breakList">
            {form.breaks.length === 0 ? (
              <p className="history-empty" style={{marginBottom:'10px'}}>No scheduled breaks yet.</p>
            ) : (
              form.breaks.map((brk, i) => (
                <div key={i} className="break-edit">
                  <input type="time" value={brk.start} onChange={e => updateBreak(i, 'start', e.target.value)} />
                  <input type="number" min="5" max="240" step="5" placeholder="min" value={brk.minutes} onChange={e => updateBreak(i, 'minutes', Number(e.target.value))} />
                  <input type="text" maxLength="16" placeholder="Lunch" value={brk.label} onChange={e => updateBreak(i, 'label', e.target.value)} />
                  <button className="btn btn-ghost btn-small" type="button" onClick={() => removeBreak(i)}>✕</button>
                </div>
              ))
            )}
          </div>
          <button className="btn btn-ghost btn-small" type="button" onClick={addBreak}>+ Add a break</button>
        </div>
      )}

      {stepIndex === 5 && (
        <div className="wiz-step">
          <p className="wiz-sub">Optional pacing helpers. You can change these any time.</p>
          <label className="switch">
            <span className="sw-text">
              <b>Adaptive block targets</b>
              <span>Recompute each remaining block's target from what's actually left, so an overshoot buys breathing room later.</span>
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
        </div>
      )}

      {stepIndex === 6 && (
        <div className="wiz-step">
          <p className="wiz-sub">Paste a direct image link to use as your background. Leave it empty for the plain look.</p>
          <div className="field-row single">
            <div className="field">
              <label>Wallpaper image URL</label>
              <input type="url" placeholder="https://example.com/photo.jpg" value={form.wallpaper} onChange={e => updateForm({ wallpaper: e.target.value })} />
            </div>
          </div>
          <div className="btn-row" style={{marginTop:'2px'}}>
            <button className="btn btn-ghost btn-small" type="button" onClick={() => updateForm({ wallpaper: '' })}>Clear wallpaper</button>
          </div>
        </div>
      )}

      {error && <div className="wiz-errors" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      <div className="btn-row wiz-nav">
        <button className={`btn btn-ghost ${pos === 0 ? 'hidden' : ''}`} onClick={handlePrev}>Back</button>
        <span className="spacer"></span>
        {initialSettings && <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-primary" onClick={handleNext}>
          {pos === visibleSteps.length - 1 ? 'Save shift' : 'Next'}
        </button>
      </div>
    </div>
  );
}
