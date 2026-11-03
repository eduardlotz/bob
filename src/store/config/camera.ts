// Shared scene framing. Keep this module independent of components and stores.
export const CAMERA_Y_POSITION = 1;
export const CAMERA_HEIGHT = 2;
export const CAMERA_FOLLOW_OFFSET = 5;
export const VISIBLE_OPTIONS_CAMERA_ZOOM = 8;
export const HIDDEN_OPTIONS_CAMERA_ZOOM = 4;
export const FUNNY_FISHEYE_ZOOM = 1.15;
export const CAMERA_ZOOM_ON_TAP = -1.5;

export const HEAD_CAMERA_POSES = {
  default: {
    position: [0, CAMERA_HEIGHT, HIDDEN_OPTIONS_CAMERA_ZOOM] as [number, number, number],
    target: [0, CAMERA_Y_POSITION, 0] as [number, number, number],
  },
  navigation: {
    position: [0, CAMERA_HEIGHT, VISIBLE_OPTIONS_CAMERA_ZOOM] as [number, number, number],
    target: [0, CAMERA_Y_POSITION, 0] as [number, number, number],
  },
};

// Keep the loading distance, with the default height and viewing angle.
export const LOADING_CAMERA_POSE = {
  position: [0, CAMERA_HEIGHT, 6] as [number, number, number],
  target: [0, CAMERA_HEIGHT - (CAMERA_HEIGHT - CAMERA_Y_POSITION) * 6 / HIDDEN_OPTIONS_CAMERA_ZOOM, 0] as [number, number, number],
};

// Used by both form editing and individual shop-item previews.
export const BOB_CAMERA_POSE = {
  position: [0, CAMERA_HEIGHT - 1.5, VISIBLE_OPTIONS_CAMERA_ZOOM - 2] as [number, number, number],
  target: [0, CAMERA_Y_POSITION - 1.5, 0] as [number, number, number],
};

// The photo window is bottom-anchored inside the phone, rather than centered
// on the full scene canvas. Keep its dimensions shared with the app's CSS.
export const PHOTO_VIEWFINDER = {
  maxWidth: 340,
  maxHeight: 454,
  viewportPadding: 48,
  reservedHeight: 172,
  bottomInset: 98,
  subjectY: 0.62,
} as const;

export const PHOTO_CAMERA_POSE = {
  position: [0, 0.3, 5] as [number, number, number],
  target: [0, 1.6, 0] as [number, number, number],
};

// Apply after composing the crop, so the upward move and downward rotation
// can shift the framing naturally instead of pinning Bob to the same pixel.
export const PHOTO_CAMERA_ADJUSTMENT = {
  lift: 0.4,
  tiltDown: Math.PI / 30,
} as const;
