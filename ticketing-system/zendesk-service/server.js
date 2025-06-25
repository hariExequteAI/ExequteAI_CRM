const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

const { ZD_SUBDOMAIN, ZD_EMAIL, ZD_API_TOKEN } = process.env;
const base64 = Buffer.from(`${ZD_EMAIL}/token:${ZD_API_TOKEN}`).toString('base64');

const searchZendeskUser = async (type, value) => {
  const url = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/search.json?query=${type}:${value}&type=user`;
  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${base64}` }
  });
  return response.data.results.length > 0 ? response.data.results[0] : null;
};

app.get('/crm-exequte', async (req, res) => {
  const { phone, email } = req.query;
  if (!phone && !email) return res.status(400).send('Missing phone or email');

  try {
    let user = phone ? await searchZendeskUser('phone', phone) : null;
    if (!user && email) user = await searchZendeskUser('email', email);

    if (user) {
      return res.redirect(`https://${ZD_SUBDOMAIN}.zendesk.com/agent/users/${user.id}`);
    } else {
      return res.redirect(`https://${ZD_SUBDOMAIN}.zendesk.com/agent/users/new`);
    }
  } catch (err) {
    console.error('Zendesk error:', err.response?.data || err.message);
    res.status(500).send('Zendesk lookup failed');
  }
});

app.listen(PORT, () => {
  console.log(`Zendesk service running on port ${PORT}`);
});
