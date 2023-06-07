import * as core from '@actions/core'
import * as github from '@actions/github'
import {google} from 'googleapis'
import axios, {isAxiosError} from 'axios'

const BASE_URL = 'https://api.staging.eazyupdates.com'

async function run(): Promise<void> {
  try {
    const CLIENT_ID = core.getInput('client_id')
    const CLIENT_SECRET = core.getInput('client_secret')
    const REFRESH_TOKEN = core.getInput('refresh_token')
    const PROJECT_ID = core.getInput('project_id')
    const GITHUB_TOKEN = core.getInput('github_token')

    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET)

    oauth2Client.setCredentials({refresh_token: REFRESH_TOKEN})

    const response = await oauth2Client.refreshAccessToken()
    const accessToken = response.credentials.access_token
    const idToken = response.credentials.id_token

    const profileResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {
        headers: {Authorization: `Bearer ${accessToken}`}
      }
    )

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

    const loginResponse = await axios.post(`${BASE_URL}/login`, postBody)

    const eu_token = loginResponse.data.data.token

    const octokit = github.getOctokit(GITHUB_TOKEN)

    const {owner, repo} = github.context.repo
    const release = await octokit.rest.repos.getLatestRelease({owner, repo})

    const latestReleaseNotes = release.data.body
      ?.replace(/<!--[\s\S]*?-->/g, '')
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n')

    const today = new Date()

    const releaseNotesBody = {
      isDraft: false,
      version: release.data.name,
      projectId: PROJECT_ID,
      date: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`,
      releaseNotes: latestReleaseNotes
    }

    const releaseNotesCall = await axios.post(
      `${BASE_URL}/release-notes`,
      releaseNotesBody,
      {
        headers: {
          Authorization: `Bearer ${eu_token}`
        }
      }
    )

    core.setOutput('output', releaseNotesCall.data)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error occurred:', error.message)
      if (error.stack) {
        console.error('Stack trace:', error.stack)
      }
      if (isAxiosError(error)) {
        console.error('Error details:', error.response?.data)
        console.error('HTTP status:', error.response?.status)
        console.error('Headers:', error.response?.headers)
      }
      core.setFailed(error.message)
    }
  }
}

run()
