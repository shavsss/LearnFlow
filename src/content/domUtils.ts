/**
 * Misc DOM helpers used across detectors and UI.
 */
export function throttle<T extends (...args: any[]) => void>(fn: T, wait = 16): T {
  let last = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  } as T;
}

export function createElem<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<keyof HTMLElementTagNameMap[K], any>> = {},
  text = ""
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  
  // Apply attributes except style
  const { style, ...restAttrs } = attrs;
  Object.assign(el, restAttrs);
  
  // If style is provided, apply styles individually to avoid type issues
  if (style && typeof style === 'object' && style !== null) {
    // Use type assertion to ensure TypeScript understands this is a safe object
    const styleObj = style as Record<string, string | number | undefined>;
    
    Object.keys(styleObj).forEach(prop => {
      const value = styleObj[prop];
      if (value !== undefined) {
        // @ts-ignore - We're being careful with the prop name
        el.style[prop] = value;
      }
    });
  }
  
  if (text) el.textContent = text;
  return el;
}

export function inViewport(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}
