var webpackBuild = require("freedom-middleware-webpack2");
(async function () {
  var params = {
    port: 9090,
    env: "dev",
    entryDir:"entry",//编译入口目录，位于项目/根目录/src/entry
    publicPath: `//static.xxx.com/oneTomany/0.0.1`,
    build: `build`,
    proxy: {
      context: ["/api", "/auth","/award"],
      options: {
        target: 'http://localhost:8080'
      }
    }
  };
  await webpackBuild(params);
})();