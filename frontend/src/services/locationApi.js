import apiClient, { apiErrorMessage } from './apiClient.js'

export async function getPincodeDetails(pincode) {
  try {
    const { data } = await apiClient.get(`/locations/pincode/${pincode}`)
    return data.data
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Unable to verify this PIN code.'), { cause: error })
  }
}

export async function reverseCoordinates(lat, lng) {
  try {
    const { data } = await apiClient.get('/locations/reverse', { params: { lat, lng } })
    return data.data
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Unable to identify this location.'), { cause: error })
  }
}
