var defaultText = [
  '<scene>',
  '  <group translateY="1.0" rotateY="45">',
  '    <cube scaleX="2.75" translateY="1.0"/>',
  '    <sphere translateX="1.0"/>',
  '    <sphere translateX="-1.0"/>',
  '  </group>',
  '</scene>'
].join('\n');
var div = document.createElement('div');
div.style.width = '50%';
div.style.border = '1px dashed black';
document.body.appendChild(div);
var doc = CodeMirror(div, {
  lineNumbers: true,
  mode: 'xml',
  value: defaultText,
  theme: 'monokai',
});
window.doc = doc; //
// we'll use doc.replaceRange("hi", CodeMirror.Pos(1, 5), CodeMirror.Pos(1, 7))

var serializer = new XMLSerializer;
function writeBack (xmlDocument) {
  console.log('writeback!', xmlDocument);
  doc.setValue(serializer.serializeToString(xmlDocument));
};

module.exports = {
  doc: doc,
  writeBack: writeBack,
};

