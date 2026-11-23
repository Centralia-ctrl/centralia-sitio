import { createHmac } from 'node:crypto';

const TZ = 'America/Mexico_City';
const SLUG = 'miguelmeza1';
const DURATION = 1800000; // HubSpot's configured duration is in milliseconds.
const BASE = 'https://api.hubapi.com/scheduler/2026-09/meetings/meeting-links';
export class AgendaError extends Error {
  constructor(code, message, status = 503) { super(message); this.code = code; this.status = status; }
}
const uncertain = () => new AgendaError('UNCONFIRMED', 'No pudimos comprobar la reserva. Contacta a Centralia antes de volver a intentarlo.', 409);
export function normalize(data, now = Date.now()) {
  if (data.isOffline !== false) throw new AgendaError('OFFLINE', 'No pudimos consultar la agenda. Inténtalo de nuevo.');
  if (data.linkType !== 'PERSONAL_LINK' || data.customParams?.legalConsentEnabled || data.customParams?.formFields?.length) {
    throw new AgendaError('CONFIGURATION', 'La agenda cambió sus requisitos. Abre la agenda de Centralia para continuar.');
  }
  const group = data.linkAvailability?.linkAvailabilityByDuration?.[DURATION];
  const slots = (group?.availabilities || []).filter(x => Number.isSafeInteger(x.startMillisUtc) && x.startMillisUtc > now && x.endMillisUtc - x.startMillisUtc === DURATION)
    .map(x => ({start:x.startMillisUtc,end:x.endMillisUtc})).sort((a,b)=>a.start-b.start);
  return {timezone:TZ,duration:30,slots,hasMore:data.linkAvailability?.hasMore===true};
}
function offsetFor(start, now) {
  const p = t => Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'numeric'}).formatToParts(t).map(x=>[x.type,x.value]));
  const a=p(start),b=p(now);return (+a.year-+b.year)*12+ +a.month-+b.month;
}
export function validate(input, now) {
  const {firstName,lastName,email,start,consent,requestId,website}=input||{};
  if (![firstName,lastName].every(v=>typeof v==='string'&&v.trim().length>0&&v.length<=100&&!/[\r\n<>]/.test(v)) || typeof email!=='string' || email.length>254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.trim()) || !Number.isSafeInteger(start) || start<=now || consent!==true || typeof requestId!=='string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId) || (website!==undefined&&website!=='')) {
    throw new AgendaError('INVALID','Revisa tus datos y confirma que podemos usarlos para agendar.',400);
  }
  return {firstName:firstName.trim(),lastName:lastName.trim(),email:email.trim().toLowerCase(),start,requestId};
}
export function createAgenda({token,store,fetchImpl=fetch,now=()=>Date.now()}) {
  const hash=value=>createHmac('sha256',token).update(value).digest('hex');
  async function api(path,body) {
    if(!token)throw new AgendaError('NOT_CONFIGURED','La agenda no está disponible en este momento.');
    try {
      const response=await fetchImpl(BASE+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(body?12000:8000)});
      // A failed booking response can be ambiguous. Never automatically retry a POST.
      if(!response.ok)throw body?uncertain():new AgendaError('UNAVAILABLE','No pudimos consultar la agenda. Inténtalo de nuevo.');
      return await response.json();
    }catch(error){if(error instanceof AgendaError)throw error;throw body?uncertain():new AgendaError('UNAVAILABLE','No pudimos consultar la agenda. Inténtalo de nuevo.');}
  }
  async function availability(offset=0) {
    if(!Number.isInteger(offset)||offset<0||offset>2)throw new AgendaError('BAD_MONTH','Mes no disponible.',400);
    const info=await api(`/book/${SLUG}?timezone=${encodeURIComponent(TZ)}`);
    if(offset>0){const page=await api(`/book/availability-page/${SLUG}?timezone=${encodeURIComponent(TZ)}&monthOffset=${offset}`);info.linkAvailability=page.linkAvailability;if(page.allUsersBusyTimes?.some(u=>u.isOffline))info.isOffline=true;}
    return normalize(info,now());
  }
  async function book(input) {
    if(!token||!store)throw new AgendaError('NOT_CONFIGURED','La agenda no está disponible en este momento.');
    const v=validate(input,now());
    const fingerprint=hash(JSON.stringify([v.firstName,v.lastName,v.email,v.start]));
    const requestKey='requests/'+hash(v.requestId);
    const prior=await store.get(requestKey,{type:'json'});
    if(prior){
      if(prior.fingerprint!==fingerprint)throw new AgendaError('CONFLICT','Vuelve a elegir tu horario.',409);
      if(prior.state==='confirmed')return prior.result;
      throw uncertain();
    }
    const live=await availability(offsetFor(v.start,now()));
    if(!live.slots.some(s=>s.start===v.start))throw new AgendaError('OCCUPIED','Ese horario ya no está disponible. Elige otro.',409);
    const record={state:'pending',fingerprint,createdAt:now()};
    // Atomic conditions survive concurrent requests, cold starts and deploys.
    const claim=await store.setJSON(requestKey,record,{onlyIfNew:true});
    if(!claim.modified)throw new AgendaError('PENDING','Estamos comprobando tu reserva. Espera un momento.',409);
    // A refreshed page may generate another request ID; still prevent repeating
    // an ambiguous reservation for the same person and time. No PII in keys.
    const duplicateKey='slots/'+hash(JSON.stringify([v.email,v.start]));
    const unique=await store.setJSON(duplicateKey,{createdAt:now()},{onlyIfNew:true});
    if(!unique.modified)throw uncertain();
    try {
      const response=await api(`/book?timezone=${encodeURIComponent(TZ)}`,{slug:SLUG,firstName:v.firstName,lastName:v.lastName,email:v.email,startTime:new Date(v.start).toISOString(),duration:DURATION,timezone:TZ,locale:'es-mx',formFields:[],legalConsentResponses:[],likelyAvailableUserIds:[]});
      if(response.isOffline!==false||!response.calendarEventId||Date.parse(response.start)!==v.start||Date.parse(response.end)!==v.start+DURATION)throw uncertain();
      let location='';try{const u=new URL(response.location);if(u.protocol==='https:'&&u.hostname==='meet.google.com')location=u.href;}catch{}
      const result={confirmed:true,start:response.start,end:response.end,timezone:TZ,location};
      const saved=await store.setJSON(requestKey,{...record,state:'confirmed',result},{onlyIfMatch:claim.etag});
      if(!saved.modified)throw uncertain();
      return result;
    }catch {throw uncertain();}
  }
  return {availability,book};
}

export function allowedOrigin(request) {
  const origin=request.headers.get('origin');
  if(!origin)return request.method==='GET';
  try{const o=new URL(origin),u=new URL(request.url);return o.origin===u.origin&&o.protocol==='https:'&&(o.hostname==='centralia-sitio.netlify.app'||/^(?:deploy-preview-\d+|codex-contacto-agenda-20261123)--centralia-sitio\.netlify\.app$/.test(o.hostname)||['centraliafinanciera.com','www.centraliafinanciera.com'].includes(o.hostname));}catch{return false;}
}
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function failure(error){return json({code:error instanceof AgendaError?error.code:'UNAVAILABLE',message:error instanceof AgendaError?error.message:'La agenda no está disponible en este momento.'},error instanceof AgendaError?error.status:503);}
