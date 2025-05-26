"use client";

import React, { useState, useEffect } from 'react';

const StarBackground = () => {
  const [starStyles, setStarStyles] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const generateStarStyle = (): React.CSSProperties => ({
      position: 'absolute',
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      backgroundColor: `rgba(192, 255, 192, ${Math.random() * 0.5 + 0.3})`, // Lime-ish stars
      borderRadius: '50%',
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `pulse ${2 + Math.random() * 3}s infinite alternate, star-move ${10 + Math.random() * 20}s linear infinite alternate-reverse`,
      boxShadow: '0 0 5px rgba(192, 255, 192, 0.7), 0 0 10px rgba(192, 255, 192, 0.5)'
    });
    setStarStyles(Array.from({ length: 150 }, generateStarStyle));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      {starStyles.map((style, i) => (
        <div
          key={`global-star-${i}`}
          style={style}
          className="star-particle" // Make sure this class has the keyframes in globals.css
        />
      ))}
    </div>
  );
};

export default StarBackground; 