import apiClient, { apiErrorMessage } from './apiClient.js'

export function normaliseOrganisation(organization) {
  if (!organization) return null
  return {
    ...organization,
    organisationName: organization.organisationName || organization.name,
    status: organization.status || organization.verificationStatus || 'pending',
    submittedAt: organization.submittedAt || organization.createdAt,
  }
}

export async function createOrganisation(form) {
  const payload = new FormData()
  const fields = {
    name: form.organisationName.trim(),
    type: form.organisationType,
    legalStructure: form.legalStructure,
    registrationNumber: form.registrationNumber.trim(),
    yearEstablished: form.yearEstablished,
    website: form.website.trim(),
    description: form.description.trim(),
    contactName: form.contactName.trim(),
    designation: form.designation.trim(),
    email: form.email.trim(),
    contactPhone: form.phone,
    address: form.address.trim(),
    city: form.city.trim(),
    district: form.district.trim(),
    state: form.state.trim(),
    pincode: form.pincode,
    postOffice: form.postOffice,
    lat: form.lat,
    lng: form.lng,
    serviceAreas: form.serviceAreas.trim(),
    beneficiariesCount: form.beneficiaries,
    focusAreas: JSON.stringify(form.focusAreas),
  }

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) payload.append(key, value)
  })

  const files = {
    registrationCertificate: form.registrationCertificate,
    panDocument: form.panDocument,
    addressProof: form.addressProof,
    authorisedLetter: form.authorisedLetter,
    logo: form.logo,
  }

  Object.entries(files).forEach(([key, file]) => {
    if (file) payload.append(key, file)
  })

  try {
    const { data: result } = await apiClient.post('/organizations', payload)
    if (result.data) result.data = normaliseOrganisation(result.data)
    return result
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'The organisation could not be submitted. Please try again.'), { cause: error })
  }
}

export async function getMyOrganisation() {
  try {
    const { data: result } = await apiClient.get('/organizations/me')
    return normaliseOrganisation(result.data)
  } catch (error) {
    if (error.response?.status === 404) return null
    throw new Error(apiErrorMessage(error, 'Unable to load your organisation workspace.'), { cause: error })
  }
}

export async function updateMyOrganisation(updates) {
  try {
    const { data: result } = await apiClient.patch('/organizations/me', updates)
    return normaliseOrganisation(result.data)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Unable to update the organisation profile.'), { cause: error })
  }
}

export async function addOrganisationMember(member) {
  try {
    const { data: result } = await apiClient.post('/organizations/members', member)
    return result.data
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Unable to add this team member.'), { cause: error })
  }
}

export async function getOrganisationInvitation(token) {
  try {
    const { data: result } = await apiClient.get(`/organization-invitations/${token}`)
    return result.data
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'This organisation invitation is unavailable.'), { cause: error })
  }
}

export async function revokeOrganisationInvitation(id) {
  try {
    const { data: result } = await apiClient.delete(`/organizations/invitations/${id}`)
    return result
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Unable to revoke this invitation.'), { cause: error })
  }
}
