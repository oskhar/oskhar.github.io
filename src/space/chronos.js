// Conceptual examples retained for the accessible portfolio notes.
const outcomes=[
 [['Tujuan A meminta identitas dasar. Jalur A aktif.','Tujuan B meminta konteks tambahan. Jalur B aktif.'],['Destination A requests basic identity. Path A active.','Destination B requests additional context. Path B active.']],
 [['Pemeriksaan identitas umum dipilih.','Pemeriksaan konteks IBAN dipilih; konvensi tidak diterapkan pada semua tujuan.'],['General identifier checks selected.','IBAN context selected; this convention does not apply to all destinations.']],
 [['Node institusi lokal terhubung langsung ke konteks tujuan.','Node cabang terhubung melalui entitas induk ilustratif.'],['Local institution node connects to destination context.','Branch node connects through an illustrative parent entity.']],
 [['Jalur A menghubungkan konteks ke keputusan A.','Jalur B menghubungkan konteks ke keputusan B.'],['Path A connects context to decision A.','Path B connects context to decision B.']],
 [['Ketiga tahap mempertahankan makna field yang sama.','Perbedaan field ditemukan. Tahan alur untuk peninjauan.'],['All three stages preserve field meaning.','A field differs. Hold the flow for review.']],
 [['Gejala dikaitkan dengan konteks; langkah berikutnya adalah verifikasi.','Perubahan contoh telah diperiksa terhadap skenario awal.'],['Symptom linked to context; verification is next.','Example change checked against the original scenario.']],
];
export function chronosExamples(language){return outcomes.map(row=>row[language==='id'?0:1]);}
