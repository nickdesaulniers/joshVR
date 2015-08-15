var renderer, scene, camera, canvas, vrEffect;
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
  camera.position.z = 5;
  camera.position.y = 1;
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(canvas.width, canvas.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  vrEffect = new THREE.VREffect(renderer, alert);

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
    vrEffect.render(scene, camera);
  } else {
    renderer.render(scene, camera);
  }
};

function destroy () { if (canvas) canvas.remove(); };
function isFullscreen () { return !!document.mozFullScreenElement; };

function enterFullscreen () {
  vrEffect.setFullScreen(true);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  canvas.mozRequestPointerLock();
  safeToRenderStereo = true;
};

function exitFullscreen () {
  if (!isFullscreen()) {
    fixUpCanvas();
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    safeToRenderStereo = false;
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

