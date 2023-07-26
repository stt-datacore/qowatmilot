const fs = require('fs');

let data = JSON.parse(fs.readFileSync(__dirname + '/allcrew.json', 'utf8'));

const diffs = {};

data.forEach((crew) => {
  Object.keys(crew.max_skills).forEach((skill) => {
    const base = crew.max_skills[skill].core;
    const ff = crew.max_fully_fused_skills[skill].core;
    const diff = ff - base;
    if (!diffs[diff.toString()]) {
      diffs[diff.toString()] = [];
    }
    diffs[diff.toString()].push(crew.symbol);
  })
})

Object.keys(diffs).forEach((diff) => {
  const d = diffs[diff];
  if (d.length < 50) {
    console.log(diff, d);
  }
})