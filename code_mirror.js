function divSoup () {
  var d1 = document.createElement('div');
  var d2 = document.createElement('div');
  d1.style.width = '50%';
  d1.style.display = 'inline-block';
  document.body.appendChild(d1);
  d1.appendChild(d2);
  return d2;
};

var defaultText = [
  '<scene>',
  '  <group translateY="1.0" rotateY="0.78">',
  '    <cube scaleX="2.75" translateY="1.0"/>',
  '    <sphere translateX="1.0"/>',
  '    <sphere translateX="-1.0"/>',
  '  </group>',
  '</scene>'
].join('\n');

var doc = CodeMirror(divSoup(), {
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

