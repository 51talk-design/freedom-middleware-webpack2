const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const webpack = require("webpack");
const webpackMerge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin'); //打包时候连同html一起打包
let baseDir = process.cwd(); //当前项目目录
let srcDir = path.resolve(baseDir, 'src'); //源码目录
let webpackBuidPath = path.resolve(baseDir, '__build'); //webpack 编译的虚拟目录

//入口文件处理对象
let entryHandler = {
  entryMap: null,
  entryFiles: {},
  //获取所有编译文件
  getAllFiles: function (path, isMultiDevice = false) {
    let _this = this;
    let files = fs.readdirSync(path);
    files.forEach(function (file) {
      let stat = fs.statSync(path + '/' + file);
      if (stat.isDirectory()) {
        //如果是文件夹遍历
        _this.getAllFiles(path + '/' + file);
      } else {
        _this.entryFiles[path + '/' + file] = file;
      }
    });
  },
  //获取所有的入口文件map
  genEntries: function (srcDir, entryDir, isMultiDevice = false) {
    let _this = this;
    let map = {};
    if (isMultiDevice) {
      //适配多端，强制规定只能带有h5跟pc目录
      map = {
        "h5": {},
        "pc": {}
      };
    }
    let jsDir = path.resolve(srcDir, 'scripts');
    entryDir = path.resolve(jsDir, entryDir);
    this.getAllFiles(entryDir, isMultiDevice);
    for (let dir in _this.entryFiles) {
      let name = _this.entryFiles[dir];
      let m = name.match(/(.+)\.js$/);
      let entry = m ? m[1] : '';
      let entryPath = dir;
      let paths = [];
      paths.push(entryPath);
      if (entry) {
        if (!isMultiDevice) //不适配pc跟h5
          map[entry] = paths;
        else {
          if (dir.indexOf("h5/") > -1) {
            let entryKey = dir.substring(dir.indexOf("h5/"), dir.indexOf(".js"))
            map["h5"][entryKey] = paths;
          } else if (dir.indexOf("pc/") > -1) {
            let entryKey = dir.substring(dir.indexOf("pc/"), dir.indexOf(".js"))
            map["pc"][entryKey] = paths;
          }
        }
      }
    }
    _this.entryMap = map;
    return map;
  }
};

/**
 * webpack构建的基本配置
 * @param {object} params
 * {
 *  isMultiDevice:false,判断是否兼容多端，pc跟h5,兼容多端会默认多出一级目录，比如:pc/index、h5/index，默认为false
 *  env:"dev",//环境变量
 *  publicPath:"",//替换的路径
 *  build:"",//编译后保存的目录
 *  entryDir:"",//查找的编译入口文件目录，项目目录规范为:/root/src/scripts/，比如:编译入口为：/root/src/scripts/entry
 * }
 */
