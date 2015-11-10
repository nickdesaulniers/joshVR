var debounce = require('debounce');
var parse = require('./parser');
var meshHelper = require('./mesh_helper');

var renderer, scene, camera, canvas, vrEffect, vrControls;
var cameraPosition = new THREE.Vector3(0, 1, 5);
var portals = [];

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
  renderer.setClearColor(0x9DEBE9, 0);
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

function determineGeometry (tagName) {
  if (tagName === 'cube') {
    return new THREE.BoxGeometry(1, 1, 1);
  } else if (tagName === 'sphere') {
    return new THREE.SphereBufferGeometry(0.5);
  } else if (tagName === 'cylinder'){
    return new THREE.CylinderGeometry(1, 1, 1, 32);
  } else if (tagName === 'cone'){
    return new THREE.CylinderGeometry(0, 1, 2, 32);
  } else if (tagName === 'pyramid') {
    return new THREE.CylinderGeometry(0, 1, 1, 4, 1);
  } else if (tagName === 'portal') {
    return new THREE.CircleGeometry(2, 36, 0, 2 * Math.PI);
  } else {
    throw new Error('unrecognized type');
  }
};

function PortalInfo (scene, camera, texture) {
  this.scene = scene;
  this.camera = camera;
  this.texture = texture;
};

function buildPortal (src) {
  if (!src) return;
  var rtTexture = new THREE.WebGLRenderTarget(
    canvas.width, canvas.height,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
    }
  );

  var portalScene = new THREE.Scene();
  initLights(portalScene);
  initFloor(portalScene);
  var portalCamera = new THREE.PerspectiveCamera(75,
    canvas.width / canvas.height, 0.1, 1000);
  portalCamera.position.copy(cameraPosition);
  var xhr = new XMLHttpRequest;
  xhr.open('get', src);
  function recusivelyAddToScene (scene, doc) {
    var mesh = addToScene(scene, doc);
    if (doc.tagName === 'group') {
      scene = mesh;
    }
    meshHelper.forEachAttribute(doc, function (attr) {
      var props = meshHelper.getPropertiesFromAttrName(attr.name);
      if (props.length > 1) {
        meshHelper.setDefaultValue(mesh, props, +attr.value);
      }
    });
    for (var i = 0, len = doc.children.length; i < len; ++i) {
      recusivelyAddToScene(scene, doc.children[i]);
    }
  };
  xhr.onload = function () {
    var doc = parse(xhr.response);
    recusivelyAddToScene(portalScene, doc);
    portals.push(new PortalInfo(portalScene, portalCamera, rtTexture));
  };
  xhr.send();
  var material = new THREE.MeshBasicMaterial({
    map: rtTexture,
    //transparent: true,
  });
  return material;
};

function getDefaultMaterial (node) {
  var geometryColor = node.getAttribute('color') || '#A800FF';
  return new THREE.MeshLambertMaterial({ color: geometryColor });
};

function determineMaterial (node) {
  if (node.tagName === 'portal') {
    return buildPortal(node.getAttribute('src')) || getDefaultMaterial(node);
  } else {
    return getDefaultMaterial(node);
  }
};

function addToScene (scene, node) {
  if (node.tagName === 'group') {
    return createGroup(scene, node);
  } else if (node.tagName === 'scene') {
    return;
  }
  var geometry = determineGeometry(node.tagName);
  var material = determineMaterial(node);
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

function adjustPortalCamera (sceneCamera, portalCamera) {
  var angle = Math.tan(sceneCamera.position.x /
    (sceneCamera.position.z + portalCamera.position.z));
  var opposite = angle * portalCamera.position.z;
  portalCamera.position.add(new THREE.Vector3(opposite, 0, 0));
};

function renderPortals (renderer, isStereo) {
  var clone = new THREE.PerspectiveCamera();
  if (portals.length) {
    for (var i = 0; i < portals.length; ++i) {
      var portal = portals[i];
      if (isStereo) {
        //adjustPortalCamera(camera, portal.camera);
        clone.copy(portal.camera);
        adjustPortalCamera(camera, clone);
      } else {
        //portalCamera.position.copy(cameraPosition);
      }
      renderer.clear();
      renderer.render(portal.scene, clone, portal.texture, true);
    }
  }
};

var safeToRenderStereo = false;
function render () {
  if (safeToRenderStereo) {
    vrControls.update();
    adjustCamera(camera);
    //renderPortals(vrEffect, true);
    renderPortals(renderer, true);
    vrEffect.render(scene, camera);
  } else {
    renderPortals(renderer, false);
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

