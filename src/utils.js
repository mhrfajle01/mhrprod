export function parseTimeToMinutes(t){
  if(!t) return null;
  var parts = String(t).split(':');
  if(parts.length !== 2) return null;
  var h = parseInt(parts[0],10), m = parseInt(parts[1],10);
  if(isNaN(h) || isNaN(m)) return null;
  return h*60+m;
}

export function minutesToLabel(mins){
  var m = ((Math.round(mins) % 1440) + 1440) % 1440;
  var h = Math.floor(m/60);
  var mm = m % 60;
  var suffix = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12; if(h12 === 0) h12 = 12;
  return h12 + ':' + String(mm).padStart(2,'0') + ' ' + suffix;
}

export function shiftSpanMinutes(s){
  var a = parseTimeToMinutes(s.start), b = parseTimeToMinutes(s.end);
  var span = (b - a + 1440) % 1440;
  return span === 0 ? 1440 : span;
}

export function buildTimeline(s){
  var startMin = parseTimeToMinutes(s.start);
  var span = shiftSpanMinutes(s);
  var blockLen = s.blockMinutes === 30 ? 30 : 60;

  var raw = (s.breaks || []).map(function(b){
    return {
      offset: (((parseTimeToMinutes(b.start) - startMin) % 1440) + 1440) % 1440,
      minutes: Math.max(0, Math.round(Number(b.minutes) || 0)),
      label: (b.label || 'Break').trim() || 'Break'
    };
  }).filter(function(b){ return b.minutes > 0 && b.offset > 0 && b.offset < span; })
    .sort(function(a,b){ return a.offset - b.offset; });

  var segs = [];
  var cursor = 0;
  raw.forEach(function(b){
    var from = Math.max(b.offset, cursor);
    var to = Math.min(from + b.minutes, span);
    if(to <= from) return;
    if(from > cursor) segs.push({ type:'work', from:cursor, to:from });
    segs.push({ type:'break', from:from, to:to, label:b.label });
    cursor = to;
  });
  if(cursor < span) segs.push({ type:'work', from:cursor, to:span });

  var slots = [];
  var workIndex = 0;

  segs.forEach(function(seg){
    if(seg.type === 'break'){
      slots.push({
        type:'break', label: seg.label,
        offset: seg.from, minutes: seg.to - seg.from,
        startMin: startMin + seg.from, endMin: startMin + seg.to
      });
      return;
    }
    var chunks = [];
    var cur = seg.from;
    while(cur < seg.to){
      var next = Math.min(cur + blockLen, seg.to);
      chunks.push([cur, next]);
      cur = next;
    }
    if(chunks.length >= 2){
      var last = chunks[chunks.length-1];
      if(last[1] - last[0] < 20){
        chunks[chunks.length-2][1] = last[1];
        chunks.pop();
      }
    }
    chunks.forEach(function(c){
      slots.push({
        type:'work', workIndex: workIndex++,
        offset: c[0], minutes: c[1] - c[0],
        startMin: startMin + c[0], endMin: startMin + c[1]
      });
    });
  });

  return slots;
}

export function formatNum(v){
  if(v === null || v === undefined || v === '') return '';
  var r = Math.round(Number(v) * 100) / 100;
  if(Number.isNaN(r)) return '';
  return r.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function fmtDuration(ms){
  var total = Math.max(0, Math.floor(ms/1000));
  var h = Math.floor(total/3600);
  var m = Math.floor((total%3600)/60);
  var s = total%60;
  return h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

export function fmtMinShort(minutes){
  var m = Math.max(0, Math.round(minutes));
  if(m < 60) return m + ' min';
  var h = Math.floor(m/60);
  var r = m % 60;
  return h + 'h' + (r ? ' ' + String(r).padStart(2,'0') + 'm' : '');
}
