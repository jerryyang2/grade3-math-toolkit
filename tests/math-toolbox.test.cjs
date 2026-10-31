const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { definitions, transformPoint, fitInstrument, markFor, svgContent } = require('../js/math-toolbox.js');

function close(actual, expected) { assert.ok(Math.abs(actual - expected) < .00001, `${actual} != ${expected}`); }
function instrument(type, overrides = {}) { return { type, x: 500, y: 400, scale: 1, angle: 0, radius: 2.5, ...overrides }; }

test('ruler marks follow its actual zero and ten-centimeter ticks after rotation and scaling', () => {
  for (const angle of [0, 45, 90, -90, 180, 360]) {
    const ruler = instrument('ruler', { angle, scale: .75 });
    const mark = markFor(ruler);
    assert.deepEqual(mark.start, transformPoint(ruler, { x: 20, y: 0 }));
    assert.deepEqual(mark.end, transformPoint(ruler, { x: 420, y: 0 }));
    close(Math.hypot(mark.end.x - mark.start.x, mark.end.y - mark.start.y), 300);
  }
});
test('compass marks preserve the needle position and the selected radius', () => {
  for (const radius of [.5, 1, 2.5, 3.5]) {
    const compass = instrument('compass', { angle: 135, scale: .8, radius });
    const mark = markFor(compass);
    assert.equal(mark.type, 'circle');
    close(mark.x, compass.x); close(mark.y, compass.y);
    close(mark.radius, radius * 40 * .8);
    assert.match(svgContent('compass', radius), new RegExp(`r="${radius * 40}"`));
  }
});
test('all rotated instruments fit within phone, landscape and desktop viewports', () => {
  for (const type of Object.keys(definitions)) {
    for (const [width, height] of [[320, 568], [812, 375], [1440, 900]]) {
      for (const angle of [0, 30, 45, 90, 135, 270]) {
        const item = fitInstrument(instrument(type, { x: -200, y: 4000, scale: 1.4, angle }), width, height);
        const definition = definitions[type];
        for (const point of [{ x: 0, y: 0 }, { x: definition.width, y: 0 }, { x: 0, y: definition.height }, { x: definition.width, y: definition.height }]) {
          const result = transformPoint(item, point);
          assert.ok(result.x >= 11.999 && result.x <= width - 11.999);
          assert.ok(result.y >= 45.999 && result.y <= height - 11.999);
        }
      }
    }
  }
});
test('set squares preserve their advertised angles and baseline drawing edges', () => {
  close(Math.atan(definitions.triangle45.height / definitions.triangle45.width) * 180 / Math.PI, 45);
  assert.ok(Math.abs(Math.atan(definitions.triangle30.height / definitions.triangle30.width) * 180 / Math.PI - 30) < .1);
  for (const type of ['triangle45', 'triangle30']) {
    const item = instrument(type, { angle: 90 });
    const line = markFor(item);
    close(Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y), definitions[type].width);
  }
});
test('protractor has two opposing scales with all five-degree ticks', () => {
  const svg = svgContent('protractor');
  assert.equal((svg.match(/<text /g) || []).length, 38);
  assert.equal((svg.match(/stroke="#806121"/g) || []).length, 37);
  assert.match(svg, />180<\/text>/);
  assert.match(svg, />90<\/text>/);
});

test('main page and all five games load toolbox assets once in the actual document', () => {
  const root = path.join(__dirname, '..');
  const pages = ['index.html', ...fs.readdirSync(path.join(root, 'games')).map(folder => `games/${folder}/index.html`)];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const head = html.slice(0, html.indexOf('</head>'));
    assert.match(head, /href="(?:\.\.\/\.\.\/)?css\/math-toolbox\.css\?/);
    assert.equal((html.match(/css\/math-toolbox\.css/g) || []).length, 1);
    assert.equal((html.match(/js\/math-toolbox\.js/g) || []).length, 1);
    assert.match(html.slice(html.lastIndexOf('<script')), /js\/math-toolbox\.js/);
  }
});
