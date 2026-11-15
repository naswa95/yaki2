import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

const LOGO_H = `${import.meta.env.BASE_URL}yaki-logo.png`
type M = { id: string; prenom: string; days: number[]; hrs: number[]; likes: number[] }
type Me = { id: string; prenom: string; login: string; role: string; done: boolean }
type Sortie = { id: string; groupeId: string; nom: string; date: string; debut: string; fin: string; lieu: string; description: string; lien: string; organisateur: string; statut: string; type: string; dateFin: string; budget: number; compteur: boolean }
type Dep = { id: string; sortieId: string; libelle: string; montant: number; payeur: string; parts: string[] }
type St = { me: Me; groupes: { id: string; nom: string; n: number }[]; adhesions: { groupeId: string; userId: string }[]; membres: M[]; sorties: Sortie[]; depenses: Dep[]; participations: { sortieId: string; userId: string; reponse: string }[] }
type Act = (a: string, b: Record<string, unknown>, ok?: string) => Promise<boolean>
type Tab = 'home' | 'cal' | 'groups' | 'me'
const DN = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const HR = [['Matin', '6h – 12h', '06:00', '12:00'], ['Après-midi', '12h – 18h', '12:00', '18:00'], ['Soirée', '18h – minuit', '18:00', '24:00'], ['Nuit', 'minuit – 6h', '00:00', '06:00']]
const LK = ['🍜 Resto', '🎳 Bowling', '🎬 Ciné', '🎉 Soirée', '⚽ Foot', '🏎️ Karting', '🎢 Parc', '🏖️ Week-end']
const PAL = [['#526BFF', '#fff'], ['#FF786B', '#17233B'], ['#FFD84D', '#17233B'], ['#17233B', '#fff']]
const COL = ['#526BFF', '#FF786B', '#35B77A', '#F2A93B']
const btn = 'rounded-full px-6 py-4 font-bold active:translate-y-0.5 active:scale-[.97] transition disabled:opacity-40 shadow-[0_3px_0_rgba(23,35,59,.12)]'
const go = `${btn} bg-ink text-sun`
const inp = 'w-full rounded-[20px] bg-white border-2 border-transparent focus:border-ink px-4 py-4 text-base font-semibold outline-none'
const card = 'bg-white rounded-[30px] p-5 space-y-3'
const fmt = (d: string) => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const todayParis = () => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date())
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5)
const em = (n: string) => /bowl/i.test(n) ? '🎳' : /resto|manger|burger/i.test(n) ? '🍜' : /cin/i.test(n) ? '🎬' : /foot/i.test(n) ? '⚽' : /kart/i.test(n) ? '🏎️' : /parc/i.test(n) ? '🎢' : /soir/i.test(n) ? '🎉' : '✨'
const Av = ({ n }: { n: string }) => <span style={{ background: COL[(n.charCodeAt(0) || 0) % 4] }} className="inline-flex w-8 h-8 items-center justify-center rounded-full text-white font-extrabold text-sm shrink-0">{(n[0] || '?').toUpperCase()}</span>
const Pill = ({ n }: { n: string }) => <span className="inline-flex items-center gap-1.5 bg-bg rounded-full pr-3 text-sm font-semibold"><Av n={n} />{n}</span>
const Logo = ({ s = 'text-3xl' }: { s?: string; img?: string }) => <img src={LOGO_H} alt="yaki" className={`w-auto max-w-full object-contain ${s === 'text-3xl' ? 'h-9' : s === 'text-5xl' ? 'h-14' : 'h-16'}`} />
const membersOf = (st: St, g: string) => st.adhesions.filter(a => a.groupeId === g).map(a => a.userId)
const nameOf = (st: St, id: string) => st.membres.find(m => m.id === id)?.prenom ?? '?'
function rep(st: St, s: Sortie) {
  const p = st.participations.filter(x => x.sortieId === s.id), mem = membersOf(st, s.groupeId)
  const a = p.filter(x => x.reponse === 'disponible').map(x => x.userId), k = p.filter(x => x.reponse === 'indisponible').map(x => x.userId)
  return { a, k, n: mem.filter(m => !a.includes(m) && !k.includes(m)) }
}
const busyBy = (m: M, w: number, debut: string) => m.days.includes(w) || (!!debut && m.hrs.some(i => debut >= HR[i][2] && debut < HR[i][3]))
const busy = (st: St, g: string, date: string, debut: string) => !date ? [] : membersOf(st, g).map(u => st.membres.find(m => m.id === u)).filter((m): m is M => !!m && busyBy(m, new Date(date + 'T12:00').getDay(), debut)).map(m => m.prenom)
function boom() {
  const c = document.createElement('canvas'); c.width = innerWidth; c.height = innerHeight; c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99'; document.body.appendChild(c)
  const x = c.getContext('2d')!, P = Array.from({ length: 90 }, () => ({ x: innerWidth / 2, y: innerHeight * .6, vx: (Math.random() - .5) * 14, vy: -Math.random() * 16 - 4, r: Math.random() * 6 + 3, c: ['#FFD84D', '#FF786B', '#526BFF', '#35B77A'][Math.floor(Math.random() * 4)] })); let n = 0
  const f = () => { x.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .5; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.r, p.r * 1.6) }); if (++n < 60) requestAnimationFrame(f); else c.remove() }; f()
}

