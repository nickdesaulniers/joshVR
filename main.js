// watchify main.js -o dist.js -v -d
var mirror = require('./code_mirror');
var rend = require('./three.js');
var ui = require('./dat_gui');
var debounce = require('debounce');

var parser = new DOMParser;
var ctx = {
  rsc: null,
  gui: null,
  raf: null,
  doc: null,
};

var counter = 0;
function rebuild () {
  if (mirror.writeBackCausedUpdate()) return;
  destroyCtx();
  var content = mirror.doc.getValue();
  ctx.doc = parser.parseFromString(content, 'application/xml');
  // Start descent from the scene tag, not the XMLDocument parent
  if (!ctx.doc.children.length) throw new Error('no child nodes');
  // TODO: this could be nicer
  mirror.cb = mirror.writeBack(ctx.doc);
  ctx.rsc = rend.initScene();
  ctx.gui = ui.buildUI();
  recursiveDescend(ctx.doc.children[0], ctx.rsc.scene, ctx.gui);
  (function render () {
    ctx.raf = requestAnimationFrame(render);
    ctx.rsc.renderer.render(ctx.rsc.scene, ctx.rsc.camera);
  })();
};

function destroyCtx () {
  counter = 0;
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
function recursiveDescend (node, scene, gui) {
   //console.log(node, node.tagName);
   // TODO: DRY
   if (node.tagName === 'cube') {
     var mesh = rend.addToScene(scene, node);
     gui = gui.addFolder(node.tagName + counter++);
     ui.addTransforms(gui, node, mesh, mirror.cb);
   } else if (node.tagName === 'sphere') {
     var mesh = rend.addToScene(scene, node);
     gui = gui.addFolder(node.tagName + counter++);
     ui.addTransforms(gui, node, mesh, mirror.cb);
   } else if (node.tagName === 'group') {
     var group = rend.createGroup(scene, node);
     scene = group;
     gui = gui.addFolder(node.tagName + counter++);
     ui.addTransforms(gui, node, group, mirror.cb);
   }
   for (var i = 0, len = node.children.length; i < len; ++i) {
     recursiveDescend(node.children[i], scene, gui);
   }
};

mirror.doc.on('update', debounce(rebuild, 1000));
rebuild();
document.body.style.margin = 0;

