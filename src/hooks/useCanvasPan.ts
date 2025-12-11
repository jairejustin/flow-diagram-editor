import { useRef, useCallback, useEffect } from "react";
import { useFlowStore } from "../store/flowStore";

export function useCanvasPan(
  translateX: number,
  translateY: number,
  scale: number,
  setTranslateX: (value: number | ((prev: number) => number)) => void,
  setTranslateY: (value: number | ((prev: number) => number)) => void,
  setScale: (value: number | ((prev: number) => number)) => void,
  isPanning: boolean,
  setIsPanning: (value: boolean) => void
) {
  const lastMousePos = useRef({ x: 0, y: 0 });
  const handlersRef = useRef<{
    onMouseMove: ((e: MouseEvent) => void) | null;
    onMouseUp: ((e: MouseEvent) => void) | null;
    onMouseLeave: ((e: MouseEvent) => void) | null;
    onTouchMove: ((e: TouchEvent) => void) | null;
    onTouchEnd: ((e: TouchEvent) => void) | null;
  }>({
    onMouseMove: null,
    onMouseUp: null,
    onMouseLeave: null,
    onTouchMove: null,
    onTouchEnd: null,
  });

  const isDraggingNode = useFlowStore((state) => state.isDraggingNode);
  const isResizingNode = useFlowStore((state) => state.isResizingNode);
  const setViewport = useFlowStore((state) => state.setViewport);

  const cleanupListeners = useCallback(() => {
    if (handlersRef.current.onMouseMove) {
      document.removeEventListener("mousemove", handlersRef.current.onMouseMove);
      handlersRef.current.onMouseMove = null;
    }
    if (handlersRef.current.onMouseUp) {
      document.removeEventListener("mouseup", handlersRef.current.onMouseUp);
      handlersRef.current.onMouseUp = null;
    }
    if (handlersRef.current.onMouseLeave) {
      document.removeEventListener("mouseleave", handlersRef.current.onMouseLeave);
      handlersRef.current.onMouseLeave = null;
    }
    if (handlersRef.current.onTouchMove) {
      document.removeEventListener("touchmove", handlersRef.current.onTouchMove);
      handlersRef.current.onTouchMove = null;
    }
    if (handlersRef.current.onTouchEnd) {
      document.removeEventListener("touchend", handlersRef.current.onTouchEnd);
      handlersRef.current.onTouchEnd = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setViewport({ x: translateX, y: translateY, zoom: scale });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [translateX, translateY, scale, setViewport]);

  const onPanEnd = useCallback(() => {
    cleanupListeners();
    setIsPanning(false);
  }, [cleanupListeners, setIsPanning]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isDraggingNode ||
        isResizingNode ||
        target.closest('.style-panel') ||
        target.closest('.toolbar') ||
        target.closest('.zoom-controls') ||
        target.closest('.node') ||
        target.closest('.edge')
      ) {
        return;
      }

      cleanupListeners();

      useFlowStore.setState({ selectedNodeId: null });
      setIsPanning(true);
      lastMousePos.current = { x: event.clientX, y: event.clientY };

      const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setTranslateX((prev) => prev + dx);
        setTranslateY((prev) => prev + dy);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      };

      const onMouseUp = () => {
        onPanEnd();
      };

      const onMouseLeave = () => {
        onPanEnd();
      };

      handlersRef.current.onMouseMove = onMouseMove;
      handlersRef.current.onMouseUp = onMouseUp;
      handlersRef.current.onMouseLeave = onMouseLeave;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.addEventListener("mouseleave", onMouseLeave);
    },
    [isDraggingNode, isResizingNode, setIsPanning, setTranslateX, setTranslateY, onPanEnd, cleanupListeners]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      event.preventDefault();

      const target = event.target as HTMLElement;
      if (
        isDraggingNode ||
        isResizingNode ||
        target.closest('.style-panel') ||
        target.closest('.toolbar') ||
        target.closest('.zoom-controls') ||
        target.closest('.node') ||
        target.closest('.edge')
      ) {
        return;
      }

      cleanupListeners();

      setIsPanning(true);
      useFlowStore.setState({ selectedNodeId: null });
      lastMousePos.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastMousePos.current.x;
        const dy = e.touches[0].clientY - lastMousePos.current.y;
        setTranslateX((prev) => prev + dx);
        setTranslateY((prev) => prev + dy);
        lastMousePos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      };

      const onTouchEnd = () => {
        onPanEnd();
      };

      handlersRef.current.onTouchMove = onTouchMove;
      handlersRef.current.onTouchEnd = onTouchEnd;

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [isDraggingNode, isResizingNode, setIsPanning, setTranslateX, setTranslateY, onPanEnd, cleanupListeners]
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const scaleFactor = 1.1;
      const newScale = event.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;

      if (newScale > 0.1 && newScale < 5) {
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const newTranslateX = mouseX - (mouseX - translateX) * (newScale / scale);
        const newTranslateY = mouseY - (mouseY - translateY) * (newScale / scale);
        setTranslateX(newTranslateX);
        setTranslateY(newTranslateY);
        setScale(newScale);
      }
    },
    [scale, translateX, translateY, setTranslateX, setTranslateY, setScale]
  );

  return {
    handleMouseDown,
    handleTouchStart,
    handleWheel,
  };
}