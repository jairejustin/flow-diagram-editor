import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

if (import.meta.env.DEV) {
  console.log('Running in development mode');
  import('react-scan').then(({ scan }) => {
    scan({
      enabled: true,
    });
  });

  import('web-vitals').then(({ onCLS, onLCP, onINP }) => {
    onCLS(console.log);
    onLCP(console.log);
    onINP(console.log);
  });
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
