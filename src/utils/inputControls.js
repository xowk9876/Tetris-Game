export function createRepeater(action, timers = globalThis) {
  let delay, interval;
  const stop = () => { timers.clearTimeout(delay); timers.clearInterval(interval); delay = interval = undefined; };
  return {
    start(value) {
      stop(); action(value);
      delay = timers.setTimeout(() => { action(value); interval = timers.setInterval(() => action(value), 33); }, 133);
    },
    stop
  };
}

// A cancelled or unrelated pointer can never complete a gesture.
export function createGesture(action) {
  let active = null;
  function trackHorizontal(gesture, x, y) {
    if (Math.abs(x - gesture.x) > Math.abs(y - gesture.y) * 0.9) {
      gesture.accX += x - gesture.lastX;
      while (Math.abs(gesture.accX) >= 26) {
        action(gesture.accX > 0 ? 'right' : 'left');
        gesture.accX -= Math.sign(gesture.accX) * 26;
        gesture.moved = true;
      }
    }
    gesture.lastX = x;
  }

  return {
    start(id, x, y, time) { if (!active) active = { id, x, y, lastX: x, time, accX: 0, moved: false }; },
    move(id, x, y) {
      if (!active || active.id !== id) return;
      trackHorizontal(active, x, y);
    },
    end(id, x, y, time) {
      if (!active || active.id !== id) return;
      const s = active; active = null;
      trackHorizontal(s, x, y);
      const dx = Math.abs(x - s.x), dy = y - s.y, dt = Math.max(1, time - s.time);
      if (!s.moved && dx < 14 && Math.abs(dy) < 14 && dt < 260) action('rotate');
      else if (!s.moved && Math.abs(dy) > 55 && Math.abs(dy) > dx * 1.2) {
        action(dy < 0 ? 'hold' : dy / dt >= 0.75 ? 'hardDrop' : 'softDrop');
      }
    },
    cancel() { active = null; }
  };
}
