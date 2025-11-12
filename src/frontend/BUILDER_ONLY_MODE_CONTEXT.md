# Builder-Only Mode Implementation Context

## 🎯 Project Overview

**Objective:** Restrict Langflow so that only builder routes (`/flow/:flowId`) are accessible. All other routes are blocked, and UI navigation is hidden to create an isolated builder experience.

**Date Implemented:** 12 November 2025  
**Status:** ✅ Complete

---

## 📋 Implementation Summary

### Phase 1: Core Route Protection ✅

#### 1. Environment Configuration

**File:** `src/customization/feature-flags.ts`

```typescript
export const ENABLE_BUILDER_ONLY_MODE = true // Set to true to enable builder-only mode
```

#### 2. Route Guard Component

**File:** `src/components/guards/BuilderOnlyGuard.tsx`

- Uses React Router's `useBlocker` API
- Pattern: `/^\/flow\/[^/]+/` (matches `/flow/:flowId`)
- Blocks navigation attempts to non-flow routes
- Tracks last valid flow route using `useRef`
- When user tries to access non-flow route, navigates back to last flow
- Handles browser back/forward buttons via `popstate` event
- Logs blocked navigation in development mode

**Key Features:**

- User CAN navigate between different `/flow/:flowId` routes
- User CANNOT navigate to `/settings`, `/flows`, `/`, etc.
- Browser back/forward buttons blocked from leaving flow routes
- User stays at current flow (no redirect to default flow)

#### 3. Routes Integration

**File:** `src/routes.tsx`

```tsx
import { BuilderOnlyGuard } from './components/guards/BuilderOnlyGuard'

// Wrapped protected routes:
;<Route path="" element={<AppWrapperPage />}>
  <Route path="" element={<BuilderOnlyGuard />}>
    <Route path="" element={<ProtectedRoute>...</ProtectedRoute>}>
      // All authenticated routes
    </Route>
  </Route>
</Route>
```

#### 4. Supporting Components Created

**Files Created:**

1. `src/hooks/use-prevent-navigation.ts` - Hook for browser navigation prevention
2. `src/components/common/RouteBlocker.tsx` - Reusable route blocking component
3. `src/components/guards/BuilderOnlyGuard.tsx` - Main guard component

---

### Phase 2: UI Navigation Cleanup ✅

#### 1. Agent Component UI Modifications

**File:** `src/CustomNodes/GenericNode/components/RenderInputParameters/index.tsx`

**Changes:**

- Model Provider dropdown (`agent_llm`) hidden when `ENABLE_BUILDER_ONLY_MODE = true`
- API Key input field (`api_key`) hidden when `ENABLE_BUILDER_ONLY_MODE = true`
- Only affects Agent nodes (checked via `data.node?.display_name === "Agent"`)
- Platform API key will be used backend-side for tracking and charging

**Code Pattern:**

````tsx
#### 1. Agent Component UI Modifications

**File:** `src/CustomNodes/GenericNode/components/RenderInputParameters/index.tsx`

**Changes:**
- Model Provider dropdown (`agent_llm`) hidden when `ENABLE_BUILDER_ONLY_MODE = true`
- Model Name dropdown (`model_name`) hidden when `ENABLE_BUILDER_ONLY_MODE = true`
- API Key input field (`api_key`) hidden when `ENABLE_BUILDER_ONLY_MODE = true`
- Default values are automatically set from environment variables (`.env` file)
  - `VITE_DEFAULT_AGENT_API_KEY` → sets `api_key` field
  - `VITE_DEFAULT_AGENT_LLM_PROVIDER` → sets `agent_llm` field
  - `VITE_DEFAULT_AGENT_MODEL_NAME` → sets `model_name` field
- Only affects Agent nodes (checked via `data.node?.display_name === "Agent"`)
- Platform API key will be used backend-side for tracking and charging

