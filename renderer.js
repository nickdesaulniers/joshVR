var debounce = require('debounce');
var renderer, scene, camera, canvas, vrEffect, vrControls;
var cameraPosition = new THREE.Vector3(0, 1, 5);

function initScene () {
  initCanvas();
  scene = new THREE.Scene();
  initCamera(canvas);
  initRenderer(canvas);
  initVR(renderer, camera);
  initLights(scene);
  initFloor(scene);
  return scene;
};

function initCanvas () {
  canvas = document.createElement('canvas');
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth * 0.5;
  canvas.addEventListener('click', enterFullscreen);
  document.addEventListener('mozfullscreenchange', exitFullscreen);
  window.addEventListener('resize', debounce(handleResize, 100));
  document.getElementById('rightColumn').appendChild(canvas);
};

function initCamera (canvas) {
  camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  resetCamera(camera);
};

function initRenderer (canvas) {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(canvas.width, canvas.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x9DEBE9);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClearDepth = false;
  renderer.autoClearStencil = false;
  renderer.sortObjects = false;
  renderer.autoUpdateObjects = false;
};

function initVR (renderer, camera) {
  vrEffect = new THREE.VREffect(renderer, alert);
  vrControls = new THREE.VRControls(camera);
};

function initLights (scene) {
  scene.add(new THREE.AmbientLight(0xBBBBBB));
  var light = new THREE.SpotLight(0xFFFFFF, 1, 100);
  light.position.set(50, 50, 50);
  light.castShadow = true;
  scene.add(light);
};

function initFloor (scene) {
  var geometry = new THREE.CircleGeometry(100, 16);
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  var texture = THREE.ImageUtils.loadTexture('checkerboard.png');
  texture.repeat.set(100, 100);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  var material = new THREE.MeshBasicMaterial({
    map: texture,
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
};

function addToScene (scene, node) {
  var geometry;
  if (node.tagName === 'group') {
    return createGroup(scene, node);
  } else if (node.tagName === 'cube') {
    geometry = new THREE.BoxGeometry(1, 1, 1);
  } else if (node.tagName === 'sphere') {
    geometry = new THREE.SphereBufferGeometry(0.5);
  } else if (node.tagName == 'cylinder'){
    geometry = new THREE.CylinderGeometry(1, 1, 1, 32);
  } else if (node.tagName == 'cone'){
    geometry = new THREE.CylinderGeometry(0, 1, 2, 32);
  } else if (node.tagName === 'scene') {
    return;
  } else {
    throw new Error('unrecognized type');
  }
  var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
  var mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.node = node;
  scene.add(mesh);
  return mesh;
};

function createGroup (scene, node) {
  var group = new THREE.Group();
  group.node = node;
  scene.add(group);
  return group;
};

var safeToRenderStereo = false;
function render () {
  if (safeToRenderStereo) {
    vrControls.update();
    adjustCamera(camera);
    vrEffect.render(scene, camera);
  } else {
    renderer.render(scene, camera);
  }
};

function destroy () { if (canvas) canvas.remove(); };
function isFullscreen () { return !!document.mozFullScreenElement; };

function enterFullscreen () {
  if (isFullscreen()) return;
  vrEffect.setFullScreen(true);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  canvas.mozRequestPointerLock();
  safeToRenderStereo = true;
};

function exitFullscreen () {
  if (isFullscreen()) return;
  handleResize();
  safeToRenderStereo = false;
};

function handleResize() {
  fixUpCanvas();
  resetCamera(camera);
}

function resetCamera (camera) {
  camera.position.copy(cameraPosition);
  camera.quaternion.set(0, 0, 0, 1);
  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();
};

// This will adjust the camera back since VRControls will copy position
// data from the Position Sensor. This adjustment is not needed if the user
// entered fullscreen without info from the Position Sensor.
function adjustCamera (camera) {
  if (camera.position.z < 4.0) {
    camera.position.add(cameraPosition);
  }
};

// TODO: dirty hack, remove
function fixUpCanvas () {
  var rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  renderer.setSize(canvas.width, canvas.height);
};

module.exports = {
  initScene: initScene,
  addToScene: addToScene,
  render: render,
  destroy: destroy,
  fixUpCanvas: fixUpCanvas,
};

