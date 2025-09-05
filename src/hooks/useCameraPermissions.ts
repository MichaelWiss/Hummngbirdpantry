// useCameraPermissions - encapsulates browser camera permission querying & requesting
// Provides a minimal, testable state machine independent from ZXing implementation.
// Returned API intentionally small so UI/parent component drives when to request.

import { useCallback, useEffect, useRef, useState } from 'react'

type PermissionState = 'granted' | 'denied' | 'prompt' | null

export interface CameraPermissionState {
  status: PermissionState
  isRequesting: boolean
  error: string | null
  instructions: string
}

export interface UseCameraPermissionsResult extends CameraPermissionState {
  requestPermission: () => Promise<MediaStream | null>
  refreshStatus: () => Promise<void>
  resetError: () => void
}

// Internal helper derives human guidance per browser
const deriveInstructions = (ua: string): string => {
  const l = ua.toLowerCase()
  if (l.includes('chrome') && !l.includes('edg')) return 'Click the camera icon in the address bar and choose Allow.'
  if (l.includes('firefox')) return 'Use the site info (lock) icon to allow camera access.'
  if (l.includes('safari') && l.includes('mobile')) return 'Settings > Safari > Camera: Allow for this site.'
  if (l.includes('safari')) return 'Safari > Settings > Websites > Camera: Allow.'
  if (l.includes('edg')) return 'Edge site permissions (lock icon) → Allow camera.'
  return 'Check your browser site permissions to enable the camera.'
}

export const useCameraPermissions = (): UseCameraPermissionsResult => {
  const [status, setStatus] = useState<PermissionState>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const instructionsRef = useRef<string>(deriveInstructions(navigator.userAgent))

  const refreshStatus = useCallback(async () => {
    try {
      if (!navigator.permissions) return
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setStatus(result.state as PermissionState)
    } catch {
      // Permissions API unsupported → leave as null (prompt state unknown)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const requestPermission = useCallback(async (): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API not supported in this browser.')
      setStatus(null)
      return null
    }
    setIsRequesting(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      setStatus('granted')
      setIsRequesting(false)
      return stream
    } catch (e: any) {
      setIsRequesting(false)
      if (e?.name === 'NotAllowedError') {
        setStatus('denied')
        setError('Camera permission denied. ' + instructionsRef.current)
      } else if (e?.name === 'NotFoundError') {
        setStatus(null)
        setError('No camera device found.')
      } else if (e?.name === 'NotReadableError') {
        setError('Camera is busy (used by another application).')
      } else {
        setError(e?.message || 'Failed to access camera.')
      }
      return null
    }
  }, [])

  const resetError = useCallback(() => setError(null), [])

  return {
    status,
    isRequesting,
    error,
    instructions: instructionsRef.current,
    requestPermission,
    refreshStatus,
    resetError
  }
}

// Re-export minimal PermissionName for TS consumers (local definition to avoid lib DOM union issues)
type PermissionName = 'camera'

export default useCameraPermissions