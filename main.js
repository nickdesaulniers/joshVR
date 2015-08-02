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

