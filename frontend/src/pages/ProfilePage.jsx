import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { profilesAPI } from '../services/api'
import { useAuthStore } from '../store'

const ProfilePage = ({ userType }) => {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const [profile, setProfile] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user?.id) fetchProfile()
  }, [user])

  async function fetchProfile(){
    try{
      const res = await profilesAPI.getStudentProfile(user.id)
      setProfile(res.data)
    }catch(e){
      console.error(e)
    }
  }

  async function onPhotoChange(e){
    const f = e.target.files[0]
    if (!f) return
    const allowed = ['image/jpeg','image/png','image/webp']
    if (!allowed.includes(f.type)) return setMessage('Only JPG/PNG/WebP allowed')
    if (f.size > 2*1024*1024) return setMessage('Max 2MB')
    setPhotoFile(f)
  }

  async function uploadPhoto(){
    if (!photoFile) return
    setLoading(true)
    setMessage('')
    const bucket = 'profile-photos'
    const filename = `${user.id}/${Date.now()}_${photoFile.name}`
    try{
      const { data, error } = await supabase.storage.from(bucket).upload(filename, photoFile, { upsert: false })
      if (error) throw error
      // Get public URL
      const { publicURL, error: urlErr } = supabase.storage.from(bucket).getPublicUrl(filename)
      if (urlErr) throw urlErr
      // Update profile via backend
      await profilesAPI.updateStudentProfile(user.id, { photo_url: publicURL })
      setMessage('Photo uploaded')
      fetchProfile()
    }catch(err){
      console.error(err)
      setMessage('Upload failed')
    }finally{
      setLoading(false)
    }
  }

  async function submitProfile(e){
    e.preventDefault()
    setLoading(true)
    try{
      const payload = {
        phone: e.target.phone.value,
        location: e.target.location.value,
        bio: e.target.bio.value,
        education: e.target.education.value,
        college: e.target.college.value,
        expected_salary: e.target.expected_salary.value || null
      }
      await profilesAPI.updateStudentProfile(user.id, payload)
      setMessage('Profile updated')
    }catch(err){
      console.error(err)
      setMessage('Failed')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      {profile && (
        <div className="mb-4">
          <img src={profile.photo_url || '/default-avatar.png'} alt="photo" className="w-24 h-24 rounded" />
          <div className="mt-2">{profile.full_name || user?.email}</div>
          <div className="text-sm text-gray-500">Aadhaar status: {profile.aadhaar_verification_status || 'not_submitted'}</div>
        </div>
      )}

      <div className="mb-4">
        <label className="block">Upload passport-size photo (JPG/PNG/WebP, max 2MB)</label>
        <input type="file" accept="image/*" onChange={onPhotoChange} />
        <button onClick={uploadPhoto} disabled={loading || !photoFile} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Upload Photo</button>
      </div>

      <form onSubmit={submitProfile} className="space-y-3">
        <div>
          <label>Phone</label>
          <input name="phone" defaultValue={profile?.phone || ''} className="w-full" />
        </div>
        <div>
          <label>Location</label>
          <input name="location" defaultValue={profile?.location || ''} className="w-full" />
        </div>
        <div>
          <label>Education</label>
          <input name="education" defaultValue={profile?.education || ''} className="w-full" />
        </div>
        <div>
          <label>College</label>
          <input name="college" defaultValue={profile?.college || ''} className="w-full" />
        </div>
        <div>
          <label>Expected Salary (INR)</label>
          <input name="expected_salary" defaultValue={profile?.expected_salary || ''} className="w-full" />
        </div>
        <div>
          <label>Bio</label>
          <textarea name="bio" defaultValue={profile?.bio || ''} className="w-full" />
        </div>
        <div>
          <button type="submit" disabled={loading} className="px-3 py-1 bg-green-600 text-white rounded">Save Profile</button>
        </div>
      </form>

      <div className="mt-4 text-sm text-green-600">{message}</div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Aadhaar Verification</h2>
        <p className="text-sm text-gray-600">Upload Aadhaar only if required. Documents are private and visible to admins for verification only.</p>
        <div>
          <input type="file" id="aadhaarFile" accept="image/*,.pdf" />
          <button onClick={async (e)=>{
            const el = document.getElementById('aadhaarFile')
            const f = el?.files?.[0]
            if(!f) return setMessage('Select file')
            if(f.size > 5*1024*1024) return setMessage('Max 5MB')
            setLoading(true)
            const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''
            const fd = new FormData(); fd.append('file', f)
            try{
              const res = await fetch(`${apiBase}/profiles/student/${user.id}/aadhaar`, { method: 'POST', body: fd, credentials: 'include' })
              const data = await res.json()
              if(!res.ok) throw new Error(data.detail || 'Upload failed')
              setMessage('Aadhaar uploaded and pending verification')
              fetchProfile()
            }catch(err){ setMessage(err.message) }
            setLoading(false)
          }} className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded">Upload Aadhaar (private)</button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
