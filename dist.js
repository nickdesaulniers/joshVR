(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var defaultText = [
  '<scene>',
  '  <group>',
  '    <cube scaleX="2.75" translateY="1.0"/>',
  '    <sphere translateX="1.0"/>',
  '    <sphere translateX="-1.0"/>',
  '  </group>',
  '</scene>'
].join('\n');
var div = document.createElement('div');
div.style.width = '50%';
div.style.border = '1px dashed black';
document.body.appendChild(div);
var doc = CodeMirror(div, {
  lineNumbers: true,
  mode: 'xml',
  value: defaultText,
  theme: 'solarized dark',
});
window.doc = doc; //
// we'll use doc.replaceRange("hi", CodeMirror.Pos(1, 5), CodeMirror.Pos(1, 7))

module.exports = {
  doc: doc,
};

},{}],2:[function(require,module,exports){
//var name = gui.addFolder('Name');
////name.add({ plunks: 0 }, 'plunks');
////name.addColor({ color: '#F00' }, 'color');
////gui.add({ message: '', }, 'message');
// http://workshop.chromeexperiments.com/examples/gui/#10--Updating-the-Display-Manually
function buildUI (cube) {
  var gui = new dat.GUI();
  window.gui = gui;
  return gui;
};

// the order is: 1. display name in dat.gui, 2. property for three.js,
// 3. property for three.jsi, 4. min for dat.gui, 5. max for dat.gui
function getPropertiesFromAttrName (attrName) {
  if (attrName.startsWith('scale')) {
    return ['scale', 'scale', attrName.slice(-1).toLowerCase(), 0, 10];
  } else if (attrName.startsWith('translate')) {
    return ['translate', 'position', attrName.slice(-1).toLowerCase(), -4, 4];
  } else {
    return [];
  }
};

function setDefaultValue (mesh, props, value) {
  mesh[props[1]][props[2]] = value;
};
function addControls (gui, mesh, props) {
  gui.add(mesh[props[1]], props[2], props[3], props[4]);
};

function addTransforms (gui, tag, mesh) {
  //console.log(tag, mesh);
  //console.log(tag.attributes, tag.getAttribute);
  for (var i = 0, len = tag.attributes.length; i < len; ++i) {
    //console.log(tag.tagName, tag.attributes[i].name, tag.attributes[i].value);
    var props = getPropertiesFromAttrName(tag.attributes[i].name);
    ////scaleFolder.add(cube.scale, 'x', 0, 10);
    if (props.length > 1) {
      var folder = gui.addFolder(props[0]);
      // order of setDefaultVale and addControls is important
      // cast to double important
      setDefaultValue(mesh, props, +tag.attributes[i].value);
      addControls(folder, mesh, props);
    }
  }
};

module.exports = {
  buildUI: buildUI,
  addTransforms: addTransforms,
};


},{}],3:[function(require,module,exports){
// watchify main.js -o dist.js -v -d
var doc = require('./code_mirror').doc;
var rend = require('./three.js');
var ui = require('./dat_gui');
var debounce = require('debounce');

var parser = new DOMParser();
function rebuild () {
  var content = doc.getValue();
  var d = parser.parseFromString(content, 'application/xml');
  // Start descent from the scene tag, not the XMLDocument parent
  if (!d.children.length) throw new Error('no child nodes');
  var scene = recursiveDescend(d.children[0], null, null);
  (function render () {
    requestAnimationFrame(render);
    scene.renderer.render(scene.scene, scene.camera);
  })();
};

// pre order depth first
var counter = 0;
function recursiveDescend (node, scene, gui) {
   //console.log(node, node.tagName);
   if (node.tagName === 'scene') {
     scene = rend.initScene();
     gui = ui.buildUI(null);
   } else if (node.tagName === 'cube') {
     var mesh = rend.addToScene(scene.scene, 'cube');
     gui = gui.addFolder('cube' + counter++);
     ui.addTransforms(gui, node, mesh);
   } else if (node.tagName === 'sphere') {
     var mesh = rend.addToScene(scene.scene, 'sphere');
     gui = gui.addFolder('sphere' + counter++);
     ui.addTransforms(gui, node, mesh);
   } else if (node.tagName === 'group') {
     gui = gui.addFolder('group' + counter++);
   }
   for (var i = 0, len = node.children.length; i < len; ++i) {
     //console.log(node.children[i]);
     recursiveDescend(node.children[i], scene, gui);
   }
   if (scene) return scene;
};

doc.on('update', debounce(rebuild, 1000));
rebuild();


},{"./code_mirror":1,"./dat_gui":2,"./three.js":6,"debounce":4}],4:[function(require,module,exports){

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
// https://github.com/mrdoob/three.js/blob/master/examples/canvas_geometry_hierarchy.html#L57-L73
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
  //if (type === 'sphere') mesh.position.x = 1.0; //
  scene.add(mesh);
  return mesh;
};

module.exports = {
  initScene: initScene,
  addToScene: addToScene,
};


},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92MC4xMi4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNvZGVfbWlycm9yLmpzIiwiZGF0X2d1aS5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvZGVib3VuY2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVib3VuY2Uvbm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwidGhyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGRlZmF1bHRUZXh0ID0gW1xuICAnPHNjZW5lPicsXG4gICcgIDxncm91cD4nLFxuICAnICAgIDxjdWJlIHNjYWxlWD1cIjIuNzVcIiB0cmFuc2xhdGVZPVwiMS4wXCIvPicsXG4gICcgICAgPHNwaGVyZSB0cmFuc2xhdGVYPVwiMS4wXCIvPicsXG4gICcgICAgPHNwaGVyZSB0cmFuc2xhdGVYPVwiLTEuMFwiLz4nLFxuICAnICA8L2dyb3VwPicsXG4gICc8L3NjZW5lPidcbl0uam9pbignXFxuJyk7XG52YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5kaXYuc3R5bGUud2lkdGggPSAnNTAlJztcbmRpdi5zdHlsZS5ib3JkZXIgPSAnMXB4IGRhc2hlZCBibGFjayc7XG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XG52YXIgZG9jID0gQ29kZU1pcnJvcihkaXYsIHtcbiAgbGluZU51bWJlcnM6IHRydWUsXG4gIG1vZGU6ICd4bWwnLFxuICB2YWx1ZTogZGVmYXVsdFRleHQsXG4gIHRoZW1lOiAnc29sYXJpemVkIGRhcmsnLFxufSk7XG53aW5kb3cuZG9jID0gZG9jOyAvL1xuLy8gd2UnbGwgdXNlIGRvYy5yZXBsYWNlUmFuZ2UoXCJoaVwiLCBDb2RlTWlycm9yLlBvcygxLCA1KSwgQ29kZU1pcnJvci5Qb3MoMSwgNykpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkb2M6IGRvYyxcbn07XG4iLCIvL3ZhciBuYW1lID0gZ3VpLmFkZEZvbGRlcignTmFtZScpO1xuLy8vL25hbWUuYWRkKHsgcGx1bmtzOiAwIH0sICdwbHVua3MnKTtcbi8vLy9uYW1lLmFkZENvbG9yKHsgY29sb3I6ICcjRjAwJyB9LCAnY29sb3InKTtcbi8vLy9ndWkuYWRkKHsgbWVzc2FnZTogJycsIH0sICdtZXNzYWdlJyk7XG4vLyBodHRwOi8vd29ya3Nob3AuY2hyb21lZXhwZXJpbWVudHMuY29tL2V4YW1wbGVzL2d1aS8jMTAtLVVwZGF0aW5nLXRoZS1EaXNwbGF5LU1hbnVhbGx5XG5mdW5jdGlvbiBidWlsZFVJIChjdWJlKSB7XG4gIHZhciBndWkgPSBuZXcgZGF0LkdVSSgpO1xuICB3aW5kb3cuZ3VpID0gZ3VpO1xuICByZXR1cm4gZ3VpO1xufTtcblxuLy8gdGhlIG9yZGVyIGlzOiAxLiBkaXNwbGF5IG5hbWUgaW4gZGF0Lmd1aSwgMi4gcHJvcGVydHkgZm9yIHRocmVlLmpzLFxuLy8gMy4gcHJvcGVydHkgZm9yIHRocmVlLmpzaSwgNC4gbWluIGZvciBkYXQuZ3VpLCA1LiBtYXggZm9yIGRhdC5ndWlcbmZ1bmN0aW9uIGdldFByb3BlcnRpZXNGcm9tQXR0ck5hbWUgKGF0dHJOYW1lKSB7XG4gIGlmIChhdHRyTmFtZS5zdGFydHNXaXRoKCdzY2FsZScpKSB7XG4gICAgcmV0dXJuIFsnc2NhbGUnLCAnc2NhbGUnLCBhdHRyTmFtZS5zbGljZSgtMSkudG9Mb3dlckNhc2UoKSwgMCwgMTBdO1xuICB9IGVsc2UgaWYgKGF0dHJOYW1lLnN0YXJ0c1dpdGgoJ3RyYW5zbGF0ZScpKSB7XG4gICAgcmV0dXJuIFsndHJhbnNsYXRlJywgJ3Bvc2l0aW9uJywgYXR0ck5hbWUuc2xpY2UoLTEpLnRvTG93ZXJDYXNlKCksIC00LCA0XTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHNldERlZmF1bHRWYWx1ZSAobWVzaCwgcHJvcHMsIHZhbHVlKSB7XG4gIG1lc2hbcHJvcHNbMV1dW3Byb3BzWzJdXSA9IHZhbHVlO1xufTtcbmZ1bmN0aW9uIGFkZENvbnRyb2xzIChndWksIG1lc2gsIHByb3BzKSB7XG4gIGd1aS5hZGQobWVzaFtwcm9wc1sxXV0sIHByb3BzWzJdLCBwcm9wc1szXSwgcHJvcHNbNF0pO1xufTtcblxuZnVuY3Rpb24gYWRkVHJhbnNmb3JtcyAoZ3VpLCB0YWcsIG1lc2gpIHtcbiAgLy9jb25zb2xlLmxvZyh0YWcsIG1lc2gpO1xuICAvL2NvbnNvbGUubG9nKHRhZy5hdHRyaWJ1dGVzLCB0YWcuZ2V0QXR0cmlidXRlKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRhZy5hdHRyaWJ1dGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgLy9jb25zb2xlLmxvZyh0YWcudGFnTmFtZSwgdGFnLmF0dHJpYnV0ZXNbaV0ubmFtZSwgdGFnLmF0dHJpYnV0ZXNbaV0udmFsdWUpO1xuICAgIHZhciBwcm9wcyA9IGdldFByb3BlcnRpZXNGcm9tQXR0ck5hbWUodGFnLmF0dHJpYnV0ZXNbaV0ubmFtZSk7XG4gICAgLy8vL3NjYWxlRm9sZGVyLmFkZChjdWJlLnNjYWxlLCAneCcsIDAsIDEwKTtcbiAgICBpZiAocHJvcHMubGVuZ3RoID4gMSkge1xuICAgICAgdmFyIGZvbGRlciA9IGd1aS5hZGRGb2xkZXIocHJvcHNbMF0pO1xuICAgICAgLy8gb3JkZXIgb2Ygc2V0RGVmYXVsdFZhbGUgYW5kIGFkZENvbnRyb2xzIGlzIGltcG9ydGFudFxuICAgICAgLy8gY2FzdCB0byBkb3VibGUgaW1wb3J0YW50XG4gICAgICBzZXREZWZhdWx0VmFsdWUobWVzaCwgcHJvcHMsICt0YWcuYXR0cmlidXRlc1tpXS52YWx1ZSk7XG4gICAgICBhZGRDb250cm9scyhmb2xkZXIsIG1lc2gsIHByb3BzKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBidWlsZFVJOiBidWlsZFVJLFxuICBhZGRUcmFuc2Zvcm1zOiBhZGRUcmFuc2Zvcm1zLFxufTtcblxuIiwiLy8gd2F0Y2hpZnkgbWFpbi5qcyAtbyBkaXN0LmpzIC12IC1kXG52YXIgZG9jID0gcmVxdWlyZSgnLi9jb2RlX21pcnJvcicpLmRvYztcbnZhciByZW5kID0gcmVxdWlyZSgnLi90aHJlZS5qcycpO1xudmFyIHVpID0gcmVxdWlyZSgnLi9kYXRfZ3VpJyk7XG52YXIgZGVib3VuY2UgPSByZXF1aXJlKCdkZWJvdW5jZScpO1xuXG52YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuZnVuY3Rpb24gcmVidWlsZCAoKSB7XG4gIHZhciBjb250ZW50ID0gZG9jLmdldFZhbHVlKCk7XG4gIHZhciBkID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhjb250ZW50LCAnYXBwbGljYXRpb24veG1sJyk7XG4gIC8vIFN0YXJ0IGRlc2NlbnQgZnJvbSB0aGUgc2NlbmUgdGFnLCBub3QgdGhlIFhNTERvY3VtZW50IHBhcmVudFxuICBpZiAoIWQuY2hpbGRyZW4ubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ25vIGNoaWxkIG5vZGVzJyk7XG4gIHZhciBzY2VuZSA9IHJlY3Vyc2l2ZURlc2NlbmQoZC5jaGlsZHJlblswXSwgbnVsbCwgbnVsbCk7XG4gIChmdW5jdGlvbiByZW5kZXIgKCkge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICAgIHNjZW5lLnJlbmRlcmVyLnJlbmRlcihzY2VuZS5zY2VuZSwgc2NlbmUuY2FtZXJhKTtcbiAgfSkoKTtcbn07XG5cbi8vIHByZSBvcmRlciBkZXB0aCBmaXJzdFxudmFyIGNvdW50ZXIgPSAwO1xuZnVuY3Rpb24gcmVjdXJzaXZlRGVzY2VuZCAobm9kZSwgc2NlbmUsIGd1aSkge1xuICAgLy9jb25zb2xlLmxvZyhub2RlLCBub2RlLnRhZ05hbWUpO1xuICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ3NjZW5lJykge1xuICAgICBzY2VuZSA9IHJlbmQuaW5pdFNjZW5lKCk7XG4gICAgIGd1aSA9IHVpLmJ1aWxkVUkobnVsbCk7XG4gICB9IGVsc2UgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ2N1YmUnKSB7XG4gICAgIHZhciBtZXNoID0gcmVuZC5hZGRUb1NjZW5lKHNjZW5lLnNjZW5lLCAnY3ViZScpO1xuICAgICBndWkgPSBndWkuYWRkRm9sZGVyKCdjdWJlJyArIGNvdW50ZXIrKyk7XG4gICAgIHVpLmFkZFRyYW5zZm9ybXMoZ3VpLCBub2RlLCBtZXNoKTtcbiAgIH0gZWxzZSBpZiAobm9kZS50YWdOYW1lID09PSAnc3BoZXJlJykge1xuICAgICB2YXIgbWVzaCA9IHJlbmQuYWRkVG9TY2VuZShzY2VuZS5zY2VuZSwgJ3NwaGVyZScpO1xuICAgICBndWkgPSBndWkuYWRkRm9sZGVyKCdzcGhlcmUnICsgY291bnRlcisrKTtcbiAgICAgdWkuYWRkVHJhbnNmb3JtcyhndWksIG5vZGUsIG1lc2gpO1xuICAgfSBlbHNlIGlmIChub2RlLnRhZ05hbWUgPT09ICdncm91cCcpIHtcbiAgICAgZ3VpID0gZ3VpLmFkZEZvbGRlcignZ3JvdXAnICsgY291bnRlcisrKTtcbiAgIH1cbiAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgIC8vY29uc29sZS5sb2cobm9kZS5jaGlsZHJlbltpXSk7XG4gICAgIHJlY3Vyc2l2ZURlc2NlbmQobm9kZS5jaGlsZHJlbltpXSwgc2NlbmUsIGd1aSk7XG4gICB9XG4gICBpZiAoc2NlbmUpIHJldHVybiBzY2VuZTtcbn07XG5cbmRvYy5vbigndXBkYXRlJywgZGVib3VuY2UocmVidWlsZCwgMTAwMCkpO1xucmVidWlsZCgpO1xuXG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgbm93ID0gcmVxdWlyZSgnZGF0ZS1ub3cnKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gKiBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gKiBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAqIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gKlxuICogQHNvdXJjZSB1bmRlcnNjb3JlLmpzXG4gKiBAc2VlIGh0dHA6Ly91bnNjcmlwdGFibGUuY29tLzIwMDkvMDMvMjAvZGVib3VuY2luZy1qYXZhc2NyaXB0LW1ldGhvZHMvXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jdGlvbiB0byB3cmFwXG4gKiBAcGFyYW0ge051bWJlcn0gdGltZW91dCBpbiBtcyAoYDEwMGApXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHdoZXRoZXIgdG8gZXhlY3V0ZSBhdCB0aGUgYmVnaW5uaW5nIChgZmFsc2VgKVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSl7XG4gIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcbiAgaWYgKG51bGwgPT0gd2FpdCkgd2FpdCA9IDEwMDtcblxuICBmdW5jdGlvbiBsYXRlcigpIHtcbiAgICB2YXIgbGFzdCA9IG5vdygpIC0gdGltZXN0YW1wO1xuXG4gICAgaWYgKGxhc3QgPCB3YWl0ICYmIGxhc3QgPiAwKSB7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIGlmICghaW1tZWRpYXRlKSB7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24gZGVib3VuY2VkKCkge1xuICAgIGNvbnRleHQgPSB0aGlzO1xuICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgdGltZXN0YW1wID0gbm93KCk7XG4gICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgaWYgKCF0aW1lb3V0KSB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgaWYgKGNhbGxOb3cpIHtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IERhdGUubm93IHx8IG5vd1xuXG5mdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG59XG4iLCIvLyBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL2Jsb2IvbWFzdGVyL2V4YW1wbGVzL2NhbnZhc19nZW9tZXRyeV9oaWVyYXJjaHkuaHRtbCNMNTctTDczXG5mdW5jdGlvbiBpbml0U2NlbmUgKCkge1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5oZWlnaHQgPSA0MDA7XG4gIGNhbnZhcy5zdHlsZS5ib3JkZXIgPSAnMXB4IGRhc2hlZCBibHVlJztcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xuICB2YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg3NSwgY2FudmFzLndpZHRoIC8gY2FudmFzLmhlaWdodCwgMC4xLCAxMDAwKTtcbiAgY2FtZXJhLnBvc2l0aW9uLnogPSA1O1xuICBjYW1lcmEucG9zaXRpb24ueSA9IDE7XG4gIC8vY2FtZXJhLmxvb2tBdCgwLCAwLCAwKTtcbiAgdmFyIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBjYW52YXM6IGNhbnZhcyB9KTtcbiAgcmVuZGVyZXIuc2V0U2l6ZShjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG4gIC8vIEZsb29yXG4gIHZhciBmbG9vciA9IG5ldyBUSFJFRS5DaXJjbGVHZW9tZXRyeSgxMDAsIDE2KTtcbiAgZmxvb3IuYXBwbHlNYXRyaXgobmV3IFRIUkVFLk1hdHJpeDQoKS5tYWtlUm90YXRpb25YKC1NYXRoLlBJIC8gMikpO1xuICB2YXIgdGV4dHVyZSA9IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoJ2NoZWNrZXJib2FyZC5wbmcnKTtcbiAgdGV4dHVyZS5yZXBlYXQuc2V0KDEwMCwgMTAwKTtcbiAgdGV4dHVyZS53cmFwUyA9IHRleHR1cmUud3JhcFQgPSBUSFJFRS5SZXBlYXRXcmFwcGluZztcbiAgdmFyIG1hdGVyaWFsMiA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgbWFwOiB0ZXh0dXJlLFxuICB9KTtcbiAgdmFyIGZsb29yT2JqID0gbmV3IFRIUkVFLk1lc2goZmxvb3IsIG1hdGVyaWFsMik7XG4gIC8vZmxvb3JPYmoucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gIHNjZW5lLmFkZChmbG9vck9iaik7XG4gIC8vY29uc29sZS5sb2coc2NlbmUpO1xuICByZXR1cm4ge1xuICAgIHJlbmRlcmVyOiByZW5kZXJlcixcbiAgICBzY2VuZTogc2NlbmUsXG4gICAgY2FtZXJhOiBjYW1lcmEsXG4gIH07XG59O1xuXG5mdW5jdGlvbiBhZGRUb1NjZW5lIChzY2VuZSwgdHlwZSkge1xuICB2YXIgZ2VvbWV0cnk7XG4gIGlmICh0eXBlID09PSAnY3ViZScpIHtcbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSgxLCAxLCAxKTtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3BoZXJlJykge1xuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KDAuNSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1bnJlY29nbml6ZWQgdHlwZScpO1xuICB9XG4gIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCggeyBjb2xvcjogMHgwMGZmMDAgfSApO1xuICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gIC8vaWYgKHR5cGUgPT09ICdzcGhlcmUnKSBtZXNoLnBvc2l0aW9uLnggPSAxLjA7IC8vXG4gIHNjZW5lLmFkZChtZXNoKTtcbiAgcmV0dXJuIG1lc2g7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdFNjZW5lOiBpbml0U2NlbmUsXG4gIGFkZFRvU2NlbmU6IGFkZFRvU2NlbmUsXG59O1xuXG4iXX0=
