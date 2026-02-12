import { useRef, useCallback, useEffect } from "react";
import { useSetViewport } from "../../store/flowStore";
import { PAN_LIMIT } from "../../lib/constants";
import { useHistory } from "../../store/flowStore";

export function useCanvasPan(
  translateX: number,
  translateY: number,
  scale: number,
  setTranslateX: (value: number | ((prev: number) => number)) => void,
  setTranslateY: (value: number | ((prev: number) => number)) => void,
  setScale: (value: number | ((prev: number) => number)) => void,
  _isPanning: boolean,
  setIsPanning: (value: boolean) => void
) {
  const activePointerId = useRef<number | null>(null);
  const handlersRef = useRef<{
    onPointerMove: ((e: PointerEvent) => void) | null;
    onPointerUp: ((e: PointerEvent) => void) | null;
    onPointerCancel: ((e: PointerEvent) => void) | null;
  }>({
    onPointerMove: null,
    onPointerUp: null,
    onPointerCancel: null,
  });

  // throttle refs
  const initialPanRef = useRef({ x: translateX, y: translateY });
  const startPointerRef = useRef({ x: 0, y: 0 });
  const latestPanRef = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const setViewport = useSetViewport();
  const { pause, resume } = useHistory();

  const cleanupListeners = useCallback(() => {
    if (handlersRef.current.onPointerMove) {
      document.removeEventListener(
        "pointermove",
        handlersRef.current.onPointerMove
      );
      handlersRef.current.onPointerMove = null;
    }
    if (handlersRef.current.onPointerUp) {
      document.removeEventListener(
        "pointerup",
        handlersRef.current.onPointerUp
      );
      handlersRef.current.onPointerUp = null;
    }
    if (handlersRef.current.onPointerCancel) {
      document.removeEventListener(
        "pointercancel",
        handlersRef.current.onPointerCancel
      );
      handlersRef.current.onPointerCancel = null;
    }
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupListeners();
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
    resume();
    activePointerId.current = null;
  }, [cleanupListeners, setIsPanning, resume]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (activePointerId.current !== null) return;

      const target = event.target as HTMLElement;
      if (
        target.closest(".style-panel") ||
        target.closest(".toolbar") ||
        target.closest(".zoom-controls") ||
        target.closest(".node") ||
        target.closest(".edge") ||
        target.closest(".mobile-toggle-editor-button")
      ) {
        return;
      }

      if (event.pointerType === "touch") event.preventDefault();

      cleanupListeners();
      pause();

      (event.target as HTMLElement).setPointerCapture(event.pointerId);
      activePointerId.current = event.pointerId;
      setIsPanning(true);

      startPointerRef.current = { x: event.clientX, y: event.clientY };
      initialPanRef.current = { x: translateX, y: translateY };

      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;

        // delta
        const dx = e.clientX - startPointerRef.current.x;
        const dy = e.clientY - startPointerRef.current.y;
        const nextX = initialPanRef.current.x + dx;
        const nextY = initialPanRef.current.y + dy;

        // bounds
        if (nextX > PAN_LIMIT) return PAN_LIMIT;
        if (nextX < -PAN_LIMIT) return -PAN_LIMIT;
        if (nextY > PAN_LIMIT) return PAN_LIMIT;
        if (nextY < -PAN_LIMIT) return -PAN_LIMIT;

        latestPanRef.current = { x: nextX, y: nextY };
        if (rafId.current === null) {
          rafId.current = requestAnimationFrame(() => {
            const { x, y } = latestPanRef.current;
            setTranslateX(x);
            setTranslateY(y);
            rafId.current = null;
          });
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;
        onPanEnd();
      };

      const onPointerCancel = (e: PointerEvent) => {
        if (e.pointerId !== activePointerId.current) return;
        onPanEnd();
      };

      handlersRef.current.onPointerMove = onPointerMove;
      handlersRef.current.onPointerUp = onPointerUp;
      handlersRef.current.onPointerCancel = onPointerCancel;

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerCancel);
    },
    [
      setIsPanning,
      setTranslateX,
      setTranslateY,
      onPanEnd,
      cleanupListeners,
      pause,
      translateX,
      translateY,
    ]
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const scaleFactor = 1.1;
      const newScale =
        event.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;

      if (newScale > 0.1 && newScale < 5) {
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        let newTranslateX = mouseX - (mouseX - translateX) * (newScale / scale);
        let newTranslateY = mouseY - (mouseY - translateY) * (newScale / scale);

        if (newTranslateX > PAN_LIMIT) newTranslateX = PAN_LIMIT;
        if (newTranslateX < -PAN_LIMIT) newTranslateX = -PAN_LIMIT;
        if (newTranslateY > PAN_LIMIT) newTranslateY = PAN_LIMIT;
        if (newTranslateY < -PAN_LIMIT) newTranslateY = -PAN_LIMIT;

        setTranslateX(newTranslateX);
        setTranslateY(newTranslateY);
        setScale(newScale);
      }
    },
    [scale, translateX, translateY, setTranslateX, setTranslateY, setScale]
  );

  return {
    handlePointerDown,
    handleWheel,
  };
}
