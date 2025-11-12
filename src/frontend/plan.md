# Langflow Builder-Only Mode Implementation Plan

## 🎯 Project Overview

**Objective:** Restrict Langflow to only allow access to builder routes (`/flow/:flowId`), blocking or redirecting all other routes to ensure a focused, isolated builder experience.

**Date Created:** 12 November 2025  
**Status:** Planning Phase

---

## 📋 Requirements Summary

### Access Control

- ✅ **Allow:** `/flow/:flowId` routes only
- 🚫 **Block/Redirect:** All other routes (/, /flows, /settings, /workspace, /login, /docs, etc.)
- 🔄 **Default Redirect:** redirect to previous /flow/:flowId

### User Experience

- Builder interface remains fully functional
- Navigation UI cleaned/hidden
- Browser back button controlled
- Works in both standalone and embedded (iframe) modes

---

## 🏗️ Implementation Tasks

### **Phase 1: Core Route Protection**

#### Task 1.1: Route Guard Implementation

**Priority:** HIGH  
**Estimated Time:** 2-3 hours

**Files to Modify:**

- `src/routes.tsx` (main routing configuration)
- `src/App.tsx` (if route guard needs to wrap the app)

**Implementation Steps:**

1. Analyze current routing structure in `routes.tsx`
2. Create a `RouteGuard` component that:
   - Checks if current path matches `/flow/:flowId` pattern
   - Redirects to default flow if path is not allowed
   - Uses React Router's `Navigate` or `useNavigate`
3. Wrap all route definitions with the guard
4. Add TypeScript types for route patterns

**Acceptance Criteria:**

- [ ] Only `/flow/:flowId` routes are accessible
- [ ] All other routes redirect to default flow
- [ ] No console errors or routing loops
- [ ] TypeScript types are properly defined

**Code Pattern:**

```tsx
const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const isFlowRoute = /^\/flow\/[a-zA-Z0-9-]+/.test(location.pathname)

  if (!isFlowRoute) {
    return <Navigate to="/flow/:oldFlowId" replace />
  }

  return <>{children}</>
}
```

---

#### Task 1.2: Browser Back Button Protection

**Priority:** MEDIUM  
**Estimated Time:** 1-2 hours

**Files to Modify:**

- `src/pages/FlowPage/*` (or main builder page component)
- Create new hook: `src/hooks/use-prevent-navigation.ts`

**Implementation Steps:**

1. Create custom hook `usePreventNavigation`
2. Listen to `popstate` event in useEffect
3. Check if new location is outside `/flow/:flowId`
4. If invalid, push allowed route back to history
5. Integrate hook in main flow page component

**Acceptance Criteria:**

- [ ] Browser back button doesn't navigate away from builder
- [ ] Forward navigation is also controlled
- [ ] Hook is reusable and well-typed
- [ ] No memory leaks (proper cleanup)

**Code Pattern:**

```tsx
const usePreventNavigation = (allowedPattern: RegExp, fallbackRoute: string) => {
  useEffect(() => {
    const handlePopState = () => {
      if (!allowedPattern.test(window.location.pathname)) {
        window.history.pushState(null, '', fallbackRoute)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [allowedPattern, fallbackRoute])
}
```

---

### **Phase 2: UI Navigation Cleanup**

#### Task 2.1: Header Navigation Removal

**Priority:** HIGH  
**Estimated Time:** 2-3 hours

**Files to Investigate:**

- `src/components/` (search for header/navigation components)
- `src/pages/` (check for page-level navigation)
- Layout components in workspace structure

**Implementation Steps:**

1. Search for all navigation components using grep
2. Identify buttons, links, menus that navigate to non-builder routes
3. Conditionally hide or remove these elements
4. Ensure builder-specific actions (save, run, etc.) remain visible
5. Update component props/interfaces if needed

**Acceptance Criteria:**

- [ ] No visible navigation to home, settings, workspace, etc.
- [ ] Builder toolbar remains fully functional
- [ ] Save/Export/Run buttons still work
- [ ] UI is clean without broken layouts

---

#### Task 2.2: Sidebar & Footer Navigation Removal

**Priority:** MEDIUM  
**Estimated Time:** 1-2 hours

**Files to Investigate:**

- `src/components/` (sidebar components)
- Footer components if any
- `src/layouts/` (layout wrappers)

**Implementation Steps:**

