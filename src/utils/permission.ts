export async function requestMotionPermission() {
  if (typeof DeviceMotionEvent?.requestPermission === "function") {
    const response = await DeviceMotionEvent.requestPermission();
    return response === "granted";
  }
  return true; // Non-iOS or not needed
}
