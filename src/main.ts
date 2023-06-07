import * as core from '@actions/core'
import {google} from 'googleapis'
import axios from 'axios'

async function run(): Promise<void> {
  try {
    const CLIENT_ID = core.getInput('client_id')
    const CLIENT_SECRET = core.getInput('client_secret')
    const REFRESH_TOKEN = core.getInput('refresh_token')

    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET)

    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })

    const response = await oauth2Client.refreshAccessToken()
    const accessToken = response.credentials.access_token
    const idToken = response.credentials.id_token

    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    const emailParts = profileResponse.data.email.split('@')
    const DOMAIN = emailParts.length > 1 ? emailParts[1] : 'zopsmart.com'

    const postBody = {
      name: profileResponse.data.name,
      email: profileResponse.data.email,
      profileUrl: profileResponse.data.picture,
      token: idToken,
      timezone: 'Asia/Calcutta',
      domain: DOMAIN
    }

    const postResponse = await axios.post('https://api.eazyupdates.com/login', postBody)

    console.log(postResponse)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
