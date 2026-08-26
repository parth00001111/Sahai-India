const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

async function authRequest(endpoint, payload) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Unable to reach the Sahai India server. Please confirm the backend is running on port 5000.')
  }

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    if (result?.message) throw new Error(result.message)

    if (response.status >= 500) {
      throw new Error('The Sahai India server is unavailable right now. Please confirm the backend is running on port 5000.')
    }

    throw new Error('Authentication failed. Please check your details and try again.')
  }

  return result || {}
}

export const signIn = (credentials) => authRequest('signin', credentials)
export const signUp = (details) => authRequest('signup', details)
