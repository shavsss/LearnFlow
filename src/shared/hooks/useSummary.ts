// ---------- src/shared/hooks/useSummary.ts ----------
import { useState, useEffect } from 'react';
import { dbIDB, SummaryRow } from '@/indexdb/dexie';

interface Term {
  term: string;
  def: string;
}

interface UseSummaryResult {
  summary: string[];
  terms: Term[];
  exportMd: () => void;
  exportPdf: () => void;
}

export function useSummary(videoId: string): UseSummaryResult {
  const [summaryData, setSummaryData] = useState<SummaryRow | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      const data = await dbIDB.summaries.get(videoId);
      if (data) {
        setSummaryData(data);
      }
    };
    
    loadSummary();
  }, [videoId]);

  const exportMd = () => {
    if (!summaryData) return;
    
    let content = `# Summary for video\n\n`;
    
    // Add bullet points
    content += `## Key Points\n\n`;
    summaryData.summary.forEach(point => {
      content += `* ${point}\n`;
    });
    
    // Add terms
    content += `\n## Key Terms\n\n`;
    summaryData.terms.forEach(term => {
      content += `**${term.term}**: ${term.def}\n\n`;
    });
    
    // Create downloadable link
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${videoId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const exportPdf = () => {
    // In a real implementation, this would generate a PDF
    // For now we'll just show an alert
    alert('PDF export functionality would be implemented here');
  };

  return {
    summary: summaryData?.summary || [],
    terms: summaryData?.terms || [],
    exportMd,
    exportPdf
  };
}
