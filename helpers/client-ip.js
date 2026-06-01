// Dedupes concurrent in-flight calls; each completed call refetches so a
// WS reconnect after a network change picks up the new IP.
let inflight = null

export const fetchClientIp = () => {
  if (inflight) return inflight

  inflight = fetch('https://ipinfo.io/json')
    .then(r => r.json())
    .then(d => (d && typeof d.ip === 'string' ? d.ip : null))
    .catch(() => null)
    .finally(() => {
      inflight = null
    })

  return inflight
}
