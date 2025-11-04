import { useState, useEffect } from "react";

export default function LogoAnimation({ onComplete }) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [showLine, setShowLine] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0); 
  const [enableTransition, setEnableTransition] = useState(false);

  useEffect(() => {
    
    const lineTimer = setTimeout(() => {
      setShowLine(true);
    }, 300);

    
    const firstAnimationTimer = setTimeout(() => {
      setEnableTransition(true);
      setAnimationPhase(1);
    }, 500);

    
    const secondAnimationTimer = setTimeout(() => {
      setAnimationPhase(2);
    }, 2000);

    
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        onComplete();
      }, 50);
    }, 2500);

    return () => {
      clearTimeout(lineTimer);
      clearTimeout(firstAnimationTimer);
      clearTimeout(secondAnimationTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white">
      {}
      <div className="relative flex flex-col items-center">
        {}
        <div className="relative overflow-hidden h-20 md:h-24 flex items-center">
          <div
            className={`flex items-center space-x-3 ${
              enableTransition
                ? "transition-transform duration-1000 ease-in-out"
                : ""
            } ${
              animationPhase === 0
                ? "translate-y-32"
                : animationPhase === 1
                ? "translate-y-0"
                : "translate-y-32"
            }`}
          >
            <img
              src="https://res.cloudinary.com/dkir6pztp/image/upload/v1761749569/logo_xwcdnr.jpg"
              alt="Campus Matrimony"
              className="h-16 w-16 md:h-20 md:w-20 object-contain"
            />
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight leading-tight">
              Campus{" "}
              <span className="font-medium bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Matrimony
              </span>
            </h1>
          </div>
        </div>

        {}
        <div
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gray-900 transition-all duration-300 ease-out ${
            showLine ? "w-full max-w-xs md:max-w-sm" : "w-0"
          }`}
        ></div>
      </div>
    </div>
  );
}
