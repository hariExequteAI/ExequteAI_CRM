const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Root health check
app.get('/', (req, res) => {
  res.send('🎯 Ticketing Gateway is running');
});

// Utility function to forward requests
const forwardRequest = async (req, res, serviceName, servicePort) => {
  try {
    const servicePath = '/crm-exequte';
    const serviceUrl = `http://${serviceName}-service:${servicePort}${servicePath}`;

    console.log(`🔁 Forwarding to ${serviceName}-service → ${serviceUrl}`);

    const response = await axios({
      method: req.method,
      url: serviceUrl,
      params: req.query,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 400 || status === 302,
    });

    // Handle redirects
    if (response.status === 302 && response.headers.location) {
      return res.redirect(response.headers.location);
    }

    // Pass through response
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`${serviceName} Service Error:`, err.response?.data || err.message);
    const status = err.response?.status || 500;
    const message = err.response?.data || { error: `Error from ${serviceName} Service` };
    res.status(status).json(message);
  }
};

// Route definitions for CRM CTI pattern
app.use('/crm-cti/freshdesk', (req, res) => {
  forwardRequest(req, res, 'freshdesk', 3001);
});

app.use('/crm-cti/salesforce', (req, res) => {
  forwardRequest(req, res, 'salesforce', 3002);
});

app.use('/crm-cti/zendesk', (req, res) => {
  forwardRequest(req, res, 'zendesk', 3003);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      freshdesk: 'http://freshdesk-service:3001',
      salesforce: 'http://salesforce-service:3002',
      zendesk: 'http://zendesk-service:3003',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    availableRoutes: [
      '/crm-cti/freshdesk?email=&phone=',
      '/crm-cti/salesforce?email=&phone=',
      '/crm-cti/zendesk?email=&phone=',
      '/health'
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Gateway is running at http://localhost:${PORT}`);
});
