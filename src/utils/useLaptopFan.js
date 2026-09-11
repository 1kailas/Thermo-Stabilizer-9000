import { useState, useEffect } from 'react';
import { laptopFanClient } from './laptopFanClient';

export function useLaptopFan() {
  const [fanState, setFanState] = useState(laptopFanClient.state);

  useEffect(() => {
    const unsubscribe = laptopFanClient.subscribe((state) => {
      setFanState(state);
    });
    return unsubscribe;
  }, []);

  return {
    ...fanState,
    syncSpeed: (speed) => laptopFanClient.syncSpeed(speed),
    setAuto: () => laptopFanClient.setAuto(),
    setSyncEnabled: (enabled) => laptopFanClient.setSyncEnabled(enabled),
    refresh: () => laptopFanClient.fetchStatus()
  };
}
