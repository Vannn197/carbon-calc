// BAHASA
const langBtns  = document.querySelectorAll('.lang-btn');
const btnLangId = document.getElementById('btn-lang-id');
const btnLangEn = document.getElementById('btn-lang-en');
let currentPage = 'home';

// Sinkronisasi teks <option> yang punya data-id / data-en
function syncSelectOptions(lang) {
  document.querySelectorAll('option[data-id][data-en]').forEach(opt => {
    opt.textContent = lang === 'en' ? opt.getAttribute('data-en') : opt.getAttribute('data-id');
  });
}

function setLang(lang) {
  if (currentPage === 'about' && lang === 'id') return;
  if (currentPage === 'jawa'  && lang === 'en') return;
  document.body.classList.toggle('lang-en', lang === 'en');
  langBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  localStorage.setItem('cf-lang', lang);
  syncSelectOptions(lang);
  updateLangBtnState();
}

// Kunci tombol bahasa pada halaman yang hanya tersedia satu bahasa
function updateLangBtnState() {
  if (currentPage === 'about') {
    btnLangId.disabled = true;
    btnLangId.classList.add('lang-btn-disabled');
    btnLangEn.disabled = false;
    btnLangEn.classList.remove('lang-btn-disabled');
    document.body.classList.add('lang-en');
    langBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === 'en'));
  } else if (currentPage === 'jawa') {
    btnLangEn.disabled = true;
    btnLangEn.classList.add('lang-btn-disabled');
    btnLangId.disabled = false;
    btnLangId.classList.remove('lang-btn-disabled');
    document.body.classList.remove('lang-en');
    langBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === 'id'));
  } else {
    btnLangEn.disabled = false;
    btnLangEn.classList.remove('lang-btn-disabled');
    btnLangId.disabled = false;
    btnLangId.classList.remove('lang-btn-disabled');
  }
}

langBtns.forEach(btn => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
const _initLang = localStorage.getItem('cf-lang') || 'id';
setLang(_initLang);

// NAVIGASI HALAMAN
const navLinks  = document.querySelectorAll('.nav-links a');
const pages     = document.querySelectorAll('.page');
const hamburger = document.querySelector('.hamburger');
const navMenu   = document.querySelector('.nav-links');

function showPage(pageId) {
  currentPage = pageId;
  pages.forEach(p => p.classList.toggle('active', p.id === pageId));

  // Sub-page materi tetap highlight menu Materi di navbar
  const materiSubPages = ['calculator','history','health','biography','moral','jawa','docs','aksi',
                          'docs-menu','docs-informatika','docs-matematika','docs-senibudaya','docs-pancasila'];
  const navTarget = materiSubPages.includes(pageId) ? 'materi' : pageId;
  navLinks.forEach(a => a.classList.toggle('active', a.dataset.page === navTarget));

  window.scrollTo({ top: 0, behavior: 'smooth' });
  navMenu.classList.remove('open');
  triggerReveal();

  if (pageId === 'history') initTimeline();
  if (pageId === 'aksi') setTimeout(() => initFaktorTable(), 150);
  if (pageId === 'about') {
    document.body.classList.add('lang-en');
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === 'en'));
  }
  updateLangBtnState();
}

navLinks.forEach(a => {
  a.addEventListener('click', e => { e.preventDefault(); showPage(a.dataset.page); });
});

hamburger?.addEventListener('click', () => navMenu.classList.toggle('open'));

// Delegasi klik untuk tombol data-goto dan kartu data-subpage
document.addEventListener('click', e => {
  const btn  = e.target.closest('[data-goto]');
  if (btn)  showPage(btn.dataset.goto);
  const card = e.target.closest('[data-subpage]');
  if (card) showPage(card.dataset.subpage);
});

// Keyboard support: Enter/Space untuk feature-card
document.querySelectorAll('.feature-card[data-goto]').forEach(card => {
  card.style.cursor = 'pointer';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') showPage(card.dataset.goto);
  });
});

