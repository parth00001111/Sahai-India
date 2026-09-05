import apiClient, { apiErrorMessage } from './apiClient.js'

async function request(action, fallback) {
  try {
    const { data } = await action()
    return data.data
  } catch (error) {
    throw new Error(apiErrorMessage(error, fallback), { cause: error })
  }
}

export const getOrganisationServices = () => request(
  () => apiClient.get('/organizations/services'),
  'Unable to load organisation services.',
)

export const createOrganisationService = (service) => request(
  () => apiClient.post('/organizations/services', service),
  'Unable to create this service.',
)

export const updateOrganisationService = (id, updates) => request(
  () => apiClient.patch(`/organizations/services/${id}`, updates),
  'Unable to update this service.',
)

export const deleteOrganisationService = (id) => request(
  () => apiClient.delete(`/organizations/services/${id}`),
  'Unable to remove this service.',
)
