// initCamera - deterministic camera initialization helper for BarcodeScanner
// Goals:
//  - Single getUserMedia call (optional preview attachment)
//  - Enumerate devices only after permission granted to get labels (Safari requires user grant)
//  - Choose best device (prefer back camera) without multiple stream opens
//  - Return selected deviceId and (optional) initial preview stream
//  - Enforce timeout so UI can recover if browser stalls
//  - Avoid leaving dangling tracks on failure
//
// This isolates browser-specific quirks so editing the UI component is safer.

export interface InitCameraOptions {
  videoEl?: HTMLVideoElement | null
  timeoutMs?: number
  attachPreview?: boolean // whether to set videoEl.srcObject with the initial stream
  preferBackCamera?: boolean
}

export interface InitCameraResult {
  deviceId: string | null
  stream: MediaStream | null
  error?: string
  timedOut?: boolean
}

const DEFAULT_TIMEOUT = 6000

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

const pickDevice = (devices: MediaDeviceInfo[], preferBack: boolean): string | null => {
  if (!devices.length) return null
  const lower = devices.map(d => ({ d, label: d.label.toLowerCase() }))
  if (preferBack) {
    const back = lower.find(x => /back|rear/.test(x.label))
    if (back) return back.d.deviceId || null
  }
  const first = devices[0]
  return first ? (first.deviceId || null) : null
}

export async function initCamera(opts: InitCameraOptions = {}): Promise<InitCameraResult> {
  const { videoEl, timeoutMs = DEFAULT_TIMEOUT, attachPreview = true, preferBackCamera = true } = opts

  if (!navigator.mediaDevices?.getUserMedia) {
    return { deviceId: null, stream: null, error: 'MEDIA_DEVICES_NOT_SUPPORTED' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let stream: MediaStream | null = null
  try {
    // Use loose typing to avoid TS lib DOM constraint incompatibilities across browsers
    const videoConstraints: any = {
      width: isMobile() ? { ideal: 1280, max: 1920 } : { ideal: 1280, min: 640 },
      height: isMobile() ? { ideal: 720, max: 1080 } : { ideal: 720, min: 480 },
      frameRate: { ideal: 30, min: 15 }
    }
    if (preferBackCamera) {
      // Assign separately to satisfy exactOptionalPropertyTypes
      (videoConstraints as any).facingMode = { ideal: 'environment' }
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints
    })
    if (attachPreview && videoEl) {
      try { videoEl.srcObject = stream } catch {/* ignore */}
    }
  } catch (e: any) {
    clearTimeout(timer)
    if (e?.name === 'NotAllowedError') {
      return { deviceId: null, stream: null, error: 'PERMISSION_DENIED' }
    }
    return { deviceId: null, stream: null, error: e?.message || 'GET_USER_MEDIA_FAILED' }
  }

  // Now enumerate (labels become available post-grant on some browsers)
  let deviceId: string | null = null
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(d => d.kind === 'videoinput')
    deviceId = pickDevice(videoDevices, preferBackCamera && isMobile())
  } catch (e) {
    // Non-fatal; just continue with null
  }

  clearTimeout(timer)
  if (controller.signal.aborted) {
    // Timeout occurred
    if (stream) stream.getTracks().forEach(t => t.stop())
    return { deviceId: null, stream: null, timedOut: true, error: 'CAMERA_INIT_TIMEOUT' }
  }

  return { deviceId, stream }
}

export function releaseStream(stream: MediaStream | null) {
  if (!stream) return
  try { stream.getTracks().forEach(t => t.stop()) } catch {/* ignore */}
}