function initMateriCards() {
  document.querySelectorAll('.feature-card[data-subpage]').forEach(card => {
    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') showPage(card.dataset.subpage);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// KALKULATOR JEJAK KARBON — 4-Step Wizard (sesuai PDF)
// ═══════════════════════════════════════════════════════════

// Faktor Emisi (kg CO2/unit)
const EMISI = {
  transportasi: {
    mobil:  0.21,   // per km
    motor:  0.11,   // per km
    umum:   0.04,   // per km
    pesawat: { pendek: 0.255 * 500, sedang: 0.255 * 1250, panjang: 0.255 * 3000 }
    // emisi per penerbangan (jarak estimasi)
  },
  energi: {
    listrik: 0.87,  // per kWh
    lpg:     2.98,  // per kg (1 tabung 3kg)
    kayu:    1.73   // per kg (tidak digunakan di slider, opsional)
  },
  makanan: {
    sapi:   27,     // per kg
    ayam:   6.9,    // per kg
    nabati: 2,      // per kg (opsional)
    susu:   3.2     // per kg (1 porsi 250ml = 0.25kg)
  },
  belanja: {
    pakaian:        25,   // per item
    elektronik:    300,   // per item
    sampahPlastik:   6    // per kg
  }
};

// Helper: ambil nilai input
function getValue(id) {
  return parseFloat(document.getElementById(id).value);
}

// Update slider labels
function bindSliderLabel(sliderId, labelId, suffix = '') {
  const slider = document.getElementById(sliderId);
  const label  = document.getElementById(labelId);
  if (slider && label) {
    const update = () => { label.innerText = slider.value + suffix; };
    slider.addEventListener('input', update);
    update();
  }
}

// Inisialisasi semua slider
function initKarbonSliders() {
  bindSliderLabel('jarakTempuh',    'jarakTempuhValue',     ' km');
  bindSliderLabel('frekuensiUmum',  'frekuensiUmumValue');
  bindSliderLabel('listrik',        'listrikValue',          ' kWh');
  bindSliderLabel('lpg',            'lpgValue');
  bindSliderLabel('penghuni',       'penghuniValue');
  bindSliderLabel('dagingSapi',     'dagingSapiValue');
  bindSliderLabel('ayam',           'ayamValue');
  bindSliderLabel('susu',           'susuValue');
  bindSliderLabel('pakaian',        'pakaianValue',          ' item');
  bindSliderLabel('elektronik',     'elektronikValue',       ' item');
  bindSliderLabel('sampah',         'sampahValue',           ' kg');
}

// Navigasi step
function initKarbonNav() {
  const stepBtns     = document.querySelectorAll('#calculator .step-btn');
  const stepContents = document.querySelectorAll('#calculator .step-content');
  const nextBtns     = document.querySelectorAll('#calculator .next-btn');
  const prevBtns     = document.querySelectorAll('#calculator .prev-btn');
  const calculateBtn = document.getElementById('calculateBtn');
  const resetBtn     = document.querySelector('#calculator .reset-btn');
  const resultsDiv   = document.getElementById('results');
  const progressFill = document.getElementById('stepProgressFill');

  function showStep(stepNumber) {
    stepContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`step${stepNumber}`)?.classList.add('active');
    stepBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.step) === stepNumber);
    });
    // Update progress bar
    if (progressFill) {
      progressFill.style.width = (stepNumber / 4 * 100) + '%';
    }
  }

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.dataset.next);
      if (nextStep) showStep(nextStep);
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = parseInt(btn.dataset.prev);
      if (prevStep) showStep(prevStep);
    });
  });

  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.step);
      showStep(step);
    });
  });

  calculateBtn?.addEventListener('click', () => {
    hitungJejakKarbon();
  });

  resetBtn?.addEventListener('click', () => {
    // Reset semua input ke nilai default
    document.getElementById('jarakTempuh').value       = 0;
    document.getElementById('frekuensiUmum').value     = 0;
    document.getElementById('frekuensiPesawat').value  = 0;
    document.getElementById('listrik').value           = 0;
    document.getElementById('lpg').value               = 0;
    document.getElementById('penghuni').value          = 1;
    document.getElementById('dagingSapi').value        = 0;
    document.getElementById('ayam').value              = 0;
    document.getElementById('susu').value              = 0;
    document.getElementById('pakaian').value           = 0;
    document.getElementById('elektronik').value        = 0;
    document.getElementById('sampah').value            = 0;
    document.getElementById('jenisKendaraan').value    = 'mobil';
    document.getElementById('jarakPenerbangan').value  = 'pendek';
    document.getElementById('polaMakan').value         = 'omnivora';

    // Refresh semua label
    const allSliders = document.querySelectorAll('#calculator input[type="range"], #calculator input[type="number"]');
    allSliders.forEach(slider => {
      slider.dispatchEvent(new Event('input'));
    });

    resultsDiv.style.display = 'none';
    showStep(1);
  });
}

