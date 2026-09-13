const DEVICE_ID_STORAGE_KEY = 'rkpi.deviceId';

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);

    return deviceId;
  } catch {
    return crypto.randomUUID();
  }
}
