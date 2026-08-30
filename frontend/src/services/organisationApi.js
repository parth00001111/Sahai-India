const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

function extractErrorMessage(result) {
  if (typeof result?.message === 'string') return result.message

  const validationMessage = result?.message?.issues?.[0]?.message || result?.message?.message
  if (typeof validationMessage === 'string') {
    try {
      const issues = JSON.parse(validationMessage)
      return issues?.[0]?.message || 'Please review the organisation details.'
    } catch {
      return validationMessage
    }
  }

  return 'The organisation could not be submitted. Please try again.'
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

  let response
  try {
    response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      credentials: 'include',
      body: payload,
    })
  } catch {
    throw new Error('Unable to reach the Sahai India server. Confirm the backend is running and try again.')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(extractErrorMessage(result))
  return result
}
