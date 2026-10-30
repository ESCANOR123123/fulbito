// ==========================================
// TURNOS CANCHAS - SISTEMA DE RESERVAS & ADMIN
// ==========================================

// Constantes y Almacenamiento
const STORAGE_FIELDS_KEY = 'turnos_canchas_fields';
const STORAGE_BLOCKS_KEY = 'turnos_canchas_blocked';

const DB_NAME = 'TurnosCanchasDB';
const DB_VERSION = 2; // Actualizado para soportar fields y blocked_slots
const STORE_BOOKINGS = 'bookings';
const STORE_FIELDS = 'fields';
const STORE_BLOCKS = 'blocked_slots';

const DEFAULT_FIELDS = [
    { id: 1, name: 'Cancha 1', complex: 'Sede Central', type: 'Césped Sintético', capacity: '5 vs 5', price: 5000, active: true },
    { id: 2, name: 'Cancha 2', complex: 'Sede Central', type: 'Césped Natural', capacity: '7 vs 7', price: 7000, active: true },
    { id: 3, name: 'Cancha 3', complex: 'Sede Norte', type: 'Césped Sintético', capacity: '5 vs 5', price: 5000, active: true },
    { id: 4, name: 'Cancha 4', complex: 'Sede Norte', type: 'Césped Sintético', capacity: '8 vs 8', price: 8000, active: true }
];

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00'
];

// Estado Global de la Aplicación
let fields = [...DEFAULT_FIELDS];
let bookings = [];
let blockedSlots = [];
let selectedFieldId = null;
let db = null;
let isSubmitting = false;
let currentUser = null;
let currentUserRole = 'customer';
let currentProfile = null;
let supabaseClient = null;
let bookedSlots = [];
let authMode = 'signin';
let activeAdminTab = 'overview';
let playerProfiles = [];
let ownPlayerProfile = null;
let urgentNotices = [];
let ownUrgentNotices = [];
let activePlayerPositionFilter = 'all';
let fichajesLoadError = '';

const PLAYER_POSITIONS = {
    arquero: 'Arquero',
    defensor: 'Defensor',
    mediocampista: 'Mediocampista',
    delantero: 'Delantero'
};
const PLAYER_DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

// --- Capa de Persistencia con IndexedDB y Fallback ---

function initDB() {
    return new Promise((resolve) => {
        if (!window.indexedDB) {
            console.warn('IndexedDB no soportado en este navegador. Usando localStorage.');
            return resolve(null);
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_BOOKINGS)) {
                database.createObjectStore(STORE_BOOKINGS, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(STORE_FIELDS)) {
                database.createObjectStore(STORE_FIELDS, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(STORE_BLOCKS)) {
                database.createObjectStore(STORE_BLOCKS, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.warn('Error al abrir IndexedDB:', event.target.error, 'Usando localStorage.');
            resolve(null);
        };
    });
}

// Persistencia de Canchas
async function loadFields() {
    if (supabaseClient) {
        const { data, error } = await supabaseClient.from('fields')
            .select('id, name, complex, surface_type, capacity, price, active')
            .order('id', { ascending: true });
        if (error) throw error;
        fields = (data || []).map(field => ({
            id: Number(field.id),
            name: field.name,
            complex: field.complex,
            type: field.surface_type,
            capacity: field.capacity,
            price: Number(field.price),
            active: field.active
        }));
        return;
    }

    // 1. Intentar desde IndexedDB
    if (db) {
        try {
            const stored = await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_FIELDS, 'readonly');
                const store = tx.objectStore(STORE_FIELDS);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            });
            if (stored.length > 0) {
                fields = stored;
                return;
            }
        } catch (e) {
            console.warn('Error al leer canchas de IndexedDB:', e);
        }
    }

    // 2. Intentar desde localStorage
    const local = localStorage.getItem(STORAGE_FIELDS_KEY);
    if (local) {
        try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
                fields = parsed;
                return;
            }
        } catch (e) {}
    }

    // 3. Intentar fetch a fields.json
    try {
        const response = await fetch('fields.json');
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                fields = data.map(f => ({ ...f, active: f.active !== undefined ? f.active : true }));
                return;
            }
        }
    } catch (e) {}

    // 4. Default fallback
    fields = [...DEFAULT_FIELDS];
}

async function saveFieldToDB(field) {
    if (!supabaseClient || !currentUser || currentUserRole !== 'admin') throw new Error('Solo el administrador puede guardar canchas.');
    const { error } = await supabaseClient.from('fields').upsert({
        id: field.id,
        name: field.name,
        complex: field.complex,
        surface_type: field.type,
        capacity: field.capacity,
        price: field.price,
        active: field.active,
        updated_at: new Date().toISOString()
    });
    if (error) throw error;
}

async function deleteFieldFromDB(id) {
    if (!supabaseClient || !currentUser || currentUserRole !== 'admin') throw new Error('Solo el administrador puede eliminar canchas.');
    const { error } = await supabaseClient.from('fields').delete().eq('id', id);
    if (error) throw error;
}

// Reservas compartidas: Supabase aplica la propiedad por usuario mediante RLS.
function mapBooking(row) {
    return {
        id: row.id,
        fieldId: Number(row.field_id),
        fieldName: row.field_name,
        complex: row.complex,
        price: Number(row.price),
        date: row.booking_date,
        time: String(row.start_time).slice(0, 5),
        playerName: row.player_name,
        phone: row.phone,
        createdAt: row.created_at
    };
}

async function loadBookings() {
    if (!supabaseClient || !currentUser) {
        bookings = [];
        return;
    }

    const { data, error } = await supabaseClient
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });
    if (error) throw error;
    bookings = (data || []).map(mapBooking);
}

async function loadBookedSlots() {
    if (!supabaseClient || !currentUser) {
        bookedSlots = [];
        return;
    }

    const { data, error } = await supabaseClient
        .from('booking_slots')
        .select('field_id, booking_date, start_time');
    if (error) throw error;
    bookedSlots = (data || []).map(slot => ({
        fieldId: Number(slot.field_id),
        date: slot.booking_date,
        time: String(slot.start_time).slice(0, 5)
    }));
}

async function saveBookingToDB(booking) {
    const { data, error } = await supabaseClient
        .from('bookings')
        .insert({
            field_id: booking.fieldId,
            field_name: booking.fieldName,
            complex: booking.complex,
            price: booking.price,
            booking_date: booking.date,
            start_time: booking.time,
            player_name: booking.playerName,
            phone: booking.phone
        })
        .select('*')
        .single();
    if (error) throw error;
    return mapBooking(data);
}

async function deleteBookingFromDB(id) {
    const { error } = await supabaseClient.from('bookings').delete().eq('id', id);
    if (error) throw error;
}

// Persistencia de Horarios Bloqueados (Etapa 3)
async function loadBlockedSlots() {
    if (supabaseClient) {
        if (!currentUser) {
            blockedSlots = [];
            return;
        }
        const { data, error } = await supabaseClient.from('blocked_slots')
            .select('id, field_id, blocked_date, start_time, reason')
            .order('blocked_date', { ascending: true });
        if (error) throw error;
        blockedSlots = (data || []).map(block => {
            const field = fields.find(item => item.id === Number(block.field_id));
            return {
                id: block.id,
                fieldId: Number(block.field_id),
                fieldName: field?.name || `Cancha ${block.field_id}`,
                complex: field?.complex || '',
                date: block.blocked_date,
                time: String(block.start_time).slice(0, 5),
                reason: block.reason
            };
        });
        return;
    }

    if (db) {
        try {
            blockedSlots = await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_BLOCKS, 'readonly');
                const store = tx.objectStore(STORE_BLOCKS);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            });
            return;
        } catch (e) {
            console.warn('Error leyendo bloques de IndexedDB:', e);
        }
    }

    const local = localStorage.getItem(STORAGE_BLOCKS_KEY);
    blockedSlots = local ? JSON.parse(local) : [];
}

async function saveBlockedSlotToDB(block) {
    if (!supabaseClient || !currentUser || currentUserRole !== 'admin') throw new Error('Solo el administrador puede bloquear horarios.');
    const { data, error } = await supabaseClient.from('blocked_slots').insert({
        field_id: block.fieldId,
        blocked_date: block.date,
        start_time: block.time,
        reason: block.reason
    }).select('id').single();
    if (error) throw error;
    return { ...block, id: data.id };
}

async function deleteBlockedSlotFromDB(id) {
    if (!supabaseClient || !currentUser || currentUserRole !== 'admin') throw new Error('Solo el administrador puede quitar bloqueos.');
    const { error } = await supabaseClient.from('blocked_slots').delete().eq('id', id);
    if (error) throw error;
}

// --- Inicialización y autenticación ---
async function init() {
    if (document.body.dataset.page === 'fichajes') {
        await initFichajesPage();
        return;
    }

    await initDB();

    const config = window.SUPABASE_CONFIG;
    if (window.supabase && config?.url && config?.publishableKey) {
        supabaseClient = window.supabase.createClient(config.url, config.publishableKey);
    }

    setupEventListeners();
    setupAdminEventListeners();
    setMinDate();

    try {
        await loadFields();
    } catch (error) {
        console.error('No se pudieron cargar las canchas compartidas:', error);
        fields = [...DEFAULT_FIELDS];
        showToast('No se pudieron leer las canchas compartidas. Aplicá la migración de configuración en Supabase.', 'error');
    }
    if (!supabaseClient) await loadBlockedSlots();

    renderFields();
    renderBookings();

    if (!supabaseClient) {
        document.getElementById('supabase-config-notice').hidden = false;
        if (window.location.hash === '#admin' || window.location.hash === '#login') switchView('auth');
        return;
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        setTimeout(() => {
            if (event === 'PASSWORD_RECOVERY') {
                authMode = 'reset';
                switchView('auth');
            } else {
                syncAuthSession(session);
            }
        }, 0);
    });

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
        showToast('No se pudo restaurar la sesión. Iniciá sesión nuevamente.', 'error');
        switchView('auth');
        return;
    }
    await syncAuthSession(data.session);
}

