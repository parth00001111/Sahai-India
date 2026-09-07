import { useCallback, useEffect, useMemo, useState } from 'react'
import { createOrganisationTask, getOrganisationTasks } from '../services/taskApi.js'
import LocationPicker from './LocationPicker.jsx'

const emptyForm = {
  assignedToId: '', title: '', description: '', complaintReference: '', complaintCategory: '', priority: 'medium',
  area: '', address: '', city: '', district: '', state: '', pincode: '', postOffice: '', lat: '', lng: '', locationSource: '',
}

const statusStyle = {
  assigned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-800',
  completed: 'bg-green-50 text-green-700',
}

function Evidence({ task }) {
  return <div className="mt-5 grid gap-3 sm:grid-cols-2">{[['Before', task.beforeImageUrl], ['After', task.afterImageUrl]].map(([name, url]) => <div key={name} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={`${name} task proof`} className="aspect-video w-full object-cover" /></a> : <div className="grid aspect-video place-items-center text-xs font-semibold text-slate-400">Awaiting photo</div>}<p className="px-3 py-2 text-xs font-extrabold text-navy">{name} work</p></div>)}</div>
}

function TaskRow({ task }) {
  const [expanded, setExpanded] = useState(false)
  const address = [task.address, task.city, task.district, task.state, task.pincode].filter(Boolean).join(', ')
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-[11px] font-extrabold capitalize ${statusStyle[task.status]}`}>{task.status.replaceAll('_', ' ')}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold capitalize text-slate-600">{task.priority}</span>{task.complaintReference && <span className="text-xs font-semibold text-slate-400">#{task.complaintReference}</span>}</div><h3 className="mt-3 text-lg font-extrabold text-navy">{task.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{task.description}</p></div><button onClick={() => setExpanded((value) => !value)} className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy">{expanded ? 'Hide details' : 'View details'}</button></div><div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs sm:grid-cols-2"><p><span className="font-extrabold text-slate-700">Assigned to:</span> {task.assignedTo?.profile?.fullName || task.assignedTo?.email}</p><p><span className="font-extrabold text-slate-700">Area:</span> {task.area}</p>{task.routedDepartment && <p className="sm:col-span-2"><span className="font-extrabold text-slate-700">Suggested routing:</span> {task.routedDepartment}</p>}</div>{expanded && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Verified work address</p><p className="mt-2 text-sm font-semibold leading-6 text-navy">{address}</p><p className="mt-1 text-xs text-slate-500">Post office: {task.postOffice || 'Not recorded'}</p>{task.completionNote && <div className="mt-4"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Staff completion note</p><p className="mt-2 text-sm leading-6 text-slate-600">{task.completionNote}</p></div>}<Evidence task={task} />{task.completedAt && <p className="mt-4 text-xs font-bold text-green-700">Completed {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(task.completedAt))}</p>}</div>}</article>
}

export default function OrganisationTasksPanel({ organisation }) {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [tab, setTab] = useState('active')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const staff = useMemo(() => (organisation.members || []).filter((member) => member.role === 'staff'), [organisation.members])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setTasks(await getOrganisationTasks()) }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    getOrganisationTasks()
      .then(setTasks)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const active = tasks.filter((task) => task.status !== 'completed')
  const completed = tasks.filter((task) => task.status === 'completed')
  const shown = tab === 'completed' ? completed : active
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }))

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    if (!form.postOffice || !form.lat || !form.lng) { setSaving(false); setError('Verify the PIN and choose the exact map location before assigning the task.'); return }
    try {
      const task = await createOrganisationTask(form)
      setTasks((current) => [task, ...current]); setForm(emptyForm); setShowForm(false); setTab('active'); setMessage('Task assigned. It is now visible in the staff member’s dashboard.')
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }
  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100'

  return <section><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Field operations</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Tasks</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Assign complaint work to active staff and review completed before-and-after evidence.</p></div><button onClick={() => setShowForm((value) => !value)} className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">{showForm ? 'Close form' : '+ Assign task'}</button></div>
    {staff.length === 0 && <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">Add a staff member from the Team section before assigning work.</p>}
    {showForm && <form onSubmit={submit} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-extrabold text-navy">New staff assignment</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Assign to staff *</span><select required name="assignedToId" value={form.assignedToId} onChange={change} className={inputClass}><option value="">Select staff member</option>{staff.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.profile?.fullName || member.user.email}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Priority</span><select name="priority" value={form.priority} onChange={change} className={inputClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Complaint category *</span><select required name="complaintCategory" value={form.complaintCategory} onChange={change} className={inputClass}><option value="">Select category for suggested routing</option><option value="sanitation">Sanitation / waste</option><option value="roads">Roads / potholes</option><option value="water">Water supply</option><option value="electricity">Electricity</option><option value="healthcare">Healthcare</option><option value="food">Food support</option><option value="shelter">Shelter / welfare</option><option value="disaster">Disaster response</option><option value="safety">Public safety</option><option value="other">Other civic issue</option></select></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Task title *</span><input required name="title" maxLength="140" value={form.title} onChange={change} placeholder="Example: Restore drinking water supply" className={inputClass} /></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Task details *</span><textarea required name="description" rows="4" maxLength="2000" value={form.description} onChange={change} placeholder="Explain the complaint and the expected resolution." className={inputClass} /></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Complaint reference</span><input name="complaintReference" value={form.complaintReference} onChange={change} placeholder="CMP-2026-001" className={inputClass} /></label><LocationPicker value={form} onChange={(location) => setForm((current) => ({ ...current, ...location }))} title="Verify complaint work location" showArea addressLabel="Complete complaint address" /></div><div className="mt-6 flex justify-end"><button disabled={saving || staff.length === 0} className="rounded-xl bg-india-green px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Assigning…' : 'Assign task'}</button></div></form>}
    {(message || error) && <p role="status" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>{error || message}</p>}
    <div className="mt-7 flex items-center justify-between gap-4"><div className="flex rounded-xl border border-slate-200 bg-white p-1"><button onClick={() => setTab('active')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'active' ? 'bg-navy text-white' : 'text-slate-600'}`}>Active ({active.length})</button><button onClick={() => setTab('completed')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'completed' ? 'bg-india-green text-white' : 'text-slate-600'}`}>Task done ({completed.length})</button></div><button onClick={load} className="text-xs font-extrabold text-blue-700">Refresh tasks</button></div>
    {loading ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading tasks…</div> : <div className="mt-5 grid gap-4">{shown.length ? shown.map((task) => <TaskRow key={task.id} task={task} />) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-extrabold text-navy">{tab === 'active' ? 'No active tasks' : 'No completed tasks yet'}</h2><p className="mt-2 text-sm text-slate-500">{tab === 'active' ? 'Assign the first task to a staff member.' : 'Staff submissions with both proof images will appear here.'}</p></div>}</div>}
  </section>
}
