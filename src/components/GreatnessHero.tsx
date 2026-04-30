import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Quote, Sparkles, RefreshCw } from 'lucide-react';
import { getDailyFigure } from '@/data/greatness';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GreatnessHero = () => {
  const [figure, setFigure] = useState(() => getDailyFigure());
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const retryQuote = () => {
    setImageError(false);
    setImageKey(k => k + 1);
    setFigure(getDailyFigure());
  };

  // Magnetic tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.4 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);
  const parallaxX = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const parallaxY = useTransform(sy, [-0.5, 0.5], [-12, 12]);

  // Spotlight position (px-based for radial gradient)
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);

  // Refresh at midnight
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 5, 0);
    const t = setTimeout(() => setFigure(getDailyFigure()), next.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, [figure]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    mx.set(px - 0.5);
    my.set(py - 0.5);
    spotX.set(px * 100);
    spotY.set(py * 100);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
    spotX.set(50);
    spotY.set(50);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative grid grid-cols-1 md:grid-cols-5 gap-3 [perspective:1200px]"
    >
      {/* Portrait Bento (large) */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="md:col-span-3 row-span-2 relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/40 backdrop-blur-xl shadow-[0_0_60px_-20px_hsl(var(--primary)/0.35)] aspect-[4/5] md:aspect-auto md:min-h-[420px] group"
      >
        {/* Image with parallax */}
        {!imageError ? (
          <motion.img
            key={`${figure.image}-${imageKey}`}
            src={figure.image}
            alt={`${figure.name} — ${figure.role}`}
            width={1024}
            height={1280}
            loading="eager"
            onError={() => setImageError(true)}
            style={{ x: parallaxX, y: parallaxY }}
            className="absolute inset-0 w-full h-full object-cover scale-110 will-change-transform"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/40 text-center p-6">
            <p className="text-xs text-muted-foreground">Couldn't load today's portrait.</p>
            <Button size="sm" variant="outline" onClick={retryQuote}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Loading Quote
            </Button>
          </div>
        )}
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        {/* Spotlight cursor reveal */}
        <motion.div
          className="absolute inset-0 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: useTransform(
              [spotX, spotY] as any,
              ([x, y]: any) =>
                `radial-gradient(220px circle at ${x}% ${y}%, hsl(var(--primary) / 0.55), transparent 65%)`
            ),
          }}
        />
        {/* Inner border glow */}
        <div className="absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-foreground/5" />
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 z-10" style={{ transform: 'translateZ(40px)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] rounded-full bg-primary/15 text-primary border border-primary/20 backdrop-blur-md">
              {figure.pillar}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Today's Archetype</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground leading-tight">
            {figure.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{figure.role}</p>
        </div>
      </motion.div>

      {/* Quote Bento */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="md:col-span-2 relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/40 backdrop-blur-xl p-6 min-h-[220px] flex flex-col justify-between group"
      >
        {/* Spotlight glow behind text */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: useTransform(
              [spotX, spotY] as any,
              ([x, y]: any) =>
                `radial-gradient(280px circle at ${x}% ${y}%, hsl(var(--primary) / 0.18), transparent 70%)`
            ),
          }}
        />
        <div style={{ transform: 'translateZ(30px)' }} className="relative">
          <Quote className="w-5 h-5 text-primary/60 mb-3" />
          <p className="font-serif text-lg md:text-xl leading-snug text-foreground">
            "{figure.quote}"
          </p>
        </div>
        <div style={{ transform: 'translateZ(20px)' }} className="relative flex items-center justify-between mt-4">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">— {figure.name}</span>
          <span className="text-[10px] text-muted-foreground/70">Refreshes daily</span>
        </div>
      </motion.div>

      {/* Sparkle pillar indicator bento */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={cn(
          'md:col-span-2 relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/40 backdrop-blur-xl p-5 flex items-center gap-4 min-h-[120px]'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div style={{ transform: 'translateZ(20px)' }}>
          <p className="text-sm font-medium text-foreground">Channel today's pillar</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Build one habit aligned with <span className="text-primary">{figure.pillar}</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default GreatnessHero;
