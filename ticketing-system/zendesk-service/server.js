// const express = require('express');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 3003;


// const { ZD_SUBDOMAIN, ZD_EMAIL, ZD_API_TOKEN } = process.env;
// const base64 = Buffer.from(`${ZD_EMAIL}/token:${ZD_API_TOKEN}`).toString('base64');

// const searchZendeskUser = async (type, value) => {
//   const url = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/search.json?query=${type}:${value}&type=user`;
//   const response = await axios.get(url, {
//     headers: { Authorization: `Basic ${base64}` }
//   });
//   return response.data.results.length > 0 ? response.data.results[0] : null;
// };

// app.get('/crm-exequte', async (req, res) => {
//   const { phone, email } = req.query;
//   if (!phone && !email) return res.status(400).send('Missing phone or email');

//   try {
//     let user = phone ? await searchZendeskUser('phone', phone) : null;
//     if (!user && email) user = await searchZendeskUser('email', email);

//     if (user) {
//       return res.redirect(`https://${ZD_SUBDOMAIN}.zendesk.com/agent/users/${user.id}`);
//     } else {
//       return res.redirect(`https://${ZD_SUBDOMAIN}.zendesk.com/agent/users/new`);
//     }
//   } catch (err) {
//     console.error('Zendesk error:', err.response?.data || err.message);
//     res.status(500).send('Zendesk lookup failed');
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Zendesk service running on port ${PORT}`);
// });
const express = require('express');
const axios = require('axios');
require('dotenv').config();
 
const app = express();
const PORT = process.env.PORT || 3003;
 
 
const { ZD_SUBDOMAIN, ZD_EMAIL, ZD_API_TOKEN } = process.env;
const base64 = Buffer.from(`${ZD_EMAIL}/token:${ZD_API_TOKEN}`).toString('base64');
 
const normalizePhoneVariants = (rawPhone) => {
  const digits = rawPhone.replace(/\D/g, '');
  const variants = new Set();
 
  variants.add(rawPhone);
  variants.add(digits);
 
  if (digits.startsWith('00')) {
    const after00 = digits.slice(2);
    variants.add(after00);
    variants.add('+' + after00);
   
    if (after00.length >= 11) {
      const national = after00.slice(-9); // try local number
      variants.add(national);
      variants.add('0' + national);
    }
  }
 
  if (rawPhone.startsWith('+')) {
    variants.add(digits);
 
    if (digits.length >= 11) {
      const national = digits.slice(-9);
      variants.add(national);
      variants.add('0' + national);
    }
  }
 
  if (digits.startsWith('0')) {
    const noZero = digits.slice(1);
    variants.add(noZero);
 
    ['91', '971', '966', '1'].forEach(cc => {
      variants.add(cc + noZero);
      variants.add('+' + cc + noZero);
    });
  }
 
  if (digits.length === 9) {
    variants.add('0' + digits);
 
    ['91', '971', '966', '1'].forEach(cc => {
      variants.add(cc + digits);
      variants.add('+' + cc + digits);
    });
  }
 
  return Array.from(variants);
};
 
const searchZendeskUser = async (type, rawPhone) => {
  const variants = normalizePhoneVariants(rawPhone);
 
 
  for (const phone of variants) {
    try {
      const url = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/search.json?query=${type}:${encodeURIComponent(phone)}&type=user`;
      const response = await axios.get(url, {
        headers: { Authorization: `Basic ${base64}` }
      });
 
      if (response.data.results.length > 0) {
       
        return response.data.results[0];
      }
    } catch (err) {
      console.warn(` Zendesk search failed for: ${phone}`, err.response?.data || err.message);
    }
  }
 
  return null;
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
 
 
