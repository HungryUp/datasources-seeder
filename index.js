const { promisify } = require('util');
const fs = require('fs');
const { join } = require('path');

const readdir = promisify(fs.readdir);

module.exports = async ({ config = {}, args = [] }, workingDir) => {
  const sources = (args.length > 0 ? args : Object.keys(config.sources || {}))
    .reduce((obj, key) => {
      obj[key] = config.sources[key] || {};
      return obj;
    }, {});


  const sourceNames = Object.keys(sources);
  const seeding = [];
  for (const sourceName of sourceNames) {
    seeding.push((async () => {
      const source = sources[sourceName];
      const files = await readdir(join(workingDir, source.path));
      const driverPath = join(workingDir, 'node_modules', source.driver);
      const driver = require(driverPath);
      const { seed, init, end } = driver(source, workingDir);
      const db = await init();
      await seed(db, files);
      await end(db);
    })());
  }

  return Promise
    .all(seeding);
};
