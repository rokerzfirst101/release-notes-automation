import * as core from '@actions/core'
import * as github from '@actions/github'
import {isAxiosError} from 'axios'
import * as utils from './utils'
import {GoogleProvider} from './oauth'
import * as EazyUpdatesAPI from './api/eazyupdates'

async function run(): Promise<void> {
  try {
    const CLIENT_ID = core.getInput('client_id')
    const CLIENT_SECRET = core.getInput('client_secret')
    const REFRESH_TOKEN = core.getInput('refresh_token')
    const PROJECT_ID = core.getInput('project_id')
    const GITHUB_TOKEN = core.getInput('github_token')

    const googleProvider = new GoogleProvider(
      CLIENT_ID,
      CLIENT_SECRET,
      REFRESH_TOKEN
    )
    const {idToken} = await googleProvider.getTokens()

    const profile = await googleProvider.getProfile()

    const login = await EazyUpdatesAPI.funcs.login({
      name: profile.name,
      email: profile.email,
      profileUrl: profile.picture,
      token: idToken,
      timezone: 'Asia/Calcutta',
      domain: 'zopsmart.com'
    })

    const eu_token = login.token ? login.token : ''
    EazyUpdatesAPI.setAuthorizationHeader(eu_token)

    const octokit = github.getOctokit(GITHUB_TOKEN)

    const {owner, repo} = github.context.repo
    const release = await octokit.rest.repos.getLatestRelease({owner, repo})

    const formattedReleaseNotes = utils.processReleaseNotes(
      release.data.body_text ? release.data.body_text : ''
    )

    await EazyUpdatesAPI.funcs.postReleaseNotes({
      isDraft: false,
      version: release.data.name ? release.data.name : '',
      projectId: parseInt(PROJECT_ID),
      date: utils.getFormattedDate(),
      releaseNotes: formattedReleaseNotes
    })
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
