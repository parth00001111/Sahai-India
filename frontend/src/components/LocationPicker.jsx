import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { getPincodeDetails, reverseCoordinates } from '../services/locationApi.js'

const INDIA_CENTER = [22.5937, 78.9629]
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-blue-100 read-only:bg-slate-50 read-only:text-slate-600'
const normalise = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '')

function MapController({ position, onPick }) {
  const map = useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) })
  useEffect(() => {
    if (position) map.setView(position, 16)
  }, [map, position])
  return position ? <CircleMarker center={position} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#0a3472', fillOpacity: 1 }} /> : null
}

export default function LocationPicker({ value, onChange, title = 'Verify location', showArea = false, addressLabel = 'Complete address' }) {
  const [postOffices, setPostOffices] = useState([])
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const pinRequest = useRef(0)
  const mapRequest = useRef(0)
  const position = useMemo(() => {
    const lat = Number(value.lat); const lng = Number(value.lng)
    return Number.isFinite(lat) && Number.isFinite(lng) && value.lat !== '' && value.lng !== '' ? [lat, lng] : null
  }, [value.lat, value.lng])
  const verified = /^\d{6}$/.test(value.pincode || '') && value.postOffice && position

  const applyOffice = (office) => onChange({
    postOffice: office.name,
    district: office.district,
    state: office.state,
    city: office.block || office.district,
    ...(showArea ? { area: office.name } : {}),
  })

  const lookup = async (pin, base = value) => {
    if (!/^\d{6}$/.test(pin)) { setError('Enter all 6 digits of the PIN code.'); return null }
    const requestId = ++pinRequest.current
    setLoading('pin'); setError('')
    try {
      const result = await getPincodeDetails(pin)
      if (requestId !== pinRequest.current) return null
      setPostOffices(result.postOffices)
      const first = result.postOffices[0]
      const areaHint = normalise(base.area)
      const exact = result.postOffices.find((office) => office.name === base.postOffice)
      const areaMatch = areaHint.length >= 4 ? result.postOffices.find((office) => {
        const officeName = normalise(office.name)
        return officeName.includes(areaHint) || areaHint.includes(officeName)
      }) : null
      const selected = exact || areaMatch || (result.postOffices.length === 1 ? first : null)
      const blocks = [...new Set(result.postOffices.map((office) => office.block).filter(Boolean))]
      onChange({
        pincode: result.pincode,
        postOffice: selected?.name || '',
        district: first.district,
        state: first.state,
        city: selected?.block || (blocks.length === 1 ? blocks[0] : ''),
        ...(showArea ? { area: base.area || selected?.name || '' } : {}),
      })
      return result
    } catch (requestError) { if (requestId === pinRequest.current) { setPostOffices([]); setError(requestError.message) }; return null }
    finally { if (requestId === pinRequest.current) setLoading('') }
  }

  const updatePin = (event) => {
    const pincode = event.target.value.replace(/\D/g, '').slice(0, 6)
    const changed = pincode !== value.pincode
    pinRequest.current += 1
    mapRequest.current += 1
    const next = { ...value, pincode, postOffice: '', city: '', district: '', state: '', ...(showArea ? { area: '' } : {}), ...(changed ? { lat: '', lng: '', locationSource: '' } : {}) }
    onChange({ pincode, postOffice: '', city: '', district: '', state: '', ...(showArea ? { area: '' } : {}), ...(changed ? { lat: '', lng: '', locationSource: '' } : {}) }); setPostOffices([]); setError('')
    if (pincode.length === 6) lookup(pincode, next)
  }

  const resolvePosition = async (lat, lng, source) => {
    const requestId = ++mapRequest.current
    setLoading('map'); setError('')
    try {
      const resolved = await reverseCoordinates(lat, lng)
      if (requestId !== mapRequest.current) return
      const next = {
        ...value,
        lat: Number(lat).toFixed(6),
        lng: Number(lng).toFixed(6),
        locationSource: source,
        pincode: resolved.pincode || value.pincode,
        address: resolved.address || value.address,
        area: showArea ? (resolved.area || value.area) : value.area,
        city: resolved.city || value.city,
        district: resolved.district || value.district,
        state: resolved.state || value.state,
        postOffice: '',
      }
      onChange({
        lat: next.lat, lng: next.lng, locationSource: next.locationSource, pincode: next.pincode,
        address: next.address, area: next.area, city: next.city, district: next.district,
        state: next.state, postOffice: '',
      })
      if (next.pincode) await lookup(next.pincode, next)
      else setError('A PIN code was not found here. Enter the PIN manually and verify it.')
    } catch (requestError) { if (requestId === mapRequest.current) setError(requestError.message) }
    finally { if (requestId === mapRequest.current) setLoading('') }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError('Location access is not supported by this browser.'); return }
    setLoading('gps'); setError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolvePosition(coords.latitude, coords.longitude, 'browser_geolocation'),
      (locationError) => { setLoading(''); setError(locationError.code === 1 ? 'Location permission was denied. Allow it in browser settings or choose the point on the map.' : 'Current location could not be detected. Choose the point on the map.') },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }

  return <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold text-navy">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">Enter the PIN to fetch postal details, then confirm the exact point using your device or the map.</p></div><button type="button" onClick={useCurrentLocation} disabled={Boolean(loading)} className="shrink-0 rounded-xl bg-navy px-4 py-3 text-xs font-bold text-white disabled:opacity-60">{loading === 'gps' ? 'Locating…' : '⌖ Use current location'}</button></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-slate-700">PIN code *</span><div className="flex gap-2"><input required pattern="[0-9]{6}" inputMode="numeric" value={value.pincode || ''} onChange={updatePin} placeholder="6-digit PIN" className={inputClass} /><button type="button" onClick={() => lookup(value.pincode)} disabled={loading === 'pin'} className="rounded-xl border border-navy bg-white px-4 text-xs font-extrabold text-navy disabled:opacity-60">{loading === 'pin' ? 'Checking…' : 'Check'}</button></div></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Post office / locality *</span><select required value={value.postOffice || ''} onChange={(event) => { const office = postOffices.find((item) => item.name === event.target.value); if (office) applyOffice(office) }} disabled={!postOffices.length} className={inputClass}><option value="">{postOffices.length ? `Select the correct locality (${postOffices.length} found)` : 'Verify PIN first'}</option>{postOffices.map((office) => <option key={`${office.name}-${office.branchType}`} value={office.name}>{office.name}{office.block ? ` · ${office.block}` : ''} · {office.branchType}</option>)}</select><span className="mt-1.5 block text-[11px] leading-4 text-slate-500">A PIN can cover several post offices. Select yours instead of relying on the first result.</span></label>{showArea && <label><span className="mb-2 block text-sm font-bold text-slate-700">Area / locality *</span><input required value={value.area || ''} onChange={(event) => onChange({ area: event.target.value })} placeholder="Locality or ward" className={inputClass} /></label>}<label><span className="mb-2 block text-sm font-bold text-slate-700">City / town *</span><input required value={value.city || ''} onChange={(event) => onChange({ city: event.target.value })} className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">District *</span><input required readOnly value={value.district || ''} className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">State / UT *</span><input required readOnly value={value.state || ''} className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">{addressLabel} *</span><textarea required rows="3" value={value.address || ''} onChange={(event) => onChange({ address: event.target.value })} placeholder="House/building, street and landmark" className={`${inputClass} resize-y`} /></label></div>
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><MapContainer center={position || INDIA_CENTER} zoom={position ? 16 : 4} scrollWheelZoom className="h-64 w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapController position={position} onPick={(lat, lng) => resolvePosition(lat, lng, 'map_pin')} /></MapContainer><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3"><p className="text-xs text-slate-500">Click the map to place or move the exact location pin.</p>{position && <p className="font-mono text-[11px] text-slate-500">{position[0].toFixed(5)}, {position[1].toFixed(5)}</p>}</div></div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</p>}{verified && <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-green-800">✓ PIN, post office, and exact coordinates are ready for server verification.</p>}
    <p className="mt-3 text-[11px] leading-5 text-slate-400">Map data © OpenStreetMap contributors. Reverse geocoding suggests an address; verify your house/street details before submitting.</p>
  </div>
}
