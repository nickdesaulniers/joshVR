var defaultText = [
  '<scene>',
  '  <group>',
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
  theme: 'solarized dark',
});
window.doc = doc; //
// we'll use doc.replaceRange("hi", CodeMirror.Pos(1, 5), CodeMirror.Pos(1, 7))

module.exports = {
  doc: doc,
};