// Fungsi perhitungan utama (sesuai PDF)
function hitungJejakKarbon() {
  // --- TRANSPORTASI ---
  const jarakHarian = getValue('jarakTempuh');
  const jenis = document.getElementById('jenisKendaraan').value;
  let emisiPerKm = jenis === 'mobil' ? EMISI.transportasi.mobil : EMISI.transportasi.motor;
  let co2KendaraanPribadiTahunan = jarakHarian * emisiPerKm * 365;

  const frekUmumHariPerMinggu = getValue('frekuensiUmum');
  // Asumsi rata2 jarak sekali naik transport umum = 10 km
  const jarakUmumPerHari = 10;
  let co2UmumTahunan = frekUmumHariPerMinggu * jarakUmumPerHari *
    EMISI.transportasi.umum * 52;

  const frekPesawatTahun = getValue('frekuensiPesawat');
  const jarakPesawatType = document.getElementById('jarakPenerbangan').value;
  let emisiPerPenerbangan = 0;
  if (jarakPesawatType === 'pendek') emisiPerPenerbangan = EMISI.transportasi.pesawat.pendek;
  else if (jarakPesawatType === 'sedang') emisiPerPenerbangan = EMISI.transportasi.pesawat.sedang;
  else emisiPerPenerbangan = EMISI.transportasi.pesawat.panjang;
  let co2PesawatTahunan = frekPesawatTahun * emisiPerPenerbangan;

  let totalTransportasi = co2KendaraanPribadiTahunan + co2UmumTahunan + co2PesawatTahunan;

  // --- ENERGI RUMAH ---
  let listrikBulananKwh = getValue('listrik');
  let co2ListrikTahunan = listrikBulananKwh * EMISI.energi.listrik * 12;

  let lpgTabungPerBulan = getValue('lpg');
  // 1 tabung = 3 kg LPG
  let co2LpgTahunan = lpgTabungPerBulan * 3 * EMISI.energi.lpg * 12;

  let jumlahPenghuni = getValue('penghuni');
  // Bagi emisi energi per orang karena dihitung per individu (default share)
  let totalEnergiPerOrang = (co2ListrikTahunan + co2LpgTahunan) / jumlahPenghuni;

  // --- MAKANAN ---
  // Konversi porsi ke kg: 1 porsi daging = 200g = 0.2kg, 1 porsi susu = 250ml = 0.25kg
  let porsiSapiMinggu = getValue('dagingSapi');
  let kgSapiTahun     = porsiSapiMinggu * 0.2 * 52;
  let co2Sapi         = kgSapiTahun * EMISI.makanan.sapi;

  let porsiAyamMinggu = getValue('ayam');
  let kgAyamTahun     = porsiAyamMinggu * 0.2 * 52;
  let co2Ayam         = kgAyamTahun * EMISI.makanan.ayam;

  let porsiSusuHari = getValue('susu');
  let kgSusuTahun   = porsiSusuHari * 0.25 * 365;
  let co2Susu       = kgSusuTahun * EMISI.makanan.susu;

  // Makanan nabati diasumsikan 2kg CO2/kg,
  // asumsi konsumsi dasar sayur/buah = 1kg/hari (2kg CO2/hari)
  // Fokus ke 3 input (sapi, ayam, susu) sudah mewakili makanan utama.
  let totalMakanan = co2Sapi + co2Ayam + co2Susu;

  // --- BELANJA ---
  let pakaianPerTahun   = getValue('pakaian');
  let co2Pakaian        = pakaianPerTahun * EMISI.belanja.pakaian;

  let elektronikPerTahun = getValue('elektronik');
  let co2Elektronik      = elektronikPerTahun * EMISI.belanja.elektronik;

  let sampahMingguKg      = getValue('sampah');
  let co2SampahTahunan    = sampahMingguKg * EMISI.belanja.sampahPlastik * 52;

  let totalBelanja = co2Pakaian + co2Elektronik + co2SampahTahunan;

  // GRAND TOTAL
  let grandTotal = totalTransportasi + totalEnergiPerOrang + totalMakanan + totalBelanja;

  // Update DOM
  const isEN = document.body.classList.contains('lang-en');
  const perYear = isEN ? 'year' : 'tahun';
  document.getElementById('co2Transport').innerText = Math.round(totalTransportasi).toLocaleString() + ' kg CO₂/' + perYear;
  document.getElementById('co2Energi').innerText    = Math.round(totalEnergiPerOrang).toLocaleString() + ' kg CO₂/' + perYear;
  document.getElementById('co2Makanan').innerText   = Math.round(totalMakanan).toLocaleString() + ' kg CO₂/' + perYear;
  document.getElementById('co2Belanja').innerText   = Math.round(totalBelanja).toLocaleString() + ' kg CO₂/' + perYear;
  document.getElementById('totalCO2').innerText     = Math.round(grandTotal).toLocaleString();

  // Level dan perbandingan
  let levelText = '';
  let levelClass = '';
  if (grandTotal < 3000) {
    levelText = isEN ? 'Low (Low Emissions)' : 'Rendah (Emisi rendah)';
    levelClass = 'level-rendah';
  } else if (grandTotal >= 3000 && grandTotal < 7500) {
    levelText = isEN ? 'Moderate' : 'Sedang';
    levelClass = 'level-sedang';
  } else if (grandTotal >= 7500 && grandTotal <= 12000) {
    levelText = isEN ? 'High' : 'Tinggi';
    levelClass = 'level-tinggi';
  } else {
    levelText = isEN ? 'Very High' : 'Sangat Tinggi';
    levelClass = 'level-sangat-tinggi';
  }

  const levelDiv = document.getElementById('levelIndicator');
  levelDiv.innerHTML = `<span class="${levelClass}">Level: ${levelText}</span>`;

  const rataIndonesia = 7500;
  const rataGlobal    = 4000;

  if (isEN) {
    const bandingIndo = grandTotal > rataIndonesia
      ? `${Math.round((grandTotal / rataIndonesia - 1) * 100)}% higher`
      : `${Math.round((1 - grandTotal / rataIndonesia) * 100)}% lower`;
    const bandingGlobal = grandTotal > rataGlobal
      ? `${Math.round((grandTotal / rataGlobal - 1) * 100)}% higher`
      : `${Math.round((1 - grandTotal / rataGlobal) * 100)}% lower`;
    document.getElementById('comparison').innerHTML = `
      <p>Comparison: Indonesian average (7,500 kg/year): ${bandingIndo}</p>
      <p>Global average (4,000 kg/year): ${bandingGlobal}</p>
    `;
  } else {
    const bandingIndo = grandTotal > rataIndonesia
      ? `${Math.round((grandTotal / rataIndonesia - 1) * 100)}% lebih tinggi`
      : `${Math.round((1 - grandTotal / rataIndonesia) * 100)}% lebih rendah`;
    const bandingGlobal = grandTotal > rataGlobal
      ? `${Math.round((grandTotal / rataGlobal - 1) * 100)}% lebih tinggi`
      : `${Math.round((1 - grandTotal / rataGlobal) * 100)}% lebih rendah`;
    document.getElementById('comparison').innerHTML = `
      <p>Perbandingan: Rata-rata Indonesia (rerata 7.500 kg/tahun): ${bandingIndo}</p>
      <p>Rata-rata Global (rerata 4.000 kg/tahun): ${bandingGlobal}</p>
    `;
  }

  // Tampilkan hasil dan sembunyikan step
  document.querySelectorAll('#calculator .step-content').forEach(el => el.classList.remove('active'));
  document.getElementById('results').style.display = 'block';
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// TIMELINE SEJARAH — IntersectionObserver, animasi berulang
function initTimeline() {
  const items = document.querySelectorAll('.timeline-item');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const el = e.target;
      if (e.isIntersecting) {
        if (el.dataset.animating === '1') return;
        el.dataset.animating = '1';
        el.classList.remove('visible');
        void el.offsetWidth; // paksa reflow agar animasi restart
        el.classList.add('visible');
        const dur = parseFloat(getComputedStyle(el).animationDuration || '0') * 1000 || 650;
        clearTimeout(el._timelineTimer);
        el._timelineTimer = setTimeout(() => { el.dataset.animating = '0'; }, dur + 50);
      } else {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > window.innerHeight + 100) {
          el.classList.remove('visible');
          el.dataset.animating = '0';
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  items.forEach(item => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      item.classList.add('visible');
      item.dataset.animating = '0';
    }
    obs.observe(item);
  });
}

