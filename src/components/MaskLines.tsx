import type { ElementType, ReactNode } from "react";

/**
 * Line-by-line mask reveal, rendered on the server so the text is in the HTML
 * for crawlers and for anyone with JavaScript disabled. `MotionRoot` animates
 * the inner spans up into view; CSS keeps them visible when it does not run.
 */
export function MaskLines({
  lines,
  as: Tag = "h2",
  id,
  className,
  lineClassName,
  delayStep = 0.09,
  startDelay = 0,
}: {
  lines: readonly string[];
  as?: ElementType;
  id?: string;
  className?: string;
  lineClassName?: string;
  delayStep?: number;
  startDelay?: number;
}) {
  return (
    <Tag id={id} className={className}>
      {lines.map((line, i) => (
        <span key={i} data-mask-line="" data-delay={startDelay + i * delayStep} className={lineClassName}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

export function MaskLine({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <span data-mask-line="" data-delay={delay} className={className}>
      <span>{children}</span>
    </span>
  );
}