function Loader() { return <div className="fixed inset-0 z-[80] bg-bg flex flex-col items-center justify-center gap-4 p-8 text-center"><img src={LOGO_H} alt="yaki" className="h-16 w-auto max-w-[70%] object-contain" style={{ animation: 'pulse2 1.4s ease-in-out infinite' }} /><p className="font-bold">Chargement — ça prendra quelques secondes</p></div> }
function Auth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'register' | 'login'>('register'), [f, setF] = useState({ prenom: '', pin: '', login: '' })
  const [err, setErr] = useState(''), [wait, setWait] = useState(false), [created, setCreated] = useState('')
  const run = async () => { setWait(true); setErr(''); try { const r = await api(mode, { ...f, prenom: f.prenom.split('#')[0].trim() }); localStorage.setItem('yaki_token', r.token); mode === 'register' ? setCreated(r.me.login) : onDone() } catch (e: any) { setErr(e.message) } finally { setWait(false) } }
  if (created) return <div className="p-6 pt-20 max-w-md mx-auto space-y-5"><div className="flex justify-center"><Logo s="text-5xl" /></div><h2 className="text-4xl leading-none">Voici ton identifiant. Note-le !</h2><div className="bg-sun rounded-[30px] p-5 -rotate-1"><p className="text-sm">Il sert à te reconnecter</p><p className="f text-4xl">{created}</p></div><button className={`${go} w-full text-lg`} onClick={onDone}>C'est noté</button></div>
  return <div className="p-6 pt-20 max-w-md mx-auto space-y-4">{wait && <Loader />}<div className="flex justify-center"><Logo s="text-5xl" /></div><h2 className="text-4xl leading-none pt-4">{mode === 'register' ? <>Y'a qui pour <span className="text-acc">sortir ?</span></> : 'Content de te revoir'}</h2>
    {mode === 'register' ? <input className={inp} placeholder="Ton prénom (juste le prénom)" value={f.prenom} onChange={e => setF({ ...f, prenom: e.target.value.split('#')[0] })} /> : <input className={inp} placeholder="Prénom#numéro (ex : Anas#1234)" value={f.login} onChange={e => setF({ ...f, login: e.target.value })} />}
    <input className={inp} type="password" inputMode="numeric" placeholder="Code secret (4 à 8 chiffres)" value={f.pin} onChange={e => setF({ ...f, pin: e.target.value })} />
    {err && <p className="text-ko text-sm font-semibold">{err}</p>}<button disabled={wait} onClick={run} className={`${go} w-full text-lg`}>{wait ? '…' : mode === 'register' ? 'C\'est parti' : 'Me connecter'}</button>
    <button className={`${btn} w-full bg-white`} onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? "J'ai déjà un compte" : 'Créer un compte'}</button></div>
}

