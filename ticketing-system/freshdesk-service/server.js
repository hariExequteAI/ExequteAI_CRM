require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

const { FRESHDESK_DOMAIN, FRESHDESK_API_KEY } = process.env;

if (!FRESHDESK_DOMAIN || !FRESHDESK_API_KEY) {
  console.error('Missing Freshdesk environment variables!');
  process.exit(1);
}

const searchFreshdeskContact = async (type, value) => {
  const url = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2/contacts?${type}=${encodeURIComponent(value)}`;

  try {
    const response = await axios.get(url, {
      auth: {
        username: FRESHDESK_API_KEY,
        password: ''
      }
    });
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Freshdesk API error:', error.response?.data || error.message);
    throw error;
  }
};

app.get('/crm-exequte', async (req, res) => {
  const { email, phone } = req.query;
  if (!email && !phone) {
    return res.status(400).json({ error: 'Missing phone or email query parameter' });
  }

  try {
    let contact = null;
    if (email) {
      contact = await searchFreshdeskContact('email', email);
    }
    if (!contact && phone) {
      contact = await searchFreshdeskContact('phone', phone);
    }

    if (contact) {
       return res.redirect(`https://${FRESHDESK_DOMAIN}.freshdesk.com/a/contacts/${contact.id}`);
    } else {
      return res.redirect(`https://${FRESHDESK_DOMAIN}.freshdesk.com/a/contacts/new`);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to search Freshdesk contact' });
  }
});

app.listen(PORT, () => {
  console.log(`Freshdesk service running on port ${PORT}`);
});
