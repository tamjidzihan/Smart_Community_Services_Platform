/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'

// ─── useGeolocation ───────────────────────────────────────────────────────────
export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => { getLocation() }, [getLocation])

  return { location, error, loading, refresh: getLocation }
}

// ─── useWebSocket ─────────────────────────────────────────────────────────────
interface WSOptions {
  onMessage?: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  enabled?: boolean
}

export function useWebSocket(path: string, options: WSOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('closed')
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    if (options.enabled === false || !path) return

    const wsBase = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const host = window.location.host
    const url = `${wsBase}${host}${path}${token ? `?token=${token}` : ''}`

    const ws = new WebSocket(url)
    wsRef.current = ws
    setStatus('connecting')

    ws.onopen = () => {
      setStatus('open')
      options.onOpen?.()
    }
    ws.onmessage = (e) => {
      try {
        options.onMessage?.(JSON.parse(e.data))
      } catch {
        options.onMessage?.(e.data)
      }
    }
    ws.onclose = () => {
      setStatus('closed')
      options.onClose?.()
    }

    return () => { ws.close() }
  }, [path, options.enabled])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { status, send }
}

// ─── useNotificationWS ────────────────────────────────────────────────────────
export function useNotificationWS() {
  const { isAuthenticated } = useAuthStore()
  const { setUnreadCount, incrementUnread } = useNotificationStore()

  useWebSocket('/ws/notifications/', {
    enabled: isAuthenticated,
    onMessage: (data: any) => {
      if (data.type === 'unread_count') setUnreadCount(data.count)
      if (data.type === 'notification') incrementUnread()
    },
  })
}

function useNotificationStore() {
  const store = require('../store/authStore').useNotificationStore
  return store.getState()
}

// ─── useDebounce ──────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initial
    } catch { return initial }
  })

  const set = useCallback((val: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
      window.localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }, [key])

  return [value, set] as const
}
