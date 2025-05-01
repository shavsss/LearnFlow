/** 
 * Returns the appropriate detector based on the current page.
 * Handles YouTube specifically, and falls back to GenericCaptionDetector for other sites.
 */
import { YouTubeCaptionDetector } from "./youtubeCaptionDetector";
import { GenericCaptionDetector } from "./genericCaptionDetector";

export type AnyDetector = YouTubeCaptionDetector | GenericCaptionDetector;

// Add event listener for testing
let detector: AnyDetector | null = null;
document.addEventListener('learnflow-test', (e: Event) => {
  console.log("[LearnFlow] Received test event", (e as CustomEvent).detail);
  if ((e as CustomEvent).detail?.action === 'init-captions') {
    console.log("[LearnFlow] Forcing caption detector initialization");
    detector = detector || getDetectorForSite();
    detector.detect();
  }
});

// Detect which site we're on
function getDetectorForSite(): AnyDetector {
  // Check if we're on YouTube
  if (isYouTube()) {
    console.log("[LearnFlow] YouTube site detected");
    return new YouTubeCaptionDetector();
  }
  
  // For all other sites, use the generic detector
  console.log("[LearnFlow] Non-YouTube site, using generic detector");
  return new GenericCaptionDetector();
}

// Check if we're on YouTube
function isYouTube(): boolean {
  const isYouTubeDomain = location.hostname.includes("youtube.com") || location.hostname === "youtu.be";
  const isYouTubeEmbed = location.hostname.includes("youtube.com") && location.pathname.startsWith("/embed/");
  
  // Also check for YouTube iframes
  const hasYouTubeIframe = document.querySelector('iframe[src*="youtube.com/embed/"]') !== null;
  
  return isYouTubeDomain || isYouTubeEmbed || hasYouTubeIframe;
}

// Check if the YouTube captions are available
function hasYouTubeCaptions(): boolean {
  // Check all possible YouTube caption containers
  const youtubeSelectors = [
    ".ytp-caption-window-container",  // Standard YouTube captions
    ".captions-text",                 // Alternative YouTube caption class
    "div.caption-window",             // Another possible caption container
    "#caption-window-0"               // Auto-generated captions container
  ];
  
  for (const selector of youtubeSelectors) {
    if (document.querySelector(selector)) {
      console.log(`[LearnFlow] Found YouTube caption element with selector: ${selector}`);
      return true;
    }
  }
  
  // Check if captions are enabled by checking the CC button
  const ccButton = document.querySelector('.ytp-subtitles-button');
  if (ccButton) {
    const isActive = ccButton.getAttribute('aria-pressed') === 'true';
    console.log("[LearnFlow] CC button active:", isActive);
    return isActive;
  }
  
  return false;
}

export function pickDetector(): AnyDetector | null {
  console.log("[LearnFlow] Picking appropriate detector for page");
  
  // For YouTube-specific detection
  if (isYouTube()) {
    // If YouTube captions are visible, definitely use YouTube detector
    if (hasYouTubeCaptions()) {
      console.log("[LearnFlow] YouTube with active captions detected");
      detector = new YouTubeCaptionDetector();
      return detector;
    }
    
    // Even without visible captions, still use YouTube detector as they might be added later
    console.log("[LearnFlow] YouTube site without visible captions, still using YouTube detector");
    detector = new YouTubeCaptionDetector();
    return detector;
  }
  
  // For all other sites with videos
  if (document.querySelector('video')) {
    console.log("[LearnFlow] Video element found, using generic detector");
    detector = new GenericCaptionDetector();
    return detector;
  }
  
  // No video found yet, but we'll use generic detector anyway (it will set up observers)
  console.log("[LearnFlow] No video element found yet, using generic detector with observers");
  detector = new GenericCaptionDetector();
  return detector;
}
