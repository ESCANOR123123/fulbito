import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './fichajes.css';

const POSITIONS = { arquero: 'Arquero', defensor: 'Defensor', mediocampista: 'Mediocampista', delantero: 'Delantero' };
const DAYS = [['lunes','Lun'],['martes','Mar'],['miercoles','Mié'],['jueves','Jue'],['viernes','Vie'],['sabado','Sáb'],['domingo','Dom']];
const PHONE = /^(?:(?:\+|00)?54)?(?:9)?(?:0)?([1-9]\d{1,3})(?:15)?(\d{6,8})$/;
const dateLabel = value => new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
const phoneOk = value => PHONE.test(value.replace(/[\s\-()]/g, ''));
const waPhone = value => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('549')) return digits;
  if (digits.startsWith('54')) return `549${digits.slice(2).replace(/^0/, '')}`;
  return `549${digits.replace(/^0?9?/, '')}`;
};
const waLink = (phone, message) => `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(message)}`;
const bookingDate = item => item.booking_date || item.date;
const bookingTime = item => String(item.start_time || item.time || '').slice(0, 5);
const bookingField = item => item.field_name || item.fieldName || 'Cancha';

const emptyProfile = {
  public_name: '', phone: '', primary_position: 'arquero', secondary_position: '', preferred_foot: 'diestro', level: 'recreativo',
  available_days: [], time_slot: 'noche', preferred_venue: 'central', bio: '', avatar_url: '', full_body_photo_url: '',
  video_url: '', instagram_url: '', tiktok_url: '', contact_consent: false,
};

const photoLimit = 5 * 1024 * 1024;
const safeLinks = {
  video_url: ['youtube.com', 'youtu.be'], instagram_url: ['instagram.com'], tiktok_url: ['tiktok.com'],
};
const isAllowedLink = (value, hosts) => {
  if (!value?.trim()) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)); }
  catch { return false; }
};

function Dialog({ children, onClose }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && !ref.current.open) ref.current.showModal(); }, []);
  return <dialog ref={ref} className="fichaje-dialog" onCancel={onClose}>{children}</dialog>;
}

