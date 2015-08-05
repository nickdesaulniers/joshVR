// watchify main.js -o dist.js -v -d
var doc = require('./code_mirror').doc;
var rend = require('./three.js');
var ui = require('./dat_gui');
var debounce = require('debounce');

var parser = new DOMParser();
var ctx = {
  rsc: null,
  gui: null,
  raf: null,
};
function rebuild () {
  destroyCtx();
  var content = doc.getValue();
  var d = parser.parseFromString(content, 'application/xml');
  // Start descent from the scene tag, not the XMLDocument parent
  if (!d.children.length) throw new Error('no child nodes');
  ctx.rsc = rend.initScene();
  ctx.gui = ui.buildUI();
  recursiveDescend(d.children[0], ctx.rsc.scene, ctx.gui);
  (function render () {
    ctx.raf = requestAnimationFrame(render);
    ctx.rsc.renderer.render(ctx.rsc.scene, ctx.rsc.camera);
  })();
};
function destroyCtx () {
  if (ctx.rsc) {
    document.getElementsByTagName('canvas')[0].remove();
    ctx.rsc = null;
  }
  if (ctx.gui) {
    ctx.gui.destroy();
    ctx.gui = null;
  }
  if (ctx.rsc) {
    ctx.rsc = null;
  }
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
     var group = rend.createGroup();
     scene.add(group);
     scene = group;
     gui = gui.addFolder('group' + counter++);
     ui.addTransforms(gui, node, group);
   }
   for (var i = 0, len = node.children.length; i < len; ++i) {
     //console.log(node.children[i]);
     recursiveDescend(node.children[i], scene, gui);
   }
   //return scene;
};

doc.on('update', debounce(rebuild, 1000));
rebuild();

