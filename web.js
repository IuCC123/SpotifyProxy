const express = require('express');
const config = require('./config.json');
const axios = require('axios');
const app = express();

app.get('/', (req, res) => {
  const spotifyAuthUrl = 'https://accounts.spotify.com/authorize';
  const queryParams = new URLSearchParams({
    client_id: config.client_id,
    response_type: 'code',
    redirect_uri: 'http://localhost:3000/callback',
    scope: 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming', // Specify required scopes
  });
  const authRedirectUrl = `${spotifyAuthUrl}?${queryParams}`;
  res.redirect(authRedirectUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        code,
        redirect_uri: 'http://localhost:3000/callback',
        grant_type: 'authorization_code',
      },
      headers: {
        Authorization: `Basic ${Buffer.from(config.client_id+":"+config.client_secret).toString('base64')}`,
      },
    });

    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;
    res.send(`Refresh token: <b>${refreshToken}</b>`);
  } catch (error) {
    console.error('Error exchanging code for token:', error.message);
    res.status(500).send('Error getting access token');
  }
});

app.listen(3000, () => {
  console.log(`Server running on port 3000, please visit http://localhost:3000 in your browser to get your refresh token.`);
});
