// ---------- src/ui/summary/ExportButtons.tsx ----------
export function ExportButtons({ onMd, onPdf }: { onMd: () => void; onPdf: () => void }) {
    return (
      <div className="border-t p-2 flex gap-2 justify-end text-sm">
        <button className="text-blue-600" onClick={onMd}>Markdown</button>
        <button className="text-blue-600" onClick={onPdf}>PDF</button>
      </div>
    );
  }