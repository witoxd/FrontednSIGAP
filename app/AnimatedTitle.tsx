
const letters = "SIGAP".split("");

export function AnimatedTitle() {
  return (
    <h1 className="flex gap-1 text-5xl font-bold tracking-widest text-white drop-shadow-md">
      {letters.map((letter, i) => (
        <span
          key={i}
          className="inline-block animate-in fade-in slide-in-from-bottom-6 duration-500"
          style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
        >
          {letter}
        </span>
      ))}
    </h1>
  );
}