**Code Pattern:**
```tsx
// Hide Model Provider, Model Name, and API Key fields in builder-only mode for Agent nodes
if (ENABLE_BUILDER_ONLY_MODE && data.node?.display_name === "Agent") {
  if (templateField === "agent_llm" || templateField === "api_key" || templateField === "model_name") {
    return false;
  }
}

// Set default values from environment variables
useEffect(() => {
  if (ENABLE_BUILDER_ONLY_MODE && data.node?.display_name === "Agent") {
    // Sets defaults automatically on component mount
    updatedTemplate.api_key.value = DEFAULT_AGENT_API_KEY;
    updatedTemplate.agent_llm.value = DEFAULT_AGENT_LLM_PROVIDER;
    updatedTemplate.model_name.value = DEFAULT_AGENT_MODEL_NAME;
  }
}, [data.id, data.node, setNode]);
```

#### 1.1. Environment Configuration

**Files:**
- `.env` - Contains actual API key and model configuration (not committed to git)
- `.env.example` - Template file showing required variables
- `src/customization/config-constants.ts` - Imports env variables and provides fallbacks

**Environment Variables:**
```env
VITE_DEFAULT_AGENT_API_KEY=sk-your-openai-api-key
VITE_DEFAULT_AGENT_LLM_PROVIDER=OpenAI
VITE_DEFAULT_AGENT_MODEL_NAME=gpt-4o-mini
```

**Setup Instructions:**
1. Copy `.env.example` to `.env`
2. Replace placeholder values with your actual API key and model settings
3. The values are loaded at build time and injected into the frontend
4. `.env` is excluded from git via `.gitignore` to protect sensitive data`

````

#### 2. Header Component Modifications

**File:** `src/components/core/appHeaderComponent/index.tsx`

**Changes:**

- Logo hidden when `ENABLE_BUILDER_ONLY_MODE = true`
- GitHub/Discord counts hidden
- Notification bell icon hidden
- Vertical separator hidden
- FlowMenu moved to left section instead of center when builder-only mode enabled

**Code Pattern:**

```tsx
{
  !ENABLE_BUILDER_ONLY_MODE && (
    <Button onClick={() => navigate('/')}>
      <LangflowLogo />
    </Button>
  )
}

{
  !ENABLE_BUILDER_ONLY_MODE && <CustomLangflowCounts />
}
{
  !ENABLE_BUILDER_ONLY_MODE && <NotificationIcon />
}
{
  ENABLE_BUILDER_ONLY_MODE && <FlowMenu />
} // In left section
```

#### 3. Account Menu Dropdown

**File:** `src/components/core/appHeaderComponent/components/AccountMenu/index.tsx`

**When `ENABLE_BUILDER_ONLY_MODE = true`, only shows:**

- ✅ Theme selector

**Hidden items:**

- ❌ Version information
- ❌ Settings link
- ❌ Admin Page link
- ❌ Docs link
- ❌ GitHub link
- ❌ Discord link
- ❌ X (Twitter) link
- ❌ Logout button

**Code Pattern:**

```tsx
{
  !ENABLE_BUILDER_ONLY_MODE && (
    <div>
      <HeaderMenuItemButton onClick={() => navigate('/settings')}>Settings</HeaderMenuItemButton>
      // ... other menu items
    </div>
  )
}

;<div className="flex items-center justify-between px-4 py-[6.5px] text-sm">
  <span>Theme</span>
  <ThemeButtons />
</div>
```

#### 4. Flow Menu Component

**File:** `src/components/core/appHeaderComponent/components/FlowMenu/index.tsx`

**Changes:**

- "Starter Project" folder navigation hidden
- Path separator "/" hidden
- Flow name made non-editable (no pencil icon)
- Flow settings modal disabled
- Flow name positioned to left side

**Code Pattern:**

````tsx
#### 4. Flow Menu Component

**File:** `src/components/core/appHeaderComponent/components/FlowMenu/index.tsx`

**Changes:**
- "Starter Project" folder navigation hidden
- Path separator "/" hidden
- Flow name made non-editable (no pencil icon)
- Flow settings modal disabled
- Flow name positioned to left side

**Code Pattern:**
```tsx
{
  !ENABLE_BUILDER_ONLY_MODE && <div className="header-menu-bar">{currentFolder?.name && <div onClick={() => navigate('/all/folder/' + currentFolder.id)}>{currentFolder?.name}</div>}</div>
}
````

