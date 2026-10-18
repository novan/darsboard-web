import { redirect } from 'react-router'
import { clearSessionHeaders } from '../lib/backend.server'

export async function loader() {
  return redirect('/')
}

export async function action() {
  return redirect('/login', { headers: await clearSessionHeaders() })
}
