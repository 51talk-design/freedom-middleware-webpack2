#!/usr/bin/env node

var path = require("path");
var webpack = require('webpack');
var browserSync = require('browser-sync');
var webpackDevMiddleware = require('webpack-dev-middleware')
var webpackHotMiddleware = require('webpack-hot-middleware');
var app = require("express")();
//var WebpackDevServer = require("webpack-dev-server");
var proxyMiddleware = require('http-proxy-middleware');
var baseConfigFn = require("./config/webpack.config.base.js");
var baseDir = process.cwd(); //当前项目目录
var srcDir = path.resolve(baseDir, 'src'); //源码目录
var colors = require("colors");
const chalk = require("chalk");
module.exports = async function (params) {
	if (params.root) {
		srcDir = path.resolve(params.root, 'src');
	}
	var env = params.env || (process.env.NODE_ENV || "dev");
	process.env.NODE_ENV = env;
	baseConf = await baseConfigFn(params);
	if (env == "dev") {
		var port = params.port || 3333;
		for (var key in baseConf.entry) {
			baseConf.entry[key].unshift(`webpack-hot-middleware/client?reload=true`);
		}
		baseConf.profile = true;
		var compiler = webpack(baseConf);
		var proxy = params.proxy.context || [];
		var proxyOpts = params.proxy.options || {}
		var proxy1 = proxyMiddleware(proxy, proxyOpts);
		var devMiddleware = webpackDevMiddleware(compiler, {
			publicPath: baseConf.output.publicPath,
			//debug: true,
			hot: true,
			lazy: false,
			historyApiFallback: true,
			//poll: true,
			//index: "index.html",
			/* watchOptions: {
					aggregateTimeout: 300,
					ignored: /node_modules/
					//poll: true
			}, */
			stats: {
				chunks: false,
				colors: true,
			}
		});
		var hotMiddleware = webpackHotMiddleware(compiler);

		app.use(proxy1);
		app.use(devMiddleware);
		app.use(hotMiddleware);

		let listenStr = `listen at http://localhost:${port},......`;
		console.log(listenStr.bold.green);
		//console.log(listenStr.bold.cyan);
		app.listen(port);

		/* browserSync({
			port: port,
			server: {
				baseDir: srcDir,
				index: "index.html",
				middleware: [
					proxy1,
					devMiddleware,
					// bundler should be the same as above
					hotMiddleware
				]
			},
			// no need to watch '*.js' here, webpack will take care of it for us,
			// including full page reloads if HMR won't work
			files: [
				srcDir + '/*.html'
			]
		}); */


	} else {
		var compiler = webpack(baseConf, function (err, stats) {
			if (err) {
				console.log('编译出错了！');
			} else {
				console.log(stats.toString({
					colors: true
				}));
			}
		});
		compiler.apply(new webpack.ProgressPlugin(function handler(percentage, msg) {
			console.log((Number(percentage.toFixed(4)) * 100) + '%', msg);
		}));
	}
};