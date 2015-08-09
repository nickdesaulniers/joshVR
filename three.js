// https://github.com/mrdoob/three.js/blob/master/examples/canvas_geometry_hierarchy.html#L57-L73
function initScene () {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = 400;
  canvas.style.verticalAlign = 'top';
  document.body.appendChild(canvas);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  camera.position.z = 5;
  camera.position.y = 1;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(canvas.width, canvas.height);

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
  var material2 = new THREE.MeshBasicMaterial({
    map: texture,
  });
  var floorObj = new THREE.Mesh(floor, material2);
  //floorObj.receiveShadow = true;
  scene.add(floorObj);
  return {
    renderer: renderer,
    scene: scene,
    camera: camera,
  };
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

module.exports = {
  initScene: initScene,
  addToScene: addToScene,
  createGroup: createGroup,
};