1. Locate sidebar navigation components
2. Hide or remove route-changing elements
3. Keep builder-relevant sidebar items (if any)
4. Update footer to remove external links
5. Test responsive layouts

**Acceptance Criteria:**

- [ ] Sidebar doesn't show non-builder navigation
- [ ] Footer is cleaned or hidden
- [ ] Mobile navigation is also restricted
- [ ] No orphaned UI elements

---

### **Phase 3: Environment Configuration**

#### Task 3.1: Environment Variable Setup

**Priority:** MEDIUM  
**Estimated Time:** 1 hour

**Files to Create/Modify:**

- `frontend/.env.example`
- `frontend/.env.development`
- `src/constants/constants.ts` or `src/config/env.ts`

**Implementation Steps:**

1. Add `VITE_BUILDER_ONLY_MODE=true` to env files
2. Create config constant to read env variable
3. Export typed constant for use across app
4. Document in README or .env.example

**Acceptance Criteria:**

- [ ] Environment variable is properly typed
- [ ] Default value is set
- [ ] Variable is accessible throughout app
- [ ] Documentation is clear

**Code Pattern:**

```tsx
// src/config/env.ts
export const config = {
  builderOnlyMode: import.meta.env.VITE_BUILDER_ONLY_MODE === 'true',
  defaultFlowId: 'OldFlowid',
}
```

---

#### Task 3.2: Conditional Route Guard

**Priority:** MEDIUM  
**Estimated Time:** 1 hour

**Files to Modify:**

- Route guard component from Task 1.1
- Navigation components from Phase 2

**Implementation Steps:**

1. Wrap route guard logic with env check
2. Update navigation hiding to use env flag
3. Ensure normal behavior when flag is false
4. Add console warnings in dev mode

**Acceptance Criteria:**

- [ ] When `BUILDER_ONLY_MODE=false`, app works normally
- [ ] When `BUILDER_ONLY_MODE=true`, restrictions apply
- [ ] No breaking changes to existing flows
- [ ] Dev mode shows helpful console messages

---

### **Phase 4: Server-Level Protection (Optional)**

#### Task 4.1: Nginx Configuration

**Priority:** LOW (Optional)  
**Estimated Time:** 1-2 hours

**Files to Create/Modify:**

- `nginx.conf`
- `start-nginx.sh` (if it needs updates)

**Implementation Steps:**

1. Review existing nginx.conf
2. Add rewrite rules for non-flow routes
3. Configure proper 301/302 redirects
4. Test with local nginx setup
5. Document for deployment

**Acceptance Criteria:**

- [ ] Nginx redirects non-builder routes
- [ ] Builder routes pass through correctly
- [ ] Configuration is well-commented
- [ ] Works with Docker setup

**Nginx Pattern:**

```nginx
location / {
    if ($request_uri !~ ^/flow/) {
        rewrite ^.*$ /flow/e8f80771-026d-45e2-8ca1-38eb8a10b746 permanent;
    }
}
```

---

#### Task 4.2: Docker Configuration Updates

**Priority:** LOW (Optional)  
**Estimated Time:** 1 hour

**Files to Review:**

- `Dockerfile`
- `dev.Dockerfile`
- `docker-compose.yml` (if exists)

**Implementation Steps:**

1. Ensure nginx rules work in Docker
2. Add environment variables to Docker setup
3. Update build scripts if needed
4. Test containerized build

**Acceptance Criteria:**

- [ ] Docker build succeeds
- [ ] Environment variables pass through
- [ ] Nginx rules active in container
- [ ] Builder is accessible in Docker

---

## 🧪 Testing Strategy

### Unit Tests

- [ ] Route guard redirects correctly
- [ ] Environment config reads properly
- [ ] Navigation hooks prevent back button
- [ ] TypeScript types are correct

### Integration Tests

- [ ] Full routing flow works
- [ ] UI elements properly hidden
- [ ] Builder remains functional
- [ ] No routing loops occur

### E2E Tests (Playwright)

**Files:** `tests/core/`

- [ ] Test direct navigation to blocked routes
- [ ] Test browser back/forward buttons
- [ ] Test deep linking to builder
- [ ] Test iframe embedding
- [ ] Test with builder-only mode on/off

### Manual Testing Checklist

- [ ] Navigate to `/` → redirects to builder
- [ ] Navigate to `/settings` → redirects to builder
- [ ] Browser back button → stays in builder
- [ ] Deep link `/flow/custom-id` → works
- [ ] Save/Export/Run → all functional
- [ ] Mobile responsive → no broken UI
- [ ] Embedded in iframe → works correctly

