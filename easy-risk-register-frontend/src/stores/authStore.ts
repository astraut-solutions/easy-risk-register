import { create } from 'zustand'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'misconfigured'

export type AuthUser = {
  id: string
  email: string | null
}

type AuthState = {
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
  workspaceId: string | null
  workspaceName: string | null
  setMisconfigured: () => void
  setAuthenticated: (params: { user: AuthUser; accessToken: string }) => void
  setWorkspace: (params: { workspaceId: string | null; workspaceName?: string | null }) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  workspaceId: null,
  workspaceName: null,
  setMisconfigured: () =>
    set({
      status: 'misconfigured',
      user: null,
      accessToken: null,
      workspaceId: null,
      workspaceName: null,
    }),
  setAuthenticated: ({ user, accessToken }) =>
    set({
      status: 'authenticated',
      user,
      accessToken,
    }),
  setWorkspace: ({ workspaceId, workspaceName }) =>
    set({
      workspaceId,
      workspaceName: workspaceName ?? null,
    }),
  clear: () =>
    set({
      status: 'unauthenticated',
      user: null,
      accessToken: null,
      workspaceId: null,
      workspaceName: null,
    }),
}))
