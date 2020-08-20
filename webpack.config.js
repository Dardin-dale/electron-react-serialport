const webpack = require('webpack');

module.exports = {
  entry: [
    './src/index.js',
    'webpack/hot/dev-server',
    'webpack-dev-server/client?http://localhost:8082/'
  ],
  output: {
    path: __dirname + '/public',
    publicPath: '/',
    filename: 'app.js'
  },
  target:"electron-renderer",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  devServer: {
    contentBase: './public',
    hot: true,
    port: 8082
  },
  externals: {serialport: true}
};
