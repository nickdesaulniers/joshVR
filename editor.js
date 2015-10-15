var defaultText = [
  '<scene>',
  '  <group translateY="1.0" rotateY="0.78">',
  '    <cube scaleX="2.75" translateY="1.0"/>',
  '    <sphere translateX="1.0"/>',
  '    <sphere translateX="-1.0"/>',
  '    <cylinder translateX="3.0"/>',
  '    <cone translateX="-3.0"/>',
  '    <pyramid translateX="2.0" translateY="2.5"/>',
  '  </group>',
  '</scene>'
].join('\n');

var doc = CodeMirror(document.getElementById('leftColumn'), {
  lineNumbers: true,
  mode: 'xml',
  value: defaultText,
  theme: 'monokai',
});

var skipOneUpdateFlag = false;
var serializer = new XMLSerializer;
function writeBack (xmlDocument) {
  return function () {
    skipOneUpdateFlag = true;
    doc.setValue(serializer.serializeToString(xmlDocument));
  };
};

function writeBackCausedUpdate () {
  if (skipOneUpdateFlag) {
    skipOneUpdateFlag = false;
    return true;
  }
  return false;
};

module.exports = {
  doc: doc,
  writeBack: writeBack,
  writeBackCausedUpdate: writeBackCausedUpdate,
};