module.exports = async function (params) {
  baseDir = params.root || baseDir;
  //复制相关配置到项目根目录
  if (!fs.existsSync(`${baseDir}/.babelrc`)) {
    fsExtra.copySync(path.join(__dirname, `../.babelrc`), `${baseDir}/.babelrc`);
  }
  if (!fs.existsSync(`${baseDir}/tsconfig.json`)) {
    fsExtra.copySync(path.join(__dirname, `../tsconfig.json`), `${baseDir}/tsconfig.json`);
  }
  if (!fs.existsSync(`${baseDir}/postcss.config.js`)) {
    fsExtra.copySync(path.join(__dirname, `../postcss.config.js`), `${baseDir}/postcss.config.js`);
  }
  if (!fs.existsSync(`${baseDir}/webpack.config.js`)) {
    fsExtra.copySync(path.join(__dirname, `../webpack.config.js`), `${baseDir}/webpack.config.js`);
  }
  //设置环境变量
  let env = params.env || (process.env.NODE_ENV || "prod");
  process.env.NODE_ENV = env;
  //项目编译后的保存目录
  let buidDir = params.build //path.normalize(path.resolve(baseDir, `${params.build}/`));
  let srcDir = path.resolve(baseDir, 'src'); //源码目录
  let webpackBuidPath = path.resolve(baseDir, '__build'); //webpack 编译的虚拟目录
  //项目编译入口目录
  let entryDir = params.entryDir || "entry";
  let entries = null;
  if (entryHandler.entryMap == null) {
    //重置编译入口文件集合
    entryHandler.entryFiles = {};
    //获取所有的编译入口文件集合
    entries = entryHandler.genEntries(srcDir, entryDir, params.isMultiDevice);
  } else {
    entries = entryHandler.entryMap;
  }
  let entryMap = entryHandler.entryMap;
  //适配pc跟h5，需要拆分pc、h5两个chunks
  if (params.isMultiDevice) {
    entries = Object.assign({}, entries.pc, entries.h5);
  }
  //要提取chunks的文件
  //let chunks = Object.keys(entries);

  //基本配置
  let baseConf = {
    //srcDir: srcDir,
    //buidDir: buidDir,
    entry: entries,
    output: {
      path: env == "dev" ? webpackBuidPath : buidDir, //必须是绝对路径
      devtoolModuleFilenameTemplate: '[resource-path]',
      sourceMapFilename: "[file].map",
      filename: env == "dev" ? '[name].js' : 'scripts/[name].js',
      /** 
       * chunkFilename用来打包require.ensure方法中引入的模块,如果该方法中没有引入任何模块则不会生成任何chunk块文件
       * 比如在main.js文件中,require.ensure([],function(require){alert(11);}),这样不会打包块文件
       * 只有这样才会打包生成块文件require.ensure([],function(require){alert(11);require('./greeter')})
       * 或者这样require.ensure(['./greeter'],function(require){alert(11);})
       * chunk的hash值只有在require.ensure中引入的模块发生变化,hash值才会改变
       * 注意:对于不是在ensure方法中引入的模块,此属性不会生效,只能用CommonsChunkPlugin插件来提取
       **/
      chunkFilename: env == "dev" ? '[id].common.js' : 'scripts/[id].common.min.js',
      publicPath: params.publicPath ? `${params.publicPath}/` : "" //页面中引入的url路径前缀（css，js） 相对路径 ，如果是绝对路径可以替换成cdn 路径
    },
    plugins: [
      //new webpack.optimize.ModuleConcatenationPlugin(),
      //new webpack.HashedModuleIdsPlugin(),
      //new webpack.optimize.OccurrenceOrderPlugin(),
      //new webpack.NoEmitOnErrorsPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(env)
      })
    ],
    module: {
      rules: [{
          test: /\.(tpl|ejs)$/,
          exclude: /(node_modules|bower_components)/,
          use: [{
            loader: 'ejs-loader'
          }]
        },
        {
          test: /\.jade$/,
          exclude: /(node_modules|bower_components)/,
          use: [{
            loader: 'jade-loader'
          }]
        },
        {
          test: /(\.ts|\.tsx)$/,
          exclude: /(node_modules|bower_components)/,
          use: [{
            loader: 'ts-loader'
          }]
        },
        {
          test: /\.js/,
          exclude: /(node_modules|bower_components)/,
          use: [{
            loader: 'babel-loader',
            options: {
              //忽略哪些腳本是不进行编译打包的
              ignore: [],
              //缓存设置
              cacheDirectory: true
            }
          }]
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          use: [{
            loader: 'url-loader',
            options: {
              limit: 2,
              mimetype: "images/jpg",
              name: `images/[name]_[hash].[ext]?tt=${new Date().getTime()}`
            }
          }]
        },
        {
          test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?/i,
          use: [{
            loader: 'url-loader',
            options: {
              limit: 8124,
              name: "fonts/[name].[ext]"
            }
          }]
        }
      ]
    },
    resolve: {
      alias: { //需要设置哪些库的别名

      },
      modules: [
        process.cwd() + "/node_modules",
        baseDir + "/node_modules",
        srcDir
      ],
      extensions: [ //开启后缀名的自动补全
        '.tsx',
        '.ts',
        '.js',
        '.jsx',
        '.vue',
        '.gif',
        '.css',
        '.scss',
        '.png',
        '.jpg',
        '.less',
        '.sass'
      ]
    },
    externals: { //指定不需要编译的外部依赖
      //"react": 'React',
    }
  };

  //根据环境变量，进行配置文件的merge,同时合并外部的webpack.config.js文件
  let extendConf = require(`${baseDir}/webpack.config.js`)();
  let conf = require(`./webpack.config.${env}.js`)(
    entries,
    entryMap,
    params.isMultiDevice,
    baseDir,
    buidDir
  );
  let compiledConf = webpackMerge.smart(baseConf, conf);
  compiledConf = webpackMerge.smart(compiledConf, extendConf);
  //自动生成入口文件放到页面引入，入口js名必须和入口文件名相同
  //如果html文件名称和入口js 文件不同命，会把所有js css 都打包到html里面
  let pages = [];
  if (!params.isMultiDevice) {
    pages = fs.readdirSync(srcDir);
    pages.forEach(function (filename) {
      let m = filename.match(/(.+)\.html$/);
      if (m) {
        // @see https://github.com/kangax/html-minifier
        let conf = {
          template: path.resolve(srcDir, filename),
          // @see https://github.com/kangax/html-minifier
          // minify: {
          //     collapseWhitespace: true,
          //     removeComments: true
          // },
          /*
            title: 用来生成页面的 title 元素
            filename: 输出的 HTML 文件名，默认是 index.html, 也可以直接配置带有子目录。
            template: 模板文件路径，支持加载器，比如 html!./index.html
            inject: true | 'head' | 'body' | false  ,注入所有的资源到特定的 template 或者 templateContent 中，如果设置为 true 或者 body，所有的 javascript 资源将被放置到 body 元素的底部，'head' 将放置到 head 元素中。
            favicon: 添加特定的 favicon 路径到输出的 HTML 文件中。
            minify: {} | false , 传递 html-minifier 选项给 minify 输出
            hash: true | false, 如果为 true, 将添加一个唯一的 webpack 编译 hash 到所有包含的脚本和 CSS 文件，对于解除 cache 很有用。
            cache: true | false，如果为 true, 这是默认值，仅仅在文件修改之后才会发布文件。
            showErrors: true | false, 如果为 true, 这是默认值，错误信息会写入到 HTML 页面中
            chunks: 允许只添加某些块 (比如，仅仅 unit test 块)
            chunksSortMode: 允许控制块在添加到页面之前的排序方式，支持的值：'none' | 'default' | {function}-default:'auto'
            excludeChunks: 允许跳过某些块，(比如，跳过单元测试的块)
            */
          filename: filename
        };
        if (m[1] in compiledConf.entry) {
          conf.inject = 'body';
          conf.chunks = ['common', m[1]];
        }
        compiledConf.plugins.push(new HtmlWebpackPlugin(conf)); //打包时候连同html一起打包
      }
    });
  } else { //一个项目配置pc、h5的话，src下必须存放html目录
    //把所有的html目录的html文件读取出来
    getAllPages(`${srcDir}/html`);
    pages.forEach(function (filename) {
      let htmlFile = filename.match(/src\/html\/(.+)\.html$/);
      let conf = {
        template: filename,
        filename: `${htmlFile[1]}.html`
      };
      let keys = Object.keys(compiledConf.entry);
      for (let key of keys) {
        if (key.indexOf("h5") > -1 && htmlFile[1].indexOf(key) > -1) {
          conf.inject = 'body';
          conf.chunks = ['h5/common-h5', key];
          break;
        }
        if (key.indexOf("pc") > -1 && htmlFile[1].indexOf(key) > -1) {
          conf.inject = 'body';
          conf.chunks = ['pc/common-pc', key];
          break;
        }
      }

      compiledConf.plugins.push(new HtmlWebpackPlugin(conf)); //打包时候连同html一起打包
    });
  }

  function getAllPages(path) {
    let files = fs.readdirSync(path);
    files.forEach(function (file) {
      let stat = fs.statSync(path + '/' + file);
      if (stat.isDirectory()) {
        //如果是文件夹遍历
        getAllPages(path + '/' + file);
      } else {
        pages.push(path + '/' + file);
      }
    });
  }

  return compiledConf;
}