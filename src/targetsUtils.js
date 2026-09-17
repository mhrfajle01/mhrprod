// Add these inside utils.js
export function baseTargets(slots, target) {
  const ws = slots.filter(s => s.type === 'work');
  const totalMin = ws.reduce((sum, s) => sum + s.minutes, 0) || 1;
  return ws.map(s => target * s.minutes / totalMin);
}

export function recomputeTargets(slots, settings, log) {
  const ws = slots.filter(s => s.type === 'work');
  const base = baseTargets(slots, settings.target);
  const blockTargets = [...base];

  if (!settings.adaptive) {
    for (let i = 0; i < ws.length; i++) {
      if (log.actuals[i] === null || log.actuals[i] === undefined) {
        blockTargets[i] = base[i];
      }
    }
    return blockTargets;
  }

  let produced = 0;
  const unlogged = [];
  for (let j = 0; j < ws.length; j++) {
    const a = log.actuals[j];
    if (a === null || a === undefined) unlogged.push(j);
    else produced += Number(a) || 0;
  }

  const pool = Math.max(0, settings.target - produced);
  const remainingMin = unlogged.reduce((sum, i) => sum + ws[i].minutes, 0) || 1;
  
  unlogged.forEach(i => {
    blockTargets[i] = pool * ws[i].minutes / remainingMin;
  });

  return blockTargets;
}
