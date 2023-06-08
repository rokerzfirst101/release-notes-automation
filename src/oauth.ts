import axios from 'axios'
import {OAuth2Client} from 'google-auth-library'
import {google} from 'googleapis'

const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v1/userinfo'

type Tokens = {
  accessToken: string
  idToken: string
}

class GoogleProvider {
  oauthClient: OAuth2Client
  currTokens: Tokens = {accessToken: '', idToken: ''}

  constructor(clientID: string, clientSecret: string, refreshToken: string) {
    this.oauthClient = new google.auth.OAuth2(clientID, clientSecret)
    this.oauthClient.setCredentials({refresh_token: refreshToken})
  }

  async getTokens(): Promise<Tokens> {
    const response = await this.oauthClient.refreshAccessToken()

    this.currTokens.accessToken = response.credentials.access_token
      ? response.credentials.access_token
      : ''
    this.currTokens.idToken = response.credentials.id_token
      ? response.credentials.id_token
      : ''

    return this.currTokens
  }

  async getProfile() {
    return await (
      await axios.get(GOOGLE_PROFILE_URL, {
        headers: {Authorization: `Bearer ${this.currTokens.accessToken}`}
      })
    ).data.data
  }
}

export {GoogleProvider, Tokens}
