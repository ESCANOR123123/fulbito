import { useEffect, useMemo, useState } from 'react';
import './admin.css';

const HOURS = Array.from({ length: 14 }, (_, index) => `${String(index + 9).padStart(2, '0')}:00`);
const money = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value) || 0);
const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateLabel = value => new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

export default function AdminPanel({ client, user, profile, onSignOut }) {
  const [tab, setTab] = useState('overview');
  const [fields, setFields] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [period, setPeriod] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [fieldForm, setFieldForm] = useState(null);
  const [blockForm, setBlockForm] = useState({ fieldId: '', date: '', time: '09:00', reason: '' });
  const [moderation, setModeration] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    setBusy(true); setNotice('');
    const [fieldResult, blockResult, bookingResult] = await Promise.all([
      client.from('fields').select('*').order('id'),
      client.from('blocked_slots').select('id,field_id,blocked_date,start_time,reason').order('blocked_date'),
      client.from('bookings').select('*').order('booking_date').order('start_time'),
    ]);
    const failure = fieldResult.error || blockResult.error || bookingResult.error;
    if (failure) setNotice(`No se pudo cargar el panel: ${failure.message}`);
    else {
      setFields(fieldResult.data || []);
      setBlocks((blockResult.data || []).map(block => ({ ...block, field: (fieldResult.data || []).find(item => item.id === block.field_id) })));
      setBookings(bookingResult.data || []);
    }
    setBusy(false);
  };

  useEffect(() => { load(); }, [client]);

  const filteredBookings = useMemo(() => {
    const today = dayKey();
    const end = new Date(); end.setDate(end.getDate() + 7);
    const through = dayKey(end);
    return bookings.filter(booking => {
      const date = booking.booking_date;
      const inPeriod = period === 'all' || (period === 'today' && date === today) || (period === 'upcoming' && date >= today && date <= through);
      return inPeriod && (fieldFilter === 'all' || String(booking.field_id) === fieldFilter);
    });
  }, [bookings, period, fieldFilter]);

  const todayBookings = bookings.filter(item => item.booking_date === dayKey()).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const saveField = async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = fieldForm.id ?? Math.max(0, ...fields.map(field => Number(field.id))) + 1;
    const { error } = await client.from('fields').upsert({ id, name: String(data.get('name')).trim(), complex: String(data.get('complex')).trim(), surface_type: data.get('surface_type'), capacity: data.get('capacity'), price: Number(data.get('price')), active: data.get('active') === 'true', updated_at: new Date().toISOString() });
    if (error) return setNotice(`No se pudo guardar la cancha: ${error.message}`);
    setFieldForm(null); await load();
  };
  const removeField = async id => {
    if (!window.confirm('¿Eliminar esta cancha? Las reservas existentes se conservarán.')) return;
    const { error } = await client.from('fields').delete().eq('id', id);
    if (error) return setNotice(`No se pudo eliminar la cancha: ${error.message}`);
    await load();
  };
  const addBlock = async event => {
    event.preventDefault();
    const { error } = await client.from('blocked_slots').insert({ field_id: Number(blockForm.fieldId), blocked_date: blockForm.date, start_time: blockForm.time, reason: blockForm.reason.trim() });
    if (error) return setNotice(error.code === '23505' ? 'Ese horario ya está bloqueado.' : `No se pudo crear el bloqueo: ${error.message}`);
    setBlockForm(current => ({ ...current, date: '', reason: '' })); await load();
  };
  const removeBlock = async id => {
    if (!window.confirm('¿Quitar este bloqueo y volver a habilitar el horario?')) return;
    const { error } = await client.from('blocked_slots').delete().eq('id', id);
    if (error) return setNotice(`No se pudo quitar el bloqueo: ${error.message}`);
    await load();
  };
  const cancelBooking = async id => {
    if (!window.confirm('¿Cancelar esta reserva? El horario quedará disponible.')) return;
    const { error } = await client.from('bookings').delete().eq('id', id);
    if (error) return setNotice(`No se pudo cancelar la reserva: ${error.message}`);
    await load();
  };
  const exportCsv = () => {
    if (!bookings.length) return setNotice('No hay reservas para exportar.');
    const headers = ['ID', 'Cancha', 'Sede', 'Fecha', 'Hora', 'Cliente', 'Teléfono', 'Precio', 'Creada'];
    const rows = bookings.map(item => [item.id, item.field_name, item.complex, item.booking_date, String(item.start_time).slice(0, 5), item.player_name, item.phone, item.price, item.created_at].map(csvCell).join(','));
    const url = URL.createObjectURL(new Blob(['\uFEFF', [headers.map(csvCell).join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `reservas-${dayKey()}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const loadModeration = async () => {
    setBusy(true); setNotice('');
    const results = await Promise.all([
      client.from('player_profiles').select('id,public_name,phone,primary_position,status,moderation_status,created_at').order('created_at', { ascending: false }),
      client.from('player_profile_reports').select('id,player_profile_id,reason,details,status,created_at,player:player_profiles(public_name,primary_position)').order('created_at', { ascending: false }),
      client.from('urgent_notices').select('id,match_date,match_time,field_name,complex,status,expires_at').order('match_date'),
    ]);
    const error = results.find(result => result.error)?.error;
    if (error) setNotice(`No se pudo cargar la moderación. Verificá la migración 003 y los permisos: ${error.message}`);
    else setModeration({ profiles: results[0].data || [], reports: results[1].data || [], notices: results[2].data || [] });
    setBusy(false);
  };
  const changeTab = next => { setTab(next); if (next === 'fichajes' && !moderation) loadModeration(); };
  const updateRow = async (table, id, patch) => {
    const { error } = await client.from(table).update(patch).eq('id', id);
    if (error) return setNotice(`No se pudo guardar el cambio: ${error.message}`);
    setModeration(null); await loadModeration();
  };

  return <main className="admin-app">
    <header className="admin-topbar"><a className="react-brand" href="/"><span className="react-brand-mark" aria-hidden="true">⚽</span><span><strong>LA BOMBONERITA</strong><small>ADMINISTRACIÓN</small></span></a><div><span>{profile?.full_name || user.email}</span><button className="admin-button admin-button-quiet" onClick={onSignOut}>Cerrar sesión</button></div></header>
    <div className="admin-shell">
      <aside className="admin-rail"><p>OPERACIÓN</p>{[['overview','Resumen'],['bookings','Reservas'],['fields','Canchas'],['blocks','Bloqueos'],['fichajes','Fichajes']].map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => changeTab(key)}>{label}</button>)}<small>Zona Sur · Salta</small></aside>
      <section className="admin-content">
        <div className="admin-page-heading"><div><span>LA BOMBONERITA · GESTIÓN</span><h1>{tab === 'overview' ? 'Resumen del complejo' : tab === 'bookings' ? 'Reservas' : tab === 'fields' ? 'Canchas' : tab === 'blocks' ? 'Bloqueos horarios' : 'Moderación de Fichajes'}</h1></div><button className="admin-button" onClick={load} disabled={busy}>{busy ? 'Actualizando…' : 'Actualizar'}</button></div>
        {notice && <p className="admin-notice" role="alert">{notice}</p>}
        {tab === 'overview' && <><div className="admin-metric-grid"><article><span>Turnos hoy</span><strong>{todayBookings.length}</strong><small>{bookings.filter(item => item.booking_date >= dayKey() && item.booking_date <= dayKey(new Date(Date.now() + 7 * 86400000))).length} en los próximos 7 días</small></article><article><span>Ingresos previstos hoy</span><strong>{money(todayBookings.reduce((sum, item) => sum + Number(item.price || 0), 0))}</strong><small>Según reservas confirmadas</small></article><article><span>Canchas activas</span><strong>{fields.filter(item => item.active).length} / {fields.length}</strong><small>Disponibles para reservar</small></article><article><span>Bloqueos activos</span><strong>{blocks.filter(item => item.blocked_date >= dayKey()).length}</strong><small>Franjas fuera de servicio</small></article></div><section className="admin-panel"><div className="admin-panel-heading"><div><span>OPERACIÓN DIARIA</span><h2>Agenda de hoy</h2></div><button className="admin-link-button" onClick={() => changeTab('bookings')}>Ver reservas →</button></div><BookingTable rows={todayBookings} onCancel={cancelBooking} compact/></section></>}
        {tab === 'bookings' && <section className="admin-panel"><div className="admin-toolbar"><div><h2>Registro completo</h2><p>{filteredBookings.length} reservas · {money(filteredBookings.reduce((sum,item) => sum + Number(item.price || 0), 0))} estimados</p></div><button className="admin-button" onClick={exportCsv}>Exportar CSV</button></div><div className="admin-filters"><label>Período<select value={period} onChange={event => setPeriod(event.target.value)}><option value="all">Todas las fechas</option><option value="today">Hoy</option><option value="upcoming">Próximos 7 días</option></select></label><label>Cancha<select value={fieldFilter} onChange={event => setFieldFilter(event.target.value)}><option value="all">Todas</option>{fields.map(field => <option key={field.id} value={field.id}>{field.name} · {field.complex}</option>)}</select></label></div><BookingTable rows={filteredBookings} onCancel={cancelBooking}/></section>}
        {tab === 'fields' && <section className="admin-panel"><div className="admin-toolbar"><div><h2>Listado y configuración</h2><p>Gestioná disponibilidad, superficie y precio.</p></div><button className="admin-button" onClick={() => setFieldForm({})}>+ Nueva cancha</button></div>{fieldForm && <form className="admin-form" onSubmit={saveField}><h3>{fieldForm.id ? 'Editar cancha' : 'Agregar cancha'}</h3><label>Nombre<input name="name" defaultValue={fieldForm.name || ''} required/></label><label>Sede<input name="complex" defaultValue={fieldForm.complex || ''} required/></label><label>Superficie<select name="surface_type" defaultValue={fieldForm.surface_type || 'Césped Sintético'}><option>Césped Sintético</option><option>Césped Natural</option><option>Parquet / Techada</option></select></label><label>Capacidad<select name="capacity" defaultValue={fieldForm.capacity || '5 vs 5'}><option>5 vs 5</option><option>7 vs 7</option><option>8 vs 8</option><option>11 vs 11</option></select></label><label>Precio por hora<input name="price" type="number" min="0" step="500" defaultValue={fieldForm.price || 5000} required/></label><label>Estado<select name="active" defaultValue={String(fieldForm.active !== false)}><option value="true">Activa</option><option value="false">Pausada</option></select></label><div className="admin-form-actions"><button className="admin-button">Guardar</button><button type="button" className="admin-button admin-button-quiet" onClick={() => setFieldForm(null)}>Cancelar</button></div></form>}<div className="admin-field-grid">{fields.map(field => <article key={field.id} className="admin-field-card"><div><span className={field.active ? 'admin-pill' : 'admin-pill muted'}>{field.active ? 'Activa' : 'Pausada'}</span><h3>{field.name}</h3><p>{field.complex} · {field.surface_type} · {field.capacity}</p><strong>{money(field.price)} / hora</strong></div><div className="admin-card-actions"><button className="admin-button admin-button-quiet" onClick={() => setFieldForm(field)}>Editar</button><button className="admin-button admin-button-danger" onClick={() => removeField(field.id)}>Eliminar</button></div></article>)}</div></section>}
        {tab === 'blocks' && <section className="admin-panel"><div className="admin-toolbar"><div><h2>Bloquear horarios</h2><p>Mantenimiento, eventos o pausas operativas.</p></div></div><form className="admin-form admin-block-form" onSubmit={addBlock}><label>Cancha<select required value={blockForm.fieldId} onChange={event => setBlockForm({...blockForm,fieldId:event.target.value})}><option value="">Elegí una cancha</option>{fields.map(field => <option key={field.id} value={field.id}>{field.name} · {field.complex}</option>)}</select></label><label>Fecha<input type="date" min={dayKey()} required value={blockForm.date} onChange={event => setBlockForm({...blockForm,date:event.target.value})}/></label><label>Horario<select value={blockForm.time} onChange={event => setBlockForm({...blockForm,time:event.target.value})}>{HOURS.map(hour => <option key={hour}>{hour}</option>)}</select></label><label>Motivo<input required value={blockForm.reason} onChange={event => setBlockForm({...blockForm,reason:event.target.value})} placeholder="Mantenimiento, lluvia…"/></label><button className="admin-button admin-button-danger">Bloquear horario</button></form><div className="admin-record-list">{blocks.map(block => <article key={block.id}><div><strong>{block.field?.name || `Cancha ${block.field_id}`} · {block.field?.complex}</strong><span>{dateLabel(block.blocked_date)} · {String(block.start_time).slice(0,5)} · {block.reason}</span></div><button className="admin-button admin-button-quiet" onClick={() => removeBlock(block.id)}>Desbloquear</button></article>)}</div></section>}
        {tab === 'fichajes' && <section className="admin-moderation">{!moderation ? <p>{busy ? 'Cargando moderación…' : 'La moderación todavía no está disponible.'}</p> : <><ModerationProfiles profiles={moderation.profiles} onUpdate={(id,status) => updateRow('player_profiles',id,{moderation_status:status,moderation_note:status === 'approved' ? null : status === 'suspended' ? 'Revisión de administración' : 'Baja administrativa',reviewed_by:user.id,reviewed_at:new Date().toISOString()})}/><section className="admin-panel"><h2>Denuncias pendientes</h2>{moderation.reports.filter(item => item.status === 'open').map(report => <article className="admin-report" key={report.id}><div><strong>{report.player?.public_name || 'Perfil eliminado'}</strong><span>{report.reason.replaceAll('_',' ')} · {report.player?.primary_position}</span>{report.details && <p>{report.details}</p>}</div><div className="admin-card-actions"><button className="admin-button admin-button-quiet" onClick={() => updateRow('player_profile_reports',report.id,{status:'dismissed'})}>Descartar</button><button className="admin-button" onClick={() => updateRow('player_profile_reports',report.id,{status:'resolved'})}>Resolver</button></div></article>)}{!moderation.reports.some(item => item.status === 'open') && <p>No hay denuncias pendientes.</p>}</section><section className="admin-panel"><h2>Avisos urgentes</h2><RecordTable headers={['Fecha y hora','Cancha','Estado','Acción']} rows={moderation.notices.map(item => [<>{dateLabel(item.match_date)} · {String(item.match_time).slice(0,5)}</>,<>{item.field_name}<small>{item.complex}</small></>,item.status === 'open' && new Date(item.expires_at) > new Date() ? 'Abierto' : item.status === 'open' ? 'Vencido' : item.status === 'filled' ? 'Completado' : 'Cerrado',item.status === 'open' ? <button className="admin-button admin-button-quiet" onClick={() => updateRow('urgent_notices',item.id,{status:'closed'})}>Cerrar aviso</button> : '—'])}/></section></>}</section>}
      </section>
    </div>
  </main>;
}

function BookingTable({ rows, onCancel, compact = false }) {
  return <RecordTable headers={compact ? ['Hora','Cancha','Cliente','Importe'] : ['Fecha y hora','Cancha','Cliente','Teléfono','Precio','Acción']} rows={rows.map(item => compact ? [String(item.start_time).slice(0,5),<>{item.field_name}<small>{item.complex}</small></>,item.player_name,money(item.price)] : [<>{dateLabel(item.booking_date)} · {String(item.start_time).slice(0,5)}</>,<>{item.field_name}<small>{item.complex}</small></>,item.player_name,item.phone,money(item.price),<button className="admin-button admin-button-danger" onClick={() => onCancel(item.id)}>Cancelar</button>])}/>;
}

function RecordTable({ headers, rows }) {
  return rows.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row,index) => <tr key={index}>{row.map((cell,i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div> : <p className="admin-empty">No hay registros para mostrar.</p>;
}

function ModerationProfiles({ profiles, onUpdate }) {
  const label = { pending: 'En revisión', approved: 'Publicado', suspended: 'Suspendido', removed: 'Dado de baja' };
  return <section className="admin-panel"><h2>Perfiles de jugadores <small>({profiles.length})</small></h2><RecordTable headers={['Jugador','Moderación','Estado','Acciones']} rows={profiles.map(profile => [<>{profile.public_name}<small>{profile.primary_position} · {profile.phone}</small></>,label[profile.moderation_status] || profile.moderation_status,profile.status,<div className="admin-card-actions">{profile.moderation_status !== 'approved' && <button className="admin-button" onClick={() => onUpdate(profile.id,'approved')}>{profile.moderation_status === 'removed' ? 'Restaurar' : 'Aprobar'}</button>}{profile.moderation_status !== 'suspended' && <button className="admin-button admin-button-quiet" onClick={() => onUpdate(profile.id,'suspended')}>Suspender</button>}{profile.moderation_status !== 'removed' && <button className="admin-button admin-button-danger" onClick={() => onUpdate(profile.id,'removed')}>Dar de baja</button>}</div>])}/></section>;
}
