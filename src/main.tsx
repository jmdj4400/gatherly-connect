import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Expose test utilities to browser console for debugging
import { runAllTests, testJoinEventFlow, testGroupChatFlow, testAttendanceFlow, testPermissions } from "./lib/test-utils";

// Make test functions available globally
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).gatherly = {
    runAllTests,
    testJoinEventFlow,
    testGroupChatFlow,
    testAttendanceFlow,
    testPermissions,
  };
  console.info('[Gatherly] Test utilities loaded. Use window.gatherly.runAllTests({ eventId, groupId, orgId }) to run tests.');
}

createRoot(document.getElementById("root")!).render(<App />);
