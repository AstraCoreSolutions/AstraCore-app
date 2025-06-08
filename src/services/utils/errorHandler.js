import { debugError } from '../../utils/helpers'

/**
 * Handle API errors consistently
 */
export const handleApiError = (error, context = 'API operation') => {
  debugError(`${context}:`, error)
  
  let message = 'Došlo k neočekávané chybě'
  
  if (error.message) {
    if (error.message.includes('duplicate key')) {
      message = 'Záznam s těmito údaji již existuje'
    } else if (error.message.includes('foreign key')) {
      message = 'Nelze smazat - záznam je používán jinde'
    } else if (error.message.includes('not found')) {
      message = 'Záznam nebyl nalezen'
    } else if (error.message.includes('permission')) {
      message = 'Nemáte oprávnění k této operaci'
    } else {
      message = error.message
    }
  }
  
  return { data: null, error: message }
}
