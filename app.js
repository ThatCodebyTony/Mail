const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = require('node-fetch');

const app = express();

// Bodyparser Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Function to check if email exists in Mailchimp list
const checkEmailExists = async (email) => {
  const response = await fetch(`https://us13.api.mailchimp.com/3.0/search-members?query=${email}`, {
    method: 'GET',
    headers: {
      Authorization: 'auth MAILCHIMP_API_KEY'  // replace 'MAILCHIMP_API_KEY' with your Mailchimp API key, make sure to keep 'auth' in front
    }
  });

  const data = await response.json();
  return data.exact_matches.total_items > 0;
};

// Signup Route
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email } = req.body;

  // Make sure fields are filled
  if (!firstName || !lastName || !email) {
    res.redirect('/fail.html');
    return;
  }

  // Check if email already exists
  const emailExists = await checkEmailExists(email);
  if (emailExists) {
    res.redirect('/emailExists.html');
    return;
  }

  // Construct req data
  const data = {
    members: [
      {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName
        }
      }
    ]
  };

  const postData = JSON.stringify(data);

  fetch('https://us13.api.mailchimp.com/3.0/lists/MAILCHIMP_ID', { // replace 'MAILCHIMP_ID' with your Mailchimp list ID
    method: 'POST',
    headers: {
      Authorization: 'auth MAILCHIMP_API_KEY'   // replace 'MAILCHIMP_API_KEY' with your Mailchimp API key, make sure to keep 'auth' in front
    body: postData
  })
    .then(response => {
      if (response.status === 200) {
        res.redirect('/success.html');
      } else {
        res.redirect('/fail.html');
      }
    })
    .catch(err => {
      console.log(err);
      res.redirect('/fail.html');
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));