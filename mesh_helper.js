function forEachAttribute (tag, cb) {
  for (var i = 0, len = tag.attributes.length; i < len; ++i) {
    cb(tag.attributes[i]);
  }
};

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

module.exports = {
  forEachAttribute, forEachAttribute,
  getPropertiesFromAttrName: getPropertiesFromAttrName,
  setDefaultValue: setDefaultValue,
};