// SCROLL REVEAL — animasi berulang setiap masuk viewport
let revealObserver = null;
function triggerReveal() {
  setTimeout(() => {
    if (revealObserver) revealObserver.disconnect();
    const reveals = document.querySelectorAll('.reveal');

    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const el = e.target;
        if (e.isIntersecting) {
          if (el.dataset.animating === '1') return;
          el.dataset.animating = '1';
          el.classList.remove('visible');
          void el.offsetWidth; // paksa reflow agar animasi restart
          el.classList.add('visible');
          const duration = parseFloat(getComputedStyle(el).animationDuration || '0') * 1000 || 700;
          clearTimeout(el._revealTimer);
          el._revealTimer = setTimeout(() => { el.dataset.animating = '0'; }, duration + 50);
        } else {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < -100 || rect.top > window.innerHeight + 100) {
            el.classList.remove('visible');
            el.dataset.animating = '0';
          }
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(r => {
      const rect = r.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        r.classList.add('visible');
        r.dataset.animating = '0';
      }
      revealObserver.observe(r);
    });
  }, 80);
}

// Animasi angka (dipertahankan untuk keperluan lain)
function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function step(ts) {
    const progress = Math.min((ts - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = (from + (to - from) * eased).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = to.toLocaleString('id-ID');
  }
  requestAnimationFrame(step);
}

// INISIALISASI DOM
document.addEventListener('DOMContentLoaded', () => {
  showPage('home');
  triggerReveal();
  initMateriCards();
  initKontakForm();
  initFaktorTable();
  initKarbonSliders();
  initKarbonNav();
});

// KONTAK GURU — sinkronisasi placeholder bilingual
function initKontakForm() {
  function syncPlaceholders() {
    const isEN = document.body.classList.contains('lang-en');
    document.querySelectorAll('[placeholder-id]').forEach(el => {
      el.placeholder = isEN ? el.getAttribute('placeholder-en') : el.getAttribute('placeholder-id');
    });
  }
  syncPlaceholders();
  new MutationObserver(syncPlaceholders).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

// HALAMAN AKSI — Tab Navigation
document.addEventListener('click', function(e) {
  const tabBtn = e.target.closest('.aksi-tab-btn');
  if (!tabBtn) return;
  const tabId = tabBtn.dataset.tab;
  if (!tabId) return;

  document.querySelectorAll('.aksi-tab-btn').forEach(b => b.classList.remove('active'));
  tabBtn.classList.add('active');
  document.querySelectorAll('.aksi-tab-content').forEach(c => c.classList.remove('active'));

  const target = document.getElementById(tabId);
  if (target) {
    target.classList.add('active');
    triggerReveal();
    if (tabId === 'tab-grafik') { initCO2EmisiChart(); initTempChart2(); }
  }
});

// TAB 1: FAKTOR EMISI — Search + Filter
function initFaktorTable() {
  const searchInput = document.getElementById('faktorSearch');
  const filterBtns  = document.querySelectorAll('.faktor-filter-btn');
  let activeFilter  = 'all';
  let searchTerm    = '';

  function applyFilters() {
    const rows = document.querySelectorAll('#faktorTbody tr');
    let visible = 0;
    rows.forEach(row => {
      const cat   = row.dataset.category || '';
      const isEN2 = document.body.classList.contains('lang-en');
      // Bangun teks yang terlihat dengan mengecualikan span bahasa lain
      const allSpans = row.querySelectorAll('[lang]');
      let visibleText = row.textContent;
      allSpans.forEach(sp => {
        const spLang = sp.getAttribute('lang');
        if ((isEN2 && spLang === 'id') || (!isEN2 && spLang === 'en')) {
          visibleText = visibleText.replace(sp.textContent, '');
        }
      });
      const text   = visibleText.toLowerCase();
      const matchF = activeFilter === 'all' || cat === activeFilter;
      const matchS = !searchTerm || text.includes(searchTerm);
      row.style.display = matchF && matchS ? '' : 'none';
      if (matchF && matchS) visible++;
    });
    const noResult = document.getElementById('faktorNoResult');
    if (noResult) noResult.style.display = visible === 0 ? 'block' : 'none';
  }

  searchInput?.addEventListener('input', e => {
    searchTerm = e.target.value.trim().toLowerCase();
    applyFilters();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });
}

// TAB 4: GRAFIK SUHU — Canvas interaktif dengan tooltip
let chartInitialized = false;
function initTempChart() {
  if (chartInitialized) return;
  chartInitialized = true;

  const canvas  = document.getElementById('tempCanvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const tooltip = document.getElementById('chartTooltip');

  const years = [2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
  const temps = [0.92, 0.83, 0.98, 1.02, 0.85, 1.02, 1.17, 1.22, 1.29, 1.35];
  const W = canvas.width, H = canvas.height;
  const padL=65, padR=30, padT=35, padB=55;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const minT = 0.5, maxT = 1.5;

  function xFor(i) { return padL + (i / (years.length-1)) * chartW; }
  function yFor(t) { return padT + chartH - ((t - minT) / (maxT - minT)) * chartH; }

  function draw() {
    ctx.clearRect(0,0,W,H);

    // Grid
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    for (let t = 0.5; t <= 1.5; t += 0.2) {
      const y = yFor(t);
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+chartW,y); ctx.stroke();
      ctx.fillStyle = '#9ca3af'; ctx.font = '11px sans-serif'; ctx.textAlign='right';
      ctx.fillText('+' + t.toFixed(1) + '°C', padL-6, y+4);
    }

    // Garis target Paris 1.5°C
    const yParis = yFor(1.5);
    ctx.setLineDash([6,4]); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL,yParis); ctx.lineTo(padL+chartW,yParis); ctx.stroke();
    ctx.setLineDash([]);

    // Area gradient
    ctx.beginPath();
    ctx.moveTo(xFor(0), yFor(0));
    temps.forEach((t,i) => ctx.lineTo(xFor(i), yFor(t)));
    ctx.lineTo(xFor(years.length-1), H-padB);
    ctx.lineTo(padL, H-padB);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0,padT,0,H-padB);
    grad.addColorStop(0,'rgba(224,82,82,.35)');
    grad.addColorStop(1,'rgba(224,82,82,.03)');
    ctx.fillStyle = grad; ctx.fill();

    // Garis data
    ctx.beginPath();
    ctx.strokeStyle = '#e05252'; ctx.lineWidth = 2.5;
    temps.forEach((t,i) => i===0 ? ctx.moveTo(xFor(i),yFor(t)) : ctx.lineTo(xFor(i),yFor(t)));
    ctx.stroke();

    // Titik data
    temps.forEach((t,i) => {
      ctx.beginPath();
      ctx.arc(xFor(i), yFor(t), 5, 0, Math.PI*2);
      ctx.fillStyle = t >= 1.0 ? '#e05252' : '#f87171';
      ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    });

    // Label sumbu X
    ctx.fillStyle = '#6b7280'; ctx.font = '11px sans-serif'; ctx.textAlign='center';
    years.forEach((y,i) => ctx.fillText(y, xFor(i), H-padB+18));
  }

  draw();

  // Tooltip hover
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (W / rect.width);
    let closest = 0, minDist = Infinity;
    years.forEach((_, i) => {
      const d = Math.abs(mx - xFor(i));
      if (d < minDist) { minDist = d; closest = i; }
    });
    if (minDist < 30) {
      const px = xFor(closest) * (rect.width/W);
      const py = yFor(temps[closest]) * (rect.height/H);
      tooltip.style.left = (px + 8) + 'px';
      tooltip.style.top  = (py - 30) + 'px';
      tooltip.textContent = years[closest] + ': +' + temps[closest].toFixed(2) + '°C';
      tooltip.style.opacity = '1';
    } else {
      tooltip.style.opacity = '0';
    }
  });
  canvas.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
}

