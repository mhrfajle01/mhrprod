import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function Reports({ user, onEdit }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users', user.uid, 'logs'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort descending by date (using id as fallback since id is the date string)
        data.sort((a, b) => {
          const dateA = a.date || a.id;
          const dateB = b.date || b.id;
          return dateB.localeCompare(dateA);
        });
        
        setLogs(data);
      } catch (e) {
        console.error("Error fetching logs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  const filteredLogs = logs.filter(log => {
    const logDate = log.date || log.id;
    if (filterDateFrom && logDate < filterDateFrom) return false;
    if (filterDateTo && logDate > filterDateTo) return false;
    return true;
  });

  const exportCSV = () => {
    let csv = 'Date,Total Target,Total Produced,Defects/Wastage,Status\n';
    filteredLogs.forEach(log => {
      const target = log.blockTargets ? log.blockTargets.reduce((a, b) => a + b, 0) : 0;
      const produced = log.actuals ? log.actuals.reduce((a, b) => a + Number(b || 0), 0) : 0;
      const defects = log.defects || 0;
      const status = log.timer?.status || 'stopped';
      const logDate = log.date || log.id;
      csv += `${logDate},${target},${produced},${defects},${status}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLocalDateString = (d) => {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const setToday = () => {
    const todayStr = getLocalDateString(new Date());
    setFilterDateFrom(todayStr);
    setFilterDateTo(todayStr);
  };

  const setLast7Days = () => {
    const d = new Date();
    const to = getLocalDateString(d);
    d.setDate(d.getDate() - 6); // past 7 days including today
    const from = getLocalDateString(d);
    setFilterDateFrom(from);
    setFilterDateTo(to);
  };

  if (loading) return <div className="panel"><div className="panel-title">Loading reports...</div></div>;

  // Calculate summaries for the filtered view
  const summaryTotalTarget = filteredLogs.reduce((sum, log) => {
    const tgt = log.blockTargets ? log.blockTargets.reduce((a, b) => a + b, 0) : 0;
    return sum + tgt;
  }, 0);
  
  const summaryTotalProduced = filteredLogs.reduce((sum, log) => {
    const prod = log.actuals ? log.actuals.reduce((a, b) => a + Number(b || 0), 0) : 0;
    return sum + prod;
  }, 0);

  return (
    <div className="panel" id="reportsPanel">
      <div className="panel-title">Production Reports</div>
      
      <div className="field-row">
        <div className="field">
          <label>From Date</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>To Date</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={setToday}>Today</button>
        <button className="btn btn-ghost" onClick={setLast7Days}>Last 7 Days</button>
        <button className="btn btn-ghost" onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}>Clear Filters</button>
        <div style={{ flexGrow: 1 }} />
        <button className="btn btn-primary" onClick={exportCSV}>Export CSV</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--panel-2)', padding: '12px 16px', borderRadius: '4px', flex: 1, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-dim)', marginBottom: '4px' }}>Filtered Target</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{Math.round(summaryTotalTarget)}</div>
        </div>
        <div style={{ background: 'var(--panel-2)', padding: '12px 16px', borderRadius: '4px', flex: 1, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-dim)', marginBottom: '4px' }}>Filtered Produced</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: summaryTotalProduced >= summaryTotalTarget && summaryTotalTarget > 0 ? 'var(--good)' : 'inherit' }}>
            {summaryTotalProduced}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--panel-2)', borderRadius: '4px', padding: '1px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--panel)' }}>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Target</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Produced</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const target = log.blockTargets ? log.blockTargets.reduce((a, b) => a + b, 0) : 0;
              const produced = log.actuals ? log.actuals.reduce((a, b) => a + Number(b || 0), 0) : 0;
              const logDate = log.date || log.id;
              
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--line)', background: 'var(--panel)' }}>
                  <td style={{ padding: '10px 12px' }}>{logDate}</td>
                  <td style={{ padding: '10px 12px' }}>{Math.round(target)}</td>
                  <td style={{ padding: '10px 12px' }}>{produced}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                      onClick={() => onEdit(logDate)}>
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredLogs.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', background: 'var(--panel)' }}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
