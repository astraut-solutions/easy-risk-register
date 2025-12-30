import { useMemo, useState } from 'react'

import { getSupabaseClient, getSupabaseEnv } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { Badge, Button, Input, Modal } from '../../design-system'
import { useToast } from '../feedback/ToastProvider'
import { trackEvent } from '../../utils/analytics'

type AuthMode = 'sign_in' | 'sign_up'

export function AuthControls() {
  const toast = useToast()
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const workspaceName = useAuthStore((s) => s.workspaceName)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabaseConfigured = Boolean(getSupabaseEnv())

  const workspaceLabel = useMemo(() => {
    if (status !== 'authenticated') return null
    return workspaceName || 'Personal'
  }, [status, workspaceName])

  const closeModal = () => {
    setIsModalOpen(false)
    setError(null)
    setBusy(false)
    setMode('sign_in')
  }

  const submit = async () => {
    if (!supabaseConfigured) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    setBusy(true)
    setError(null)

    try {
      if (!email.trim() || !password) {
        setError('Email and password are required.')
        return
      }

      if (mode === 'sign_in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          setError(signInError.message)
          return
        }

        trackEvent('auth_sign_in_success', { method: 'password' })
        toast.notify({ title: 'Signed in', variant: 'success' })
        closeModal()
        return
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      const signedIn = Boolean(signUpData?.session?.access_token)
      trackEvent('auth_sign_up_success', { method: 'password', signedIn })
      toast.notify(
        signedIn
          ? { title: 'Account created', description: 'You are now signed in.', variant: 'success' }
          : {
              title: 'Account created',
              description: 'Check your email to confirm your account, then sign in.',
              variant: 'success',
            },
      )
      closeModal()
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    await supabase.auth.signOut()
    trackEvent('auth_sign_out')
    toast.notify({ title: 'Signed out', variant: 'info' })
  }

  if (status === 'authenticated') {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {workspaceLabel ? (
          <Badge tone="brand" subtle className="normal-case tracking-normal">
            Workspace: {workspaceLabel}
          </Badge>
        ) : null}
        <Button type="button" size="sm" variant="ghost" onClick={signOut}>
          Sign out{user?.email ? ` (${user.email})` : ''}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => {
          setIsModalOpen(true)
          trackEvent('auth_modal_open', { mode: 'sign_in' })
        }}
        disabled={!supabaseConfigured}
      >
        Sign in
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={mode === 'sign_in' ? 'Sign in' : 'Create account'}
        eyebrow="Authentication"
        description="Use your Supabase user account to access workspace-scoped APIs."
        size="sm"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode((current) => (current === 'sign_in' ? 'sign_up' : 'sign_in'))}
              disabled={busy}
            >
              {mode === 'sign_in' ? 'Need an account?' : 'Have an account?'}
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={closeModal} disabled={busy}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={submit} aria-busy={busy}>
                {mode === 'sign_in' ? 'Sign in' : 'Sign up'}
              </Button>
            </div>
          </div>
        }
      >
        {!supabaseConfigured ? (
          <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm text-text-high">
            Supabase is not configured. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `easy-risk-register-frontend/.env`.
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={busy}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
              disabled={busy}
            />
            {error ? (
              <div className="rounded-2xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger">
                {error}
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </>
  )
}

