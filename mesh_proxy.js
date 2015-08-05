function handler (internal, getter, setter) {
  return {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  };
};

function def (original, proxy, sharedProp, prop) {
  Object.defineProperty(proxy[sharedProp], prop,
    handler(original[sharedProp][prop], function () {
      return original[sharedProp][prop];
    },function (newValue) {
      console.log('mesh proxy!!!', original[sharedProp][prop], newValue);
      original[sharedProp][prop] = newValue;
    }));
};

function MeshProxy (mesh) {
  var proxy = {
    rotation: {},
    //position: { x: 0, y: 0, z: 0, },
    //scale: { x: 1, y: 1, z: 1, },
    position: {},
    scale: {},
  };
  //Object.defineProperty(proxy.rotation, 'y', handler(mesh.rotation.y, function (newValue) {
    //console.log('mesh proxy!!', mesh.rotation.y, newValue);
    //mesh.rotation.y = newValue;
  //}));
  var sharedProps = ['rotation', 'position', 'scale'];
  var props = ['x', 'y', 'z'];
  for (var i = 0; i < sharedProps.length; ++i) {
    for (var j = 0; j < props.length; ++j) {
      def(mesh, proxy, sharedProps[i], props[j]);
    }
  }
  return proxy;
};

module.exports = MeshProxy;

