// Storage may be unavailable in private browsing, embedded pages or a full quota.
export function readPreference(key, fallback, storage = () => globalThis.localStorage) {
  try { return storage()?.getItem(key) ?? fallback; } catch { return fallback; }
}

export function savePreference(key, value, storage = () => globalThis.localStorage) {
  try { storage()?.setItem(key, String(value)); return true; } catch { return false; }
}

export function readBestScore(storage) {
  const raw = readPreference('tetrisBestScore', '0', storage);
  const value = Number(raw);
  return /^\d+$/.test(raw) && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function readAudioEnabled(storage) {
  return readPreference('tetrisAudioEnabled', 'true', storage) !== 'false';
}
