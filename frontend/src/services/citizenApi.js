import apiClient, { apiErrorMessage } from './apiClient.js'

async function request(action, fallback) {
  try {
    const { data } = await action()
    return data.data
  } catch (error) {
    throw new Error(apiErrorMessage(error, fallback), { cause: error })
  }
}

export const getCitizenDashboard = () => request(
  () => apiClient.get('/citizen/dashboard'),
  'Unable to load your citizen dashboard.',
)

export const createCitizenComplaint = (complaint) => request(
  () => apiClient.post('/citizen/complaints', complaint),
  'Unable to file your complaint right now.',
)

export const closeCitizenComplaint = (id) => request(
  () => apiClient.patch(`/citizen/complaints/${id}/close`),
  'Unable to close this complaint.',
)
