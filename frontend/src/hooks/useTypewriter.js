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
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !text) {
      timerRef.current = setTimeout(() => {
        setDisplayedText('');
        setIsTyping(false);
      }, 0);
      indexRef.current = 0;
      return;
    }

    timerRef.current = setTimeout(() => {
      setDisplayedText('');
      setIsTyping(true);
    }, 0);
    indexRef.current = 0;

    const tick = () => {
      indexRef.current += 1;
      const current = text.slice(0, indexRef.current);
      setDisplayedText(current);

      if (indexRef.current >= text.length) {
        setIsTyping(false);
        return;
      }

      // tiny pause after punctuation for more natural reading rhythm
      const lastChar = current[current.length - 1];
      const delay = /[.,!?;:]/.test(lastChar) ? speed * 4 : speed;
      timerRef.current = setTimeout(tick, delay);
    };

    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
}
