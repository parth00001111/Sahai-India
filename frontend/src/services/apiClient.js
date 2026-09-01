import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000,
})

function validationMessage(data) {
  const message = data?.message
  if (typeof message === 'string') return message

  const issue = message?.issues?.[0]?.message || data?.errors?.issues?.[0]?.message
  return typeof issue === 'string' ? issue : null
}

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!axios.isAxiosError(error)) return error?.message || fallback
  if (!error.response) return 'Unable to reach the Sahai India server. Confirm the backend is running and try again.'
  return validationMessage(error.response.data) || fallback
}

export default apiClient
