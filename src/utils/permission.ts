interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export async function requestMotionPermission() {
  const requestPermission = (
    DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
  ).requestPermission;
  const iOS = typeof requestPermission === "function";
  if (iOS) {
    const response = await requestPermission();
    if (response === "granted") {
      return true;
    } else return false;
  }
  return true;
}
