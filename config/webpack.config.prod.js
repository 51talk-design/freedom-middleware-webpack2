var webpack = require("webpack");
const CleanWebpackPlugin = require('clean-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
//var ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');
var path = require("path");
var autoprefixer = require('autoprefixer');
var baseDir = process.cwd(); //当前项目目录
module.exports = function (entries, entryMap, isMultiDevice = false, baseDir = baseDir) {
  //提取css的loader配置常量
  const extractCssLoadersConf = {
    css: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [
        {
          loader: "css-loader",
          options: {
            importLoaders: 1
          }
        },
        {
          loader: "postcss-loader"
        }
      ]
    }),
    less: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [
        {
          loader: "css-loader",
          options: {
            importLoaders: 2
          }
        },
        {
          loader: 'postcss-loader'
        },
        {
          loader: "less-loader"
        }
      ]
    }),
    scss: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [
        {
          loader: "css-loader",
          options: {
            importLoaders: 3
          }
        },
        {
          loader: "resolve-url-loader"
        },
        {
          loader: 'postcss-loader'
        },
        {
          loader: "sass-loader?sourceMap"
        }
      ]
    })
  };
  let webpackConfig = {
    module: {
      rules: [
        {
          test: /\.vue$/,
          exclude: /(node_modules|bower_components)/,
          use: [{
            loader: 'vue-loader',
            options: {
              loaders: extractCssLoadersConf
            }
          }]
        },
        {
          test: /\.css$/,
          use: extractCssLoadersConf.css
        },
        {
          test: /(\.sass|\.scss)$/,
          use: extractCssLoadersConf.scss
        },
        {
          test: /\.less$/,
          use: extractCssLoadersConf.less
        },
        {
          test: /\.html$/,
          use: {
            loader: "html-loader",
            options: {
              minimize: false
            }
          }
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(
        ["build"],
        {
          root: baseDir,       　　　　　　　　　　//根目录
          verbose: true,        　　　　　　　　　　//开启在控制台输出信息
          dry: false        　　　　　　　　　　//启用删除文件
        }),
      new webpack.HashedModuleIdsPlugin()
    ]
  };
  webpackConfig.plugins.push(
    new ExtractTextPlugin({
      // 当allChunks指定为false时，css loader必须指定怎么处理
      // additional chunk所依赖的css，即指定`ExtractTextPlugin.extract()`
      // 第一个参数`notExtractLoader`，一般是使用style-loader
      // @see https://github.com/webpack/extract-text-webpack-plugin
      filename: 'css/[name].css',
      allChunks: true
    })
  );

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
      console.log(chunks);
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

  webpackConfig.plugins.push(new UglifyJsPlugin(
    {
      compress: {
        warnings: false,
        drop_console: true
      }
    }
  ));
  //并行压缩
  /*  webpackConfig.plugins.push(
     new ParallelUglifyPlugin({
       workerCount: 2,
       cacheDir: path.join(baseDir, ".cache/"),
       sourceMap: true,
       compress: {
         warnings: false,
         drop_debugger: true,
         drop_console: true
       },
       mangle: true
     })
   ); */
  return webpackConfig;
};