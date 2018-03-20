const path = require('path');
const util = require('util');
const cp = require('child_process');
const execFile = util.promisify(cp.execFile);

const makefile = path.join(__dirname, '../Makefile');

module.exports = async () => {
  console.log(`\n`);
  const { stdout } = await execFile(makefile);
  console.log(stdout);
};
