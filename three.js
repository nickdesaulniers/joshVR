var renderer, scene, camera, canvas, vrEffect, vrControls;
var cameraPosition = new THREE.Vector3(0, 1, 5);
// https://github.com/mrdoob/three.js/blob/master/examples/canvas_geometry_hierarchy.html#L57-L73
function initScene () {
  canvas = document.createElement('canvas');
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth * 0.5;
  canvas.style.verticalAlign = 'top';
  canvas.addEventListener('click', enterFullscreen);
  document.addEventListener('mozfullscreenchange', exitFullscreen);
  document.getElementById('rightColumn').appendChild(canvas);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  resetCamera(camera);
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(canvas.width, canvas.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  vrEffect = new THREE.VREffect(renderer, alert);
  vrControls = new THREE.VRControls(camera);

  scene.add(new THREE.AmbientLight(0xBBBBBB));
  var light = new THREE.PointLight(0xFFFFFF, 1, 100);
  light.position.set(50, 50, 50);
  scene.add(light);

  // Floor
  var floor = new THREE.CircleGeometry(100, 16);
  floor.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  var texture = THREE.ImageUtils.loadTexture('checkerboard.png');
  texture.repeat.set(100, 100);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  var material = new THREE.MeshBasicMaterial({
    map: texture,
  });
  var floorObj = new THREE.Mesh(floor, material);
  //floorObj.receiveShadow = true;
  scene.add(floorObj);
  return scene;
};

function addToScene (scene, node) {
  var geometry;
  if (node.tagName === 'cube') {
    geometry = new THREE.BoxGeometry(1, 1, 1);
  } else if (node.tagName === 'sphere') {
    geometry = new THREE.SphereGeometry(0.5);
  } else {
    throw new Error('unrecognized type');
  }
  var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
  var mesh = new THREE.Mesh(geometry, material);
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
  fixUpCanvas();
  resetCamera(camera);
  safeToRenderStereo = false;
};

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
  createGroup: createGroup,
  render: render,
  destroy: destroy,
  fixUpCanvas: fixUpCanvas,
};

