// ═══════════════════════════════════════════════════════
// STACKS DATA
// ═══════════════════════════════════════════════════════

export const STACKS_ES = [
  {
    name:'WOLVERINE STACK',cycle:'8–12 weeks on / 4 weeks off',
    goal:'Recuperación de lesiones · Reparación de tejidos · Reducción del dolor',
    description:'El stack de sanación más popular — BPC-157 actúa localmente en el sitio de lesión mientras TB-500 proporciona reparación sistémica en todo el cuerpo. Juntos cubren ambas vías de sanación para una recuperación integral.',
    rationale:'BPC-157 actúa localmente vía VEGFR2/Akt-eNOS en el sitio de lesión. TB-500 actúa sistémicamente vía regulación de actina en todo el cuerpo. Son mecanismos completamente diferentes — cada protocolo clínico recomienda usarlos juntos precisamente porque se complementan.',
    benefits:['Cicatrización acelerada de tendones y ligamentos','Reducción del dolor e inflamación en el sitio de lesión','Regreso más rápido al entrenamiento','Reparación sistémica de tejidos y mejora de flexibilidad','Sanación intestinal como beneficio secundario (BPC-157)','Reducción de formación de tejido cicatricial (TB-500)'],
    sideEffects:[{text:'Irritación en sitio de inyección (leve)',severity:'low'},{text:'Preocupación teórica de promoción tumoral con BPC-157 — no confirmada en humanos',severity:'med'}],
    note:'Inyectar cada uno por separado — nunca mezclar en la misma jeringa. BPC-157 cerca del sitio de lesión; TB-500 en cualquier lugar SubQ.',
  },
  {
    name:'GLOW STACK',cycle:'12 weeks on / 4 weeks off',
    goal:'Antienvejecimiento · Piel y colágeno · Regeneración integral',
    description:'GLOW = GHK-Cu + BPC-157 + TB-500. El stack de antienvejecimiento y optimización de piel. GHK-Cu impulsa la síntesis de colágeno mientras los péptidos de sanación proporcionan soporte regenerativo sistémico.',
    rationale:'GHK-Cu activa genes de síntesis de colágeno y restablece la expresión genética hacia patrones más juveniles. BPC-157 y TB-500 proporcionan la base de reparación de tejidos y antiinflamación. Los tres trabajan en aspectos diferentes pero complementarios de la regeneración de piel y tejidos.',
    benefits:['Firmeza de piel y reducción de arrugas por estimulación de colágeno de GHK-Cu','Efectos antienvejecimiento sistémicos vía reconfiguración de expresión genética','Producción de colágeno y elastina','Reducción de inflamación','Mejora de flexibilidad y rango de movimiento'],
    sideEffects:[{text:'Enrojecimiento en sitio de inyección por GHK-Cu (leve, transitorio)',severity:'low'},{text:'Posible oscurecimiento temporal de piel (efecto del cobre)',severity:'low'}],
    note:'GHK-Cu también puede aplicarse tópicamente en cara/piel además de SubQ. Inyectar BPC-157 y TB-500 por separado.',
  },
  {
    name:'KLOW STACK',cycle:'12 weeks on / 4 weeks off',
    goal:'Sanación máxima · Inmunomodulación · Reparación intestinal · Inflamación crónica',
    description:'KLOW = GLOW + KPV. El stack de sanación y antiinflamación más integral disponible. KPV añade potente inhibición de NF-kB y sanación mucosa — especialmente poderoso para problemas intestinales, EII y inflamación crónica.',
    rationale:'KPV inhibe específicamente NF-kB en superficies mucosas donde BPC-157 también actúa. La combinación proporciona sanación local + sistémica (BPC-157 + TB-500), regeneración de piel/colágeno (GHK-Cu), Y modulación antiinflamatoria de NF-kB (KPV) en todos los tipos de tejido.',
    benefits:['El protocolo de sanación más integral disponible','Soporte para inflamación GI y EII (sinergia KPV + BPC-157)','Regeneración de piel y tejidos sistémicos','Inmunomodulación sin inmunosupresión','Reparación de intestino permeable y barrera mucosa'],
    sideEffects:[{text:'Los cuatro péptidos son bien tolerados individualmente',severity:'low'},{text:'Carga de inyecciones: 3 SubQ diarios + 1 semanal',severity:'low'}],
    note:'Inyectar todos los péptidos por separado. Alta frecuencia — considera comenzar con Wolverine o GLOW antes de escalar al KLOW completo.',
  },
  {
    name:'GH STACK (Classic)',cycle:'16–24 weeks (two-phase: 8–12 wks CJC, then 8–12 wks Tesamorelin)',
    goal:'Optimización de GH · Músculo magro · Pérdida de grasa · Sueño · Antienvejecimiento',
    description:'El protocolo estándar de oro para péptidos de GH. CJC-1295 (con DAC) proporciona elevación sostenida de GH una vez por semana mediante unión a albúmina, mientras Ipamorelin añade un pulso diario limpio de GH. Juntos producen elevación basal sostenida más un pulso diario — sin elevar cortisol ni prolactina.',
    rationale:'CJC-1295 (con DAC) se une a la albúmina extendiendo su vida media a 6–8 días — una inyección por semana mantiene GH elevado durante toda la semana. Ipamorelin actúa en GHS-R1a para añadir un pulso diario limpio de GH encima. Dos vías de receptores completamente diferentes — la combinación te da elevación sostenida Y pulsatilidad fisiológica. Sin cortisol, sin prolactina, sin ACTH.',
    benefits:['Elevación basal sostenida de GH (CJC con DAC semanal)','Pulso diario limpio de GH añadido (Ipamorelin)','Ganancia de masa muscular magra','Pérdida de grasa vía lipólisis','Mejora del sueño profundo','Sin elevación de cortisol ni prolactina'],
    sideEffects:[{text:'Retención de agua al inicio (común, se resuelve en 2–3 semanas)',severity:'low'},{text:'Túnel carpiano con IGF-1 elevado',severity:'med'},{text:'Elevación de glucosa en sangre',severity:'med'}],
    note:'CJC-1295 con DAC: una inyección por semana, mismo día cada semana. Ipamorelin: inyección diaria antes de dormir con estómago vacío. No mezclar en la misma jeringa.',
  },
  {
    name:'SLEEP STACK',cycle:'12 weeks on / 4 weeks off. Melatonin can run ongoing at low dose.',
    goal:'Sueño profundo · Pulso nocturno de GH · Reducción de cortisol · Recuperación',
    description:'Optimización integral del sueño. Cada péptido actúa en un mecanismo diferente — secretagogos de GH, neuropéptidos inductores del sueño y la hormona circadiana principal — para una mejora completa de la arquitectura del sueño.',
    rationale:'Sermorelin + Ipamorelin impulsan el pulso natural nocturno de GH durante el sueño de ondas lentas. DSIP promueve el sueño delta vía modulación hipotalámica y reducción de cortisol. La melatonina inyectable proporciona señal de temporización circadiana y protección antioxidante mitocondrial sin somnolencia matutina.',
    benefits:['Sueño de ondas lentas (delta) más profundo','Pulso nocturno de GH mejorado','Normalización del cortisol','Energía matutina y claridad cognitiva','Adaptación al estrés y resiliencia'],
    sideEffects:[{text:'Somnolencia matutina si la melatonina se dosifica demasiado alta — empezar BAJO',severity:'low'},{text:'Retención de agua por los péptidos de GH',severity:'low'}],
    note:'Todo antes de dormir con estómago vacío. Sermorelin + Ipamorelin pueden compartir jeringa. DSIP por separado. La melatonina inyectable es 5–10x más potente que la oral — siempre empezar BAJO.',
  },
  {
    name:'CAGRISA STACK',cycle:'20+ weeks — no defined ceiling. Continue as long as weight loss is active.',
    goal:'Pérdida máxima de peso — doble vía GLP-1 + amilina',
    description:'El stack de pérdida de peso más potente en datos de ensayos Fase 3. CagriSema produjo 25.1% de pérdida de peso — el mayor jamás visto en un ensayo farmacéutico de Fase 3.',
    rationale:'Semaglutida activa receptores GLP-1. Cagrilintida activa receptores de amilina en el hipotálamo — una vía completamente diferente. La combinación produce pérdida de peso genuinamente aditiva porque los mecanismos biológicos no se superponen.',
    benefits:['25.1% de pérdida de peso corporal (ensayo Fase 3 REDEFINE)','Superior a cualquier agente GLP-1 único','Saciedad mejorada a través de dos vías independientes','Normalización del azúcar en sangre','Reducción de grasa hepática'],
    sideEffects:[{text:'Náuseas — aditivas de ambos agentes; titular lentamente',severity:'med'},{text:'Vómito durante la escalada de dosis',severity:'med'},{text:'Enfermedad de la vesícula biliar (efecto de clase GLP-1)',severity:'high'}],
    note:'Titular cada péptido de forma independiente. NUNCA combinar semaglutida con tirzepatida. Inyectar en sitios diferentes.',
  },
  {
    name:'NAD+ LONGEVITY STACK',cycle:'10 weeks on / 2 weeks off for NAD+ and MOTS-c. SS-31 can run longer.',
    goal:'Salud mitocondrial · Energía celular · Optimización metabólica · Antienvejecimiento',
    description:'El protocolo mitocondrial y de longevidad más integral. Cuatro compuestos dirigidos a diferentes vías mitocondriales para una optimización completa de la energía celular.',
    rationale:'NAD+ repone la coenzima esencial que disminuye con la edad. SS-31 reduce el estrés oxidativo en la membrana mitocondrial interna. MOTS-c imita el ejercicio activando AMPK. 5-amino-1mq previene que el NAD+ sea degradado por NNMT. Los cuatro actúan en objetivos completamente diferentes — sin redundancia.',
    benefits:['Optimización mitocondrial integral desde 4 vías diferentes','Restauración de energía celular y producción de ATP','Activación de reparación de ADN','Estimulación de sirtuinas de longevidad','Mejora de flexibilidad metabólica','Mejora de sensibilidad a la insulina'],
    sideEffects:[{text:'Sofocos con NAD+ — muy comunes al inicio; usar LOW primero',severity:'med'},{text:'Fatiga inicial (1–2 semanas) mientras las mitocondrias se adaptan',severity:'low'},{text:'Alta frecuencia de inyecciones (3 diarias)',severity:'low'}],
    note:'Preferiblemente todo en la mañana. NAD+ puede causar sofocos — siempre empezar BAJO. Agregar cada péptido una semana aparte para aislar reacciones.',
  },
  {
    name:'IMMUNE STACK',cycle:'Thymosin Alpha-1: 4–6 weeks 2x/week. Epithalon: 10–20 day burst 2–4x/year. BPC-157: ongoing.',
    goal:'Inmunomodulación · Longevidad · Antienvejecimiento · Soporte post-viral',
    description:'Optimización inmune integral. Timosina Alfa-1 es el péptido inmunomodulador más potente — aprobado en 35+ países. Epitalón añade antienvejecimiento a nivel de telómeros. BPC-157 proporciona la base antiinflamatoria.',
    rationale:'Timosina Alfa-1 activa células T, NK y dendríticas bidireccionalmente. Epitalón activa la telomerasa para alargar los telómeros. BPC-157 proporciona antiinflamación sistémica reduciendo la inflamación crónica de bajo grado que impulsa la disfunción inmune.',
    benefits:['Respuesta inmune antiviral mejorada','Activación de células T y NK','Alargamiento de telómeros','Soporte para COVID largo y síndrome post-viral','Regulación autoinmune (bidireccional)'],
    sideEffects:[{text:'Síntomas gripales las primeras 1–2 dosis de Timosina Alfa-1',severity:'low'},{text:'Epitalón SOLO en ciclos cortos de ráfaga — no continuo',severity:'med'}],
    note:'Timosina Alfa-1 es el núcleo. Epitalón en RÁFAGAS CORTAS únicamente (10–20 días por ráfaga, 2–4x/año). BPC-157 puede ejecutarse continuamente.',
  },
  {
    name:'FAT LOSS STACK',cycle:'20+ weeks. GLP-1 component runs ongoing. AOD9604 cycles 12 weeks on / 4 off.',
    goal:'Pérdida agresiva de grasa · Lipólisis · Aceleración metabólica · Preservación muscular',
    description:'Protocolo integral de pérdida de grasa atacando desde cuatro ángulos — supresión del apetito (GLP-1), lipólisis directa (AOD9604 + Fragmento HGH), y elevación de la tasa metabólica vía inhibición de NNMT (5-amino-1mq).',
    rationale:'GLP-1 maneja el apetito y la señalización metabólica. AOD9604 y Fragmento HGH activan lipólisis vía vías beta-3 adrenérgicas sin efectos de IGF-1 — seguros para combinar con GLP-1. 5-amino-1mq inhibe NNMT para elevar NAD+ y la tasa metabólica sin estimulantes.',
    benefits:['Pérdida de grasa por múltiples vías','GLP-1 maneja apetito y vaciado gástrico','AOD9604 + Fragmento HGH añaden lipólisis directa','5-amino-1mq eleva la tasa metabólica vía NAD+','Preservación de masa muscular durante déficit calórico'],
    sideEffects:[{text:'Efectos GI del componente GLP-1 (náuseas, diarrea) — titular lentamente',severity:'med'},{text:'Riesgo de vesícula biliar (efecto de clase GLP-1)',severity:'high'},{text:'Alta frecuencia de inyecciones',severity:'low'}],
    note:'GLP-1 maneja el lado del apetito. AOD9604 y Fragmento HGH funcionan mejor con estómago vacío en la mañana. 5-amino-1mq puede ser oral.',
  },
  {
    name:"WOMEN'S WELLNESS STACK",cycle:'12 weeks for GH peptides. GHK-Cu and Glutathione ongoing. PT-141 as-needed only.',
    goal:'Equilibrio hormonal · Piel · Libido · Estado de ánimo · Composición corporal',
    description:'Un protocolo integral de optimización femenina que aborda las áreas clave donde la terapia peptídica proporciona mayor beneficio para la mujer — equilibrio hormonal, calidad de piel, libido, estado de ánimo y composición corporal.',
    rationale:'Las mujeres tienen fisiología hormonal distinta que responde diferente a los protocolos peptídicos. PT-141 tiene aprobación de FDA específicamente para disfunción sexual femenina (Vyleesi). GHK-Cu y L-Glutatión son particularmente impactantes para calidad de piel y antienvejecimiento en mujeres. Selank aborda la ansiedad y el estado de ánimo sin interferencia hormonal.',
    benefits:['Mejora de libido y deseo sexual (PT-141 — aprobado por FDA para HSDD en mujeres)','Firmeza de piel, producción de colágeno y aclaramiento (GHK-Cu + Glutatión)','Estabilización de ansiedad y estado de ánimo sin sedación (Selank)','Composición corporal magra y calidad del sueño mejorada (péptidos GH)','Antienvejecimiento integral desde múltiples vías'],
    sideEffects:[{text:'Náuseas con PT-141 — siempre empezar BAJO con estómago vacío',severity:'med'},{text:'Retención de agua por péptidos GH (común, se resuelve)',severity:'low'},{text:'Enrojecimiento en sitio por GHK-Cu (leve, breve)',severity:'low'}],
    note:'PT-141 es solo según necesidad (no diario). Péptidos GH antes de dormir diariamente. GHK-Cu y Glutatión pueden ejecutarse continuamente. Máx 2x/semana para PT-141. Las mujeres suelen ser más sensibles a GH — empezar en dosis BAJA.',
  },
  {
    name:'HPG TESTOSTERONE STACK',cycle:'12–16 weeks minimum. Bloodwork required at baseline and week 6.',
    goal:'Testosterona natural · Restauración del eje HPG · Fertilidad · Libido',
    description:'El stack completo de restauración del eje HPG. Kisspeptina-10 activa el hipotálamo, HCG activa los testículos — juntos restauran la cascada completa de producción de testosterona de arriba hacia abajo.',
    rationale:'Kisspeptina-10 se une a receptores KISS1R en el hipotálamo desencadenando el pulso de GnRH → LH/FSH → testosterona. HCG imita directamente LH a nivel testicular. Estos dos juntos cubren ambos extremos del eje HPG simultáneamente. CJC-1295 + Ipamorelin añaden soporte del eje GH para recuperación y ambiente anabólico general.',
    benefits:['Estimulación completa del eje HPG en dos niveles','Restauración de producción de testosterona sin apagado de TRT','Mantenimiento de función y tamaño testicular','Preservación de fertilidad','Mejora de libido','Soporte de GH para recuperación y composición corporal'],
    sideEffects:[{text:'Elevación de estradiol por aromatización de HCG — monitorear E2',severity:'med'},{text:'El pico de LH por Kisspeptina puede alterar temporalmente el estrógeno',severity:'med'},{text:'SE REQUIERE ANÁLISIS DE SANGRE (T total, T libre, LH, FSH, E2, IGF-1)',severity:'high'},{text:'Retención de agua por péptidos GH',severity:'low'}],
    note:'SE REQUIEREN ANÁLISIS DE SANGRE. Obtener T total, T libre, LH, FSH, estradiol e IGF-1 basales antes de comenzar. Revisar a las 6 semanas. Este no es un stack para principiantes — consultar con Defy Medical o Marek Health para protocolo supervisado.',
  },
  {
    name:'COGNITIVE STACK',cycle:'6 weeks on / 2 weeks off for Semax and Selank. NAD+ can run ongoing.',
    goal:'Enfoque · Memoria · Neuroprotección · Reducción de ansiedad · BDNF',
    description:'El protocolo de optimización cognitiva más dirigido. Semax eleva BDNF para enfoque y neuroprotección. Selank proporciona calma ansiolítica limpia sin sedación. NAD+ potencia las mitocondrias cerebrales. Tres vías distintas para una mejora cognitiva integral.',
    rationale:'Semax actúa vía ACTH(4-7) para regular al alza BDNF y modular dopamina/serotonina — mejorando el enfoque, la consolidación de memoria y la neuroplasticidad. Selank modula GABA-A y reduce la ansiedad sin sedación — creando el estado calmado y enfocado donde Semax es más efectivo. NAD+ asegura que la energía mitocondrial no sea el cuello de botella para el rendimiento cerebral.',
    benefits:['Enfoque y claridad cognitiva mejorados (efecto BDNF de Semax)','Estado de calma sin ansiedad para rendimiento óptimo (Selank)','Optimización de energía mitocondrial cerebral (NAD+)','Consolidación de memoria y neuroplasticidad','Neuroprotección del estrés oxidativo','Sin sedación ni riesgo de dependencia'],
    sideEffects:[{text:'Irritabilidad con Semax a dosis altas — quedarse en BAJO para empezar',severity:'med'},{text:'Fatiga post-ciclo después de Semax (reinicio de BDNF) — descanso de 2 semanas',severity:'low'},{text:'Sofocos iniciales con NAD+',severity:'low'}],
    note:'Semax y Selank son complementarios — Semax es activador (tomar AM), Selank es calmante (tomar mediodía o antes de situaciones estresantes). Ambos ciclan 6 semanas activo / 2 de descanso. NAD+ puede ejecutarse continuamente.',
  },
  {
    name:'TRIPLE AGONIST STACK',cycle:'20+ weeks minimum. Retatrutide requires slow titration — do not rush.',
    goal:'Pérdida máxima de peso · Sin meseta · Grasa hepática · Cardiometabólico',
    description:'Construido alrededor de retatrutida — el compuesto para pérdida de peso más potente en la historia de ensayos de Fase 2 con 24.2% de pérdida de peso sin meseta a las 48 semanas. NAD+ y 5-amino-1mq complementan el cambio metabólico con soporte de vías mitocondriales y NNMT.',
    rationale:'Retatrutida es un agonista triple GLP-1/GIP/glucagón — el componente de glucagón aumenta únicamente el gasto calórico además de la reducción del apetito, explicando por qué supera a todos los demás agentes. NAD+ apoya la adaptación mitocondrial al cambio metabólico. 5-amino-1mq inhibe NNMT para elevar aún más el NAD+ y suprimir la adipogénesis. Los tres actúan en objetivos diferentes sin redundancia.',
    benefits:['24.2% de pérdida de peso a las 48 semanas — sin meseta (Ensayo Fase 2 NEJM RCT)','Reducción >80% de grasa hepática','El componente de glucagón único aumenta el gasto calórico','Soporte de adaptación mitocondrial (NAD+)','Supresión de expansión de células grasas (5-amino-1mq)','Mejoras en todos los marcadores cardiometabólicos'],
    sideEffects:[{text:'Náuseas — TITULAR MUY LENTAMENTE; empezar a 2mg y mantener 8 semanas',severity:'med'},{text:'Vómito durante escalada de dosis si se acelera',severity:'med'},{text:'No aprobado por FDA — ensayos Fase 3 en curso a 2025',severity:'high'},{text:'Sofocos con NAD+ inicialmente',severity:'low'}],
    note:'Retatrutida requiere la titulación más lenta de cualquier péptido para pérdida de peso. Pasar 6–8 semanas en cada paso de dosis. No acelerar. Los sofocos con NAD+ generalmente se resuelven después de la semana 2. NUNCA combinar con semaglutida o tirzepatida.',
  },
];

