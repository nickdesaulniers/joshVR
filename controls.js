var dat = require('dat-gui');
var meshHelper = require('./mesh_helper');

function buildUI () { return new dat.GUI(); };

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

// given a tag, add its transforms and ui
function addTransforms (gui, tag, mesh, writeBack) {
  meshHelper.forEachAttribute(tag, function (attr) {
    var props = meshHelper.getPropertiesFromAttrName(attr.name);
    if (props.length > 1) {
      var folder = findOrCreateFolder(gui, props[0]);
      // order of setDefaultVale and addControls is important
      // cast to double important
      meshHelper.setDefaultValue(mesh, props, +attr.value);
      addControls(folder, mesh, props, writeBack);
    }
  });
};

module.exports = {
  buildUI: buildUI,
  addTransforms: addTransforms,
};

