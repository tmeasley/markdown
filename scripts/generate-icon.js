#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

async function main() {
  const source = path.join(__dirname, '..', 'assets', 'icon.png');
  const target = path.join(__dirname, '..', 'assets', 'icon.ico');

  if (!fs.existsSync(source)) {
    console.error('Missing source icon at', source);
    process.exit(1);
  }

  const converter = pngToIco.default || pngToIco;
  const buffer = await converter([source]);

  fs.writeFileSync(target, buffer);
  console.log('Generated multi-size icon at', target);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
