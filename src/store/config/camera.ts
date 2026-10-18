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

// Used by both form editing and individual shop-item previews.
export const BOB_CAMERA_POSE = {
  position: [0, CAMERA_HEIGHT - 1.5, VISIBLE_OPTIONS_CAMERA_ZOOM - 2] as [number, number, number],
  target: [0, CAMERA_Y_POSITION - 1.5, 0] as [number, number, number],
};
