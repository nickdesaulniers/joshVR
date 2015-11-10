var defaultText = [
  '<scene>',
  '  <group translateY="1.0" rotateY="0.78">',
  '    <cube scaleX="2.75" translateY="1.0" color="#0000FF"/>',
  '    <sphere translateX="1.0" color="red"/>',
  '    <sphere translateX="-1.0"/>',
  '    <cylinder translateX="3.0"/>',
  '    <cone translateX="-3.0"/>',
  '    <pyramid translateX="2.0" translateY="2.5"/>',
  '  </group>',
  '  <portal translateX="-4.00" translateZ="-3.82" translateY="4.00"',
  '          src="https://gist.githubusercontent.com/anonymous/f8ee950bb3ad57107dc4/raw/ed5713c3dfc9d83e907555c5bb017ea68e332e4b/joshVR.xml"/>',
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

