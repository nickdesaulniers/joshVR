(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var defaultText = [
  '<scene>',
  '  <group>',
  '    <cube scaleX="0.5" translateY="2.0"/>',
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

function getPropertiesFromAttrName (attrName) {
  if (attrName === 'scaleX') {
    return ['scale', 'scale', 'x'];
  } else if (attrName === 'translateX') {
    return ['translate', 'position', 'x'];
  } else {
    return [];
  }
};

function addControls (gui, mesh, props) {
  gui.add(mesh[props[1]], props[2], 0, 10);
};

function addTransforms (gui, tag, mesh) {
  //console.log(tag, mesh);
  //console.log(tag.attributes, tag.getAttribute);
  for (var i = 0, len = tag.attributes.length; i < len; ++i) {
    //console.log(tag.tagName, tag.attributes[i].name, tag.attributes[i].value);
    var props = getPropertiesFromAttrName(tag.attributes[i].name);
    ////scaleFolder.add(cube.scale, 'x', 0, 10);
    if (props.length > 1) {
      gui = gui.addFolder(props[0]);
      addControls(gui, mesh, props);
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


},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92MC4xMi4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNvZGVfbWlycm9yLmpzIiwiZGF0X2d1aS5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvZGVib3VuY2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVib3VuY2Uvbm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwidGhyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGRlZmF1bHRUZXh0ID0gW1xuICAnPHNjZW5lPicsXG4gICcgIDxncm91cD4nLFxuICAnICAgIDxjdWJlIHNjYWxlWD1cIjAuNVwiIHRyYW5zbGF0ZVk9XCIyLjBcIi8+JyxcbiAgJyAgICA8c3BoZXJlIHRyYW5zbGF0ZVg9XCIxLjBcIi8+JyxcbiAgJyAgICA8c3BoZXJlIHRyYW5zbGF0ZVg9XCItMS4wXCIvPicsXG4gICcgIDwvZ3JvdXA+JyxcbiAgJzwvc2NlbmU+J1xuXS5qb2luKCdcXG4nKTtcbnZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbmRpdi5zdHlsZS53aWR0aCA9ICc1MCUnO1xuZGl2LnN0eWxlLmJvcmRlciA9ICcxcHggZGFzaGVkIGJsYWNrJztcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGl2KTtcbnZhciBkb2MgPSBDb2RlTWlycm9yKGRpdiwge1xuICBsaW5lTnVtYmVyczogdHJ1ZSxcbiAgbW9kZTogJ3htbCcsXG4gIHZhbHVlOiBkZWZhdWx0VGV4dCxcbiAgdGhlbWU6ICdzb2xhcml6ZWQgZGFyaycsXG59KTtcbndpbmRvdy5kb2MgPSBkb2M7IC8vXG4vLyB3ZSdsbCB1c2UgZG9jLnJlcGxhY2VSYW5nZShcImhpXCIsIENvZGVNaXJyb3IuUG9zKDEsIDUpLCBDb2RlTWlycm9yLlBvcygxLCA3KSlcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRvYzogZG9jLFxufTtcbiIsIi8vdmFyIG5hbWUgPSBndWkuYWRkRm9sZGVyKCdOYW1lJyk7XG4vLy8vbmFtZS5hZGQoeyBwbHVua3M6IDAgfSwgJ3BsdW5rcycpO1xuLy8vL25hbWUuYWRkQ29sb3IoeyBjb2xvcjogJyNGMDAnIH0sICdjb2xvcicpO1xuLy8vL2d1aS5hZGQoeyBtZXNzYWdlOiAnJywgfSwgJ21lc3NhZ2UnKTtcbi8vIGh0dHA6Ly93b3Jrc2hvcC5jaHJvbWVleHBlcmltZW50cy5jb20vZXhhbXBsZXMvZ3VpLyMxMC0tVXBkYXRpbmctdGhlLURpc3BsYXktTWFudWFsbHlcbmZ1bmN0aW9uIGJ1aWxkVUkgKGN1YmUpIHtcbiAgdmFyIGd1aSA9IG5ldyBkYXQuR1VJKCk7XG4gIHdpbmRvdy5ndWkgPSBndWk7XG4gIHJldHVybiBndWk7XG59O1xuXG5mdW5jdGlvbiBnZXRQcm9wZXJ0aWVzRnJvbUF0dHJOYW1lIChhdHRyTmFtZSkge1xuICBpZiAoYXR0ck5hbWUgPT09ICdzY2FsZVgnKSB7XG4gICAgcmV0dXJuIFsnc2NhbGUnLCAnc2NhbGUnLCAneCddO1xuICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSAndHJhbnNsYXRlWCcpIHtcbiAgICByZXR1cm4gWyd0cmFuc2xhdGUnLCAncG9zaXRpb24nLCAneCddO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbXTtcbiAgfVxufTtcblxuZnVuY3Rpb24gYWRkQ29udHJvbHMgKGd1aSwgbWVzaCwgcHJvcHMpIHtcbiAgZ3VpLmFkZChtZXNoW3Byb3BzWzFdXSwgcHJvcHNbMl0sIDAsIDEwKTtcbn07XG5cbmZ1bmN0aW9uIGFkZFRyYW5zZm9ybXMgKGd1aSwgdGFnLCBtZXNoKSB7XG4gIC8vY29uc29sZS5sb2codGFnLCBtZXNoKTtcbiAgLy9jb25zb2xlLmxvZyh0YWcuYXR0cmlidXRlcywgdGFnLmdldEF0dHJpYnV0ZSk7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0YWcuYXR0cmlidXRlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIC8vY29uc29sZS5sb2codGFnLnRhZ05hbWUsIHRhZy5hdHRyaWJ1dGVzW2ldLm5hbWUsIHRhZy5hdHRyaWJ1dGVzW2ldLnZhbHVlKTtcbiAgICB2YXIgcHJvcHMgPSBnZXRQcm9wZXJ0aWVzRnJvbUF0dHJOYW1lKHRhZy5hdHRyaWJ1dGVzW2ldLm5hbWUpO1xuICAgIC8vLy9zY2FsZUZvbGRlci5hZGQoY3ViZS5zY2FsZSwgJ3gnLCAwLCAxMCk7XG4gICAgaWYgKHByb3BzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGd1aSA9IGd1aS5hZGRGb2xkZXIocHJvcHNbMF0pO1xuICAgICAgYWRkQ29udHJvbHMoZ3VpLCBtZXNoLCBwcm9wcyk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYnVpbGRVSTogYnVpbGRVSSxcbiAgYWRkVHJhbnNmb3JtczogYWRkVHJhbnNmb3Jtcyxcbn07XG5cbiIsIi8vIHdhdGNoaWZ5IG1haW4uanMgLW8gZGlzdC5qcyAtdiAtZFxudmFyIGRvYyA9IHJlcXVpcmUoJy4vY29kZV9taXJyb3InKS5kb2M7XG52YXIgcmVuZCA9IHJlcXVpcmUoJy4vdGhyZWUuanMnKTtcbnZhciB1aSA9IHJlcXVpcmUoJy4vZGF0X2d1aScpO1xudmFyIGRlYm91bmNlID0gcmVxdWlyZSgnZGVib3VuY2UnKTtcblxudmFyIHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcbmZ1bmN0aW9uIHJlYnVpbGQgKCkge1xuICB2YXIgY29udGVudCA9IGRvYy5nZXRWYWx1ZSgpO1xuICB2YXIgZCA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcoY29udGVudCwgJ2FwcGxpY2F0aW9uL3htbCcpO1xuICAvLyBTdGFydCBkZXNjZW50IGZyb20gdGhlIHNjZW5lIHRhZywgbm90IHRoZSBYTUxEb2N1bWVudCBwYXJlbnRcbiAgaWYgKCFkLmNoaWxkcmVuLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdubyBjaGlsZCBub2RlcycpO1xuICB2YXIgc2NlbmUgPSByZWN1cnNpdmVEZXNjZW5kKGQuY2hpbGRyZW5bMF0sIG51bGwsIG51bGwpO1xuICAoZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICBzY2VuZS5yZW5kZXJlci5yZW5kZXIoc2NlbmUuc2NlbmUsIHNjZW5lLmNhbWVyYSk7XG4gIH0pKCk7XG59O1xuXG4vLyBwcmUgb3JkZXIgZGVwdGggZmlyc3RcbnZhciBjb3VudGVyID0gMDtcbmZ1bmN0aW9uIHJlY3Vyc2l2ZURlc2NlbmQgKG5vZGUsIHNjZW5lLCBndWkpIHtcbiAgIC8vY29uc29sZS5sb2cobm9kZSwgbm9kZS50YWdOYW1lKTtcbiAgIGlmIChub2RlLnRhZ05hbWUgPT09ICdzY2VuZScpIHtcbiAgICAgc2NlbmUgPSByZW5kLmluaXRTY2VuZSgpO1xuICAgICBndWkgPSB1aS5idWlsZFVJKG51bGwpO1xuICAgfSBlbHNlIGlmIChub2RlLnRhZ05hbWUgPT09ICdjdWJlJykge1xuICAgICB2YXIgbWVzaCA9IHJlbmQuYWRkVG9TY2VuZShzY2VuZS5zY2VuZSwgJ2N1YmUnKTtcbiAgICAgZ3VpID0gZ3VpLmFkZEZvbGRlcignY3ViZScgKyBjb3VudGVyKyspO1xuICAgICB1aS5hZGRUcmFuc2Zvcm1zKGd1aSwgbm9kZSwgbWVzaCk7XG4gICB9IGVsc2UgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ3NwaGVyZScpIHtcbiAgICAgdmFyIG1lc2ggPSByZW5kLmFkZFRvU2NlbmUoc2NlbmUuc2NlbmUsICdzcGhlcmUnKTtcbiAgICAgZ3VpID0gZ3VpLmFkZEZvbGRlcignc3BoZXJlJyArIGNvdW50ZXIrKyk7XG4gICAgIHVpLmFkZFRyYW5zZm9ybXMoZ3VpLCBub2RlLCBtZXNoKTtcbiAgIH0gZWxzZSBpZiAobm9kZS50YWdOYW1lID09PSAnZ3JvdXAnKSB7XG4gICAgIGd1aSA9IGd1aS5hZGRGb2xkZXIoJ2dyb3VwJyArIGNvdW50ZXIrKyk7XG4gICB9XG4gICBmb3IgKHZhciBpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAvL2NvbnNvbGUubG9nKG5vZGUuY2hpbGRyZW5baV0pO1xuICAgICByZWN1cnNpdmVEZXNjZW5kKG5vZGUuY2hpbGRyZW5baV0sIHNjZW5lLCBndWkpO1xuICAgfVxuICAgaWYgKHNjZW5lKSByZXR1cm4gc2NlbmU7XG59O1xuXG5kb2Mub24oJ3VwZGF0ZScsIGRlYm91bmNlKHJlYnVpbGQsIDEwMDApKTtcbnJlYnVpbGQoKTtcblxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIG5vdyA9IHJlcXVpcmUoJ2RhdGUtbm93Jyk7XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICogYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICogTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gKiBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICpcbiAqIEBzb3VyY2UgdW5kZXJzY29yZS5qc1xuICogQHNlZSBodHRwOi8vdW5zY3JpcHRhYmxlLmNvbS8yMDA5LzAzLzIwL2RlYm91bmNpbmctamF2YXNjcmlwdC1tZXRob2RzL1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gd3JhcFxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXQgaW4gbXMgKGAxMDBgKVxuICogQHBhcmFtIHtCb29sZWFufSB3aGV0aGVyIHRvIGV4ZWN1dGUgYXQgdGhlIGJlZ2lubmluZyAoYGZhbHNlYClcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpe1xuICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG4gIGlmIChudWxsID09IHdhaXQpIHdhaXQgPSAxMDA7XG5cbiAgZnVuY3Rpb24gbGF0ZXIoKSB7XG4gICAgdmFyIGxhc3QgPSBub3coKSAtIHRpbWVzdGFtcDtcblxuICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID4gMCkge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICBpZiAoIWltbWVkaWF0ZSkge1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGRlYm91bmNlZCgpIHtcbiAgICBjb250ZXh0ID0gdGhpcztcbiAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIHRpbWVzdGFtcCA9IG5vdygpO1xuICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgIGlmICghdGltZW91dCkgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgIGlmIChjYWxsTm93KSB7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBEYXRlLm5vdyB8fCBub3dcblxuZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKVxufVxuIiwiZnVuY3Rpb24gaW5pdFNjZW5lICgpIHtcbiAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjYW52YXMud2lkdGggPSBjYW52YXMuaGVpZ2h0ID0gNDAwO1xuICBjYW52YXMuc3R5bGUuYm9yZGVyID0gJzFweCBkYXNoZWQgYmx1ZSc7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcbiAgdmFyIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gIHZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNzUsIGNhbnZhcy53aWR0aCAvIGNhbnZhcy5oZWlnaHQsIDAuMSwgMTAwMCk7XG4gIGNhbWVyYS5wb3NpdGlvbi56ID0gNTtcbiAgY2FtZXJhLnBvc2l0aW9uLnkgPSAxO1xuICAvL2NhbWVyYS5sb29rQXQoMCwgMCwgMCk7XG4gIHZhciByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgY2FudmFzOiBjYW52YXMgfSk7XG4gIHJlbmRlcmVyLnNldFNpemUoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuICAvLyBGbG9vclxuICB2YXIgZmxvb3IgPSBuZXcgVEhSRUUuQ2lyY2xlR2VvbWV0cnkoMTAwLCAxNik7XG4gIGZsb29yLmFwcGx5TWF0cml4KG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVJvdGF0aW9uWCgtTWF0aC5QSSAvIDIpKTtcbiAgdmFyIHRleHR1cmUgPSBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCdjaGVja2VyYm9hcmQucG5nJyk7XG4gIHRleHR1cmUucmVwZWF0LnNldCgxMDAsIDEwMCk7XG4gIHRleHR1cmUud3JhcFMgPSB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gIHZhciBtYXRlcmlhbDIgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgIG1hcDogdGV4dHVyZSxcbiAgfSk7XG4gIHZhciBmbG9vck9iaiA9IG5ldyBUSFJFRS5NZXNoKGZsb29yLCBtYXRlcmlhbDIpO1xuICAvL2Zsb29yT2JqLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICBzY2VuZS5hZGQoZmxvb3JPYmopO1xuICAvL2NvbnNvbGUubG9nKHNjZW5lKTtcbiAgcmV0dXJuIHtcbiAgICByZW5kZXJlcjogcmVuZGVyZXIsXG4gICAgc2NlbmU6IHNjZW5lLFxuICAgIGNhbWVyYTogY2FtZXJhLFxuICB9O1xufTtcblxuZnVuY3Rpb24gYWRkVG9TY2VuZSAoc2NlbmUsIHR5cGUpIHtcbiAgdmFyIGdlb21ldHJ5O1xuICBpZiAodHlwZSA9PT0gJ2N1YmUnKSB7XG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoMSwgMSwgMSk7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3NwaGVyZScpIHtcbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgwLjUpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcigndW5yZWNvZ25pemVkIHR5cGUnKTtcbiAgfVxuICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoIHsgY29sb3I6IDB4MDBmZjAwIH0gKTtcbiAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICBpZiAodHlwZSA9PT0gJ3NwaGVyZScpIG1lc2gucG9zaXRpb24ueCA9IDEuMDsgLy9cbiAgc2NlbmUuYWRkKG1lc2gpO1xuICByZXR1cm4gbWVzaDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbml0U2NlbmU6IGluaXRTY2VuZSxcbiAgYWRkVG9TY2VuZTogYWRkVG9TY2VuZSxcbn07XG5cbiJdfQ==
