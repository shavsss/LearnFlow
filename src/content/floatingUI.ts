/**
 * Renders fixed 💬 📝 📚 buttons. Emits chrome.runtime messages when clicked.
 * Designed to avoid CSS collisions via Shadow DOM.
 */
import { createElem } from "./domUtils";

export function initFloatingUI() {
  console.log("[LearnFlow] Starting floating UI initialization");
  
  // First remove any existing UI (in case of reload)
  const oldElement = document.getElementById("lf-floating");
  if (oldElement) {
    console.log("[LearnFlow] Removing old floating UI");
    oldElement.remove();
  }

  const host = createElem("div");
  host.id = "lf-floating";
  
  // Apply styles individually with !important to override any site styles
  host.style.cssText = `
    position: fixed !important;
    top: 80px !important;
    right: 20px !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
    width: 50px !important;
    height: auto !important;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
    background-color: transparent !important;
  `;
  
  // Create a direct element first (no shadow DOM) to test if that works
  const wrap = createElem("div");
  
  // Apply styles directly with stronger visibility
  wrap.style.cssText = `
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    pointer-events: auto !important;
    background: rgba(255,255,255,0.4) !important;
    padding: 8px !important;
    border-radius: 8px !important;
    border: 2px solid #3B82F6 !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
  `;
  
  host.appendChild(wrap);

  // Create more visible buttons
  const makeBtn = (emoji: string, panel: string) => {
    const b = createElem("button");
    b.innerText = emoji;
    
    // Apply styles with !important
    b.style.cssText = `
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      background: #3B82F6 !important;
      color: #fff !important;
      font-size: 18px !important;
      border: 2px solid white !important;
      cursor: pointer !important;
      transition: transform .15s !important;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 3px !important;
      opacity: 1 !important;
      visibility: visible !important;
      text-align: center !important;
      line-height: 1 !important;
    `;
    
    b.onmouseenter = () => {
      b.style.transform = "scale(1.1)";
      b.style.boxShadow = "0 6px 12px rgba(0,0,0,0.4) !important";
    };
    b.onmouseleave = () => {
      b.style.transform = "scale(1)";
      b.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3) !important";
    };
    b.onclick = () => {
      console.log(`[LearnFlow] Button clicked: ${panel}`);
      
      try {
        chrome.runtime.sendMessage({ action: "TOGGLE_PANEL", panel }, response => {
          if (chrome.runtime.lastError) {
            console.error("[LearnFlow] Message sending error:", chrome.runtime.lastError);
          } else {
            console.log(`[LearnFlow] Message response:`, response);
          }
        });
      } catch (error) {
        console.error("[LearnFlow] Error sending message:", error);
      }
    };
    
    return b;
  };

  // Add core buttons
  wrap.append(
    makeBtn("💬", "chat"), 
    makeBtn("📝", "notes")
  );
  
  // Only show summary button for videos longer than 10 minutes
  if (shouldShowSummary()) {
    wrap.append(makeBtn("📚", "summary"));
  }

  // Add to body
  document.body.appendChild(host);
  console.log("[LearnFlow] Floating UI added to page", host);
}

/**
 * Checks if the summary button should be shown
 * Only show summary for videos longer than 10 minutes (600 seconds)
 */
function shouldShowSummary(): boolean {
  const video = document.querySelector('video');
  return video !== null && video.duration > 600; // Only for videos longer than 10 minutes
}
