const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  {
    entry: {
      app: './src/index.js',
   },
    output: {
      path: path.resolve(__dirname, "public/bundle"),
      filename: "[name].js",
      clean: true,
    },
    target: "web",
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: "babel-loader",
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: "babel-loader",
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource"
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: "babel-loader",
            },
            {
              loader: "react-svg-loader",
              options: {
                jsx: true, // true outputs JSX tags
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ["*", ".ts", ".tsx", ".js", ".jsx", ".css", ".svg"],
      alias: {
        Components: path.resolve(__dirname, "src/Components/"),
        Pages: path.resolve(__dirname, "src/Pages/"),
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Hot Module Replacement',
        template: path.join(__dirname, "public/dev.html")
      }),
      // new webpack.HotModuleReplacementPlugin(),
    ],
    devServer: {
      static: path.join(__dirname, "public"),
      hot: true,
      port: 8082,
      historyApiFallback: true,
      compress: true,
    },
    externals: { serialport: true, sqlite3: true },
  },
];