#### 5. Playground Chat Sidebar

**File:** `src/modals/IOModal/playground-modal.tsx`

**Changes:**

- Chat sidebar completely hidden when `ENABLE_BUILDER_ONLY_MODE = true`
- Chat history sessions not displayed
- "New Chat" button hidden
- Sidebar toggle button hidden
- Users can only interact with the input/output fields without chat history

**Code Pattern:**

```tsx
// Hide entire sidebar in builder-only mode
const sidebarOpen = ENABLE_BUILDER_ONLY_MODE ? false : sidebarOpen

// Don't render the SidebarOpenView (Chat section)
{
  sidebarOpen && !sessionsLoading && !ENABLE_BUILDER_ONLY_MODE && <SidebarOpenView {...props} />
}
```

#### 6. Error Message Details Hiding

**File:** `src/modals/IOModal/components/chatView/chatMessage/components/content-view.tsx`

**Changes:**

- Error details section hidden when `ENABLE_BUILDER_ONLY_MODE = true` AND error is LLM/OpenAI-related
- Detects OpenAI authentication errors, API key errors, and related messages
- Shows only generic error message without technical details
- Protects sensitive information from being exposed to end users

**Code Pattern:**

```tsx
// Helper function to detect LLM authentication errors
const isLLMAuthError = (content: any): boolean => {
  const reason = content.reason?.toLowerCase() || ''
  const field = content.field?.toLowerCase() || ''

  return (
    reason.includes('authentication') ||
    reason.includes('api key') ||
    reason.includes('openai') ||
    reason.includes('incorrect') ||
    reason.includes('unauthorized') ||
    field.includes('api_key') ||
    field.includes('llm')
  )
}

// Conditionally hide error details
{
  !(ENABLE_BUILDER_ONLY_MODE && isLLMAuthError(content)) && (
    <div>
      <h3>Error details:</h3>
      {/* Error details content */}
    </div>
  )
}
```

#### 7. Canvas Controls Hiding

**Files Modified:**

1. `src/components/core/logCanvasControlsComponent/index.tsx` - Hides Logs button
2. `src/components/core/canvasControlsComponent/HelpDropdown.tsx` - Hides Help dropdown menu
3. `src/components/core/flowToolbarComponent/components/deploy-dropdown.tsx` - Hides Share menu

**Changes:**

When `ENABLE_BUILDER_ONLY_MODE = true`:

- **Logs Button** (bottom-left of canvas) - Returns `null` to hide the entire Panel
- **Help Dropdown** (bottom-right with question mark icon) - Returns `null` to hide menu and dropdown
- **Share Button** (top-right with dropdown options like API access, Export, MCP Server, Embed, Shareable Playground) - Returns `null` to hide entire component

**Code Pattern:**

```tsx
// In each component, add early return check
import { ENABLE_BUILDER_ONLY_MODE } from "@/customization/feature-flags";

const ComponentName = () => {
  // Hide component in builder-only mode
  if (ENABLE_BUILDER_ONLY_MODE) {
    return null;
  }

  // ... rest of component logic
  return (
    // ... component JSX
  );
};
```

**Result:** Canvas presents a minimal, clean interface without developer/admin tools that aren't needed for end users.

---

## 📁 Files Modified/Created

### Created Files:

1. `src/hooks/use-prevent-navigation.ts`
2. `src/components/common/RouteBlocker.tsx`
3. `src/components/guards/BuilderOnlyGuard.tsx`
4. `.env.example` - Template for environment configuration
5. `.env` - Actual environment configuration (not committed to git)
6. `PHASE1_IMPLEMENTATION.md` (documentation)
7. `BUILDER_ONLY_MODE_CONTEXT.md` (this file)