// TAB 5: KALKULATOR POHON
document.getElementById('btnHitungPohon')?.addEventListener('click', () => {
  const val          = parseFloat(document.getElementById('pohonInput')?.value) || 0;
  const emisiTahunan = val * 365;
  const pohon        = Math.ceil(emisiTahunan / 22);
  const isEN         = document.body.classList.contains('lang-en');
  const res          = document.getElementById('pohonResult');
  const numEl        = document.getElementById('pohonNum');
  const descEl       = document.getElementById('pohonDesc');
  if (res)    res.style.display = 'block';
  if (numEl)  numEl.textContent = pohon.toLocaleString('id-ID');
  if (descEl) descEl.textContent = isEN
    ? `Based on daily emissions of ${val} kg CO₂, you need ${pohon} trees to absorb ${emisiTahunan.toFixed(0)} kg CO₂/year.`
    : `Berdasarkan emisi harian ${val} kg CO₂, dibutuhkan ${pohon} pohon untuk menyerap ${emisiTahunan.toFixed(0)} kg CO₂/tahun.`;
});

// TAB 5: CHALLENGE HEMAT ENERGI
const hematValues      = { hc1:0.18, hc2:0.08, hc3:0.34, hc4:0.25, hc5:0.42 };
const hematChecked     = {};
const maxHematTotal    = 0.18 + 0.08 + 0.34 + 0.25 + 0.42; // 1.27 kg CO₂/hari

function updateHematChart() {
  const barIds = { hc1:'hcb1', hc2:'hcb2', hc3:'hcb3', hc4:'hcb4', hc5:'hcb5' };
  const valIds = { hc1:'hcv1', hc2:'hcv2', hc3:'hcv3', hc4:'hcv4', hc5:'hcv5' };
  let total = 0;
  Object.keys(hematValues).forEach(k => {
    const val = hematChecked[k] ? hematValues[k] : 0;
    if (hematChecked[k]) total += hematValues[k];
    const bar   = document.getElementById(barIds[k]);
    const valEl = document.getElementById(valIds[k]);
    if (bar)   bar.style.height   = ((val / maxHematTotal) * 100) + '%';
    if (valEl) valEl.textContent  = val > 0 ? val.toFixed(2).replace('.', ',') : '0';
  });
  const totalBar = document.getElementById('hcbTotal');
  const totalVal = document.getElementById('hcvTotal');
  if (totalBar) totalBar.style.height  = ((total / maxHematTotal) * 100) + '%';
  if (totalVal) totalVal.textContent   = total > 0 ? total.toFixed(2).replace('.', ',') : '0';
}

function toggleChallenge(id) {
  hematChecked[id] = !hematChecked[id];
  const cb   = document.getElementById(id + '-cb');
  const item = document.getElementById(id);
  if (cb)   cb.textContent = hematChecked[id] ? '☑' : '☐';
  if (item) item.classList.toggle('checked', !!hematChecked[id]);
  let total = 0;
  Object.keys(hematChecked).forEach(k => { if (hematChecked[k]) total += hematValues[k] || 0; });
  const el = document.getElementById('hematTotalVal');
  if (el) el.textContent = total.toFixed(2).replace('.', ',') + ' kg CO₂/hari';
  updateHematChart();
}

// TAB 5: FORM PENDAFTARAN RELAWAN
document.getElementById('btnDaftarRelawan')?.addEventListener('click', () => {
  const inputs   = document.querySelectorAll('.relawan-input');
  let ok         = true;
  inputs.forEach(i => { if (!i.value.trim()) ok = false; });
  const successEl = document.getElementById('relawanSuccess');
  if (!successEl) return;

  if (ok) {
    successEl.style.display     = 'block';
    successEl.style.background  = '';
    successEl.style.borderColor = '';
    successEl.style.color       = '';
    inputs.forEach(i => i.value = '');
    setTimeout(() => { successEl.style.display = 'none'; }, 5000);
  } else {
    const isEN = document.body.classList.contains('lang-en');
    successEl.textContent      = isEN ? '⚠️ Please fill in all fields first.' : '⚠️ Harap isi semua kolom terlebih dahulu.';
    successEl.style.display    = 'block';
    successEl.style.background = '#fff3cd';
    successEl.style.borderColor = '#fbbf24';
    successEl.style.color      = '#92400e';
    setTimeout(() => {
      successEl.style.display     = 'none';
      successEl.style.background  = '';
      successEl.style.borderColor = '';
      successEl.style.color       = '';
    }, 3500);
  }
});

