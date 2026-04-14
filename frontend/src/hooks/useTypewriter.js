import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for character-by-character typewriter effect.
 * @param {string} text - The full text to type out
 * @param {number} speed - Milliseconds per character (default 12ms)
 * @param {boolean} enabled - Whether to start typing
 * @returns {{ displayedText: string, isTyping: boolean }}
 */
export function useTypewriter(text, speed = 12, enabled = true) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText('');
      setIsTyping(false);
      indexRef.current = 0;
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(intervalRef.current);
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
}
