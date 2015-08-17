(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function buildUI () { return new dat.GUI(); };

// the order is: 1. display name in dat.gui, 2. property for three.js,
// 3. property for three.jsi, 4. min for dat.gui, 5. max for dat.gui
function getPropertiesFromAttrName (attrName) {
  if (attrName.startsWith('scale')) {
    return ['scale', 'scale', attrName.slice(-1).toLowerCase(), 0, 10];
  } else if (attrName.startsWith('translate')) {
    return ['translate', 'position', attrName.slice(-1).toLowerCase(), -4, 4];
  } else if (attrName.startsWith('rotate')) {
    return ['rotate', 'rotation', attrName.slice(-1).toLowerCase(), -Math.PI, Math.PI];
  } else {
    return [];
  }
};

function setDefaultValue (mesh, props, value) {
  mesh[props[1]][props[2]] = value;
};

function addControls (gui, mesh, props, writeBack) {
  var c = gui.add(mesh[props[1]], props[2], props[3], props[4]);
  c.onFinishChange(function (value) {
    mesh.node.setAttribute(props[0] + props[2].toUpperCase(), value.toFixed(2));
    writeBack();
  });
};

function findOrCreateFolder (gui, name) {
  return gui.__folders[name] ? gui.__folders[name] : gui.addFolder(name);
};

function addTransforms (gui, tag, mesh, writeBack) {
  for (var i = 0, len = tag.attributes.length; i < len; ++i) {
    var props = getPropertiesFromAttrName(tag.attributes[i].name);
    if (props.length > 1) {
      var folder = findOrCreateFolder(gui, props[0]);
      // order of setDefaultVale and addControls is important
      // cast to double important
      setDefaultValue(mesh, props, +tag.attributes[i].value);
      addControls(folder, mesh, props, writeBack);
    }
  }
};

module.exports = {
  buildUI: buildUI,
  addTransforms: addTransforms,
};


},{}],2:[function(require,module,exports){
var defaultText = [
  '<scene>',
  '  <group translateY="1.0" rotateY="0.78">',
  '    <cube scaleX="2.75" translateY="1.0"/>',
  '    <sphere translateX="1.0"/>',
  '    <sphere translateX="-1.0"/>',
  '  </group>',
  '</scene>'
].join('\n');

var doc = CodeMirror(document.getElementById('leftColumn'), {
  lineNumbers: true,
  mode: 'xml',
  value: defaultText,
  theme: 'monokai',
});

var skipOneUpdateFlag = false;
var serializer = new XMLSerializer;
function writeBack (xmlDocument) {
  return function () {
    skipOneUpdateFlag = true;
    doc.setValue(serializer.serializeToString(xmlDocument));
  };
};

function writeBackCausedUpdate () {
  if (skipOneUpdateFlag) {
    skipOneUpdateFlag = false;
    return true;
  }
  return false;
};

module.exports = {
  doc: doc,
  writeBack: writeBack,
  writeBackCausedUpdate: writeBackCausedUpdate,
};


},{}],3:[function(require,module,exports){
// watchify main.js -o dist.js -v -d
var mirror = require('./editor');
var rend = require('./renderer');
var ui = require('./controls');
var share = require('./share');
var debounce = require('debounce');

var parser = new DOMParser;
var ctx = {
  gui: null,
  raf: null,
};

var counter = 0;
function rebuild () {
  if (mirror.writeBackCausedUpdate()) return;
  destroyCtx();
  var content = mirror.doc.getValue();
  var doc = parser.parseFromString(content, 'application/xml');
  // Start descent from the scene tag, not the XMLDocument parent
  if (!doc.children.length) throw new Error('no child nodes');
  // TODO: this could be nicer
  mirror.cb = mirror.writeBack(doc);
  var scene = rend.initScene();
  ctx.gui = ui.buildUI();
  recursiveDescend(doc.children[0], scene, ctx.gui);
  (function render () {
    ctx.raf = requestAnimationFrame(render);
    rend.render();
  })();
  setTimeout(function () {
    rend.fixUpCanvas();
  }, 0);
};

function destroyCtx () {
  counter = 0;
  rend.destroy();
  if (ctx.gui) {
    ctx.gui.destroy();
    ctx.gui = null;
  }
  if (ctx.raf) {
    cancelAnimationFrame(ctx.raf);
    ctx.raf = null;
  }
};

// pre order depth first
function recursiveDescend (node, scene, gui) {
   var mesh = rend.addToScene(scene, node);
   if (node.tagName === 'group') {
     scene = mesh;
   }
   gui = gui.addFolder(node.tagName + counter++);
   ui.addTransforms(gui, node, mesh, mirror.cb);
   for (var i = 0, len = node.children.length; i < len; ++i) {
     recursiveDescend(node.children[i], scene, gui);
   }
};

mirror.doc.on('changes', debounce(rebuild, 1000));
rebuild();

var xhr = new XMLHttpRequest;
share.createLoadShareButtons(function () {
  var url = prompt('Please enter URL of raw Github Gist');
  xhr.open('get', url);
  xhr.onload = function () { mirror.doc.setValue(xhr.response); };
  xhr.send();
}, function () {
  var content = mirror.doc.getValue();
  share.post(content);
});


},{"./controls":1,"./editor":2,"./renderer":6,"./share":7,"debounce":4}],4:[function(require,module,exports){

/**
 * Module dependencies.
 */

var now = require('date-now');

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = now() - timestamp;

    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function debounced() {
    context = this;
    args = arguments;
    timestamp = now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

},{"date-now":5}],5:[function(require,module,exports){
module.exports = Date.now || now

function now() {
    return new Date().getTime()
}

},{}],6:[function(require,module,exports){
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
  render: render,
  destroy: destroy,
  fixUpCanvas: fixUpCanvas,
};


},{}],7:[function(require,module,exports){
var xhr = new XMLHttpRequest;

function post (content) {
  xhr.open('post', 'https://api.github.com/gists');
  xhr.onload = function () {
    var rateLimit = getRateLimitInfoFromHeaders(xhr);
    info(xhr.response.html_url, rateLimit.left, rateLimit.total);
  };
  xhr.responseType = 'json';
  xhr.send(JSON.stringify({
    "description": "joshVR snapshot",
    "public": true,
    "files": {
      "joshVR.xml": {
        "content": content,
      }
    }
  }));
};

function getRateLimitInfoFromHeaders (xhr) {
  return {
    total: xhr.getResponseHeader('X-RateLimit-Limit'),
    left: xhr.getResponseHeader('X-RateLimit-Remaining'),
    reset: xhr.getResponseHeader('X-RateLimit-Reset'),
  };
};

function createLoadShareButtons (onLoad, onShare) {
  var div = document.createElement('div');
  div.id = 'share';
  var load = document.createElement('button');
  load.textContent = 'load';
  load.addEventListener('click', onLoad);
  div.appendChild(load);
  var share = document.createElement('button');
  share.textContent = 'share'
  share.addEventListener('click', onShare);
  div.appendChild(share);
  var a = document.createElement('a');
  a.href = 'https://gist.github.com/search?utf8=%E2%9C%93&q=joshVR+filename%3AjoshVR.xml+anon%3Atrue+language%3Axml';
  a.textContent = 'Search for more'
  div.appendChild(a);
  var p = document.createElement('p');
  p.textContent = '. ';
  div.appendChild(p);
  document.body.appendChild(div);
};

function findOrCreateById (tag, id) {
  var ele = document.getElementById(id);
  if (!ele) {
    ele = document.createElement(tag);
    ele.id = id;
  }
  return ele;
};

function info (url, rateLimit, rateLimitTotal) {
  var share = document.getElementById('share');
  var p = findOrCreateById('p', 'shareInfo');
  p.innerHTML = '';
  var a = document.createElement('a');
  a.href = url;
  a.textContent = url;
  p.appendChild(a);
  p.appendChild(document.createTextNode(', ' + rateLimit + ' / ' + rateLimitTotal +
    ' shares left this hour. '));
  share.appendChild(p);
};

module.exports = {
  post: post,
  createLoadShareButtons: createLoadShareButtons,
};


},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92MC4xMi4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNvbnRyb2xzLmpzIiwiZWRpdG9yLmpzIiwibWFpbi5qcyIsIm5vZGVfbW9kdWxlcy9kZWJvdW5jZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kZWJvdW5jZS9ub2RlX21vZHVsZXMvZGF0ZS1ub3cvaW5kZXguanMiLCJyZW5kZXJlci5qcyIsInNoYXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBidWlsZFVJICgpIHsgcmV0dXJuIG5ldyBkYXQuR1VJKCk7IH07XG5cbi8vIHRoZSBvcmRlciBpczogMS4gZGlzcGxheSBuYW1lIGluIGRhdC5ndWksIDIuIHByb3BlcnR5IGZvciB0aHJlZS5qcyxcbi8vIDMuIHByb3BlcnR5IGZvciB0aHJlZS5qc2ksIDQuIG1pbiBmb3IgZGF0Lmd1aSwgNS4gbWF4IGZvciBkYXQuZ3VpXG5mdW5jdGlvbiBnZXRQcm9wZXJ0aWVzRnJvbUF0dHJOYW1lIChhdHRyTmFtZSkge1xuICBpZiAoYXR0ck5hbWUuc3RhcnRzV2l0aCgnc2NhbGUnKSkge1xuICAgIHJldHVybiBbJ3NjYWxlJywgJ3NjYWxlJywgYXR0ck5hbWUuc2xpY2UoLTEpLnRvTG93ZXJDYXNlKCksIDAsIDEwXTtcbiAgfSBlbHNlIGlmIChhdHRyTmFtZS5zdGFydHNXaXRoKCd0cmFuc2xhdGUnKSkge1xuICAgIHJldHVybiBbJ3RyYW5zbGF0ZScsICdwb3NpdGlvbicsIGF0dHJOYW1lLnNsaWNlKC0xKS50b0xvd2VyQ2FzZSgpLCAtNCwgNF07XG4gIH0gZWxzZSBpZiAoYXR0ck5hbWUuc3RhcnRzV2l0aCgncm90YXRlJykpIHtcbiAgICByZXR1cm4gWydyb3RhdGUnLCAncm90YXRpb24nLCBhdHRyTmFtZS5zbGljZSgtMSkudG9Mb3dlckNhc2UoKSwgLU1hdGguUEksIE1hdGguUEldO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbXTtcbiAgfVxufTtcblxuZnVuY3Rpb24gc2V0RGVmYXVsdFZhbHVlIChtZXNoLCBwcm9wcywgdmFsdWUpIHtcbiAgbWVzaFtwcm9wc1sxXV1bcHJvcHNbMl1dID0gdmFsdWU7XG59O1xuXG5mdW5jdGlvbiBhZGRDb250cm9scyAoZ3VpLCBtZXNoLCBwcm9wcywgd3JpdGVCYWNrKSB7XG4gIHZhciBjID0gZ3VpLmFkZChtZXNoW3Byb3BzWzFdXSwgcHJvcHNbMl0sIHByb3BzWzNdLCBwcm9wc1s0XSk7XG4gIGMub25GaW5pc2hDaGFuZ2UoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgbWVzaC5ub2RlLnNldEF0dHJpYnV0ZShwcm9wc1swXSArIHByb3BzWzJdLnRvVXBwZXJDYXNlKCksIHZhbHVlLnRvRml4ZWQoMikpO1xuICAgIHdyaXRlQmFjaygpO1xuICB9KTtcbn07XG5cbmZ1bmN0aW9uIGZpbmRPckNyZWF0ZUZvbGRlciAoZ3VpLCBuYW1lKSB7XG4gIHJldHVybiBndWkuX19mb2xkZXJzW25hbWVdID8gZ3VpLl9fZm9sZGVyc1tuYW1lXSA6IGd1aS5hZGRGb2xkZXIobmFtZSk7XG59O1xuXG5mdW5jdGlvbiBhZGRUcmFuc2Zvcm1zIChndWksIHRhZywgbWVzaCwgd3JpdGVCYWNrKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0YWcuYXR0cmlidXRlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciBwcm9wcyA9IGdldFByb3BlcnRpZXNGcm9tQXR0ck5hbWUodGFnLmF0dHJpYnV0ZXNbaV0ubmFtZSk7XG4gICAgaWYgKHByb3BzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBmb2xkZXIgPSBmaW5kT3JDcmVhdGVGb2xkZXIoZ3VpLCBwcm9wc1swXSk7XG4gICAgICAvLyBvcmRlciBvZiBzZXREZWZhdWx0VmFsZSBhbmQgYWRkQ29udHJvbHMgaXMgaW1wb3J0YW50XG4gICAgICAvLyBjYXN0IHRvIGRvdWJsZSBpbXBvcnRhbnRcbiAgICAgIHNldERlZmF1bHRWYWx1ZShtZXNoLCBwcm9wcywgK3RhZy5hdHRyaWJ1dGVzW2ldLnZhbHVlKTtcbiAgICAgIGFkZENvbnRyb2xzKGZvbGRlciwgbWVzaCwgcHJvcHMsIHdyaXRlQmFjayk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYnVpbGRVSTogYnVpbGRVSSxcbiAgYWRkVHJhbnNmb3JtczogYWRkVHJhbnNmb3Jtcyxcbn07XG5cbiIsInZhciBkZWZhdWx0VGV4dCA9IFtcbiAgJzxzY2VuZT4nLFxuICAnICA8Z3JvdXAgdHJhbnNsYXRlWT1cIjEuMFwiIHJvdGF0ZVk9XCIwLjc4XCI+JyxcbiAgJyAgICA8Y3ViZSBzY2FsZVg9XCIyLjc1XCIgdHJhbnNsYXRlWT1cIjEuMFwiLz4nLFxuICAnICAgIDxzcGhlcmUgdHJhbnNsYXRlWD1cIjEuMFwiLz4nLFxuICAnICAgIDxzcGhlcmUgdHJhbnNsYXRlWD1cIi0xLjBcIi8+JyxcbiAgJyAgPC9ncm91cD4nLFxuICAnPC9zY2VuZT4nXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgZG9jID0gQ29kZU1pcnJvcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGVmdENvbHVtbicpLCB7XG4gIGxpbmVOdW1iZXJzOiB0cnVlLFxuICBtb2RlOiAneG1sJyxcbiAgdmFsdWU6IGRlZmF1bHRUZXh0LFxuICB0aGVtZTogJ21vbm9rYWknLFxufSk7XG5cbnZhciBza2lwT25lVXBkYXRlRmxhZyA9IGZhbHNlO1xudmFyIHNlcmlhbGl6ZXIgPSBuZXcgWE1MU2VyaWFsaXplcjtcbmZ1bmN0aW9uIHdyaXRlQmFjayAoeG1sRG9jdW1lbnQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBza2lwT25lVXBkYXRlRmxhZyA9IHRydWU7XG4gICAgZG9jLnNldFZhbHVlKHNlcmlhbGl6ZXIuc2VyaWFsaXplVG9TdHJpbmcoeG1sRG9jdW1lbnQpKTtcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIHdyaXRlQmFja0NhdXNlZFVwZGF0ZSAoKSB7XG4gIGlmIChza2lwT25lVXBkYXRlRmxhZykge1xuICAgIHNraXBPbmVVcGRhdGVGbGFnID0gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRvYzogZG9jLFxuICB3cml0ZUJhY2s6IHdyaXRlQmFjayxcbiAgd3JpdGVCYWNrQ2F1c2VkVXBkYXRlOiB3cml0ZUJhY2tDYXVzZWRVcGRhdGUsXG59O1xuXG4iLCIvLyB3YXRjaGlmeSBtYWluLmpzIC1vIGRpc3QuanMgLXYgLWRcbnZhciBtaXJyb3IgPSByZXF1aXJlKCcuL2VkaXRvcicpO1xudmFyIHJlbmQgPSByZXF1aXJlKCcuL3JlbmRlcmVyJyk7XG52YXIgdWkgPSByZXF1aXJlKCcuL2NvbnRyb2xzJyk7XG52YXIgc2hhcmUgPSByZXF1aXJlKCcuL3NoYXJlJyk7XG52YXIgZGVib3VuY2UgPSByZXF1aXJlKCdkZWJvdW5jZScpO1xuXG52YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcjtcbnZhciBjdHggPSB7XG4gIGd1aTogbnVsbCxcbiAgcmFmOiBudWxsLFxufTtcblxudmFyIGNvdW50ZXIgPSAwO1xuZnVuY3Rpb24gcmVidWlsZCAoKSB7XG4gIGlmIChtaXJyb3Iud3JpdGVCYWNrQ2F1c2VkVXBkYXRlKCkpIHJldHVybjtcbiAgZGVzdHJveUN0eCgpO1xuICB2YXIgY29udGVudCA9IG1pcnJvci5kb2MuZ2V0VmFsdWUoKTtcbiAgdmFyIGRvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcoY29udGVudCwgJ2FwcGxpY2F0aW9uL3htbCcpO1xuICAvLyBTdGFydCBkZXNjZW50IGZyb20gdGhlIHNjZW5lIHRhZywgbm90IHRoZSBYTUxEb2N1bWVudCBwYXJlbnRcbiAgaWYgKCFkb2MuY2hpbGRyZW4ubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ25vIGNoaWxkIG5vZGVzJyk7XG4gIC8vIFRPRE86IHRoaXMgY291bGQgYmUgbmljZXJcbiAgbWlycm9yLmNiID0gbWlycm9yLndyaXRlQmFjayhkb2MpO1xuICB2YXIgc2NlbmUgPSByZW5kLmluaXRTY2VuZSgpO1xuICBjdHguZ3VpID0gdWkuYnVpbGRVSSgpO1xuICByZWN1cnNpdmVEZXNjZW5kKGRvYy5jaGlsZHJlblswXSwgc2NlbmUsIGN0eC5ndWkpO1xuICAoZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICBjdHgucmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgcmVuZC5yZW5kZXIoKTtcbiAgfSkoKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgcmVuZC5maXhVcENhbnZhcygpO1xuICB9LCAwKTtcbn07XG5cbmZ1bmN0aW9uIGRlc3Ryb3lDdHggKCkge1xuICBjb3VudGVyID0gMDtcbiAgcmVuZC5kZXN0cm95KCk7XG4gIGlmIChjdHguZ3VpKSB7XG4gICAgY3R4Lmd1aS5kZXN0cm95KCk7XG4gICAgY3R4Lmd1aSA9IG51bGw7XG4gIH1cbiAgaWYgKGN0eC5yYWYpIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZShjdHgucmFmKTtcbiAgICBjdHgucmFmID0gbnVsbDtcbiAgfVxufTtcblxuLy8gcHJlIG9yZGVyIGRlcHRoIGZpcnN0XG5mdW5jdGlvbiByZWN1cnNpdmVEZXNjZW5kIChub2RlLCBzY2VuZSwgZ3VpKSB7XG4gICB2YXIgbWVzaCA9IHJlbmQuYWRkVG9TY2VuZShzY2VuZSwgbm9kZSk7XG4gICBpZiAobm9kZS50YWdOYW1lID09PSAnZ3JvdXAnKSB7XG4gICAgIHNjZW5lID0gbWVzaDtcbiAgIH1cbiAgIGd1aSA9IGd1aS5hZGRGb2xkZXIobm9kZS50YWdOYW1lICsgY291bnRlcisrKTtcbiAgIHVpLmFkZFRyYW5zZm9ybXMoZ3VpLCBub2RlLCBtZXNoLCBtaXJyb3IuY2IpO1xuICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgcmVjdXJzaXZlRGVzY2VuZChub2RlLmNoaWxkcmVuW2ldLCBzY2VuZSwgZ3VpKTtcbiAgIH1cbn07XG5cbm1pcnJvci5kb2Mub24oJ2NoYW5nZXMnLCBkZWJvdW5jZShyZWJ1aWxkLCAxMDAwKSk7XG5yZWJ1aWxkKCk7XG5cbnZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3Q7XG5zaGFyZS5jcmVhdGVMb2FkU2hhcmVCdXR0b25zKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHVybCA9IHByb21wdCgnUGxlYXNlIGVudGVyIFVSTCBvZiByYXcgR2l0aHViIEdpc3QnKTtcbiAgeGhyLm9wZW4oJ2dldCcsIHVybCk7XG4gIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7IG1pcnJvci5kb2Muc2V0VmFsdWUoeGhyLnJlc3BvbnNlKTsgfTtcbiAgeGhyLnNlbmQoKTtcbn0sIGZ1bmN0aW9uICgpIHtcbiAgdmFyIGNvbnRlbnQgPSBtaXJyb3IuZG9jLmdldFZhbHVlKCk7XG4gIHNoYXJlLnBvc3QoY29udGVudCk7XG59KTtcblxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIG5vdyA9IHJlcXVpcmUoJ2RhdGUtbm93Jyk7XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICogYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICogTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gKiBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICpcbiAqIEBzb3VyY2UgdW5kZXJzY29yZS5qc1xuICogQHNlZSBodHRwOi8vdW5zY3JpcHRhYmxlLmNvbS8yMDA5LzAzLzIwL2RlYm91bmNpbmctamF2YXNjcmlwdC1tZXRob2RzL1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gd3JhcFxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXQgaW4gbXMgKGAxMDBgKVxuICogQHBhcmFtIHtCb29sZWFufSB3aGV0aGVyIHRvIGV4ZWN1dGUgYXQgdGhlIGJlZ2lubmluZyAoYGZhbHNlYClcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpe1xuICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG4gIGlmIChudWxsID09IHdhaXQpIHdhaXQgPSAxMDA7XG5cbiAgZnVuY3Rpb24gbGF0ZXIoKSB7XG4gICAgdmFyIGxhc3QgPSBub3coKSAtIHRpbWVzdGFtcDtcblxuICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID4gMCkge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICBpZiAoIWltbWVkaWF0ZSkge1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGRlYm91bmNlZCgpIHtcbiAgICBjb250ZXh0ID0gdGhpcztcbiAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIHRpbWVzdGFtcCA9IG5vdygpO1xuICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgIGlmICghdGltZW91dCkgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgIGlmIChjYWxsTm93KSB7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBEYXRlLm5vdyB8fCBub3dcblxuZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKVxufVxuIiwidmFyIHJlbmRlcmVyLCBzY2VuZSwgY2FtZXJhLCBjYW52YXMsIHZyRWZmZWN0LCB2ckNvbnRyb2xzO1xudmFyIGNhbWVyYVBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgNSk7XG5cbmZ1bmN0aW9uIGluaXRTY2VuZSAoKSB7XG4gIGluaXRDYW52YXMoKTtcbiAgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAgaW5pdENhbWVyYShjYW52YXMpO1xuICBpbml0UmVuZGVyZXIoY2FudmFzKTtcbiAgaW5pdFZSKHJlbmRlcmVyLCBjYW1lcmEpO1xuICBpbml0TGlnaHRzKHNjZW5lKTtcbiAgaW5pdEZsb29yKHNjZW5lKTtcbiAgcmV0dXJuIHNjZW5lO1xufTtcblxuZnVuY3Rpb24gaW5pdENhbnZhcyAoKSB7XG4gIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICBjYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNTtcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJGdWxsc2NyZWVuKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGV4aXRGdWxsc2NyZWVuKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JpZ2h0Q29sdW1uJykuYXBwZW5kQ2hpbGQoY2FudmFzKTtcbn07XG5cbmZ1bmN0aW9uIGluaXRDYW1lcmEgKGNhbnZhcykge1xuICBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNzUsIGNhbnZhcy53aWR0aCAvIGNhbnZhcy5oZWlnaHQsIDAuMSwgMTAwMCk7XG4gIHJlc2V0Q2FtZXJhKGNhbWVyYSk7XG59O1xuXG5mdW5jdGlvbiBpbml0UmVuZGVyZXIgKGNhbnZhcykge1xuICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgY2FudmFzOiBjYW52YXMsIGFudGlhbGlhczogdHJ1ZSB9KTtcbiAgcmVuZGVyZXIuc2V0U2l6ZShjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICByZW5kZXJlci5zZXRQaXhlbFJhdGlvKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTtcbiAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweDlERUJFOSk7XG4gIHJlbmRlcmVyLnNoYWRvd01hcC5lbmFibGVkID0gdHJ1ZTtcbiAgcmVuZGVyZXIuc2hhZG93TWFwLnR5cGUgPSBUSFJFRS5QQ0ZTb2Z0U2hhZG93TWFwO1xuICByZW5kZXJlci5hdXRvQ2xlYXJEZXB0aCA9IGZhbHNlO1xuICByZW5kZXJlci5hdXRvQ2xlYXJTdGVuY2lsID0gZmFsc2U7XG4gIHJlbmRlcmVyLnNvcnRPYmplY3RzID0gZmFsc2U7XG4gIHJlbmRlcmVyLmF1dG9VcGRhdGVPYmplY3RzID0gZmFsc2U7XG59O1xuXG5mdW5jdGlvbiBpbml0VlIgKHJlbmRlcmVyLCBjYW1lcmEpIHtcbiAgdnJFZmZlY3QgPSBuZXcgVEhSRUUuVlJFZmZlY3QocmVuZGVyZXIsIGFsZXJ0KTtcbiAgdnJDb250cm9scyA9IG5ldyBUSFJFRS5WUkNvbnRyb2xzKGNhbWVyYSk7XG59O1xuXG5mdW5jdGlvbiBpbml0TGlnaHRzIChzY2VuZSkge1xuICBzY2VuZS5hZGQobmV3IFRIUkVFLkFtYmllbnRMaWdodCgweEJCQkJCQikpO1xuICB2YXIgbGlnaHQgPSBuZXcgVEhSRUUuU3BvdExpZ2h0KDB4RkZGRkZGLCAxLCAxMDApO1xuICBsaWdodC5wb3NpdGlvbi5zZXQoNTAsIDUwLCA1MCk7XG4gIGxpZ2h0LmNhc3RTaGFkb3cgPSB0cnVlO1xuICBzY2VuZS5hZGQobGlnaHQpO1xufTtcblxuZnVuY3Rpb24gaW5pdEZsb29yIChzY2VuZSkge1xuICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQ2lyY2xlR2VvbWV0cnkoMTAwLCAxNik7XG4gIGdlb21ldHJ5LmFwcGx5TWF0cml4KG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVJvdGF0aW9uWCgtTWF0aC5QSSAvIDIpKTtcbiAgdmFyIHRleHR1cmUgPSBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCdjaGVja2VyYm9hcmQucG5nJyk7XG4gIHRleHR1cmUucmVwZWF0LnNldCgxMDAsIDEwMCk7XG4gIHRleHR1cmUud3JhcFMgPSB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgbWFwOiB0ZXh0dXJlLFxuICB9KTtcbiAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICBtZXNoLmNhc3RTaGFkb3cgPSBmYWxzZTtcbiAgbWVzaC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgc2NlbmUuYWRkKG1lc2gpO1xufTtcblxuZnVuY3Rpb24gYWRkVG9TY2VuZSAoc2NlbmUsIG5vZGUpIHtcbiAgdmFyIGdlb21ldHJ5O1xuICBpZiAobm9kZS50YWdOYW1lID09PSAnZ3JvdXAnKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUdyb3VwKHNjZW5lLCBub2RlKTtcbiAgfSBlbHNlIGlmIChub2RlLnRhZ05hbWUgPT09ICdjdWJlJykge1xuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KDEsIDEsIDEpO1xuICB9IGVsc2UgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ3NwaGVyZScpIHtcbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVCdWZmZXJHZW9tZXRyeSgwLjUpO1xuICB9IGVsc2UgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ3NjZW5lJykge1xuICAgIHJldHVybjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VucmVjb2duaXplZCB0eXBlJyk7XG4gIH1cbiAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoIHsgY29sb3I6IDB4MDBmZjAwIH0gKTtcbiAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICBtZXNoLmNhc3RTaGFkb3cgPSB0cnVlO1xuICBtZXNoLnJlY2VpdmVTaGFkb3cgPSBmYWxzZTtcbiAgbWVzaC5ub2RlID0gbm9kZTtcbiAgc2NlbmUuYWRkKG1lc2gpO1xuICByZXR1cm4gbWVzaDtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUdyb3VwIChzY2VuZSwgbm9kZSkge1xuICB2YXIgZ3JvdXAgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgZ3JvdXAubm9kZSA9IG5vZGU7XG4gIHNjZW5lLmFkZChncm91cCk7XG4gIHJldHVybiBncm91cDtcbn07XG5cbnZhciBzYWZlVG9SZW5kZXJTdGVyZW8gPSBmYWxzZTtcbmZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gIGlmIChzYWZlVG9SZW5kZXJTdGVyZW8pIHtcbiAgICB2ckNvbnRyb2xzLnVwZGF0ZSgpO1xuICAgIGFkanVzdENhbWVyYShjYW1lcmEpO1xuICAgIHZyRWZmZWN0LnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgfSBlbHNlIHtcbiAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGRlc3Ryb3kgKCkgeyBpZiAoY2FudmFzKSBjYW52YXMucmVtb3ZlKCk7IH07XG5mdW5jdGlvbiBpc0Z1bGxzY3JlZW4gKCkgeyByZXR1cm4gISFkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudDsgfTtcblxuZnVuY3Rpb24gZW50ZXJGdWxsc2NyZWVuICgpIHtcbiAgaWYgKGlzRnVsbHNjcmVlbigpKSByZXR1cm47XG4gIHZyRWZmZWN0LnNldEZ1bGxTY3JlZW4odHJ1ZSk7XG4gIGNhbWVyYS5hc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgY2FudmFzLm1velJlcXVlc3RQb2ludGVyTG9jaygpO1xuICBzYWZlVG9SZW5kZXJTdGVyZW8gPSB0cnVlO1xufTtcblxuZnVuY3Rpb24gZXhpdEZ1bGxzY3JlZW4gKCkge1xuICBpZiAoaXNGdWxsc2NyZWVuKCkpIHJldHVybjtcbiAgZml4VXBDYW52YXMoKTtcbiAgcmVzZXRDYW1lcmEoY2FtZXJhKTtcbiAgc2FmZVRvUmVuZGVyU3RlcmVvID0gZmFsc2U7XG59O1xuXG5mdW5jdGlvbiByZXNldENhbWVyYSAoY2FtZXJhKSB7XG4gIGNhbWVyYS5wb3NpdGlvbi5jb3B5KGNhbWVyYVBvc2l0aW9uKTtcbiAgY2FtZXJhLnF1YXRlcm5pb24uc2V0KDAsIDAsIDAsIDEpO1xuICBjYW1lcmEuYXNwZWN0ID0gY2FudmFzLndpZHRoIC8gY2FudmFzLmhlaWdodDtcbiAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbn07XG5cbi8vIFRoaXMgd2lsbCBhZGp1c3QgdGhlIGNhbWVyYSBiYWNrIHNpbmNlIFZSQ29udHJvbHMgd2lsbCBjb3B5IHBvc2l0aW9uXG4vLyBkYXRhIGZyb20gdGhlIFBvc2l0aW9uIFNlbnNvci4gVGhpcyBhZGp1c3RtZW50IGlzIG5vdCBuZWVkZWQgaWYgdGhlIHVzZXJcbi8vIGVudGVyZWQgZnVsbHNjcmVlbiB3aXRob3V0IGluZm8gZnJvbSB0aGUgUG9zaXRpb24gU2Vuc29yLlxuZnVuY3Rpb24gYWRqdXN0Q2FtZXJhIChjYW1lcmEpIHtcbiAgaWYgKGNhbWVyYS5wb3NpdGlvbi56IDwgNC4wKSB7XG4gICAgY2FtZXJhLnBvc2l0aW9uLmFkZChjYW1lcmFQb3NpdGlvbik7XG4gIH1cbn07XG5cbi8vIFRPRE86IGRpcnR5IGhhY2ssIHJlbW92ZVxuZnVuY3Rpb24gZml4VXBDYW52YXMgKCkge1xuICB2YXIgcmVjdCA9IGNhbnZhcy5wYXJlbnROb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBjYW52YXMud2lkdGggPSByZWN0LndpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gcmVjdC5oZWlnaHQ7XG4gIHJlbmRlcmVyLnNldFNpemUoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbml0U2NlbmU6IGluaXRTY2VuZSxcbiAgYWRkVG9TY2VuZTogYWRkVG9TY2VuZSxcbiAgcmVuZGVyOiByZW5kZXIsXG4gIGRlc3Ryb3k6IGRlc3Ryb3ksXG4gIGZpeFVwQ2FudmFzOiBmaXhVcENhbnZhcyxcbn07XG5cbiIsInZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3Q7XG5cbmZ1bmN0aW9uIHBvc3QgKGNvbnRlbnQpIHtcbiAgeGhyLm9wZW4oJ3Bvc3QnLCAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9naXN0cycpO1xuICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByYXRlTGltaXQgPSBnZXRSYXRlTGltaXRJbmZvRnJvbUhlYWRlcnMoeGhyKTtcbiAgICBpbmZvKHhoci5yZXNwb25zZS5odG1sX3VybCwgcmF0ZUxpbWl0LmxlZnQsIHJhdGVMaW1pdC50b3RhbCk7XG4gIH07XG4gIHhoci5yZXNwb25zZVR5cGUgPSAnanNvbic7XG4gIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwiam9zaFZSIHNuYXBzaG90XCIsXG4gICAgXCJwdWJsaWNcIjogdHJ1ZSxcbiAgICBcImZpbGVzXCI6IHtcbiAgICAgIFwiam9zaFZSLnhtbFwiOiB7XG4gICAgICAgIFwiY29udGVudFwiOiBjb250ZW50LFxuICAgICAgfVxuICAgIH1cbiAgfSkpO1xufTtcblxuZnVuY3Rpb24gZ2V0UmF0ZUxpbWl0SW5mb0Zyb21IZWFkZXJzICh4aHIpIHtcbiAgcmV0dXJuIHtcbiAgICB0b3RhbDogeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdYLVJhdGVMaW1pdC1MaW1pdCcpLFxuICAgIGxlZnQ6IHhoci5nZXRSZXNwb25zZUhlYWRlcignWC1SYXRlTGltaXQtUmVtYWluaW5nJyksXG4gICAgcmVzZXQ6IHhoci5nZXRSZXNwb25zZUhlYWRlcignWC1SYXRlTGltaXQtUmVzZXQnKSxcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUxvYWRTaGFyZUJ1dHRvbnMgKG9uTG9hZCwgb25TaGFyZSkge1xuICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5pZCA9ICdzaGFyZSc7XG4gIHZhciBsb2FkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gIGxvYWQudGV4dENvbnRlbnQgPSAnbG9hZCc7XG4gIGxvYWQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbkxvYWQpO1xuICBkaXYuYXBwZW5kQ2hpbGQobG9hZCk7XG4gIHZhciBzaGFyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICBzaGFyZS50ZXh0Q29udGVudCA9ICdzaGFyZSdcbiAgc2hhcmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvblNoYXJlKTtcbiAgZGl2LmFwcGVuZENoaWxkKHNoYXJlKTtcbiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gIGEuaHJlZiA9ICdodHRwczovL2dpc3QuZ2l0aHViLmNvbS9zZWFyY2g/dXRmOD0lRTIlOUMlOTMmcT1qb3NoVlIrZmlsZW5hbWUlM0Fqb3NoVlIueG1sK2Fub24lM0F0cnVlK2xhbmd1YWdlJTNBeG1sJztcbiAgYS50ZXh0Q29udGVudCA9ICdTZWFyY2ggZm9yIG1vcmUnXG4gIGRpdi5hcHBlbmRDaGlsZChhKTtcbiAgdmFyIHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIHAudGV4dENvbnRlbnQgPSAnLiAnO1xuICBkaXYuYXBwZW5kQ2hpbGQocCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGl2KTtcbn07XG5cbmZ1bmN0aW9uIGZpbmRPckNyZWF0ZUJ5SWQgKHRhZywgaWQpIHtcbiAgdmFyIGVsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgaWYgKCFlbGUpIHtcbiAgICBlbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgZWxlLmlkID0gaWQ7XG4gIH1cbiAgcmV0dXJuIGVsZTtcbn07XG5cbmZ1bmN0aW9uIGluZm8gKHVybCwgcmF0ZUxpbWl0LCByYXRlTGltaXRUb3RhbCkge1xuICB2YXIgc2hhcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hhcmUnKTtcbiAgdmFyIHAgPSBmaW5kT3JDcmVhdGVCeUlkKCdwJywgJ3NoYXJlSW5mbycpO1xuICBwLmlubmVySFRNTCA9ICcnO1xuICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgYS5ocmVmID0gdXJsO1xuICBhLnRleHRDb250ZW50ID0gdXJsO1xuICBwLmFwcGVuZENoaWxkKGEpO1xuICBwLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcsICcgKyByYXRlTGltaXQgKyAnIC8gJyArIHJhdGVMaW1pdFRvdGFsICtcbiAgICAnIHNoYXJlcyBsZWZ0IHRoaXMgaG91ci4gJykpO1xuICBzaGFyZS5hcHBlbmRDaGlsZChwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwb3N0OiBwb3N0LFxuICBjcmVhdGVMb2FkU2hhcmVCdXR0b25zOiBjcmVhdGVMb2FkU2hhcmVCdXR0b25zLFxufTtcblxuIl19
