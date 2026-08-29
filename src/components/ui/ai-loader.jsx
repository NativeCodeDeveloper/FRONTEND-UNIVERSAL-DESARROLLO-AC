const SIZE_CLASSES = {
  140: "size-36",
  180: "size-44",
  220: "size-56",
};

const DELAY_CLASSES = [
  "[animation-delay:0ms]",
  "[animation-delay:120ms]",
  "[animation-delay:240ms]",
  "[animation-delay:360ms]",
  "[animation-delay:480ms]",
  "[animation-delay:600ms]",
  "[animation-delay:720ms]",
  "[animation-delay:840ms]",
];

export function Component({ size = 180, text = "Cargando", label = text }) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES[180];
  const letters = text.split("");

  return (
    <div
      className="fixed inset-0 z-50 grid min-h-dvh place-items-center overflow-hidden bg-[#0d0718] text-white"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.24),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.22),transparent_56%)]" />

      <div className="absolute left-1/2 top-1/2 size-[min(92vw,38rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[110px] motion-safe:animate-pulse" />
      <div className="absolute left-[18%] top-[20%] size-32 rounded-full bg-fuchsia-500/15 blur-3xl motion-safe:animate-pulse" />
      <div className="absolute bottom-[14%] right-[16%] size-40 rounded-full bg-purple-500/15 blur-3xl motion-safe:animate-pulse [animation-delay:700ms]" />

      <div className="relative flex flex-col items-center justify-center">
        <div className={`${sizeClass} relative grid place-items-center select-none`}>
          <div className="absolute inset-0 rounded-full border border-violet-200/15" />
          <div className="absolute inset-3 rounded-full border border-fuchsia-200/10" />

          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-r-violet-300 border-t-fuchsia-300/95 shadow-[0_0_28px_rgba(168,85,247,0.62)] motion-safe:animate-spin [animation-duration:4.8s]" />
          <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-violet-300/75 border-l-fuchsia-400/80 shadow-[0_0_20px_rgba(217,70,239,0.35)] motion-safe:animate-spin [animation-direction:reverse] [animation-duration:3.2s]" />

          <div className="relative z-10 grid size-24 place-items-center rounded-full bg-violet-950/65 px-3 shadow-[inset_0_0_26px_rgba(196,181,253,0.16),0_0_34px_rgba(139,92,246,0.28)] ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-0.5 text-sm font-semibold tracking-[0.08em] text-violet-50">
              {letters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className={`inline-block motion-safe:animate-pulse ${DELAY_CLASSES[index % DELAY_CLASSES.length]}`}
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div>

        <span className="mt-7 text-xs font-medium uppercase tracking-[0.32em] text-violet-100/75">
          {label}
        </span>
      </div>
    </div>
  );
}
