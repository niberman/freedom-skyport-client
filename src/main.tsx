import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { IS_DEMO } from "@/lib/env";

if (IS_DEMO) {
  const { worker } = await import("@/mocks/browser");
  await worker.start();
}
createRoot(document.getElementById("root")!).render(<App />);
