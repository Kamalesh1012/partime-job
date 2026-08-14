import { supabase } from './supabaseClient'
import axios from 'axios'

export async function signInWithGoogle(){
  // Redirect to Supabase OAuth flow
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/login' }
  })
  if (error) throw error
}

export async function handlePostSignIn(){
  // After redirect back to /login, exchange Supabase session access_token with backend
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const session = data?.session
  const access_token = session?.access_token
  if (!access_token) return null

  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''
  const res = await axios.post(`${apiBase}/auth/supabase-login`, { access_token }, { withCredentials: true })
  const appToken = res.data?.access_token
  if (!appToken) return { auth: res.data }

  // fetch user info from backend /auth/me
  try{
    const me = await axios.get(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${appToken}` } })
    return { auth: res.data, me: me.data }
  }catch(err){
    return { auth: res.data }
  }
}

export async function logout(){
  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''
  try{
    await axios.post(`${apiBase}/auth/logout`, {}, { withCredentials: true })
  }catch(e){
    // ignore
  }
  localStorage.removeItem('token')
  try { window.location.href = '/login' } catch(e){}
}
