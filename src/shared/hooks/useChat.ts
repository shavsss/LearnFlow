// ---------- src/shared/hooks/useChat.ts ----------
import { useLiveQuery } from "dexie-react-hooks";
import { dbIDB } from "@/indexdb/dexie";
import { enqueueWrite } from "@/indexdb/dexie";
import { useState } from "react";

export function useChat(videoId: string) {
  const messages = useLiveQuery(() => dbIDB.chats.where("videoId").equals(videoId).toArray(), [videoId]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const send = async (text: string) => {
    // Reset error state
    setError(null);
    
    // Add user message to UI immediately
    const userMsg = { 
      videoId, 
      role: "user" as const, 
      text, 
      ts: new Date().toISOString() 
    };
    await dbIDB.chats.add(userMsg);
    enqueueWrite("SAVE_CHAT", userMsg);
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Get existing chat history for context
      const existingMessages = await dbIDB.chats
        .where("videoId")
        .equals(videoId)
        .sortBy("ts");
      
      // Format history for the Gemini API (last 10 messages for context)
      const history = existingMessages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          text: msg.text
        }));
      
      // Send request to Gemini via runtime → offscreen with error handling
      const reply = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { 
            action: "ASK_GEMINI", 
            prompt: text, 
            history: history,
            videoId: videoId
          },
          (response) => {
            // Check for runtime errors (connection issues)
            if (chrome.runtime.lastError) {
              console.error("Chrome runtime error:", chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            // If we got a response, resolve with it
            resolve(response);
          }
        );
      });
      
      if (reply && reply.success) {
        // Add assistant response to UI
        const botMsg = { 
          videoId, 
          role: "assistant" as const, 
          text: reply.response, 
          ts: new Date().toISOString() 
        };
        await dbIDB.chats.add(botMsg);
        enqueueWrite("SAVE_CHAT", botMsg);
      } else {
        // Handle error from the API
        const errorMessage = reply?.error || "Unknown error occurred";
        console.error("Gemini API error:", errorMessage);
        setError(errorMessage);
        
        const errorMsg = { 
          videoId, 
          role: "assistant" as const, 
          text: `Sorry, I encountered an error: ${errorMessage}`, 
          ts: new Date().toISOString() 
        };
        await dbIDB.chats.add(errorMsg);
      }
    } catch (error) {
      // Handle communication or other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Chat error:", errorMessage);
      setError(errorMessage);
      
      // Add error message
      const errorMsg = { 
        videoId, 
        role: "assistant" as const, 
        text: `Sorry, communication error: ${errorMessage}`, 
        ts: new Date().toISOString() 
      };
      await dbIDB.chats.add(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    messages: messages || [], 
    send,
    isLoading,
    error
  } as const;
}