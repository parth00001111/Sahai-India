import { useCallback, useEffect, useState } from 'react'
import {
  createOrganisationService,
  deleteOrganisationService,
  getOrganisationServices,
  updateOrganisationService,
} from '../services/serviceApi.js'

const categories = ['Healthcare', 'Food & nutrition', 'Shelter', 'Education', 'Women & child support', 'Livelihood', 'Disaster relief', 'Legal aid', 'Elder care', 'Other']

const blankService = {
  name: '', category: '', description: '', capacity: '', capacityUnit: 'people per day',
  deliveryMode: 'at_centre', availability: '', serviceArea: '', contactPhone: '',
  eligibility: '', requiredDocuments: '', isActive: true,
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-blue-100'

function displayMode(mode) {
  return { at_centre: 'At centre', doorstep: 'Doorstep', online: 'Online', mobile_camp: 'Mobile camp' }[mode] || mode
}

function editableService(service = {}) {
  return {
    name: service.name || '',
    category: typeof service.category === 'object' ? service.category?.name || '' : service.category || '',
    description: service.description || '',
    capacity: service.capacity ?? '',
    capacityUnit: service.capacityUnit ?? 'people per day',
    deliveryMode: service.deliveryMode || 'at_centre',
    availability: service.availability || '',
    serviceArea: service.serviceArea || '',
    contactPhone: service.contactPhone || '',
    eligibility: service.eligibility || '',
    requiredDocuments: service.requiredDocuments || '',
    isActive: service.isActive ?? true,
  }
}

function ServiceCard({ service, canManage, disabled, busy, onEdit, onToggle, onDelete }) {
  const category = typeof service.category === 'object' ? service.category?.name : service.category
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${service.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{service.isActive ? 'Active' : 'Paused'}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">Database service</span></div><h2 className="mt-4 text-lg font-extrabold text-navy">{service.name}</h2><p className="mt-1 text-xs font-bold text-orange-700">{category || 'Uncategorised'}</p></div><span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-xl">✦</span></div>
    <p className="mt-4 min-h-12 text-sm leading-6 text-slate-500">{service.description || 'No description provided.'}</p>
    <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs"><div><p className="font-bold uppercase tracking-wide text-slate-400">Capacity</p><p className="mt-1 font-extrabold text-navy">{service.capacity !== null && service.capacity !== undefined ? `${service.capacity} ${service.capacityUnit || ''}` : 'Not set'}</p></div><div><p className="font-bold uppercase tracking-wide text-slate-400">Mode</p><p className="mt-1 font-extrabold text-navy">{displayMode(service.deliveryMode) || 'Not set'}</p></div><div><p className="font-bold uppercase tracking-wide text-slate-400">Availability</p><p className="mt-1 font-extrabold text-navy">{service.availability || 'Not set'}</p></div><div><p className="font-bold uppercase tracking-wide text-slate-400">Service area</p><p className="mt-1 font-extrabold text-navy">{service.serviceArea || 'Not set'}</p></div></div>
    {(service.eligibility || service.requiredDocuments) && <details className="mt-4 rounded-xl border border-slate-200"><summary className="cursor-pointer p-3 text-xs font-extrabold text-navy">Eligibility and documents</summary><div className="border-t border-slate-100 p-3 text-xs leading-5 text-slate-600">{service.eligibility && <p><strong>Eligibility:</strong> {service.eligibility}</p>}{service.requiredDocuments && <p className="mt-2"><strong>Documents:</strong> {service.requiredDocuments}</p>}</div></details>}
    {canManage && <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={disabled} aria-label={`Edit ${service.name}`} onClick={() => onEdit(service)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy disabled:opacity-50">Edit</button><button type="button" disabled={disabled} aria-label={`${service.isActive ? 'Pause' : 'Activate'} ${service.name}`} onClick={() => onToggle(service)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy disabled:opacity-50">{busy === 'toggle' ? 'Saving…' : service.isActive ? 'Pause' : 'Activate'}</button><button type="button" disabled={disabled} aria-label={`Remove ${service.name}`} onClick={() => onDelete(service)} className="ml-auto rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">{busy === 'delete' ? 'Removing…' : 'Remove'}</button></div>}
  </article>
}

export default function OrganisationServicesPanel({ organisation, canManage, onChanged }) {
  const [services, setServices] = useState(() => organisation.services || [])
  const [form, setForm] = useState(blankService)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyAction, setBusyAction] = useState({ id: '', action: '' })
  const operationPending = loading || saving || Boolean(busyAction.id)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await getOrganisationServices()
      setServices(Array.isArray(result) ? result : [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getOrganisationServices()
      .then((result) => { if (!cancelled) setServices(Array.isArray(result) ? result : []) })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const syncParent = async () => {
    try { await onChanged?.() }
    catch { /* The service mutation succeeded; a later workspace refresh can resync summary data. */ }
  }

  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.type === 'checkbox' ? target.checked : target.value }))
  const resetForm = () => { setForm(blankService); setEditingId(null); setShowForm(false) }

  const submit = async (event) => {
    event.preventDefault()
    if (operationPending) return
    setSaving(true); setError(''); setMessage('')
    const payload = editableService(form)
    payload.capacity = form.capacity === '' ? null : Number(form.capacity)
    try {
      const saved = editingId
        ? await updateOrganisationService(editingId, payload)
        : await createOrganisationService(payload)
      setServices((current) => editingId
        ? current.map((service) => service.id === editingId ? saved : service)
        : [saved, ...current])
      resetForm()
      setMessage(editingId ? 'Service updated.' : 'Service created in your organisation catalogue.')
      await syncParent()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const edit = (service) => {
    if (operationPending) return
    setForm(editableService(service))
    setEditingId(service.id); setShowForm(true); setMessage(''); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggle = async (service) => {
    if (operationPending) return
    setBusyAction({ id: service.id, action: 'toggle' }); setError(''); setMessage('')
    try {
      const updated = await updateOrganisationService(service.id, { isActive: !service.isActive })
      setServices((current) => current.map((item) => item.id === service.id ? updated : item))
      setMessage(updated.isActive ? 'Service activated.' : 'Service paused.')
      await syncParent()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyAction({ id: '', action: '' })
    }
  }

  const remove = async (service) => {
    if (operationPending) return
    if (!window.confirm(`Remove “${service.name}” from the catalogue?`)) return
    setBusyAction({ id: service.id, action: 'delete' }); setError(''); setMessage('')
    try {
      await deleteOrganisationService(service.id)
      setServices((current) => current.filter((item) => item.id !== service.id))
      if (editingId === service.id) resetForm()
      setMessage('Service removed from your organisation catalogue.')
      await syncParent()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyAction({ id: '', action: '' })
    }
  }

  return <section aria-busy={operationPending}><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Service catalogue</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Services</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create and maintain the support your organisation provides.</p></div>{canManage && <button type="button" disabled={operationPending} onClick={() => { if (showForm) resetForm(); else { setForm(blankService); setEditingId(null); setShowForm(true); setError(''); setMessage('') } }} className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{showForm ? 'Close form' : '+ Create service'}</button>}</div>
    {organisation.status !== 'verified' && <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">Organisation approval is pending. Services are saved privately in this workspace until public publishing is enabled after approval.</p>}
    {!canManage && <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600">Only organisation admins can manage the service catalogue.</p>}

    {showForm && canManage && <form onSubmit={submit} aria-busy={saving} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><fieldset disabled={operationPending} className="contents"><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-700">{editingId ? 'Edit service' : 'New service'}</p><h2 className="mt-2 text-xl font-extrabold text-navy">Service information</h2></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">Catalogue</span></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-slate-700">Service name *</span><input required name="name" minLength="2" maxLength="140" value={form.name} onChange={change} placeholder="Emergency medical assistance" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Category *</span><select required name="category" value={form.category} onChange={change} className={inputClass}><option value="">Select category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Description *</span><textarea required name="description" rows="4" minLength="2" maxLength="1000" value={form.description} onChange={change} placeholder="Explain what is provided and who it helps." className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Capacity</span><input name="capacity" type="number" min="0" max="10000000" step="1" value={form.capacity} onChange={change} placeholder="50" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Capacity unit</span><input name="capacityUnit" maxLength="80" value={form.capacityUnit} onChange={change} placeholder="people per day" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Delivery mode</span><select name="deliveryMode" value={form.deliveryMode} onChange={change} className={inputClass}><option value="at_centre">At centre</option><option value="doorstep">Doorstep</option><option value="online">Online</option><option value="mobile_camp">Mobile camp</option></select></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Availability</span><input name="availability" maxLength="200" value={form.availability} onChange={change} placeholder="Mon–Sat, 9 AM–6 PM" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Service area</span><input name="serviceArea" maxLength="300" value={form.serviceArea} onChange={change} placeholder="Districts, wards, or radius" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Public contact number</span><input name="contactPhone" type="tel" inputMode="tel" minLength="7" maxLength="20" pattern="[0-9+()\s-]{7,20}" title="Use 7 to 20 digits or phone symbols" value={form.contactPhone} onChange={change} placeholder="9876543210" className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Eligibility</span><textarea name="eligibility" rows="3" maxLength="2000" value={form.eligibility} onChange={change} placeholder="Example: Open to residents below a stated income threshold." className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Required documents</span><input name="requiredDocuments" maxLength="1000" value={form.requiredDocuments} onChange={change} placeholder="Aadhaar, income certificate (comma separated)" className={inputClass} /></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2"><input name="isActive" type="checkbox" checked={form.isActive} onChange={change} className="h-4 w-4 accent-green-700" /><span><strong className="block text-sm text-navy">Set as active</strong><small className="text-slate-500">Paused services stay saved but are not offered as active support.</small></span></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 disabled:opacity-50">Cancel</button><button className="rounded-xl bg-india-green px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Update service' : 'Create service'}</button></div></fieldset></form>}
    {(message || error) && <p role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'} className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>{error || message}</p>}
    <div className="mt-7 flex items-center justify-between gap-4"><h2 className="font-extrabold text-navy">Service catalogue</h2><div className="flex items-center gap-4"><span className="text-xs font-bold text-slate-500">{services.length} service{services.length === 1 ? '' : 's'}</span><button type="button" disabled={operationPending} onClick={load} className="text-xs font-extrabold text-blue-700 disabled:opacity-50">Refresh</button></div></div>
    {loading ? <div role="status" className="mt-4 grid min-h-64 place-items-center rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Loading services…</div> : <div className="mt-4 grid gap-4 xl:grid-cols-2">{services.length ? services.map((service) => <ServiceCard key={service.id} service={service} canManage={canManage} disabled={operationPending} busy={busyAction.id === service.id ? busyAction.action : ''} onEdit={edit} onToggle={toggle} onDelete={remove} />) : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center xl:col-span-2"><div><span aria-hidden="true" className="text-4xl">✦</span><h2 className="mt-4 font-extrabold text-navy">No services yet</h2><p className="mt-2 text-sm text-slate-500">{canManage ? 'Create your first service for the organisation catalogue.' : 'Your organisation has not added any services yet.'}</p></div></div>}</div>}
  </section>
}
