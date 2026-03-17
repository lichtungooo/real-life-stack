import { useEffect, useMemo, useState } from "react"
import type { AuthState, User } from "@real-life-stack/data-interface"
import { isAuthenticatable, hasProfile } from "@real-life-stack/data-interface"
import { useConnector } from "./connector-context"

function useAuthConnector() {
  const connector = useConnector()
  if (!isAuthenticatable(connector)) {
    throw new Error("Connector does not support authentication")
  }
  return connector
}

export function useAuthState() {
  const connector = useAuthConnector()
  const observable = connector.getAuthState()
  const [data, setData] = useState<AuthState>(observable.current)

  useEffect(() => observable.subscribe(setData), [observable])

  return data
}

export function useCurrentUser() {
  const connector = useAuthConnector()
  const [data, setData] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initial load
  useEffect(() => {
    connector.getCurrentUser().then((user) => {
      setData(user)
      setIsLoading(false)
    })
  }, [connector])

  // Reactive: subscribe to profile changes if supported
  const profileObservable = useMemo(
    () => hasProfile(connector) ? connector.observeMyProfile() : null,
    [connector]
  )

  useEffect(() => {
    if (!profileObservable) return
    return profileObservable.subscribe((profile) => {
      if (profile) {
        setData((prev) => prev ? {
          ...prev,
          displayName: (profile.data.name as string) ?? prev.displayName,
          avatarUrl: (profile.data.avatar as string) ?? prev.avatarUrl,
        } : prev)
      }
    })
  }, [profileObservable])

  return { data, isLoading }
}
