#!/usr/bin/env node
const program = require('commander');
const seeder = require('./index.js');
const { join } = require('path');
const packageConfig = require('./package.json');

function loadConfig(location) {
  if (process && typeof location !== 'object') {
    return require(join(process.cwd(), location));
  }
  return location;
}

program
  .version(packageConfig.version)
  .option('-c, --config <config>', 'Configuration file, default ./seeds.json', loadConfig, null)
  .arguments('[datasoures...]')
  .parse(process.argv);

if (!program.config) {
  program.config = require(join(process.cwd(), 'seeds.json'));
}

module.exports = seeder(program, process.cwd())
  .then(() => process.exit(0))
  .catch((error) => { throw error; });
