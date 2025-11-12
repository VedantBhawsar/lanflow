import { useEffect, useRef } from "react";
import { Outlet, useBlocker, useLocation, useNavigate } from "react-router-dom";
import { ENABLE_BUILDER_ONLY_MODE } from "../../customization/feature-flags";

// Pattern that matches /flow/:flowId routes
const ALLOWED_FLOW_PATTERN = /^\/flow\/[^/]+/;

/**
 * Wrapper component that blocks navigation away from /flow/:flowId routes
 * when builder-only mode is enabled.
 */
export const BuilderOnlyGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lastValidFlowRoute = useRef<string | null>(null);

  // Track the last valid flow route
  const currentPath = location.pathname;
  const isCurrentValid = ALLOWED_FLOW_PATTERN.test(currentPath);

  useEffect(() => {
    if (isCurrentValid) {
      lastValidFlowRoute.current = currentPath;
    }
  }, [currentPath, isCurrentValid]);

  // Block rendering of non-flow routes when builder-only mode is enabled
  useEffect(() => {
    if (ENABLE_BUILDER_ONLY_MODE && !isCurrentValid) {
      console.warn(
        "[BuilderOnlyGuard] Blocked access to non-flow route:",
        currentPath
      );

      // Navigate back to the last valid flow route if available
      if (lastValidFlowRoute.current) {
        navigate(lastValidFlowRoute.current, { replace: true });
      } else {
        // If no previous flow route, go back in history
        navigate(-1);
      }
    }
  }, [currentPath, isCurrentValid, navigate]);

  // Block navigation attempts to non-flow routes
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!ENABLE_BUILDER_ONLY_MODE) return false;

    const currentPath = currentLocation.pathname;
    const nextPath = nextLocation.pathname;

    // Check if paths are valid flow routes
    const isCurrentValid = ALLOWED_FLOW_PATTERN.test(currentPath);
    const isNextValid = ALLOWED_FLOW_PATTERN.test(nextPath);

    // Block if we're on a valid flow route trying to go to a non-flow route
    return isCurrentValid && !isNextValid;
  });

  // Log blocking attempts in development
  useEffect(() => {
    if (blocker.state === "blocked" && process.env.NODE_ENV === "development") {
      console.warn(
        "[BuilderOnlyGuard] Navigation blocked - builder-only mode is enabled",
        {
          attempted: blocker.location?.pathname,
          current: location.pathname,
        },
      );
    }
  }, [blocker.state, blocker.location, location.pathname]);

  // Handle browser back/forward navigation
  useEffect(() => {
    if (!ENABLE_BUILDER_ONLY_MODE) return;

    const isCurrentValid = ALLOWED_FLOW_PATTERN.test(location.pathname);
    if (!isCurrentValid) return;

    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (!ALLOWED_FLOW_PATTERN.test(newPath)) {
        // Prevent navigation away from flow route
        navigate(location.pathname, { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [location.pathname, navigate]);

  return <Outlet />;
};
