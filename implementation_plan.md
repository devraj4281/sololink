# Chat App Fixes Implementation Plan

This document outlines the approach to resolve the three issues you identified: the message input race condition, the inability to minimize the call screen, and accidental page refreshes dropping active calls.

## Proposed Changes

### 1. Message Input Fix (Synchronous Clearing)

#### [MODIFY] [MessageInput.jsx](file:///c:/Users/solod/Documents/chatapp/frontend/src/components/chat/MessageInput.jsx)

- Introduce an `isSubmitting` state to prevent double-clicks.
- In `handleSendMessage`, capture the current `text` and `imagePreview` values into local variables.
- Immediately clear `text`, `imagePreview`, and the DOM input ref **before** `await sendMessage(...)` is called.
- This fully separates the local UI state clearing from the asynchronous network and Zustand state operations.

### 2. Minimized Call Screen

#### [MODIFY] [useCallStore.js](file:///c:/Users/solod/Documents/chatapp/frontend/src/store/useCallStore.js)

- Add `callUIMode: "fullscreen"` to the initial state.
- Add an action `setCallUIMode: (mode) => set({ callUIMode: mode })`.
- Ensure `endCall` resets `callUIMode` to `"fullscreen"`.

#### [NEW] [CallScreenMinimized.jsx](file:///c:/Users/solod/Documents/chatapp/frontend/src/components/calls/CallScreenMinimized.jsx)

- Create a new floating widget component (`fixed bottom-6 right-6 z-[9999]`) specifically for the minimized state.
- Will display the active participant's name, call type, a mute/unmute toggle, an end call button, and a "Maximize" button.
- If it's a video call, it will include a small PIP element displaying the remote stream.

#### [MODIFY] [CallScreen.jsx](file:///c:/Users/solod/Documents/chatapp/frontend/src/components/calls/CallScreen.jsx)

- Add a "Minimize" button to the top header controls using `Minimize2` from `lucide-react`.
- Update the early return condition: `if (callStatus !== "calling" && callStatus !== "active" || callUIMode === "minimized") return null;` so the full screen hides when minimized.

### 3. Page Refresh Prevention (Level 1)

#### [MODIFY] [App.jsx](file:///c:/Users/solod/Documents/chatapp/frontend/src/App.jsx)

- Hook into `useCallStore` to extract `callStatus`.
- Add a `useEffect` that attaches a `window.onbeforeunload` listener whenever `callStatus` is `"active"` or `"calling"`.
- This triggers the native browser warning prompt if the user tries to refresh or close the tab during an ongoing call.
- Render the new `<CallScreenMinimized />` component globally alongside `<CallScreen />`.

---

> [!NOTE]
> **Open Questions**
>
> 1. For the minimized call widget, would you like it to be draggable (using `react-draggable`), or is a fixed position at the bottom-right of the screen sufficient for now? use react draggable
> 2. This plan addresses **Level 1** for Issue 3 (browser warning on refresh). As you noted, Level 3 (server-side session persistence) is a major architectural change. Should we stick strictly to Level 1 for this phase?

## Verification Plan

1. **Input Clearing:** Type a message, hit send. Ensure the textbox empties instantly with no lag.
2. **Minimizing Calls:** Start a mock call. Click the minimize icon in the corner. Ensure the full screen disappears and the floating widget appears. Ensure chat navigation remains fully functional while the widget is active.
3. **Refresh Prevention:** While in an active call state, attempt to reload the browser tab. The browser should throw a native modal asking "Are you sure you want to leave?".
