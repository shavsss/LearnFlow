// ========================= src/offscreen/gemini.ts =========================
/**
 * Offscreen document for handling Gemini API calls
 * This allows us to make API calls without blocking the main thread
 * and solves CORS issues by using the extension's permissions
 */
import { httpsCallable } from "firebase/functions";
import { initFirebase, fns } from "@/background/firebase";

// Initialize Firebase to have access to functions
initFirebase();

// Log that the offscreen document is loaded
console.log("[Offscreen Gemini] Document loaded and ready for API calls");

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Offscreen Gemini] Message received:", message.action, "from", sender.id || "unknown");
  
  // Make sure this listener always returns true for async responses
  let isAsyncResponse = false;
  
  try {
    // Handle different message types
    switch (message.action) {
      case 'TRANSLATE_WORD':
        handleTranslation(message, sendResponse);
        isAsyncResponse = true; // Async response will be handled
        break;
        
      case 'ASK_GEMINI':
        handleGeminiChat(message, sendResponse);
        isAsyncResponse = true; // Async response will be handled
        break;
        
      case 'SUMMARIZE':
        handleSummarize(message, sendResponse);
        isAsyncResponse = true; // Async response will be handled
        break;
        
      default:
        console.error("[Offscreen Gemini] Unknown action:", message.action);
        sendResponse({ 
          success: false, 
          error: `Unknown action: ${message.action}` 
        });
    }
  } catch (error) {
    console.error("[Offscreen Gemini] Error processing message:", error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
  
  return isAsyncResponse; // Keep channel open for async responses
});

/**
 * Handle translation requests using Cloud Functions
 */
async function handleTranslation(message: any, sendResponse: Function) {
  try {
    console.log("[Offscreen Gemini] Translating word:", message.word);
    
    const functions = fns();
    if (!functions) {
      console.error("[Offscreen Gemini] Firebase Functions not initialized");
      sendResponse({ success: false, error: "Firebase Functions not initialized" });
      return;
    }
    
    const translateFn = httpsCallable(
      functions, 
      'translateWord'
    );
    
    const result = await translateFn({
      word: message.word,
      target: message.target || 'en'
    });
    
    console.log("[Offscreen Gemini] Translation result:", result.data);
    sendResponse({ 
      success: true, 
      text: (result.data as any).translatedText,
      detectedSource: (result.data as any).detectedSourceLanguage
    });
  } catch (error) {
    console.error("[Offscreen Gemini] Translation error:", error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Handle Gemini chat requests using Cloud Functions
 */
async function handleGeminiChat(message: any, sendResponse: Function) {
  try {
    console.log("[Offscreen Gemini] Processing chat:", message.prompt);
    
    const functions = fns();
    if (!functions) {
      console.error("[Offscreen Gemini] Firebase Functions not initialized");
      sendResponse({ success: false, error: "Firebase Functions not initialized" });
      return;
    }
    
    const geminiChatFn = httpsCallable(
      functions, 
      'askGemini'
    );
    
    const result = await geminiChatFn({
      prompt: message.prompt,
      history: message.history || [],
      context: message.context || '',
      videoId: message.videoId || ''
    });
    
    console.log("[Offscreen Gemini] Chat result received");
    sendResponse({ 
      success: true, 
      response: (result.data as any).response
    });
  } catch (error) {
    console.error("[Offscreen Gemini] Chat error:", error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Handle summarization requests using Cloud Functions
 */
async function handleSummarize(message: any, sendResponse: Function) {
  try {
    console.log("[Offscreen Gemini] Summarizing content for video:", message.videoId);
    
    const functions = fns();
    if (!functions) {
      console.error("[Offscreen Gemini] Firebase Functions not initialized");
      sendResponse({ success: false, error: "Firebase Functions not initialized" });
      return;
    }
    
    const summarizeFn = httpsCallable(
      functions, 
      'summarizeVideo'
    );
    
    const result = await summarizeFn({
      videoId: message.videoId,
      transcript: message.transcript || '',
      language: message.language || 'en'
    });
    
    console.log("[Offscreen Gemini] Summary result received");
    sendResponse({ 
      success: true, 
      summary: (result.data as any).summary,
      terms: (result.data as any).terms
    });
  } catch (error) {
    console.error("[Offscreen Gemini] Summarization error:", error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}