async function syncAuthSession(session) {
    currentUser = session?.user || null;
    currentProfile = null;
    currentUserRole = 'customer';

    if (!currentUser) {
        bookings = [];
        bookedSlots = [];
        blockedSlots = [];
        updateAccountNavigation();
        renderBookings();
        if (window.location.hash === '#admin' || window.location.hash === '#login') switchView('auth');
        else switchView('client');
        return;
    }

    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('id, full_name, phone, role')
            .eq('id', currentUser.id)
            .maybeSingle();
        if (error) throw error;
        currentProfile = profile;
        currentUserRole = profile?.role === 'admin' ? 'admin' : 'customer';
        try {
            await loadFields();
        } catch (error) {
            fields = [...DEFAULT_FIELDS];
            showToast('Falta aplicar la migración de canchas compartidas. Se muestran los datos base.', 'error');
        }
        await Promise.all([loadBookings(), loadBookedSlots()]);
        try {
            await loadBlockedSlots();
        } catch (error) {
            blockedSlots = [];
            showToast('Falta aplicar la migración de bloqueos compartidos.', 'error');
        }
        updateAccountNavigation();
        renderBookings();

        if (sessionStorage.getItem('turnos:return-after-auth') === 'fichajes') {
            sessionStorage.removeItem('turnos:return-after-auth');
            window.location.href = 'fichajes.html';
            return;
        }

        if (currentUserRole === 'admin') {
            window.location.replace('/#admin');
            return;
        } else {
            switchView('client');
            if (selectedFieldId) selectField(selectedFieldId);
        }
    } catch (error) {
        console.error('No se pudo cargar la cuenta:', error);
        showToast('No se pudo cargar tu cuenta o la configuración compartida. Revisá que las migraciones de Supabase estén aplicadas.', 'error');
        bookings = [];
        bookedSlots = [];
        blockedSlots = [];
        switchView('client');
    }
}

async function initFichajesPage() {
    const config = window.SUPABASE_CONFIG;
    if (window.supabase && config?.url && config?.publishableKey) {
        supabaseClient = window.supabase.createClient(config.url, config.publishableKey);
    }
    setupFichajesEventListeners();
    if (!supabaseClient) {
        fichajesLoadError = 'La conexión con Supabase todavía no está configurada.';
        renderFichajes();
        return;
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') return;
        setTimeout(() => hydrateFichajesPageSession(session), 0);
    });
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
        fichajesLoadError = 'No se pudo recuperar la sesión. Volvé a iniciar sesión.';
        renderFichajes();
        return;
    }
    await hydrateFichajesPageSession(data.session);
}

async function hydrateFichajesPageSession(session) {
    currentUser = session?.user || null;
    currentProfile = null;
    currentUserRole = 'customer';
    bookings = [];
    if (currentUser) {
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles').select('id, full_name, phone, role').eq('id', currentUser.id).maybeSingle();
        if (profileError) console.error('No se pudo cargar el perfil de cuenta:', profileError);
        currentProfile = profile || null;
        currentUserRole = profile?.role === 'admin' ? 'admin' : 'customer';
        try {
            await loadBookings();
        } catch (error) {
            console.error('No se pudieron cargar las reservas para los avisos:', error);
        }
    }
    updateAccountNavigation();
    await loadFichajesData();
    renderFichajes();
}

function updateAccountNavigation() {
    const loginButton = document.getElementById('nav-login-btn');
    const bookingsLink = document.getElementById('nav-my-bookings');
    const adminLink = document.getElementById('nav-admin-link');
    const fichajesLink = document.getElementById('nav-fichajes');
    const signedIn = Boolean(currentUser);

    if (loginButton) loginButton.textContent = signedIn ? 'Cerrar sesión' : 'Iniciar sesión';
    if (bookingsLink) bookingsLink.hidden = !signedIn || currentUserRole === 'admin';
    if (adminLink) adminLink.hidden = !signedIn || currentUserRole !== 'admin';
    if (fichajesLink) fichajesLink.hidden = false;
}

function initializeAuthMode() {
    const signInForm = document.getElementById('sign-in-form');
    const signUpForm = document.getElementById('sign-up-form');
    const resetForm = document.getElementById('reset-password-form');
    const title = document.getElementById('auth-title');
    const description = document.getElementById('auth-description');
    const toggle = document.getElementById('auth-mode-toggle');
    const signingUp = authMode === 'signup';

    const resetting = authMode === 'reset';
    signInForm.hidden = signingUp || resetting;
    signUpForm.hidden = !signingUp;
    resetForm.hidden = !resetting;
    title.textContent = resetting ? 'Elegí una contraseña nueva' : signingUp ? 'Creá tu cuenta' : 'Iniciá sesión';
    description.textContent = resetting
        ? 'Guardá una contraseña nueva para volver a entrar.'
        : signingUp
            ? 'Registrate para reservar turnos y consultarlos desde tu cuenta.'
            : 'Accedé a tus reservas y gestioná tus turnos.';
    toggle.hidden = resetting;
}

async function handleSignIn(event) {
    event.preventDefault();
    if (!supabaseClient) return showToast('Primero hay que conectar el proyecto de Supabase.', 'error');
    const form = new FormData(event.currentTarget);
    const { error } = await supabaseClient.auth.signInWithPassword({
        email: String(form.get('email')).trim(),
        password: String(form.get('password'))
    });
    if (error) return showToast('No se pudo iniciar sesión. Revisá el correo, la contraseña y la verificación del email.', 'error');
    showToast('Sesión iniciada.', 'success');
}

async function handleSignUp(event) {
    event.preventDefault();
    if (!supabaseClient) return showToast('Primero hay que conectar el proyecto de Supabase.', 'error');
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('fullName')).trim();
    const phone = String(form.get('phone')).trim();
    if (!validateArgentinePhone(phone)) return showToast('Ingresá un teléfono argentino válido.', 'error');

    const { data, error } = await supabaseClient.auth.signUp({
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
        options: {
            emailRedirectTo: window.location.href.split('#')[0],
            data: { full_name: fullName, phone }
        }
    });
    if (error) return showToast(error.message, 'error');
    if (!data.session) {
        showToast('Te enviamos un correo para verificar la cuenta. Confirmalo y después iniciá sesión.', 'info');
        authMode = 'signin';
        initializeAuthMode();
    } else {
        showToast('Cuenta creada. Ya podés reservar.', 'success');
    }
}

async function handlePasswordReset() {
    if (!supabaseClient) return showToast('Primero hay que conectar el proyecto de Supabase.', 'error');
    const email = document.getElementById('signin-email').value.trim();
    if (!email) return showToast('Escribí tu correo para enviarte el enlace de recuperación.', 'info');
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.href.split('#')[0] });
    if (error) return showToast('No se pudo enviar el correo de recuperación.', 'error');
    showToast('Si el correo está registrado, recibirás un enlace para recuperar la contraseña.', 'success');
}

async function handlePasswordUpdate(event) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    const { error } = await supabaseClient.auth.updateUser({ password: String(password) });
    if (error) return showToast('No se pudo actualizar la contraseña. Volvé a solicitar el enlace.', 'error');
    authMode = 'signin';
    showToast('Contraseña actualizada. Ya podés iniciar sesión.', 'success');
    await supabaseClient.auth.signOut();
}

function setMinDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.min = today;
    
    const blockDateInput = document.getElementById('block-date-input');
    if (blockDateInput) blockDateInput.min = today;
}

// --- Vista Cliente ---

function renderFields() {
    const container = document.getElementById('fields-container');
    if (!container) return;

    // Solo mostrar canchas activas en la vista de cliente
    const activeFields = fields.filter(f => f.active !== false);

    if (activeFields.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay canchas disponibles para reservar en este momento.</div>';
        return;
    }

    container.innerHTML = activeFields.map(field => {
        const isSelected = field.id === selectedFieldId;
        return `
            <article class="field-card ${isSelected ? 'selected' : ''}" data-field-id="${field.id}" role="button" tabindex="0" aria-pressed="${isSelected}">
                <div class="field-header">
                    <h3>${field.name}</h3>
                    <span class="field-complex">${field.complex || 'Sede'}</span>
                </div>
                <div class="field-info">
                    <span>${field.type}</span>
                    <span>${field.capacity}</span>
                    <span class="field-price">$${new Intl.NumberFormat('es-AR').format(field.price)} <small>/ hora</small></span>
                </div>
                <span class="field-select-prompt">Elegir esta cancha <span aria-hidden="true">→</span></span>
            </article>
        `;
    }).join('');

    container.querySelectorAll('.field-card').forEach(card => {
        card.addEventListener('click', () => selectField(Number(card.dataset.fieldId)));
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectField(Number(card.dataset.fieldId));
            }
        });
    });
}

function selectField(fieldId) {
    selectedFieldId = fieldId;
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    if (!currentUser) {
        showToast('Iniciá sesión para reservar y guardar el turno en tu cuenta.', 'info');
        switchView('auth');
        return;
    }

    document.getElementById('selected-field-name').textContent = `${field.name} (${field.complex || 'Sede'})`;
    document.getElementById('booking-section').style.display = 'block';
    if (currentProfile) {
        document.getElementById('player-name').value ||= currentProfile.full_name || '';
        document.getElementById('phone').value ||= currentProfile.phone || '';
    }
    renderFields();
    document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });

    const date = document.getElementById('date').value;
    if (date) updateTimeSlots();
}

