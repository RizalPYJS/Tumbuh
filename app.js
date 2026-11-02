const STORE = "tumbuh-prototype-v2";
let state = loadState();
let activePage = "home";
let toastTimer;
let chatMessages = [{ role: "assistant", text: CHATBOT_KB.welcome }];
let pendingFoodPhoto = null;
let pendingFoodPhotoUrl = null;
let discussionMessages = [];
let discussionStatus = "Ruang diskusi";
let discussionUserName = "User 8";
let discussionConnected = false;
let discussionLoading = false;
let discussionTimer = null;
const sampleDiscussionPosts = [
  {
    id: "sample-thread-1",
    nickname: "User 1",
    childAge: "2 tahun",
    topic: "Vitamin & suplemen",
    text: "Hai, Bun! Boleh minta tips merawat anak usia 2 tahun? Si kecil lagi aktif banget, aku masih belajar bikin rutinitas makan dan tidurnya 😊",
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    sample: true,
    replies: [
      { id: "sample-reply-1", nickname: "User 2", text: "Hai Wulan! Anakku juga 2 tahun 😄 Di rumah aku coba bikin jam tidur yang teratur, tapi tetap fleksibel kalau ada kegiatan.", createdAt: new Date(Date.now() - 105 * 60_000).toISOString() },
      { id: "sample-reply-2", nickname: "User 3", text: "Kalau soal makan, aku kasih pilihan sederhana biar dia merasa ikut menentukan. Semangat ya, Wulan 🌷", createdAt: new Date(Date.now() - 92 * 60_000).toISOString() }
    ]
  },
  {
    id: "sample-thread-2",
    nickname: "User 4",
    childAge: "3 tahun",
    topic: "Makan anak",
    text: "Anakku akhir-akhir ini susah makan sayur 😅 Ada yang punya cara biar dia mau coba tanpa dipaksa?",
    createdAt: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
    sample: true,
    replies: [
      { id: "sample-reply-3", nickname: "User 5", text: "Pernah ngalamin juga, Dina. Aku sajikan sedikit bareng makanan favoritnya. Kadang perlu ditawari berkali-kali 😊", createdAt: new Date(Date.now() - 225 * 60_000).toISOString() },
      { id: "sample-reply-4", nickname: "User 2", text: "Makan bareng lumayan membantu di rumahku. Anakku jadi penasaran lihat isi piring orang lain 😄", createdAt: new Date(Date.now() - 210 * 60_000).toISOString() }
    ]
  },
  {
    id: "sample-thread-3",
    nickname: "User 6",
    childAge: "4 tahun",
    topic: "Tumbuh kembang",
    text: "Mau ke Posyandu minggu ini. Selain Buku KIA, biasanya teman-teman siapin apa lagi? 🙂",
    createdAt: new Date(Date.now() - 25 * 60 * 60_000).toISOString(),
    sample: true,
    replies: [
      { id: "sample-reply-5", nickname: "User 1", text: "Aku suka catat pertanyaan dulu biar nggak lupa pas ketemu bidan. Semoga lancar ya, Lina 🌷", createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString() }
    ]
  }
];
const discussionNameAliases = ["Wulan", "Fulan", "Sari", "Dina", "Rani", "Lina", "Nisa", "Ayu", "Rika", "Tari", "Nanda", "Putri"];
let activeSpecialistFilter = "Semua";
const doctorSpecialties = [
  { id: "pediatrician", category: "Dokter anak", title: "Dokter Spesialis Anak", description: "Diskusi mengenai kesehatan umum, pertumbuhan, dan perkembangan anak.", topics: ["Kesehatan anak", "Tumbuh kembang"] },
  { id: "clinical-nutrition", category: "Dokter gizi", title: "Dokter Spesialis Gizi Klinik", description: "Evaluasi kebutuhan gizi yang berkaitan dengan kondisi medis dan terapi gizi.", topics: ["Kebutuhan gizi", "Kondisi khusus"] },
  { id: "dietitian", category: "Ahli gizi", title: "Ahli Gizi", description: "Pendampingan pola makan keluarga, pilihan menu, dan kebiasaan makan anak.", topics: ["Pola makan", "Menu anak"] },
  { id: "pediatric-dentist", category: "Dokter gigi", title: "Dokter Gigi Anak", description: "Konsultasi kesehatan gigi dan mulut anak, termasuk hal yang dapat memengaruhi kenyamanan makan.", topics: ["Gigi & mulut", "Kesehatan anak"] },
  { id: "lactation", category: "Konselor laktasi", title: "Konselor Laktasi", description: "Dukungan seputar menyusui dan transisi pemberian makanan sesuai tahap usia.", topics: ["Menyusui", "MPASI"] },
  { id: "child-psychologist", category: "Psikolog anak", title: "Psikolog Anak & Keluarga", description: "Pendampingan terkait perilaku makan, emosi, dan komunikasi dalam keluarga.", topics: ["Perilaku", "Dukungan keluarga"] }
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    const { checked, selectedDay, menusByDay, menu, budget, picky, maxCookTime, menuAge, ...savedData } = saved || {};
    return { child: null, history: [], growthMetric: "height", account: null, stories: [], ...savedData, previewSex: null, previewMonths: null };
  } catch { return { child: null, history: [], growthMetric: "height", account: null, stories: [], previewSex: null, previewMonths: null }; }
}
function persist() {
  const { previewSex, previewMonths, checked, selectedDay, menusByDay, menu, budget, picky, maxCookTime, menuAge, ...savedState } = state;
  localStorage.setItem(STORE, JSON.stringify(savedState));
}
function rupiah(value) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
function ageLabel(months) { const years = Math.floor(months / 12); const rem = months % 12; return years ? `${years} tahun${rem ? ` ${rem} bulan` : ""}` : `${months} bulan`; }
function latest() { return state.history.at(-1); }
function setPage(page) { activePage = page; render(); window.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth" }); }
function toast(message) { const el = document.getElementById("toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2300); }
function pageHeading(kicker, title, subtitle, action = "") { return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="subheading">${subtitle}</p></div>${action}</div>`; }
function profileCard() {
  if (!state.child) return `<section class="card profile-card"><div class="profile-top"><div class="kid-avatar">◎</div><span class="soft-pill">Belum ada profil</span></div><div><h2>Kenalan dengan si kecil</h2><p class="subheading">Simpan catatan timbang agar mudah melihat riwayatnya.</p></div><button class="button ghost" data-action="profile">＋ Tambah data anak</button></section>`;
  const m = latest();
  return `<section class="card profile-card"><div class="profile-top"><div class="kid-avatar">◎</div><span class="soft-pill">${ageLabel(state.child.months)}</span></div><div><h2>${escapeHTML(state.child.name)}</h2><p class="subheading">${m ? `Catatan terakhir · ${formatDate(m.date)}` : "Belum ada catatan timbang"}</p></div><button class="button ghost" data-page="growth">${m ? "Lihat catatan pertumbuhan →" : "Tambah catatan timbang →"}</button></section>`;
}
function homePage() {
  const m = latest();
  const name = state.account?.name ? escapeHTML(state.account.name) : state.child ? escapeHTML(state.child.name) : "Keluarga";
  return `${pageHeading("Ruang tumbuh keluarga", `Halo, ${name}`, "Langkah kecil hari ini berarti untuk tumbuh kembang si kecil.")}
    <div class="grid"><section class="card hero-card"><div class="hero-copy"><p class="eyebrow">Teman tumbuh kembangmu</p><h2>Lebih tenang menemani setiap langkah kecil.</h2><p>Catat pertumbuhan dan temukan ide menu keluarga yang praktis, bergizi, dan ramah di kantong.</p><button class="button light" data-action="ask-suggestion" data-question="Tampilkan ide menu">Lihat ide menu</button></div></section>${profileCard()}</div>
    <div class="section-row"><h2>Catatan si kecil</h2><button class="text-button" data-page="growth">${state.child ? "Buka catatan →" : "Mulai catat →"}</button></div>
    ${state.child ? `<div class="stat-row"><div class="stat-card"><span class="stat-icon">⚖</span><span class="stat-label">Berat terakhir</span><span class="stat-value">${m ? `${m.weight} kg` : "Belum dicatat"}</span></div><div class="stat-card"><span class="stat-icon">↕</span><span class="stat-label">Tinggi terakhir</span><span class="stat-value">${m ? `${m.height} cm` : "Belum dicatat"}</span></div><div class="stat-card"><span class="stat-icon">▤</span><span class="stat-label">Jumlah catatan</span><span class="stat-value">${state.history.length} kali</span></div></div>` : `<div class="empty-state"><div class="empty-emoji">▤</div><p>Belum ada catatan pertumbuhan. Tambahkan profil anak untuk mulai menyimpan hasil timbang.</p><button class="button small" data-action="profile">Tambah data anak</button></div>`}
    <div class="notice"><span class="notice-icon">ⓘ</span><p>Catatan pertumbuhan membantu memantau data anak, bukan diagnosis atau penilaian status gizi.</p></div>`;
}
function growthPage() {
  const m = latest();
  return `${pageHeading("Catatan sederhana", "Pertumbuhan si kecil", "Masukkan berat dan tinggi menurut usia; lihat titiknya pada kurva rujukan seperti di Buku KIA.", `<button class="button small" data-action="profile">${state.child ? "Edit profil" : "＋ Data anak"}</button>`)}
    <div class="content-grid"><section class="card"><div class="section-row" style="margin-top:0"><h2>${state.child ? `Catatan ${escapeHTML(state.child.name)}` : "Profil anak"}</h2><span class="soft-pill">Disimpan di perangkat</span></div>
      <form id="growthForm"><div class="form-grid">
        <div class="field"><label for="childName">Nama panggilan</label><input id="childName" name="name" placeholder="Contoh: Adek" value="${escapeHTML(state.child?.name || "")}" required maxlength="30" /></div>
        <div class="field"><label for="childAge">Usia saat ditimbang (bulan)</label><input id="childAge" name="months" type="number" min="12" max="60" step="1" placeholder="Contoh: 24" value="${m?.months ?? state.child?.months ?? state.previewMonths ?? ""}" required /></div>
        <div class="field"><label for="childSex">Jenis kelamin</label><select id="childSex" name="sex" required><option value="">Pilih</option><option value="P" ${(state.child?.sex || state.previewSex) === "P" ? "selected" : ""}>Perempuan</option><option value="L" ${(state.child?.sex || state.previewSex) === "L" ? "selected" : ""}>Laki-laki</option></select></div>
        <div class="field"><label for="measureDate">Tanggal ditimbang</label><input id="measureDate" name="date" type="date" value="${m?.date || today()}" required /></div>
        <div class="field"><label for="weight">Berat badan (kg)</label><input id="weight" name="weight" type="number" min="1" max="40" step="0.1" placeholder="Contoh: 12.5" value="${m?.weight ?? ""}" required /></div>
        <div class="field"><label for="height">Panjang/tinggi badan (cm)</label><input id="height" name="height" type="number" min="40" max="130" step="0.1" placeholder="Contoh: 86" value="${m?.height ?? ""}" required /><span class="field-hint">Ikuti cara ukur yang digunakan petugas Posyandu.</span></div>
      </div><p class="field-hint" style="margin:12px 0 0">Masukkan angka dari pengukuran terbaru. Untuk usia di bawah 2 tahun, standar WHO memakai panjang badan; mulai 2 tahun memakai tinggi berdiri. Ikuti cara ukur petugas.</p><div class="form-actions"><button class="button" type="submit">Simpan catatan</button><button class="button ghost" type="reset">Kosongkan</button></div></form>
      <div id="growthReferencePreview">${growthReferencePreview(m?.months ?? state.child?.months ?? state.previewMonths, state.child?.sex || state.previewSex)}</div>
      ${m ? `<div class="growth-result"><div class="result-heading"><strong>Catatan terakhir berhasil disimpan</strong><span class="soft-pill">${formatDate(m.date)}</span></div><div class="result-numbers"><div><b>${m.weight} kg</b>Berat badan</div><div><b>${m.height} cm</b>Panjang/tinggi</div><div><b>${ageLabel(m.months)}</b>Usia saat ukur</div></div>${growthReferenceSummary(m)}<p class="small-note" style="margin:13px 0 0">Rujukan ini membantu membaca grafik, bukan diagnosis. Konfirmasi hasil pengukuran dengan tenaga kesehatan dan Buku KIA.</p></div>` : ""}
    </section><section class="card chart-card"><p class="eyebrow">Kurva WHO · tampilan seperti Buku KIA</p><h2>Grafik pertumbuhan</h2><p class="subheading">Pilih berat-menurut-usia atau panjang/tinggi-menurut-usia.</p><div class="metric-switch" role="group" aria-label="Pilih data grafik"><button class="metric-button ${state.growthMetric === "weight" ? "active" : ""}" data-action="growth-metric" data-metric="weight">Berat badan</button><button class="metric-button ${(state.growthMetric || "height") === "height" ? "active" : ""}" data-action="growth-metric" data-metric="height">Panjang/tinggi</button></div><div id="growthChartView">${chartHTML()}${metricSummary()}</div><div class="chart-key"><span><i class="key-dot"></i>Titik ukur anak</span><span>Kurva rujukan WHO menurut umur dan jenis kelamin</span></div></section></div>
    ${historyTable()}
    <div class="notice"><span class="notice-icon">ⓘ</span><p><b>Bukan diagnosis medis.</b> Grafik berat-menurut-usia dan panjang/tinggi-menurut-usia menampilkan rujukan WHO. Berat-menurut-usia saja tidak cukup untuk menilai status gizi. Bila khawatir, konsultasikan dengan tenaga kesehatan.</p></div>`;
}
function referenceFor(months, sex, metric = "height") {
  const sexKey = sex === "P" ? "girls" : sex === "L" ? "boys" : null;
  const rows = sexKey ? GROWTH_REFERENCE[metric]?.[sexKey] : null;
  if (!rows || months < 12 || months > 60) return null;
  const row = rows.find(item => item[0] === Number(months));
  return row ? { month: row[0], minus3: row[1], minus2: row[2], minus1: row[3], median: row[4], plus1: row[5], plus2: row[6], plus3: row[7] } : null;
}
function growthReferenceSummary(measurement) {
  const weight = referenceFor(measurement.months, state.child?.sex, "weight");
  const height = referenceFor(measurement.months, state.child?.sex, "height");
  if (!weight || !height) return `<p class="small-note reference-panel">Rujukan WHO tersedia untuk usia 12–60 bulan setelah jenis kelamin dipilih.</p>`;
  return `<div class="reference-panel"><span>Rujukan WHO · ${ageLabel(measurement.months)} · ${state.child.sex === "P" ? "perempuan" : "laki-laki"}</span><div><strong>Berat/usia</strong><small>Median ${weight.median} kg · −2 s.d. +2 SD: ${weight.minus2}–${weight.plus2} kg</small></div><div><strong>Panjang/tinggi/usia</strong><small>Median ${height.median} cm · −2 s.d. +2 SD: ${height.minus2}–${height.plus2} cm</small></div></div>`;
}
function growthReferencePreview(months, sex) {
  const weight = referenceFor(Number(months), sex, "weight");
  const height = referenceFor(Number(months), sex, "height");
  if (!weight || !height) return `<div class="reference-preview muted"><b>Dataset rujukan WHO</b><span>Pilih usia 12–60 bulan dan jenis kelamin untuk melihat median dan rentang rujukan berat serta panjang/tinggi badan.</span></div>`;
  return `<div class="reference-preview"><div><b>Rujukan WHO · ${ageLabel(weight.month)}</b><span>${sex === "P" ? "Perempuan" : "Laki-laki"} · nilai berbeda menurut umur dan jenis kelamin</span></div><div class="ref-values"><strong>${weight.median} kg</strong><span>median berat/usia</span></div><div class="ref-values"><strong>${height.median} cm</strong><span>median panjang/tinggi/usia</span></div><div class="reference-ranges"><span>−2 s.d. +2 SD berat: ${weight.minus2}–${weight.plus2} kg</span><span>−2 s.d. +2 SD panjang/tinggi: ${height.minus2}–${height.plus2} cm</span></div><a href="${GROWTH_REFERENCE.source.weight}" target="_blank" rel="noreferrer">Sumber WHO berat ↗</a><a href="${GROWTH_REFERENCE.source.height}" target="_blank" rel="noreferrer">Sumber WHO panjang/tinggi ↗</a><small>Rujukan statistik, bukan target tunggal atau diagnosis.</small></div>`;
}
function chartMeasurements(metric) {
  const measurements = [...state.history];
  const age = Number(document.getElementById("childAge")?.value || state.previewMonths || state.child?.months);
  const value = Number(document.getElementById(metric)?.value);
  const sex = document.getElementById("childSex")?.value || state.previewSex || state.child?.sex;
  if (!sex || age < 12 || age > 60 || !value) return measurements.sort((a,b) => a.date.localeCompare(b.date));
  const date = document.getElementById("measureDate")?.value || today();
  const index = measurements.findIndex(item => item.date === date);
  const saved = index >= 0 ? measurements[index] : null;
  const preview = { ...(saved || { weight: null, height: null }), date, months: age, [metric]: value };
  preview.preview = !saved || Number(saved[metric]) !== value || saved.months !== age;
  if (index >= 0) measurements[index] = preview;
  else measurements.push(preview);
  return measurements.sort((a,b) => a.date.localeCompare(b.date));
}
function chartHTML() {
  const metric = state.growthMetric === "height" ? "height" : "weight";
  const hist = chartMeasurements(metric);
  const unit = metric === "weight" ? "kg" : "cm";
  const label = metric === "weight" ? "berat badan menurut usia" : "panjang/tinggi badan menurut usia";
  const curveSex = state.previewSex || state.child?.sex;
  const useReference = curveSex === "P" || curveSex === "L";
  if (!hist.length && !useReference) return `<div class="chart-wrap"><div class="chart-empty"><span>📈</span><b>Kurva ${label} siap ditampilkan</b><small>Pilih jenis kelamin di formulir untuk menampilkan kurva WHO; simpan pengukuran untuk menambah titik anak.</small></div></div>`;
  const rows = useReference ? GROWTH_REFERENCE[metric][curveSex === "P" ? "girls" : "boys"] : [];
  const actualValues = hist.map(x => Number(x[metric]));
  const values = [...actualValues, ...rows.flatMap(row => [row[1], row[7]])];
  const lo = Math.min(...values), hi = Math.max(...values), pad = Math.max((hi - lo) * .08, metric === "weight" ? .4 : 1);
  const min = lo - pad, max = hi + pad;
  const plot = { left: 36, right: 326, top: 12, bottom: 164 };
  const xAge = month => plot.left + ((month - 12) / 48) * (plot.right - plot.left);
  const yValue = value => plot.bottom - ((value - min) / (max - min || 1)) * (plot.bottom - plot.top);
  const coords = hist.map((item, i) => ({ x: useReference ? xAge(item.months) : hist.length === 1 ? 180 : plot.left + i * ((plot.right - plot.left) / (hist.length - 1)), y: yValue(Number(item[metric])) }));
  const points = coords.map(p => `${p.x},${p.y}`).join(" ");
  const line = hist.length > 1 ? `<polyline points="${points}" fill="none" stroke="#214a6a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : "";
  let band = "", refLines = "", refLegend = "";
  if (useReference) {
    const lower = rows.map(row => `${xAge(row[0])},${yValue(row[2])}`);
    const upper = [...rows].reverse().map(row => `${xAge(row[0])},${yValue(row[6])}`);
    band = `<polygon points="${[...lower, ...upper].join(" ")}" fill="#d3e5f2" opacity=".9"/>`;
    const styles = [
      { index: 1, color: "#566e82", dash: "3 3", width: 1 },
      { index: 2, color: "#2e6593", dash: "4 3", width: 1.3 },
      { index: 3, color: "#446c8c", dash: "2 3", width: 1 },
      { index: 4, color: "#253542", dash: "5 3", width: 1.8 },
      { index: 5, color: "#446c8c", dash: "2 3", width: 1 },
      { index: 6, color: "#2e6593", dash: "4 3", width: 1.3 },
      { index: 7, color: "#566e82", dash: "3 3", width: 1 }
    ];
    refLines = styles.map(style => `<polyline points="${rows.map(row => `${xAge(row[0])},${yValue(row[style.index])}`).join(" ")}" fill="none" stroke="${style.color}" stroke-width="${style.width}" stroke-dasharray="${style.dash}"/>`).join("");
    refLegend = `<div class="reference-legend"><span><i style="background:#566e82"></i>±3 SD</span><span><i style="background:#2e6593"></i>±2 SD</span><span><i style="background:#446c8c"></i>±1 SD</span><span><i style="background:#253542"></i>Median</span></div>`;
  }
  const yLabels = `<text x="0" y="17" class="chart-axis-label">${max.toFixed(metric === "weight" ? 1 : 0)} ${unit}</text><text x="0" y="164" class="chart-axis-label">${min.toFixed(metric === "weight" ? 1 : 0)} ${unit}</text>`;
  const xLabels = useReference ? [12,24,36,48,60].map(month => `<text x="${xAge(month)}" y="186" text-anchor="middle" class="chart-axis-label">${month} bln</text>`).join("") : "";
  const noMeasurementHint = !hist.length ? `<div class="chart-hint">Kurva rujukan WHO ditampilkan sebagai panduan visual. Belum ada titik pengukuran anak. Simpan data timbang untuk menambahkannya.</div>` : "";
  return `<div class="chart-wrap"><svg viewBox="0 0 340 195" role="img" aria-label="Grafik ${label}, ${hist.length} pengukuran${useReference ? " dengan kurva WHO z-score" : ""}">${yLabels}${band}${refLines}${line}${coords.map((p,i) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${hist[i].preview ? "#2e6593" : "#fff"}" stroke="#214a6a" stroke-width="3"><title>${actualValues[i]} ${unit} · ${ageLabel(hist[i].months)} · ${formatDate(hist[i].date)}${hist[i].preview ? " · pratinjau belum disimpan" : ""}</title></circle>`).join("")}${xLabels}</svg></div>${useReference ? `${refLegend}<div class="chart-hint">Area biru muda menunjukkan pita −2 hingga +2 SD. Bingkai navy menandai catatan tersimpan, isian biru menandai pratinjau. Kurva rujukan bukan diagnosis.</div>${noMeasurementHint}` : `<div class="chart-dates"><span>${formatDate(hist[0].date)}</span><span>${hist.length > 1 ? formatDate(hist.at(-1).date) : "Catatan pertama"}</span></div>`}`;
}
function metricSummary() {
  const hist = [...state.history].sort((a,b) => a.date.localeCompare(b.date));
  if (!hist.length) return "";
  const metric = state.growthMetric === "height" ? "height" : "weight";
  const unit = metric === "weight" ? "kg" : "cm";
  const label = metric === "weight" ? "Berat terakhir" : "Tinggi terakhir";
  const current = Number(hist.at(-1)[metric]);
  if (hist.length < 2) return `<div class="trend-stat"><span>${label}</span><strong>${current} ${unit}</strong><small>Baru ada satu catatan</small></div>`;
  const previous = Number(hist.at(-2)[metric]);
  const change = current - previous;
  const formatted = `${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit}`;
  return `<div class="trend-stat"><span>Perubahan dari catatan sebelumnya</span><strong>${formatted}</strong><small>${formatDate(hist.at(-2).date)} → ${formatDate(hist.at(-1).date)} · selisih angka saja, bukan penilaian</small></div>`;
}
function historyTable() {
  const hist = [...state.history].sort((a,b) => b.date.localeCompare(a.date));
  if (!hist.length) return "";
  return `<section class="card history-card"><div class="section-row" style="margin-top:0"><div><p class="eyebrow">Catatan tersimpan</p><h2>Riwayat pengukuran</h2></div><span class="soft-pill">${hist.length} catatan</span></div><div class="history-list">${hist.map(item => `<div class="history-row"><span class="history-date">${formatDate(item.date)}<small>${ageLabel(item.months)}</small></span><span><b>${item.weight} kg</b><small>Berat</small></span><span><b>${item.height} cm</b><small>Tinggi</small></span></div>`).join("")}</div></section>`;
}
function discussionFeedPosts() {
  if (!discussionMessages.length) return sampleDiscussionPosts;
  return [...discussionMessages].sort((a, b) => {
    const difference = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    return Number.isFinite(difference) && difference ? difference : Number(b.id) - Number(a.id);
  });
}
function discussionDisplayName(nickname) {
  const value = String(nickname || "").trim();
  const match = value.match(/^User\s+(\d+)$/i);
  if (!match) return value || "Teman";
  const number = Math.max(1, Number(match[1]));
  const alias = discussionNameAliases[(number - 1) % discussionNameAliases.length];
  const suffix = Math.floor((number - 1) / discussionNameAliases.length);
  return suffix ? `${alias} ${suffix + 1}` : alias;
}
function discussionAvatarLabel(nickname) {
  return discussionDisplayName(nickname).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "T";
}
function discussionPostHTML(post) {
  const replies = Array.isArray(post.replies) ? post.replies : [];
  const authorName = discussionDisplayName(post.nickname);
  const context = post.childAge && post.childAge !== "Tidak disebutkan" ? `Anak ${escapeHTML(post.childAge)}` : "";
  const replyForm = `<form class="discussion-reply-form" data-post-id="${escapeHTML(post.id)}" data-sample="${post.sample ? "true" : "false"}"><textarea name="text" rows="2" maxlength="500" placeholder="Balas sebagai ${escapeHTML(discussionDisplayName(discussionUserName))}…" required></textarea><button class="button small" type="submit">Balas</button></form>`;
  return `<article class="discussion-post ${post.sample ? "sample-post" : ""}" data-post-id="${post.id}">
    <header class="discussion-post-header"><div class="discussion-author"><span class="discussion-avatar" aria-hidden="true">${discussionAvatarLabel(authorName)}</span><div class="discussion-author-copy"><span class="discussion-author-line"><strong>${escapeHTML(authorName)}</strong></span>${context ? `<span class="discussion-context">${context}</span>` : ""}</div></div><time>${formatDiscussionDate(post.createdAt)}</time></header>
    <div class="discussion-post-body"><span class="discussion-topic">${escapeHTML(post.topic || "Berbagi cerita")}</span><p>${escapeHTML(post.text).replace(/\n/g,"<br>")}</p></div>
    <details class="discussion-thread" ${post.sample ? "open" : ""}><summary><span class="discussion-thread-label">Balasan</span><span class="discussion-thread-count">${replies.length} balasan</span></summary><div class="discussion-replies">${replies.map(reply => { const replyName = discussionDisplayName(reply.nickname); return `<article class="discussion-reply"><header class="discussion-reply-header"><span class="discussion-avatar discussion-avatar-small" aria-hidden="true">${discussionAvatarLabel(replyName)}</span><strong>${escapeHTML(replyName)}</strong><time>${formatDiscussionDate(reply.createdAt)}</time></header><p>${escapeHTML(reply.text).replace(/\n/g,"<br>")}</p></article>`; }).join("")}${replyForm}</div></details>
  </article>`;
}
function discussionClientId() {
  const key = "tumbuh-discussion-client-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
function discussionPage() {
  const feedPosts = discussionFeedPosts();
  const posts = feedPosts.map(discussionPostHTML).join("");
  const countLabel = `${feedPosts.length} utas`;
  return `${pageHeading("Ruang bersama", "Diskusi", "Ruang untuk bertukar pengalaman seputar makan dan tumbuh kembang anak.")}
    <section class="discussion-card"><div class="discussion-feed-toolbar"><div class="discussion-feed-title"><div><strong>Postingan komunitas</strong><span>Setiap cerita memiliki ruang balasan tersendiri.</span></div></div><div class="discussion-toolbar-right"><span class="discussion-count">${countLabel}</span><div class="discussion-status"><span class="status-dot ${discussionConnected ? "online" : "offline"}"></span><span id="discussionStatus">${escapeHTML(discussionStatus)}</span><button class="text-button" data-action="refresh-discussion">Muat ulang</button></div></div></div><div class="discussion-messages" id="discussionMessages">${posts}</div></section>`;
}
function formatDiscussionDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("id-ID", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }).format(date);
}
function updateDiscussionView() {
  const status = document.getElementById("discussionStatus");
  if (status) status.textContent = discussionStatus;
  const list = document.getElementById("discussionMessages");
  if (!list) return;
  const openIds = new Set([...list.querySelectorAll(".discussion-post[data-post-id]")].map(post => post.dataset.postId));
  const drafts = new Map([...list.querySelectorAll(".discussion-reply-form")].map(form => [form.dataset.postId, form.querySelector("textarea")?.value || ""]));
  const activeForm = document.activeElement?.closest?.(".discussion-reply-form");
  const focusedPostId = activeForm?.dataset.postId;
  const focusedSelection = activeForm ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  list.innerHTML = discussionFeedPosts().map(discussionPostHTML).join("");
  for (const post of list.querySelectorAll(".discussion-post")) {
    const postId = post.dataset.postId;
    const thread = post.querySelector(".discussion-thread");
    if (openIds.has(postId) && thread) thread.open = true;
    const textarea = post.querySelector(".discussion-reply-form textarea");
    if (textarea && drafts.has(postId)) textarea.value = drafts.get(postId);
    if (textarea && postId === focusedPostId) {
      textarea.focus();
      if (focusedSelection?.[0] != null) textarea.setSelectionRange(...focusedSelection);
    }
  }
}
async function loadDiscussionMessages() {
  if (location.protocol === "file:") {
    discussionConnected = false;
    discussionStatus = "Server diskusi belum aktif";
    updateDiscussionView();
    return;
  }
  if (discussionLoading) return;
  discussionLoading = true;
  try {
    const response = await fetch(`/api/discussions?limit=60&clientId=${encodeURIComponent(discussionClientId())}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Server merespons ${response.status}`);
    const result = await response.json();
    discussionMessages = Array.isArray(result.messages) ? result.messages : [];
    discussionUserName = result.currentUser?.displayName || discussionUserName;
    discussionConnected = true;
    discussionStatus = "Ruang diskusi aktif";
  } catch {
    discussionConnected = false;
    discussionStatus = "Server belum terhubung";
  } finally {
    discussionLoading = false;
    updateDiscussionView();
  }
}
async function submitDiscussionReply(form) {
  const data = new FormData(form);
  const text = String(data.get("text") || "").trim();
  const parentId = form.dataset.postId;
  if (!parentId || !text) return;
  if (form.dataset.sample === "true") {
    const post = sampleDiscussionPosts.find(item => item.id === parentId);
    if (!post) { toast("Postingan tidak ditemukan."); return; }
    post.replies.push({ id: `sample-reply-${Date.now()}`, nickname: discussionUserName, text, createdAt: new Date().toISOString() });
    form.reset();
    updateDiscussionView();
    toast("Balasan terkirim.");
    return;
  }
  if (location.protocol === "file:") { toast("Server diskusi belum aktif."); return; }
  const payload = { clientId: discussionClientId(), parentId: Number(parentId), text };
  if (!payload.parentId) return;
  const button = form.querySelector('button[type="submit"]');
  if (button) { button.disabled = true; button.textContent = "Mengirim…"; }
  try {
    const response = await fetch("/api/discussions", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Server merespons ${response.status}`);
    discussionMessages = discussionMessages.map(post => post.id === payload.parentId ? { ...post, replies: [...(post.replies || []), result.message] } : post);
    discussionConnected = true;
    discussionStatus = "Ruang diskusi aktif";
    render();
    toast("Balasan terkirim.");
  } catch (error) {
    toast(`Balasan belum terkirim: ${error.message}`);
  } finally {
    if (button?.isConnected) { button.disabled = false; button.textContent = "Balas"; }
  }
}
function doctorPage() {
  const categories = ["Semua", ...new Set(doctorSpecialties.map(specialist => specialist.category))];
  const visibleSpecialists = doctorSpecialties.filter(specialist => activeSpecialistFilter === "Semua" || specialist.category === activeSpecialistFilter);
  const filters = categories.map(category => `<button type="button" class="doctor-filter ${activeSpecialistFilter === category ? "active" : ""}" data-action="specialist-filter" data-category="${escapeHTML(category)}" aria-pressed="${activeSpecialistFilter === category}">${escapeHTML(category)}</button>`).join("");
  const cards = visibleSpecialists.map(specialist => `<article class="doctor-focus-card"><div class="doctor-focus-header"><span class="doctor-category">${escapeHTML(specialist.category)}</span><h3>${escapeHTML(specialist.title)}</h3></div><p>${escapeHTML(specialist.description)}</p><div class="doctor-topics">${specialist.topics.map(topic => `<span>${escapeHTML(topic)}</span>`).join("")}</div><div class="doctor-focus-footer"><button type="button" class="button small" data-action="doctor-consultation" data-specialty="${escapeHTML(specialist.title)}">Konsultasi</button></div></article>`).join("");
  const gridClass = `doctor-primary-grid${visibleSpecialists.length === 1 ? " single-specialty" : ""}`;
  return `${pageHeading("Dukungan profesional", "Konsultasi", "Pilih dokter atau tenaga kesehatan sesuai kebutuhan tumbuh kembang si kecil.")}
    <section class="doctor-directory" id="specialistDirectory"><div class="discussion-feed-toolbar doctor-directory-toolbar"><div class="discussion-feed-title"><div><strong>Bidang konsultasi</strong><span>Pilih kategori tenaga kesehatan yang sesuai.</span></div></div><span class="discussion-count">${visibleSpecialists.length} bidang</span></div><div class="doctor-filters" role="group" aria-label="Filter jenis spesialis">${filters}</div><div class="${gridClass}">${cards}</div></section>`;
}
function consultPage() {
  const suggestions = ["Tampilkan ide menu", "Sarapan dengan telur", "Menu hemat di bawah Rp10 ribu", "Bagaimana membaca grafik Buku KIA?"];
  const messages = chatMessages.map(message => `<div class="chat-message ${message.role === "user" ? "user" : "assistant"}"><span class="chat-avatar">${message.role === "user" ? "Anda" : "AI"}</span><div class="chat-message-content">${message.photoUrl ? `<img class="chat-photo" src="${message.photoUrl}" alt="Foto makanan yang dilampirkan" />` : ""}<p>${escapeHTML(message.text)}</p></div></div>`).join("");
  return `${pageHeading("Asisten Tumbuh", "Tanya AI", "Tanyakan menu, anggaran, atau pertumbuhan; kamu juga dapat melampirkan foto makanan.")}
    <section class="chat-card"><div class="chat-header"><div class="chat-bot-mark">AI</div><div><strong>Asisten Tumbuh</strong><span>Informasi menu dan tumbuh kembang</span></div><button class="text-button" data-action="clear-chat">Percakapan baru</button></div>
      <div class="chat-messages" id="chatMessages" aria-live="polite">${messages}</div>
      <div class="chat-suggestions"><span>Coba tanyakan</span>${suggestions.map(q=>`<button class="suggestion-chip" data-action="ask-suggestion" data-question="${escapeHTML(q)}">${escapeHTML(q)}</button>`).join("")}</div>
      <div class="photo-preview-panel" id="photoPreviewPanel" hidden><img id="foodPhotoPreview" alt="Pratinjau foto makanan"/><div class="photo-preview-meta"><strong id="foodPhotoName"></strong><span id="foodPhotoStatus">Foto belum dikirim.</span><label id="photoConsentLabel" hidden><input id="photoConsent" type="checkbox"/> Saya setuju mengirim foto untuk dianalisis</label></div><button type="button" class="text-button" data-action="remove-photo">Hapus foto</button></div>
      <form class="chat-form" id="chatForm"><label class="attach-photo" for="foodPhoto" title="Lampirkan foto">▧ <span>Foto</span></label><input id="foodPhoto" class="sr-only" name="foodPhoto" type="file" accept="image/*" capture="environment"/><label class="sr-only" for="chatInput">Tulis pertanyaan</label><input id="chatInput" name="question" type="text" maxlength="300" placeholder="Tulis pertanyaan atau lampirkan foto…" autocomplete="off"/><button class="button" type="submit">Kirim <span>↑</span></button></form>
      <div class="chat-disclaimer"><b>Informasi kesehatan:</b> jawaban bersifat umum dan tidak menggantikan pemeriksaan atau arahan tenaga kesehatan. Analisis foto menampilkan estimasi, bukan diagnosis atau pengukuran laboratorium. Untuk kondisi darurat, segera hubungi layanan medis.</div>
    </section>`;
}
function foodAnalysisEndpoint() { return String(window.FOOD_ANALYSIS_CONFIG?.endpoint || "").trim(); }
function syncPhotoPreview() {
  const panel = document.getElementById("photoPreviewPanel");
  if (!panel) return;
  panel.hidden = !pendingFoodPhoto;
  if (!pendingFoodPhoto) return;
  document.getElementById("foodPhotoPreview").src = pendingFoodPhotoUrl;
  document.getElementById("foodPhotoName").textContent = pendingFoodPhoto.name;
  const endpoint = foodAnalysisEndpoint();
  document.getElementById("foodPhotoStatus").textContent = endpoint ? "Analisis tersedia setelah persetujuan pengiriman." : "Pratinjau lokal saja; layanan analisis belum dihubungkan.";
  document.getElementById("photoConsentLabel").hidden = !endpoint;
}
function setPendingFoodPhoto(file) {
  if (!file) {
    if (pendingFoodPhotoUrl) URL.revokeObjectURL(pendingFoodPhotoUrl);
    pendingFoodPhoto = null;
    pendingFoodPhotoUrl = null;
    const input = document.getElementById("foodPhoto");
    if (input) input.value = "";
    syncPhotoPreview();
    return;
  }
  if (!file.type.startsWith("image/")) { toast("Pilih file gambar, seperti JPEG, PNG, atau WebP."); return; }
  if (file.size > 5 * 1024 * 1024) { toast("Ukuran foto maksimal 5 MB."); return; }
  if (pendingFoodPhotoUrl) URL.revokeObjectURL(pendingFoodPhotoUrl);
  pendingFoodPhoto = file;
  pendingFoodPhotoUrl = URL.createObjectURL(file);
  const input = document.getElementById("foodPhoto");
  if (input) input.value = "";
  syncPhotoPreview();
}
function clearChat() {
  for (const message of chatMessages) if (message.photoUrl) URL.revokeObjectURL(message.photoUrl);
  setPendingFoodPhoto(null);
  chatMessages = [{ role: "assistant", text: CHATBOT_KB.welcome }];
  render();
}
function analysisEndpoint() {
  return String(window.FOOD_ANALYSIS_CONFIG?.endpoint || "").trim();
}
async function analyzeFoodPhoto(file) {
  const endpoint = analysisEndpoint();
  if (!endpoint) throw new Error("Belum ada endpoint model yang dikonfigurasi.");
  const payload = new FormData();
  payload.append("image", file, file.name);
  const response = await fetch(endpoint, { method: "POST", body: payload, credentials: "same-origin" });
  if (!response.ok) throw new Error(`Layanan analisis memberikan respons ${response.status}.`);
  const result = await response.json();
  if (!Array.isArray(result.items)) throw new Error("Format hasil model tidak sesuai kontrak aplikasi.");
  return result;
}
function formatFoodAnalysis(result) {
  const items = result.items;
  if (!items.length) return "Model belum mengidentifikasi makanan dengan yakin. Coba foto yang lebih jelas atau tulis nama makanan secara manual.";
  const number = value => value === null || value === undefined || value === "" ? "-" : Number.isFinite(Number(value)) ? `${Math.round(Number(value))}` : "-";
  const rows = items.map(item => {
    const nutrition = item.nutrition || item;
    const quantity = item.portion_g ?? item.grams ?? item.mass_g;
    return `• ${item.name || item.food || "Makanan terdeteksi"}${quantity ? ` (${number(quantity)} g)` : ""}: ${number(nutrition.calories_kcal ?? nutrition.kcal)} kkal, protein ${number(nutrition.protein_g)} g, karbohidrat ${number(nutrition.carbs_g ?? nutrition.carb_g)} g, lemak ${number(nutrition.fat_g)} g`;
  });
  const total = result.total || {};
  const summary = total.calories_kcal != null || total.kcal != null
    ? `\nTotal perkiraan: ${number(total.calories_kcal ?? total.kcal)} kkal.`
    : "";
  return `Perkiraan kandungan dari foto:\n${rows.join("\n")}${summary}\n\nHasil visual dapat keliru, terutama pada ukuran porsi, minyak, saus, dan bahan tersembunyi. Periksa atau koreksi sebelum digunakan; ini bukan penilaian gizi medis.`;
}
function normalizeChat(text) {
  return String(text).toLocaleLowerCase("id-ID").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function menuAnswer(question) {
  const text = normalizeChat(question);
  const triggers = ["menu", "resep", "sarapan", "makan siang", "makan malam", "selingan", "camilan", "ide makan", "makanan apa", "masak apa"];
  if (!triggers.some(term => (` ${text} `).includes(` ${term} `))) return null;

  const slots = [
    { id: "pagi", phrases: ["sarapan", "pagi"] },
    { id: "siang", phrases: ["makan siang", "siang"] },
    { id: "malam", phrases: ["makan malam", "malam", "sup"] },
    { id: "snack", phrases: ["selingan", "camilan", "snack"] }
  ];
  const selectedSlot = slots.find(slot => slot.phrases.some(phrase => (` ${text} `).includes(` ${phrase} `)))?.id;
  const ingredientTerms = ["ayam", "telur", "ikan", "lele", "tempe", "tahu", "bayam", "wortel", "labu", "pisang", "pepaya", "alpukat", "roti", "nasi", "kacang", "kentang", "buncis", "yogurt", "melon"];
  const selectedIngredients = ingredientTerms.filter(item => (` ${text} `).includes(` ${item} `));
  const budgetMatch = text.match(/\b(?:budget|anggaran|rp)\s*(\d+(?:[.,]\d+)?)\s*(ribu|rb|k)?\b/);
  let maxPrice = null;
  if (budgetMatch) {
    const amount = Number(budgetMatch[1].replace(",", "."));
    const multiplier = budgetMatch[2] ? 1000 : amount <= 200 ? 1000 : 1;
    maxPrice = Math.round(amount * multiplier);
  }
  const timeMatch = text.match(/\b(\d{1,2})\s*menit\b/);
  const quick = /cepat|praktis|singkat/.test(text);
  const maxTime = timeMatch ? Number(timeMatch[1]) : quick ? 20 : null;
  const picky = /pilih pilih|susah makan|mogok makan/.test(text);
  let recipes = Object.values(MENU_DATABASE.recipes).filter(recipe => {
    if (selectedSlot && recipe.slot !== selectedSlot) return false;
    if (selectedIngredients.length && !selectedIngredients.some(ingredient => normalizeChat(recipe.ingredients).includes(ingredient))) return false;
    if (maxPrice && recipe.price > maxPrice) return false;
    if (maxTime && recipe.time > maxTime) return false;
    return true;
  });
  recipes.sort((a,b) => {
    if (picky) {
      const softA = a.tags.some(tag => /lembut/i.test(tag)) ? 1 : 0;
      const softB = b.tags.some(tag => /lembut/i.test(tag)) ? 1 : 0;
      if (softA !== softB) return softB - softA;
    }
    if (maxPrice || /hemat|murah|anggaran|budget/.test(text)) return a.price - b.price || a.time - b.time;
    if (maxTime || quick) return a.time - b.time || a.price - b.price;
    return a.name.localeCompare(b.name, "id");
  });
  if (!recipes.length) return "Belum ada resep dalam katalog yang sesuai dengan filter itu. Coba ubah bahan, batas harga, atau waktu memasak.";

  let picks;
  if (!selectedSlot && !selectedIngredients.length) {
    picks = ["pagi", "siang", "malam", "snack"].map(slot => recipes.find(recipe => recipe.slot === slot)).filter(Boolean);
  } else {
    picks = recipes.slice(0,4);
  }
  const cards = picks.map(recipe => `${recipe.emoji} ${recipe.name} · ${recipe.label}\nBahan: ${recipe.ingredients}\nWaktu: ${recipe.time} menit · Estimasi: ${rupiah(recipe.price)}\nKelompok: ${recipe.foodGroups.join(", ") || "menu rumahan"}`).join("\n\n");
  return `${cards}\n\nPorsi dan harga merupakan perkiraan. Sesuaikan bahan, tekstur, dan porsi dengan usia serta kebutuhan anak.`;
}
function answerChat(question) {
  const normalized = normalizeChat(question);
  if (!normalized) return CHATBOT_KB.fallback;
  const urgent = CHATBOT_KB.intents.find(intent => intent.id === "urgent_symptoms");
  if (urgent.keywords.some(keyword => (` ${normalized} `).includes(` ${normalizeChat(keyword)} `))) return urgent.answer;
  const menuResponse = menuAnswer(question);
  if (menuResponse) return menuResponse;
  let bestIntent = null, bestScore = 0;
  for (const intent of CHATBOT_KB.intents) {
    let score = 0;
    for (const keyword of intent.keywords) {
      const phrase = normalizeChat(keyword);
      if ((` ${normalized} `).includes(` ${phrase} `)) score += 1 + phrase.split(" ").length;
    }
    if (score > bestScore) { bestScore = score; bestIntent = intent; }
  }
  return bestIntent && bestScore >= 2 ? bestIntent.answer : CHATBOT_KB.fallback;
}
async function sendChatQuestion(question, photoFile = null) {
  let text = String(question || "").trim().slice(0, 300);
  if (!text && photoFile) text = "Mohon analisis makanan pada foto ini.";
  if (!text) return;
  const photoUrl = photoFile ? URL.createObjectURL(photoFile) : null;
  chatMessages.push({ role: "user", text, ...(photoUrl ? { photoUrl } : {}) });
  const responseMessage = { role: "assistant", text: photoFile ? "Foto diterima. Menyiapkan analisis…" : answerChat(text) };
  chatMessages.push(responseMessage);
  const removed = chatMessages.length > 24 ? chatMessages.splice(0, chatMessages.length - 24) : [];
  for (const oldMessage of removed) if (oldMessage.photoUrl) URL.revokeObjectURL(oldMessage.photoUrl);
  activePage = "consult";
  render();
  const log = document.getElementById("chatMessages");
  if (log) log.scrollTop = log.scrollHeight;

  if (photoFile) {
    const endpoint = analysisEndpoint();
    if (!endpoint) {
      responseMessage.text = "Foto sudah dipratinjau di perangkat ini, tetapi belum dianalisis atau dikirim ke mana pun karena layanan model belum terhubung. Hubungkan endpoint model independen di server Tumbuh untuk mengaktifkan analisis nutrisi.";
    } else {
      try {
        responseMessage.text = formatFoodAnalysis(await analyzeFoodPhoto(photoFile));
      } catch (error) {
        responseMessage.text = `Analisis foto belum berhasil. ${error.message} Foto tidak disimpan oleh aplikasi ini.`;
      }
    }
    setPendingFoodPhoto(null);
    render();
    const updatedLog = document.getElementById("chatMessages");
    if (updatedLog) updatedLog.scrollTop = updatedLog.scrollHeight;
  }
  document.getElementById("chatInput")?.focus();
}
function render() {
  const app = document.getElementById("app");
  app.innerHTML = activePage === "growth" ? growthPage() : activePage === "discussion" ? discussionPage() : activePage === "doctors" ? doctorPage() : activePage === "consult" ? consultPage() : homePage();
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.page === activePage));
  const accountButton = document.getElementById("accountShortcut");
  if (accountButton) accountButton.textContent = state.account?.name || "Sign in / Sign up";
  if (activePage === "consult") syncPhotoPreview();
  if (activePage === "discussion") {
    if (location.protocol === "file:") discussionStatus = "Server diskusi belum aktif";
    updateDiscussionView();
    if (location.protocol !== "file:" && !discussionTimer) {
      void loadDiscussionMessages();
      discussionTimer = setInterval(() => { void loadDiscussionMessages(); }, 5000);
    }
  } else if (discussionTimer) {
    clearInterval(discussionTimer);
    discussionTimer = null;
  }
}
function escapeHTML(value = "") { return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch])); }
function today() { return new Date().toISOString().slice(0,10); }
function formatDate(value) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
function addProfile() { setPage("growth"); setTimeout(() => document.getElementById("childName")?.focus(), 30); }
function openAccountModal(mode = "signup") {
  const modal = document.getElementById("accountModal");
  modal.hidden = false;
  setAccountMode(mode);
  document.getElementById("accountContent")?.focus();
}
function setAccountMode(mode) {
  document.querySelectorAll(".account-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.mode === mode));
  const host = document.getElementById("accountFormHost");
  if (!host) return;
  host.innerHTML = mode === "signup"
    ? `<form id="accountForm" data-mode="signup" class="account-form"><div class="field"><label for="accountName">Nama panggilan</label><input id="accountName" name="name" maxlength="40" placeholder="Contoh: Ibu Rizal" required /></div><div class="field"><label for="accountEmail">Email</label><input id="accountEmail" name="email" type="email" autocomplete="email" placeholder="nama@email.com" required /></div><button class="button full" type="submit">Buat profil</button></form>`
    : `<form id="accountForm" data-mode="signin" class="account-form"><div class="field"><label for="accountEmail">Email profil di perangkat ini</label><input id="accountEmail" name="email" type="email" autocomplete="email" placeholder="nama@email.com" required /></div><button class="button full" type="submit">Sign in</button>${state.account?.email ? `<p class="small-note">Profil tersimpan: ${escapeHTML(state.account.name)} (${escapeHTML(state.account.email)})</p>` : ""}</form>`;
}
function closeAccountModal() { document.getElementById("accountModal").hidden = true; }

document.addEventListener("click", e => {
  const nav = e.target.closest("[data-page]");
  if (nav) { setPage(nav.dataset.page); return; }
  const button = e.target.closest("[data-action]");
  if (!button) { if (e.target.id === "accountModal") closeAccountModal(); return; }
  const action = button.dataset.action;
  if (action === "growth-metric") { state.growthMetric = button.dataset.metric; persist(); render(); return; }
  if (action === "profile") { addProfile(); return; }
  if (action === "open-account") { openAccountModal(); return; }
  if (action === "account-mode") { setAccountMode(button.dataset.mode); return; }
  if (action === "close-account" || action === "continue-guest") { closeAccountModal(); return; }
  if (action === "ask-suggestion") { sendChatQuestion(button.dataset.question); return; }
  if (action === "clear-chat") { clearChat(); return; }
  if (action === "remove-photo") { setPendingFoodPhoto(null); return; }
  if (action === "refresh-discussion") { void loadDiscussionMessages(); return; }
  if (action === "specialist-filter") { activeSpecialistFilter = button.dataset.category || "Semua"; render(); return; }
  if (action === "doctor-consultation") { toast(`${button.dataset.specialty || "Spesialis"} dipilih.`); return; }
});
document.addEventListener("change", e => {
  if (["childSex", "measureDate"].includes(e.target.id)) updateGrowthReferencePreview();
  if (e.target.id === "foodPhoto") setPendingFoodPhoto(e.target.files?.[0] || null);
});
document.addEventListener("input", e => {
  if (["childAge", "weight", "height"].includes(e.target.id)) updateGrowthReferencePreview();
});
function updateGrowthReferencePreview() {
  const preview = document.getElementById("growthReferencePreview");
  if (!preview) return;
  state.previewMonths = Number(document.getElementById("childAge")?.value) || null;
  state.previewSex = document.getElementById("childSex")?.value || null;
  preview.innerHTML = growthReferencePreview(state.previewMonths, state.previewSex || state.child?.sex);
  const chartView = document.getElementById("growthChartView");
  if (chartView) chartView.innerHTML = chartHTML() + metricSummary();
}
document.addEventListener("submit", e => {
  if (e.target.matches(".discussion-reply-form")) {
    e.preventDefault();
    void submitDiscussionReply(e.target);
    return;
  }
  if (e.target.id === "accountForm") {
    e.preventDefault();
    const data = new FormData(e.target), mode = e.target.dataset.mode;
    const email = String(data.get("email") || "").trim().toLowerCase();
    if (mode === "signup") {
      const name = String(data.get("name") || "").trim();
      if (!name || !email) return;
      state.account = { name, email };
      persist(); closeAccountModal(); render(); toast("Profil tersimpan di perangkat ini.");
      return;
    }
    if (state.account?.email === email) {
      closeAccountModal(); render(); toast(`Selamat datang kembali, ${state.account.name}.`);
    } else {
      toast("Profil dengan email itu tidak ditemukan di perangkat ini. Pilih Sign up untuk membuat profil lokal.");
    }
    return;
  }
  if (e.target.id === "chatForm") {
    e.preventDefault();
    const form = new FormData(e.target);
    const file = pendingFoodPhoto;
    if (file && analysisEndpoint() && !document.getElementById("photoConsent")?.checked) {
      toast("Setujui pengiriman foto terlebih dahulu.");
      return;
    }
    if (!String(form.get("question") || "").trim() && !file) { toast("Tulis pertanyaan atau lampirkan foto."); return; }
    setPendingFoodPhoto(null);
    void sendChatQuestion(form.get("question"), file);
    return;
  }
  if (e.target.id !== "growthForm") return;
  e.preventDefault();
  const form = new FormData(e.target);
  const child = { name: String(form.get("name")).trim(), months: Number(form.get("months")), sex: String(form.get("sex")) };
  const entry = { date: String(form.get("date")), months: child.months, weight: Number(form.get("weight")), height: Number(form.get("height")) };
  if (!child.name || !child.months || !entry.weight || !entry.height || !entry.date) { toast("Lengkapi semua data terlebih dahulu."); return; }
  state.child = child;
  const oldIndex = state.history.findIndex(h => h.date === entry.date);
  if (oldIndex >= 0) state.history[oldIndex] = entry; else state.history.push(entry);
  state.history.sort((a,b) => a.date.localeCompare(b.date));
  persist(); render(); toast("Catatan pertumbuhan tersimpan di perangkat.");
});
document.getElementById("accountShortcut").addEventListener("click", () => openAccountModal(state.account ? "signin" : "signup"));
document.querySelectorAll(".nav-item").forEach(el => el.addEventListener("click", () => setPage(el.dataset.page)));
render();

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
});
document.getElementById("installApp").addEventListener("click", async () => {
  if (location.protocol === "file:") {
    toast("Untuk memasang aplikasi, buka website lewat alamat HTTPS.");
    return;
  }
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);
  toast(isAppleMobile ? "Safari: ketuk Bagikan, lalu pilih Tambahkan ke Layar Utama." : "Buka menu browser ⋮ lalu pilih Instal aplikasi atau Tambahkan ke layar utama.");
});
window.addEventListener("appinstalled", () => toast("Tumbuh berhasil dipasang di perangkat."));
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch(() => toast("Mode offline belum aktif. Buka melalui HTTPS untuk mengaktifkannya."));
}
