// ---------- src/ui/notes/NotesRoot.tsx ----------
/**
 * Floating Notes drawer – simple textarea per video.
 */
import { useState, useRef, useEffect } from "react";
import { dbIDB } from "@/indexdb/dexie";

export function NotesRoot({ videoId }: { videoId: string }) {
  const [notes, setNotes] = useState<Array<{ id?: string; text: string; ts: string }>>([]);
  const [newNote, setNewNote] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const videoNotes = await dbIDB.notes
          .where("videoId")
          .equals(videoId)
          .reverse()
          .sortBy("ts");
        setNotes(videoNotes);
      } catch (error) {
        console.error("[Notes] Error loading notes:", error);
      }
    };
    
    loadNotes();
  }, [videoId]);

  // Save note
  const saveNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const note = {
        videoId,
        text: newNote.trim(),
        ts: new Date().toISOString()
      };
      
      await dbIDB.notes.add(note);
      setNotes([note, ...notes]);
      setNewNote("");
      
      // Report to background
      try {
        chrome.runtime.sendMessage({ 
          action: 'SAVE_NOTE', 
          payload: note 
        });
      } catch (e) {
        console.error("[Notes] Failed to report note save:", e);
      }
    } catch (error) {
      console.error("[Notes] Error saving note:", error);
    }
  };

  return (
    <div className="w-80 h-96 flex flex-col bg-white rounded-lg shadow-lg">
      <div className="p-3 border-b">
        <textarea
          ref={textareaRef}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type your note here..."
          className="w-full p-2 border rounded text-sm"
          rows={3}
        />
        <button 
          onClick={saveNote}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Save Note
        </button>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {notes.map((note, index) => (
          <div 
            key={note.id || index} 
            className="p-2 bg-gray-50 border rounded text-sm"
          >
            <div className="whitespace-pre-wrap">{note.text}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(note.ts).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}