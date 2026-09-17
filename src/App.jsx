import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useHisabData } from './hooks/useHisabData';
import { useShortcuts } from './hooks/useShortcuts';
import Auth from './components/auth/Auth';
import Timer from './components/timer/Timer';
import Readout from './components/readout/Readout';
import Blocks from './components/blocks/Blocks';
import Export from './features/export/Export';
import Reports from './features/reports/Reports';

import Wizard from './components/wizard/Wizard';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const [viewMode, setViewMode] = useState('tracker'); // 'tracker' | 'reports'
  const [targetDate, setTargetDate] = useState(null);

  const { settings, log, updateSettings, updateLog, loading: dataLoading } = useHisabData(user, targetDate);

  useShortcuts(settings);

  if (authLoading || (user && dataLoading)) {
    return <div className="wrap"><div className="head"><h1>Loading...</h1></div></div>;
  }

  return (
    <div className="wrap">
      <div className="head">
        <h1>Production Hisab</h1>
        <div className="head-tools">
          <div className="clock">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          {user ? (
            <button className="btn btn-ghost btn-small unlocked" onClick={() => signOut(auth)}>Sign out</button>
          ) : (
            <button className="btn btn-ghost btn-small locked" onClick={() => setShowLogin(true)}>Log in</button>
          )}
        </div>
      </div>

      {showLogin && <Auth onClose={() => setShowLogin(false)} />}

      {user ? (
        !settings ? (
          <Wizard updateSettings={updateSettings} isAuthed={!!user} />
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                id="btnNavTracker"
                className={`btn ${viewMode === 'tracker' && !targetDate ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => { setViewMode('tracker'); setTargetDate(null); }}>
                Today's Shift
              </button>
              <button 
                id="btnNavReports"
                className={`btn ${viewMode === 'reports' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setViewMode('reports')}>
                Reports
              </button>
              <button 
                id="btnNavSettings"
                className={`btn ${viewMode === 'settings' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setViewMode('settings')}>
                Settings
              </button>
            </div>

            {targetDate && viewMode === 'tracker' && (
              <div className="panel" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
                <strong>Editing Past Shift: {targetDate}</strong>
                <button 
                  className="btn btn-ghost btn-small" 
                  style={{ marginLeft: '12px', background: 'rgba(0,0,0,0.1)' }}
                  onClick={() => setViewMode('reports')}>
                  Back to Reports
                </button>
              </div>
            )}

            {viewMode === 'settings' ? (
              <Wizard 
                initialSettings={settings} 
                updateSettings={async (s) => { await updateSettings(s); setViewMode('tracker'); }} 
                isAuthed={!!user} 
                onCancel={() => setViewMode('tracker')} 
              />
            ) : viewMode === 'tracker' ? (
              <>
                {!targetDate && <Timer settings={settings} log={log} updateLog={updateLog} />}
                <Readout settings={settings} log={log} />
                <Blocks settings={settings} log={log} updateLog={updateLog} isEditing={!!targetDate} />
                {!targetDate && <Export log={log} updateLog={updateLog} />}
              </>
            ) : (
              <Reports user={user} onEdit={(dateStr) => {
                setTargetDate(dateStr);
                setViewMode('tracker');
              }} />
            )}
          </>
        )
      ) : (
        <div className="panel">
          <p className="panel-title">Please Log In</p>
          <p className="hint">You must be logged in to view or edit the production tracker.</p>
        </div>
      )}
    </div>
  );
}

export default App;
