let _tauriAvailable = null;

const checkTauri = async () => {
  try {
    if (window.__TAURI__ && window.__TAURI__.core) {
      await window.__TAURI__.core.invoke('ping');
      return true;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('ping');
    return true;
  } catch {
    return false;
  }
};

export const isTauriAvailable = async () => {
  if (_tauriAvailable === null) {
    _tauriAvailable = await checkTauri();
  }
  return _tauriAvailable;
};

export const resetDetection = () => { _tauriAvailable = null; };

export const FORCE_ENGINE = null;
