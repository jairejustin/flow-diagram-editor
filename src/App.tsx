import { useEffect } from 'react';
import './App.css';
import CanvasPage from './pages/canvas_page/CanvasPage';
import { mockFlowDocument } from "./assets/MockData";
import { useFlowStore } from './store/flowStore';

export default function App() {
  useEffect(() => {
    //Load mock data on first mount
    useFlowStore.getState().loadMockData(mockFlowDocument);
  }, []);

  return (
    <div id="app">
      <CanvasPage />
    </div>
  );
}