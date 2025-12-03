import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Expose test utilities to browser console for debugging
import { runAllTests, testJoinEventFlow, testGroupChatFlow, testAttendanceFlow, testPermissions } from "./lib/test-utils";
import { runProductionSmokeTests } from "./lib/smoke-tests";
import "./lib/feature-flags"; // Initialize feature flags

// Make test functions available globally
if (typeof window !== 'undefined') {
  const gatherlyUtils = {
    runAllTests,
    testJoinEventFlow,
    testGroupChatFlow,
    testAttendanceFlow,
    testPermissions,
    smokeTests: runProductionSmokeTests,
  };
  (window as unknown as Record<string, unknown>).gatherly = gatherlyUtils;
  console.info('[Gatherly] Test utilities loaded. Available: runAllTests, smokeTests');
}

createRoot(document.getElementById("root")!).render(<App />);
