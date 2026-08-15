import { supabase } from './supabaseClient'
import axios from 'axios'

const getApiBase = () => import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''

export async function signInWithGoogle(){
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/login' }
  })
  if (error) throw error
}

export async function signInWithEmail(email, password){
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const access_token = data?.session?.access_token
  if (!access_token) throw new Error('Supabase did not return an access token.')

  const apiBase = getApiBase()
  const res = await axios.post(`${apiBase}/auth/supabase-login`, { access_token }, { withCredentials: true })
  const appToken = res.data?.access_token
  if (!appToken) return { auth: res.data }

  try {
    const me = await axios.get(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${appToken}` } })
    return { auth: res.data, me: me.data }
  } catch {
    return { auth: res.data }
  }
}

export async function handlePostSignIn(){
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const session = data?.session
  const access_token = session?.access_token
  if (!access_token) return null

  const apiBase = getApiBase()
  const res = await axios.post(`${apiBase}/auth/supabase-login`, { access_token }, { withCredentials: true })
  const appToken = res.data?.access_token
  if (!appToken) return { auth: res.data }

  try{
    const me = await axios.get(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${appToken}` } })
    return { auth: res.data, me: me.data }
  }catch{
    return { auth: res.data }
  }
}

export async function logout(){
  const apiBase = getApiBase()
  try{
    await axios.post(`${apiBase}/auth/logout`, {}, { withCredentials: true })
  }catch(e){
    // ignore
  }
  try { await supabase.auth.signOut() } catch(e) {}
  localStorage.removeItem('token')
  localStorage.removeItem('userType')
  try { window.location.href = '/login' } catch(e){}
}
