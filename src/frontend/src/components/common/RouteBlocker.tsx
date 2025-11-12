import { useEffect } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router-dom";

interface RouteBlockerProps {
  enabled: boolean;
  allowedPattern: RegExp;
  children: React.ReactNode;
}

/**
 * Component that blocks navigation away from allowed route patterns.
 * Prevents users from navigating to routes that don't match the allowed pattern.
 *
 * @param enabled - Whether route blocking is active
 * @param allowedPattern - Regex pattern for allowed routes (e.g., /^\/flow\/[^/]+/)
 * @param children - Child components to render
 */
export const RouteBlocker: React.FC<RouteBlockerProps> = ({
  enabled,
  allowedPattern,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Block navigation attempts to non-allowed routes
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!enabled) return false;

    const currentPath = currentLocation.pathname;
    const nextPath = nextLocation.pathname;

    // Check if current path is valid
    const isCurrentValid = allowedPattern.test(currentPath);

    // Check if next path is valid
    const isNextValid = allowedPattern.test(nextPath);

    // Only block if:
    // 1. We're currently on a valid path
    // 2. AND we're trying to navigate to an invalid path
    return isCurrentValid && !isNextValid;
  });

  // Log blocking attempts in development
  useEffect(() => {
    if (blocker.state === "blocked" && process.env.NODE_ENV === "development") {
      console.warn(
        "[RouteBlocker] Navigation blocked. Builder-only mode is enabled.",
        {
          attempted: blocker.location?.pathname,
          current: location.pathname,
        },
      );
    }
  }, [blocker.state, blocker.location, location.pathname]);

  // Handle browser back/forward navigation
  useEffect(() => {
    if (!enabled) return;

    const isCurrentValid = allowedPattern.test(location.pathname);
    if (!isCurrentValid) return;

    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (!allowedPattern.test(newPath)) {
        // Stay at current location
        navigate(location.pathname, { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, allowedPattern, location.pathname, navigate]);

  return <>{children}</>;
};
