export async function requestMotionPermission() {
  if (typeof (DeviceMotionEvent as any)?.requestPermission === "function") {
    const response = await (DeviceMotionEvent as any)?.requestPermission();
    return response === "granted";
  }
  return true; // Non-iOS or not needed
}
