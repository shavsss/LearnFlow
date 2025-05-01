// ---------- src/ui/summary/SummaryRoot.tsx ----------
/**
 * Summary drawer – shows bullet points & term cards, allows export.
 */
import { useSummary } from "@/shared/hooks/useSummary";
import { ExportButtons } from "./ExportButtons";
import { TermCard } from "./TermCard";

export function SummaryRoot({ videoId }: { videoId: string }) {
  const { summary, terms, exportMd, exportPdf } = useSummary(videoId);

  return (
    <div className="w-96 h-[28rem] bg-white rounded-lg shadow-lg flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto text-sm space-y-2">
        <h2 className="font-semibold text-base mb-1">Summary</h2>
        <ul className="list-disc list-inside space-y-1">
          {summary.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <h2 className="font-semibold text-base mt-3 mb-1">Key Terms</h2>
        <div className="flex flex-wrap gap-2">
          {terms.map((t) => (
            <TermCard key={t.term} term={t.term} def={t.def} />
          ))}
        </div>
      </div>
      <ExportButtons onMd={exportMd} onPdf={exportPdf} />
    </div>
  );
}
