import { redirect } from 'next/navigation'

// Root redirect — send users to /generate (authenticated) or /login
export default function RootPage() {
  redirect('/generate')
}