function Onb({ st, first, act, done }: { st: St; first: boolean; act: Act; done: () => void }) {
  const me = st.membres.find(m => m.id === st.me.id)
  const [step, setStep] = useState(first ? 0 : 1), [pn, setPn] = useState(st.me.prenom), [days, setD] = useState<number[]>(me?.days ?? []), [hrs, setH] = useState<number[]>(me?.hrs ?? []), [likes, setL] = useState<number[]>(me?.likes ?? [])
  const tog = (a: number[], set: (x: number[]) => void, v: number) => set(a.includes(v) ? a.filter(x => x !== v) : [...a, v])
  const next = async () => {
    if (step === 0 && pn.trim() && pn.trim() !== st.me.prenom) { try { await api('profil', { prenom: pn }) } catch { /* ignoré */ } }
    if (step < 2) return setStep(step + 1)
    if (await act('profilSave', { days, hrs, likes }, 'Disponibilités enregistrées')) { boom(); done() }
  }
  const opt = (on: boolean) => `rounded-[22px] px-4 py-4 font-bold text-left transition shadow-[0_3px_0_rgba(23,35,59,.12)] ${on ? 'bg-ink text-white -rotate-1 scale-[1.03]' : 'bg-white'}`
  return <div className="fixed inset-0 bg-bg z-40 flex flex-col p-6 max-w-md mx-auto"><div className="flex gap-1.5">{[0, 1, 2].map(i => <i key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-ink' : 'bg-ink/10'}`} />)}</div>
    <div key={step} className="flex-1 flex flex-col justify-center gap-5" style={{ animation: 'pop .45s cubic-bezier(.3,1.3,.5,1)' }}>
      {step === 0 && <><div className="flex justify-center"><Logo s="text-6xl" /></div><h2 className="text-4xl leading-none">Y'a qui pour <span className="text-coral">sortir ?</span></h2><p className="text-mute">Quelques questions rapides pour que tes potes sachent quand tu es dispo.</p><input className={inp} placeholder="Ton prénom" value={pn} onChange={e => setPn(e.target.value)} /></>}
      {step === 1 && <><h2 className="text-4xl leading-none">Des jours où <span className="text-coral">c'est mort</span> pour toi ?</h2><p className="text-mute">Touche les jours où tu ne peux jamais sortir.</p>
        <div className="flex gap-2">{[1, 2, 3, 4, 5, 6, 0].map(d => <button key={d} onClick={() => tog(days, setD, d)} className={`flex-1 aspect-square rounded-full f text-lg transition shadow-[0_3px_0_rgba(23,35,59,.12)] ${days.includes(d) ? 'bg-coral scale-110 -rotate-6 shadow-[0_5px_0_#17233B]' : 'bg-white'}`}>{DN[d][0]}</button>)}</div>
        <p className="text-mute text-sm">{days.length ? days.map(d => DN[d]).join(', ') : "Aucun jour : tu es libre tout le temps."}</p></>}
      {step === 2 && <><h2 className="text-4xl leading-none">Des heures où <span className="text-coral">c'est mort</span> ?</h2><p className="text-mute">Plusieurs choix possibles, ou aucun.</p><div className="grid grid-cols-2 gap-3">{HR.map((h, i) => <button key={i} onClick={() => tog(hrs, setH, i)} className={opt(hrs.includes(i))}>{h[0]}<small className="block text-xs font-medium opacity-70">{h[1]}</small></button>)}</div></>}
    </div><div className="flex gap-3">{step > (first ? 0 : 1) && <button className={`${btn} bg-white`} onClick={() => setStep(step - 1)}>←</button>}<button className={`${go} flex-1 text-lg`} onClick={next}>{step === 2 ? 'Terminer' : 'Suivant'}</button>{!first && <button className={`${btn} bg-white`} onClick={done}>✕</button>}</div></div>
}

const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €'
const when = (s: Sortie) => s.type === 'voyage' && s.dateFin ? `${fmt(s.date)} → ${fmt(s.dateFin)}` : fmt(s.date) + (s.debut ? ' · ' + s.debut : '')
const last = (s: Sortie) => s.dateFin || s.date
function bal(st: St, s: Sortie): [string, string, number][] {
  const m: Record<string, number> = {}
  st.depenses.filter(d => d.sortieId === s.id).forEach(d => { m[d.payeur] = (m[d.payeur] || 0) + d.montant; d.parts.forEach(p => { m[p] = (m[p] || 0) - d.montant / d.parts.length }) })
  const cr = Object.entries(m).filter(([, v]) => v > .01).sort((a, b) => b[1] - a[1]), db = Object.entries(m).filter(([, v]) => v < -.01).map(([k, v]) => [k, -v] as [string, number]).sort((a, b) => b[1] - a[1]), t: [string, string, number][] = []
  let i = 0, j = 0
  while (i < db.length && j < cr.length) { const x = Math.min(db[i][1], cr[j][1]); t.push([db[i][0], cr[j][0], x]); db[i][1] -= x; cr[j][1] -= x; if (db[i][1] < .01) i++; if (cr[j][1] < .01) j++ }
  return t
}
function lk(u: string) { try { const h = new URL(u).hostname.replace('www.', ''); const t = /tiktok/.test(h) ? '🎵 Voir le TikTok' : /instagram/.test(h) ? '📸 Voir sur Instagram' : /youtu/.test(h) ? '▶️ Voir la vidéo' : /google|maps|goo\.gl/.test(h) ? '📍 Ouvrir dans Maps' : '🔗 Ouvrir le site · ' + h; return <a href={u} target="_blank" rel="noopener noreferrer" className="block text-center bg-ink text-sun rounded-full py-4 font-bold">{t}</a> } catch { return null } }

function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [onClose])
  return <div onClick={onClose} className="fixed inset-0 z-30 bg-ink/55 backdrop-blur-[3px] flex items-end sm:items-center justify-center"><div onClick={e => e.stopPropagation()} className="bg-bg w-full max-w-lg max-h-[92vh] overflow-auto rounded-t-[32px] sm:rounded-[32px] p-5 pb-8 space-y-4 relative"><button onClick={onClose} className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white font-bold z-10">✕</button>{children}</div></div>
}

function Card({ s, i, st, onOpen }: { s: Sortie; i: number; st: St; onOpen: (s: Sortie) => void }) {
  const r = rep(st, s), mem = membersOf(st, s.groupeId), [bg, fg] = PAL[i % 4], d = dayDiff(todayParis(), s.date)
  const ring = (u: string) => r.a.includes(u) ? '#35B77A' : r.k.includes(u) ? '#EF6464' : 'rgba(255,255,255,.7)', tag = 'text-[11px] font-bold rounded-full px-3 py-1.5 bg-white/25'
  return <button onClick={() => onOpen(s)} style={{ background: bg, color: fg, animationDelay: `${Math.min(i, 8) * 60}ms` }} className={`relative overflow-hidden text-left rounded-[34px] p-5 space-y-3 w-full active:scale-[.97] hover:-rotate-1 hover:-translate-y-1 transition animate-[rise_.5s_both] ${s.statut === 'annulée' ? 'opacity-50' : ''}`}>
    <span className="absolute -right-1 -top-1 text-[84px] rotate-12">{s.type === 'voyage' ? '✈️' : em(s.nom)}</span>
    <div className="flex flex-wrap gap-1.5 max-w-[75%]"><span className={tag}>{s.type === 'voyage' ? '✈️ Voyage' : 'Sortie'}</span><span className={tag}>{when(s)}{d >= 0 && ` · dans ${d} j`}</span>{s.budget > 0 && <span className={tag}>💶 ~{s.budget} €/pers</span>}{s.compteur && <span className={tag}>🧾 Dépenses</span>}{s.lien && <span className={tag}>🔗 Lien</span>}{s.statut !== 'proposition' && <span className={tag}>{s.statut}</span>}</div>
    <h3 className="text-3xl leading-none max-w-[70%] relative">{s.nom}</h3><p className="text-sm opacity-80">{s.lieu || 'Lieu à définir'} · idée de {nameOf(st, s.organisateur)}</p>
    <div className="flex items-end gap-2"><b className="f text-6xl leading-[.8]">{r.a.length}</b><span className="font-bold text-sm">/ {mem.length} partants{r.n.length ? ` · ${r.n.length} à convaincre` : ''}</span></div>
    <div className="flex gap-1 h-2.5">{mem.map(u => <i key={u} className="flex-1 rounded-full" style={{ background: r.a.includes(u) ? '#35B77A' : r.k.includes(u) ? '#EF6464' : 'rgba(255,255,255,.3)' }} />)}</div>
    <div className="flex">{mem.map(u => <span key={u} className="-ml-2 first:ml-0 rounded-full border-[3px]" style={{ borderColor: ring(u), borderStyle: r.n.includes(u) ? 'dashed' : 'solid' }}><Av n={nameOf(st, u)} /></span>)}</div></button>
}

function ExpForm({ st, s, dep, act, done }: { st: St; s: Sortie; dep: Dep | null; act: Act; done: () => void }) {
  const mem = membersOf(st, s.groupeId), [l, setL] = useState(dep?.libelle ?? ''), [m, setM] = useState(dep ? String(dep.montant) : ''), [by, setBy] = useState(dep?.payeur ?? st.me.id), [parts, setP] = useState<string[]>(dep?.parts ?? mem)
  const can = !dep || dep.payeur === st.me.id || s.organisateur === st.me.id || st.me.role === 'admin'
  return <><h2 className="text-3xl pr-10">{dep ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>
    <input className={inp} placeholder="Quoi ? (essence, resto, hôtel…)" value={l} onChange={e => setL(e.target.value)} /><input className={inp} type="number" inputMode="decimal" placeholder="Montant (€)" value={m} onChange={e => setM(e.target.value)} />
    <select className={inp} value={by} onChange={e => setBy(e.target.value)}>{mem.map(u => <option key={u} value={u}>Payé par {nameOf(st, u)}</option>)}</select>
    <p className="text-sm text-mute">Partagée entre :</p><div className="flex flex-wrap gap-2">{mem.map(u => <button key={u} onClick={() => setP(parts.includes(u) ? parts.filter(x => x !== u) : [...parts, u])} className={`rounded-full px-4 py-2.5 font-bold text-sm ${parts.includes(u) ? 'bg-ink text-white' : 'bg-white'}`}>{nameOf(st, u)}</button>)}</div>
    {can ? <button className={`${go} w-full`} onClick={async () => { if (await act('depSave', { sortieId: s.id, id: dep?.id, libelle: l, montant: parseFloat(m), payeur: by, parts }, dep ? 'Dépense modifiée' : 'Dépense ajoutée')) done() }}>{dep ? 'Enregistrer' : 'Ajouter'}</button> : <p className="text-sm text-mute">Seul celui qui a payé ou l'organisateur peut la modifier.</p>}
    {dep && can && <button className={`${btn} w-full bg-white text-ko`} onClick={async () => { if (confirm('Supprimer cette dépense ?') && await act('depDelete', { id: dep.id }, 'Dépense supprimée')) done() }}>Supprimer cette dépense</button>}<button className={`${btn} w-full bg-white`} onClick={done}>Annuler</button></>
}

function Detail({ s, st, act, close, edit }: { s: Sortie; st: St; act: Act; close: () => void; edit: (s: Sortie) => void }) {
  const [ex, setEx] = useState<Dep | 'new' | null>(null)
  const r = rep(st, s), mine = st.participations.find(p => p.sortieId === s.id && p.userId === st.me.id)?.reponse, can = s.organisateur === st.me.id || st.me.role === 'admin', deps = st.depenses.filter(d => d.sortieId === s.id), t = bal(st, s)
  const L = ({ t: ti, ids, c }: { t: string; ids: string[]; c: string }) => <div className="space-y-2"><p className={`font-bold text-sm ${c}`}>{ti} · {ids.length}</p><div className="flex flex-wrap gap-2">{ids.length ? ids.map(i => <Pill key={i} n={nameOf(st, i)} />) : <span className="text-mute text-sm">—</span>}</div></div>
  const rp = async (x: string) => { if (await act('respond', { sortieId: s.id, reponse: x }, x === 'disponible' ? 'Top, ils sont prévenus !' : 'Réponse envoyée') && x === 'disponible') boom() }
  if (ex) return <Sheet onClose={() => setEx(null)}><ExpForm st={st} s={s} dep={ex === 'new' ? null : ex} act={act} done={() => setEx(null)} /></Sheet>
  return <Sheet onClose={close}><p className="text-6xl">{s.type === 'voyage' ? '✈️' : em(s.nom)}</p><h2 className="text-4xl leading-none pr-10">{s.nom}</h2><p className="text-mute font-semibold">{when(s)} · {s.lieu || 'Lieu à définir'}{s.budget > 0 && ` · budget ~${s.budget} €/pers`}</p><p className="text-sm">Idée de <b>{nameOf(st, s.organisateur)}</b> · {s.statut}</p>
    {s.description && <p className={card}>{s.description}</p>}{s.lien && lk(s.lien)}
    {s.statut !== 'annulée' && <div className="grid grid-cols-2 gap-3"><button onClick={() => rp('disponible')} className={`${btn} text-lg ${mine === 'disponible' ? 'bg-ok text-white' : 'bg-white'}`}>Je viens !</button><button onClick={() => rp('indisponible')} className={`${btn} text-lg bg-ko text-white ${mine === 'indisponible' ? 'outline outline-[3px] outline-ink' : ''}`}>Pas dispo</button></div>}
    <div className={`${card} space-y-5`}><L t="Partants" ids={r.a} c="text-ok" /><L t="Pas dispo" ids={r.k} c="text-ko" /><L t="À convaincre" ids={r.n} c="text-mute" /></div>
    {s.compteur ? <div className={card}><h3 className="text-xl">🧾 Dépenses · {eur(deps.reduce((x, d) => x + d.montant, 0))}</h3>
      {deps.map(d => <button key={d.id} onClick={() => setEx(d)} className="flex justify-between text-left text-sm py-2 border-b border-dashed border-ink/15"><span>{d.libelle}<br /><span className="text-mute">payé par {nameOf(st, d.payeur)} · {d.parts.length} pers.</span></span><span><b>{eur(d.montant)}</b><br /><span className="text-acc text-xs font-bold">✏️ Modifier</span></span></button>)}
      {t.length > 0 ? <div className="bg-sun rounded-[20px] p-4 font-bold text-sm space-y-1">{t.map((x, i) => <p key={i}>{nameOf(st, x[0])} doit {eur(x[2])} à {nameOf(st, x[1])}</p>)}</div> : deps.length > 0 && <div className="bg-sun rounded-[20px] p-4 font-bold text-sm">Tout est équilibré 🎉</div>}
      <button className={go} onClick={() => setEx('new')}>+ Ajouter une dépense</button></div>
      : <div className={card}><h3 className="text-xl">Besoin de compter les dépenses ?</h3><p className="text-sm text-mute">Ajoute qui a payé quoi : YAKI calcule qui doit combien à qui, comme Tricount.</p><button className={go} onClick={() => act('sortieCompteur', { id: s.id }, 'Compteur activé')}>Oui, activer le compteur</button></div>}
    {can && <div className="flex gap-2 flex-wrap"><button className={`${btn} bg-white`} onClick={() => edit(s)}>Modifier</button>{['confirmée', 'annulée', 'terminée'].map(x => <button key={x} className={`${btn} bg-white text-sm`} onClick={() => act('sortieSave', { ...s, statut: x })}>{x}</button>)}<button className={`${btn} bg-ko text-white`} onClick={async () => { if (confirm('Supprimer cette sortie ?') && await act('sortieDelete', { id: s.id })) close() }}>Supprimer</button></div>}</Sheet>
}

function Home({ st, gid, setGid, act, onOpen, go: goTab }: { st: St; gid: string; setGid: (g: string) => void; act: Act; onOpen: (s: Sortie) => void; go: (t: Tab) => void }) {
  const today = todayParis(), gn = (id: string) => st.groupes.find(g => g.id === id)?.nom, live = st.sorties.filter(s => last(s) >= today && s.statut !== 'annulée')
  const todo = live.filter(s => !st.participations.some(p => p.sortieId === s.id && p.userId === st.me.id)), up = [...live].sort((a, b) => a.date.localeCompare(b.date)), nx = up[0]
  const mine = st.sorties.filter(s => s.groupeId === gid).sort((a, b) => a.date.localeCompare(b.date)); let owe = 0, due = 0
  st.sorties.forEach(s => bal(st, s).forEach(x => { if (x[0] === st.me.id) owe += x[2]; if (x[1] === st.me.id) due += x[2] }))
  const dj = nx ? Math.max(0, dayDiff(today, nx.date)) : 0, tile = 'bg-white rounded-[26px] p-4 space-y-1.5'
  const rp = async (s: Sortie, x: string) => { if (await act('respond', { sortieId: s.id, reponse: x }, 'Réponse envoyée') && x === 'disponible') boom() }
  return <div className="p-5 space-y-4"><h1 className="text-5xl sm:text-6xl leading-[.95] pt-2">Salut <span className="text-acc">{st.me.prenom}</span> 👋</h1>
    {!st.groupes.length && <div className={card}><p>Tu n'as pas encore de groupe. Crée le tien ou rejoins celui de tes amis avec son code secret.</p><button className={go} onClick={() => goTab('groups')}>Créer ou rejoindre</button></div>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{todo.map(s => <div key={s.id} className="bg-white rounded-[30px] p-5 space-y-3 border-[3px] border-ink -rotate-1"><p className="text-sm text-mute">{gn(s.groupeId)} · {nameOf(st, s.organisateur)} propose</p>
      <button onClick={() => onOpen(s)} className="text-left"><h3 className="text-2xl leading-tight">{s.type === 'voyage' ? '✈️' : em(s.nom)} {s.nom}, {when(s)}</h3></button>
      <div className="grid grid-cols-2 gap-2"><button className={`${btn} bg-ok text-white text-lg`} onClick={() => rp(s, 'disponible')}>Je viens !</button><button className={`${btn} bg-ko text-white text-lg`} onClick={() => rp(s, 'indisponible')}>Pas dispo</button></div></div>)}</div>
    <h3 className="text-2xl">Tableau de bord</h3><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-sun rounded-[26px] p-4 space-y-1.5 col-span-2"><p className="text-xs font-semibold opacity-70">Prochaine sortie</p>{nx ? <><p className="f text-3xl">{nx.type === 'voyage' ? '✈️' : em(nx.nom)} {nx.nom}</p><p className="text-sm font-semibold">{dj > 0 ? `dans ${dj} jours` : "c'est aujourd'hui !"} · {when(nx)}</p></> : <p className="f text-3xl">Rien de prévu</p>}</div>
      <div className={tile}><p className="text-xs font-semibold text-mute">À répondre</p><p className={`f text-4xl ${todo.length ? 'text-ko' : 'text-ok'}`}>{todo.length}</p><p className="text-sm font-semibold">{todo.length ? 'en attente' : 'tout est répondu ✓'}</p></div>
      <div className={tile}><p className="text-xs font-semibold text-mute">Sorties à venir</p><p className="f text-4xl">{up.length}</p><p className="text-sm font-semibold">dans tes groupes</p></div>
      <div className={`${tile} col-span-2 lg:col-span-4`}><p className="text-xs font-semibold text-mute">Dépenses</p><p className="f text-3xl">{owe > .01 ? `Je dois ${eur(owe)}` : 'Rien à rembourser ✓'}</p>{due > .01 && <p className="text-sm font-bold text-ok">On me doit {eur(due)}</p>}</div></div>
    {st.groupes.length > 0 && <div className="flex gap-2 overflow-x-auto p-0.5">{st.groupes.map(g => <button key={g.id} onClick={() => setGid(g.id)} className={`${btn} py-2.5 px-4 text-sm whitespace-nowrap ${g.id === gid ? 'bg-ink text-white' : 'bg-white'}`}>{g.nom}</button>)}</div>}
    {gid && mine.length === 0 && <p className="text-mute">Rien de prévu dans ce groupe. Lance la première idée !</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mine.filter(s => last(s) >= today).map((s, i) => <Card key={s.id} s={s} i={i} st={st} onOpen={onOpen} />)}</div>
    {mine.some(s => last(s) < today) && <h3 className="text-xl pt-2">Passées</h3>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mine.filter(s => last(s) < today).reverse().slice(0, 6).map((s, i) => <Card key={s.id} s={s} i={i + 1} st={st} onOpen={onOpen} />)}</div></div>
}

const isoOf = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
function Month({ off, setOff, cell, onPick }: { off: number; setOff: (n: number) => void; cell: (iso: string) => { bg: string; fg?: string; x?: string }; onPick: (iso: string) => void }) {
  const [py, pm] = todayParis().split('-').map(Number), d0 = new Date(py, pm - 1 + off, 1), y = d0.getFullYear(), m = d0.getMonth(), nb = new Date(y, m + 1, 0).getDate(), lead = (d0.getDay() + 6) % 7
  return <div className="space-y-3"><div className="flex justify-between items-center"><button onClick={() => setOff(off - 1)} className="px-3 text-2xl">‹</button><h3 className="text-xl capitalize">{d0.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3><button onClick={() => setOff(off + 1)} className="px-3 text-2xl">›</button></div>
    <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-mute font-semibold">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x, i) => <span key={i}>{x}</span>)}</div>
    <div className="grid grid-cols-7 gap-1.5">{Array.from({ length: lead }, (_, i) => <span key={'b' + i} />)}{Array.from({ length: nb }, (_, i) => { const k = isoOf(y, m, i + 1), c = cell(k); return <button key={i} onClick={() => onPick(k)} className="aspect-square rounded-full text-sm font-bold relative" style={{ background: c.bg, color: c.fg ?? '#17233B' }}>{i + 1}{c.x && <i className="absolute top-0 right-0.5 text-[11px] not-italic">{c.x}</i>}</button> })}</div></div>
}

function Form({ st, gid, setGid, act, edit, date0, close }: { st: St; gid: string; setGid: (g: string) => void; act: Act; edit: Sortie | null; date0: string; close: () => void }) {
  const [f, setF] = useState<any>(edit ? { ...edit, budget: edit.budget || '' } : { type: 'sortie', nom: '', date: date0, dateFin: '', debut: '', fin: '', lieu: '', description: '', lien: '', budget: '' }), [off, setOff] = useState(0)
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value }), g = edit?.groupeId ?? gid, bz = busy(st, g, f.date, f.debut)
  const pick = (k: string) => { if (f.type === 'sortie') setF({ ...f, date: k, dateFin: '' }); else if (!f.date || f.dateFin) setF({ ...f, date: k, dateFin: '' }); else if (k < f.date) setF({ ...f, date: k }); else setF({ ...f, dateFin: k }) }
  if (!g) return <Sheet onClose={close}><p>Rejoins d'abord un groupe pour lancer une idée.</p></Sheet>
  const nj = f.date && f.dateFin ? Math.round((new Date(f.dateFin).getTime() - new Date(f.date).getTime()) / 864e5) + 1 : 0
  return <Sheet onClose={close}><h2 className="text-4xl leading-none pr-10">{edit ? 'Modifier' : <>On fait <span className="text-acc">quoi ?</span></>}</h2>
    <div className="grid grid-cols-2 bg-white rounded-full p-1.5">{['sortie', 'voyage'].map(t => <button key={t} onClick={() => setF({ ...f, type: t, dateFin: '' })} className={`rounded-full py-3 font-bold capitalize ${f.type === t ? 'bg-ink text-sun' : ''}`}>{t}</button>)}</div>
    {!edit && st.groupes.length > 1 && <select className={inp} value={gid} onChange={e => setGid(e.target.value)}>{st.groupes.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select>}
    <input className={inp} placeholder="Bowling, resto, week-end à Londres…" value={f.nom} onChange={set('nom')} />
    <div className={card}><Month off={off} setOff={setOff} onPick={pick} cell={k => { const on = k === f.date || k === f.dateFin || (f.date && f.dateFin && k > f.date && k < f.dateFin); return { bg: on ? '#17233B' : '#FFF9F2', fg: on ? '#FFD84D' : undefined } }} />
      <p className="text-sm text-mute">{!f.date ? (f.type === 'voyage' ? 'Touche le premier jour, puis le dernier.' : 'Touche le jour.') : f.type === 'voyage' ? (nj ? `${fmt(f.date)} → ${fmt(f.dateFin)} · ${nj} jours` : fmt(f.date) + ' · choisis le dernier jour') : fmt(f.date)}</p></div>
    {f.type === 'sortie' && <div className="grid grid-cols-2 gap-2"><input className={inp} type="time" value={f.debut} onChange={set('debut')} /><input className={inp} type="time" value={f.fin} onChange={set('fin')} /></div>}
    {f.date && (bz.length ? <div className="rounded-[24px] border-[3px] border-ko p-4 text-sm"><b className="text-ko">Habituellement occupés à ce moment-là :</b> {bz.join(', ')}</div> : <div className="rounded-[24px] border-[3px] border-ok p-4 text-sm font-bold text-ok">Tout le monde est en principe libre 🎉</div>)}
    <input className={inp} placeholder="Lieu" value={f.lieu} onChange={set('lieu')} /><input className={inp} type="number" inputMode="numeric" placeholder="Budget estimé par personne (€)" value={f.budget} onChange={set('budget')} />
    <input className={inp} inputMode="url" placeholder="Lien (TikTok, site, Instagram, Maps…) — facultatif" value={f.lien} onChange={set('lien')} /><textarea className={inp} placeholder="Détails (facultatif)" value={f.description} onChange={set('description')} />
    <button className={`${go} w-full text-lg`} onClick={async () => { if (!f.date) return; const lien = f.lien && !/^https?:\/\//i.test(f.lien) ? 'https://' + f.lien : f.lien; if (await act('sortieSave', { ...f, lien, groupeId: g, budget: Number(f.budget) || 0 }, edit ? 'Sortie modifiée' : 'Idée lancée !')) { if (!edit) boom(); close() } }}>Lancer l'idée →</button></Sheet>
}

function Cal({ st, gid, setGid, onNew, onOpen }: { st: St; gid: string; setGid: (g: string) => void; onNew: (d: string) => void; onOpen: (s: Sortie) => void }) {
  const [off, setOff] = useState(0), [pop, setPop] = useState(''), [sel, setSel] = useState<string[]>([]), all = membersOf(st, gid).map(u => st.membres.find(m => m.id === u)).filter((m): m is M => !!m), mem = sel.length ? all.filter(m => sel.includes(m.id)) : all
  useEffect(() => setSel([]), [gid])
  if (!gid) return <div className="p-5"><div className={card}>Rejoins un groupe pour voir son agenda.</div></div>
  const split = (k: string) => { const w = new Date(k + 'T12:00').getDay(); return { ok: mem.filter(m => !m.days.includes(w)), ko: mem.filter(m => m.days.includes(w)) } }, ev = (k: string) => st.sorties.filter(s => s.groupeId === gid && k >= s.date && k <= last(s)), sp = pop ? split(pop) : null
  return <div className="p-5 space-y-4"><h1 className="text-5xl sm:text-6xl leading-[.95] pt-2">Quand on <span className="text-acc">peut ?</span></h1>
    <div className="flex gap-2 overflow-x-auto p-0.5">{st.groupes.map(g => <button key={g.id} onClick={() => setGid(g.id)} className={`${btn} py-2.5 px-4 text-sm whitespace-nowrap ${g.id === gid ? 'bg-ink text-white' : 'bg-white'}`}>{g.nom}</button>)}</div>
    <div className="flex flex-wrap gap-2"><button onClick={() => setSel([])} className={`rounded-full px-4 py-2 text-sm font-bold ${!sel.length ? 'bg-ink text-white' : 'bg-white'}`}>Tout le monde</button>{all.map(m => <button key={m.id} onClick={() => setSel(sel.includes(m.id) ? sel.filter(x => x !== m.id) : [...sel, m.id])} className={`flex items-center gap-1.5 rounded-full pr-3 text-sm font-bold ${sel.includes(m.id) ? 'bg-ink text-white' : 'bg-white'}`}><Av n={m.prenom} />{m.prenom}</button>)}</div><div className={`${card} max-w-xl`}>
    <Month off={off} setOff={setOff} onPick={setPop} cell={k => { const r = mem.length ? split(k).ok.length / mem.length : 0; return { bg: r === 1 ? '#35B77A' : r > .66 ? '#8FD9B3' : r > .33 ? '#FFD84D' : '#FF9B92', fg: r === 1 ? '#fff' : undefined, x: ev(k).length ? '★' : '' } }} />
    <p className="text-xs text-mute">Plus c'est vert, plus il y a de monde. ★ = sortie prévue. Touche un jour.</p></div>
    {sp && <Sheet onClose={() => setPop('')}><h2 className="text-3xl capitalize pr-10">{new Date(pop + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2><p><b className="f text-6xl text-ok">{sp.ok.length}</b> <span className="font-bold">/ {mem.length} partants</span></p>
      <div className={card}><p className="font-bold text-sm text-ok">Dispo</p><div className="flex flex-wrap gap-2">{sp.ok.map(m => <Pill key={m.id} n={m.prenom} />)}</div>{sp.ko.length > 0 && <><p className="font-bold text-sm text-ko">Habituellement occupés</p><div className="flex flex-wrap gap-2">{sp.ko.map(m => <Pill key={m.id} n={m.prenom} />)}</div></>}</div>
      {ev(pop).map((s, i) => <Card key={s.id} s={s} i={i} st={st} onOpen={x => { setPop(''); onOpen(x) }} />)}<button className={`${go} w-full`} onClick={() => { const d = pop; setPop(''); onNew(d) }}>Lancer une idée ce jour-là</button></Sheet>}</div>
}

function Groups({ st, gid, setGid, act, joinId, clearJoin }: { st: St; gid: string; setGid: (g: string) => void; act: Act; joinId: string; clearJoin: () => void }) {
  const [nom, setNom] = useState(''), [code, setCode] = useState(''), [q, setQ] = useState(''), [res, setRes] = useState<{ id: string; nom: string }[] | null>(null), [pick, setPick] = useState(''), [jc, setJc] = useState('')
  const search = async () => { try { setRes(await api('groupSearch', { q })) } catch { setRes([]) } }
  const [inv, setInv] = useState<{ nom: string; code: string } | null>(null), [cp, setCp] = useState(false)
  useEffect(() => { if (joinId) api('groupInfo', { id: joinId }).then((g: any) => { setRes([g]); setPick(g.id) }).catch(() => { /* lien invalide */ }) }, [joinId])
  const ig = inv ? st.groupes.find(x => x.nom.toLowerCase() === inv.nom.toLowerCase()) : null
  const msg = ig && inv ? `Salut ! 👋 J'ai créé le groupe « ${ig.nom} » sur YAKI pour organiser nos sorties.\n\nPour nous rejoindre :\n1. Ouvre YAKI : ${location.origin + location.pathname}#join=${ig.id}\n2. Crée ton compte (juste ton prénom)\n3. Rejoins le groupe « ${ig.nom} » avec le code secret : ${inv.code}\n\nÀ très vite ! 🎉` : ""
  return <div className="p-5 space-y-4"><h1 className="text-5xl leading-[.95] pt-2">Les<br /><span className="text-acc">groupes</span></h1>
    {ig && inv && <Sheet onClose={() => setInv(null)}><p className="text-6xl">🎉</p><h2 className="text-3xl leading-none pr-10">Groupe créé !</h2><p className="text-mute text-sm">Envoie ce message à tes amis (WhatsApp, SMS…). Le lien ouvre YAKI avec ton groupe déjà sélectionné : il ne leur reste qu'à entrer le code.</p>
      <pre className="bg-white rounded-[24px] p-4 text-sm whitespace-pre-wrap font-sans">{msg}</pre>
      <button className={`${go} w-full`} onClick={() => navigator.clipboard?.writeText(msg).then(() => setCp(true))}>{cp ? 'Copié ✓' : 'Copier le message'}</button>
      {typeof navigator.share === 'function' && <button className={`${btn} w-full bg-white`} onClick={() => navigator.share({ text: msg }).catch(() => { /* annulé */ })}>Partager…</button>}</Sheet>}
    {st.groupes.map(g => <div key={g.id} className={card}><button onClick={() => setGid(g.id)} className="w-full text-left flex justify-between items-center"><span className="f text-2xl">{g.nom}</span><span className="text-sm text-mute">{g.n} membres{g.id === gid && ' · actif'}</span></button><div className="flex flex-wrap gap-2">{membersOf(st, g.id).map(u => <Pill key={u} n={nameOf(st, u)} />)}</div>
      <button className="text-sm text-ko font-semibold" onClick={() => confirm('Quitter ce groupe ?') && act('groupLeave', { groupeId: g.id }, 'Groupe quitté')}>Quitter</button></div>)}
    <div className={card}><h3 className="text-2xl">Rejoindre un groupe</h3><div className="flex gap-2"><input className={inp} placeholder="Nom du groupe" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} /><button className={go} onClick={search}>OK</button></div>
      {res && res.length === 0 && <p className="text-sm text-mute">Aucun groupe trouvé.</p>}{res?.map(g => <button key={g.id} onClick={() => setPick(g.id)} className={`${btn} w-full text-left ${pick === g.id ? 'bg-ink text-white' : 'bg-bg'}`}>{g.nom}</button>)}
      {pick && <><input className={inp} placeholder="Code secret du groupe" value={jc} onChange={e => setJc(e.target.value)} /><button className={`${go} w-full`} onClick={async () => { if (await act('groupJoin', { groupeId: pick, code: jc }, 'Bienvenue dans le groupe !')) { boom(); setGid(pick); setPick(''); setRes(null); setJc(''); setQ(''); clearJoin() } }}>Rejoindre</button></>}</div>
    <div className={card}><h3 className="text-2xl">Créer un groupe</h3><input className={inp} placeholder="Nom du groupe" value={nom} onChange={e => setNom(e.target.value)} /><input className={inp} placeholder="Code secret à donner à tes amis" value={code} onChange={e => setCode(e.target.value)} /><button className={`${go} w-full`} onClick={async () => { if (await act('groupCreate', { nom: nom.trim(), code }, 'Groupe créé')) { setInv({ nom: nom.trim(), code }); setNom(''); setCode('') } }}>Créer</button></div></div>
}

function Moi({ st, act, edit, logout }: { st: St; act: Act; edit: () => void; logout: () => void }) {
  const me = st.membres.find(m => m.id === st.me.id), [pr, setPr] = useState(st.me.prenom)
  return <div className="p-5 space-y-4"><h1 className="text-5xl leading-[.95] pt-2">Moi,<br /><span className="text-acc">{st.me.prenom}</span></h1>
    <div className={card}><h3 className="text-2xl">Mes disponibilités</h3><p className="leading-relaxed"><b>Jours occupés :</b> {me?.days.length ? me.days.map(d => DN[d]).join(', ') : 'aucun'}<br /><b>Heures occupées :</b> {me?.hrs.length ? me.hrs.map(i => HR[i][0] + ' (' + HR[i][1] + ')').join(', ') : 'aucune'}{!!me?.likes.length && <><br /><b>Envies :</b> {me.likes.map(i => LK[i]).join(' · ')}</>}</p><button className={`${go} w-full`} onClick={edit}>Modifier mes disponibilités</button></div>
    <div className={card}><p className="text-sm text-mute">Identifiant de connexion</p><h3 className="text-2xl">{st.me.login}</h3><div className="flex gap-2"><input className={inp} value={pr} onChange={e => setPr(e.target.value)} /><button className={go} onClick={() => act('profil', { prenom: pr }, 'Prénom modifié')}>OK</button></div></div>
    <button className="text-ko text-sm font-semibold py-3" onClick={logout}>Se déconnecter</button></div>
}

export default function App() {
  const [st, setSt] = useState<St | null>(null), [authed, setAuthed] = useState(!!localStorage.getItem('yaki_token')), [tab, setTab] = useState<Tab>('home')
  const [open, setOpen] = useState(''), [form, setForm] = useState<{ edit: Sortie | null; date: string } | null>(null), [editing, setEditing] = useState(false), [msg, setMsg] = useState(''), [busyA, setBusyA] = useState(false), [joinId, setJoinId] = useState(() => (location.hash.match(/join=([\w-]+)/) || [])[1] || '')
  const [gid, setGidS] = useState(localStorage.getItem('yaki_gid') || ''), setGid = (g: string) => { localStorage.setItem('yaki_gid', g); setGidS(g) }
  const load = useCallback(async () => { try { setSt(await api('state')) } catch (e: any) { if (/Session|connecté/.test(e.message)) { localStorage.removeItem('yaki_token'); setAuthed(false) } else setMsg(e.message) } }, [])
  useEffect(() => { if (authed) { load(); const t = setInterval(load, 30000); return () => clearInterval(t) } }, [authed, load])
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(''), 2500); return () => clearTimeout(t) } }, [msg])
  useEffect(() => { if (st && st.groupes.length && !st.groupes.some(g => g.id === gid)) setGid(st.groupes[0].id) }, [st, gid])
  useEffect(() => { if (joinId && st?.me.done) setTab('groups') }, [joinId, st?.me.done])
  const act: Act = async (a, b, ok = 'Fait ✓') => { setBusyA(true); try { await api(a, b); setMsg(ok); await load(); return true } catch (e: any) { setMsg(e.message); return false } finally { setBusyA(false) } }
  if (!authed) return <Auth onDone={() => setAuthed(true)} />
  if (!st) return <Loader />
  if (!st.me.done || editing) return <><Onb st={st} first={!st.me.done} act={act} done={() => setEditing(false)} />{busyA && <Loader />}</>
  const opened = st.sorties.find(s => s.id === open)
  const tabs: [Tab | 'plus', string][] = [['home', 'Accueil'], ['cal', 'Agenda'], ['plus', '＋'], ['groups', 'Groupes'], ['me', 'Moi']]
  return <div className="max-w-5xl mx-auto min-h-screen pb-32">
    <header className="flex justify-between items-center px-5 pt-5"><Logo /><button onClick={load} className="text-sm text-mute">Actualiser</button></header>
    {tab === 'home' && <Home st={st} gid={gid} setGid={setGid} act={act} onOpen={s => setOpen(s.id)} go={setTab} />}{tab === 'cal' && <Cal st={st} gid={gid} setGid={setGid} onNew={d => setForm({ edit: null, date: d })} onOpen={s => setOpen(s.id)} />}
    {tab === 'groups' && <Groups st={st} gid={gid} setGid={setGid} act={act} joinId={joinId} clearJoin={() => { setJoinId(''); history.replaceState(null, '', location.pathname) }} />}{tab === 'me' && <Moi st={st} act={act} edit={() => setEditing(true)} logout={() => { localStorage.removeItem('yaki_token'); setAuthed(false); setSt(null) }} />}
    {opened && <Detail s={opened} st={st} act={act} close={() => setOpen('')} edit={s => { setOpen(''); setForm({ edit: s, date: s.date }) }} />}
    {form && <Form st={st} gid={gid} setGid={setGid} act={act} edit={form.edit} date0={form.date} close={() => setForm(null)} />}
    {busyA && <Loader />}{msg && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-ink text-sun rounded-full px-5 py-3 z-50 text-sm font-bold shadow-lg">{msg}</div>}
    <nav className="fixed bottom-3 inset-x-3 max-w-md mx-auto bg-ink rounded-full grid grid-cols-5 p-1.5 z-20 items-center shadow-xl">{tabs.map(([k, l]) => k === 'plus' ? <button key={k} onClick={() => setForm({ edit: null, date: '' })} className="rounded-full bg-coral text-ink text-2xl py-2 shadow-[0_4px_0_rgba(0,0,0,.25)] font-bold active:translate-y-0.5">{l}</button> : <button key={k} onClick={() => setTab(k)} className={`rounded-full text-xs font-bold py-3.5 ${tab === k ? 'bg-white text-ink' : 'text-white/60'}`}>{l}</button>)}</nav></div>
}
