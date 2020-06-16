const path = require('path');

module.exports = {
  entry: './main.js',
  module: {
    rules: [{
      include: /src/
    }]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};