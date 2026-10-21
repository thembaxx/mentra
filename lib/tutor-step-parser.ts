export interface ParsedTutorStep {
  id: string;
  badge: string;
  title: string;
  body: string;
  isVerification: boolean;
}

/**
 * Preserve paragraphs inside a numbered step. The old double-newline split
 * treated a calculation paragraph as a new step and desynchronized diagrams.
 * IDs stay stable as new tokens stream into the same heading.
 */
export function parseTutorStepsIntoCards(raw: string): ParsedTutorStep[] {
  if (!raw.trim()) return [];
  const clean = raw.replace(/\r\n/g, '\n').trim();
  const header = /^(Step\s*(\d+)|Verification|Check|Final\s+Answer|Answer)\s*:/gim;
  const matches = Array.from(clean.matchAll(header));

  if (matches.length === 0) {
    return clean.split(/\n{2,}/).map(s => s.trim()).filter(Boolean).map((body,idx)=>({
      id:'step-'+idx,
      badge:String(idx+1).padStart(2,'0'),
      title:'Step '+(idx+1),
      body,
      isVerification:false,
    }));
  }
  const items: ParsedTutorStep[] = [];
  if (matches[0].index! > 0) {
    const intro=clean.slice(0,matches[0].index).trim();
    if (intro) items.push({
      id:'step-intro',badge:'•',title:'Introduction',body:intro,isVerification:false,
    });
  }
  for (let i=0;i<matches.length;i++) {
    const hit=matches[i];
    const label=hit[1].trim();
    const stepNum=hit[2] ? Number(hit[2]):null;
    const isVerification=/^(Verification|Check|Final\s+Answer|Answer)$/i.test(label);
    const start=hit.index!+hit[0].length;
    const end=i+1<matches.length?matches[i+1].index!:clean.length;
    const body=clean.slice(start,end).trim();
    items.push({
      id:'step-'+i+'-'+label.toLowerCase().replace(/\s+/g,'-'),
      badge:stepNum!==null?String(stepNum).padStart(2,'0'):'✓',
      title:stepNum!==null?'Step '+stepNum:label,
      body,isVerification,
    });
  }
  return items;
}
