import {getStore} from '@netlify/blobs';
import {createAgenda,allowedOrigin,json,failure} from '../lib/agenda.mjs';
export default async function(request){
  if(request.method!=='POST')return json({message:'Método no disponible.'},405);
  if(!allowedOrigin(request))return json({message:'Origen no permitido.'},403);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return json({message:'Formato no permitido.'},415);
  try{
    const text=await request.text();if(text.length>4096)return json({message:'Solicitud demasiado grande.'},413);
    let input;try{input=JSON.parse(text);}catch{return json({message:'Revisa tus datos.'},400);}
    // Production and approved previews use one ledger: an ambiguous booking
    // must not be repeated when the visitor switches from a preview to the site.
    const store=getStore({name:'centralia-agenda-v1',consistency:'strong'});
    return json(await createAgenda({token:process.env.HUBSPOT_AGENDA_TOKEN,store}).book(input));
  }catch(error){return failure(error);}
}
export const config={path:'/api/agenda/book',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
