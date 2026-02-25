import { useState, useRef, useCallback, useEffect } from 'react';

export type BottomSheetState = 'closed' | 'peek' | 'open';

interface UseBottomSheetGestureParams {
  initialState?: BottomSheetState;
  onStateChange?: (state: BottomSheetState) => void;
  peekHeight?: number;
  openHeight?: number;
}

interface UseBottomSheetGestureReturn {
  state: BottomSheetState;
  translateY: number;
  isDragging: boolean;
  handleRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  setState: (newState: BottomSheetState) => void;
}

const SWIPE_THRESHOLD = 0.2;
const VELOCITY_THRESHOLD = 0.45;

export function useBottomSheetGesture({
  initialState = 'closed',
  onStateChange,
  peekHeight = 60,
  openHeight = 80
}: UseBottomSheetGestureParams = {}): UseBottomSheetGestureReturn {
  const [state, setStateInternal] = useState<BottomSheetState>(initialState);
  const [translateY, setTranslateY] = useState<number>(100);
  const [isDragging, setIsDragging] = useState(false);
  
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const startTranslateY = useRef<number>(100);
  const velocity = useRef<number>(0);
  const lastY = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const handleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const getTranslateYForState = useCallback((targetState: BottomSheetState): number => {
    switch (targetState) {
      case 'closed':
        return 100;
      case 'peek':
        return 100 - (peekHeight / window.innerHeight) * 100;
      case 'open':
        return 100 - (openHeight / 100) * 100;
      default:
        return 100;
    }
  }, [peekHeight, openHeight]);

  const setState = useCallback((newState: BottomSheetState) => {
    setStateInternal(newState);
    setTranslateY(getTranslateYForState(newState));
    onStateChange?.(newState);
  }, [getTranslateYForState, onStateChange]);

  const snapToNearestState = useCallback((currentTranslate: number): BottomSheetState => {
    const closedY = getTranslateYForState('closed');
    const peekY = getTranslateYForState('peek');
    const openY = getTranslateYForState('open');

    const distToClosed = Math.abs(currentTranslate - closedY);
    const distToPeek = Math.abs(currentTranslate - peekY);
    const distToOpen = Math.abs(currentTranslate - openY);

    if (distToOpen < distToPeek && distToOpen < distToClosed) {
      return 'open';
    } else if (distToPeek < distToClosed) {
      return 'peek';
    } else {
      return 'closed';
    }
  }, [getTranslateYForState]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    startTranslateY.current = translateY;
    lastY.current = touch.clientY;
    lastTime.current = Date.now();
    velocity.current = 0;
    setIsDragging(true);
  }, [translateY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;
    const newTranslateY = Math.max(
      getTranslateYForState('open'),
      Math.min(100, startTranslateY.current + (deltaY / window.innerHeight) * 100)
    );

    setTranslateY(newTranslateY);

    const now = Date.now();
    const timeDelta = now - lastTime.current;
    if (timeDelta > 0) {
      const yDelta = touch.clientY - lastY.current;
      velocity.current = Math.abs(yDelta) / timeDelta;
    }

    lastY.current = touch.clientY;
    lastTime.current = now;
    currentY.current = touch.clientY;
  }, [isDragging, startY, startTranslateY, getTranslateYForState]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    const deltaY = currentY.current - startY.current;
    const deltaPercent = Math.abs(deltaY / window.innerHeight);

    let targetState: BottomSheetState;

    if (velocity.current > VELOCITY_THRESHOLD) {
      if (deltaY < 0) {
        targetState = state === 'closed' ? 'peek' : 'open';
      } else {
        targetState = state === 'open' ? 'peek' : 'closed';
      }
    } else if (deltaPercent > SWIPE_THRESHOLD) {
      if (deltaY < 0) {
        targetState = state === 'closed' ? 'peek' : 'open';
      } else {
        targetState = state === 'open' ? 'peek' : 'closed';
      }
    } else {
      targetState = snapToNearestState(translateY);
    }

    setState(targetState);
  }, [isDragging, state, translateY, snapToNearestState, setState]);

  useEffect(() => {
    if (!isDragging) {
      setTranslateY(getTranslateYForState(state));
    }
  }, [state, isDragging, getTranslateYForState]);

  return {
    state,
    translateY,
    isDragging,
    handleRef,
    contentRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setState
  };
}
