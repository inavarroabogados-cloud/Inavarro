import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL?.trim();const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const configured=import.meta.env.VITE_AUTH_READY==='true'&&!!url&&url.startsWith('https://')&&!!key&&key.startsWith('sb_publishable_');
// Managed session and PKCE verifier storage, shared across tabs for email callbacks.
// Passwords, privileged keys and document data are never stored here.
export const supabase=configured?createClient(url!,key!,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}}):null;
export const googleConfigured=import.meta.env.VITE_GOOGLE_LOGIN_ENABLED==='true';
export const PRIVACY_VERSION='2026-10-12-password';
export function client(){if(!supabase)throw new Error('El acceso todavía no está configurado.');return supabase;}
export function check<R extends {data?:unknown;error:{message:string}|null}>(r:R):NonNullable<R['data']>{if(r.error)throw new Error(r.error.message);return r.data as NonNullable<R['data']>;}
