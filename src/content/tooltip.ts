/**
 * Simple tooltip utility for displaying translations.
 */

export function showTooltip(e: MouseEvent, src: string, trg: string) {
  const pop = document.createElement("div");
  
  // Set styles individually to avoid TypeScript issues
  pop.style.position = "fixed";
  pop.style.left = `${e.clientX + 12}px`;
  pop.style.top = `${e.clientY - 12}px`;
  pop.style.background = "rgba(0,0,0,.9)";
  pop.style.color = "#fff";
  pop.style.padding = "6px 10px";
  pop.style.borderRadius = "6px";
  pop.style.fontSize = "13px";
  pop.style.zIndex = "9999999";
  
  pop.innerHTML = `<b>${src}</b><br>${trg}`;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 3000);
} 