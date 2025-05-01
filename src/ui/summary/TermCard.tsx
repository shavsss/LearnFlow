// ---------- src/ui/summary/TermCard.tsx ----------
/**
 * Term card component displays a key term and its definition.
 */

interface TermCardProps {
  term: string;
  def: string;
}

export function TermCard({ term, def }: TermCardProps) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-md p-2 max-w-[45%]">
      <div className="font-medium text-blue-800">{term}</div>
      <div className="text-xs text-gray-600 mt-1">{def}</div>
    </div>
  );
}
  