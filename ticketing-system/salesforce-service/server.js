const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

const {
  SF_CLIENT_ID,
  SF_CLIENT_SECRET,
  SF_USERNAME,
  SF_PASSWORD
} = process.env;

let sf_access_token = null;
let instance_url = null;

const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', SF_CLIENT_ID);
  params.append('client_secret', SF_CLIENT_SECRET);
  params.append('username', SF_USERNAME);
  params.append('password', SF_PASSWORD);

  const response = await axios.post(
    'https://login.salesforce.com/services/oauth2/token',
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  sf_access_token = response.data.access_token;
  instance_url = response.data.instance_url;
};

const searchSalesforceContact = async (type, value) => {
  let query = type === 'email'
    ? `SELECT Id FROM Contact WHERE Email='${value}'`
    : `SELECT Id FROM Contact WHERE Phone='${value}'`;

  const url = `${instance_url}/services/data/v60.0/query?q=${encodeURIComponent(query)}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${sf_access_token}` }
  });

  return response.data.records.length > 0 ? response.data.records[0] : null;
};

app.get('/crm-exequte', async (req, res) => {
  const { phone, email } = req.query;
  if (!phone && !email) return res.status(400).send('Missing phone or email');

  try {
    await getAccessToken();
    let contact = email ? await searchSalesforceContact('email', email) : null;
    if (!contact && phone) contact = await searchSalesforceContact('phone', phone);

    if (contact) {
      return res.redirect(`https://exequteai-dev-ed.develop.lightning.force.com/${contact.Id}`);
    } else {
      return res.redirect('https://exequteai-dev-ed.develop.lightning.force.com/lightning/o/Contact/new');
    }
  } catch (err) {
    console.error('Salesforce error:', err.response?.data || err.message);
    res.status(500).send('Salesforce lookup failed');
  }
});

app.listen(PORT, () => {
  console.log(`Salesforce service running on port ${PORT}`);
});
