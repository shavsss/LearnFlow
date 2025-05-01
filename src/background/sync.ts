import { auth, db as fsDb } from "./firebase";
import { dbIDB, enqueueWrite } from "@/indexdb/dexie";
import {
  collection, addDoc, serverTimestamp,
  onSnapshot, query, orderBy
} from "firebase/firestore";
import { bus } from "./broadcast";

export function setupSync() {
  const authInstance = auth();
  if (!authInstance) return;
  
  authInstance.onAuthStateChanged((user) => {
    if (!user) return;
    flushQueue(user.uid);
    subscribeRemote(user.uid);
  });
}

async function flushQueue(uid: string) {
  const items = await dbIDB.queue.toArray();
  const firestore = fsDb();
  if (!firestore) {
    console.error("[Sync] Firestore is null");
    return;
  }
  
  for (const q of items) {
    try {
      switch (q.type) {
        case "SAVE_WORD":
          await addDoc(collection(firestore, `users/${uid}/vocabulary`), {
            ...q.payload,
            ts: serverTimestamp()
          });
          break;
        case "SAVE_NOTE":
          await addDoc(collection(firestore, `users/${uid}/notes`), q.payload);
          break;
        case "SAVE_CHAT":
          await addDoc(collection(firestore, `users/${uid}/chats`), q.payload);
          break;
      }
      await dbIDB.queue.delete(q.id!);
    } catch (e) {
      console.error("[Sync] Flush failed", e);
    }
  }
}

function subscribeRemote(uid: string) {
  const firestore = fsDb();
  if (!firestore) {
    console.error("[Sync] Firestore is null");
    return;
  }
  
  const coll = collection(firestore, `users/${uid}/vocabulary`);
  onSnapshot(query(coll, orderBy("ts", "desc")), (snap) => {
    snap.docChanges().forEach((c) => {
      if (c.type === "added") {
        dbIDB.words.put({ id: c.doc.id, ...(c.doc.data() as any) });
        bus.emit("WORD_ADDED", c.doc.data());
      }
    });
  });
  // Similar listeners for notes & chats – omitted for brevity.
}

// If navigator goes offline, queue writes automatically via helper:
export function saveOffline(type: string, payload: any) {
  const authInstance = auth();
  if (!navigator.onLine || !authInstance || !authInstance.currentUser) {
    return enqueueWrite(type, payload);
  }
}
