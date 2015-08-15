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

