import apiClient, { apiErrorMessage } from './apiClient.js'

async function authRequest(endpoint, payload) {
  try {
    const { data } = await apiClient.post(`/${endpoint}`, payload)
    return data || {}
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Authentication failed. Please check your details and try again.'), { cause: error })
  }
}

export const signIn = (credentials) => authRequest('signin', credentials)
export const signUp = (details) => authRequest('signup', details)
