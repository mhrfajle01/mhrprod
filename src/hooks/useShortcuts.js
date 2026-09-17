import { useEffect } from 'react';

export function useShortcuts(settings) {
  useEffect(() => {
    if (!settings) return;
    
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

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      const shortcuts = { ...defaultShortcuts, ...(settings.shortcuts || {}) };
      
      let str = '';
      if (e.ctrlKey || e.metaKey) str += 'Ctrl+';
      if (e.altKey) str += 'Alt+';
      if (e.shiftKey) str += 'Shift+';
      
      let keyName = e.key === ' ' ? 'Space' : e.key;
      if (keyName.length === 1) keyName = keyName.toUpperCase();
      
      const pressedShortcut = str + keyName;
      
      if (pressedShortcut === shortcuts.toggleTimer) {
        e.preventDefault();
        const start = document.getElementById('btnStart');
        const pause = document.getElementById('btnPause');
        const resume = document.getElementById('btnResume');
        if (start && !start.disabled) start.click();
        else if (pause && !pause.disabled) pause.click();
        else if (resume && !resume.disabled) resume.click();
      } else if (pressedShortcut === shortcuts.stopTimer) {
        e.preventDefault();
        const stop = document.getElementById('btnStop');
        if (stop && !stop.disabled) stop.click();
      } else if (pressedShortcut === shortcuts.takeBreak) {
        e.preventDefault();
        const brk = document.getElementById('btnBreak');
        if (brk && !brk.disabled) brk.click();
      } else if (pressedShortcut === shortcuts.focusBlock) {
        e.preventDefault();
        const input = document.getElementById('activeBlockInput');
        if (input) {
          input.focus();
        }
      } else if (pressedShortcut === shortcuts.exportData) {
        e.preventDefault();
        const exp = document.getElementById('btnExport');
        if (exp) exp.click();
      } else if (pressedShortcut === shortcuts.gotoReports) {
        e.preventDefault();
        const rep = document.getElementById('btnNavReports');
        if (rep) rep.click();
      } else if (pressedShortcut === shortcuts.gotoSettings) {
        e.preventDefault();
        const set = document.getElementById('btnNavSettings');
        if (set) set.click();
      } else if (pressedShortcut === shortcuts.gotoTracker) {
        e.preventDefault();
        const trk = document.getElementById('btnNavTracker');
        if (trk) trk.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings]);
}
