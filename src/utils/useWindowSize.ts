import { useState, useEffect } from 'react';
export default function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
      width: 1080,
      height: 720,
    });
  
    useEffect(() => {
      function handleResize() {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
  
      window.addEventListener("resize", handleResize);
  
      handleResize();
  
      return () => window.removeEventListener("resize", handleResize);
    }, []);
    return windowSize;
  }