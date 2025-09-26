const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to your backend server
  // Update the target URL to match your actual API server
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000', // Change this to your API server URL
      changeOrigin: true,
      // Uncomment the following lines if you need to handle CORS
      // onProxyReq: function(proxyReq, req, res) {
      //   proxyReq.setHeader('Access-Control-Allow-Origin', '*');
      // }
    })
  );
};
