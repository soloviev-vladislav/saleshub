const fs = require('fs');
const { dataPath } = require('../config');

const log = (message) => {
  const timestamp = new Date().toLocaleString('ru-RU');
  fs.appendFileSync(dataPath.log, `${timestamp}: ${message}\n`);
};

module.exports = { log };