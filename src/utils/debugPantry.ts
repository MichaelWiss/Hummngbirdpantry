/**
 * Development utilities for debugging runtime issues
 * This can be run in the browser console to diagnose problems
 */

// @ts-ignore - This is intended for console use
window.debugPantry = {
  // Clear all localStorage data
  clearStorage() {
    localStorage.clear()
    console.log('✅ Cleared all localStorage data')
  },
  
  // Inspect current pantry data
  inspectData() {
    const data = localStorage.getItem('pantry-storage')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        console.log('📊 Current pantry data:', parsed)
        
        // Check for data integrity issues
        if (parsed.state?.items) {
          const issues: string[] = []
          parsed.state.items.forEach((item: any, index: number) => {
            if (!item.status) issues.push(`Item ${index} (${item.name}): missing status`)
            if (!item.tags) issues.push(`Item ${index} (${item.name}): missing tags`)
            if (typeof item.status === 'undefined') issues.push(`Item ${index} (${item.name}): status is undefined`)
          })
          
          if (issues.length > 0) {
            console.warn('⚠️ Data integrity issues found:', issues)
          } else {
            console.log('✅ No data integrity issues found')
          }
        }
      } catch (e) {
        console.error('❌ Failed to parse localStorage data:', e)
      }
    } else {
      console.log('ℹ️ No pantry data in localStorage')
    }
  },
  
  // Force repair all items in storage
  repairStorage() {
    const data = localStorage.getItem('pantry-storage')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        if (parsed.state?.items) {
          parsed.state.items = parsed.state.items.map((item: any) => ({
            ...item,
            status: item.status || 'fresh',
            tags: item.tags || []
          }))
          localStorage.setItem('pantry-storage', JSON.stringify(parsed))
          console.log('✅ Repaired and saved pantry data')
          window.location.reload()
        }
      } catch (e) {
        console.error('❌ Failed to repair storage data:', e)
      }
    }
  },
  
  // Show help
  help() {
    console.log(`
🐛 Pantry Debug Utils:
- debugPantry.clearStorage() - Clear all localStorage
- debugPantry.inspectData() - Show current data and check for issues  
- debugPantry.repairStorage() - Fix data issues and reload
- debugPantry.help() - Show this help

Run these in the browser console to debug the "Cannot read properties of undefined (reading 'replace')" error.
`)
  }
}

console.log('🐛 Pantry debug utilities loaded. Type debugPantry.help() for commands.')

// Export something to make this a module
export {}