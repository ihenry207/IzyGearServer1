module.exports = {
    apps: [{
      name: "izygear-server",
      script: "index.js",
      env: {
        NODE_ENV: "production",
      },
      instances: "max",
      exec_mode: "cluster",
      watch: true,
      ignore_watch: ["node_modules", "logs"],
    }]
  };