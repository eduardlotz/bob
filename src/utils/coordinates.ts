import * as THREE from "three";

/**
 * Coordinate system utilities for consistent conversion between
 * 3D world space, normalized device coordinates, and screen pixels
 */

/**
 * Convert 3D world position to screen coordinates using camera projection
 * @param worldPosition - Position in 3D world space
 * @param camera - Three.js camera
 * @param renderer - Three.js renderer (for screen dimensions)
 * @returns Screen coordinates in pixels {x, y} or null if behind camera
 */
export function worldToScreen(
  worldPosition: THREE.Vector3,
  camera: THREE.Camera,
  renderer: { domElement: { clientWidth: number; clientHeight: number } }
): { x: number; y: number } | null {
  // Clone position to avoid modifying original
  const vector = worldPosition.clone();

  // Project to normalized device coordinates (-1 to 1)
  vector.project(camera);

  // Check if point is behind the camera
  if (vector.z > 1) return null;

  // Convert to screen coordinates
  const screenX = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
  const screenY = (vector.y * -0.5 + 0.5) * renderer.domElement.clientHeight;

  return { x: screenX, y: screenY };
}

/**
 * Convert screen coordinates to 3D world ray
 * @param screenX - Screen X coordinate in pixels
 * @param screenY - Screen Y coordinate in pixels
 * @param camera - Three.js camera
 * @param renderer - Three.js renderer
 * @returns Raycaster for the screen position
 */
export function screenToWorldRay(
  screenX: number,
  screenY: number,
  camera: THREE.Camera,
  renderer: { domElement: { clientWidth: number; clientHeight: number } }
): THREE.Raycaster {
  // Convert screen coordinates to normalized device coordinates
  const mouse = new THREE.Vector2(
    (screenX / renderer.domElement.clientWidth) * 2 - 1,
    -(screenY / renderer.domElement.clientHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  return raycaster;
}

/**
 * Convert screen coordinates to world position on a plane
 * @param screenX - Screen X coordinate in pixels
 * @param screenY - Screen Y coordinate in pixels
 * @param camera - Three.js camera
 * @param renderer - Three.js renderer
 * @param planeZ - Z coordinate of the target plane (default: 0)
 * @returns World position on the specified plane or null if no intersection
 */
export function screenToWorldPosition(
  screenX: number,
  screenY: number,
  camera: THREE.Camera,
  renderer: { domElement: { clientWidth: number; clientHeight: number } },
  planeZ: number = 0
): THREE.Vector3 | null {
  const raycaster = screenToWorldRay(screenX, screenY, camera, renderer);

  // Create a plane at the specified Z coordinate
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
  const intersection = new THREE.Vector3();

  if (raycaster.ray.intersectPlane(plane, intersection)) {
    return intersection;
  }

  return null;
}

/**
 * Convert normalized mouse coordinates (-1 to 1) to screen pixels
 * @param normalizedX - Normalized X coordinate (-1 to 1)
 * @param normalizedY - Normalized Y coordinate (-1 to 1)
 * @param screenWidth - Screen width in pixels
 * @param screenHeight - Screen height in pixels
 * @returns Screen coordinates in pixels
 */
export function normalizedToScreen(
  normalizedX: number,
  normalizedY: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  return {
    x: (normalizedX * 0.5 + 0.5) * screenWidth,
    y: (normalizedY * -0.5 + 0.5) * screenHeight,
  };
}

/**
 * Convert screen pixels to normalized coordinates (-1 to 1)
 * @param screenX - Screen X coordinate in pixels
 * @param screenY - Screen Y coordinate in pixels
 * @param screenWidth - Screen width in pixels
 * @param screenHeight - Screen height in pixels
 * @returns Normalized coordinates
 */
export function screenToNormalized(
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  return {
    x: (screenX / screenWidth) * 2 - 1,
    y: -((screenY / screenHeight) * 2 - 1),
  };
}

/**
 * Validate that coordinates are within expected bounds
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param bounds - Optional bounds check
 * @returns True if coordinates are valid
 */
export function validateCoordinates(
  x: number,
  y: number,
  bounds?: { minX?: number; maxX?: number; minY?: number; maxY?: number }
): boolean {
  if (!isFinite(x) || !isFinite(y)) return false;

  if (bounds) {
    if (bounds.minX !== undefined && x < bounds.minX) return false;
    if (bounds.maxX !== undefined && x > bounds.maxX) return false;
    if (bounds.minY !== undefined && y < bounds.minY) return false;
    if (bounds.maxY !== undefined && y > bounds.maxY) return false;
  }

  return true;
}

/**
 * Create a safe coordinate object with validation
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param fallback - Fallback coordinates if invalid
 * @returns Safe coordinate object
 */
export function safeCoordinates(
  x: number,
  y: number,
  fallback: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  return validateCoordinates(x, y) ? { x, y } : fallback;
}

/**
 * Linear interpolation between two points
 * @param from - Starting position
 * @param to - Target position
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated position
 */
export function lerpCoordinates(
  from: { x: number; y: number },
  to: { x: number; y: number },
  factor: number
): { x: number; y: number } {
  const clampedFactor = Math.max(0, Math.min(1, factor));
  return {
    x: from.x + (to.x - from.x) * clampedFactor,
    y: from.y + (to.y - from.y) * clampedFactor,
  };
}