---

## 📁 File Structure Changes

### New Files to Create

```
src/
  hooks/
    use-prevent-navigation.ts       # Browser navigation control
  guards/
    RouteGuard.tsx                  # Main route guard component
  config/
    env.ts                          # Environment configuration
```

### Files to Modify

```
src/
  routes.tsx                        # Add route guard
  App.tsx                          # Wrap with guard if needed
  components/                       # Hide navigation elements
    (various navigation components)
  constants/
    constants.ts                    # Add builder-only constants
nginx.conf                          # Add redirect rules
.env.example                        # Document new env var
README.md                           # Update documentation
```

---

## ⚠️ Risks & Considerations

### Technical Risks

1. **Routing Loops:** Guard must use `replace` to avoid history pollution
2. **Memory Leaks:** Event listeners must be cleaned up properly
3. **TypeScript Errors:** Route types may need updates
4. **Build Breaks:** Env variables must be handled correctly in Vite

### User Experience Risks

1. **Broken Bookmarks:** Users may have bookmarked other routes
2. **Lost Navigation:** Need clear UX for accessing builder features
3. **Confusion:** Users might not understand why other routes are blocked

### Mitigation Strategies

- Add console warnings in dev mode
- Create comprehensive documentation
- Provide clear error messages for blocked routes
- Keep feature flag for easy rollback

---

## 🚀 Deployment Plan

### Development Environment

1. Set `VITE_BUILDER_ONLY_MODE=false` by default
2. Test with flag enabled manually
3. Ensure no impact on dev workflow

### Staging Environment

1. Deploy with flag enabled
2. Run full E2E test suite
3. Test iframe embedding
4. Verify nginx rules (if applicable)

### Production Rollout

1. Deploy with flag disabled initially
2. Monitor for issues
3. Enable flag for specific customers/instances
4. Full rollout after validation

---

## 📊 Success Metrics

- [ ] 100% of non-builder routes redirect correctly
- [ ] 0 routing errors in console
- [ ] All existing builder functionality works
- [ ] E2E tests pass with 100% success rate
- [ ] No performance degradation
- [ ] Documentation is complete

---

## 📚 Documentation Updates

### Files to Update

- [ ] `README.md` - Add builder-only mode section
- [ ] `.env.example` - Document VITE_BUILDER_ONLY_MODE
- [ ] Architecture docs (if exists) - Explain routing changes

### New Documentation

- [ ] Setup guide for builder-only mode
- [ ] Nginx configuration guide
- [ ] Troubleshooting guide for route issues

---

## 🔄 Future Enhancements

1. **Multi-Flow Support:** Allow whitelisting multiple flow IDs
2. **Admin Override:** Secret key to access full Langflow UI
3. **Route Analytics:** Track attempted navigation to blocked routes
4. **Custom Redirect:** Configure redirect destination per deployment
5. **Session Persistence:** Remember last visited flow across sessions

---

## 📞 Support & Rollback

### Rollback Plan

1. Set `VITE_BUILDER_ONLY_MODE=false`
2. Remove nginx redirect rules
3. Redeploy previous version if needed

### Support Contacts

- Development Team Lead
- DevOps for nginx/Docker issues
- QA for testing coordination

---

## ✅ Completion Checklist

### Pre-Implementation

- [ ] Plan reviewed and approved
- [ ] Tasks assigned
- [ ] Environment setup complete

### Implementation

- [ ] Phase 1 complete (Route Protection)
- [ ] Phase 2 complete (UI Cleanup)
- [ ] Phase 3 complete (Environment Config)
- [ ] Phase 4 complete (Server Protection - if needed)

### Quality Assurance

- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing complete
- [ ] Code review approved

### Deployment

- [ ] Staging deployment successful
- [ ] Production deployment planned
- [ ] Documentation updated
- [ ] Team trained on new feature

---

## 📝 Notes & Open Questions

1. **Default Flow ID:** Confirm `e8f80771-026d-45e2-8ca1-38eb8a10b746` or make configurable?
2. **Error Handling:** What happens if default flow doesn't exist?
3. **Authentication:** How does this interact with existing auth flows?
4. **Deep Linking:** Do we need special handling for shared flow links?
5. **Analytics:** Should we track when users hit blocked routes?

---

**Last Updated:** 12 November 2025  
**Next Review:** After Phase 1 completion  
**Owner:** Development Team
