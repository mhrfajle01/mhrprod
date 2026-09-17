import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function useHisabData(user, targetDate = null) {
  const [settings, setSettings] = useState(null);
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLog(null);
      setLoading(false);
      return;
    }

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'main');
    const logDate = targetDate || todayKey();
    const logRef = doc(db, 'users', user.uid, 'logs', logDate);

    let unsubSettings = () => {};
    let unsubLog = () => {};

    // Initial load
    const loadData = async () => {
      try {
        const [sSnap, lSnap] = await Promise.all([getDoc(settingsRef), getDoc(logRef)]);
        if (sSnap.exists()) {
          setSettings(sSnap.data());
        }
        if (lSnap.exists()) {
          setLog(lSnap.data());
        }
        
        // Listeners for realtime updates across devices
        unsubSettings = onSnapshot(settingsRef, (doc) => {
          if (doc.exists()) setSettings(doc.data());
        });
        unsubLog = onSnapshot(logRef, (doc) => {
          if (doc.exists()) setLog(doc.data());
        });
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      unsubSettings();
      unsubLog();
    };
  }, [user, targetDate]);

  const updateSettings = async (newSettings) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'settings', 'main');
    await setDoc(ref, newSettings, { merge: true });
  };

  const updateLog = async (newLog) => {
    if (!user) return;
    const key = newLog.date || targetDate || todayKey();
    if (!newLog.date) {
      newLog.date = key;
    }
    const ref = doc(db, 'users', user.uid, 'logs', key);
    await setDoc(ref, newLog, { merge: true });
  };

  return { settings, log, updateSettings, updateLog, loading };
}
