import { useCallback, useEffect, useMemo, useState } from 'react'
import logo from '../assets/sahai-india-logo.png'
import {
  completeOrganisationTask,
  getOrganisationTasks,
  startOrganisationTask,
  uploadOrganisationTaskProof,
} from '../services/taskApi.js'
import OrganisationServicesPanel from './OrganisationServicesPanel.jsx'

const statusStyle = {
  assigned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-800',
  completed: 'bg-green-50 text-green-700',
}

const priorityStyle = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
}

const label = (value) => value?.replaceAll('_', ' ') || ''

function TaskCard({ task, selected, onSelect }) {
  return <button onClick={() => onSelect(task.id)} className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md ${selected ? 'border-navy ring-2 ring-blue-100' : 'border-slate-200'}`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-3 py-1 text-[11px] font-extrabold capitalize ${statusStyle[task.status]}`}>{label(task.status)}</span><span className={`rounded-full px-3 py-1 text-[11px] font-extrabold capitalize ${priorityStyle[task.priority]}`}>{task.priority}</span></div>
    <h3 className="mt-4 font-extrabold text-navy">{task.title}</h3>
    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{task.description}</p>
    <p className="mt-4 text-xs font-bold text-slate-700">📍 {task.area}</p>
  </button>
}

function TaskDetail({ task, onUpdated }) {
  const [beforeImage, setBeforeImage] = useState(null)
  const [afterImage, setAfterImage] = useState(null)
  const [completionNote, setCompletionNote] = useState(task.completionNote || '')
  const [working, setWorking] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const address = [task.address, task.city, task.district, task.state, task.pincode].filter(Boolean).join(', ')
  const mapQuery = task.lat != null && task.lng != null ? `${task.lat},${task.lng}` : address

  const start = async () => {
    setWorking('start'); setError(''); setMessage('')
    try { const updated = await startOrganisationTask(task.id); onUpdated(updated); setMessage('Task started. Upload the before photo before beginning work.') }
    catch (requestError) { setError(requestError.message) }
    finally { setWorking('') }
  }

  const saveProof = async (event) => {
    event.preventDefault(); setWorking('proof'); setError(''); setMessage('')
    if (!beforeImage && !afterImage) { setError('Select at least one image to upload.'); setWorking(''); return }
    try {
      const updated = await uploadOrganisationTaskProof(task.id, { beforeImage, afterImage, completionNote })
      onUpdated(updated); setBeforeImage(null); setAfterImage(null); setMessage('Evidence saved securely. The task is not closed yet.')
    } catch (requestError) { setError(requestError.message) }
    finally { setWorking('') }
  }

  const complete = async () => {
    setWorking('complete'); setError(''); setMessage('')
    try { const updated = await completeOrganisationTask(task.id, completionNote); onUpdated(updated); setMessage('Task completed. Your organisation admin can now review both proof images.') }
    catch (requestError) { setError(requestError.message) }
    finally { setWorking('') }
  }

  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-700">Task details</p><h2 className="mt-2 text-2xl font-extrabold text-navy">{task.title}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-extrabold capitalize ${statusStyle[task.status]}`}>{label(task.status)}</span></div><p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{task.description}</p></div>
    <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-2 sm:p-7"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Complaint area</p><p className="mt-2 font-bold text-navy">{task.area}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Priority</p><p className="mt-2 font-bold capitalize text-navy">{task.priority}</p></div>{task.complaintReference && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Complaint reference</p><p className="mt-2 font-bold text-navy">{task.complaintReference}</p></div>}<div className={task.complaintReference ? '' : 'sm:col-span-2'}><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Work address</p><p className="mt-2 text-sm font-semibold leading-6 text-navy">{address}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-extrabold text-blue-700">Open directions ↗</a></div></div>

    <div className="p-5 sm:p-7">
      {task.status === 'assigned' && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><h3 className="font-extrabold text-navy">Ready to visit the location?</h3><p className="mt-2 text-sm text-slate-600">Start the task, then take and upload the before photo before doing the work.</p><button disabled={working !== ''} onClick={start} className="mt-4 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{working === 'start' ? 'Starting…' : 'Start work'}</button></div>}

      {task.status !== 'assigned' && <div><div className="flex items-center justify-between"><div><h3 className="font-extrabold text-navy">Before & after evidence</h3><p className="mt-1 text-sm text-slate-500">Both photos are mandatory before this task can be closed.</p></div>{task.status === 'completed' && <span className="text-2xl">✓</span>}</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{[['Before work', task.beforeImageUrl], ['After work', task.afterImageUrl]].map(([title, url]) => <div key={title} className="overflow-hidden rounded-2xl border border-slate-200"><div className="grid aspect-video place-items-center bg-slate-100">{url ? <a href={url} target="_blank" rel="noreferrer" className="h-full w-full"><img src={url} alt={`${title} evidence`} className="h-full w-full object-cover" /></a> : <span className="text-sm font-semibold text-slate-400">Not uploaded</span>}</div><p className="px-4 py-3 text-xs font-extrabold text-navy">{title}</p></div>)}</div>

        {task.status !== 'completed' && <form onSubmit={saveProof} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-extrabold text-slate-700">Before image {task.beforeImageUrl && '(replace)'}</span><input type="file" accept="image/jpeg,image/png" capture="environment" onChange={(event) => setBeforeImage(event.target.files?.[0] || null)} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-bold file:text-navy" /></label><label className="block"><span className="mb-2 block text-xs font-extrabold text-slate-700">After image {task.afterImageUrl && '(replace)'}</span><input type="file" accept="image/jpeg,image/png" capture="environment" onChange={(event) => setAfterImage(event.target.files?.[0] || null)} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-100 file:px-3 file:py-2 file:font-bold file:text-green-800" /></label></div><label className="mt-4 block"><span className="mb-2 block text-xs font-extrabold text-slate-700">Work note</span><textarea rows="3" maxLength="1000" value={completionNote} onChange={(event) => setCompletionNote(event.target.value)} placeholder="Briefly explain what was done…" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-navy" /></label><button disabled={working !== ''} className="mt-4 rounded-xl border border-navy bg-white px-5 py-3 text-sm font-bold text-navy disabled:opacity-60">{working === 'proof' ? 'Uploading…' : 'Save evidence'}</button></form>}

        {task.status !== 'completed' && <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold text-green-900">Finish only after the work is resolved</h3><p className="mt-1 text-xs leading-5 text-green-800">The server will block completion until both proof images are saved.</p></div><button disabled={working !== '' || !task.beforeImageUrl || !task.afterImageUrl} onClick={complete} className="shrink-0 rounded-xl bg-india-green px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{working === 'complete' ? 'Completing…' : 'Mark task done'}</button></div>}
      </div>}
      {(message || error) && <p role="status" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>{error || message}</p>}
    </div>
  </article>
}

export default function OrganisationStaffDashboard({ organisation, onBack }) {
  const [tasks, setTasks] = useState([])
  const [workspace, setWorkspace] = useState('tasks')
  const [view, setView] = useState('active')
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await getOrganisationTasks()
      setTasks(result)
      setSelectedId((current) => current || result[0]?.id || null)
    } catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    getOrganisationTasks()
      .then((result) => { setTasks(result); setSelectedId(result[0]?.id || null) })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const activeTasks = useMemo(() => tasks.filter((task) => task.status !== 'completed'), [tasks])
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === 'completed'), [tasks])
  const shown = view === 'completed' ? completedTasks : activeTasks
  const selected = tasks.find((task) => task.id === selectedId && (view === 'completed' ? task.status === 'completed' : task.status !== 'completed')) || shown[0]
  const updateTask = (updated) => { setTasks((current) => current.map((task) => task.id === updated.id ? updated : task)); setSelectedId(updated.id) }

  return <div className="min-h-screen bg-[#f5f7fb] text-ink"><div className="h-1.5 bg-gradient-to-r from-saffron via-white to-india-green" />
    {organisation.status !== 'verified' && <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-semibold text-amber-900">Organisation approval is still pending. You can view assigned work while the application is reviewed.</div>}
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><img src={organisation.logoUrl || logo} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain" /><div className="min-w-0"><strong className="block truncate text-sm text-navy">{organisation.organisationName}</strong><span className="text-xs text-slate-500">Staff workspace</span></div></div><div className="flex items-center gap-3">{workspace === 'tasks' && <button disabled={loading} onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy disabled:opacity-50">{loading ? 'Refreshing…' : 'Refresh tasks'}</button>}<button onClick={onBack} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy">Website</button></div></div></header>
    <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9"><div role="tablist" aria-label="Staff workspace" className="mb-8 flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><button type="button" role="tab" aria-selected={workspace === 'tasks'} onClick={() => setWorkspace('tasks')} className={`rounded-lg px-5 py-2.5 text-sm font-bold ${workspace === 'tasks' ? 'bg-navy text-white' : 'text-slate-600'}`}>Tasks</button><button type="button" role="tab" aria-selected={workspace === 'services'} onClick={() => setWorkspace('services')} className={`rounded-lg px-5 py-2.5 text-sm font-bold ${workspace === 'services' ? 'bg-navy text-white' : 'text-slate-600'}`}>Services</button></div>
      {workspace === 'services' ? <OrganisationServicesPanel organisation={organisation} canManage={false} /> : <><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Field operations</p><h1 className="mt-2 text-3xl font-extrabold text-navy">My assigned tasks</h1><p className="mt-2 text-sm text-slate-500">View locations, complete the work, and provide photo evidence.</p></div><div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><button onClick={() => { setView('active'); setSelectedId(activeTasks[0]?.id || null) }} className={`rounded-lg px-4 py-2 text-sm font-bold ${view === 'active' ? 'bg-navy text-white' : 'text-slate-600'}`}>Active ({activeTasks.length})</button><button onClick={() => { setView('completed'); setSelectedId(completedTasks[0]?.id || null) }} className={`rounded-lg px-4 py-2 text-sm font-bold ${view === 'completed' ? 'bg-india-green text-white' : 'text-slate-600'}`}>Done ({completedTasks.length})</button></div></div>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {loading ? <div role="status" className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500">Loading your tasks…</div> : shown.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><p aria-hidden="true" className="text-3xl">✓</p><h2 className="mt-3 font-extrabold text-navy">{view === 'active' ? 'No active tasks' : 'No completed tasks yet'}</h2><p className="mt-2 text-sm text-slate-500">{view === 'active' ? 'New assignments from your organisation admin will appear here.' : 'Completed work with proof will be recorded here.'}</p></div> : <div className="mt-8 grid items-start gap-6 lg:grid-cols-[330px_1fr]"><div className="grid gap-3">{shown.map((task) => <TaskCard key={task.id} task={task} selected={selected?.id === task.id} onSelect={setSelectedId} />)}</div>{selected && <TaskDetail key={selected.id} task={selected} onUpdated={updateTask} />}</div>}</>}
    </main>
  </div>
}
