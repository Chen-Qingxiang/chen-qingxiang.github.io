export function applyNorthLock(C, scene, locked) {
  const controller=scene.screenSpaceCameraController;
  // Globe pan still uses Cesium's constrained polar-axis rotation. Free tilt
  // also changes heading, so disable that gesture at its source (including
  // pinch twist). The existing ◩ control can still tilt about a north-facing
  // target. No per-frame camera correction or moveEnd snapping is installed.
  scene.camera.constrainedAxis=C.Cartesian3.UNIT_Z;
  controller.enableRotate=scene.mode===C.SceneMode.SCENE2D ? !locked : true;
  controller.enableTilt=!locked;
  controller.enableLook=!locked;
}
