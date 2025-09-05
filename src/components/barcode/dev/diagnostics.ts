// Development-only camera & barcode diagnostics
// These functions are dynamically imported in dev to avoid bloating production bundles.
// They attach helpers to window for manual console-driven investigation.

/* eslint-disable no-console */

// Minimal local shim for PermissionName to avoid TS lib dependency issues
type PermissionNameShim = 'camera' | 'microphone' | 'geolocation' | 'notifications'

export function registerBarcodeDiagnostics(win: Window) {
  if ((win as any).__HB_DIAGNOSTICS__) return // prevent double registration (HMR)

  // ---- Safari Camera Test ----
  async function testSafariCamera() {
    console.log('🧭 Safari Camera Test Starting...')
    console.log('====================================')
    console.log('🔍 SYSTEM INFO:')
    console.log('   URL:', win.location.href)
    console.log('   Protocol:', win.location.protocol)
    console.log('   Hostname:', win.location.hostname)
    console.log('   User Agent:', win.navigator.userAgent)
    console.log('')

    try {
      console.log('Test 1 - Secure Context:', win.isSecureContext)
      if (!win.isSecureContext) {
        console.log('   ❌ NOT SECURE - Safari blocks camera on HTTP!')
        console.log('   💡 SOLUTION: Use HTTPS or localhost')
      }

      console.log('Test 2 - In iFrame:', win !== win.top)
      if (win !== win.top) console.log('   ❌ IN IFRAME - Safari blocks camera in iframes!')

      console.log('Test 3 - navigator.mediaDevices exists:', !!win.navigator.mediaDevices)
      if (!win.navigator.mediaDevices) {
        console.log('   ❌ MEDIA DEVICES API UNAVAILABLE')
        return { success: false, reason: 'navigator.mediaDevices undefined' }
      }

      console.log('Test 4 - getUserMedia exists:', !!win.navigator.mediaDevices.getUserMedia)
      console.log('Test 5 - enumerateDevices exists:', !!win.navigator.mediaDevices.enumerateDevices)
      console.log('Test 6 - Available methods:', win.navigator.mediaDevices && Object.getOwnPropertyNames(win.navigator.mediaDevices))

      console.log('Test 7 - Attempting getUserMedia...')
      try {
        const stream = await win.navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        })
        console.log('✅ getUserMedia SUCCESS!')
        stream.getTracks().forEach(t => t.stop())
        return { success: true }
      } catch (gumError: any) {
        console.log('❌ getUserMedia FAILED:', gumError.name, gumError.message)
        return { success: false, error: gumError.name }
      }
    } catch (error) {
      console.error('🧭 Safari test failed:', error)
      return { success: false, error: 'test_failed', details: error }
    }
  }

  // ---- Firefox Camera Test ----
  async function testFirefoxCamera() {
    console.log('🦊 Firefox Camera Test Starting...')
    try {
      console.log('Test 1 - Secure Context:', win.isSecureContext)
      console.log('Test 2 - navigator.mediaDevices exists:', !!win.navigator.mediaDevices)
      if (win.navigator.mediaDevices) {
        console.log('Test 3 - getUserMedia exists:', !!win.navigator.mediaDevices.getUserMedia)
        console.log('Test 4 - enumerateDevices exists:', !!win.navigator.mediaDevices.enumerateDevices)
        console.log('Test 5 - Attempting getUserMedia...')
        try {
          const stream = await win.navigator.mediaDevices.getUserMedia({ video: true })
          console.log('✅ getUserMedia SUCCESS!')
          stream.getTracks().forEach(t => t.stop())
        } catch (gumError: any) {
          console.log('❌ getUserMedia FAILED:', gumError.name, gumError.message)
        }
      }
    } catch (error) {
      console.error('🦊 Firefox test failed:', error)
    }
  }

  // ---- Chrome Camera Diagnostic ----
  async function diagnoseChromeCamera() {
    console.log('🔧 CHROME CAMERA DIAGNOSTIC')
    console.log('===========================')
    console.log('📱 Basic API Check:')
    console.log(`   navigator.mediaDevices: ${!!win.navigator.mediaDevices}`)
    console.log(`   getUserMedia: ${!!(win.navigator.mediaDevices && win.navigator.mediaDevices.getUserMedia)}`)
    if (win.navigator.permissions) {
      try {
  const result = await win.navigator.permissions.query({ name: 'camera' as PermissionNameShim })
        console.log(`   Camera permission: ${result.state}`)
      } catch (e) {
        console.log(`   Permission check failed: ${e}`)
      }
    }
  }

  // ---- Safari Debug Utility ----
  async function debugSafariCamera() {
    console.log('🔧 SAFARI CAMERA DEBUG UTILITY')
    console.log('==============================')
    console.log(`   Secure Context: ${win.isSecureContext}`)
    console.log(`   User Agent: ${win.navigator.userAgent}`)
  }

  // ---- Generic Camera Diagnostic ----
  async function diagnoseCamera() {
    console.log('🔍 Camera Diagnostic Report')
    console.log('==========================')
    const hasMD = !!win.navigator.mediaDevices
    console.log(`MediaDevices: ${hasMD}`)
  }

  // Expose helpers on window for manual debugging
  Object.assign(win as any, {
    testSafariCamera,
    testFirefoxCamera,
    diagnoseChromeCamera,
    debugSafariCamera,
    diagnoseCamera
  })

  ;(win as any).__HB_DIAGNOSTICS__ = true
  console.log('[diagnostics] Barcode diagnostics helpers registered.')
}

export default registerBarcodeDiagnostics
