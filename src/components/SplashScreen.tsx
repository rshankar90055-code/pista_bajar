"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

interface SplashScreenProps {
  logoSrc?: string;
  brandName?: string;
  tagline?: string;
}

const splashSessionKey = "druits_splash_seen";

export default function SplashScreen({
  logoSrc = "/druits-logo.png",
  brandName = "Druits",
  tagline = "Healthy Luxury Delivered"
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        id: index,
        angle: (index / 26) * Math.PI * 2,
        distance: 56 + (index % 5) * 14,
        size: 3 + (index % 4),
        delay: 1.28 + (index % 6) * 0.035
      })),
    []
  );

  useEffect(() => {
    if (sessionStorage.getItem(splashSessionKey)) return;

    setIsVisible(true);
    const exitTimer = window.setTimeout(() => {
      sessionStorage.setItem(splashSessionKey, "true");
      setIsVisible(false);
    }, 3900);

    return () => window.clearTimeout(exitTimer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          aria-label="Opening Druits"
          className="fixed inset-0 z-[999] grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,rgba(223,157,75,0.28),transparent_28%),linear-gradient(145deg,#241007_0%,#5d321b_46%,#b27435_100%)] px-6 text-[#fff7ec]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015, filter: "blur(12px)" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Soft blurred luxury backdrop: keeps the scene warm and cinematic without visual noise. */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,220,156,0.18),transparent_24%),radial-gradient(circle_at_74%_78%,rgba(255,185,99,0.16),transparent_26%)] backdrop-blur-[2px]"
            animate={{ opacity: [0.68, 0.95, 0.72], scale: [1, 1.035, 1] }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />

          {/* Ambient floating background particles: slow, subtle motion for an organic premium feel. */}
          <div className="absolute inset-0">
            {particles.slice(0, 14).map((particle) => (
              <motion.span
                className="absolute rounded-full bg-[#f4c676]/45 blur-[1px]"
                key={`ambient-${particle.id}`}
                style={{
                  height: particle.size,
                  left: `${12 + ((particle.id * 19) % 76)}%`,
                  top: `${10 + ((particle.id * 23) % 78)}%`,
                  width: particle.size
                }}
                animate={{ opacity: [0.12, 0.5, 0.18], y: [-8, 10, -8] }}
                transition={{ delay: particle.id * 0.08, duration: 3.5, ease: "easeInOut", repeat: Infinity }}
              />
            ))}
          </div>

          <div className="relative grid min-h-[520px] w-full max-w-[430px] place-items-center">
            {/* Falling almond: the opening gesture lands at center before the logo reveal. */}
            <motion.div
              className="absolute top-1/2 h-20 w-9 rounded-[55%_45%_52%_48%/62%_58%_42%_38%] border border-[#f6c98b]/40 bg-[linear-gradient(115deg,#7b3c18_0%,#c57833_46%,#f2bf73_100%)] shadow-[0_18px_38px_rgba(33,14,6,0.32)]"
              initial={{ opacity: 0, y: -310, rotate: -22, scale: 0.72 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-310, -18, 0, 8], rotate: [-22, 10, 0, 0], scale: [0.72, 1, 0.94, 0.88] }}
              transition={{ duration: 1.55, times: [0, 0.72, 0.88, 1], ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="absolute left-1/2 top-2 h-16 w-[2px] -translate-x-1/2 rounded-full bg-[#ffe0a6]/35" />
            </motion.div>

            {/* Golden landing dust: particles spread outward gently after the almond lands. */}
            <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2">
              {particles.map((particle) => (
                <motion.span
                  className="absolute rounded-full bg-[#ffd782] shadow-[0_0_14px_rgba(255,207,116,0.8)]"
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

            {/* Logo reveal: emerges from the golden dust with a restrained glow. */}
            <motion.div
              className="relative grid justify-items-center"
              initial={{ opacity: 0, scale: 0.78, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 1.62, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute h-36 w-36 rounded-full bg-[#f6bd67]/24 blur-2xl"
                animate={{ opacity: [0.42, 0.72, 0.5], scale: [0.9, 1.12, 1] }}
                transition={{ delay: 1.7, duration: 1.9, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
              />
              <img
                alt={`${brandName} logo`}
                className="relative h-28 w-28 rounded-[24px] border border-[#f2c98b]/35 object-cover shadow-[0_24px_60px_rgba(28,10,2,0.38)]"
                src={logoSrc}
              />
            </motion.div>

            {/* Brand typography: elegant final lockup after the logo settles. */}
            <motion.div
              className="absolute top-[61%] grid justify-items-center text-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="m-0 text-4xl font-black tracking-[0.08em] text-[#fff4df] drop-shadow-[0_8px_20px_rgba(36,16,7,0.45)] sm:text-5xl">
                {brandName}
              </h1>
              <p className="mt-3 text-sm font-semibold tracking-[0.24em] text-[#f7d39a]/90">{tagline}</p>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
