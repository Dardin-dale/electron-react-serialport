const webpack = require('webpack');
const path = require('path');

const defaultInclude = path.resolve(__dirname, 'src')


module.exports = [
  
  {
    entry: './src/index.js',
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
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
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
        }
      ]

    },
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'build'),
    },
    resolve: { extensions: ['.json', '.js', '.jsx','.css']},
    externals: {
      serialport: 'serialport',
    },
    target: 'electron-renderer',
    node: {
      fs: "empty",
      __dirname: false
  },
}

];