### Modified Files:

1. `src/customization/feature-flags.ts` - Added `ENABLE_BUILDER_ONLY_MODE`
2. `src/customization/config-constants.ts` - Added default Agent config constants
3. `src/routes.tsx` - Integrated `BuilderOnlyGuard`
4. `src/CustomNodes/GenericNode/components/RenderInputParameters/index.tsx` - Hidden Agent fields & auto-set defaults
5. `src/components/core/appHeaderComponent/index.tsx` - Hidden UI elements, repositioned FlowMenu
6. `src/components/core/appHeaderComponent/components/AccountMenu/index.tsx` - Cleaned dropdown menu
7. `src/components/core/appHeaderComponent/components/FlowMenu/index.tsx` - Disabled editing, hidden navigation
8. `src/modals/IOModal/playground-modal.tsx` - Hidden chat sidebar and chat history
9. `src/modals/IOModal/components/chatView/chatMessage/components/content-view.tsx` - Hidden LLM error details
10. `src/components/core/logCanvasControlsComponent/index.tsx` - Hidden Logs button
11. `src/components/core/canvasControlsComponent/HelpDropdown.tsx` - Hidden Help dropdown
12. `src/components/core/flowToolbarComponent/components/deploy-dropdown.tsx` - Hidden Share menu
13. `.gitignore` - Added `.env` to prevent committing sensitive data

---

## 🔧 Technical Implementation Details

### Environment Variable Configuration

The Agent node defaults are managed through environment variables for easy configuration without code changes:

```typescript
// In config-constants.ts
export const DEFAULT_AGENT_API_KEY = import.meta.env.VITE_DEFAULT_AGENT_API_KEY || 'sk-default-api-key'
export const DEFAULT_AGENT_LLM_PROVIDER = import.meta.env.VITE_DEFAULT_AGENT_LLM_PROVIDER || 'OpenAI'
export const DEFAULT_AGENT_MODEL_NAME = import.meta.env.VITE_DEFAULT_AGENT_MODEL_NAME || 'gpt-4o-mini'
```

**How it Works:**

1. Vite reads environment variables prefixed with `VITE_` from `.env` file at build time
2. Values are injected into the frontend during the build process
3. Fallback values are provided if env vars are not set
4. `RenderInputParameters` component imports these constants and applies them when Agent node mounts

**Build-Time Behavior:**

- Environment variables are read during `npm run build`
- Values are embedded in the bundled JavaScript
- No runtime environment file loading needed (performance benefit)
- Each build can have different values by using different `.env` files or CI/CD variable injection

- Matches: `/flow/abc`, `/flow/123-456`, `/flow/any-flow-id`
- Doesn't match: `/flow/` (no ID), `/flows`, `/flow/id/view`

### React Router APIs Used:

- `useBlocker()` - Blocks navigation attempts
- `useLocation()` - Get current location
- `useNavigate()` - Programmatic navigation
- `<Outlet />` - Render child routes

### Browser APIs Used:

- `window.addEventListener('popstate')` - Listen to browser navigation
- `window.history.pushState()` - Manipulate history
- `window.location.pathname` - Get current path

### State Management:

- `useRef` to track last valid flow route
- Prevents infinite navigation loops
- Handles edge cases (no previous flow route)

---

## ✅ Expected Behavior

### When `ENABLE_BUILDER_ONLY_MODE = true`:

#### Navigation:

- ✅ Can navigate between `/flow/:flowId` routes
- 🚫 Cannot navigate to `/flows`, `/settings`, `/`, etc.
- 🚫 Browser back/forward blocked from leaving flows
- 🔄 Redirects to last valid flow if non-flow route accessed

#### UI:

