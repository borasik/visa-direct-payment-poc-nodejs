'use strict'
const fetch = require('node-fetch')
const express = require('express')
const config = require('./config.js')
const helpers = require('./helpers.js')

const app = express()
global.Headers = fetch.Headers

app.listen(config.port, () => console.log(`Sample app listening on port ${config.port}!`))

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))

let oauth2
let access_token
global.strong = config.strong

// Home page
app.get('/', (req, res) => {
  res.render('pages/index')
})

// Login
app.get('/login', (req, res) => {
  
  oauth2 = helpers.oauth2Creation()
  console.log(oauth2);
  const authorizationUri = helpers.getAuthUri(oauth2)

  res.redirect(authorizationUri)
})

// Callback service parsing the authorization token and asking for the access token
app.get('/callback', async (req, res, next) => {
  const code = req.query.code

  try {
    const tokenConfig = helpers.getTokenConfig(code)
    const result = await oauth2.authorizationCode.getToken(tokenConfig)
    const accessToken = oauth2.accessToken.create(result)

    access_token = accessToken.token.access_token

  } catch (error) {
    return res.render('pages/error', { error: error.message })
  }

  res.render('pages/auth', { token: access_token })
})

// Get Retail US Accounts
app.get('/retail-us-accounts', async (req, res, next) => {
  try {
    console.log("HEY");
    var url = config.baseUrl + '/retail-us/me/account/v1/accounts';
    
    console.log(url);
    const response = await fetch(url, {
      method: 'get',
      headers: new Headers({
        Authorization: 'Bearer ' + access_token,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      })
    })
    console.log(response);
    if (!response.ok) {
      return res.render('pages/error', { error: response.statusText });
    }
        
    return res.render('pages/results', { entities: entities })
  } catch (error) {
    return res.render('pages/error', { error: error })
  }
})

// Get Retail US Accounts
app.get('/corporate-accounts', async (req, res, next) => {
  try {
    console.log("HEY");
    var url = config.baseUrl + '/corporate/channels/accounts/me/v1/accounts?accountContext=MT103';
    
    console.log(url);
    const response = await fetch(url, {
      method: 'get',
      headers: new Headers({
        Authorization: 'Bearer ' + access_token,
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      })
    });

    if (!response.ok) {
      return res.render('pages/error', { error: response.statusText });
    }
    
    const items = await response.json()
    console.log("items", items.items);

    return res.render('pages/results', { items: items.items})

  } catch (error) {
    return res.render('pages/error', { error: error })
  }
})

// Logout
app.get('/logout', (req, res) => {
  access_token = null
  res.render('pages/logout', { logout: "You successfully removed the access token." })
})