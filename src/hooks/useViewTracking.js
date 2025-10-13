import { useRef, useEffect, useCallback, useState } from "react";
import { registerView } from "../app/Api";

/**
 * Hook để theo dõi lượt xem bài viết bằng Intersection Observer
 * @param {number} postId - ID của bài viết
 * @param {Object} options - Tùy chọn cho Intersection Observer
 * @returns {Object} - { ref: ref để gắn vào element, isViewed: boolean }
 */
export const useViewTracking = (postId, options = {}) => {
  const elementRef = useRef(null);
  const [isViewed, setIsViewed] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const hasTrackedRef = useRef(false); // Ref để track xem đã track view chưa

  const defaultOptions = {
    threshold: 0.5, // 50% của element phải visible
    rootMargin: "0px",
    triggerOnce: true, // Chỉ trigger một lần
    delay: 0, // Không delay
    cooldown: 0, // Không cooldown
  };

  const observerOptions = { ...defaultOptions, ...options };

  const trackView = useCallback(async () => {
    if (!postId || hasTrackedRef.current) return; // Ngăn track nhiều lần

    try {
      // Gọi API để đăng ký lượt xem
      await registerView(postId);
      hasTrackedRef.current = true; // Đánh dấu đã track
      setIsViewed(true);
      setViewCount((prev) => prev + 1);
    } catch (error) {
      console.warn("Error tracking view:", error);
    }
  }, [postId]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !postId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && !hasTrackedRef.current) {
          // Chỉ track khi chưa track và đang visible
          trackView();
        }
      },
      {
        threshold: observerOptions.threshold,
        rootMargin: observerOptions.rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [
    postId,
    trackView,
    observerOptions.threshold,
    observerOptions.rootMargin,
  ]);

  return {
    ref: elementRef,
    isViewed,
    viewCount,
  };
};

export default useViewTracking;
