import apiClient, { apiErrorMessage } from './apiClient.js'

async function request(action, fallback) {
  try {
    const { data } = await action()
    return data.data
  } catch (error) {
    throw new Error(apiErrorMessage(error, fallback), { cause: error })
  }
}

export const getOrganisationTasks = () => request(
  () => apiClient.get('/organizations/tasks'),
  'Unable to load organisation tasks.',
)

export const createOrganisationTask = (task) => request(
  () => apiClient.post('/organizations/tasks', task),
  'Unable to assign this task.',
)

export const startOrganisationTask = (id) => request(
  () => apiClient.patch(`/organizations/tasks/${id}/start`),
  'Unable to start this task.',
)

export const uploadOrganisationTaskProof = (id, proof) => {
  const payload = new FormData()
  if (proof.beforeImage) payload.append('beforeImage', proof.beforeImage)
  if (proof.afterImage) payload.append('afterImage', proof.afterImage)
  if (proof.completionNote !== undefined) payload.append('completionNote', proof.completionNote)
  return request(
    () => apiClient.post(`/organizations/tasks/${id}/proof`, payload),
    'Unable to upload task proof.',
  )
}

export const completeOrganisationTask = (id, completionNote) => request(
  () => apiClient.patch(`/organizations/tasks/${id}/complete`, { completionNote }),
  'Unable to complete this task.',
)
