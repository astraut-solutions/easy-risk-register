import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getSupabaseClient, getSupabaseEnv } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { Button, Input, Modal } from '../../design-system'
import { useToast } from '../feedback/ToastProvider'
import { trackEvent } from '../../utils/analytics'

type AuthMode = 'sign_in' | 'sign_up'

export function AuthControls() {
  const toast = useToast()
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const workspaceName = useAuthStore((s) => s.workspaceName)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const firstItemRef = useRef<HTMLButtonElement | null>(null)

  const supabaseConfigured = Boolean(getSupabaseEnv())

  const workspaceLabel = useMemo(() => {
    if (status !== 'authenticated') return null
    return workspaceName || 'Personal'
  }, [status, workspaceName])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setError(null)
    setBusy(false)
    setMode('sign_in')
  }, [setIsModalOpen, setError, setBusy, setMode])

  useEffect(() => {
    if (!isMenuOpen) return
    firstItemRef.current?.focus()
  }, [isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      const container = menuRef.current
      if (container && !container.contains(target)) setIsMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

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
        <div className="relative" ref={menuRef}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={`min-w-[96px] justify-between border border-border-strong ${isMenuOpen ? 'bg-brand-primary-light/40 ring-4 ring-brand-primary/15' : ''}`}
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-controls={isMenuOpen ? 'auth-menu' : undefined}
          >
            <span className="inline-flex items-center gap-2">
              Account
              <svg
                className={`h-4 w-4 opacity-70 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Button>

          {isMenuOpen ? (
            <div
              id="auth-menu"
              role="menu"
              aria-label="Account menu"
              className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-border-faint bg-surface-primary p-1 shadow-card-soft"
            >
              <div className="px-2 py-2 text-xs text-text-low" role="presentation">
                <p>Signed in</p>
                {user?.email ? <p className="truncate">{user.email}</p> : null}
                {workspaceLabel && workspaceLabel !== 'Personal' ? (
                  <p className="truncate">Workspace: {workspaceLabel}</p>
                ) : null}
              </div>
              <div className="my-1 border-t border-border-faint" role="presentation" />
              <button
                ref={firstItemRef}
                role="menuitem"
                type="button"
                className="w-full rounded-xl px-2 py-1 text-left text-sm font-semibold text-text-high transition hover:bg-surface-secondary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20"
                onClick={() => {
                  setIsMenuOpen(false)
                  void signOut()
                }}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="min-w-[96px] justify-between"
        onClick={() => {
          setIsModalOpen(true)
          trackEvent('auth_modal_open', { mode: 'sign_in' })
        }}
        disabled={!supabaseConfigured}
      >
        <span className="inline-flex items-center gap-2">
          Sign in
          <svg
            className="h-4 w-4 opacity-70"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
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
            Supabase is not configured. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or the legacy `VITE_SUPABASE_ANON_KEY`) in `easy-risk-register-frontend/.env`.
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

