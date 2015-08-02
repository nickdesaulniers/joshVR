function initScene () {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = 400;
  canvas.style.border = '1px dashed blue';
  document.body.appendChild(canvas);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  camera.position.z = 5;
  camera.position.y = 1;
  //camera.lookAt(0, 0, 0);
  var renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(canvas.width, canvas.height);

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
  //console.log(scene);
  return {
    renderer: renderer,
    scene: scene,
    camera: camera,
  };
};

function addToScene (scene, type) {
  var geometry;
  if (type === 'cube') {
    geometry = new THREE.BoxGeometry(1, 1, 1);
  } else if (type === 'sphere') {
    geometry = new THREE.SphereGeometry(0.5);
  } else {
    throw new Error('unrecognized type');
  }
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var mesh = new THREE.Mesh(geometry, material);
  if (type === 'sphere') mesh.position.x = 1.0; //
  scene.add(mesh);
  return mesh;
};

module.exports = {
  initScene: initScene,
  addToScene: addToScene,
};