function updateTimeSlots() {
    const date = document.getElementById('date').value;
    const timeSelect = document.getElementById('time');
    if (!timeSelect) return;
    
    if (!date) {
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Primero selecciona una fecha</option>';
        return;
    }

    // Horarios ya reservados
    const bookedTimes = bookedSlots
        .filter(slot => slot.fieldId === selectedFieldId && slot.date === date)
        .map(slot => slot.time);

    // Horarios bloqueados por administración (Etapa 3)
    const blockedForField = blockedSlots.filter(b => b.fieldId === selectedFieldId && b.date === date);
    const blockedTimes = blockedForField.map(b => b.time);

    const slotOptions = TIME_SLOTS.map(slot => {
        const isBooked = bookedTimes.includes(slot);
        const blockInfo = blockedForField.find(b => b.time === slot);
        const isBlocked = !!blockInfo;

        if (isBooked) {
            return `<option value="${slot}" disabled>${slot} (Ocupado)</option>`;
        }
        if (isBlocked) {
            return `<option value="${slot}" disabled>${slot} (Bloqueado: ${blockInfo.reason || 'Mantenimiento'})</option>`;
        }
        return `<option value="${slot}">${slot}</option>`;
    }).join('');

    timeSelect.innerHTML = '<option value="">Selecciona un horario</option>' + slotOptions;
    timeSelect.disabled = false;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function renderBookings() {
    const section = document.getElementById('bookings-section');
    const container = document.getElementById('bookings-container');
    if (!container || !section) return;

    const visible = Boolean(currentUser) && currentUserRole !== 'admin';
    section.hidden = !visible;
    if (!visible) {
        container.replaceChildren();
        return;
    }

    if (bookings.length === 0) {
        container.innerHTML = '<div class="empty-state">No tenés reservas todavía.</div>';
        return;
    }

    const sorted = [...bookings].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    container.innerHTML = sorted.map(booking => `
        <article class="booking-card">
            <div class="booking-info">
                <span class="booking-field">${escapeHtml(booking.fieldName)} <span class="booking-complex">• ${escapeHtml(booking.complex)}</span></span>
                <span class="booking-details">${escapeHtml(formatDate(booking.date))} a las ${escapeHtml(booking.time)}</span>
                <span class="booking-player">${escapeHtml(booking.playerName)} - ${escapeHtml(booking.phone)}</span>
            </div>
            <div class="booking-actions">
                <button class="btn btn-danger" type="button" data-cancel-booking="${escapeHtml(booking.id)}">Cancelar</button>
            </div>
        </article>
    `).join('');
    container.querySelectorAll('[data-cancel-booking]').forEach(button => {
        button.addEventListener('click', () => confirmCancelBooking(button.dataset.cancelBooking));
    });
}

// --- Validación de Teléfono Argentino ---

function validateArgentinePhone(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    const regex = /^(?:(?:\+|00)?54)?(?:9)?(?:0)?([1-9]\d{1,3})(?:15)?(\d{6,8})$/;
    return regex.test(cleaned);
}

// --- Manejadores de Formulario de Reserva ---

async function handleBookingSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!currentUser || !supabaseClient) {
        showToast('Iniciá sesión para confirmar una reserva.', 'error');
        switchView('auth');
        return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const date = formData.get('date');
    const time = formData.get('time');
    const playerName = formData.get('playerName').trim();
    const phone = formData.get('phone').trim();
    const phoneInput = document.getElementById('phone');

    if (!selectedFieldId) {
        showToast('Por favor selecciona una cancha disponible.', 'error');
        return;
    }

    if (!time) {
        showToast('Por favor selecciona un horario para tu turno.', 'error');
        return;
    }

    if (!validateArgentinePhone(phone)) {
        if (phoneInput) phoneInput.classList.add('is-invalid');
        showToast('El teléfono no es un número válido de Argentina (ej: +54 9 11 1234-5678).', 'error');
        return;
    }

    // Verificar si ya está reservado o bloqueado
    const isAlreadyBooked = bookedSlots.some(slot => slot.fieldId === selectedFieldId && slot.date === date && slot.time === time);
    const isBlocked = blockedSlots.some(b => b.fieldId === selectedFieldId && b.date === date && b.time === time);

    if (isAlreadyBooked || isBlocked) {
        showToast('Ese horario ya no está disponible. Por favor, elige otro.', 'error');
        updateTimeSlots();
        return;
    }

    isSubmitting = true;
    const submitBtn = document.getElementById('submit-btn');
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Confirmando...';

    const selectedField = fields.find(f => f.id === selectedFieldId);
    const booking = {
        fieldId: selectedFieldId,
        fieldName: selectedField.name,
        complex: selectedField.complex || 'Sede Central',
        price: selectedField.price || 5000,
        date: date,
        time: time,
        playerName: playerName,
        phone: phone,
        createdAt: new Date().toISOString()
    };

    try {
        const savedBooking = await saveBookingToDB(booking);
        bookings.push(savedBooking);
        await loadBookedSlots();
        renderBookings();
        cancelBookingForm();
        showToast('¡Reserva confirmada con éxito!', 'success');
    } catch (err) {
        console.error('Error al guardar reserva:', err);
        showToast(err.code === '23505' ? 'Ese horario se acaba de reservar. Elegí otro.' : err.code === '23P01' ? 'Ese horario está bloqueado. Elegí otro.' : 'Ocurrió un error al guardar la reserva.', 'error');
        await loadBookedSlots().catch(() => {});
        updateTimeSlots();
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
    }
}

function cancelBookingForm() {
    selectedFieldId = null;
    document.getElementById('booking-section').style.display = 'none';
    document.getElementById('booking-form').reset();
    const timeSelect = document.getElementById('time');
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Primero selecciona una fecha</option>';
    const phoneInput = document.getElementById('phone');
    if (phoneInput) phoneInput.classList.remove('is-invalid');
    renderFields();
}

// --- Navegación y acceso ---
function switchView(view) {
    const clientView = document.getElementById('client-view');
    const authView = document.getElementById('auth-view');
    const adminView = document.getElementById('admin-view');

    if (view === 'admin' && (!currentUser || currentUserRole !== 'admin')) {
        view = currentUser ? 'client' : 'auth';
    }
    document.body.classList.toggle('admin-mode', view === 'admin');
    if (clientView) clientView.style.display = view === 'client' ? 'block' : 'none';
    if (authView) authView.style.display = view === 'auth' ? 'block' : 'none';
    if (adminView) adminView.style.display = view === 'admin' ? 'block' : 'none';

    if (view !== 'client') window.scrollTo(0, 0);

    if (view === 'admin') {
        window.location.hash = '#admin';
        showAdminDashboard();
    } else if (view === 'auth') {
        window.location.hash = '#login';
        initializeAuthMode();
    } else {
        window.location.hash = '';
        renderFields();
        renderBookings();
    }
}

function showAdminDashboard() {
    document.getElementById('admin-dashboard').style.display = 'block';
    const greeting = document.getElementById('admin-greeting');
    const accountName = currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'administrador';
    if (greeting) greeting.textContent = `Hola, ${accountName}`;
    switchAdminTab(activeAdminTab);
}

