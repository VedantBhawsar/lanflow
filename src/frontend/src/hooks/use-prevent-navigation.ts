import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Hook to prevent navigation away from allowed routes.
 * When enabled, blocks navigation to non-matching routes and keeps user at current location.
 *
 * @param enabled - Whether the navigation prevention is active
 * @param allowedPattern - Regex pattern for allowed routes (e.g., /^\/flow\/[^/]+/)
 */
export const usePreventNavigation = (enabled: boolean, allowedPattern: RegExp) => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!enabled) return

    // Store the current path to return to if navigation is attempted
    let currentPath = location.pathname

    // Check if current location is valid
    const isCurrentPathValid = allowedPattern.test(currentPath)

    // If we're not on a valid path, we can't block navigation
    // (this would only happen on initial load to an invalid route)
    if (!isCurrentPathValid) {
      return
    }

    // Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      const newPath = window.location.pathname

      if (!allowedPattern.test(newPath)) {
        // Prevent navigation by pushing the current valid path back
        event.preventDefault()
        window.history.pushState(null, '', currentPath)
        navigate(currentPath, { replace: true })
      } else {
        // Update current path if navigation to another valid route
        currentPath = newPath
      }
    }

    // Add state to history to enable popstate detection
    window.history.pushState(null, '', currentPath)

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [enabled, allowedPattern, location.pathname, navigate])
}