function Fichajes({ client, user, profile, bookings, onLogin }) {
  const [players, setPlayers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [ownPlayer, setOwnPlayer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [reviewForm, setReviewForm] = useState({ stars: 5, comment: '' });
  const [ownReview, setOwnReview] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState(null);
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [ownNotices, setOwnNotices] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState('all');
  const [level, setLevel] = useState('all');
  const [venue, setVenue] = useState('all');
  const [day, setDay] = useState('all');
  const [view, setView] = useState('market');
  const [dialog, setDialog] = useState(null);
  const [playerForm, setPlayerForm] = useState(emptyProfile);
  const [reportForm, setReportForm] = useState({ id: '', reason: 'contacto_incorrecto', details: '' });
  const [urgentForm, setUrgentForm] = useState({ booking: '', position: 'cualquiera', level: 'amistoso', notes: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    if (!client) { setLoadError('La conexión con Supabase todavía no está configurada.'); setLoading(false); return; }
    try {
      const playerColumns = 'id,public_name,phone,primary_position,secondary_position,preferred_foot,level,available_days,time_slot,preferred_venue,bio,avatar_url,full_body_photo_url,video_url,instagram_url,tiktok_url,created_at' + (user ? ',owner_user_id' : '');
      const noticeColumns = 'id,match_date,match_time,field_name,complex,needed_position,level,notes,contact_phone,expires_at,created_at' + (user ? ',booking_id,captain_user_id' : '');
      const results = await Promise.all([
        client.from('player_profiles').select(playerColumns).order('created_at', { ascending: false }),
        client.from('urgent_notices').select(noticeColumns).gt('expires_at', new Date().toISOString()).order('match_date').order('match_time'),
        user ? client.from('player_profiles').select('*').eq('owner_user_id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        user ? client.from('urgent_notices').select('*').eq('captain_user_id', user.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
        client.from('player_profile_reviews').select(`id,player_profile_id,stars,comment,created_at${user ? ',reviewer_user_id' : ''}`),
      ]);
      const failed = results.find(result => result.error);
      if (failed) throw failed.error;
      setPlayers(results[0].data || []); setNotices(results[1].data || []); setOwnPlayer(results[2].data || null); setOwnNotices(results[3].data || []); setReviews(results[4].data || []);
    } catch (error) {
      console.error('No se pudo cargar Fichajes:', error);
      setLoadError('Fichajes todavía no está disponible. Revisá las migraciones 003 y 005 y los permisos de Supabase.');
    } finally { setLoading(false); }
  }, [client, user]);

  useEffect(() => { load(); }, [load]);

  const report = (text, kind = 'success') => setNotice({ text, kind });
  const requireUser = () => { if (user) return true; sessionStorage.setItem('turnos:return-after-auth', 'fichajes'); report('Iniciá sesión o creá tu cuenta para participar en Fichajes.', 'info'); onLogin(); return false; };
  const filtered = useMemo(() => players.filter(player =>
    (position === 'all' || player.primary_position === position || player.secondary_position === position)
    && (level === 'all' || player.level === level)
    && (venue === 'all' || player.preferred_venue === venue || player.preferred_venue === 'indistinta')
    && (day === 'all' || (player.available_days || []).includes(day))), [players, position, level, venue, day]);

  const openProfile = () => {
    if (!requireUser()) return;
    if (!user.email_confirmed_at) return report('Verificá tu correo antes de publicar el perfil.', 'error');
    setPlayerForm(ownPlayer ? { ...emptyProfile, ...ownPlayer, photoFiles: {}, contact_consent: Boolean(ownPlayer.contact_consent_at) } : {
      ...emptyProfile, public_name: profile?.full_name || '', phone: profile?.phone || '',
    });
    setPhotoPreviews({});
    setDialog('profile');
  };

  const saveProfile = async event => {
    event.preventDefault();
    if (!requireUser()) return;
    if (!phoneOk(playerForm.phone)) return report('Ingresá un número de WhatsApp argentino válido.', 'error');
    if (!playerForm.available_days.length) return report('Seleccioná al menos un día disponible.', 'error');
    if (playerForm.secondary_position === playerForm.primary_position) return report('Elegí una posición secundaria distinta o dejala en ninguna.', 'error');
    if (Object.entries(safeLinks).some(([key, hosts]) => !isAllowedLink(playerForm[key], hosts))) return report('Revisá los enlaces: usá una URL HTTPS de YouTube, Instagram o TikTok.', 'error');
    setBusy(true);
    try {
      const media = {};
      for (const [field, file] of Object.entries(playerForm.photoFiles || {})) {
        if (!file) continue;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > photoLimit) throw new Error('Cada foto debe ser JPG, PNG o WebP y pesar hasta 5 MB.');
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `${user.id}/${field}-${crypto.randomUUID()}.${ext}`;
        const uploaded = await client.storage.from('player-photos').upload(path, file, { upsert: true, contentType: file.type });
        if (uploaded.error) throw uploaded.error;
        media[field] = client.storage.from('player-photos').getPublicUrl(path).data.publicUrl;
      }
    const payload = {
      public_name: playerForm.public_name.trim(), phone: playerForm.phone.trim(), contact_consent_at: new Date().toISOString(),
      primary_position: playerForm.primary_position, secondary_position: playerForm.secondary_position || null,
      preferred_foot: playerForm.preferred_foot, level: playerForm.level, available_days: playerForm.available_days,
      time_slot: playerForm.time_slot, preferred_venue: playerForm.preferred_venue, bio: playerForm.bio.trim(),
      avatar_url: media.avatar_url || playerForm.avatar_url || null,
      full_body_photo_url: media.full_body_photo_url || playerForm.full_body_photo_url || null,
      video_url: playerForm.video_url.trim() || null, instagram_url: playerForm.instagram_url.trim() || null,
      tiktok_url: playerForm.tiktok_url.trim() || null,
    };
      const result = ownPlayer
        ? await client.from('player_profiles').update(payload).eq('id', ownPlayer.id)
        : await client.from('player_profiles').insert({ ...payload, owner_user_id: user.id });
      if (result.error) throw result.error;
      setDialog(null); report(ownPlayer ? 'Perfil actualizado y enviado a revisión.' : 'Perfil enviado. El equipo lo revisará antes de publicarlo.'); await load();
    } catch (error) { report(error.code === '23505' ? 'Ya tenés un perfil publicado o en revisión.' : error.message || 'No se pudo guardar el perfil.', 'error'); }
    finally { setBusy(false); }
  };

  const saveReview = async event => {
    event.preventDefault();
    if (!requireUser()) { setReviewFeedback({ kind: 'info', text: 'Iniciá sesión para publicar tu opinión.' }); return; }
    if (!user.email_confirmed_at) { setReviewFeedback({ kind: 'error', text: 'Verificá tu correo antes de publicar una opinión.' }); return; }
    if (selectedPlayer?.owner_user_id === user.id) { setReviewFeedback({ kind: 'error', text: 'No podés calificar tu propio perfil.' }); return; }
    setBusy(true);
    setReviewFeedback(null);
    try {
      const values = { stars: Number(reviewForm.stars), comment: reviewForm.comment.trim() };
      const request = ownReview
        ? client.from('player_profile_reviews').update(values).eq('id', ownReview.id).select().single()
        : client.from('player_profile_reviews').insert({ ...values, player_profile_id: selectedPlayer.id, reviewer_user_id: user.id }).select().single();
      const { data, error } = await request;
      if (error) throw error;
      setReviews(current => [...current.filter(item => item.id !== data.id && !(item.player_profile_id === data.player_profile_id && item.reviewer_user_id === user.id)), data]);
      setOwnReview(data);
      setReviewForm({ stars: data.stars, comment: data.comment });
      setReviewFeedback({ kind: 'success', text: 'Tu opinión quedó publicada.' });
    } catch (error) {
      console.error('No se pudo publicar la opinión de Fichajes:', error);
      setReviewFeedback({
        kind: 'error',
        text: error.message?.includes('Verificá tu correo')
          ? 'Verificá tu correo antes de publicar una opinión.'
          : error.code === '23505'
            ? 'Ya existe una opinión tuya para este perfil. Cerralo y volvé a abrirlo para editarla.'
            : error.message?.includes('permission denied for table player_profile_reviews')
              ? 'Supabase todavía rechaza esta operación. Actualizá la página y, si sigue, verificá que la migración 005 esté aplicada.'
              : error.code === '42501'
                ? 'Supabase rechazó la opinión. Verificá tu correo y que el perfil siga publicado.'
                : 'No se pudo publicar el comentario. Revisá tu conexión y que las migraciones 005 y 007 estén aplicadas.',
      });
    } finally { setBusy(false); }
  };

  const openPlayer = player => {
    setSelectedPlayer(player);
    const mine = user ? reviews.find(item => item.player_profile_id === player.id && item.reviewer_user_id === user.id) || null : null;
    setOwnReview(mine); setReviewForm(mine ? { stars: mine.stars, comment: mine.comment } : { stars: 5, comment: '' });
    setReviewFeedback(null);
    setDialog('player');
  };

  const playerAction = async action => {
    if (!ownPlayer || !requireUser()) return;
    if (action === 'edit') return openProfile();
    if (action === 'delete' && !window.confirm('¿Eliminar tu perfil? Se quitará del mercado y no se podrá recuperar.')) return;
    const result = action === 'delete'
      ? await client.from('player_profiles').delete().eq('id', ownPlayer.id)
      : await client.from('player_profiles').update({ status: action === 'pause' ? 'paused' : action === 'signed' ? 'signed' : 'active' }).eq('id', ownPlayer.id);
    if (result.error) return report('No se pudo actualizar el perfil.', 'error');
    report(action === 'delete' ? 'Perfil eliminado.' : action === 'pause' ? 'Perfil en pausa.' : action === 'signed' ? '¡Éxitos en el nuevo equipo!' : 'Perfil disponible nuevamente.'); await load();
  };

  const openUrgent = () => {
    if (!requireUser()) return;
    if (!user.email_confirmed_at) return report('Verificá tu correo antes de publicar un aviso.', 'error');
    const now = new Date();
    const posted = new Set(ownNotices.filter(item => item.status === 'open' && new Date(item.expires_at) > now).map(item => item.booking_id));
    const options = bookings.filter(item => new Date(`${bookingDate(item)}T${bookingTime(item)}`) > now && !posted.has(item.id));
    if (!options.length) return report(bookings.some(item => new Date(`${bookingDate(item)}T${bookingTime(item)}`) > now) ? 'Ya hay un aviso abierto para tus reservas próximas.' : 'Necesitás una reserva confirmada próxima para publicar un aviso.', 'info');
    setUrgentForm({ booking: options[0].id, position: 'cualquiera', level: 'amistoso', notes: '' }); setDialog('urgent');
  };

  const saveUrgent = async event => {
    event.preventDefault(); if (!requireUser()) return; setBusy(true);
    const { error } = await client.from('urgent_notices').insert({ captain_user_id: user.id, booking_id: urgentForm.booking, needed_position: urgentForm.position, level: urgentForm.level, notes: urgentForm.notes.trim(), contact_consent_at: new Date().toISOString() });
    setBusy(false);
    if (error) return report(error.code === '23505' ? 'Ya hay un aviso abierto para esa reserva.' : error.message || 'No se pudo publicar el aviso.', 'error');
    setDialog(null); report('Aviso publicado. Tu teléfono se mostrará para recibir postulaciones.'); await load();
  };

  const closeUrgent = async id => {
    if (!window.confirm('¿Cerrar el aviso? Dejará de aparecer en la pizarra.')) return;
    const { error } = await client.from('urgent_notices').update({ status: 'filled' }).eq('id', id);
    if (error) return report('No se pudo cerrar el aviso.', 'error');
    report('Aviso cerrado.'); await load();
  };

  const sendReport = async event => {
    event.preventDefault(); if (!requireUser()) return; setBusy(true);
    const { error } = await client.from('player_profile_reports').insert({ player_profile_id: reportForm.id, reporter_user_id: user.id, reason: reportForm.reason, details: reportForm.details.trim() });
    setBusy(false);
    if (error) return report(error.code === '23505' ? 'Ya enviaste un reporte para este perfil.' : 'No se pudo enviar el reporte. Usá una cuenta verificada.', 'error');
    setDialog(null); report('Reporte enviado. Gracias por ayudar a cuidar la comunidad.');
  };

  const visibleOwnNotices = ownNotices.filter(item => item.status === 'open' && new Date(item.expires_at) > new Date());
  return <><main className="fichajes-page-main"><section className="fichajes-section">
    <div className="fichajes-heading"><div><p className="fichajes-eyebrow">MERCADO DE PASES · LA BOMBONERITA</p><h2>Un equipo puede estar buscándote.</h2><p>Encontrá jugadores para completar el equipo o publicá tu perfil para recibir propuestas.</p></div></div>
    {notice && <p className={`fichajes-feedback ${notice.kind}`} role="status">{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">×</button></p>}
    <div className="fichajes-switch" role="tablist" aria-label="Secciones de Fichajes"><button className={`fichajes-switch-btn ${view === 'market' ? 'active' : ''}`} role="tab" aria-selected={view === 'market'} onClick={() => setView('market')}>Jugadores</button><button className={`fichajes-switch-btn ${view === 'urgent' ? 'active' : ''}`} role="tab" aria-selected={view === 'urgent'} onClick={() => setView('urgent')}>Falta uno</button></div>
    {view === 'market' ? <section role="tabpanel" className="fichajes-view active"><div className="fichajes-market-heading"><div><h3>Jugadores disponibles</h3><p>Buscá por posición, nivel y disponibilidad.</p></div><button className="fichajes-primary" onClick={openProfile}>{ownPlayer ? 'Editar mi perfil' : 'Publicar mi perfil'} <span>＋</span></button></div>
      {!user ? <div className="player-own-note">¿Querés recibir propuestas? <button className="fichaje-inline-link" onClick={requireUser}>Iniciá sesión y publicá tu perfil →</button></div> : ownPlayer ? <div className="player-own-card"><div className="player-own-copy"><span className="player-own-kicker">TU PERFIL</span><strong>{ownPlayer.public_name}</strong><span className="player-own-state">{{active:'Disponible',paused:'En pausa',signed:'Fichado'}[ownPlayer.status] || 'Disponible'} · {{pending:'En revisión',approved:'Publicado',suspended:'Suspendido',removed:'Dado de baja'}[ownPlayer.moderation_status] || 'En revisión'}</span></div><div className="player-own-actions">{!['suspended','removed'].includes(ownPlayer.moderation_status) && <><button className="fichajes-secondary" onClick={() => playerAction('edit')}>Editar perfil</button>{ownPlayer.status === 'active' ? <><button className="fichajes-secondary" onClick={() => playerAction('pause')}>Pausar</button><button className="fichajes-secondary" onClick={() => playerAction('signed')}>Marcar como fichado</button></> : <button className="fichajes-secondary" onClick={() => playerAction('activate')}>Volver a activar</button>}<button className="player-delete-link" onClick={() => playerAction('delete')}>Eliminar perfil</button></>}</div></div> : <p className="player-own-note">Tu perfil te ayuda a conectar con equipos de la zona.</p>}
      <div className="player-filters"><div className="player-position-filters" role="group" aria-label="Filtrar por posición">{[['all','Todas las posiciones'],...Object.entries(POSITIONS)].map(([key,label])=><button key={key} className={`player-filter-chip ${position===key?'active':''}`} aria-pressed={position===key} onClick={()=>setPosition(key)}>{label}</button>)}</div><div className="player-select-filters"><label>Nivel<select value={level} onChange={e=>setLevel(e.target.value)}><option value="all">Cualquier nivel</option>{['recreativo','intermedio','competitivo'].map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</select></label><label>Sede<select value={venue} onChange={e=>setVenue(e.target.value)}><option value="all">Todas las sedes</option><option value="central">Sede Central</option><option value="norte">Sede Norte</option></select></label><label>Día<select value={day} onChange={e=>setDay(e.target.value)}><option value="all">Cualquier día</option>{DAYS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div></div>
      <div className="players-grid" aria-live="polite">{loading ? <p className="fichaje-empty-state">Cargando jugadores…</p> : loadError ? <Empty title="Estamos preparando el mercado de jugadores." text={loadError}/> : !filtered.length ? <Empty title={players.length?'No hay perfiles con esos filtros.':'Todavía no hay jugadores publicados.'} text={players.length?'Probá cambiar una posición, sede o día.':'Sé el primero en compartir tu perfil con los equipos de la zona.'}/> : filtered.map(player=><PlayerCard key={player.id} player={player} user={user} reviews={reviews.filter(item=>item.player_profile_id===player.id)} onOpen={()=>openPlayer(player)} onReport={()=>{setReportForm({id:player.id,reason:'contacto_incorrecto',details:''});setDialog('report');}}/>)}</div>
    </section> : <section role="tabpanel" className="fichajes-view active"><div className="fichajes-market-heading"><div><h3>¿Falta uno para el partido?</h3><p>Publicá un aviso vinculado a tu reserva y encontrá un refuerzo.</p></div><button className="fichajes-primary" onClick={openUrgent}>Publicar aviso <span>＋</span></button></div>
      {visibleOwnNotices.length > 0 && <div className="urgent-own-list"><p>TUS AVISOS ABIERTOS</p>{visibleOwnNotices.map(item=><div key={item.id}><span>{item.field_name} · {dateLabel(item.match_date)} · {String(item.match_time).slice(0,5)}</span><button className="urgent-close-link" onClick={()=>closeUrgent(item.id)}>Cerrar aviso</button></div>)}</div>}
      <div className="urgent-notices-grid" aria-live="polite">{loading ? <p className="fichaje-empty-state">Cargando avisos…</p> : loadError ? <Empty title="La pizarra estará disponible pronto." text={loadError}/> : !notices.length ? <Empty title="Ahora mismo no hay equipos buscando refuerzos." text="Volvé a consultar más tarde o compartí tu perfil en el mercado de jugadores."/> : notices.map(item=><UrgentCard key={item.id} item={item} own={user?.id===item.captain_user_id} onClose={()=>closeUrgent(item.id)}/>)}</div>
    </section>}
  </section></main>
    {dialog === 'profile' && <Dialog onClose={()=>setDialog(null)}><form className="fichaje-form" onSubmit={saveProfile}><DialogHeading title={ownPlayer?'Editá tu perfil':'Publicá tu perfil'} subtitle="Contales a los equipos dónde y cuándo te gusta jugar." onClose={()=>setDialog(null)}/><div className="fichaje-form-grid">
      <label>Nombre o apodo<input value={playerForm.public_name} onChange={e=>setPlayerForm({...playerForm,public_name:e.target.value})} minLength="3" maxLength="30" autoComplete="nickname" required/></label><label>WhatsApp<input className={playerForm.phone&&!phoneOk(playerForm.phone)?'is-invalid':''} type="tel" value={playerForm.phone} onChange={e=>setPlayerForm({...playerForm,phone:e.target.value})} autoComplete="tel" placeholder="+54 9 387 1234567" required/><small>Este número será visible para los equipos.</small></label>
      <label>Posición principal<select value={playerForm.primary_position} onChange={e=>setPlayerForm({...playerForm,primary_position:e.target.value})}>{Object.entries(POSITIONS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Posición secundaria<select value={playerForm.secondary_position} onChange={e=>setPlayerForm({...playerForm,secondary_position:e.target.value})}><option value="">Ninguna</option>{Object.entries(POSITIONS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <fieldset><legend>Pierna hábil</legend><div className="fichaje-choice-row">{['diestro','zurdo','ambidiestro'].map(x=><label key={x}><input type="radio" name="foot" checked={playerForm.preferred_foot===x} onChange={()=>setPlayerForm({...playerForm,preferred_foot:x})}/>{x[0].toUpperCase()+x.slice(1)}</label>)}</div></fieldset><label>Nivel<select value={playerForm.level} onChange={e=>setPlayerForm({...playerForm,level:e.target.value})}>{['recreativo','intermedio','competitivo'].map(x=><option key={x}>{x}</option>)}</select></label>
      <fieldset className="availability-fieldset"><legend>Días disponibles <span>Elegí al menos uno</span></legend><div className="availability-days">{DAYS.map(([key,label])=><label key={key}><input type="checkbox" checked={playerForm.available_days.includes(key)} onChange={e=>setPlayerForm({...playerForm,available_days:e.target.checked?[...playerForm.available_days,key]:playerForm.available_days.filter(x=>x!==key)})}/>{label}</label>)}</div></fieldset>
      <label>Disponibilidad horaria<select value={playerForm.time_slot} onChange={e=>setPlayerForm({...playerForm,time_slot:e.target.value})}><option value="tarde">Tarde · 14 a 18 h</option><option value="noche">Noche · 18 a 23 h</option><option value="indistinto">Cualquier horario</option></select></label><label>Sede preferida<select value={playerForm.preferred_venue} onChange={e=>setPlayerForm({...playerForm,preferred_venue:e.target.value})}><option value="central">Sede Central</option><option value="norte">Sede Norte</option><option value="indistinta">Indistinta</option></select></label>
      <label className="fichaje-bio-field">Sobre vos<textarea value={playerForm.bio} maxLength="600" rows="5" onChange={e=>setPlayerForm({...playerForm,bio:e.target.value})}/><small>{playerForm.bio.length}/600</small></label></div>
      <div className="fichaje-media-fields"><h3 className="fichaje-section-title">Mostrá cómo jugás</h3><div className="fichaje-photo-grid">{[['avatar_url','Foto de perfil'],['full_body_photo_url','Foto de cuerpo completo']].map(([field,label])=><label className="fichaje-photo-upload" key={field}>{label}<span className="fichaje-photo-preview">{photoPreviews[field]||playerForm[field]?<img src={photoPreviews[field]||playerForm[field]} alt={`Vista previa: ${label.toLowerCase()}`}/>:<span>Elegir foto</span>}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>photoLimit){report('Elegí una foto JPG, PNG o WebP de hasta 5 MB.','error');event.target.value='';return;}const preview=URL.createObjectURL(file);setPhotoPreviews(current=>({...current,[field]:preview}));setPlayerForm(current=>({...current,photoFiles:{...current.photoFiles,[field]:file}}));}}/><small>JPG, PNG o WebP · hasta 5 MB</small></label>)}</div><div className="fichaje-form-grid"><label>Video destacado<input type="url" value={playerForm.video_url} onChange={e=>setPlayerForm({...playerForm,video_url:e.target.value})} placeholder="https://youtu.be/…"/><small>YouTube o un video público de Instagram/TikTok.</small></label><label>Instagram<input type="url" value={playerForm.instagram_url} onChange={e=>setPlayerForm({...playerForm,instagram_url:e.target.value})} placeholder="https://instagram.com/…"/></label><label>TikTok<input type="url" value={playerForm.tiktok_url} onChange={e=>setPlayerForm({...playerForm,tiktok_url:e.target.value})} placeholder="https://tiktok.com/@…"/></label></div></div><label className="fichaje-consent"><input type="checkbox" required checked={playerForm.contact_consent} onChange={e=>setPlayerForm({...playerForm,contact_consent:e.target.checked})}/><span>Acepto mostrar mi WhatsApp en el perfil para recibir propuestas. Las fotos y enlaces se verán públicamente.</span></label><FormActions onCancel={()=>setDialog(null)} busy={busy} label={ownPlayer?'Guardar cambios':'Enviar a revisión'}/></form></Dialog>}
    {dialog === 'player' && selectedPlayer && <Dialog onClose={()=>setDialog(null)}><div className="fichaje-player-detail"><DialogHeading title={selectedPlayer.public_name} subtitle={`${POSITIONS[selectedPlayer.primary_position]} · ${selectedPlayer.level}`} onClose={()=>setDialog(null)}/><div className="fichaje-profile-gallery">{[selectedPlayer.avatar_url,selectedPlayer.full_body_photo_url].filter(Boolean).length ? [selectedPlayer.avatar_url,selectedPlayer.full_body_photo_url].filter(Boolean).map((src,index)=><img key={src} src={src} alt={index===0?'Foto de perfil':'Foto de cuerpo completo'}/>) : <div className="fichaje-profile-placeholder">{selectedPlayer.public_name.slice(0,1).toUpperCase()}</div>}</div><p className="fichaje-profile-bio">{selectedPlayer.bio || 'Este jugador todavía no agregó una presentación.'}</p><div className="fichaje-profile-facts"><span>{selectedPlayer.preferred_foot}</span><span>{(selectedPlayer.available_days||[]).map(day=>DAYS.find(([key])=>key===day)?.[1]).filter(Boolean).join(' · ')}</span><span>{{tarde:'Tardes',noche:'Noches',indistinto:'Cualquier horario'}[selectedPlayer.time_slot]}</span></div><div className="fichaje-profile-links">{[[selectedPlayer.video_url,'Ver video'],[selectedPlayer.instagram_url,'Instagram'],[selectedPlayer.tiktok_url,'TikTok']].filter(([url])=>url).map(([url,label])=><a key={label} href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>)}</div><a className="player-contact-btn" href={waLink(selectedPlayer.phone,`¡Hola ${selectedPlayer.public_name}! Vi tu perfil en La Bombonerita FC.`)} target="_blank" rel="noopener noreferrer">Contactar por WhatsApp ↗</a><section className="fichaje-reviews"><div className="fichaje-reviews-heading"><h3>Opiniones de jugadores</h3><strong>{reviewStats(reviews.filter(item=>item.player_profile_id===selectedPlayer.id)).label}</strong></div>{reviews.filter(item=>item.player_profile_id===selectedPlayer.id).map(item=><article className="fichaje-review" key={item.id}><div><strong aria-label={`${item.stars} de 5 estrellas`}>{'★'.repeat(item.stars)}{'☆'.repeat(5-item.stars)}</strong><time>{new Date(item.created_at).toLocaleDateString('es-AR')}</time></div><p>{item.comment}</p></article>)}{user?.id!==selectedPlayer.owner_user_id?<form className="fichaje-review-form" onSubmit={saveReview}><h4>{ownReview?'Editá tu opinión':'¿Jugaste con este jugador?'}</h4><fieldset className="fichaje-rating-fieldset"><legend>Calificación</legend><div className="fichaje-rating-stars">{[1,2,3,4,5].map(value=><label className={`fichaje-rating-option ${Number(reviewForm.stars)>=value?'is-filled':''}`} key={value}><input type="radio" name="fichaje-rating" value={value} checked={Number(reviewForm.stars)===value} onChange={()=>setReviewForm({...reviewForm,stars:value})}/><span className="fichaje-rating-glyph" aria-hidden="true">★</span><span className="fichaje-visually-hidden">{value} {value===1?'estrella':'estrellas'}</span></label>)}</div><output className="fichaje-rating-value" aria-live="polite">{reviewForm.stars} de 5</output></fieldset><label>Tu comentario<textarea value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} minLength="10" maxLength="500" required placeholder="Contá brevemente cómo fue jugar en equipo…"/><small>{reviewForm.comment.length}/500 · Se publica con tu cuenta verificada.</small></label>{reviewFeedback && <p className={`fichaje-review-feedback ${reviewFeedback.kind}`} role={reviewFeedback.kind === 'error' ? 'alert' : 'status'}>{reviewFeedback.text}</p>}<button className="fichajes-primary" disabled={busy}>{busy?'Publicando…':ownReview?'Actualizar opinión':'Publicar opinión'}</button></form>:<p className="fichaje-own-review-note">Este es tu perfil.</p>}</section></div></Dialog>}
    {dialog === 'urgent' && <Dialog onClose={()=>setDialog(null)}><form className="fichaje-form fichaje-form-compact" onSubmit={saveUrgent}><DialogHeading title="Buscá un refuerzo" subtitle="Elegí una reserva próxima de tu cuenta." onClose={()=>setDialog(null)}/><label>Mi reserva<select required value={urgentForm.booking} onChange={e=>setUrgentForm({...urgentForm,booking:e.target.value})}>{bookings.filter(item=>new Date(`${bookingDate(item)}T${bookingTime(item)}`)>new Date()).map(item=><option key={item.id} value={item.id}>{dateLabel(bookingDate(item))} · {bookingTime(item)} · {bookingField(item)}</option>)}</select><small>La reserva debe estar confirmada y ser futura.</small></label><label>Posición que buscan<select value={urgentForm.position} onChange={e=>setUrgentForm({...urgentForm,position:e.target.value})}><option value="cualquiera">Cualquier posición</option>{Object.entries(POSITIONS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Tipo de partido<select value={urgentForm.level} onChange={e=>setUrgentForm({...urgentForm,level:e.target.value})}><option value="amistoso">Amistoso</option><option value="tranqui">Picado tranqui</option><option value="fuerte">Partido fuerte</option></select></label><label>Un detalle para el jugador<textarea maxLength="200" value={urgentForm.notes} onChange={e=>setUrgentForm({...urgentForm,notes:e.target.value})}/></label><label className="fichaje-consent"><input type="checkbox" required/><span>Acepto compartir el teléfono de mi cuenta para que el jugador pueda contactarme.</span></label><FormActions onCancel={()=>setDialog(null)} busy={busy} label="Publicar aviso"/></form></Dialog>}
    {dialog === 'report' && <Dialog onClose={()=>setDialog(null)}><form className="fichaje-form fichaje-form-compact" onSubmit={sendReport}><DialogHeading title="Reportar perfil" subtitle="El equipo de La Bombonerita revisará el reporte." onClose={()=>setDialog(null)}/><label>Motivo<select value={reportForm.reason} onChange={e=>setReportForm({...reportForm,reason:e.target.value})}><option value="contacto_incorrecto">Contacto incorrecto</option><option value="contenido_inapropiado">Contenido inapropiado</option><option value="perfil_falso">Parece un perfil falso</option><option value="otro">Otro</option></select></label><label>Detalle opcional<textarea maxLength="240" value={reportForm.details} onChange={e=>setReportForm({...reportForm,details:e.target.value})}/></label><FormActions onCancel={()=>setDialog(null)} busy={busy} label="Enviar reporte"/></form></Dialog>}
  </>;
}

function Empty({ title, text }) { return <div className="fichaje-empty-state"><strong>{title}</strong><span>{text}</span></div>; }
function DialogHeading({ title, subtitle, onClose }) { return <div className="fichaje-dialog-heading"><div><p className="fichajes-eyebrow">MERCADO DE PASES</p><h2>{title}</h2><p>{subtitle}</p></div><button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">×</button></div>; }
function FormActions({ onCancel, busy, label }) { return <div className="fichaje-form-actions"><button type="button" className="fichajes-secondary" onClick={onCancel}>Cancelar</button><button className="fichajes-primary" disabled={busy}>{busy?'Guardando…':label}</button></div>; }
function reviewStats(items) {
  if (!items.length) return { average: 0, label: 'Sin opiniones' };
  const average = items.reduce((sum, item) => sum + item.stars, 0) / items.length;
  return { average, label: `${average.toFixed(1)} · ${items.length} ${items.length === 1 ? 'opinión' : 'opiniones'}` };
}
function PlayerCard({ player, user, reviews, onOpen, onReport }) {
  const days = (player.available_days || []).map(day => DAYS.find(([key])=>key===day)?.[1] || day);
  const rating = reviewStats(reviews);
  const message = `¡Hola ${player.public_name}! Vi tu perfil en La Bombonerita FC. Estamos buscando un/a ${POSITIONS[player.primary_position] || 'jugador/a'} para sumarse a un equipo. ¿Te interesa?`;
  return <article className={`player-card position-${player.primary_position}`}><div className="player-card-top"><span className="player-position-label">{POSITIONS[player.primary_position]}</span><span className={`player-level level-${player.level}`}>{player.level}</span></div><div className="player-card-identity"><span className="player-avatar" aria-hidden="true">{player.avatar_url?<img src={player.avatar_url} alt=""/>:player.public_name.trim().slice(0,1).toUpperCase()}</span><div><h4>{player.public_name}</h4><span>{player.preferred_foot}</span></div></div><p className="player-rating" aria-label={`Calificación: ${rating.label}`}>{rating.average?`★ ${rating.label}`:rating.label}</p>{player.secondary_position&&<span className="player-secondary-position">También juega {POSITIONS[player.secondary_position]}</span>}<div className="player-days" aria-label="Días disponibles">{days.map(x=><span key={x}>{x}</span>)}</div><div className="player-card-details"><span>{{tarde:'Tardes',noche:'Noches',indistinto:'Cualquier horario'}[player.time_slot]}</span><span>{{central:'Sede Central',norte:'Sede Norte',indistinta:'Cualquier sede'}[player.preferred_venue]}</span></div>{player.bio&&<blockquote>{player.bio}</blockquote>}<button className="fichajes-secondary player-detail-btn" type="button" onClick={onOpen}>Ver perfil completo</button><a className="player-contact-btn" href={waLink(player.phone,message)} target="_blank" rel="noopener noreferrer">Contactar por WhatsApp <span aria-hidden="true">↗</span></a>{user&&user.id!==player.owner_user_id&&<button type="button" className="player-report-btn" onClick={onReport}>Reportar perfil</button>}</article>;
}
function UrgentCard({ item, own, onClose }) {
  const time=String(item.match_time).slice(0,5); const date=new Intl.DateTimeFormat('es-AR',{weekday:'short',day:'numeric',month:'short'}).format(new Date(`${item.match_date}T12:00:00`));
  const message=`¡Hola! Vi en la pizarra de La Bombonerita que les falta un jugador para las ${time} en ${item.field_name}. ¿Sigue libre el lugar?`;
  return <article className="urgent-notice-card"><div className="urgent-notice-time"><strong>{time}</strong><span>{date}</span></div><div className="urgent-notice-copy"><span className="urgent-kicker">BUSCA REFUERZO</span><h4>Falta {POSITIONS[item.needed_position]?`un/a ${POSITIONS[item.needed_position].toLowerCase()}`:'un jugador'}</h4><p>{item.field_name} · {item.complex}</p><span className="urgent-level">{{amistoso:'Amistoso',tranqui:'Picado tranqui',fuerte:'Partido fuerte'}[item.level]}</span>{item.notes&&<p className="urgent-notes">{item.notes}</p>}</div><div className="urgent-notice-actions"><a className="urgent-contact-btn" href={waLink(item.contact_phone,message)} target="_blank" rel="noopener noreferrer">Postularme por WhatsApp ↗</a>{own&&<button className="urgent-close-link" onClick={onClose}>Cerrar aviso</button>}</div></article>;
}

export default Fichajes;
