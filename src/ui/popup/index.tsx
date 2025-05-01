// ---------- src/ui/popup/index.tsx ----------
import { createRoot } from "react-dom/client";
import PopupApp from "./App";
import '@/styles/tailwind.css';
import '@/styles/popup.css';
import '@/styles/animations.css';

createRoot(document.getElementById("root")!).render(<PopupApp />);