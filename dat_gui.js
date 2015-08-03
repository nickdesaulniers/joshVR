//var name = gui.addFolder('Name');
////name.add({ plunks: 0 }, 'plunks');
////name.addColor({ color: '#F00' }, 'color');
////gui.add({ message: '', }, 'message');
// http://workshop.chromeexperiments.com/examples/gui/#10--Updating-the-Display-Manually
function buildUI () { return new dat.GUI(); };

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

