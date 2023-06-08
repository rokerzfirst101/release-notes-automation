import * as core from '@actions/core'
import axios from 'axios'
import {Environment} from '../models/environment.enum'
import {ReleaseNotes} from '../models/releasenotes.interface'
import {LoginRequest, LoginResponse} from './models/login.interface'

const STAGING_BASE_URL = 'https://api.staging.eazyupdates.com'
const PRODUCTION_BASE_URL = 'https://api.eazyupdates.com'

const currEnv =
  core.getInput('env') === 'staging'
    ? Environment.STAGING
    : Environment.PRODUCTION

const instance = axios.create({
  baseURL:
    currEnv === Environment.STAGING ? STAGING_BASE_URL : PRODUCTION_BASE_URL,
  timeout: 5000
})

export const setAuthorizationHeader = (token: string): void => {
  instance.defaults.headers.common.Authorization = `Bearer ${token}`
}

const requests = {
  post: async (url: string, body: {}) =>
    (await instance.post(url, body)).data.data
}

export const funcs = {
  login: async (data: LoginRequest): Promise<LoginResponse> =>
    requests.post('login', data),
  postReleaseNotes: async (releaseNotes: ReleaseNotes): Promise<ReleaseNotes> =>
    requests.post('release-notes', releaseNotes)
}
