var webpack = require("webpack");
//var WebpackBundleSizeAnalyzerPlugin = require('webpack-bundle-size-analyzer').WebpackBundleSizeAnalyzerPlugin;
//var Visualizer = require('webpack-visualizer-plugin');
var path = require("path");
var baseDir = process.cwd(); //当前项目目录
module.exports = function (entries, entryMap, isMultiDevice = false, baseDir = baseDir) {
  let webpackConfig = {
    cache: true,
    profile: true,
    module: {
      rules: [
        {
          test: /\.vue$/,
          exclude: /(node_modules|bower_components)/,
          use: [{
            loader: 'vue-loader',
            options: {
              loaders: {
                css: ['style-loader', 'css-loader'],
                less: ["style-loader", "css-loader", "less-loader"],
                scss: ["style-loader", "css-loader", "sass-loader"]
              }
            }
          }]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.less$/,
          use: ["style-loader", "css-loader", "less-loader"]
        },
        {
          test: /(\.scss|\.sass)$/,
          use: ["style-loader", "css-loader", "sass-loader"]
        },
        {
          test: /\.html$/,
          use: ["html-loader"]
        }
      ]
    },
    plugins: [
      //new webpack.HotModuleReplacementPlugin()
      //new WebpackBundleSizeAnalyzerPlugin(path.normalize(path.join(baseDir, '/report.txt')))
    ]
  };
  if (isMultiDevice) {
    if (entryMap.h5) {
      let chunks = Object.keys(entryMap.h5);
      webpackConfig.plugins.push(
        new webpack.optimize.CommonsChunkPlugin({ //提取公用的代码打包到独立文件
          name: 'h5/common-h5',
          chunks: chunks,
          // Modules must be shared between all entries
          minChunks: chunks.length // 提取所有chunks共同依赖的模块
        })
      );
    }
    if (entryMap.pc) {
      let chunks = Object.keys(entryMap.pc);
      webpackConfig.plugins.push(
        new webpack.optimize.CommonsChunkPlugin({ //提取公用的代码打包到独立文件
          name: 'pc/common-pc',
          chunks: chunks,
          // Modules must be shared between all entries
          minChunks: chunks.length // 提取所有chunks共同依赖的模块
        })
      );
    }

  } else {
    let chunks = Object.keys(entries);
    webpackConfig.plugins.push(
      new webpack.optimize.CommonsChunkPlugin({ //提取公用的代码打包到独立文件
        name: 'common',
        chunks: chunks,
        // Modules must be shared between all entries
        minChunks: chunks.length // 提取所有chunks共同依赖的模块
      })
    );
  }
  webpackConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin()
  );
  webpackConfig.devtool = "cheap-source-map";//"cheap-module-source-map";//"cheap-source-map";

  return webpackConfig;
};