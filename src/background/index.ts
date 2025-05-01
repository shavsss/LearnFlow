/**
 * LearnFlow - Background Service Worker
 * 
 * - Initializes Firebase
 * - Sets up message listeners
 * - Manages offscreen document for API calls
 * - Handles browser events (tabs, install, update)
 */
import { initFirebase, auth } from './firebase';
import { setupSync } from './sync';
import { bus } from './broadcast';

// Types for messages
interface LearnFlowMessage {
  action: string;
  [key: string]: any;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// User settings
let userSettings = {
  targetLanguage: 'en',
  // Add other default settings here
};

// Authentication state
let isAuthenticated = false;

// Initialize services
initFirebase();
setupSync();

// Listen for auth state changes
bus.on((msg) => {
  if (msg.type === 'AUTH_STATE_CHANGED') {
    isAuthenticated = msg.payload.isAuthenticated;
    console.log(`[Background] Auth state changed: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    
    // If user logged out, reset to default settings
    if (!isAuthenticated) {
      userSettings = {
        targetLanguage: 'en',
      };
    }
    // If logged in, could load user-specific settings from Firestore here
  }
});

// Ensure offscreen document exists
async function ensureOffscreen() {
  try {
    const hasDocument = await chrome.offscreen.hasDocument();
    if (hasDocument) {
      console.log('[Background] Offscreen document already exists');
      return;
    }
    
    // Clean up any existing document first (as a precaution)
    try {
      await chrome.offscreen.closeDocument();
      console.log('[Background] Closed any existing offscreen document');
    } catch (e) {
      // Ignore errors if no document exists
    }
    
    const path = chrome.runtime.getURL('offscreen/gemini.html');
    await chrome.offscreen.createDocument({
      url: path,
      reasons: ['DOM_PARSER'] as chrome.offscreen.Reason[],
      justification: 'Gemini API calls for translation and chat'
    });
    
    console.log('[Background] Offscreen document created');
  } catch (e) {
    console.error('[Background] Failed to create offscreen document:', e);
    throw e; // Re-throw to allow caller to handle
  }
}

// Initialize offscreen document on startup
ensureOffscreen();

// Handle extension events
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    console.log('[Background] Extension installed');
    // TODO: Open onboarding page
  }
});

// Helper function to send messages to the offscreen document
async function sendMessageToOffscreen(message: any): Promise<any> {
  // Make sure the offscreen document exists
  await ensureOffscreen();
  
  // Target the message specifically to the offscreen document
  return new Promise((resolve, reject) => {
    try {
      // Use tabs messaging to the offscreen document
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Error sending message to offscreen:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      console.error('[Background] Failed to send message to offscreen:', error);
      reject(error);
    }
  });
}

// Handle messages from content scripts and UI
chrome.runtime.onMessage.addListener((
  message: LearnFlowMessage, 
  _sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: ApiResponse) => void
) => {
  // Handle different message types
  switch (message.action) {
    case 'TOGGLE_PANEL':
      console.log(`[Background] Toggle panel: ${message.panel}`);
      
      // Forward the message to the active tab's content script to open the panel
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            console.log('[Background] Panel toggle response:', response);
            sendResponse({ success: true, data: response });
          });
        } else {
          console.log('[Background] No active tab to send panel toggle to');
          sendResponse({ success: false, error: 'No active tab' });
        }
      });
      
      return true; // Keep channel open for async response
      break;
    
    case 'GET_SETTINGS':
      // Check auth state from Firebase directly
      const authInstance = auth();
      const currentUser = authInstance?.currentUser;
      
      console.log('[Background] GET_SETTINGS request', { 
        isAuthenticated, 
        hasUser: !!currentUser,
        email: currentUser?.email || 'none'
      });
      
      // Always return settings - even if not authenticated we return defaults
      sendResponse({ 
        success: true, 
        data: userSettings
      });
      break;
      
    case 'SAVE_SETTINGS':
      // Update settings
      if (message.settings && typeof message.settings === 'object') {
        userSettings = {...userSettings, ...message.settings};
        console.log('[Background] Settings updated:', userSettings);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Invalid settings object' });
      }
      break;
      
    case 'GET_AUTH_STATE':
      // Return current authentication state
      const user = auth()?.currentUser;
      sendResponse({
        success: true,
        data: {
          isAuthenticated: !!user,
          email: user?.email || null,
          displayName: user?.displayName || null
        }
      });
      break;
      
    case 'TRANSLATE_WORD':
      // Handle translation request
      console.log('[Background] Translation request:', message.word);
      sendMessageToOffscreen(message)
        .then(response => {
          console.log('[Background] Translation response received');
          sendResponse(response);
        })
        .catch(error => {
          console.error('[Background] Translation error:', error);
          sendResponse({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          });
        });
      return true; // Keep channel open for async response
      
    case 'ASK_GEMINI':
    case 'SUMMARIZE':
      // Handle Gemini API request
      console.log('[Background] Gemini API request:', message.action);
      sendMessageToOffscreen(message)
        .then(response => {
          console.log('[Background] Gemini API response received');
          sendResponse(response);
        })
        .catch(error => {
          console.error('[Background] Gemini API error:', error);
          sendResponse({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          });
        });
      return true; // Keep channel open for async response
      
    case 'RECONNECT_OFFSCREEN':
      console.log('[Background] Attempting to reconnect offscreen document');
      // Force recreate the offscreen document
      chrome.offscreen.closeDocument()
        .catch(e => console.log('No document to close:', e))
        .finally(() => {
          ensureOffscreen()
            .then(() => {
              console.log('[Background] Offscreen document reconnected');
              sendResponse({ success: true });
            })
            .catch(error => {
              console.error('[Background] Failed to reconnect offscreen:', error);
              sendResponse({ 
                success: false, 
                error: error instanceof Error ? error.message : String(error) 
              });
            });
        });
      return true; // Keep channel open for async response
      
    default:
      console.log('[Background] Unknown message:', message);
  }
});

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener((
  tabId: number, 
  changeInfo: chrome.tabs.TabChangeInfo, 
  tab: chrome.tabs.Tab
) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    // Content script is injected via manifest.json
    // This is just for additional logic if needed
    bus.emit('TAB_UPDATED', { tabId, url: tab.url });
  }
});
