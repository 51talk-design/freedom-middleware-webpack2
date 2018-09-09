var webpack = require("webpack");
var path = require("path");
var baseDir = process.cwd();
var srcDir = path.resolve(baseDir, 'src');
module.exports = function () {
  var extendConf = {
    plugins: [
      
    ],
    resolve: {
      alias: {

      }
    },
    module: {
      rules: [

      ]
    }
  };
  return extendConf;
};