import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AdminPanel from './AdminPanel.jsx';
import Fichajes from './Fichajes.jsx';

const TIMES = Array.from({ length: 14 }, (_, index) => `${String(index + 9).padStart(2, '0')}:00`);
const DEFAULT_FIELDS = [
  { id: 1, name: 'Cancha 1', complex: 'Sede Central', surface_type: 'Césped Sintético', capacity: '5 vs 5', price: 5000, active: true },
  { id: 2, name: 'Cancha 2', complex: 'Sede Central', surface_type: 'Césped Natural', capacity: '7 vs 7', price: 7000, active: true },
  { id: 3, name: 'Cancha 3', complex: 'Sede Norte', surface_type: 'Césped Sintético', capacity: '5 vs 5', price: 5000, active: true },
  { id: 4, name: 'Cancha 4', complex: 'Sede Norte', surface_type: 'Césped Sintético', capacity: '8 vs 8', price: 8000, active: true },
];

function makeSupabase() {
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey) return null;
  return createClient(config.url, config.publishableKey);
}

function formatMoney(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function localDateKey(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function validPhone(phone) {
  return /^(?:(?:\+|00)?54)?(?:9)?(?:0)?([1-9]\d{1,3})(?:15)?(\d{6,8})$/.test(phone.replace(/[\s\-()]/g, ''));
}

function BrandMark() {
  return <span className="react-brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 3 42 10v13c0 11-7.6 18-18 22C13.6 41 6 34 6 23V10L24 3Z" fill="currentColor"/><path d="m24 12 4 3 1 5-5 3-5-3 1-5 4-3Zm-5 8-5 1-2 5 4 4 6-2 2-5m4-3 5 1 2 5-4 4-6-2-2-5m-10-2-3-3m19 3 3-3m-17 13 1 5m12-5-1 5" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
}

function Header({ user, isAdmin, onLogin, onSignOut, isFichajes = false }) {
  const target = hash => isFichajes ? `/${hash}` : hash;
  return <header className="react-header">
    <div className="react-header-inner">
      <a className="react-brand" href={isFichajes ? '/' : '#inicio'} aria-label="La Bombonerita, inicio"><BrandMark/><span><strong>LA BOMBONERITA</strong><small>FÚTBOL CLUB · SALTA</small></span></a>
      <nav className="react-nav" aria-label="Navegación principal">
        <a href={target('#complejo')}>El complejo</a><a href={target('#reservas')}>Reservas</a><a href="/fichajes">Fichajes</a><a href={target('#ubicacion')}>Ubicación</a>
        {user && !isAdmin && <a href={target('#mis-reservas')}>Mis reservas</a>}
        {isAdmin && <a href="/#admin">Administración</a>}
        {user ? <button className="react-nav-account" onClick={onSignOut}>Cerrar sesión</button> : <button className="react-nav-account" onClick={onLogin}>Iniciar sesión <span aria-hidden="true">↗</span></button>}
      </nav>
    </div>
  </header>;
}

function Hero({ onReserve }) {
  return <section className="react-hero" id="inicio">
    <div className="react-hero-copy"><p className="react-location"><span/> ZONA SUR · SALTA CAPITAL</p>
      <h1>El partido<br/>arranca <em>acá.</em></h1>
      <p className="react-hero-description">Elegí cancha, armá el equipo y reservá tu próximo turno en La Bombonerita.</p>
      <div className="react-hero-actions"><a href="#reservas" className="react-button react-button-primary" onClick={onReserve}>Encontrá tu cancha <span aria-hidden="true">↗</span></a><a className="react-text-link" href="https://wa.me/543874797240?text=Hola%2C%20quiero%20consultar%20por%20las%20canchas." target="_blank" rel="noreferrer">Consultar por WhatsApp</a></div>
      <div className="react-hero-foot"><span>FÚTBOL TODOS LOS DÍAS</span><span>09:00 — 00:00</span></div>
    </div>
    <figure className="react-hero-photo"><img src="/cancha-bombonerita.png" alt="Cancha de fútbol de La Bombonerita iluminada al atardecer"/><figcaption>SEDE ZONA SUR <span className="react-photo-caption-line"/></figcaption></figure>
  </section>;
}

const FACILITIES = [
  ['Césped Sintético Pro', 'Monofilamento de 50mm con caucho amortiguador y césped natural con mantenimiento diario.', 'M4 7h24v18H4zM16 7v18m0-13a4 4 0 1 0 0 8m0-8a4 4 0 1 1 0 8'],
  ['Iluminación LED Estadio', '350 lux de potencia lumínica uniforme en todas las canchas para partidos nocturnos sin sombras.', 'M11 23h10m-9 4h8m-4-24a9 9 0 0 0-5 16.5c.7.5 1 1.1 1 1.9h8c0-.8.3-1.4 1-1.9A9 9 0 0 0 16 3Z'],
  ['Vestuarios & Lockers', 'Duchas individuales con agua caliente continua, sanitarios impecables y casilleros seguros.', 'M6 13h20v3H6zm3 4v8m5-8v8m5-8v8m5-8v8M9 10a7 7 0 0 1 14 0v3'],
  ['Quinchos & Parrillas', 'Espacios techados con asadores completos, mesas amplias y parrillas para el asado de tu equipo.', 'M6 15h20l-2 12H8L6 15Zm2 0 2-7h12l2 7M11 11h10m-9 8v5m5-5v5m5-5v5'],
  ['Buffet & Pantallas', 'Cervezas frías, pizzas, hamburguesas caseras y TV gigante para disfrutar de los partidos profesionales.', 'M5 13a11 7 0 0 1 22 0H5Zm1 3h20v4H6zm2 7h16v3H8z'],
  ['Estacionamiento Privado', 'Playa de estacionamiento iluminada y con vigilancia dentro del mismo predio.', 'M7 19h18l-2-8H9l-2 8Zm0 0v6h3v-3h12v3h3v-6M11 15h10m-9 8h.01M21 23h.01'],
];

function Facilities() {
  return <section id="complejo" className="react-facilities">
    <div className="react-section-heading"><h2>Todo para el partido y el tercer tiempo</h2><p>Conocé las instalaciones y elegí el espacio para tu próximo encuentro.</p></div>
    <div className="react-facility-list">{FACILITIES.map(([title, copy, icon]) => <article className="react-facility" key={title}>
      <span className="react-facility-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d={icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
      <h3>{title}</h3><p>{copy}</p>
    </article>)}</div>
    <figure className="react-quincho"><img src="/quincho.jpg" alt="Quincho cubierto y espacio verde de La Bombonerita"/><figcaption className="react-quincho-copy"><span>EL TERCER TIEMPO</span><strong>El tercer tiempo también es parte del plan.</strong><p>Después de jugar, reunite con tu equipo en el quincho. Consultá por disponibilidad.</p><a href="https://wa.me/543874797240?text=Hola%2C%20quiero%20consultar%20por%20la%20disponibilidad%20del%20quincho." target="_blank" rel="noreferrer">Consultar por el quincho <b aria-hidden="true">↗</b></a></figcaption></figure>
  </section>;
}

function FieldCard({ field, selected, onSelect }) {
  return <button className={`react-field ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
    <span className="react-field-top"><span>{field.complex || 'Sede'}</span><span aria-hidden="true">↗</span></span>
    <strong>{field.name}</strong><span className="react-field-meta">{field.surface_type || field.type} <i/> {field.capacity}</span>
    <span className="react-field-price">{formatMoney(field.price)} <small>/ hora</small></span>
    <span className="react-field-action">{selected ? 'Seleccionada' : 'Elegir cancha'} <b aria-hidden="true">→</b></span>
  </button>;
}

function Reservation({ fields, selected, onSelect, date, setDate, time, setTime, times, user, form, setForm, onSubmit, submitting, onLogin, notice }) {
  return <section id="reservas" className="react-reservations"><div className="react-section-heading react-reservation-heading"><div><p>RESERVAS ONLINE</p><h2>Elegí dónde<br/><em>se juega.</em></h2></div></div>
    <div className="react-fields">{fields.map(field => <FieldCard key={field.id} field={field} selected={selected?.id === field.id} onSelect={() => onSelect(field)}/>)}</div>
    {selected && <form className="react-booking-form" onSubmit={onSubmit}>
      <div className="react-form-heading"><div><span>RESERVAR CANCHA</span><h3>{selected.name}<small> / {selected.complex}</small></h3></div><strong>{formatMoney(selected.price)}<small> / hora</small></strong></div>
      {notice && <p className={`react-notice ${notice.kind}`}>{notice.text}</p>}
      {!user ? <div className="react-login-prompt"><p>Iniciá sesión para consultar disponibilidad y guardar el turno en tu cuenta.</p><button className="react-button react-button-primary" type="button" onClick={onLogin}>Iniciar sesión <span aria-hidden="true">→</span></button></div> : <>
        <div className="react-form-grid"><label>Fecha<input type="date" value={date} min={localDateKey()} onChange={event => {setDate(event.target.value); setTime('');}} required/></label>
          <label>Horario<select value={time} onChange={event => setTime(event.target.value)} disabled={!date} required><option value="">{date ? 'Elegí un horario' : 'Primero elegí fecha'}</option>{times.map(item => <option key={item.time} value={item.time} disabled={!item.available}>{item.time}{!item.available ? ` · ${item.reason}` : ''}</option>)}</select></label>
          <label>Nombre para la reserva<input value={form.playerName} onChange={event => setForm(current => ({...current, playerName:event.target.value}))} autoComplete="name" required/></label>
          <label>Teléfono de contacto<input type="tel" value={form.phone} onChange={event => setForm(current => ({...current, phone:event.target.value}))} autoComplete="tel" placeholder="+54 9 387 1234567" required/></label>
        </div><div className="react-form-foot"><p>La reserva se confirma al completar la operación. El horario queda sujeto a disponibilidad.</p><button className="react-button react-button-primary" disabled={submitting}>{submitting ? 'Confirmando…' : 'Confirmar reserva'} <span aria-hidden="true">→</span></button></div>
      </>}
    </form>}
  </section>;
}

function MyBookings({ bookings, onCancel }) {
  return <section id="mis-reservas" className="react-my-bookings"><div className="react-section-heading"><p>TU CUENTA</p><h2>Mis reservas.</h2></div>{bookings.length ? <div className="react-booking-list">{bookings.map(item => <article key={item.id}><div><span>{item.field_name} · {item.complex}</span><strong>{formatDate(item.booking_date)} · {String(item.start_time).slice(0,5)}</strong><small>{item.player_name} · {item.phone}</small></div><button onClick={() => onCancel(item.id)}>Cancelar</button></article>)}</div> : <p className="react-empty">Todavía no tenés reservas. Elegí una cancha para empezar.</p>}</section>;
}

function Contact() {
  return <section id="ubicacion" className="react-contact"><div><p>DÓNDE JUGAMOS</p><h2>Nos vemos<br/><em>en Limache.</em></h2><span>Zona Sur · Av. Ex Combatientes de Malvinas<br/>Salta Capital, Argentina</span></div><div className="react-contact-right"><span>LUNES A DOMINGO<br/>09:00 — 00:00</span><a href="https://maps.google.com/?q=Limache+Salta+Argentina" target="_blank" rel="noreferrer">Cómo llegar <b aria-hidden="true">↗</b></a><a href="https://wa.me/543874797240" target="_blank" rel="noreferrer">+54 387 4797240</a></div></section>;
}

function AuthDialog({ client, onClose, onAuthenticated }) {
  const [mode, setMode] = useState(window.location.hash.includes('type=recovery') ? 'update' : 'signin');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [values, setValues] = useState({ name:'', phone:'', email:'', password:'' });
  const change = event => setValues(previous => ({...previous, [event.target.name]:event.target.value}));
  const submit = async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (!client) throw new Error('La conexión con Supabase no está configurada. Revisá public/supabase-config.js.');
      if (mode === 'signin') {
        const { data, error } = await client.auth.signInWithPassword({ email:values.email, password:values.password }); if (error) throw error;
        onAuthenticated(data.session);
      } else if (mode === 'signup') {
        if (!validPhone(values.phone)) throw new Error('Ingresá un teléfono válido de Argentina.');
        const { data, error } = await client.auth.signUp({ email:values.email, password:values.password, options:{ data:{ full_name:values.name.trim(), phone:values.phone.trim() }, emailRedirectTo:window.location.href.split('#')[0] } }); if (error) throw error;
        if (data.session) onAuthenticated(data.session); else setMessage('Te enviamos un correo para confirmar tu cuenta.');
      } else if (mode === 'update') {
        const { error } = await client.auth.updateUser({ password:values.password }); if (error) throw error;
        await client.auth.signOut(); setMessage('Contraseña actualizada. Ya podés iniciar sesión.'); setMode('signin');
      } else {
        const { error } = await client.auth.resetPasswordForEmail(values.email, { redirectTo:window.location.href.split('#')[0] }); if (error) throw error;
        setMessage('Si existe una cuenta con ese correo, vas a recibir instrucciones para cambiar la contraseña.');
      }
    } catch(error) { setMessage(error.message || 'No pudimos completar el acceso.'); }
    finally { setBusy(false); }
  };
  return <div className="react-dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="react-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <>
      <button className="react-dialog-close" type="button" onClick={onClose} aria-label="Cerrar">×</button>
      <div className="react-auth-form-heading"><span className="react-auth-kicker">TU CUENTA</span><h2 id="auth-title">{mode === 'signin' ? 'Iniciá sesión' : mode === 'signup' ? 'Crear una cuenta' : mode === 'update' ? 'Elegí una contraseña nueva' : 'Recuperá tu acceso'}</h2>
      <p className="react-auth-intro">{mode === 'signin' ? 'Accedé a tus reservas y gestioná tus turnos.' : mode === 'signup' ? 'Creá tu cuenta y empezá a organizar el próximo partido.' : mode === 'update' ? 'Actualizá tu contraseña para volver a tu cuenta.' : 'Te mandamos un enlace para cambiar la contraseña.'}</p></div>
      <form onSubmit={submit}>
        {mode === 'signup' && <><label>Nombre y apellido<input name="name" value={values.name} onChange={change} minLength="3" autoComplete="name" placeholder="Tu nombre" required/></label><label>Teléfono (Argentina)<input name="phone" value={values.phone} onChange={change} type="tel" autoComplete="tel" placeholder="+54 9 387 1234567" required/></label></>}
        <label>Correo electrónico<input name="email" value={values.email} onChange={change} type="email" autoComplete="email" placeholder="vos@ejemplo.com" required/></label>
        {mode !== 'reset' && <label>{mode === 'update' ? 'Nueva contraseña' : 'Contraseña'}<input name="password" value={values.password} onChange={change} type="password" minLength="8" autoComplete={mode === 'signup' || mode === 'update' ? 'new-password':'current-password'} placeholder={mode === 'signin' ? 'Tu contraseña' : 'Al menos 8 caracteres'} required/></label>}
        {message && <p className="react-auth-message" role="status">{message}</p>}
        {mode === 'signin' && <button type="button" className="react-forgot" onClick={() => {setMode('reset');setMessage('');}}>Olvidé mi contraseña</button>}
        <button className="react-button react-button-primary" disabled={busy}>{busy ? 'Un momento…' : mode === 'signin' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : mode === 'update' ? 'Guardar contraseña' : 'Enviar instrucciones'} <span aria-hidden="true">→</span></button>
      </form>
      <div className="react-auth-actions"><button type="button" className="react-auth-mode-toggle" onClick={() => {setMode(mode === 'signin' ? 'signup':'signin');setMessage('');}}>{mode === 'signin' ? 'Crear una cuenta':'Iniciar sesión'}</button></div>
    </>
  </section></div>;
}

function App() {
  const client = useMemo(makeSupabase, []);
  const mainRef = useRef(null);
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [times, setTimes] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [authOpen, setAuthOpen] = useState(window.location.hash === '#login' || window.location.hash === '#admin' || window.location.hash.includes('type=recovery') || window.location.pathname === '/login');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [authError, setAuthError] = useState('');
  const [form, setForm] = useState({ playerName:'', phone:'' });
  const isAdmin = profile?.role === 'admin';

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.from('.react-hero-copy > *', { autoAlpha: 0, y: 18, duration: .55, stagger: .07, ease: 'power2.out' });
    gsap.from('.react-hero-photo', { autoAlpha: 0, scale: .96, duration: .85, delay: .12, ease: 'power2.out' });
    gsap.utils.toArray('.react-facility, .react-field').forEach((card, index) => {
      gsap.from(card, {
        autoAlpha: 0, y: 18, duration: .45, delay: (index % 4) * .06, ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' },
      });
    });
    gsap.fromTo('.react-quincho-copy', { autoAlpha: .35, y: 18 }, {
      autoAlpha: 1, y: 0, ease: 'none',
      scrollTrigger: { trigger: '.react-quincho', start: 'top 82%', end: 'center center', scrub: .5 },
    });
  }, { scope: mainRef, dependencies: [] });

  const loadBookings = useCallback(async currentUser => {
    if (!client || !currentUser) { setBookings([]); return; }
    const { data, error } = await client.from('bookings').select('*').order('booking_date').order('start_time');
    if (error) throw error; setBookings(data || []);
  }, [client]);

  useEffect(() => {
    let active = true;
    if (!client) return undefined;
    const hydrate = async session => {
      if (!active) return;
      const currentUser = session?.user || null; setUser(currentUser);
      if (!currentUser) { setProfile(null); setBookings([]); setAuthError(''); return; }
      try {
        const { data:profileData, error:profileError } = await client.from('profiles').select('id,full_name,phone,role').eq('id',currentUser.id).maybeSingle();
        if (profileError) throw profileError;
        if (!active) return;
        setProfile(profileData || null); setAuthError(profileData ? '' : 'No encontramos el perfil de esta cuenta. Revisá que exista en public.profiles.');
        if (profileData?.full_name) setForm(current => ({...current, playerName:current.playerName || profileData.full_name, phone:current.phone || profileData.phone || ''}));
        if (window.location.pathname === '/login') window.history.replaceState(null, '', profileData?.role === 'admin' ? '/#admin' : '/');
        const { data:bookingsData, error:bookingsError } = await client.from('bookings').select('*').order('booking_date').order('start_time');
        if (!active) return;
        if (bookingsError) setNotice({kind:'error',text:`No se pudieron cargar las reservas: ${bookingsError.message}`});
        else setBookings(bookingsData || []);
      } catch (error) {
        if (active) setAuthError(`No se pudo verificar tu cuenta en Supabase: ${error.message}`);
      }
    };
    const { data:{ subscription } } = client.auth.onAuthStateChange((event, session) => { if (event === 'PASSWORD_RECOVERY') setAuthOpen(true); window.setTimeout(() => hydrate(session),0); });
    return () => { active=false; subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    client.from('fields').select('id,name,complex,surface_type,capacity,price,active').order('id').then(({data,error}) => {
      if (!error && data?.length) setFields(data.filter(field => field.active));
    });
  }, [client]);

  useEffect(() => {
    let active = true;
    const loadTimes = async () => {
      if (!date || !selected) { setTimes([]); return; }
      let occupied = [], blocked = [];
      if (client && user) {
        const [{data:slotData},{data:blockData}] = await Promise.all([
          client.from('booking_slots').select('start_time').eq('field_id',selected.id).eq('booking_date',date),
          client.from('blocked_slots').select('start_time,reason').eq('field_id',selected.id).eq('blocked_date',date),
        ]);
        occupied = (slotData || []).map(row => String(row.start_time).slice(0,5));
        blocked = blockData || [];
      }
      const today = localDateKey();
      const nowTime = new Date().toTimeString().slice(0,5);
      const options = TIMES.map(slot => {
        const block = blocked.find(row => String(row.start_time).slice(0,5) === slot);
        const passed = date === today && slot <= nowTime;
        return { time:slot, available:!occupied.includes(slot) && !block && !passed, reason:occupied.includes(slot) ? 'Ocupado' : block ? `Bloqueado: ${block.reason}` : passed ? 'Pasado' : '' };
      });
      if (active) setTimes(options);
    };
    loadTimes().catch(() => active && setNotice({kind:'error',text:'No pudimos cargar la disponibilidad. Volvé a intentar.'}));
    return () => { active=false; };
  }, [client, date, selected, user, bookings]);

  useEffect(() => {
    if (!authOpen) return undefined;
    const onKey = event => event.key === 'Escape' && setAuthOpen(false);
    document.addEventListener('keydown', onKey); document.body.classList.add('react-dialog-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('react-dialog-open'); };
  }, [authOpen]);

  const selectField = field => { setSelected(field); setNotice(null); setTime(''); if (!user) setAuthOpen(true); };
  const submitBooking = async event => {
    event.preventDefault(); setNotice(null);
    if (!client || !user) { setAuthOpen(true); return; }
    if (!validPhone(form.phone)) { setNotice({kind:'error',text:'Ingresá un teléfono válido de Argentina para confirmar la reserva.'}); return; }
    if (!selected || !date || !time) { setNotice({kind:'error',text:'Elegí una fecha y un horario disponible.'}); return; }
    setSubmitting(true);
    const { error } = await client.from('bookings').insert({ field_id:selected.id, field_name:selected.name, complex:selected.complex || 'Sede Central', price:selected.price, booking_date:date, start_time:time, player_name:form.playerName.trim(), phone:form.phone.trim() });
    setSubmitting(false);
    if (error) { setNotice({kind:'error',text:error.code === '23505' ? 'Ese horario acaba de ocuparse. Elegí otro.' : error.message || 'No se pudo guardar la reserva.'}); return; }
    setNotice({kind:'success',text:'Reserva confirmada. Ya podés verla en Mis reservas.'}); setSelected(null); setDate(''); setTime(''); await loadBookings(user);
  };
  const cancelBooking = async id => {
    if (!window.confirm('¿Querés cancelar esta reserva?')) return;
    const {error} = await client.from('bookings').delete().eq('id',id);
    if (error) setNotice({kind:'error',text:'No se pudo cancelar la reserva.'}); else {setBookings(current => current.filter(item => item.id !== id));setNotice({kind:'success',text:'Reserva cancelada.'});}
  };
  const signOut = async () => {
    const { error } = await client?.auth.signOut() || {};
    if (error) { setNotice({ kind: 'error', text: 'No se pudo cerrar la sesión. Volvé a intentar.' }); return; }
    window.location.assign('/');
  };
  const openLogin = () => {setAuthOpen(true);window.history.replaceState(null,'','#login');};
  const closeLogin = () => {setAuthOpen(false);if(window.location.pathname === '/login')window.history.replaceState(null,'','/');else if(window.location.hash === '#login')window.history.replaceState(null,'',window.location.pathname + window.location.search);};
  const handleAuthenticated = session => {setAuthOpen(false);setUser(session?.user || null);if(window.location.hash === '#login')window.history.replaceState(null,'',window.location.pathname + window.location.search);};

  if (window.location.pathname.replace(/\/$/, '') === '/fichajes') return <><Header user={user} isAdmin={isAdmin} isFichajes onLogin={openLogin} onSignOut={signOut}/><Fichajes client={client} user={user} profile={profile} bookings={bookings} onLogin={openLogin}/><footer className="react-footer"><a className="react-brand" href="/"><BrandMark/><span><strong>LA BOMBONERITA</strong><small>FÚTBOL CLUB · SALTA</small></span></a><span>Salta Capital, Argentina · © 2026 La Bombonerita Fútbol Club</span><a href="https://wa.me/543874797240">+54 387 4797240</a></footer>{authOpen && <AuthDialog client={client} onClose={closeLogin} onAuthenticated={handleAuthenticated}/>}</>;
  if (isAdmin) return <AdminPanel client={client} user={user} profile={profile} onSignOut={signOut}/>;

  return <><Header user={user} isAdmin={isAdmin} onLogin={openLogin} onSignOut={signOut}/><main ref={mainRef}>
    {authError && <p className="react-auth-message" role="alert">{authError}</p>}
    <Hero onReserve={() => setSelected(current => current)}/><Facilities/>
    <Reservation fields={fields} selected={selected} onSelect={selectField} date={date} setDate={setDate} time={time} setTime={setTime} times={times} user={user} form={form} setForm={setForm} onSubmit={submitBooking} submitting={submitting} onLogin={openLogin} notice={notice}/>
    {user && !isAdmin && <MyBookings bookings={bookings} onCancel={cancelBooking}/>}<Contact/>
    <section className="react-community"><span>EL PARTIDO ES MEJOR EN EQUIPO</span><h2>¿Falta uno?</h2><a href="/fichajes">Encontrá jugadores en Fichajes <b aria-hidden="true">↗</b></a></section>
  </main><footer className="react-footer"><a className="react-brand" href="#inicio"><BrandMark/><span><strong>LA BOMBONERITA</strong><small>FÚTBOL CLUB · SALTA</small></span></a><span>Salta Capital, Argentina · © 2026 La Bombonerita Fútbol Club</span><a href="https://wa.me/543874797240">+54 387 4797240</a></footer>
    {authOpen && <AuthDialog client={client} onClose={closeLogin} onAuthenticated={handleAuthenticated}/>}
  </>;
}

export default App;
