import { useEffect, useRef } from 'react';

/**
 * CustomCursor
 *
 * Behaviour (matches screenshot):
 *  • Default   — soft PURPLE glowing dot + lagging ring
 *  • Dashboard panels / cards — YELLOW glowing dot
 *  • Buttons / interactive    — dot scales up, ring expands
 *  • Click                    — dot pulses inward
 */
const CustomCursor = () => {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  const mouse   = useRef({ x: -300, y: -300 });
  const ringPos = useRef({ x: -300, y: -300 });
  const raf     = useRef(null);

  /* colour state refs (avoid re-renders) */
  const isDashCard = useRef(false);
  const isClickable = useRef(false);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    /* ── Colour themes ────────────────────────────── */
    const PURPLE = {
      dot:  'rgba(167, 139, 250, 0.95)',
      glow: 'rgba(139, 92, 246, 0.55)',
      ring: 'rgba(139, 92, 246, 0.35)',
    };
    const YELLOW = {
      dot:  'rgba(251, 191, 36, 0.95)',
      glow: 'rgba(245, 158, 11, 0.65)',
      ring: 'rgba(245, 158, 11, 0.35)',
    };
    const GOLD_BTN = {
      dot:  'rgba(253, 224, 71, 1)',
      glow: 'rgba(234, 179, 8, 0.7)',
      ring: 'rgba(234, 179, 8, 0.4)',
    };

    /* Apply colour to elements */
    const applyTheme = (theme, dotSize = 10, ringSize = 34) => {
      dot.style.width  = `${dotSize}px`;
      dot.style.height = `${dotSize}px`;
      dot.style.background = theme.dot;
      dot.style.boxShadow  = `0 0 ${dotSize + 6}px ${theme.glow}, 0 0 ${dotSize + 16}px ${theme.glow}`;
      ring.style.width  = `${ringSize}px`;
      ring.style.height = `${ringSize}px`;
      ring.style.borderColor = theme.ring;
      ring.style.boxShadow   = `0 0 8px ${theme.ring}`;
    };

    /* Check whether element (or any ancestor) is a dashboard card */
    const isDashboardCard = (el) => {
      let node = el;
      for (let i = 0; i < 8; i++) {
        if (!node || node === document.body) break;
        const cls = node.className || '';
        if (typeof cls === 'string' && (
          cls.includes('card') ||
          cls.includes('stat-card') ||
          cls.includes('dashboard-grid') ||
          cls.includes('dashboard-header') ||
          cls.includes('productivity-bar-card') ||
          cls.includes('tasks-section') ||
          cls.includes('category-section') ||
          cls.includes('task-item') ||
          cls.includes('task-row') ||
          cls.includes('category-row')
        )) return true;
        node = node.parentElement;
      }
      return false;
    };

    const isInteractive = (el) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return (
        tag === 'button' || tag === 'a' || tag === 'input' ||
        tag === 'textarea' || tag === 'select' ||
        el.getAttribute?.('role') === 'button' ||
        el.classList?.contains('filter-tab') ||
        el.classList?.contains('sidebar-item') ||
        el.classList?.contains('nav-link')
      );
    };

    /* ── Mouse move — update dot immediately ── */
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      /* Position dot instantly */
      dot.style.left = `${e.clientX}px`;
      dot.style.top  = `${e.clientY}px`;

      /* Determine colour zone */
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const clickable = isInteractive(el);
      const dashCard  = !clickable && isDashboardCard(el);

      if (clickable !== isClickable.current || dashCard !== isDashCard.current) {
        isClickable.current = clickable;
        isDashCard.current  = dashCard;

        if (clickable) {
          applyTheme(GOLD_BTN, 14, 42);
          dot.style.transform  = 'translate(-50%,-50%) scale(1.2)';
          ring.style.transform = 'translate(-50%,-50%) scale(1.15)';
        } else if (dashCard) {
          applyTheme(YELLOW, 11, 36);
          dot.style.transform  = 'translate(-50%,-50%) scale(1)';
          ring.style.transform = 'translate(-50%,-50%) scale(1)';
        } else {
          applyTheme(PURPLE, 10, 34);
          dot.style.transform  = 'translate(-50%,-50%) scale(1)';
          ring.style.transform = 'translate(-50%,-50%) scale(1)';
        }
      }
    };

    /* Click pulse */
    const onDown = () => {
      dot.style.transform = 'translate(-50%,-50%) scale(0.75)';
    };
    const onUp = () => {
      const theme = isClickable.current ? GOLD_BTN : isDashCard.current ? YELLOW : PURPLE;
      const s     = isClickable.current ? 1.2 : 1;
      dot.style.transform = `translate(-50%,-50%) scale(${s})`;
      applyTheme(theme);
    };

    /* ── Ring lags behind with lerp ── */
    const animateRing = () => {
      const lerpFactor = 0.10;
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * lerpFactor;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * lerpFactor;
      ring.style.left = `${ringPos.current.x}px`;
      ring.style.top  = `${ringPos.current.y}px`;
      raf.current = requestAnimationFrame(animateRing);
    };

    /* Initialise appearance */
    applyTheme(PURPLE, 10, 34);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);
    raf.current = requestAnimationFrame(animateRing);

    /* Hide on page leave */
    const onLeave = () => { dot.style.opacity = '0'; ring.style.opacity = '0'; };
    const onEnter = () => { dot.style.opacity = '1'; ring.style.opacity = '1'; };
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Main dot — follows mouse instantly */}
      <div ref={dotRef}  className="cursor-dot"  />
      {/* Ring — lags behind */}
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
};

export default CustomCursor;