// TAB GRAFIK: EMISI CO₂ GLOBAL
let co2EmisiChartInit = false;
function initCO2EmisiChart() {
  if (co2EmisiChartInit) return;
  co2EmisiChartInit = true;

  const canvas = document.getElementById('co2EmisiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const years = [2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
  const emisi = [36.2, 36.8, 37.0, 34.2, 36.4, 36.8, 37.4, 37.8, 38.1, 38.3];
  const W = canvas.width, H = canvas.height;
  const padL=80, padR=20, padT=35, padB=55;
  const innerOffX = 30;
  const chartW = W - padL - padR - innerOffX*2;
  const chartH = H - padT - padB;
  const minV = 32, maxV = 39;

  function xFor(i) { return padL + innerOffX + (i / (years.length-1)) * chartW; }
  function yFor(v) { return padT + chartH - ((v - minV) / (maxV - minV)) * chartH; }

  ctx.clearRect(0,0,W,H);

  // Grid lines + Y-axis labels
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
  for (let v = 32; v <= 39; v += 1) {
    const y = yFor(v);
    ctx.beginPath(); ctx.moveTo(padL + innerOffX, y); ctx.lineTo(padL + innerOffX + chartW, y); ctx.stroke();
    ctx.fillStyle = '#6b7280'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign='right';
    ctx.fillText(v + ' Gt', padL + innerOffX - 8, y + 4);
  }

  // Left axis vertical line
  ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL + innerOffX, padT);
  ctx.lineTo(padL + innerOffX, padT + chartH);
  ctx.stroke();

  // === Clip to chart area so bars/gradients never overlap the label zone ===
  ctx.save();
  ctx.beginPath();
  ctx.rect(padL + innerOffX, padT, chartW, chartH);
  ctx.clip();

  // Garis tren linear (dashed)
  const n = years.length;
  const sumX  = years.reduce((a,b)=>a+b,0), sumY = emisi.reduce((a,b)=>a+b,0);
  const sumXY = years.reduce((s,x,i)=>s+x*emisi[i],0), sumX2 = years.reduce((s,x)=>s+x*x,0);
  const slope     = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
  const intercept = (sumY - slope*sumX) / n;
  ctx.setLineDash([6,4]); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xFor(0),   yFor(slope*years[0]   + intercept));
  ctx.lineTo(xFor(n-1), yFor(slope*years[n-1] + intercept));
  ctx.stroke();
  ctx.setLineDash([]);

  // Area gradient
  ctx.beginPath();
  ctx.moveTo(xFor(0), H-padB);
  emisi.forEach((v,i) => ctx.lineTo(xFor(i), yFor(v)));
  ctx.lineTo(xFor(n-1), H-padB);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0,padT,0,H-padB);
  grad.addColorStop(0,'rgba(239,68,68,.4)');
  grad.addColorStop(1,'rgba(239,68,68,.04)');
  ctx.fillStyle = grad; ctx.fill();

  // Bar per tahun (2020 biru = dampak COVID)
  const barW = (chartW / n) * 0.55;
  emisi.forEach((v, i) => {
    const x    = xFor(i) - barW/2;
    const barH = yFor(minV) - yFor(v);
    const y    = yFor(v);
    ctx.fillStyle = i === 3 ? '#60a5fa' : (v >= 37 ? '#dc2626' : '#ef4444');
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4,4,0,0]);
    ctx.fill();
  });

  // Garis di atas bar
  ctx.beginPath();
  ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2;
  emisi.forEach((v,i) => i===0 ? ctx.moveTo(xFor(i),yFor(v)) : ctx.lineTo(xFor(i),yFor(v)));
  ctx.stroke();

  // Titik data
  emisi.forEach((v,i) => {
    ctx.beginPath();
    ctx.arc(xFor(i), yFor(v), 5, 0, Math.PI*2);
    ctx.fillStyle = i===3 ? '#60a5fa' : (v>=37 ? '#dc2626' : '#ef4444');
    ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
  });

  ctx.restore(); // remove clip

  // Label sumbu X (outside clip so they always show)
  ctx.fillStyle = '#6b7280'; ctx.font = '11px sans-serif'; ctx.textAlign='center';
  years.forEach((y,i) => ctx.fillText(y, xFor(i), H-padB+18));

  // Anotasi COVID-19
  ctx.fillStyle = '#2563eb'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign='center';
  ctx.fillText('COVID-19', xFor(3), yFor(emisi[3])-14);

  // Re-draw Y-axis labels on top (over any possible bleed)
  for (let v = 32; v <= 39; v += 1) {
    const y = yFor(v);
    ctx.fillStyle = '#6b7280'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign='right';
    ctx.fillText(v + ' Gt', padL + innerOffX - 8, y + 4);
  }
}

