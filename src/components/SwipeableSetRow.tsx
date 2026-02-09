import React, { useState, useRef, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';

interface SwipeableSetRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
  deleteThreshold?: number;
}

/**
 * A wrapper component that adds swipe-to-delete functionality to set rows.
 * Swipe left to reveal the delete button, or swipe far enough to trigger delete directly.
 */
export const SwipeableSetRow: React.FC<SwipeableSetRowProps> = ({
  children,
  onDelete,
  disabled = false,
  deleteThreshold = 100,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipedLeft = useCallback(() => {
    if (disabled) return;
    
    if (Math.abs(offsetX) >= deleteThreshold) {
      // Trigger delete animation and callback
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 200);
    } else if (Math.abs(offsetX) > 30) {
      // Show delete button
      setShowDeleteButton(true);
      setOffsetX(-80);
    } else {
      // Reset
      setOffsetX(0);
      setShowDeleteButton(false);
    }
  }, [offsetX, deleteThreshold, disabled, onDelete]);

  const handleSwipedRight = useCallback(() => {
    // Reset to original position
    setOffsetX(0);
    setShowDeleteButton(false);
  }, []);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (disabled) return;
      
      // Only handle horizontal swipes
      if (Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)) {
        // Limit swipe to the left only, with some resistance at the end
        const newOffset = Math.max(-150, Math.min(0, eventData.deltaX));
        setOffsetX(newOffset);
      }
    },
    onSwipedLeft: handleSwipedLeft,
    onSwipedRight: handleSwipedRight,
    onTouchEndOrOnMouseUp: () => {
      if (disabled) return;
      
      // If not past threshold, snap to button visibility or reset
      if (Math.abs(offsetX) >= deleteThreshold) {
        setIsDeleting(true);
        setTimeout(() => {
          onDelete();
        }, 200);
      } else if (Math.abs(offsetX) > 40) {
        setShowDeleteButton(true);
        setOffsetX(-80);
      } else {
        setOffsetX(0);
        setShowDeleteButton(false);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 10,
    preventScrollOnSwipe: true,
  });

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => {
      onDelete();
    }, 200);
  };

  const resetPosition = useCallback(() => {
    setOffsetX(0);
    setShowDeleteButton(false);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg transition-all duration-200 ${
        isDeleting ? 'opacity-0 transform -translate-x-full' : ''
      }`}
    >
      {/* Delete button background */}
      <div 
        className={`absolute inset-y-0 right-0 flex items-center justify-end bg-red-600 transition-all duration-200 ${
          showDeleteButton || offsetX < -30 ? 'w-20' : 'w-0'
        }`}
      >
        <button
          onClick={handleDeleteClick}
          className="w-full h-full flex items-center justify-center text-white font-medium"
          aria-label="Delete set"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div
        {...handlers}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 || showDeleteButton ? 'transform 0.2s ease-out' : 'none',
        }}
        className="relative bg-inherit"
        onClick={() => {
          if (showDeleteButton) {
            resetPosition();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableSetRow;