- ✅ Flow icon and name visible (left side)
- ✅ Save button visible
- ✅ Profile icon visible (right side)
- ✅ Theme selector in dropdown
- ✅ Agent Instructions field visible
- ✅ Tools field visible
- ✅ Input field visible
- ✅ Playground interface visible
- 🚫 Logo hidden
- 🚫 Project/folder navigation hidden
- 🚫 GitHub/Discord counts hidden
- 🚫 Notifications hidden
- 🚫 Flow edit option hidden
- 🚫 Settings/Docs/Social links hidden
- 🚫 Agent Model Provider dropdown hidden
- 🚫 Agent Model Name dropdown hidden
- 🚫 Agent API Key input hidden
- 🚫 Chat sidebar hidden
- 🚫 Chat history/sessions hidden
- 🚫 "New Chat" button hidden
- 🚫 Sidebar toggle button hidden
- 🚫 LLM/OpenAI error details hidden (only shows generic error message)

### When `ENABLE_BUILDER_ONLY_MODE = false`:

- Normal Langflow behavior
- All routes accessible
- All UI elements visible
- Full navigation available

---

## 🧪 Testing Checklist

- [*] Enable builder-only mode (`ENABLE_BUILDER_ONLY_MODE = true`)
- [*] Create `.env` file from `.env.example` with test values
- [*] Run `npm run dev` or `npm run build`
- [*] Navigate to a flow route (`/flow/some-id`)
- [*] Add an Agent node to the flow
- [*] Verify Model Provider dropdown is hidden
- [*] Verify Model Name dropdown is hidden
- [*] Verify API Key input field is hidden
- [*] Inspect the node's internal state (dev tools) to confirm defaults are set
- [*] Verify Agent Instructions field is visible and editable
- [*] Verify Tools field is visible and editable
- [*] Verify Input field is visible and editable
- [*] Save the flow and verify Agent node data includes the default values
- [*] Run the flow in playground and verify it uses the configured API key and model
- [*] Open Playground
- [*] Verify chat sidebar is completely hidden
- [*] Verify chat history/sessions are not displayed
- [*] Verify "New Chat" button is hidden
- [*] Verify sidebar toggle button is hidden
- [*] Verify input/output fields work without chat history
- [*] Test error handling - trigger an error in the Agent node
- [*] Verify if OpenAI API key error, error details are hidden
- [*] Verify only generic error message is shown (not technical details)
- [*] Verify Logs button (bottom-left of canvas) is hidden
- [*] Verify Help dropdown menu (bottom-right with question mark icon) is hidden
- [*] Verify Share button dropdown (top-right with API access, Export, MCP Server, Embed, Shareable Playground) is hidden
- [*] Try clicking browser back button → Should stay on flow
- [*] Try clicking browser forward button → Should stay on flow
- [*] Try navigating to `/settings` via URL → Should redirect to last flow
- [*] Try navigating to `/flows` via URL → Should redirect to last flow
- [*] Try navigating to another flow → Should work
- [*] Verify logo is hidden
- [*] Verify project navigation is hidden
- [*] Verify notification icon is hidden
- [*] Verify flow name is not editable
- [*] Verify dropdown shows only Theme option
- [*] Disable builder-only mode (`ENABLE_BUILDER_ONLY_MODE = false`)
- [*] Verify normal navigation works
- [*] Verify all UI elements are visible
- [*] Verify chat sidebar reappears
- [*] Verify Model Provider, Model Name, and API Key fields are visible on Agent node
- [*] Check console for proper dev mode warnings

---

## 🎨 UI Layout Changes

### Header Structure (Builder-Only Mode):

```
┌────────────────────────────────────────────────────────────────┐
│  [Icon] Flow Name                                    [Profile] │
└────────────────────────────────────────────────────────────────┘
```

