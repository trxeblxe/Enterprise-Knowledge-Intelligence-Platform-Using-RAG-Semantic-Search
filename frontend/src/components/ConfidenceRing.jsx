import { useEffect, useRef } from 'react';

export default function ConfidenceRing({ value = 0, size = 80 }) {
  const circleRef = useRef(null);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (normalizedValue / 100) * circumference;

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.transition = 'none';
      circleRef.current.style.strokeDashoffset = String(circumference);
      // Force reflow
      circleRef.current.getBoundingClientRect();
      circleRef.current.style.transition = 'stroke-dashoffset 1.5s ease-out';
      circleRef.current.style.strokeDashoffset = String(offset);
    }
  }, [offset, circumference]);

  const color = normalizedValue >= 70 ? '#34C759' : normalizedValue >= 40 ? '#FF9500' : '#E4002B';

  return (
    <div className="flex items-center gap-4" id="confidence-ring">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(142,142,147,0.15)"
            strokeWidth="4"
          />
          {/* Value ring */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {Math.round(normalizedValue)}
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-sony-white">Confidence</p>
        <p className="text-xs text-sony-gray">Relevance Score</p>
      </div>
    </div>
  );
}
