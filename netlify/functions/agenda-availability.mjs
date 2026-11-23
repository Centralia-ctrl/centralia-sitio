import {getStore} from '@netlify/blobs';
import {createAgenda,allowedOrigin,json,failure} from '../lib/agenda.mjs';
export default async function(request){
  if(request.method!=='GET')return json({message:'Método no disponible.'},405);
  if(!allowedOrigin(request))return json({message:'Origen no permitido.'},403);
  try{
    // Check storage availability before offering a bookable calendar. Read only;
    // no contacts or reservations are created while loading availability.
    await getStore({name:'centralia-agenda-v1',consistency:'strong'}).get('health');
    const offset=Number(new URL(request.url).searchParams.get('monthOffset')||0);
    return json(await createAgenda({token:process.env.HUBSPOT_AGENDA_TOKEN}).availability(offset));
  }catch(error){return failure(error);}
}
export const config={path:'/api/agenda/availability',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
