const webpack = require('webpack');
const path = require('path');
//const HtmlWebPackPlugin = require("html-webpack-plugin");

const defaultInclude = path.resolve(__dirname, 'src')
const ElectronNativePlugin = require("electron-native-plugin");

// const htmlPlugin = new HtmlWebPackPlugin({
//   template: "./src/index.html"
// });

module.exports = [
  
  {
    mode: 'development',
    entry: './main.js',
    module: {
        rules: [ {
          test: /\.css$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
          include: defaultInclude
        },
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'electron-native-loader',
            options: {
              presets: ['@babel/preset-env'],
              outputPath: './build'
            }
          }
        },
        {
          test: /\.(jpe?g|png|gif)$/,
          use: [{ loader: 'file-loader?name=img/[name]__[hash:base64:5].[ext]' }],
          include: defaultInclude
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          use: [{ loader: 'file-loader?name=font/[name]__[hash:base64:5].[ext]' }],
          include: defaultInclude
        },
        {
          test: /\.node$/,
          use: "electron-native-loader" 
        }
      ]

      },
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'build'),
    },
    // externals: {
    //   serialport: 'serialport',
    // },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new ElectronNativePlugin(),
      new webpack.IgnorePlugin(/node-gyp/)
    ],
    devServer: {
      contentBase: './build',
      hot: true,
      port: 8082
    },
    target: 'electron-main',
    // devtool: 'cheap-module-source-map',
    //this is from a webpack bug
    node: {
      fs: "empty",
      __dirname: false
  },
}

];