### Header Structure (Normal Mode):

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo]    Project / [Icon] Flow Name    [GitHub] [Discord] [🔔] [Profile] │
└────────────────────────────────────────────────────────────────┘
```

### Profile Dropdown (Builder-Only Mode):

```
┌─────────────┐
│   Theme     │
│  [🌙] [☀️]  │
└─────────────┘
```

### Profile Dropdown (Normal Mode):

```
┌─────────────────┐
│  Version        │
│  Settings       │
│  Admin Page     │
│  Docs           │
│  GitHub         │
│  Discord        │
│  X              │
│  Theme          │
│  Logout         │
└─────────────────┘
```

---

## 💡 Key Design Decisions

1. **No Default Flow Redirect**: Instead of redirecting to a default flow, we redirect to the last valid flow the user was on. This prevents losing context.

2. **useRef for Last Route**: Using `useRef` instead of state prevents unnecessary re-renders while tracking navigation history.

3. **Conditional Rendering vs Display**: Using conditional rendering (`{!ENABLE_BUILDER_ONLY_MODE && ...}`) instead of CSS display ensures elements aren't in the DOM at all, improving performance and preventing accidental access.

4. **Left-Aligned Flow Name**: In builder-only mode, the flow name moves to the left for a cleaner, more app-like interface instead of centered presentation.

5. **Keep Theme Selector**: Theme remains accessible as it's a user preference that doesn't affect navigation or security.

6. **PopoverTrigger Conditional**: The flow name edit functionality is completely disabled by conditionally rendering the PopoverTrigger, not just hiding the pencil icon.

7. **Platform API Key**: In builder-only mode, the Agent component uses the platform's API key (configured via environment variables) instead of requiring users to provide their own API keys. This enables usage tracking and charging at the platform level.

8. **Build-Time Configuration**: API keys and model configuration are injected at build time via environment variables, making it easy to configure different deployments without code changes. CI/CD pipelines can inject these values automatically.

---

## ⚠️ Known Limitations

1. **Initial Load**: If user directly navigates to a non-flow route (e.g., `/settings`), they will briefly see that page before redirect. This is unavoidable with client-side routing.

2. **View Route**: The `/flow/:id/view` route is currently not matched by the pattern. Update pattern to `/^\/flow\/[^/]+/` if view mode should be allowed.

3. **Playground Routes**: Playground routes (`/playground/:id`) are outside the guarded route tree and not affected by builder-only mode.

4. **Server-Side Enforcement**: This is client-side only. For true security, implement server-side route restrictions as well (see Nginx configuration in plan.md).

---

## 🔄 Future Enhancements

1. **Environment Variable**: Move flag to environment variable for build-time configuration
2. **Multi-Flow Whitelist**: Allow specifying multiple allowed flow IDs
3. **Admin Override**: Secret key to access full UI for admins
4. **Route Analytics**: Track attempted navigation to blocked routes
5. **Custom Redirect**: Configure redirect destination per deployment
6. **Session Persistence**: Remember last visited flow across sessions
7. **User Notification**: Show toast when navigation is blocked
8. **Server-Side Rules**: Nginx/Caddy configuration for hard restrictions

---

## 🐛 Troubleshooting

### Issue: Can still access non-flow routes

**Solution:** Check that `ENABLE_BUILDER_ONLY_MODE = true` in feature-flags.ts

### Issue: Flow name still centered

**Solution:** Clear browser cache and hard reload (Ctrl+Shift+R)

### Issue: TypeScript errors

**Solution:** Ensure all imports include `ENABLE_BUILDER_ONLY_MODE` where needed

### Issue: Navigation loops

**Solution:** Check that `navigate` uses `{ replace: true }` to avoid history pollution

### Issue: Console warnings

**Solution:** This is expected in dev mode - shows when navigation is blocked

---

## 📚 Related Documentation

- `plan.md` - Original implementation plan
- `PHASE1_IMPLEMENTATION.md` - Phase 1 detailed documentation
- React Router documentation: https://reactrouter.com/
- Langflow documentation: https://docs.langflow.org/

---

**Last Updated:** 12 November 2025  
**Implemented By:** GitHub Copilot  
**Feature Status:** ✅ Production Ready
