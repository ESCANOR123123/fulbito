import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL')!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));

const mailContent = (type: string, booking: Record<string, string>) => {
  const labels: Record<string, [string, string]> = {
    confirmation: ['Reserva confirmada', 'Tu cancha ya quedó reservada.'],
    reminder_24h: ['Tu partido es mañana', 'Te recordamos que mañana tenés un turno reservado.'],
    reminder_2h: ['Tu partido es en 2 horas', 'En un rato te esperamos para jugar.'],
  };
  const [subject, intro] = labels[type] || labels.confirmation;
  const safeName = escapeHtml(booking.player_name);
  const safeField = escapeHtml(booking.field_name);
  const safeVenue = escapeHtml(booking.complex);
  const safeDate = escapeHtml(booking.booking_date);
  const safeTime = escapeHtml(booking.start_time.slice(0, 5));
  return {
    subject: `${subject} · La Bombonerita FC`,
    html: `<div style="font-family:Arial,sans-serif;color:#203027;max-width:560px;margin:auto"><h1 style="font-size:24px">${subject}</h1><p>Hola ${safeName}, ${intro}</p><p><strong>${safeField}</strong> · ${safeVenue}<br>${safeDate} · ${safeTime}</p><p>La Bombonerita FC · Salta</p></div>`,
    text: `Hola ${booking.player_name}, ${intro}\n${booking.field_name} · ${booking.complex}\n${booking.booking_date} · ${booking.start_time.slice(0, 5)}\nLa Bombonerita FC · Salta`,
  };
};

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (request.headers.get('apikey') !== serviceRoleKey) return new Response('Unauthorized', { status: 401 });
  if (!resendApiKey || !fromEmail) return Response.json({ error: 'Email provider is not configured.' }, { status: 500 });

  const { data: queued, error: claimError } = await supabase.rpc('claim_booking_emails', { batch_size: 50 });
  if (claimError) return Response.json({ error: 'Could not claim queued emails.' }, { status: 500 });
  if (!queued?.length) return Response.json({ sent: 0 });

  const bookingIds = [...new Set(queued.map((item: { booking_id: string }) => item.booking_id))];
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id,field_name,complex,booking_date,start_time,player_name')
    .in('id', bookingIds);
  if (bookingError) return Response.json({ error: 'Could not load bookings.' }, { status: 500 });
  const byId = new Map((bookings || []).map(booking => [booking.id, booking]));

  let sent = 0;
  for (const item of queued) {
    const booking = byId.get(item.booking_id);
    if (!booking) continue;
    const content = mailContent(item.email_type, booking);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': item.id },
        body: JSON.stringify({ from: fromEmail, to: [item.recipient_email], ...content }),
      });
      if (!response.ok) throw new Error(`Resend returned ${response.status}`);
      const { error } = await supabase.from('booking_email_queue').update({ sent_at: new Date().toISOString(), claimed_until: null }).eq('id', item.id);
      if (error) throw new Error('Email sent but queue status could not be updated.');
      sent++;
    } catch (error) {
      await supabase.from('booking_email_queue').update({ claimed_until: null, last_error: String(error).slice(0, 500) }).eq('id', item.id);
    }
  }
  return Response.json({ sent, claimed: queued.length });
});
