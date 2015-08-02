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