// TAB GRAFIK: GRAFIK SUHU (instance kedua untuk tab-grafik)
let tempChart2Init = false;
function initTempChart2() {
  if (tempChart2Init) return;
  tempChart2Init = true;

  const canvas  = document.getElementById('suhuCanvas2');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const tooltip = document.getElementById('chartTooltip2');

  const years = [2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
  const temps = [0.92, 0.83, 0.98, 1.02, 0.85, 1.02, 1.17, 1.22, 1.29, 1.35];
  const W = canvas.width, H = canvas.height;
  const padL=65, padR=30, padT=35, padB=55;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const minT = 0.5, maxT = 1.5;

  function xFor(i) { return padL + (i / (years.length-1)) * chartW; }
  function yFor(t) { return padT + chartH - ((t - minT) / (maxT - minT)) * chartH; }

  function draw() {
    ctx.clearRect(0,0,W,H);

    // Grid
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    for (let t = 0.5; t <= 1.5; t += 0.2) {
      const y = yFor(t);
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+chartW,y); ctx.stroke();
      ctx.fillStyle = '#9ca3af'; ctx.font = '11px sans-serif'; ctx.textAlign='right';
      ctx.fillText('+' + t.toFixed(1) + '°C', padL-6, y+4);
    }

    // Garis target Paris 1.5°C
    const yParis = yFor(1.5);
    ctx.setLineDash([6,4]); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL,yParis); ctx.lineTo(padL+chartW,yParis); ctx.stroke();
    ctx.setLineDash([]);

    // Area gradient
    ctx.beginPath();
    ctx.moveTo(xFor(0), yFor(0));
    temps.forEach((t,i) => ctx.lineTo(xFor(i), yFor(t)));
    ctx.lineTo(xFor(years.length-1), H-padB);
    ctx.lineTo(padL, H-padB);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0,padT,0,H-padB);
    grad.addColorStop(0,'rgba(224,82,82,.35)');
    grad.addColorStop(1,'rgba(224,82,82,.03)');
    ctx.fillStyle = grad; ctx.fill();

    // Garis data
    ctx.beginPath();
    ctx.strokeStyle = '#e05252'; ctx.lineWidth = 2.5;
    temps.forEach((t,i) => i===0 ? ctx.moveTo(xFor(i),yFor(t)) : ctx.lineTo(xFor(i),yFor(t)));
    ctx.stroke();

    // Titik data
    temps.forEach((t,i) => {
      ctx.beginPath();
      ctx.arc(xFor(i), yFor(t), 5, 0, Math.PI*2);
      ctx.fillStyle = t >= 1.0 ? '#e05252' : '#f87171';
      ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    });

    // Label sumbu X
    ctx.fillStyle = '#6b7280'; ctx.font = '11px sans-serif'; ctx.textAlign='center';
    years.forEach((y,i) => ctx.fillText(y, xFor(i), H-padB+18));
  }

  draw();

  if (tooltip) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx   = (e.clientX - rect.left) * (W / rect.width);
      let closest = 0, minDist = Infinity;
      years.forEach((_,i) => {
        const d = Math.abs(mx - xFor(i));
        if (d < minDist) { minDist = d; closest = i; }
      });
      if (minDist < 30) {
        const px = xFor(closest) * (rect.width/W);
        const py = yFor(temps[closest]) * (rect.height/H);
        tooltip.style.left = (px + 8) + 'px';
        tooltip.style.top  = (py - 30) + 'px';
        tooltip.textContent = years[closest] + ': +' + temps[closest].toFixed(2) + '°C';
        tooltip.style.opacity = '1';
      } else {
        tooltip.style.opacity = '0';
      }
    });
    canvas.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
  }
}

// DOKUMENTASI FOTO — Upload & Preview
function triggerUpload(num) {
  const input = document.getElementById('file-input-' + num);
  if (input) input.click();
}

function previewFoto(event, num) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img         = document.getElementById('foto-img-' + num);
    const placeholder = img ? img.closest('.docs-foto-placeholder') : null;
    if (!img || !placeholder) return;

    img.src            = e.target.result;
    img.style.display  = 'block';

    // Sembunyikan elemen placeholder
    placeholder.querySelectorAll(
      '.docs-foto-placeholder-icon, .docs-foto-placeholder-res, .docs-foto-placeholder-hint, .docs-foto-upload-btn'
    ).forEach(el => el.style.display = 'none');

    // Tambah tombol ganti foto (buat sekali, gunakan lagi jika sudah ada)
    let changeBtn = placeholder.querySelector('.docs-foto-change-btn');
    if (!changeBtn) {
      changeBtn = document.createElement('div');
      changeBtn.className = 'docs-foto-change-btn';
      changeBtn.innerHTML = '<span lang="id">🔄 Ganti Foto</span><span lang="en">🔄 Change Photo</span>';
      changeBtn.style.cssText =
        'position:absolute;bottom:.6rem;right:.6rem;background:rgba(13,59,46,.82);' +
        'color:#fff;padding:.28rem .72rem;border-radius:20px;font-size:.75rem;' +
        'font-weight:600;cursor:pointer;z-index:3;backdrop-filter:blur(4px);transition:opacity .2s;';
      changeBtn.onmouseenter = () => changeBtn.style.opacity = '.75';
      changeBtn.onmouseleave = () => changeBtn.style.opacity = '1';
      changeBtn.onclick      = () => triggerUpload(num);
      placeholder.appendChild(changeBtn);
    }

    // Tampilkan teks tombol sesuai bahasa aktif
    const activeLang = document.documentElement.lang || 'id';
    changeBtn.querySelectorAll('[lang]').forEach(el => {
      el.style.display = el.getAttribute('lang') === activeLang ? 'inline' : 'none';
    });
  };
  reader.readAsDataURL(file);
  event.target.value = ''; // reset agar file yang sama bisa diunggah ulang
}

