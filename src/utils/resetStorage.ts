// Storage reset utility for debugging
export const resetAllStorage = async () => {
  try {
    // Clear localStorage
    localStorage.clear()
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Clear IndexedDB databases
    if (typeof indexedDB !== 'undefined') {
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          console.log('Deleting database:', db.name)
          indexedDB.deleteDatabase(db.name)
        }
      }
    }
    
    console.log('✅ All storage cleared')
    return true
  } catch (error) {
    console.error('❌ Failed to clear storage:', error)
    return false
  }
}

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).resetStorage = resetAllStorage
}