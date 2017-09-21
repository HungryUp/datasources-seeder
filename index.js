#!/usr/bin/env node
const program = require('commander');
const { promisify } = require('util');
const fs = require('fs');
const { join } = require('path');
const packageConfig = require('./package.json');
const readdir = promisify(fs.readdir);

function loadConfig(location) {
  if (process && typeof location !== "object") {
    return require(join(process.cwd(), location));
  }
  return location;
}

program
  .version(packageConfig.version)
  .option('-c, --config <config>', 'Configuration file, default ./seeds.json', loadConfig, null)
  .arguments('[datasoures...]')
  .parse(process.argv)

if (!program.config) {
  program.config = require(join(process.cwd(), 'seeds.json'));
}

const { config, args } = program;
const sources = (args.length > 0 ? args : Object.keys(config.sources))
  .reduce((obj, key) => {
    obj[key] = config.sources[key] || {};
    return obj;
  }, {});


const sourceNames = Object.keys(sources);
const seeding = [];
for (const sourceName of sourceNames) {
  seeding.push((async () => {
    const source = sources[sourceName];
    const files = await readdir(join(process.cwd(), source.path));
    const { seed, init, end } = require(join(process.cwd(), 'node_modules', source.driver));
    const db = await init(source);
    await seed(db, source, files);
    await end(db, source);
  })());
}

Promise
  .all(seeding)
  .then(r => process.exit(0))
  .catch(error => { throw error });