function switchAdminTab(tabName) {
    activeAdminTab = tabName;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.admin-tab-content').forEach(section => {
        section.classList.remove('active');
    });

    const activeContent = document.getElementById(`tab-${tabName}-content`);
    if (activeContent) activeContent.classList.add('active');

    if (tabName === 'fields') renderAdminFields();
    if (tabName === 'blocks') renderAdminBlocks();
    if (tabName === 'bookings') renderAdminBookings();
    if (tabName === 'overview') renderAdminOverview();
    if (tabName === 'fichajes') renderAdminModeration();
}

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renderAdminOverview() {
    const metrics = document.getElementById('admin-metrics');
    const agenda = document.getElementById('admin-today-bookings');
    const dateLabel = document.getElementById('admin-current-date');
    if (!metrics || !agenda) return;

    const today = localDateKey();
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndKey = localDateKey(weekEnd);
    const todayBookings = bookings
        .filter(booking => booking.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));
    const upcomingBookings = bookings.filter(booking => booking.date >= today && booking.date <= weekEndKey);
    const expectedRevenue = todayBookings.reduce((total, booking) => total + (Number(booking.price) || 0), 0);
    const activeFields = fields.filter(field => field.active !== false).length;

    if (dateLabel) {
        dateLabel.textContent = new Intl.DateTimeFormat('es-AR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date());
    }

    const cards = [
        { label: 'Turnos de hoy', value: todayBookings.length, note: `${upcomingBookings.length} en los próximos 7 días`, icon: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 1.5"/>' },
        { label: 'Ingresos previstos hoy', value: `$${expectedRevenue.toLocaleString('es-AR')}`, note: 'Estimación según reservas confirmadas', icon: '<path d="M12.5 6.5c-.6-.7-1.5-1-2.6-1-1.4 0-2.4.7-2.4 1.8 0 2.8 5.2 1.2 5.2 4.3 0 1.2-1.1 2-2.7 2-1.1 0-2.1-.4-2.8-1.2M10 3.5v13"/>' },
        { label: 'Canchas activas', value: `${activeFields} / ${fields.length}`, note: 'Disponibles para recibir reservas', icon: '<rect x="3" y="3" width="14" height="14" rx="1.5"/><path d="M10 3v14M3 10h3a3 3 0 0 1 0 6H3m14-6h-3a3 3 0 0 0 0 6h3"/>' },
        { label: 'Bloqueos activos', value: blockedSlots.length, note: 'Franjas fuera de servicio', icon: '<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M6.5 2.5v3M13.5 2.5v3M3 8h14M7 11l6 4m0-4-6 4"/>' }
    ];
    metrics.innerHTML = cards.map(card => `
        <article class="admin-metric-card">
            <div class="admin-metric-top"><span>${card.label}</span><svg class="admin-metric-mark" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${card.icon}</svg></div>
            <strong>${card.value}</strong>
            <small>${card.note}</small>
        </article>
    `).join('');

    if (!todayBookings.length) {
        agenda.innerHTML = '<div class="admin-agenda-empty"><strong>La agenda está libre por ahora.</strong><span>Cuando entren reservas para hoy, aparecerán acá.</span></div>';
        return;
    }

    agenda.innerHTML = `
        <div class="admin-agenda-table-wrap">
            <table class="admin-table admin-agenda-table">
                <thead><tr><th>Hora</th><th>Cancha</th><th>Cliente</th><th>Importe previsto</th></tr></thead>
                <tbody>${todayBookings.slice(0, 6).map(booking => `
                    <tr>
                        <td><strong>${escapeHtml(booking.time)}</strong></td>
                        <td>${escapeHtml(booking.fieldName)}<small>${escapeHtml(booking.complex || '')}</small></td>
                        <td>${escapeHtml(booking.playerName)}</td>
                        <td>$${(Number(booking.price) || 0).toLocaleString('es-AR')}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
        ${todayBookings.length > 6 ? `<p class="admin-agenda-more">Y ${todayBookings.length - 6} turnos más en la agenda de hoy.</p>` : ''}
    `;
}

async function loadFichajesData() {
    playerProfiles = [];
    urgentNotices = [];
    ownPlayerProfile = null;
    ownUrgentNotices = [];
    fichajesLoadError = '';
    if (!supabaseClient) {
        fichajesLoadError = 'El mercado de jugadores usa Supabase para compartir perfiles entre dispositivos.';
        return;
    }

    try {
        const playerColumns = 'id, public_name, phone, primary_position, secondary_position, preferred_foot, level, available_days, time_slot, preferred_venue, bio, created_at' + (currentUser ? ', owner_user_id' : '');
        const noticeColumns = 'id, match_date, match_time, field_name, complex, needed_position, level, notes, contact_phone, expires_at, created_at' + (currentUser ? ', captain_user_id' : '');
        const playerRequest = supabaseClient.from('player_profiles')
            .select(playerColumns)
            .order('created_at', { ascending: false });
        const noticeRequest = supabaseClient.from('urgent_notices')
            .select(noticeColumns)
            .gt('expires_at', new Date().toISOString())
            .order('match_date', { ascending: true })
            .order('match_time', { ascending: true });
        const ownPlayerRequest = currentUser
            ? supabaseClient.from('player_profiles').select('*').eq('owner_user_id', currentUser.id).maybeSingle()
            : Promise.resolve({ data: null, error: null });
        const ownNoticeRequest = currentUser
            ? supabaseClient.from('urgent_notices').select('*').eq('captain_user_id', currentUser.id).order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null });

        const [players, notices, ownPlayer, ownNotices] = await Promise.all([
            playerRequest, noticeRequest, ownPlayerRequest, ownNoticeRequest
        ]);
        const failed = [players, notices, ownPlayer, ownNotices].find(result => result.error);
        if (failed) throw failed.error;
        playerProfiles = players.data || [];
        urgentNotices = notices.data || [];
        ownPlayerProfile = ownPlayer.data || null;
        ownUrgentNotices = ownNotices.data || [];
    } catch (error) {
        console.error('No se pudo cargar Fichajes:', error);
        fichajesLoadError = 'Fichajes todavía no está disponible. Aplicá la migración 003 de Supabase y volvé a cargar la página.';
    }
}

function renderFichajes() {
    renderOwnPlayerProfile();
    renderPlayerCards();
    renderUrgentNotices();
    const profileButton = document.getElementById('player-profile-open-btn');
    if (profileButton) profileButton.innerHTML = `${ownPlayerProfile ? 'Editar mi perfil' : 'Publicar mi perfil'} <span aria-hidden="true">${ownPlayerProfile ? '↗' : '+'}</span>`;
}

function renderOwnPlayerProfile() {
    const container = document.getElementById('player-own-profile');
    if (!container) return;
    if (!currentUser) {
        container.innerHTML = '<div class="player-own-note"><span>¿Querés recibir propuestas?</span><button type="button" class="fichaje-inline-link" data-fichaje-login>Iniciá sesión y publicá tu perfil <span aria-hidden="true">→</span></button></div>';
        container.querySelector('[data-fichaje-login]').addEventListener('click', requireFichajesSession);
        return;
    }
    if (!ownPlayerProfile) {
        container.innerHTML = '<p class="player-own-note">Tu perfil te ayuda a conectar con equipos de la zona.</p>';
        return;
    }

    const moderationLabels = { pending: 'En revisión', approved: 'Publicado', suspended: 'Suspendido', removed: 'Dado de baja' };
    const statusLabels = { active: 'Disponible', paused: 'En pausa', signed: 'Fichado' };
    const canManage = !['suspended', 'removed'].includes(ownPlayerProfile.moderation_status);
    container.innerHTML = `
        <div class="player-own-card">
            <div class="player-own-copy"><span class="player-own-kicker">TU PERFIL</span><strong>${escapeHtml(ownPlayerProfile.public_name)}</strong><span class="player-own-state">${escapeHtml(statusLabels[ownPlayerProfile.status] || 'Disponible')} · ${escapeHtml(moderationLabels[ownPlayerProfile.moderation_status] || 'En revisión')}</span></div>
            <div class="player-own-actions">
                ${canManage ? '<button type="button" class="btn btn-secondary btn-sm" data-player-manage="edit">Editar perfil</button>' : ''}
                ${canManage && ownPlayerProfile.status === 'active' ? '<button type="button" class="btn btn-outline btn-sm" data-player-manage="pause">Pausar</button>' : ''}
                ${canManage && ownPlayerProfile.status !== 'active' ? '<button type="button" class="btn btn-outline btn-sm" data-player-manage="activate">Volver a activar</button>' : ''}
                ${canManage && ownPlayerProfile.status === 'active' ? '<button type="button" class="btn btn-outline btn-sm" data-player-manage="signed">Marcar como fichado</button>' : ''}
                ${canManage ? '<button type="button" class="player-delete-link" data-player-manage="delete">Eliminar perfil</button>' : ''}
            </div>
        </div>`;
    container.querySelectorAll('[data-player-manage]').forEach(button => {
        button.addEventListener('click', () => handleOwnPlayerAction(button.dataset.playerManage));
    });
}

function renderPlayerCards() {
    const container = document.getElementById('players-grid');
    if (!container) return;
    if (fichajesLoadError) {
        container.innerHTML = `<div class="fichaje-empty-state"><strong>Estamos preparando el mercado de jugadores.</strong><span>${escapeHtml(fichajesLoadError)}</span></div>`;
        return;
    }
    const level = document.getElementById('player-filter-level')?.value || 'all';
    const venue = document.getElementById('player-filter-venue')?.value || 'all';
    const day = document.getElementById('player-filter-day')?.value || 'all';
    const filtered = playerProfiles.filter(player => {
        const positionMatches = activePlayerPositionFilter === 'all'
            || player.primary_position === activePlayerPositionFilter
            || player.secondary_position === activePlayerPositionFilter;
        return positionMatches
            && (level === 'all' || player.level === level)
            && (venue === 'all' || player.preferred_venue === venue || player.preferred_venue === 'indistinta')
            && (day === 'all' || player.available_days.includes(day));
    });
    if (!filtered.length) {
        container.innerHTML = `<div class="fichaje-empty-state"><strong>${playerProfiles.length ? 'No hay perfiles con esos filtros.' : 'Todavía no hay jugadores publicados.'}</strong><span>${playerProfiles.length ? 'Probá cambiar una posición, sede o día.' : 'Sé el primero en compartir tu perfil con los equipos de la zona.'}</span></div>`;
        return;
    }

    const dayLabels = { lunes: 'LUN', martes: 'MAR', miercoles: 'MIÉ', jueves: 'JUE', viernes: 'VIE', sabado: 'SÁB', domingo: 'DOM' };
    const levels = { recreativo: 'Recreativo', intermedio: 'Intermedio', competitivo: 'Competitivo' };
    const timeSlots = { tarde: 'Tardes', noche: 'Noches', indistinto: 'Cualquier horario' };
    const venues = { central: 'Sede Central', norte: 'Sede Norte', indistinta: 'Cualquier sede' };
    container.innerHTML = filtered.map(player => {
        const days = (player.available_days || []).map(value => `<span>${dayLabels[value] || escapeHtml(value)}</span>`).join('');
        const message = `¡Hola ${player.public_name}! Vi tu perfil en La Bombonerita FC. Estamos buscando un/a ${PLAYER_POSITIONS[player.primary_position] || 'jugador/a'} para sumarse a un equipo. ¿Te interesa?`;
        const whatsapp = `https://wa.me/${phoneForWhatsApp(player.phone)}?text=${encodeURIComponent(message)}`;
        const otherPosition = player.secondary_position ? `<span class="player-secondary-position">También juega ${escapeHtml(PLAYER_POSITIONS[player.secondary_position] || player.secondary_position)}</span>` : '';
        return `
            <article class="player-card position-${escapeHtml(player.primary_position)}">
                <div class="player-card-top">
                    <span class="player-position-label">${escapeHtml(PLAYER_POSITIONS[player.primary_position] || player.primary_position)}</span>
                    <span class="player-level level-${escapeHtml(player.level)}">${escapeHtml(levels[player.level] || player.level)}</span>
                </div>
                <div class="player-card-identity"><span class="player-avatar" aria-hidden="true">${escapeHtml(player.public_name.trim().slice(0, 1).toUpperCase())}</span><div><h4>${escapeHtml(player.public_name)}</h4><span>${escapeHtml(player.preferred_foot[0].toUpperCase() + player.preferred_foot.slice(1))}</span></div></div>
                ${otherPosition}
                <div class="player-days" aria-label="Días disponibles">${days}</div>
                <div class="player-card-details"><span>${escapeHtml(timeSlots[player.time_slot] || player.time_slot)}</span><span>${escapeHtml(venues[player.preferred_venue] || player.preferred_venue)}</span></div>
                ${player.bio ? `<blockquote>${escapeHtml(player.bio)}</blockquote>` : ''}
                <a class="player-contact-btn" href="${whatsapp}" target="_blank" rel="noopener noreferrer">Contactar por WhatsApp <span aria-hidden="true">↗</span></a>
                ${currentUser && currentUser.id !== player.owner_user_id ? `<button type="button" class="player-report-btn" data-report-player="${escapeHtml(player.id)}">Reportar perfil</button>` : ''}
            </article>`;
    }).join('');
    container.querySelectorAll('[data-report-player]').forEach(button => {
        button.addEventListener('click', () => openPlayerReport(button.dataset.reportPlayer));
    });
}

function phoneForWhatsApp(phone) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('549')) return digits;
    if (digits.startsWith('54')) return `549${digits.slice(2).replace(/^0/, '')}`;
    if (digits.startsWith('9')) digits = digits.slice(1);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return `549${digits}`;
}

function requireFichajesSession() {
    if (currentUser) return true;
    sessionStorage.setItem('turnos:return-after-auth', 'fichajes');
    showToast('Iniciá sesión o creá tu cuenta para participar en Fichajes.', 'info');
    if (document.body.dataset.page === 'fichajes') window.location.href = 'index.html#login';
    else switchView('auth');
    return false;
}

