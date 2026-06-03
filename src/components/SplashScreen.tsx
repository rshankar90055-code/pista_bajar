"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

interface SplashScreenProps {
  logoSrc?: string;
  brandName?: string;
  tagline?: string;
  force?: boolean;
  onComplete?: () => void;
}

const splashSessionKey = "pistabajar_splash_seen";

export default function SplashScreen({
  logoSrc = "/pistabajar-logo.png",
  brandName = "Pista Bajar",
  tagline = "Luxury Dry Fruits Delivered in Minutes",
  force = false,
  onComplete
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const onCompleteRef = useRef(onComplete);

  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        id: index,
        angle: (index / 26) * Math.PI * 2,
        distance: 50 + (index % 5) * 12,
        size: 3 + (index % 4),
        delay: 1.35 + (index % 6) * 0.035
      })),
    []
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem(splashSessionKey, "true");
    setIsVisible(false);
    onCompleteRef.current?.();
  };

  useEffect(() => {
    if (!force && sessionStorage.getItem(splashSessionKey)) {
      onCompleteRef.current?.();
      return;
    }

    setIsVisible(true);
    const exitTimer = window.setTimeout(() => {
      handleSkip();
    }, 2500);

    return () => window.clearTimeout(exitTimer);
  }, [force]);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          aria-label="Opening Pista Bajar"
          onClick={handleSkip}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,rgba(223,177,91,0.25),transparent_32%),linear-gradient(145deg,#1c130f_0%,#120e0d_46%,#090706_100%)] px-6 text-[#fbf9f5] cursor-pointer"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015, filter: "blur(12px)" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Ambient blurred luxury backdrop */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(223,177,91,0.1),transparent_25%),radial-gradient(circle_at_75%_75%,rgba(223,199,176,0.12),transparent_28%)] backdrop-blur-[2px]"
            animate={{ opacity: [0.68, 0.95, 0.72], scale: [1, 1.03, 1] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          />

          {/* Ambient floating background sparkles */}
          <div className="absolute inset-0">
            {particles.slice(0, 14).map((particle) => (
              <motion.span
                className="absolute rounded-full bg-[#dfb15b]/40 blur-[0.5px]"
                key={`ambient-${particle.id}`}
                style={{
                  height: particle.size,
                  left: `${10 + ((particle.id * 17) % 80)}%`,
                  top: `${8 + ((particle.id * 23) % 84)}%`,
                  width: particle.size
                }}
                animate={{ opacity: [0.15, 0.6, 0.2], y: [-6, 8, -6] }}
                transition={{ delay: particle.id * 0.08, duration: 3.5, ease: "easeInOut", repeat: Infinity }}
              />
            ))}
          </div>

          <div className="splash-stage">
            <div className="splash-scene">
            
            {/* Falling & Splitting Almond: A glorious three-part animation */}
            <div className="splash-center h-24 w-16">
              {/* Glowing Golden Kernel (emerges when shell splits) */}
              <motion.div
                className="absolute inset-x-2 inset-y-4 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fde4a7,#dfb15b)] shadow-[0_0_20px_rgba(223,177,91,0.7)]"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.1, 1, 0.8] }}
                transition={{ duration: 1.6, times: [0, 0.6, 0.85, 1], ease: "easeOut" }}
              />
              {/* Left Shell Half (Earthy Almond texture) */}
              <motion.div
                className="absolute left-0 top-0 h-full w-[52%] rounded-[90%_10%_10%_90%/60%_30%_30%_60%] border-r-0 border border-[#dfb15b]/40 bg-[linear-gradient(135deg,#7c5132_0%,#b3845b_40%,#dfc7b0_100%)] shadow-[-6px_10px_20px_rgba(0,0,0,0.5)]"
                style={{ originX: 1, originY: 0.5 }}
                initial={{ opacity: 0, y: -260, rotate: -35 }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  y: [-260, -10, 0, 15], 
                  rotate: [-35, 5, -28, -45],
                  x: [0, 0, -25, -55]
                }}
                transition={{ duration: 1.6, times: [0, 0.5, 0.8, 1], ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Right Shell Half (Earthy Almond texture) */}
              <motion.div
                className="absolute right-0 top-0 h-full w-[52%] rounded-[10%_90%_90%_10%/30%_60%_60%_30%] border-l-0 border border-[#dfb15b]/40 bg-[linear-gradient(225deg,#7c5132_0%,#b3845b_40%,#dfc7b0_100%)] shadow-[6px_10px_20px_rgba(0,0,0,0.5)]"
                style={{ originX: 0, originY: 0.5 }}
                initial={{ opacity: 0, y: -260, rotate: 35 }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  y: [-260, -10, 0, 15], 
                  rotate: [35, -5, 28, 45],
                  x: [0, 0, 25, 55]
                }}
                transition={{ duration: 1.6, times: [0, 0.5, 0.8, 1], ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {/* Golden landing dust: sparkles spread outward gently after landing */}
            <div className="splash-center h-1 w-1">
              {particles.map((particle) => (
                <motion.span
                  className="absolute rounded-full bg-[#dfb15b] shadow-[0_0_12px_rgba(223,177,91,0.8)]"
                  key={`burst-${particle.id}`}
                  style={{ height: particle.size, width: particle.size }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                  animate={{
                    opacity: [0, 0.95, 0],
                    x: Math.cos(particle.angle) * particle.distance,
                    y: Math.sin(particle.angle) * particle.distance * 0.72,
                    scale: [0.4, 1, 0.35]
                  }}
                  transition={{ delay: particle.delay, duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>

            {/* Logo reveal: emerges from the golden dust with a gorgeous halo glow */}
            <div className="splash-center flex items-center justify-center">
              <motion.div
                className="relative flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.78, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 1.68, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="absolute h-36 w-36 rounded-full bg-[#dfb15b]/20 blur-2xl"
                  animate={{ opacity: [0.42, 0.72, 0.42], scale: [0.9, 1.12, 0.9] }}
                  transition={{ delay: 1.7, duration: 1.9, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
                />
                {/* Visual Premium Logo container */}
                <div className="relative h-28 w-28 rounded-[24px] border border-[#dfb15b]/35 bg-gradient-to-br from-[#2d1e18] to-[#120e0d] flex items-center justify-center shadow-[0_24px_60px_rgba(10,25,8,0.38)] overflow-hidden p-3">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(223,177,91,0.25),transparent_60%)]" />
                  <img src={logoSrc} alt={brandName} className="h-20 w-20 object-contain relative z-10" />
                </div>
              </motion.div>
            </div>

            {/* Brand typography */}
            <div className="splash-brand">
              <motion.div
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="m-0 text-4xl font-black tracking-[0.08em] text-transparent bg-clip-text bg-gradient-to-b from-[#fbf9f5] to-[#dfc7b0] drop-shadow-[0_8px_20px_rgba(10,25,8,0.45)] sm:text-5xl">
                  {brandName}
                </h1>
                <p className="mt-3 max-w-[280px] text-center text-xs font-bold tracking-[0.15em] text-[#dfb15b] sm:text-sm">{tagline}</p>
              </motion.div>
            </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
