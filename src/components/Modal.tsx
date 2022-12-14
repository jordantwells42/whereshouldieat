import { useState, useEffect } from "react";
import { motion } from 'framer-motion';

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: 1080,
    height: 720,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // Add event listener
    //window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    //return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

export default function Modal({
  children,
  toggle,
  setToggle,
}: {
  children: React.ReactNode;
  toggle: boolean;
  setToggle: (toggle: boolean) => void;
}) {
  const windowSize = useWindowSize();
  return (
    <motion.div
      style={{
        display: toggle ? "block" : "none",
        height:
          windowSize.width > 700
            ? (windowSize.height * 3) / 4
            : windowSize.height,
      }}
      className="absolute top-0 w-full bg-stone-50 md:top-20 md:w-3/4 md:rounded-2xl"
    >
      <div className="relative flex h-full w-full flex-col items-center justify-start text-lg">
        {children}
      </div>
    </motion.div>
  );
}
