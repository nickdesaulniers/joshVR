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
  var rsc = rend.initScene();
  var gui = ui.buildUI();
  recursiveDescend(d.children[0], rsc.scene, gui);
  (function render () {
    requestAnimationFrame(render);
    rsc.renderer.render(rsc.scene, rsc.camera);
  })();
};

// pre order depth first
var counter = 0;
function recursiveDescend (node, scene, gui) {
   //console.log(node, node.tagName);
   if (node.tagName === 'cube') {
     var mesh = rend.addToScene(scene, 'cube');
     gui = gui.addFolder('cube' + counter++);
     ui.addTransforms(gui, node, mesh);
   } else if (node.tagName === 'sphere') {
     var mesh = rend.addToScene(scene, 'sphere');
     gui = gui.addFolder('sphere' + counter++);
     ui.addTransforms(gui, node, mesh);
   } else if (node.tagName === 'group') {
     var mesh = rend.createGroup();
     scene.add(mesh);
     scene = mesh;
     gui = gui.addFolder('group' + counter++);
     ui.addTransforms(gui, node, mesh);
   }
   for (var i = 0, len = node.children.length; i < len; ++i) {
     //console.log(node.children[i]);
     recursiveDescend(node.children[i], scene, gui);
   }
   return scene;
};

doc.on('update', debounce(rebuild, 1000));
rebuild();