function renderUrgentNotices() {
    const publicContainer = document.getElementById('urgent-notices-grid');
    const ownContainer = document.getElementById('urgent-own-notices');
    if (!publicContainer || !ownContainer) return;
    if (fichajesLoadError) {
        publicContainer.innerHTML = `<div class="fichaje-empty-state"><strong>La pizarra estará disponible pronto.</strong><span>${escapeHtml(fichajesLoadError)}</span></div>`;
        ownContainer.innerHTML = '';
        return;
    }
    const now = new Date();
    const visibleOwn = ownUrgentNotices.filter(notice => notice.status === 'open' && new Date(notice.expires_at) > now);
    ownContainer.innerHTML = visibleOwn.length ? `
        <div class="urgent-own-list"><p>TUS AVISOS ABIERTOS</p>${visibleOwn.map(notice => `
            <div><span>${escapeHtml(notice.field_name)} · ${formatDate(notice.match_date)} · ${escapeHtml(String(notice.match_time).slice(0, 5))}</span>
            <button type="button" class="urgent-close-link" data-close-urgent="${escapeHtml(notice.id)}">Ya encontramos a alguien</button></div>`).join('')}</div>` : '';
    if (!urgentNotices.length) {
        publicContainer.innerHTML = '<div class="fichaje-empty-state"><strong>Ahora mismo no hay equipos buscando refuerzos.</strong><span>Volvé a consultar más tarde o compartí tu perfil en el mercado de jugadores.</span></div>';
        return;
    }
    const levels = { amistoso: 'Amistoso', tranqui: 'Picado tranqui', fuerte: 'Partido fuerte' };
    publicContainer.innerHTML = urgentNotices.map(notice => {
        const date = new Date(`${notice.match_date}T12:00:00`);
        const dateLabel = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
        const message = `¡Hola! Vi en la pizarra de La Bombonerita que les falta un jugador para las ${String(notice.match_time).slice(0, 5)} en ${notice.field_name}. ¿Sigue libre el lugar?`;
        const whatsapp = `https://wa.me/${phoneForWhatsApp(notice.contact_phone)}?text=${encodeURIComponent(message)}`;
        const ownerControls = currentUser?.id === notice.captain_user_id
            ? `<button type="button" class="urgent-close-link" data-close-urgent="${escapeHtml(notice.id)}">Cerrar aviso</button>` : '';
        return `<article class="urgent-notice-card">
            <div class="urgent-notice-time"><strong>${escapeHtml(String(notice.match_time).slice(0, 5))}</strong><span>${escapeHtml(dateLabel)}</span></div>
            <div class="urgent-notice-copy"><span class="urgent-kicker">BUSCA REFUERZO</span><h4>Falta ${PLAYER_POSITIONS[notice.needed_position] ? `un/a ${escapeHtml(PLAYER_POSITIONS[notice.needed_position]).toLowerCase()}` : 'un jugador'}</h4><p>${escapeHtml(notice.field_name)} · ${escapeHtml(notice.complex)}</p><span class="urgent-level">${escapeHtml(levels[notice.level] || notice.level)}</span>${notice.notes ? `<p class="urgent-notes">${escapeHtml(notice.notes)}</p>` : ''}</div>
            <div class="urgent-notice-actions"><a href="${whatsapp}" target="_blank" rel="noopener noreferrer" class="urgent-contact-btn">Postularme por WhatsApp <span aria-hidden="true">↗</span></a>${ownerControls}</div>
        </article>`;
    }).join('');
    publicContainer.querySelectorAll('[data-close-urgent]').forEach(button => {
        button.addEventListener('click', () => closeUrgentNotice(button.dataset.closeUrgent));
    });
    ownContainer.querySelectorAll('[data-close-urgent]').forEach(button => {
        button.addEventListener('click', () => closeUrgentNotice(button.dataset.closeUrgent));
    });
}

// CRUD Canchas (Admin)
function openPlayerProfileDialog() {
    if (!requireFichajesSession()) return;
    if (!currentUser.email_confirmed_at) {
        showToast('Verificá tu correo antes de publicar el perfil.', 'error');
        return;
    }
    const form = document.getElementById('player-profile-form');
    const profile = ownPlayerProfile;
    form.reset();
    document.getElementById('player-profile-id').value = profile?.id || '';
    document.getElementById('player-public-name').value = profile?.public_name || currentProfile?.full_name || '';
    document.getElementById('player-phone').value = profile?.phone || currentProfile?.phone || '';
    document.getElementById('player-primary-position').value = profile?.primary_position || 'arquero';
    document.getElementById('player-secondary-position').value = profile?.secondary_position || '';
    document.getElementById('player-level').value = profile?.level || 'recreativo';
    document.getElementById('player-time-slot').value = profile?.time_slot || 'noche';
    document.getElementById('player-venue').value = profile?.preferred_venue || 'central';
    document.getElementById('player-bio').value = profile?.bio || '';
    document.querySelectorAll('[name="available-days"]').forEach(input => {
        input.checked = Boolean(profile?.available_days?.includes(input.value));
    });
    const foot = profile?.preferred_foot || 'diestro';
    const selectedFoot = document.querySelector(`[name="player-foot"][value="${foot}"]`);
    if (selectedFoot) selectedFoot.checked = true;
    document.getElementById('player-contact-consent').checked = Boolean(profile?.contact_consent_at);
    document.getElementById('player-profile-title').textContent = profile ? 'Editá tu perfil' : 'Publicá tu perfil';
    document.getElementById('player-profile-save-btn').textContent = profile ? 'Guardar cambios' : 'Enviar a revisión';
    document.getElementById('player-bio-count').textContent = String(document.getElementById('player-bio').value.length);
    document.getElementById('player-days-error').hidden = true;
    document.getElementById('player-profile-dialog').showModal();
}