export const STACKS = [
  {
    name:'WOLVERINE STACK',emoji:'🐺',goal:'Injury recovery · Tissue repair · Pain reduction',color:'#0E7C7B',
    description:'The most popular healing stack — BPC-157 works locally at the injury site while TB-500 provides systemic repair. Together they cover both local and systemic healing pathways for comprehensive recovery.',
    rationale:'BPC-157 acts locally via VEGFR2/Akt-eNOS at the injury site. TB-500 acts systemically via actin regulation throughout the body. Completely different mechanisms — every clinical protocol recommends using them together because they complement each other precisely.',
    benefits:['Accelerated tendon and ligament healing','Reduced pain and inflammation at injury site','Faster return to training','Systemic tissue repair and flexibility','Gut healing as secondary benefit (BPC-157)','Reduced scar tissue formation (TB-500)'],
    sideEffects:[{text:'Injection site irritation (mild)',severity:'low'},{text:'Theoretical tumor promotion with BPC-157 — unconfirmed in humans',severity:'med'}],
    note:'Inject each separately — never mix in same syringe. BPC-157 near injury site; TB-500 anywhere SubQ.',
    studies:[{title:'BPC-157 Systematic Review',journal:'Orthopaedic Journal of Sports Medicine 2025',summary:'36-study review. Enhanced angiogenesis and tissue repair. 7/12 patients reported joint pain relief.',pmid:'',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12313605/'}],
    peptides:[
      {name:'BPC-157',schedule:'Daily SubQ near injury site or abdomen',lo:'250 mcg/day',mid:'500 mcg/day',hi:'500 mcg 2x/day'},
      {name:'TB-500',schedule:'2x/week SubQ loading phase, then once/week maintenance',lo:'2 mg/wk maintenance',mid:'2 mg 2x/wk × 4–6 wks loading, then 2 mg/wk',hi:'2.5 mg 2x/wk × 4–6 wks loading (acute injury), then 2.5 mg/wk'},
    ]
  },
  {
    name:'GLOW STACK',emoji:'✨',goal:'Anti-aging · Skin & collagen · Comprehensive regeneration',color:'#5B2D8E',
    description:'GLOW = GHK-Cu + BPC-157 + TB-500. The anti-aging and skin optimization stack. GHK-Cu drives collagen synthesis while the healing peptides provide systemic regeneration.',
    rationale:'GHK-Cu activates collagen synthesis genes and resets gene expression toward youthful patterns. BPC-157 and TB-500 provide the underlying tissue repair and anti-inflammatory foundation. All three work on different but complementary aspects of skin and tissue regeneration.',
    benefits:['Skin tightening and wrinkle reduction','Systemic anti-aging via gene expression reset','Collagen and elastin production','Inflammation reduction','Improved flexibility'],
    sideEffects:[{text:'Injection site redness from GHK-Cu (mild, transient)',severity:'low'},{text:'Possible temporary skin darkening (copper effect)',severity:'low'}],
    note:'GHK-Cu can also be applied topically to face/skin in addition to SubQ. Inject BPC-157 and TB-500 separately.',
    studies:[{title:'GHK-Cu Anti-Aging Mechanisms: 42 Human Study Review',journal:'Cosmetics 2015',summary:'GHK-Cu tightened loose skin, improved elasticity and clarity, reduced fine lines.',pmid:'26090526',url:'https://pubmed.ncbi.nlm.nih.gov/26090526/'}],
    peptides:[
      {name:'GHK-Cu',schedule:'Daily SubQ or topical',lo:'1 mg/day',mid:'2 mg/day',hi:'3–5 mg/day'},
      {name:'BPC-157',schedule:'Daily SubQ',lo:'250 mcg/day',mid:'500 mcg/day',hi:'500 mcg 2x/day'},
      {name:'TB-500',schedule:'2x/week SubQ loading phase, then once/week maintenance',lo:'2 mg/wk maintenance',mid:'2 mg 2x/wk × 4–6 wks loading, then 2 mg/wk',hi:'2.5 mg 2x/wk × 4–6 wks loading, then 2.5 mg/wk'},
    ]
  },
  {
    name:'KLOW STACK',emoji:'💎',goal:'Ultimate healing · Immune modulation · Gut repair · Chronic inflammation',color:'#004D40',
    description:'KLOW = GLOW + KPV. The most comprehensive healing and anti-inflammatory stack. KPV adds potent NF-kB inhibition and mucosal healing — particularly powerful for gut issues, IBD, and chronic inflammation.',
    rationale:'KPV specifically inhibits NF-kB at mucosal surfaces where BPC-157 also works. The combination provides local + systemic healing (BPC-157 + TB-500), skin/collagen regeneration (GHK-Cu), AND NF-kB anti-inflammatory modulation (KPV) across all tissue types.',
    benefits:['Most comprehensive healing protocol','GI inflammation and IBD support (KPV + BPC-157)','Skin and systemic tissue regeneration','Immune modulation without immunosuppression','Leaky gut and mucosal barrier repair'],
    sideEffects:[{text:'All four peptides well tolerated individually',severity:'low'},{text:'Injection burden: 3 daily SubQ + 1 weekly',severity:'low'}],
    note:'Inject all peptides separately. High frequency — consider running Wolverine or GLOW first before escalating to full KLOW.',
    studies:[{title:'KPV Reduces Colitis via NF-kB Inhibition',journal:'Gastroenterology 2006',summary:'KPV reduced colonic inflammation via NF-kB inhibition. Effective orally and locally.',pmid:'16530527',url:'https://pubmed.ncbi.nlm.nih.gov/16530527/'}],
    peptides:[
      {name:'GHK-Cu',schedule:'Daily SubQ',lo:'1 mg/day',mid:'2 mg/day',hi:'3–5 mg/day'},
      {name:'BPC-157',schedule:'Daily SubQ',lo:'250 mcg/day',mid:'500 mcg/day',hi:'500 mcg 2x/day'},
      {name:'TB-500',schedule:'2x/week SubQ loading phase, then once/week maintenance',lo:'2 mg/wk maintenance',mid:'2 mg 2x/wk × 4–6 wks loading, then 2 mg/wk',hi:'2.5 mg 2x/wk × 4–6 wks loading, then 2.5 mg/wk'},
      {name:'KPV',schedule:'Daily SubQ or oral',lo:'500 mcg/day',mid:'1 mg/day',hi:'2 mg/day'},
    ]
  },
  {
    name:'GH STACK (Classic)',emoji:'📈',goal:'GH optimization · Lean muscle · Fat loss · Sleep · Anti-aging',color:'#1A6B9A',
    description:'The gold standard GH peptide protocol. CJC-1295 (with DAC) provides sustained once-weekly GH elevation via albumin binding, while Ipamorelin adds a clean daily GH pulse on top. Two completely different receptor pathways — sustained baseline elevation plus physiological pulsatility, without raising cortisol or prolactin.',
    rationale:'CJC-1295 (with DAC) binds albumin extending its half-life to 6–8 days — one injection per week sustains elevated GH for the full week. Ipamorelin acts on GHS-R1a (ghrelin receptor) to add a clean daily GH pulse on top. GHRH receptor + ghrelin receptor = true synergy. The combination produces 2–3x greater GH output than either peptide alone.',
    benefits:[
      '2–3x greater GH pulse than either peptide alone',
      'Lean muscle mass gain',
      'Fat loss via lipolysis',
      'Deep sleep improvement — GH pulse aligns with slow-wave sleep',
      'Faster recovery from training',
      'No cortisol, prolactin, or ACTH elevation',
    ],
    sideEffects:[
      {text:'Water retention at start (common, resolves 2–3 weeks)',severity:'low'},
      {text:'Carpal tunnel if IGF-1 runs high — monitor at 6–8 weeks',severity:'med'},
      {text:'Blood glucose elevation',severity:'med'},
    ],
    note:'Both peptides can be drawn into the same syringe. Inject before bed on empty stomach to align with natural GH pulse. Monitor IGF-1 at baseline and week 6–8.',
    studies:[
      {title:'CJC-1295 GH and IGF-1 Elevation in Humans',journal:'JCEM 2006',summary:'Single CJC-1295 injection produced 2–10x GH elevation lasting 6+ days. Established albumin-binding extended half-life mechanism.',pmid:'16352683',url:'https://pubmed.ncbi.nlm.nih.gov/16352683/'},
    ],
    peptides:[
      {name:'CJC-1295 (with DAC)',schedule:'Once weekly SubQ — same day each week',lo:'1 mg/wk',mid:'2 mg/wk',hi:'2 mg/wk'},
      {name:'Ipamorelin',schedule:'Daily SubQ before bed, empty stomach',lo:'100 mcg/day',mid:'200 mcg/day',hi:'300 mcg/day'},
    ]
  },
  {
    name:'SLEEP STACK',emoji:'😴',goal:'Deep sleep · Overnight GH pulse · Cortisol reduction · Recovery',color:'#37474F',
    description:'Comprehensive sleep optimization. Each peptide hits a different sleep mechanism — GH secretagogues, sleep-inducing neuropeptides, and the primary circadian hormone — for complete sleep architecture enhancement.',
    rationale:'Sermorelin + Ipamorelin drive the natural overnight GH pulse during slow-wave sleep. DSIP promotes delta sleep via hypothalamic modulation and cortisol reduction. Injectable melatonin provides circadian timing and mitochondrial antioxidant protection without morning grogginess.',
    benefits:['Deeper slow-wave delta sleep','Enhanced overnight GH pulse','Cortisol normalization','Morning energy and clarity','Stress adaptation and resilience'],
    sideEffects:[{text:'Morning grogginess if melatonin dosed too high — start LOW',severity:'low'},{text:'Water retention from GH peptides',severity:'low'}],
    note:'All before bed on empty stomach. Sermorelin + Ipamorelin can share a syringe. DSIP separate. Injectable melatonin is 5–10x more potent than oral — always start LOW.',
    studies:[{title:'DSIP and Sleep EEG in Humans',journal:'Neuropsychobiology 1989',summary:'Improved sleep stages and reduced cortisol in insomnia patients.',pmid:'2507024',url:'https://pubmed.ncbi.nlm.nih.gov/2507024/'}],
    peptides:[
      {name:'Sermorelin',schedule:'Daily SubQ 30–60 min before bed',lo:'200 mcg/night',mid:'300 mcg/night',hi:'500 mcg/night'},
      {name:'Ipamorelin',schedule:'Same injection as Sermorelin',lo:'100 mcg/night',mid:'200 mcg/night',hi:'300 mcg/night'},
      {name:'DSIP',schedule:'Daily SubQ before bed (separate)',lo:'100 mcg/night',mid:'200 mcg/night',hi:'300 mcg/night'},
      {name:'Melatonin',schedule:'Daily SubQ 30 min before bed',lo:'0.5 mg/night',mid:'0.8 mg/night',hi:'1 mg/night'},
    ]
  },
  {
    name:'CAGRISA STACK',emoji:'⚡',goal:'Maximum weight loss — GLP-1 + amylin dual pathway',color:'#2E7D32',
    description:'The most powerful weight loss stack in Phase 3 data. CagriSema (REDEFINE 1) produced 23% average weight loss on-treatment — among the highest ever in a Phase 3 pharmaceutical trial.',
    rationale:'Semaglutide activates GLP-1 receptors. Cagrilintide activates amylin receptors in the hypothalamus — a completely different pathway. The combination produces genuine additive weight loss because the mechanisms do not overlap.',
    benefits:['23% body weight loss on-treatment (Phase 3 REDEFINE 1, 68 weeks)','Superior to any single GLP-1 agent','Improved satiety through two independent pathways','Blood sugar normalization','Reduced liver fat'],
    sideEffects:[{text:'Nausea — additive from both agents; titrate slowly',severity:'med'},{text:'Vomiting during dose escalation',severity:'med'},{text:'Gallbladder disease (GLP-1 class effect)',severity:'high'}],
    note:'Titrate each peptide independently. NEVER combine semaglutide with tirzepatide. Inject at different sites.',
    studies:[{title:'CagriSema Phase 3 REDEFINE: 25.1% Weight Loss',journal:'NEJM 2025',summary:'23% average weight loss on-treatment at 68 weeks vs 8.1% semaglutide alone (REDEFINE 1). NDA filed Dec 2025.',pmid:'',url:'https://www.nejm.org/doi/10.1056/NEJMoa2410605'}],
    peptides:[
      {name:'Semaglutide',schedule:'Once weekly SubQ, same day each week',lo:'0.25 mg/wk → 0.5 mg maintenance',mid:'0.25→0.5→1.0→2.4 mg/wk (4 wks each)',hi:'2.4 mg/wk (full dose)'},
      {name:'Cagrilintide',schedule:'Once weekly SubQ (different site from sema)',lo:'0.16 mg/wk → 0.3 mg maintenance',mid:'0.16→0.3→0.6→1.2 mg/wk',hi:'2.4 mg/wk'},
    ]
  },
  {
    name:'NAD+ LONGEVITY STACK',emoji:'🔋',goal:'Mitochondrial health · Cellular energy · Metabolic optimization · Anti-aging',color:'#4A148C',
    description:'The most comprehensive mitochondrial and longevity protocol. Four compounds each targeting a different mitochondrial pathway for complete cellular energy optimization.',
    rationale:'NAD+ replenishes the essential coenzyme declining with age. SS-31 reduces oxidative stress at the inner mitochondrial membrane. MOTS-c mimics exercise by activating AMPK. 5-amino-1mq prevents NAD+ breakdown by NNMT. All four hit completely different targets — no redundancy.',
    benefits:['Comprehensive mitochondrial optimization','Cellular energy and ATP restoration','DNA repair activation','Sirtuin longevity stimulation','Metabolic flexibility improvement','Insulin sensitivity'],
    sideEffects:[{text:'NAD+ flushing — very common at start; use LOW first',severity:'med'},{text:'Fatigue initially (1–2 weeks) as mitochondria adapt',severity:'low'},{text:'High injection frequency (3 daily)',severity:'low'}],
    note:'All AM dosing preferred. NAD+ may cause flushing — always start LOW. Add each peptide one week apart to isolate reactions.',
    studies:[{title:'NAD+ and Aging: Therapeutic Review',journal:'Cell Metabolism 2018',summary:'Established NAD+ as longevity intervention target.',pmid:'29719682',url:'https://pubmed.ncbi.nlm.nih.gov/29719682/'}],
    peptides:[
      {name:'NAD+',schedule:'Daily SubQ AM or IV infusion',lo:'100 mg/day',mid:'500 mg/day',hi:'1,000 mg/day'},
      {name:'SS-31',schedule:'Daily SubQ AM',lo:'1 mg/day',mid:'5 mg/day',hi:'10 mg/day'},
      {name:'MOTS-c',schedule:'SubQ 2–3x per week (AM or pre-workout)',lo:'2 mg 2x/wk',mid:'5 mg 3x/wk',hi:'10 mg 3x/wk'},
      {name:'5-amino-1mq',schedule:'Daily SubQ or oral',lo:'25 mg/day',mid:'50 mg/day',hi:'100 mg/day'},
    ]
  },
  {
    name:'IMMUNE STACK',emoji:'🛡️',goal:'Immune modulation · Longevity · Anti-aging · Post-viral support',color:'#BF360C',
    description:'Comprehensive immune optimization. Thymosin Alpha-1 is the most potent immune-modulating peptide — approved in 35+ countries. Epithalon adds telomere-level anti-aging. BPC-157 provides the anti-inflammatory base.',
    rationale:'Thymosin Alpha-1 activates T-cells, NK cells, and dendritic cells bidirectionally. Epithalon activates telomerase to lengthen telomeres. BPC-157 provides systemic anti-inflammation reducing chronic low-grade inflammation that drives immune dysfunction.',
    benefits:['Enhanced antiviral immune response','T-cell and NK cell activation','Telomere lengthening','Long COVID and post-viral support','Autoimmune regulation (bidirectional)'],
    sideEffects:[{text:'Flu-like symptoms first 1–2 Thymosin Alpha-1 doses',severity:'low'},{text:'Epithalon BURST CYCLES only — not continuous',severity:'med'}],
    note:'Thymosin Alpha-1 is the core. Epithalon in SHORT BURSTS only (10–20 days per burst, 2–4x/year). BPC-157 can run continuously.',
    studies:[{title:'Thymosin Alpha-1 for HBV: Phase 3',journal:'Hepatology 1996',summary:'Significantly improved HBV response rates. Basis for FDA approval in 35+ countries.',pmid:'8903380',url:'https://pubmed.ncbi.nlm.nih.gov/8903380/'}],
    peptides:[
      {name:'Thymosin Alpha-1',schedule:'SubQ 2x per week',lo:'0.5 mg 2x/wk',mid:'1.0 mg 2x/wk',hi:'1.6 mg 2x/wk'},
      {name:'Epithalon',schedule:'Daily SubQ — 10–20 day burst ONLY',lo:'5 mg/day × 10 days',mid:'10 mg/day × 10 days',hi:'10 mg/day × 20 days'},
      {name:'BPC-157',schedule:'Daily SubQ',lo:'250 mcg/day',mid:'500 mcg/day',hi:'500 mcg 2x/day'},
    ]
  },
  {
    name:'FAT LOSS STACK',emoji:'🔥',goal:'Aggressive fat loss · Lipolysis · Metabolic acceleration · Muscle preservation',color:'#E65100',
    description:'Comprehensive fat loss attacking from four angles — appetite suppression (GLP-1), direct lipolysis (AOD9604 + HGH Fragment), and metabolic rate elevation via NNMT inhibition (5-amino-1mq).',
    rationale:'GLP-1 handles appetite and metabolic signaling. AOD9604 and HGH Fragment both target lipolysis via beta-3 adrenergic pathways without IGF-1 effects — safe to combine with GLP-1. 5-amino-1mq inhibits NNMT to elevate NAD+ and metabolic rate without stimulants.',
    benefits:['Multi-pathway fat loss','GLP-1 handles appetite and gastric emptying','AOD9604 + HGH Fragment add direct lipolysis','5-amino-1mq elevates metabolic rate via NAD+','Muscle preservation during caloric deficit'],
    sideEffects:[{text:'GI effects from GLP-1 (nausea, diarrhea) — titrate slowly',severity:'med'},{text:'Gallbladder risk (GLP-1 class effect)',severity:'high'},{text:'High injection frequency',severity:'low'}],
    note:'GLP-1 handles the appetite side. AOD9604 and HGH Fragment work best on empty stomach in AM. 5-amino-1mq can be oral.',
    studies:[{title:'Tirzepatide SURMOUNT-1: 20.9% Weight Loss',journal:'NEJM 2022',summary:'Phase 3 RCT. Foundation of GLP-1 component of this stack.',pmid:'35658024',url:'https://pubmed.ncbi.nlm.nih.gov/35658024/'}],
    peptides:[
      {name:'Tirzepatide or Semaglutide',schedule:'Once weekly SubQ',lo:'Tirze 2.5mg or Sema 0.25mg/wk',mid:'Tirze 5–10mg or Sema 1–2.4mg/wk',hi:'Tirze 10–15mg or Sema 2.4mg/wk max'},
      {name:'AOD9604',schedule:'Daily SubQ AM on empty stomach',lo:'250 mcg/day',mid:'500 mcg/day',hi:'500 mcg 2x/day'},
      {name:'HGH Fragment',schedule:'Daily SubQ 2x on empty stomach',lo:'250 mcg 2x/day',mid:'500 mcg 2x/day',hi:'500 mcg 3x/day'},
      {name:'5-amino-1mq',schedule:'Daily SubQ or oral',lo:'25 mg/day',mid:'50 mg/day',hi:'100 mg/day'},
    ]
  },
  {
    name:"WOMEN'S WELLNESS STACK",emoji:'🌸',goal:"Hormonal balance · Skin · Libido · Mood · Body composition",color:'#AD1457',
    description:"A comprehensive women's optimization protocol targeting the key areas where peptide therapy provides the most benefit for women — hormonal balance, skin quality, libido, mood, and body composition — using compounds with well-established female-specific data.",
    rationale:"Women have distinct hormonal physiology that responds differently to peptide protocols. PT-141 has FDA approval specifically for female sexual dysfunction (Vyleesi). GHK-Cu and L-Glutathione are particularly impactful for skin quality and anti-aging in women. Selank addresses anxiety and mood without hormone interference. GH peptides (CJC-1295 + Ipamorelin) improve body composition while supporting the sleep and recovery that women disproportionately lose with age.",
    benefits:["Improved libido and sexual desire (PT-141 — FDA approved for HSDD in women)","Skin tightening, collagen production, and brightening (GHK-Cu + Glutathione)","Anxiety and mood stabilization without sedation (Selank)","Lean body composition and improved sleep quality (GH peptides)","Comprehensive anti-aging from multiple pathways","No direct hormonal pathway interference"],
    sideEffects:[{text:'PT-141 nausea — always start at LOW and take on empty stomach',severity:'med'},{text:'Water retention from GH peptides (common, resolves)',severity:'low'},{text:'GHK-Cu injection site redness (mild, brief)',severity:'low'},{text:'Selank very well tolerated overall',severity:'low'}],
    note:"PT-141 is as-needed only (not daily). GH peptides before bed daily. GHK-Cu and Glutathione can be run continuously. Run PT-141 only 2x/week maximum. Women are often more GH-sensitive — start at LOW dose for GH peptides.",
    studies:[{title:'PT-141 (Bremelanotide) for Female HSDD: Phase 3',journal:'NEJM/JAMA 2019',summary:'PT-141 significantly improved sexual desire and reduced distress in premenopausal women with HSDD. FDA approved as Vyleesi. Landmark female-specific peptide approval.',pmid:'',url:'https://pubmed.ncbi.nlm.nih.gov/31116916/'},{title:'GHK-Cu Skin Benefits: 42 Human Studies',journal:'Cosmetics 2015',summary:'GHK-Cu tightened loose skin, improved elasticity and thickness, reduced fine lines. Strong female anti-aging data.',pmid:'26090526',url:'https://pubmed.ncbi.nlm.nih.gov/26090526/'}],
    peptides:[
      {name:'PT-141',schedule:'SubQ as needed, 45 min before — 2x/wk MAX',lo:'0.5 mg as needed',mid:'1 mg as needed',hi:'1.75 mg as needed'},
      {name:'GHK-Cu',schedule:'Daily SubQ or topical application to face',lo:'1 mg/day',mid:'2 mg/day',hi:'3 mg/day'},
      {name:'L-Glutathione',schedule:'SubQ 2x/week or IV infusion',lo:'500 mg 2x/wk',mid:'1,000 mg 2–3x/wk',hi:'1,500 mg 3x/wk'},
      {name:'Selank',schedule:'Daily intranasal or SubQ (morning preferred)',lo:'250 mcg/day',mid:'500 mcg/day',hi:'750 mcg/day'},
      {name:'CJC-1295 (no DAC)',schedule:'Daily SubQ before bed — empty stomach',lo:'100 mcg/night',mid:'150 mcg/night',hi:'200 mcg/night'},
      {name:'Ipamorelin',schedule:'Same injection as CJC before bed',lo:'100 mcg/night',mid:'150 mcg/night',hi:'200 mcg/night'},
    ]
  },
  {
    name:'HPG TESTOSTERONE STACK',emoji:'🔴',goal:'Natural testosterone · HPG axis restoration · Fertility · Libido',color:'#B71C1C',
    description:'The full HPG axis restoration stack. Kisspeptin-10 activates the hypothalamus, HCG activates the testes — together they restore the complete testosterone production cascade from the top down.',
    rationale:'KissPeptin-10 binds KISS1R in the hypothalamus triggering GnRH pulse → LH/FSH → testosterone. HCG directly mimics LH at the testicular level. These two together cover both ends of the HPG axis simultaneously. CJC-1295 + Ipamorelin added for GH axis support, recovery, and overall anabolic environment.',
    benefits:['Complete HPG axis stimulation at two levels','Testosterone production restoration without TRT shutdown','Testicular function and size maintenance','Fertility preservation','Libido improvement','GH support for recovery and body composition'],
    sideEffects:[{text:'Estradiol elevation from HCG aromatization — monitor E2',severity:'med'},{text:'LH surge from Kisspeptin may temporarily alter estrogen',severity:'med'},{text:'Bloodwork monitoring required (Total T, Free T, LH, FSH, E2, IGF-1)',severity:'high'},{text:'Water retention from GH peptides',severity:'low'}],
    note:'BLOODWORK REQUIRED. Get baseline Total T, Free T, LH, FSH, estradiol, and IGF-1 before starting. Recheck at 6 weeks. This is not a beginner stack — consult Defy Medical or Marek Health for supervised protocol.',
    studies:[{title:'Kisspeptin-10 Stimulates LH and Testosterone in Men',journal:'JCEM 2009',summary:'Significantly increased LH, FSH, and testosterone. Established HPG axis stimulation mechanism.',pmid:'19190100',url:'https://pubmed.ncbi.nlm.nih.gov/19190100/'},{title:'HCG for Testosterone Restoration During TRT',journal:'Journal of Urology 2013',summary:'HCG maintained intratesticular testosterone and spermatogenesis in men on TRT.',pmid:'23260547',url:'https://pubmed.ncbi.nlm.nih.gov/23260547/'}],
    peptides:[
      {name:'KissPeptin-10',schedule:'Daily SubQ injection',lo:'50 mcg/day',mid:'100 mcg/day',hi:'200 mcg/day'},
      {name:'HCG',schedule:'SubQ 3x per week (different days)',lo:'500 IU EOD',mid:'1,000 IU 3x/wk',hi:'1,500 IU 3x/wk'},
      {name:'CJC-1295 (no DAC)',schedule:'Daily SubQ before bed',lo:'100 mcg/night',mid:'200 mcg/night',hi:'300 mcg/night'},
      {name:'Ipamorelin',schedule:'Same injection as CJC before bed',lo:'100 mcg/night',mid:'200 mcg/night',hi:'300 mcg/night'},
    ]
  },
  {
    name:'COGNITIVE STACK',emoji:'🧠',goal:'Focus · Memory · Neuroprotection · Anxiety reduction · BDNF',color:'#1565C0',
    description:'The most targeted cognitive optimization protocol. Semax elevates BDNF for focus and neuroprotection. Selank provides clean anxiolytic calm without sedation. NAD+ powers brain mitochondria. Three distinct pathways for comprehensive cognitive enhancement.',
    rationale:'Semax acts via ACTH(4-7) to upregulate BDNF and modulate dopamine/serotonin — enhancing focus, memory consolidation, and neuroplasticity. Selank modulates GABA-A and reduces anxiety without sedation — creating the calm, focused state where Semax is most effective. NAD+ ensures mitochondrial energy is not the bottleneck for brain performance. These work synergistically rather than redundantly.',
    benefits:['Enhanced focus and cognitive clarity (Semax BDNF effect)','Anxiety-free calm state for peak performance (Selank)','Brain mitochondrial energy optimization (NAD+)','Memory consolidation and neuroplasticity','Neuroprotection from oxidative stress','No sedation or dependency risk'],
    sideEffects:[{text:'Semax irritability at high doses — stay at LOW to START',severity:'med'},{text:'Post-cycle fatigue after Semax (BDNF reset) — cycle off 2 weeks',severity:'low'},{text:'NAD+ flushing initially',severity:'low'},{text:'Both Semax and Selank cycle 6 weeks on / 2 off',severity:'low'}],
    note:'Semax and Selank are complementary — Semax is activating (take AM), Selank is calming (take midday or before stressful tasks). Both cycle 6 weeks on / 2 off. NAD+ can run continuously.',
    studies:[{title:'Semax and BDNF: Neuroprotective Mechanisms',journal:'Doklady Biochemistry 2001',summary:'Significantly increased BDNF expression and demonstrated neuroprotection in ischemia models.',pmid:'',url:'https://link.springer.com/article/10.1023/A:1011373916522'},{title:'Selank Anxiolytic Effects vs Diazepam',journal:'Bulletin of Experimental Biology 2008',summary:'Significant anxiolytic effects comparable to diazepam without sedation or memory impairment.',pmid:'19145268',url:'https://pubmed.ncbi.nlm.nih.gov/19145268/'}],
    peptides:[
      {name:'Semax',schedule:'Daily SubQ or intranasal — morning',lo:'200 mcg/day',mid:'400 mcg/day',hi:'600 mcg/day'},
      {name:'Selank',schedule:'Daily SubQ or intranasal — midday or AM',lo:'250 mcg/day',mid:'500 mcg/day',hi:'750 mcg/day'},
      {name:'NAD+',schedule:'Daily SubQ AM (can continue year-round)',lo:'100 mg/day',mid:'250 mg/day',hi:'500 mg/day'},
    ]
  },
  {
    name:'TRIPLE AGONIST STACK',emoji:'🟢',goal:'Maximum weight loss · No plateau · Liver fat · Cardiometabolic',color:'#1B5E20',
    description:'Built around retatrutide — the most potent weight loss compound ever tested. Phase 3 TRIUMPH-4 (Dec 2025): 28.7% weight loss at 68 weeks — highest in Phase 3 trial history. Phase 2 showed 24.2% at 48 weeks with no plateau. NAD+ and 5-amino-1mq complement the metabolic shift with mitochondrial and NNMT pathway support.',
    rationale:'Retatrutide is a triple GLP-1/GIP/glucagon agonist — the glucagon component uniquely increases caloric expenditure on top of appetite reduction, explaining why it outperforms all other agents. NAD+ supports mitochondrial adaptation to the metabolic shift. 5-amino-1mq inhibits NNMT to further elevate NAD+ and suppress adipogenesis. All three hit different targets with no redundancy.',
    benefits:['28.7% weight loss at 68 weeks in Phase 3 TRIUMPH-4 (Dec 2025) — highest ever Phase 3 obesity trial result','80%+ reduction in liver fat','Unique glucagon component increases caloric expenditure','Mitochondrial adaptation support (NAD+)','Fat cell expansion suppression (5-amino-1mq)','Improvements in all cardiometabolic markers'],
    sideEffects:[{text:'Nausea — TITRATE VERY SLOWLY; start at 2mg and hold 8 weeks',severity:'med'},{text:'Vomiting during dose escalation if rushed',severity:'med'},{text:'Not FDA approved — Phase 3 trials ongoing as of 2025',severity:'high'},{text:'NAD+ flushing initially',severity:'low'}],
    note:'Retatrutide requires the slowest titration of any weight loss peptide. Spend 6–8 weeks at each dose step. Do not rush. NAD+ flushing usually resolves after week 2. NEVER combine with semaglutide or tirzepatide.',
    studies:[{title:'Retatrutide Phase 2 Trial: 24.2% Weight Loss',journal:'NEJM 2023',summary:'338 participants. 24.2% weight loss at 48 weeks with no plateau. 100% on 8–12mg achieved ≥5% loss. Historic efficacy data.',pmid:'37389765',url:'https://pubmed.ncbi.nlm.nih.gov/37389765/'}],
    peptides:[
      {name:'Retatrutide',schedule:'Once weekly SubQ — titrate very slowly',lo:'2 mg/wk × 8 wks → 4 mg/wk',mid:'2→4→6→8 mg/wk (6–8 wks per step)',hi:'Up to 12 mg/wk maximum — experienced only'},
      {name:'NAD+',schedule:'Daily SubQ AM',lo:'100 mg/day',mid:'250 mg/day',hi:'500 mg/day'},
      {name:'5-amino-1mq',schedule:'Daily oral or SubQ',lo:'25 mg/day',mid:'50 mg/day',hi:'100 mg/day'},
    ]
  }  ,
  {
    name:'J STACK',cycle:'12–16 weeks. Epithalon as 10-day burst only. IGF-1 LR3 max 6 weeks.',emoji:'💪',goal:'Muscle gain · Longevity · Recovery · Immune support · Mitochondrial',color:'#1565C0',
    description:'A comprehensive performance and longevity stack combining GH optimization, anabolic support, systemic healing, immune modulation, and mitochondrial protection. Eight compounds covering five distinct biological pathways simultaneously — designed for experienced users optimizing body composition and long-term health in parallel.',
    rationale:'CJC-1295 (with DAC) provides sustained once-weekly GH elevation. Ipamorelin adds a clean daily GH pulse without cortisol or prolactin. BPC-157 handles local tissue repair and gut health. TB-500 provides systemic healing and flexibility. Epithalon targets telomere-level anti-aging. Thymosin Alpha-1 modulates immune function bidirectionally. IGF-1 LR3 drives muscle hyperplasia during its strict 4-week cycle. SS-31 protects mitochondria from oxidative stress. Each compound targets a completely different pathway — no redundancy.',
    benefits:['GH axis optimization via two complementary pathways (GHRH + GHRP)','Muscle hyperplasia and superior nutrient partitioning (IGF-1 LR3)','Systemic and local tissue repair (BPC-157 + TB-500)','Telomere-level anti-aging (Epithalon)','Bidirectional immune modulation (Thymosin Alpha-1)','Mitochondrial protection and cellular energy (SS-31)','Improved sleep quality and overnight GH pulse','Body composition and longevity optimized simultaneously'],
    sideEffects:[{text:'Water retention from GH peptides — common at start, resolves',severity:'low'},{text:'Hypoglycemia from IGF-1 LR3 — MUST eat carbs within 30 min',severity:'high'},{text:'High injection frequency — plan your schedule carefully',severity:'low'},{text:'IGF-1 LR3 strictly 4 weeks on / 4 weeks off — do not extend',severity:'high'},{text:'Epithalon is a 20-day burst cycle — not continuous',severity:'med'}],
    note:'Advanced stack — not for beginners. IGF-1 LR3 runs 4 weeks only then stops regardless of how you feel. Epithalon runs as a 20-day burst then stops. All other compounds run the full cycle. Always have carbohydrates ready when injecting IGF-1 LR3. Bloodwork before starting and at 6 weeks minimum.',
    studies:[{title:'CJC-1295 Sustained GH and IGF-1 Elevation',journal:'JCEM 2006',summary:'Single injection produced 2–10x GH elevation lasting 6+ days.',pmid:'16352683',url:'https://pubmed.ncbi.nlm.nih.gov/16352683/'},{title:'IGF-1 and Muscle Protein Synthesis in Humans',journal:'American Journal of Physiology 1993',summary:'IGF-1 infusion acutely stimulated skeletal muscle protein synthesis in healthy adults.',pmid:'8338003',url:'https://pubmed.ncbi.nlm.nih.gov/8338003/'},{title:'SS-31 in Heart Failure: Phase 2 Trial',journal:'European Journal of Heart Failure 2020',summary:'SS-31 improved exercise capacity. First Phase 2 human data for mitochondria-targeted peptide.',pmid:'31701612',url:'https://pubmed.ncbi.nlm.nih.gov/31701612/'}],
    peptides:[
      {name:'CJC-1295 (with DAC)',schedule:'SubQ once per week',lo:'1 mg/wk',mid:'2 mg/wk',hi:'4 mg/wk (split 2mg x2 sites)'},
      {name:'Ipamorelin',schedule:'Daily SubQ before bed, empty stomach',lo:'100 mcg/day',mid:'200 mcg/day',hi:'300 mcg/day'},
      {name:'BPC-157',schedule:'Daily SubQ',lo:'250 mcg/day',mid:'500 mcg/day',hi:'500 mcg/day'},
      {name:'TB-500',schedule:'2x/week SubQ loading phase, then once/week maintenance',lo:'2 mg/wk maintenance',mid:'2 mg 2x/wk × 4–6 wks loading, then 2 mg/wk',hi:'2.5 mg 2x/wk × 4–6 wks loading, then 2.5 mg/wk'},
      {name:'Epithalon',schedule:'Daily SubQ — 20-day burst cycle ONLY',lo:'5 mg/day x 20 days',mid:'10 mg/day x 20 days',hi:'10 mg/day x 20 days'},
      {name:'Thymosin Alpha-1',schedule:'SubQ 2x per week',lo:'0.5 mg 2x/wk',mid:'1 mg 2x/wk',hi:'1.5 mg 2x/wk'},
      {name:'IGF-1 LR3',schedule:'Daily post-workout SubQ — eat carbs within 30 min. 4 weeks MAX',lo:'20 mcg/day',mid:'50 mcg/day',hi:'100 mcg/day'},
      {name:'SS-31',schedule:'Daily SubQ AM',lo:'1 mg/day',mid:'2.5 mg/day',hi:'5 mg/day'},
    ]
  }  ,
  {
    name:'INTIMACY STACK',cycle:'As-needed — not a daily protocol. PT-141 and Oxytocin max 2x/week.',emoji:'🌹',goal:'Libido · Sexual desire · Bonding · Anxiety-free arousal · Connection',color:'#880E4F',
    description:'A three-compound as-needed stack targeting sexual desire, emotional bonding, and performance anxiety from completely different neurological pathways. PT-141 works centrally on desire circuits in the brain. Oxytocin deepens emotional connection and bonding. Selank eliminates performance anxiety without any sedation. All three can be taken together at the same time — 45–60 minutes before.',
    rationale:'PT-141 activates MC4R in the hypothalamus — the neural desire circuit — working even when PDE5 inhibitors (Viagra/Cialis) fail because it operates at the brain level not the vascular level. Oxytocin enhances trust, bonding, and emotional connection — amplifying the experience beyond physical arousal alone. Selank modulates GABA-A to remove anxiety and self-consciousness without sedation — the calm, present state where intimacy is most natural. Three different mechanisms, genuine synergy, no redundancy.',
    benefits:['Increased sexual desire at the neural level — works for both men and women','Emotional bonding and connection enhancement (Oxytocin)','Performance anxiety elimination without sedation or grogginess (Selank)','Effective even when conventional medications fail','Works on psychological and physiological arousal simultaneously','Simple as-needed protocol — all three taken together 45–60 min before'],
    sideEffects:[{text:'PT-141 nausea — most common; always take on empty stomach and start LOW',severity:'med'},{text:'Flushing and headache from PT-141',severity:'low'},{text:'Transient blood pressure increase from PT-141',severity:'med'},{text:'Oxytocin may cause paradoxical anxiety in rare individuals',severity:'low'},{text:'Do not exceed PT-141 2x per week',severity:'high'},{text:'Avoid Oxytocin during pregnancy',severity:'high'}],
    note:'All three compounds can be taken together at the same time — 45–60 minutes before. No need to stagger them. PT-141 SubQ, Oxytocin intranasal spray, Selank intranasal or SubQ — all at once. Never exceed PT-141 more than 2x per week. Women are often more sensitive to PT-141 — always start at LOW dose. Do not use Oxytocin during pregnancy.',
    studies:[{title:'PT-141 for Female Sexual Dysfunction: Phase 3',journal:'JAMA 2019',summary:'Bremelanotide significantly improved sexual desire and reduced distress in premenopausal women with HSDD. FDA approved as Vyleesi.',pmid:'31116916',url:'https://pubmed.ncbi.nlm.nih.gov/31116916/'},{title:'Intranasal Oxytocin Increases Trust and Bonding',journal:'Nature 2005',summary:'Intranasal oxytocin significantly increased trust behavior. Landmark demonstration of oxytocin modulating human social behavior.',pmid:'15931222',url:'https://pubmed.ncbi.nlm.nih.gov/15931222/'},{title:'Selank Anxiolytic Effects vs Diazepam',journal:'Bulletin of Experimental Biology 2008',summary:'Significant anxiolytic effects comparable to diazepam without sedation or memory impairment. No dependency risk.',pmid:'19145268',url:'https://pubmed.ncbi.nlm.nih.gov/19145268/'}],
    peptides:[
      {name:'PT-141',schedule:'SubQ 45–60 min before — empty stomach. 2x/week MAX',lo:'0.5 mg as needed',mid:'1 mg as needed',hi:'1.75 mg as needed'},
      {name:'Oxytocin',schedule:'Intranasal spray or SubQ — take at same time as PT-141. For SubQ: reconstitute 10mg in 2ml BAC water = 5,000 IU/ml',lo:'10 IU intranasal OR 0.05ml SubQ',mid:'20–40 IU intranasal OR 0.1ml SubQ',hi:'50 IU intranasal OR 0.15ml SubQ'},
      {name:'Selank',schedule:'Intranasal or SubQ — take at same time as PT-141',lo:'250 mcg as needed',mid:'500 mcg as needed',hi:'750 mcg as needed'},
    ]
  }

  ,{
    name:'PERI/MENOPAUSE STACK',cycle:'Ongoing for core stack. Epithalon as 10–20 day burst 2x/year. Kisspeptin-10 cycles 8–12 weeks.',emoji:'🌿',goal:'Hormonal balance · Muscle preservation · Mood · Brain fog · Longevity',color:'#6A1B9A',
    description:'A comprehensive peptide protocol designed around the two distinct phases of female hormonal transition. The core stack — Ipamorelin/CJC-1295, BPC-157, and Selank/Semax — runs through both perimenopause and menopause. One key swap: Kisspeptin-10 in perimenopause, Epithalon in full menopause. HRT (bioidentical hormones) remains the clinical foundation — these peptides are adjuncts that work alongside it, not replacements.',
    rationale:'In perimenopause, estrogen fluctuations (not deficiency) drive most symptoms — erratic signaling, brain fog, GI changes, mood dysregulation, and accelerated muscle loss. Kisspeptin-10 stimulates GnRH → LH/FSH, helping smooth out erratic ovarian signaling while the ovaries are still producing. Once fully menopausal, the ovaries are offline — Kisspeptin loses its rationale and Epithalon becomes more valuable: telomere support, pineal/melatonin regulation, sleep, and longevity at a stage when cardiovascular and bone risks rise significantly. Ipamorelin + CJC-1295 become more critical post-menopause as GH decline accelerates alongside estrogen loss. BPC-157 addresses the increased joint inflammation and GI changes common across both phases. Selank or Semax targets the brain fog and anxiety driven by fluctuating then declining estrogen effects on serotonin and GABA.',
    benefits:[
      'Hormonal signaling support — Kisspeptin smooths erratic fluctuations in perimenopause (swap to Epithalon post-menopause)',
      'GH axis preservation — counters accelerated muscle and bone loss (more critical post-menopause)',
      'Systemic repair and gut integrity (BPC-157) — addresses increased inflammation and GI changes common in both phases',
      'Brain fog, mood, and anxiety support (Selank/Semax) — targets estrogen effects on serotonin/GABA',
      'Telomere and longevity support (Epithalon) — fits the cardiovascular and aging risk that rises post-menopause',
      'Optional: PT-141 + Oxytocin as as-needed libido add-ons (see stack note below)',
    ],
    sideEffects:[
      {text:'GH peptides — water retention at start, usually resolves in 2–3 weeks',severity:'low'},
      {text:'Women often more GH-sensitive — start at LOW dose on Ipamorelin/CJC',severity:'low'},
      {text:'Kisspeptin — temporary estrogen fluctuation from LH surge (expected in perimenopause)',severity:'low'},
      {text:'Epithalon — extremely well tolerated. Burst cycles only — not continuous',severity:'low'},
      {text:'Selank/Semax — very well tolerated. Semax more activating (take AM); Selank more calming (take midday)',severity:'low'},
      {text:'PT-141 (optional) — nausea if not taken on empty stomach. May need slightly higher doses post-menopause due to lower estrogen baseline sensitivity',severity:'med'},
    ],
    note:'PERIMENOPAUSAL: Use Kisspeptin-10 (still producing hormones — smooths erratic signaling). FULLY MENOPAUSAL: Swap Kisspeptin-10 → Epithalon (ovaries offline; shift focus to telomere support, sleep, and longevity). Consider adding SS-31 post-menopause if cardiovascular risk is a concern — estrogen loss significantly raises CV risk. OPTIONAL LIBIDO ADD-ONS: PT-141 (0.5–1mg SubQ) + Oxytocin (20–40 IU intranasal) as-needed 45–60 min before, maximum 2x/week. HRT remains the clinical foundation — these peptides are adjuncts, not replacements.',
    studies:[
      {title:'Kisspeptin-10 Stimulates LH/FSH and Testosterone',journal:'JCEM 2009',summary:'Kisspeptin-10 significantly increased LH and FSH in healthy adults. Established HPG axis stimulation — the mechanism for smoothing ovarian signaling in perimenopause.',pmid:'19190100',url:'https://pubmed.ncbi.nlm.nih.gov/19190100/'},
      {title:'Epithalon Increases Lifespan and Inhibits Tumor Growth',journal:'Bulletin of Experimental Biology 2003',summary:'Epithalon activated telomerase and significantly increased lifespan. Fits the longevity and telomere rationale for post-menopausal women.',pmid:'12937837',url:'https://pubmed.ncbi.nlm.nih.gov/12937837/'},
      {title:'PT-141 (Bremelanotide) for Female HSDD: Phase 3 RECONNECT',journal:'Obstetrics & Gynecology 2019',summary:'Bremelanotide significantly improved sexual desire and reduced distress in premenopausal women with HSDD. FDA approved as Vyleesi.',pmid:'31116916',url:'https://pubmed.ncbi.nlm.nih.gov/31116916/'},
    ],
    peptides:[
      {name:'Ipamorelin',schedule:'Daily SubQ before bed — empty stomach',lo:'100 mcg/night',mid:'150 mcg/night',hi:'200 mcg/night'},
      {name:'CJC-1295 (no DAC)',schedule:'Same injection as Ipamorelin before bed',lo:'100 mcg/night',mid:'150 mcg/night',hi:'200 mcg/night'},
      {name:'BPC-157',schedule:'Daily SubQ (abdomen or near joints)',lo:'250 mcg/day',mid:'500 mcg/day',hi:'500 mcg/day'},
      {name:'Selank',schedule:'Daily intranasal or SubQ — midday or AM',lo:'250 mcg/day',mid:'500 mcg/day',hi:'750 mcg/day'},
      {name:'KissPeptin-10',schedule:'PERIMENOPAUSE ONLY — Daily SubQ. Swap for Epithalon post-menopause.',lo:'50 mcg/day',mid:'100 mcg/day',hi:'200 mcg/day'},
      {name:'Epithalon',schedule:'FULL MENOPAUSE — replaces Kisspeptin-10. Daily SubQ burst cycle only.',lo:'5 mg/day × 10 days',mid:'10 mg/day × 10 days',hi:'10 mg/day × 20 days'},
    ]
  }

];
