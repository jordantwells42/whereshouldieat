import { config, useSpring, animated } from 'react-spring';
import { useGesture } from '@use-gesture/react';
import useWindowSize from '../utils/useWindowSize';
export default function Swipeable({onSwipeLeft, onSwipeRight, children}: {
    onSwipeLeft: () => void,
    onSwipeRight: () => void,
    children: React.ReactNode
}){
    const windowSize = useWindowSize();
    const [{ x, rotate, scale }, api] = useSpring(() => ({
        x: 0,
        rotate: 0,
        scale: 1,
      }));
    
      const bind = useGesture(
        {
          onDrag:
            // @ts-ignore
            ({ down, movement: [mx], direction: [dx], velocity: [vx] }) => {
              if (!windowSize || !windowSize.width) {
                return;
              }
              const trigger =
                Math.abs(mx) > windowSize.width / (windowSize.width > 700 ? 6 : 2);
              // @ts-ignore
              api.start(() => {
                if (!windowSize || !windowSize.width) {
                  return;
                }
                const x = !down ? 0 : windowSize.width < 500 ? mx * 1.5 : mx;
                const rotate = !down
                  ? 0
                  : windowSize.width < 500
                  ? mx / 20
                  : mx / 50;
                const scale = down ? 1.05 : 1;
                return {
                  x,
                  rotate,
                  scale,
                  config: config.wobbly,
                };
              });
            },
    
          onDragEnd: ({
            down,
            // @ts-ignore
            movement: [mx],
            // @ts-ignore
            direction: [dx],
            // @ts-ignore
            velocity: [vx],
          }) => {
            if (!windowSize || !windowSize.width) {
              return;
            }
            const trigger =
              Math.abs(mx) > windowSize.width / (windowSize.width > 700 ? 6 : 2);
            // @ts-ignore
            api.start(() => {
              function handleTrigger() {
                if (mx > 0) {
                  console.log("Swipe Right");
                  onSwipeRight();
                } else {
                  console.log("Swipe Left");
                  onSwipeLeft();
                }
              }
    
              if (trigger) {
                handleTrigger();
              }
    
              return {
                x: 0,
                rotate: 0,
                scale: 1,
                config: config.gentle,
              };
            });
          },
        },
        {
          drag: {
            filterTaps: true,
            preventDefault: true,
            //preventScroll: true,
            axis: "x",
          },
        }
      );

    return (
        <animated.div
        style={{
          marginTop:
            windowSize.width >= 1024 ? 0 : -windowSize.height / 2.2,
          x,
          rotate,
          scale,
          touchAction: "pan-y",
        }}
        className="w-full h-full bg-stone-50 flex items-center justify-start flex-col rounded-2xl"
        {...bind()}
      >
        {children}
        </animated.div>
    )
}