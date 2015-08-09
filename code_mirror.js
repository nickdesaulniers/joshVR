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
  '  <group translateY="1.0" rotateY="45">',
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

var serializer = new XMLSerializer;
function writeBack (xmlDocument) {
  console.log('writeback!', xmlDocument);
  doc.setValue(serializer.serializeToString(xmlDocument));
};

module.exports = {
  doc: doc,
  writeBack: writeBack,
};

