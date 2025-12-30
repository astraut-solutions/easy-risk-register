import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { getSupabaseClient } from '../lib/supabase'
import { apiGetJson } from '../services/apiClient'
import { useAuthStore } from '../stores/authStore'
import { useRiskStore } from '../stores/riskStore'

type ApiUsersResponse = {
  user: { id: string; email: string | null }
  workspaceId: string
  workspaceName?: string | null
}

type ApiSettingsResponse = {
  tooltipsEnabled: boolean
  onboardingDismissed: boolean
  remindersEnabled?: boolean
  remindersSnoozedUntil?: string | null
  updatedAt?: string | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const setMisconfigured = useAuthStore((s) => s.setMisconfigured)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setWorkspace = useAuthStore((s) => s.setWorkspace)
  const clear = useAuthStore((s) => s.clear)
  const status = useAuthStore((s) => s.status)
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setMisconfigured()
      return
    }

    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      const session = data.session
      if (!session?.access_token || !session.user?.id) {
        clear()
        return
      }

      setAuthenticated({
        user: { id: session.user.id, email: session.user.email ?? null },
        accessToken: session.access_token,
      })
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token || !session.user?.id) {
        clear()
        return
      }

      setAuthenticated({
        user: { id: session.user.id, email: session.user.email ?? null },
        accessToken: session.access_token,
      })
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [clear, setAuthenticated, setMisconfigured])

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) return

    let cancelled = false
    void apiGetJson<ApiUsersResponse>('/api/users')
      .then(async (payload) => {
        if (cancelled) return

        setWorkspace({
          workspaceId: payload.workspaceId,
          workspaceName: payload.workspaceName ?? null,
        })

        try {
          const settings = await apiGetJson<ApiSettingsResponse>('/api/settings')
          if (cancelled) return
          if (
            typeof settings?.tooltipsEnabled === 'boolean' ||
            typeof settings?.onboardingDismissed === 'boolean' ||
            typeof settings?.remindersEnabled === 'boolean' ||
            settings?.remindersSnoozedUntil !== undefined
          ) {
            useRiskStore.getState().updateSettings({
              tooltipsEnabled: settings.tooltipsEnabled,
              onboardingDismissed: settings.onboardingDismissed,
              reminders: {
                ...useRiskStore.getState().settings.reminders,
                enabled: typeof settings.remindersEnabled === 'boolean' ? settings.remindersEnabled : useRiskStore.getState().settings.reminders.enabled,
                snoozedUntil:
                  settings.remindersSnoozedUntil === undefined ? useRiskStore.getState().settings.reminders.snoozedUntil : settings.remindersSnoozedUntil,
              },
            })
          }
        } catch {
          // Settings fallback: local defaults/localStorage.
        }
      })
      .catch(() => {
        if (cancelled) return
        setWorkspace({ workspaceId: null, workspaceName: 'Personal' })
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, setWorkspace, status])

  return children
}
