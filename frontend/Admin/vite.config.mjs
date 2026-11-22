export default {
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4001",
        changeOrigin: true
      }
    }
  }
};
