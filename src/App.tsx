import { useEffect } from "react";
import "./App.css";
import CanvasPage from "./pages/canvas_page/CanvasPage";
import { mockFlowDocument } from "./assets/MockData";
import { useLoadMockData } from "./store/flowStore";

export default function App() {
  const loadMockData = useLoadMockData();
  useEffect(() => {
    loadMockData(mockFlowDocument);
  }, [loadMockData]);

  return (
    <div id="app">
      <CanvasPage />
    </div>
  );
}