// WIREFRAME LIGHTBOX — Seni Budaya
document.addEventListener('DOMContentLoaded', function () {
  const lb         = document.getElementById('wireframeLightbox');
  const lbImg      = document.getElementById('lightboxImg');
  const lbCaption  = document.getElementById('lightboxCaption');
  const lbCloseBtn = document.getElementById('lightboxCloseBtn');
  if (!lb) return;

  function closeLightbox() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  document.querySelectorAll('.wireframe-img-wrap').forEach(function (wrap) {
    wrap.addEventListener('click', function () {
      const img  = wrap.querySelector('.wireframe-img');
      const info = wrap.closest('.wireframe-item').querySelector('.wireframe-title');
      lbImg.src  = img ? img.src : '';
      lbImg.alt  = img ? img.alt : '';
      const lang    = document.body.classList.contains('lang-en') ? 'en' : 'id';
      const titleEl = info ? info.querySelector('[lang="' + lang + '"]') : null;
      lbCaption.textContent = titleEl ? titleEl.textContent : (info ? info.textContent.trim() : '');
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  if (lbCloseBtn) lbCloseBtn.addEventListener('click', function(e) { e.stopPropagation(); closeLightbox(); });
  lb.addEventListener('click', function(e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && lb.classList.contains('active')) closeLightbox(); });
  if (lbImg) lbImg.addEventListener('click', function(e) { e.stopPropagation(); });
});

// FOTO PROFIL ANGGOTA — Upload & Preview
function triggerProfilUpload(num) {
  const input = document.getElementById('profil-file-' + num);
  if (input) input.click();
}

function previewProfilFoto(event, num) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img         = document.getElementById('profil-img-' + num);
    const avatar      = img ? img.closest('.profil-avatar') : null;
    const placeholder = avatar ? avatar.querySelector('.profil-avatar-placeholder') : null;
    if (!img || !avatar) return;

    img.src            = e.target.result;
    img.style.display  = 'block';
    if (placeholder) placeholder.style.display = 'none';

    const overlay = avatar.querySelector('.profil-avatar-overlay');
    if (overlay) overlay.textContent = '📷 Ganti';
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

// SCROLL PROGRESS BAR
(function initScrollProgress() {
  const bar = document.getElementById('scrollProgressBar');
  if (!bar) return;
  function updateBar() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();
})();

// SCROLL TO TOP BUTTON
(function initScrollTopBtn() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ═══ SLIDER FILL EFFECT — update background gradient as value changes ═══
(function initSliderFills() {
  function updateFill(slider) {
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.background =
      `linear-gradient(to right, #2e8b57 ${pct}%, #d8f3dc ${pct}%)`;
  }

  function attachFill(slider) {
    updateFill(slider);
    slider.addEventListener('input', () => updateFill(slider));
  }

  // Attach on DOMContentLoaded and also re-attach when page shown
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[type="range"]').forEach(attachFill);
  });
})();

// ═══════════════════════════════════════════════════════════
// MATH CALC — Kalkulator Emisi BBM & Listrik (Halaman Matematika)
// f(x, y) = 2.3x + 0.85y
// ═══════════════════════════════════════════════════════════
(function initMathCalc() {
  function setup() {
    const sliderBbm     = document.getElementById('mathBbm');
    const numBbm        = document.getElementById('mathBbmNum');
    const sliderListrik = document.getElementById('mathListrik');
    const numListrik    = document.getElementById('mathListrikNum');
    const resetBtn      = document.getElementById('mathCalcReset');
    if (!sliderBbm || !sliderListrik) return;

    // Sync slider ↔ number box
    function syncPair(slider, numBox) {
      slider.addEventListener('input', () => { numBox.value = slider.value; updateMathCalc(); updateSliderFillMath(slider); });
      numBox.addEventListener('input', () => {
        let v = parseFloat(numBox.value);
        if (isNaN(v) || v < 0) v = 0;
        if (v > parseFloat(slider.max)) v = parseFloat(slider.max);
        slider.value = v;
        numBox.value = v;
        updateMathCalc();
        updateSliderFillMath(slider);
      });
    }
    syncPair(sliderBbm, numBbm);
    syncPair(sliderListrik, numListrik);

    // Slider fill colour
    function updateSliderFillMath(slider) {
      const min = parseFloat(slider.min) || 0;
      const max = parseFloat(slider.max) || 100;
      const val = parseFloat(slider.value) || 0;
      const pct = ((val - min) / (max - min)) * 100;
      const isY = slider.id === 'mathListrik';
      const colour = isY ? '#e8a838' : '#2e8b57';
      const track  = isY ? '#fde68a40' : '#d8f3dc';
      slider.style.background =
        `linear-gradient(to right, ${colour} ${pct}%, ${track} ${pct}%)`;
    }
    updateSliderFillMath(sliderBbm);
    updateSliderFillMath(sliderListrik);

    // Main calculate
    function updateMathCalc() {
      const x = parseFloat(sliderBbm.value)     || 0;
      const y = parseFloat(sliderListrik.value)  || 0;

      const emBbm     = x * 2.3;
      const emListrik = y * 0.85;
      const total     = emBbm + emListrik;

      // Format helpers
      const fmt  = n => n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtEn = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Partial results
      const pb = document.getElementById('mathPartialBbm');
      const pl = document.getElementById('mathPartialListrik');
      if (pb) pb.textContent = fmt(emBbm) + ' kg CO₂';
      if (pl) pl.textContent = fmt(emListrik) + ' kg CO₂';

      // Step rows (ID)
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('mathBbmVal',       x);
      set('mathBbmResult',    fmt(emBbm));
      set('mathListrikVal',   y);
      set('mathListrikResult', fmt(emListrik));
      set('mathBbmR2',        fmt(emBbm));
      set('mathListrikR2',    fmt(emListrik));
      set('mathTotal',        fmt(total));
      // Step rows (EN)
      set('mathBbmValEn',        x);
      set('mathBbmResultEn',     fmtEn(emBbm));
      set('mathListrikValEn',    y);
      set('mathListrikResultEn', fmtEn(emListrik));
      set('mathBbmR2En',         fmtEn(emBbm));
      set('mathListrikR2En',     fmtEn(emListrik));
      set('mathTotalEn',         fmtEn(total));

      // Result panel
      set('mathXdisp', x);   set('mathX2', x);
      set('mathYdisp', y);   set('mathY2', y);

      const panelTotal = document.getElementById('mathResultTotal');
      if (panelTotal) panelTotal.textContent = fmt(total);

      const badge = document.getElementById('mathResultBadge');
      if (badge) {
        if (total === 0) {
          badge.className = 'math-calc-result-badge';
          badge.textContent = '';
        } else if (total < 15) {
          badge.className = 'math-calc-result-badge math-badge-low';
          badge.textContent = '🌿 Rendah / Low';
        } else if (total < 35) {
          badge.className = 'math-calc-result-badge math-badge-mid';
          badge.textContent = '⚡ Sedang / Medium';
        } else {
          badge.className = 'math-calc-result-badge math-badge-high';
          badge.textContent = '🔴 Tinggi / High';
        }
      }
    }

    // Reset
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sliderBbm.value     = 0; numBbm.value     = 0;
        sliderListrik.value = 0; numListrik.value  = 0;
        updateSliderFillMath(sliderBbm);
        updateSliderFillMath(sliderListrik);
        updateMathCalc();
      });
    }

    updateMathCalc();
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
