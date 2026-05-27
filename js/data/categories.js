// ═══════════════════════════════════════════════════════
// CATEGORIES & EVIDENCE CONSTANTS
// ═══════════════════════════════════════════════════════

export const CATEGORIES = [
  {id:'weight',name:'Weight Loss',icon:'⚖️',color:'#3ddc84',peptides:['Tirzepatide','Semaglutide','Retatrutide','Cagrilintide','Semaglutide (Oral)','Tirzepatide (Oral)','Lipo-C','AOD9604','HGH Fragment','Adipotide','Amylin','Tesofensine']},
  {id:'healing',name:'Healing & Recovery',icon:'🔧',color:'#60b4ff',peptides:['BPC-157','BPC-157 Oral','TB-500','KPV','LL37','GHK-Cu','Fortigel','Tendoforte','Pentadeca Arginate','GLP-2','Larazotide','Thymosin Beta-4 (TB4)','Glutamine','Collagen Type I']},
  {id:'gh',name:'Growth Hormone',icon:'📈',color:'#b39dff',peptides:['CJC-1295 (no DAC)','CJC-1295 (with DAC)','Ipamorelin','GHRP-2','GHRP-6','GHRP-1','Hexarelin','Sermorelin','Tesamorelin','HGH 191AA','MK-677','Macimorelin']},
  {id:'antiaging',name:'Anti-Aging',icon:'✨',color:'#ffb347',peptides:['GHK-Cu','GHK-Cu (Topical)','Epithalon','Epithalon (Nasal)','Epitalon + Thymalin Combo','Snap-8','L-Glutathione','Glutathione IV','Vitamin C IV','Melatonin','Carnosine','Spermidine','Rapamycin','Rapamycin (Low Dose)','Palmitoyl Pentapeptide-4','Acetyl Hexapeptide-3','Spilanthol','Klotho','Resveratrol','Fisetin','Quercetin','FOXO4-DRI']},
  {id:'mito',name:'Mitochondrial',icon:'⚡',color:'#ff6b9d',peptides:['NAD+','SS-31','MOTS-c','MOTS-c (Analog)','Humanin','5-amino-1mq','SLU-PP-332','NMN','NR (Nicotinamide Riboside)','Coenzyme Q10 (Injectable)','Acetyl L-Carnitine']},
  {id:'muscle',name:'Muscle & IGF',icon:'💪',color:'#ff6b6b',peptides:['IGF-1 LR3','IGF DES','HGH 191AA','Follistatin 344','MGF','HCG','Thymosin Beta-4 (TB4)']},
  {id:'neuro',name:'Cognitive',icon:'🧠',color:'#4ecdc4',peptides:['Semax','Semax Nasal','Selank','Selank Nasal','DSIP','Dihexa','Dihexa (Nasal)','Pinealon','Cortagen','P21','Cerebrolysin','Alpha GPC','Noopept']},
  {id:'immune',name:'Immune',icon:'🛡️',color:'#ffd93d',peptides:['Thymosin Alpha-1','Thymalin','VIP','Vasoactive Intestinal Peptide (Nasal)','KPV','LL37','Epithalon','ARA-290','Zinc Thymulin','Angiotensin 1-7']},
  {id:'hormonal',name:'Hormonal',icon:'⚗️',color:'#a8e6cf',peptides:['HCG','PT-141','Melanotan I','Melanotan II','KissPeptin-10','Kisspeptin-54','Oxytocin','Oxytocin (Nasal)','Gonadorelin','Testosterone (Low Dose)','DHEA','Pregnenolone','Progesterone','Anastrozole','Anastrozole Peptide','Enclomiphene']},
  {id:'metabolic',name:'Metabolic / Longevity',icon:'🔬',color:'#00b894',peptides:['Berberine','Metformin','Rapamycin','Spermidine','NMN','NR (Nicotinamide Riboside)','Carnosine','Alpha GPC','Acetyl L-Carnitine']},
  {id:'cardio',name:'Cardiovascular',icon:'❤️',color:'#e17055',peptides:['Angiotensin 1-7','SS-31','Coenzyme Q10 (Injectable)']},
  {id:'recon',name:'Reconstitution',icon:'💧',color:'#74b9ff',peptides:['BAC Water','Acetic Acid Water']},
];


export const CAT_COLORS={weight:'#1756a9',healing:'#0d7377',gh:'#5b35c8',antiaging:'#d4812b',mito:'#c0392b',muscle:'#1a7a4a',neuro:'#4ecdc4',immune:'#d4812b',hormonal:'#7c3aed',metabolic:'#00b894',cardio:'#e17055',recon:'#74b9ff'};
export const CAT_BG={weight:'#e8f0fb',healing:'#e6f5f5',gh:'#f0eaff',antiaging:'#fdf5e8',mito:'#fdf0ee',muscle:'#e8f5ee',neuro:'#e6f9f9',immune:'#fdf5e8',hormonal:'#f5f0ff',metabolic:'#e6faf5',cardio:'#fdf0ee',recon:'#eff6ff'};
export const EVIDENCE_LABELS=['','Anecdotal Only','Preclinical / Animal','Early Human Data','Phase 3 / Clinical','FDA Approved'];
export const EVIDENCE_BADGE_CLASS=['','experimental','preclinical','phase2','phase3','fda'];