async function handlePlayerProfileSubmit(event) {
    event.preventDefault();
    if (!requireFichajesSession()) return;
    const name = document.getElementById('player-public-name').value.trim();
    const phone = document.getElementById('player-phone').value.trim();
    const days = [...document.querySelectorAll('[name="available-days"]:checked')].map(input => input.value);
    const primaryPosition = document.getElementById('player-primary-position').value;
    const secondaryPosition = document.getElementById('player-secondary-position').value || null;
    const phoneInput = document.getElementById('player-phone');
    phoneInput.classList.toggle('is-invalid', !validateArgentinePhone(phone));
    if (!validateArgentinePhone(phone)) {
        showToast('Ingresá un número de WhatsApp argentino válido.', 'error');
        phoneInput.focus();
        return;
    }
    if (!days.length) {
        document.getElementById('player-days-error').hidden = false;
        document.querySelector('.availability-fieldset').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (secondaryPosition === primaryPosition) {
        showToast('Elegí una posición secundaria distinta o dejala en ninguna.', 'error');
        return;
    }

    const saveButton = document.getElementById('player-profile-save-btn');
    saveButton.disabled = true;
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Guardando…';
    const profileId = document.getElementById('player-profile-id').value;
    const payload = {
        owner_user_id: currentUser.id,
        public_name: name,
        phone,
        contact_consent_at: new Date().toISOString(),
        primary_position: primaryPosition,
        secondary_position: secondaryPosition,
        preferred_foot: document.querySelector('[name="player-foot"]:checked')?.value,
        level: document.getElementById('player-level').value,
        available_days: days,
        time_slot: document.getElementById('player-time-slot').value,
        preferred_venue: document.getElementById('player-venue').value,
        bio: document.getElementById('player-bio').value.trim()
    };
    try {
        const { owner_user_id, ...editablePayload } = payload;
        const result = profileId
            ? await supabaseClient.from('player_profiles').update(editablePayload).eq('id', profileId)
            : await supabaseClient.from('player_profiles').insert(payload);
        if (result.error) throw result.error;
        document.getElementById('player-profile-dialog').close();
        showToast(profileId ? 'Perfil actualizado y enviado a revisión.' : 'Perfil enviado. El equipo lo revisará antes de publicarlo.', 'success');
        await loadFichajesData();
        renderFichajes();
    } catch (error) {
        console.error('No se pudo guardar el perfil:', error);
        showToast(error.code === '23505' ? 'Ya tenés un perfil publicado o en revisión.' : error.message || 'No se pudo guardar el perfil. Revisá que la migración 003 esté aplicada.', 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

function handleOwnPlayerAction(action) {
    if (!ownPlayerProfile || !requireFichajesSession()) return;
    if (action === 'edit') return openPlayerProfileDialog();
    if (action === 'delete') {
        return showCustomConfirm('¿Eliminar tu perfil?', 'Se quitará del mercado de jugadores y no se podrá recuperar.', async () => {
            const { error } = await supabaseClient.from('player_profiles').delete().eq('id', ownPlayerProfile.id);
            if (error) return showToast('No se pudo eliminar el perfil.', 'error');
            showToast('Perfil eliminado.', 'info');
            await loadFichajesData();
            renderFichajes();
        });
    }
    const status = action === 'pause' ? 'paused' : action === 'signed' ? 'signed' : 'active';
    supabaseClient.from('player_profiles').update({ status }).eq('id', ownPlayerProfile.id).then(async ({ error }) => {
        if (error) {
            showToast('No se pudo actualizar el estado del perfil.', 'error');
            return;
        }
        showToast(status === 'paused' ? 'Perfil en pausa.' : status === 'signed' ? '¡Éxitos en el nuevo equipo!' : 'Perfil disponible nuevamente.', 'success');
        await loadFichajesData();
        renderFichajes();
    });
}

function openUrgentNoticeDialog() {
    if (!requireFichajesSession()) return;
    if (!currentUser.email_confirmed_at) {
        showToast('Verificá tu correo antes de publicar un aviso.', 'error');
        return;
    }
    const select = document.getElementById('urgent-booking-select');
    const now = new Date();
    const availableBookings = bookings.filter(booking => new Date(`${booking.date}T${booking.time}`) > now);
    const alreadyPosted = new Set(ownUrgentNotices.filter(notice => notice.status === 'open' && new Date(notice.expires_at) > now).map(notice => notice.booking_id));
    const options = availableBookings.filter(booking => !alreadyPosted.has(booking.id));
    if (!options.length) {
        document.getElementById('urgent-booking-hint').textContent = availableBookings.length
            ? 'Ya hay un aviso abierto para cada una de tus reservas próximas.'
            : 'Necesitás una reserva confirmada próxima para publicar un aviso.';
        showToast(availableBookings.length ? 'Ya hay avisos abiertos para tus reservas próximas.' : 'Primero reservá una cancha para publicar un aviso.', 'info');
        return;
    }
    select.innerHTML = options.map(booking => `<option value="${escapeHtml(booking.id)}">${formatDate(booking.date)} · ${escapeHtml(booking.time)} · ${escapeHtml(booking.fieldName)}</option>`).join('');
    document.getElementById('urgent-booking-hint').textContent = `${options.length} reserva${options.length === 1 ? '' : 's'} disponible${options.length === 1 ? '' : 's'} para publicar.`;
    document.getElementById('urgent-notice-form').reset();
    document.getElementById('urgent-contact-consent').checked = false;
    select.value = options[0].id;
    document.getElementById('urgent-notice-dialog').showModal();
}

async function handleUrgentNoticeSubmit(event) {
    event.preventDefault();
    if (!requireFichajesSession()) return;
    const payload = {
        captain_user_id: currentUser.id,
        booking_id: document.getElementById('urgent-booking-select').value,
        needed_position: document.getElementById('urgent-position').value,
        level: document.getElementById('urgent-level').value,
        notes: document.getElementById('urgent-notes').value.trim(),
        contact_consent_at: new Date().toISOString()
    };
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
        const { error } = await supabaseClient.from('urgent_notices').insert(payload);
        if (error) throw error;
        document.getElementById('urgent-notice-dialog').close();
        showToast('Aviso publicado. Tu teléfono se mostrará para recibir postulaciones.', 'success');
        await loadFichajesData();
        renderFichajes();
    } catch (error) {
        console.error('No se pudo publicar el aviso:', error);
        showToast(error.code === '23505' ? 'Ya hay un aviso abierto para esa reserva.' : error.message || 'No se pudo publicar. Revisá que la migración 003 esté aplicada.', 'error');
    } finally {
        submit.disabled = false;
    }
}

function closeUrgentNotice(id) {
    showCustomConfirm('¿Cerrar el aviso?', 'Dejará de aparecer en la pizarra de refuerzos.', async () => {
        const { error } = await supabaseClient.from('urgent_notices').update({ status: 'filled' }).eq('id', id);
        if (error) return showToast('No se pudo cerrar el aviso.', 'error');
        showToast('Aviso cerrado.', 'success');
        await loadFichajesData();
        renderFichajes();
    });
}

function openPlayerReport(profileId) {
    if (!requireFichajesSession()) return;
    document.getElementById('player-report-form').reset();
    document.getElementById('report-player-id').value = profileId;
    document.getElementById('player-report-dialog').showModal();
}

async function handlePlayerReportSubmit(event) {
    event.preventDefault();
    if (!requireFichajesSession()) return;
    const { error } = await supabaseClient.from('player_profile_reports').insert({
        player_profile_id: document.getElementById('report-player-id').value,
        reporter_user_id: currentUser.id,
        reason: document.getElementById('report-reason').value,
        details: document.getElementById('report-details').value.trim()
    });
    if (error) {
        showToast(error.code === '23505' ? 'Ya enviaste un reporte para este perfil.' : 'No se pudo enviar el reporte. Iniciá sesión con una cuenta verificada.', 'error');
        return;
    }
    document.getElementById('player-report-dialog').close();
    showToast('Reporte enviado para revisión.', 'success');
}

async function renderAdminModeration() {
    const container = document.getElementById('admin-fichajes-content');
    if (!container) return;
    container.innerHTML = '<div class="empty-state">Cargando perfiles, denuncias y avisos…</div>';
    const [profiles, reports, notices] = await Promise.all([
        supabaseClient.from('player_profiles').select('id, public_name, phone, primary_position, status, moderation_status, created_at').order('created_at', { ascending: false }),
        supabaseClient.from('player_profile_reports').select('id, player_profile_id, reason, details, status, created_at, player:player_profiles(public_name, primary_position)').order('created_at', { ascending: false }),
        supabaseClient.from('urgent_notices').select('id, match_date, match_time, field_name, complex, needed_position, level, status, expires_at').order('match_date', { ascending: true })
    ]);
    const failed = [profiles, reports, notices].find(result => result.error);
    if (failed) {
        console.error('No se pudo cargar la moderación de Fichajes:', failed.error);
        container.innerHTML = '<div class="fichaje-empty-state"><strong>No se pudo cargar la moderación.</strong><span>Revisá que esté aplicada la migración 003 y que tu cuenta tenga rol admin.</span></div>';
        return;
    }

    const moderationLabels = { pending: 'En revisión', approved: 'Publicado', suspended: 'Suspendido', removed: 'Dado de baja' };
    const profileRows = (profiles.data || []).map(profile => {
        const controls = profile.moderation_status === 'approved'
            ? `<button class="btn btn-outline btn-sm" data-moderate-profile="suspended" data-profile-id="${escapeHtml(profile.id)}">Suspender</button><button class="btn btn-danger btn-sm" data-moderate-profile="removed" data-profile-id="${escapeHtml(profile.id)}">Dar de baja</button>`
            : profile.moderation_status === 'removed'
                ? `<button class="btn btn-secondary btn-sm" data-moderate-profile="approved" data-profile-id="${escapeHtml(profile.id)}">Restaurar</button>`
                : `<button class="btn btn-primary btn-sm" data-moderate-profile="approved" data-profile-id="${escapeHtml(profile.id)}">Aprobar</button><button class="btn btn-outline btn-sm" data-moderate-profile="suspended" data-profile-id="${escapeHtml(profile.id)}">Suspender</button>`;
        return `<tr><td><strong>${escapeHtml(profile.public_name)}</strong><small>${escapeHtml(PLAYER_POSITIONS[profile.primary_position] || profile.primary_position)} · ${escapeHtml(profile.phone)}</small></td><td>${escapeHtml(moderationLabels[profile.moderation_status] || profile.moderation_status)}</td><td>${escapeHtml(profile.status)}</td><td><div class="admin-moderation-actions">${controls}</div></td></tr>`;
    }).join('');
    const reportRows = (reports.data || []).filter(report => report.status === 'open').map(report => `
        <article class="admin-report-row"><div><strong>${escapeHtml(report.player?.public_name || 'Perfil eliminado')}</strong><span>${escapeHtml(report.reason.replaceAll('_', ' '))} · ${escapeHtml(PLAYER_POSITIONS[report.player?.primary_position] || '')}</span>${report.details ? `<p>${escapeHtml(report.details)}</p>` : ''}</div><div class="admin-moderation-actions"><button class="btn btn-secondary btn-sm" data-review-report="dismissed" data-report-id="${escapeHtml(report.id)}">Descartar</button><button class="btn btn-primary btn-sm" data-review-report="resolved" data-report-id="${escapeHtml(report.id)}">Resolver</button></div></article>`).join('');
    const noticeRows = (notices.data || []).map(notice => `<tr><td>${formatDate(notice.match_date)} · ${escapeHtml(String(notice.match_time).slice(0, 5))}</td><td>${escapeHtml(notice.field_name)}<small>${escapeHtml(notice.complex)}</small></td><td>${notice.status === 'open' && new Date(notice.expires_at) > new Date() ? 'Abierto' : notice.status === 'open' ? 'Vencido' : notice.status === 'filled' ? 'Completado' : 'Cerrado'}</td><td>${notice.status === 'open' ? `<button class="btn btn-outline btn-sm" data-admin-close-notice="${escapeHtml(notice.id)}">Cerrar aviso</button>` : '—'}</td></tr>`).join('');

    container.innerHTML = `
        <section class="admin-moderation-panel"><div class="admin-moderation-heading"><div><h4>Perfiles de jugadores</h4><p>Los perfiles nuevos aparecen después de la aprobación.</p></div><span>${profiles.data?.length || 0} perfiles</span></div>
            ${profileRows ? `<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th>Jugador</th><th>Moderación</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${profileRows}</tbody></table></div>` : '<div class="fichaje-empty-state">Todavía no hay perfiles.</div>'}
        </section>
        <section class="admin-moderation-panel"><div class="admin-moderation-heading"><div><h4>Denuncias pendientes</h4><p>Revisá reportes enviados por la comunidad.</p></div><span>${reports.data?.filter(report => report.status === 'open').length || 0} abiertas</span></div>
            ${reportRows || '<div class="fichaje-empty-state">No hay denuncias pendientes.</div>'}
        </section>
        <section class="admin-moderation-panel"><div class="admin-moderation-heading"><div><h4>Avisos urgentes</h4><p>Revisá y cerrá los avisos de refuerzo.</p></div><span>${notices.data?.filter(notice => notice.status === 'open' && new Date(notice.expires_at) > new Date()).length || 0} abiertos</span></div>
            ${noticeRows ? `<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th>Fecha y hora</th><th>Cancha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${noticeRows}</tbody></table></div>` : '<div class="fichaje-empty-state">No hay avisos publicados.</div>'}
        </section>`;

}

async function moderatePlayerProfile(id, status) {
    const { error } = await supabaseClient.from('player_profiles').update({
        moderation_status: status,
        moderation_note: status === 'approved' ? null : status === 'suspended' ? 'Revisión de administración' : 'Baja administrativa',
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString()
    }).eq('id', id);
    if (error) return showToast('No se pudo actualizar la moderación del perfil.', 'error');
    showToast(status === 'approved' ? 'Perfil aprobado.' : status === 'suspended' ? 'Perfil suspendido.' : 'Perfil dado de baja.', 'success');
    await Promise.all([renderAdminModeration(), loadFichajesData()]);
    renderFichajes();
}

async function reviewPlayerReport(id, status) {
    const { error } = await supabaseClient.from('player_profile_reports').update({ status }).eq('id', id);
    if (error) return showToast('No se pudo actualizar la denuncia.', 'error');
    showToast('Denuncia actualizada.', 'success');
    renderAdminModeration();
}

async function moderateUrgentNotice(id) {
    const { error } = await supabaseClient.from('urgent_notices').update({ status: 'closed' }).eq('id', id);
    if (error) return showToast('No se pudo cerrar el aviso.', 'error');
    showToast('Aviso cerrado desde administración.', 'success');
    await Promise.all([renderAdminModeration(), loadFichajesData()]);
    renderFichajes();
}

function renderAdminFields() {
    const container = document.getElementById('admin-fields-list');
    if (!container) return;

    container.innerHTML = fields.map(field => {
        const isActive = field.active !== false;
        return `
            <div class="admin-field-card">
                <div class="admin-field-header">
                    <div>
                        <h4>${field.name}</h4>
                        <span class="field-complex">${field.complex}</span>
                    </div>
                    <span class="badge-status ${isActive ? 'badge-active' : 'badge-inactive'}">
                        ${isActive ? 'Activa' : 'Inactiva'}
                    </span>
                </div>
                <div class="admin-field-details">
                    <span><strong>Tipo:</strong> ${field.type}</span>
                    <span><strong>Capacidad:</strong> ${field.capacity}</span>
                    <span><strong>Precio:</strong> $${field.price.toLocaleString()}/hr</span>
                </div>
                <div class="admin-field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editField(${field.id})">Editar</button>
                    <button class="btn btn-outline btn-sm" onclick="toggleFieldStatus(${field.id})">
                        ${isActive ? 'Pausar' : 'Activar'}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteField(${field.id})">Borrar</button>
                </div>
            </div>
        `;
    }).join('');
}

function showFieldCrudForm(fieldToEdit = null) {
    const form = document.getElementById('field-crud-form');
    form.style.display = 'block';

    if (fieldToEdit) {
        document.getElementById('field-form-title').textContent = 'Editar Cancha';
        document.getElementById('crud-field-id').value = fieldToEdit.id;
        document.getElementById('crud-field-name').value = fieldToEdit.name;
        document.getElementById('crud-field-complex').value = fieldToEdit.complex;
        document.getElementById('crud-field-type').value = fieldToEdit.type;
        document.getElementById('crud-field-capacity').value = fieldToEdit.capacity;
        document.getElementById('crud-field-price').value = fieldToEdit.price;
        document.getElementById('crud-field-active').value = String(fieldToEdit.active !== false);
    } else {
        document.getElementById('field-form-title').textContent = 'Agregar Cancha';
        form.reset();
        document.getElementById('crud-field-id').value = '';
    }
    form.scrollIntoView({ behavior: 'smooth' });
}

function hideFieldCrudForm() {
    const form = document.getElementById('field-crud-form');
    form.style.display = 'none';
    form.reset();
}

async function handleFieldSave(e) {
    e.preventDefault();
    const idVal = document.getElementById('crud-field-id').value;
    const name = document.getElementById('crud-field-name').value.trim();
    const complex = document.getElementById('crud-field-complex').value.trim();
    const type = document.getElementById('crud-field-type').value;
    const capacity = document.getElementById('crud-field-capacity').value;
    const price = Number(document.getElementById('crud-field-price').value);
    const active = document.getElementById('crud-field-active').value === 'true';

    try {
        if (idVal) {
            const id = Number(idVal);
            const index = fields.findIndex(f => f.id === id);
            if (index !== -1) {
                const updated = { id, name, complex, type, capacity, price, active };
                await saveFieldToDB(updated);
                fields[index] = updated;
                showToast('Cancha actualizada correctamente', 'success');
            }
        } else {
            const newField = { id: Date.now(), name, complex, type, capacity, price, active };
            await saveFieldToDB(newField);
            fields.push(newField);
            showToast('Nueva cancha creada correctamente', 'success');
        }
    } catch (error) {
        console.error('No se pudo guardar la cancha:', error);
        showToast('No se pudo guardar. Verificá la migración y los permisos de administrador.', 'error');
        return;
    }

    hideFieldCrudForm();
    renderAdminFields();
}

async function toggleFieldStatus(id) {
    const field = fields.find(f => f.id === id);
    if (!field) return;

    const updated = { ...field, active: field.active === false };
    try {
        await saveFieldToDB(updated);
        Object.assign(field, updated);
        renderAdminFields();
        showToast(`Cancha ${field.active ? 'activada' : 'pausada'} con éxito`, 'info');
    } catch (error) {
        showToast('No se pudo cambiar el estado. Verificá tus permisos de administrador.', 'error');
    }
}

function deleteField(id) {
    showCustomConfirm('¿Eliminar esta cancha?', 'Las reservas pasadas asociadas se conservarán pero no podrá reservarse más.', async () => {
        try {
            await deleteFieldFromDB(id);
            fields = fields.filter(f => f.id !== id);
            blockedSlots = blockedSlots.filter(block => block.fieldId !== Number(id));
            renderAdminFields();
            renderAdminBlocks();
            renderFields();
            showToast('Cancha eliminada del sistema', 'info');
        } catch (error) {
            showToast('No se pudo eliminar. Revisá tus permisos de administrador.', 'error');
        }
    });
}

function editField(id) {
    const field = fields.find(f => f.id === id);
    if (field) showFieldCrudForm(field);
}

// Bloqueo de Franjas Horarias (Admin)
function renderAdminBlocks() {
    const fieldSelect = document.getElementById('block-field-select');
    const timeSelect = document.getElementById('block-time-select');
    const blocksList = document.getElementById('admin-blocks-list');

    if (fieldSelect) {
        fieldSelect.innerHTML = fields.map(f => `<option value="${f.id}">${escapeHtml(f.name)} (${escapeHtml(f.complex)})</option>`).join('');
    }

    if (timeSelect) {
        timeSelect.innerHTML = TIME_SLOTS.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    if (!blocksList) return;

    if (blockedSlots.length === 0) {
        blocksList.innerHTML = '<div class="empty-state">No hay franjas bloqueadas actualmente.</div>';
        return;
    }

    blocksList.innerHTML = blockedSlots.map(block => `
        <div class="admin-block-card">
            <div class="admin-block-info">
                <strong>${escapeHtml(block.fieldName)} (${escapeHtml(block.complex || '')})</strong><br>
                <span>📅 ${formatDate(block.date)} a las ${block.time}</span><br>
                <span class="badge-status badge-blocked">Motivo: ${escapeHtml(block.reason)}</span>
            </div>
            <button class="btn btn-secondary btn-sm" data-unblock-slot="${escapeHtml(block.id)}">Desbloquear</button>
        </div>
    `).join('');
    blocksList.querySelectorAll('[data-unblock-slot]').forEach(button => {
        button.addEventListener('click', () => unblockSlot(button.dataset.unblockSlot));
    });
}

async function handleBlockSlotSubmit(e) {
    e.preventDefault();
    const fieldId = Number(document.getElementById('block-field-select').value);
    const date = document.getElementById('block-date-input').value;
    const time = document.getElementById('block-time-select').value;
    const reason = document.getElementById('block-reason-input').value.trim();

    if (!date) {
        showToast('Por favor selecciona una fecha para el bloqueo', 'error');
        return;
    }

    // Verificar si ya existe bloqueo
    const exists = blockedSlots.some(b => b.fieldId === fieldId && b.date === date && b.time === time);
    if (exists) {
        showToast('Ese horario ya se encuentra bloqueado', 'error');
        return;
    }

    const field = fields.find(f => f.id === fieldId);
    const newBlock = {
        fieldId,
        fieldName: field ? field.name : `Cancha ${fieldId}`,
        complex: field ? field.complex : '',
        date,
        time,
        reason: reason || 'Mantenimiento'
    };

    try {
        blockedSlots.push(await saveBlockedSlotToDB(newBlock));
        renderAdminBlocks();
        document.getElementById('block-slot-form').reset();
        showToast('Franja horaria bloqueada correctamente', 'success');
    } catch (error) {
        showToast(error.code === '23505' ? 'Ese horario ya está bloqueado.' : 'No se pudo bloquear el horario. Revisá la migración y los permisos de administrador.', 'error');
    }
}

function unblockSlot(id) {
    showCustomConfirm('¿Desbloquear horario?', 'La franja volverá a estar disponible para reservas.', async () => {
        try {
            await deleteBlockedSlotFromDB(id);
            blockedSlots = blockedSlots.filter(block => String(block.id) !== String(id));
            renderAdminBlocks();
            showToast('Franja desbloqueada con éxito', 'info');
        } catch (error) {
            showToast('No se pudo quitar el bloqueo. Revisá tus permisos de administrador.', 'error');
        }
    });
}

// Registro Completo de Reservas y Métricas (Admin)
function renderAdminBookings() {
    const period = document.getElementById('filter-period').value;
    const fieldFilter = document.getElementById('filter-field').value;
    const tableContainer = document.getElementById('admin-bookings-table-container');
    const fieldSelect = document.getElementById('filter-field');

    // Popular filtro de canchas
    if (fieldSelect && fieldSelect.options.length <= 1) {
        fields.forEach(f => {
            const opt = document.createElement('option');
            opt.value = String(f.id);
            opt.textContent = `${f.name} (${f.complex})`;
            fieldSelect.appendChild(opt);
        });
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

    let filtered = [...bookings];

    if (period === 'today') {
        filtered = filtered.filter(b => b.date === todayStr);
    } else if (period === 'upcoming') {
        filtered = filtered.filter(b => b.date >= todayStr && b.date <= nextWeekStr);
    }

    if (fieldFilter !== 'all') {
        filtered = filtered.filter(b => String(b.fieldId) === fieldFilter);
    }

    // Métricas
    const totalCount = filtered.length;
    const totalRevenue = filtered.reduce((acc, b) => acc + (b.price || 5000), 0);
    const summaryEl = document.getElementById('admin-bookings-summary');
    if (summaryEl) {
        summaryEl.textContent = `${totalCount} reservas listadas | Ingresos estimados: $${totalRevenue.toLocaleString()}`;
    }

    if (filtered.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state">No se encontraron reservas con los filtros seleccionados.</div>';
        return;
    }

    filtered.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    tableContainer.innerHTML = `
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Fecha & Hora</th>
                        <th>Cancha & Sede</th>
                        <th>Cliente</th>
                        <th>Teléfono</th>
                        <th>Precio</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(b => `
                        <tr>
                            <td><strong>${formatDate(b.date)}</strong> ${b.time}</td>
                            <td>${escapeHtml(b.fieldName)} <small style="color:var(--text-secondary)">(${escapeHtml(b.complex || 'Sede')})</small></td>
                            <td>${escapeHtml(b.playerName)}</td>
                            <td>${escapeHtml(b.phone)}</td>
                            <td>$${(b.price || 5000).toLocaleString()}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" data-admin-cancel-booking="${escapeHtml(b.id)}">Cancelar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    tableContainer.querySelectorAll('[data-admin-cancel-booking]').forEach(button => {
        button.addEventListener('click', () => adminCancelBooking(button.dataset.adminCancelBooking));
    });
}

function adminCancelBooking(id) {
    showCustomConfirm('¿Cancelar esta reserva?', 'El turno quedará liberado inmediatamente para otros clientes.', async () => {
        try {
            await deleteBookingFromDB(id);
            bookings = bookings.filter(booking => String(booking.id) !== String(id));
            await loadBookedSlots();
            renderAdminBookings();
            showToast('Reserva cancelada desde el panel administrador', 'info');
        } catch (error) {
            showToast('No se pudo cancelar la reserva.', 'error');
        }
    });
}

// Exportación de Reservas a CSV (Etapa 3)
function exportBookingsToCSV() {
    if (bookings.length === 0) {
        showToast('No hay reservas registradas para exportar.', 'error');
        return;
    }

    const headers = ['ID', 'Cancha', 'Sede', 'Fecha', 'Hora', 'Cliente', 'Telefono', 'Precio', 'Fecha Creacion'];
    const rows = bookings.map(b => [
        b.id,
        `"${b.fieldName}"`,
        `"${b.complex || ''}"`,
        b.date,
        b.time,
        `"${b.playerName.replace(/"/g, '""')}"`,
        `"${b.phone}"`,
        b.price || 5000,
        `"${b.createdAt || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `reservas_canchas_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('¡Archivo CSV descargado exitosamente!', 'success');
}

// --- Listeners de Eventos ---

function setupEventListeners() {
    document.getElementById('date').addEventListener('change', updateTimeSlots);
    document.getElementById('cancel-btn').addEventListener('click', cancelBookingForm);
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            phoneInput.classList.remove('is-invalid');
        });
    }

    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeConfirmModal);

    // Navegación y Login SPA
    const navLoginBtn = document.getElementById('nav-login-btn');
    if (navLoginBtn) {
        navLoginBtn.addEventListener('click', async () => {
            if (currentUser) {
                const { error } = await supabaseClient.auth.signOut();
                if (error) showToast('No se pudo cerrar la sesión.', 'error');
                else { showToast('Sesión cerrada.', 'info'); window.location.assign('/'); }
            } else {
                switchView('auth');
            }
        });
    }

    const authModeToggle = document.getElementById('auth-mode-toggle');
    if (authModeToggle) authModeToggle.addEventListener('click', () => {
        authMode = authMode === 'signin' ? 'signup' : 'signin';
        initializeAuthMode();
    });
    document.getElementById('sign-in-form').addEventListener('submit', handleSignIn);
    document.getElementById('sign-up-form').addEventListener('submit', handleSignUp);
    document.getElementById('reset-password-form').addEventListener('submit', handlePasswordUpdate);
    document.getElementById('forgot-password-btn').addEventListener('click', handlePasswordReset);
    document.getElementById('auth-back-btn').addEventListener('click', () => switchView('client'));
    setupFichajesEventListeners();
    document.querySelectorAll('.header-nav a[href^="#"]').forEach(link => {
        if (link.id === 'nav-admin-link') return;

        link.addEventListener('click', event => {
            const targetId = link.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (!target || target.closest('#admin-view, #auth-view')) return;

            event.preventDefault();
            if (document.getElementById('client-view').style.display === 'none') {
                switchView('client');
            }
            history.replaceState(null, '', `#${targetId}`);
            requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        });
    });
    document.getElementById('nav-admin-link').addEventListener('click', event => {
        event.preventDefault();
        window.location.assign('/#admin');
    });

    // Scroll espía para resaltar enlaces de navegación activa
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.header-nav a[href*="${sectionId}"]`);

            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
    });
}

function setupFichajesEventListeners() {
    if (!document.getElementById('fichajes-market-view')) return;
    document.getElementById('player-profile-open-btn')?.addEventListener('click', openPlayerProfileDialog);
    document.getElementById('player-profile-form')?.addEventListener('submit', handlePlayerProfileSubmit);
    document.getElementById('urgent-notice-open-btn')?.addEventListener('click', openUrgentNoticeDialog);
    document.getElementById('urgent-notice-form')?.addEventListener('submit', handleUrgentNoticeSubmit);
    document.getElementById('player-report-form')?.addEventListener('submit', handlePlayerReportSubmit);
    document.querySelectorAll('[data-close-dialog]').forEach(button => {
        button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog)?.close());
    });
    document.querySelectorAll('[data-fichaje-view]').forEach(button => {
        button.addEventListener('click', () => switchFichajeView(button.dataset.fichajeView));
    });
    document.querySelectorAll('[data-player-position]').forEach(button => {
        button.addEventListener('click', () => {
            activePlayerPositionFilter = button.dataset.playerPosition;
            document.querySelectorAll('[data-player-position]').forEach(chip => {
                const active = chip.dataset.playerPosition === activePlayerPositionFilter;
                chip.classList.toggle('active', active);
                chip.setAttribute('aria-pressed', String(active));
            });
            renderPlayerCards();
        });
    });
    ['player-filter-level', 'player-filter-venue', 'player-filter-day'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderPlayerCards);
    });
    document.getElementById('player-bio')?.addEventListener('input', event => {
        document.getElementById('player-bio-count').textContent = String(event.currentTarget.value.length);
    });
    document.querySelectorAll('[name="available-days"]').forEach(input => {
        input.addEventListener('change', () => {
            if (document.querySelector('[name="available-days"]:checked')) document.getElementById('player-days-error').hidden = true;
        });
    });
    document.getElementById('nav-login-btn')?.addEventListener('click', async () => {
        if (currentUser) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) showToast('No se pudo cerrar la sesión.', 'error');
            else { showToast('Sesión cerrada.', 'info'); window.location.assign('/'); }
        } else {
            sessionStorage.setItem('turnos:return-after-auth', 'fichajes');
            window.location.href = 'index.html#login';
        }
    });
}

function switchFichajeView(view) {
    const marketActive = view === 'market';
    document.querySelectorAll('[data-fichaje-view]').forEach(button => {
        const active = button.dataset.fichajeView === view;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
    });
    document.getElementById('fichajes-market-view').hidden = !marketActive;
    document.getElementById('fichajes-market-view').classList.toggle('active', marketActive);
    document.getElementById('fichajes-urgent-view').hidden = marketActive;
    document.getElementById('fichajes-urgent-view').classList.toggle('active', !marketActive);
}

function setupAdminEventListeners() {
    document.getElementById('admin-logout-btn').addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) showToast('No se pudo cerrar la sesión.', 'error');
        else { showToast('Sesión cerrada.', 'info'); window.location.assign('/'); }
    });

    // Tabs del Panel
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchAdminTab(btn.dataset.tab));
    });
    document.querySelectorAll('[data-admin-go]').forEach(button => {
        button.addEventListener('click', () => switchAdminTab(button.dataset.adminGo));
    });
    document.getElementById('admin-fichajes-content').addEventListener('click', event => {
        const button = event.target.closest('[data-moderate-profile], [data-review-report], [data-admin-close-notice]');
        if (!button) return;
        if (button.dataset.moderateProfile) moderatePlayerProfile(button.dataset.profileId, button.dataset.moderateProfile);
        if (button.dataset.reviewReport) reviewPlayerReport(button.dataset.reportId, button.dataset.reviewReport);
        if (button.dataset.adminCloseNotice) moderateUrgentNotice(button.dataset.adminCloseNotice);
    });

    // Formulario Canchas
    document.getElementById('toggle-field-form-btn').addEventListener('click', () => {
        const form = document.getElementById('field-crud-form');
        if (form.style.display === 'none') {
            showFieldCrudForm();
        } else {
            hideFieldCrudForm();
        }
    });
    document.getElementById('cancel-field-btn').addEventListener('click', hideFieldCrudForm);
    document.getElementById('field-crud-form').addEventListener('submit', handleFieldSave);

    // Formulario Bloqueo
    document.getElementById('block-slot-form').addEventListener('submit', handleBlockSlotSubmit);

    // Filtros de Reservas
    document.getElementById('filter-period').addEventListener('change', renderAdminBookings);
    document.getElementById('filter-field').addEventListener('change', renderAdminBookings);

    // Exportar CSV
    document.getElementById('export-csv-btn').addEventListener('click', exportBookingsToCSV);
}

// --- Modales y Notificaciones ---

let modalConfirmCallback = null;

function showCustomConfirm(title, text, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) {
        if (confirm(`${title}\n${text}`)) onConfirm();
        return;
    }
    document.getElementById('modal-title').textContent = title;
    document.getElementById('confirm-modal-text').textContent = text;
    modalConfirmCallback = onConfirm;

    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.onclick = () => {
        closeConfirmModal();
        if (modalConfirmCallback) modalConfirmCallback();
    };

    modal.style.display = 'flex';
}

function confirmCancelBooking(id) {
    showCustomConfirm('¿Cancelar reserva?', 'Esta acción liberará el horario inmediatamente.', async () => {
        try {
            await deleteBookingFromDB(id);
            bookings = bookings.filter(booking => String(booking.id) !== String(id));
            await loadBookedSlots();
            renderBookings();
            if (selectedFieldId) updateTimeSlots();
            showToast('Reserva cancelada correctamente.', 'info');
        } catch (error) {
            showToast('No se pudo cancelar la reserva.', 'error');
        }
    });
}

function closeConfirmModal() {
    modalConfirmCallback = null;
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.style.display = 'none';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = '✓';
    if (type === 'error') icon = '⚠';
    if (type === 'info') icon = 'ℹ';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentElement) toast.parentElement.removeChild(toast);
        }, 300);
    }, 3500);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    }
    return dateStr;
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', init);

// Exponer funciones globales para interacción inline en HTML
window.confirmCancelBooking = confirmCancelBooking;
window.cancelBookingById = confirmCancelBooking;
window.editField = editField;
window.toggleFieldStatus = toggleFieldStatus;
window.deleteField = deleteField;
window.unblockSlot = unblockSlot;
window.adminCancelBooking = adminCancelBooking;
window.switchView = switchView;
