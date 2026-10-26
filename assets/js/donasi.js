/* ============================================================================
   donasi.js — Alur donasi tiga langkah
   ----------------------------------------------------------------------------
   1. Data & Niat     → formulir singkat, nomor donasi terbit
   2. Bayar           → QRIS atau transfer bank
   3. Konfirmasi      → unggah bukti lalu konfirmasi lewat WhatsApp

   Isian tidak pernah hilang: draf disimpan di browser, dan nomor donasi yang
   sudah terbit ikut ditulis ke alamat halaman supaya memuat ulang tetap
   melanjutkan di langkah yang sama.
   ============================================================================ */

(function () {
  'use strict';

  var D = document;
  var $ = function (id) { return D.getElementById(id); };

  var cfg = {};
  var program = null;
  var skemaForm = [];
  var donasi = null;              // { id, kode, nominal, program }
  var berkasBukti = null;

  var slugProgram = UI.paramUrl('program') || UI.paramUrl('slug');
  var nominalAwal = Number(UI.paramUrl('nominal')) || 0;
  var KUNCI_DRAF = 'draf_donasi';

  // ====================================================== Mulai
  UI.mulaiHalaman('program').then(function (c) {
    cfg = c;

    var idUrl = UI.paramUrl('id');
    var kodeUrl = UI.paramUrl('kode');
    var tersimpan = bacaDonasiTersimpan();

    if (idUrl && kodeUrl) donasi = { id: idUrl, kode: kodeUrl };
    else if (tersimpan) donasi = tersimpan;

    if (!slugProgram && donasi && donasi.slug) slugProgram = donasi.slug;
    if (!slugProgram) {
      UI.tampilkanGalat($('donasi-isi'), 'Program donasi belum dipilih. Silakan kembali dan pilih programnya dulu.');
      return;
    }

    return API.get('programDetail', { slug: slugProgram }).then(function (res) {
      program = res.data;
      return API.get('formSchema', { program: slugProgram }).then(function (f) {
        skemaForm = (f.data && f.data.field) || [];
      }).catch(function () { skemaForm = []; });
    }).then(function () {
      D.title = 'Donasi — ' + program.judul;
      $('remah').innerHTML =
        '<a href="index.html">Beranda</a><span>›</span>' +
        '<a href="program.html?slug=' + encodeURIComponent(program.slug) + '">' + UI.aman(program.judul) + '</a>' +
        '<span>›</span><span>Tunaikan Donasi</span>';

      if (donasi && donasi.id) gambarPembayaran();
      else gambarFormulir();
    });
  }).catch(function (err) {
    UI.tampilkanGalat($('donasi-isi'), err.message, function () { location.reload(); });
  });

  // ====================================================== Simpanan lokal
  function simpanDonasi(d) {
    API.simpanTaruh('pd_donasi_aktif', JSON.stringify(Object.assign({ pada: Date.now() }, d)));
  }
  function bacaDonasiTersimpan() {
    try {
      var o = JSON.parse(API.simpanAmbil('pd_donasi_aktif') || 'null');
      if (!o || !o.id) return null;
      if (Date.now() - (o.pada || 0) > 24 * 3600 * 1000) return null;   // kedaluwarsa sehari
      return o;
    } catch (e) { return null; }
  }
  function hapusDonasiTersimpan() { API.simpanHapus('pd_donasi_aktif'); }

  function simpanDraf() {
    var d = {};
    ['nama', 'email', 'no_wa', 'doa'].forEach(function (k) {
      var el = $('f-' + k);
      if (el) d[k] = el.value;
    });
    API.simpanTaruh('pd_' + KUNCI_DRAF, JSON.stringify(d));
  }
  function bacaDraf() {
    try { return JSON.parse(API.simpanAmbil('pd_' + KUNCI_DRAF) || '{}'); } catch (e) { return {}; }
  }

  // ====================================================== Penanda langkah
  function stepper(aktif) {
    var langkah = [
      { no: 1, teks: 'Data & Niat' },
      { no: 2, teks: 'Pembayaran' },
      { no: 3, teks: 'Konfirmasi' }
    ];
    return '<div class="langkah" role="list">' + langkah.map(function (l, i) {
      var selesai = l.no < aktif;
      return (i ? '<span class="langkah-garis"></span>' : '') +
        '<span class="langkah-butir" role="listitem" data-aktif="' + (l.no === aktif) + '" data-selesai="' + selesai + '">' +
          '<span class="langkah-nomor">' + (selesai ? '✓' : l.no) + '</span>' + UI.aman(l.teks) +
        '</span>';
    }).join('') + '</div>';
  }

  function kartuProgramMini() {
    return '<div class="kartu" style="overflow:hidden">' +
      '<div style="aspect-ratio:16/7;background:var(--permukaan-lembut)">' + UI.gambar(program.gambar_url, program.judul) + '</div>' +
      '<div class="kartu-isi">' +
        '<span class="lencana lencana-emas">' + UI.aman(program.kategori) + '</span>' +
        '<h2 style="font-family:var(--badan);font-size:1.0625rem;margin:.5rem 0">' + UI.aman(program.judul) + '</h2>' +
        '<div class="kampanye-angka angka"><b>' + UI.rupiah(program.terkumpul) + '</b>' +
          '<span class="redup">' + program.persen + '% dari ' + UI.rupiah(program.target_dana, true) + '</span></div>' +
        '<div class="progres" style="margin-top:.4rem"><i style="width:' + Math.min(100, program.persen) + '%"></i></div>' +
      '</div></div>';
  }

  // ====================================================== LANGKAH 1 — Formulir
  function gambarFormulir() {
    var draf = bacaDraf();
    var min = cfg.nominal_minimal || 10000;
    var cepat = cfg.nominal_cepat || [50000, 100000, 500000];
    var tambahan = skemaForm.filter(function (f) {
      return ['nama', 'email', 'no_wa', 'doa'].indexOf(f.key) === -1;
    });

    $('donasi-isi').innerHTML =
      stepper(1) +
      '<div class="detail-kisi">' +
        '<form id="form-donasi" class="kaca" style="padding:var(--s-lg);min-width:0" novalidate>' +
          '<h1 style="font-size:1.5rem">Tunaikan Donasi Anda</h1>' +
          '<p class="kecil redup">Isian ditandai <span class="wajib">*</span> wajib diisi. ' +
            'Data kontak hanya dipakai untuk mengirim kuitansi dan laporan penyaluran — tidak pernah ditampilkan di halaman publik.</p>' +

          '<div class="bidang">' +
            '<label>Nominal donasi <span class="wajib">*</span></label>' +
            '<div class="kampanye-chip" id="chip-nominal" style="grid-template-columns:repeat(3,1fr);margin-bottom:.5rem">' +
              cepat.map(function (n) {
                return '<button type="button" class="chip-nominal" data-nominal="' + n + '" aria-pressed="' +
                  (nominalAwal === n) + '">' + UI.rupiah(n, true) + '</button>';
              }).join('') +
            '</div>' +
            '<input type="number" id="f-nominal" inputmode="numeric" min="' + min + '" step="1000" required ' +
              'value="' + (nominalAwal || '') + '" placeholder="Nominal lain, contoh 250000">' +
            '<span class="bantu">Minimal ' + UI.rupiah(min) + '</span>' +
            '<span class="galat-pesan" id="galat-nominal" hidden></span>' +
          '</div>' +

          '<div class="bidang">' +
            '<label for="f-nama">Nama muhsinin <span class="wajib">*</span></label>' +
            '<input type="text" id="f-nama" maxlength="100" required autocomplete="name" ' +
              'value="' + UI.aman(draf.nama || '') + '" placeholder="Nama lengkap Anda">' +
            '<label class="centang" style="margin-top:.4rem">' +
              '<input type="checkbox" id="f-anonim">' +
              '<span>Sembunyikan nama saya — tampil sebagai <b>“Hamba Allah”</b> di halaman publik</span>' +
            '</label>' +
            '<span class="galat-pesan" id="galat-nama" hidden></span>' +
          '</div>' +

          '<div class="kisi kisi-2" style="gap:var(--s-md)">' +
            '<div class="bidang">' +
              '<label for="f-email">Alamat email</label>' +
              '<input type="email" id="f-email" autocomplete="email" ' +
                'value="' + UI.aman(draf.email || '') + '" placeholder="nama@email.com">' +
              '<span class="bantu">Untuk pengiriman kuitansi digital</span>' +
              '<span class="galat-pesan" id="galat-email" hidden></span>' +
            '</div>' +
            '<div class="bidang">' +
              '<label for="f-no_wa">Nomor WhatsApp</label>' +
              '<input type="tel" id="f-no_wa" inputmode="tel" autocomplete="tel" ' +
                'value="' + UI.aman(draf.no_wa || '') + '" placeholder="08xxxxxxxxxx">' +
              '<span class="bantu">Untuk konfirmasi dan laporan penyaluran</span>' +
              '<span class="galat-pesan" id="galat-no_wa" hidden></span>' +
            '</div>' +
          '</div>' +

          tambahan.map(bidangTambahan).join('') +

          '<div class="bidang">' +
            '<label for="f-doa">Untaian doa &amp; niat</label>' +
            '<textarea id="f-doa" maxlength="1000" rows="3" ' +
              'placeholder="Tuliskan doa kebaikan atau hajat Anda…">' + UI.aman(draf.doa || '') + '</textarea>' +
            '<label class="centang" style="margin-top:.4rem">' +
              '<input type="checkbox" id="f-tampilkan_doa" checked>' +
              '<span>Izinkan doa saya ditampilkan di halaman publik setelah ditinjau pengelola</span>' +
            '</label>' +
          '</div>' +

          '<button class="tombol tombol-emas tombol-penuh" type="submit" id="tombol-kirim" style="margin-top:var(--s-sm)">' +
            UI.ikon('hati') + 'Lanjut ke Pembayaran</button>' +

          '<p class="mini redup tengah" style="margin:var(--s-md) 0 0">' +
            'Dengan melanjutkan, Anda menyetujui data di atas disimpan pengelola untuk keperluan pencatatan donasi.</p>' +
        '</form>' +

        '<aside class="lajur" style="gap:var(--s-md)">' +
          kartuProgramMini() +
          '<div class="kartu kartu-isi">' +
            '<b style="font-size:.9375rem">Yang Anda dapatkan</b>' +
            '<div class="jaminan" style="margin-top:.6rem">' +
              '<div>' + UI.ikon('kuitansi', 'ikon-sm') + '<span>Kuitansi digital ber-QR yang bisa diperiksa keasliannya</span></div>' +
              '<div>' + UI.ikon('centang', 'ikon-sm') + '<span>Nomor donasi untuk melacak status kapan saja</span></div>' +
              '<div>' + UI.ikon('perisai', 'ikon-sm') + '<span>Data pribadi tidak pernah tampil di halaman publik</span></div>' +
            '</div>' +
          '</div>' +
        '</aside>' +
      '</div>';

    pasangFormulir();
  }

  function bidangTambahan(f) {
    var id = 'fx-' + f.key;
    var wajib = f.wajib ? ' <span class="wajib">*</span>' : '';
    var isi;

    if (f.tipe === 'area') {
      isi = '<textarea id="' + id + '" rows="3" data-kunci="' + UI.aman(f.key) + '"' + (f.wajib ? ' required' : '') + '></textarea>';
    } else if (f.tipe === 'pilihan') {
      isi = '<select id="' + id + '" data-kunci="' + UI.aman(f.key) + '"' + (f.wajib ? ' required' : '') + '>' +
        '<option value="">— pilih —</option>' +
        (f.opsi || []).map(function (o) { return '<option>' + UI.aman(o) + '</option>'; }).join('') + '</select>';
    } else if (f.tipe === 'centang') {
      return '<div class="bidang"><label class="centang"><input type="checkbox" id="' + id + '" data-kunci="' +
        UI.aman(f.key) + '"><span>' + UI.aman(f.label) + '</span></label></div>';
    } else {
      var tipe = { angka: 'number', tanggal: 'date', email: 'email', wa: 'tel' }[f.tipe] || 'text';
      isi = '<input type="' + tipe + '" id="' + id + '" data-kunci="' + UI.aman(f.key) + '"' + (f.wajib ? ' required' : '') + '>';
    }

    return '<div class="bidang"><label for="' + id + '">' + UI.aman(f.label) + wajib + '</label>' + isi +
      (f.bantuan ? '<span class="bantu">' + UI.aman(f.bantuan) + '</span>' : '') + '</div>';
  }

  function pasangFormulir() {
    var chip = $('chip-nominal');
    var nominal = $('f-nominal');

    chip.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-nominal]');
      if (!b) return;
      nominal.value = b.getAttribute('data-nominal');
      tandaiChip();
      sembunyikanGalat('nominal');
    });
    nominal.addEventListener('input', function () { tandaiChip(); sembunyikanGalat('nominal'); });

    function tandaiChip() {
      Array.prototype.forEach.call(chip.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', String(x.getAttribute('data-nominal') === nominal.value));
      });
    }
    tandaiChip();

    var anonim = $('f-anonim');
    var nama = $('f-nama');
    anonim.addEventListener('change', function () {
      nama.disabled = anonim.checked;
      if (anonim.checked) { nama.dataset.simpan = nama.value; nama.value = 'Hamba Allah'; }
      else { nama.value = nama.dataset.simpan || ''; }
    });

    ['nama', 'email', 'no_wa', 'doa'].forEach(function (k) {
      var el = $('f-' + k);
      if (el) el.addEventListener('input', function () { simpanDraf(); sembunyikanGalat(k); });
    });

    $('form-donasi').addEventListener('submit', kirimDonasi);
  }

  function tampilkanGalatBidang(kunci, pesan) {
    var el = $('galat-' + kunci);
    var input = $('f-' + kunci);
    if (el) { el.textContent = pesan; el.hidden = false; }
    if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
  }
  function sembunyikanGalat(kunci) {
    var el = $('galat-' + kunci);
    var input = $('f-' + kunci);
    if (el) el.hidden = true;
    if (input) input.removeAttribute('aria-invalid');
  }

  function kirimDonasi(e) {
    e.preventDefault();

    var min = cfg.nominal_minimal || 10000;
    var nominal = Number($('f-nominal').value);
    var anonim = $('f-anonim').checked;
    var nama = $('f-nama').value.trim();
    var email = $('f-email').value.trim();
    var wa = $('f-no_wa').value.trim();

    if (!nominal || nominal < min) {
      return tampilkanGalatBidang('nominal', 'Nominal minimal ' + UI.rupiah(min) + '.');
    }
    if (!anonim && !nama) {
      return tampilkanGalatBidang('nama', 'Nama wajib diisi, atau centang “Hamba Allah”.');
    }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return tampilkanGalatBidang('email', 'Format email belum benar.');
    }
    if (wa && !/^(\+?62|0)8\d{7,13}$/.test(wa.replace(/[\s-]/g, ''))) {
      return tampilkanGalatBidang('no_wa', 'Format nomor WhatsApp belum benar. Contoh: 081234567890.');
    }

    var jawaban = {};
    var kurang = null;
    D.querySelectorAll('[data-kunci]').forEach(function (el) {
      var k = el.getAttribute('data-kunci');
      var v = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (el.hasAttribute('required') && (v === '' || v === false)) kurang = kurang || el;
      jawaban[k] = v;
    });
    if (kurang) { kurang.focus(); UI.toast('Masih ada isian wajib yang kosong.', 'galat'); return; }

    var tombol = $('tombol-kirim');
    tombol.disabled = true;
    tombol.innerHTML = 'Menyimpan…';

    API.post('submitDonation', {
      program: program.slug,
      nominal: nominal,
      nama: anonim ? '' : nama,
      anonim: anonim,
      email: email,
      no_wa: wa,
      doa: $('f-doa').value.trim(),
      tampilkan_doa: $('f-tampilkan_doa').checked,
      jawaban: jawaban
    }).then(function (res) {
      donasi = {
        id: res.data.id,
        kode: res.data.kode_verifikasi,
        nominal: res.data.nominal,
        slug: program.slug
      };
      simpanDonasi(donasi);
      API.simpanHapus('pd_' + KUNCI_DRAF);

      try {
        history.replaceState(null, '', 'donasi.html?program=' + encodeURIComponent(program.slug) +
          '&id=' + encodeURIComponent(donasi.id) + '&kode=' + encodeURIComponent(donasi.kode));
      } catch (e2) {}

      gambarPembayaran(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function (err) {
      tombol.disabled = false;
      tombol.innerHTML = UI.ikon('hati') + 'Lanjut ke Pembayaran';
      UI.toast(err.message, 'galat', 7000);
    });
  }

  // ====================================================== LANGKAH 2 & 3
  function gambarPembayaran(dariServer) {
    var bayar = (dariServer && dariServer.pembayaran) || {};
    var nominal = (dariServer && dariServer.nominal) || donasi.nominal || 0;
    var qris = bayar.qris_url || cfg.qris_url || '';
    var rek = bayar.bank_rekening || cfg.bank_rekening || '';
    var bank = bayar.bank_nama || cfg.bank_nama || '';
    var atasNama = bayar.bank_atas_nama || cfg.bank_atas_nama || '';
    var nmid = bayar.qris_nmid || cfg.qris_nmid || '';

    $('donasi-isi').innerHTML =
      stepper(2) +
      '<div class="detail-kisi">' +
        '<div class="lajur" style="gap:var(--s-lg);min-width:0">' +

          '<div class="kaca-tinggi qris-panel">' +
            '<span class="label-atas">Langkah 2 — Pembayaran</span>' +
            '<h1 style="font-size:1.5rem;margin-bottom:.25rem">Selesaikan Pembayaran</h1>' +
            '<p class="kecil redup">Nomor donasi Anda <b class="mono">' + UI.aman(donasi.id) + '</b></p>' +

            '<div style="margin:var(--s-md) 0">' +
              '<div class="kecil redup">Jumlah yang perlu ditransfer</div>' +
              '<div class="nominal-besar angka" id="nominal-bayar">' + UI.rupiah(nominal) + '</div>' +
              '<button class="tombol tombol-lembut tombol-kecil" type="button" id="salin-nominal" style="margin-top:.5rem">' +
                UI.ikon('salin', 'ikon-sm') + 'Salin Nominal</button>' +
            '</div>' +

            (qris
              ? '<div class="qris-bingkai"><img src="' + UI.aman(qris) + '" alt="Kode QRIS pembayaran"></div>' +
                '<div class="kecil redup">Pindai dengan aplikasi m-banking atau dompet digital apa pun</div>' +
                (nmid ? '<div class="mini mono redup" style="margin-top:.35rem">NMID ' + UI.aman(nmid) + '</div>' : '') +
                '<div class="baris" style="justify-content:center;margin-top:var(--s-sm)">' +
                  '<a class="tombol tombol-lembut tombol-kecil" href="' + UI.aman(qris) + '" download target="_blank" rel="noopener">' +
                    UI.ikon('unduh', 'ikon-sm') + 'Unduh Gambar QRIS</a>' +
                '</div>'
              : '<div class="qris-kosong" style="margin:0 auto">' + UI.ikon('kode', 'ikon-lg') +
                '<p style="margin:.6rem 0 0">Gambar QRIS belum diunggah pengelola. Silakan pakai transfer bank di bawah.</p></div>') +

            (rek ? '<div class="rekening-kotak" style="margin-top:var(--s-lg);text-align:left">' +
              '<div><div class="mini redup">' + UI.aman(bank) + (atasNama ? ' — a.n. ' + UI.aman(atasNama) : '') + '</div>' +
              '<div class="rekening-nomor angka">' + UI.aman(rek) + '</div></div>' +
              '<button class="tombol tombol-lembut tombol-kecil" type="button" id="salin-rek">' +
                UI.ikon('salin', 'ikon-sm') + 'Salin</button>' +
            '</div>' : '') +
          '</div>' +

          '<div class="kaca" style="padding:var(--s-lg)">' +
            '<span class="label-atas">Langkah 3 — Konfirmasi</span>' +
            '<h2 style="font-size:1.25rem">Unggah Bukti &amp; Konfirmasi</h2>' +
            '<p class="kecil redup">Kirimkan bukti transfer agar pengelola dapat menerbitkan tanda terima digital Anda.</p>' +

            '<div id="area-bukti">' +
              '<label class="lepas-berkas" id="lepas-berkas" for="input-bukti">' +
                UI.ikon('unggah', 'ikon-lg') +
                '<div style="margin-top:.5rem"><b>Tarik berkas ke sini, atau klik untuk memilih</b></div>' +
                '<div class="mini redup">JPG, PNG, atau PDF — maksimal 5 MB</div>' +
              '</label>' +
              '<input type="file" id="input-bukti" accept="image/jpeg,image/png,application/pdf" hidden>' +
            '</div>' +

            '<button class="tombol tombol-wa tombol-penuh" type="button" id="tombol-konfirmasi" style="margin-top:var(--s-md)">' +
              UI.ikon('obrolan') + 'Konfirmasi via WhatsApp Sekarang</button>' +

            '<button class="tombol tombol-lembut tombol-penuh tombol-kecil" type="button" id="tombol-nanti" style="margin-top:.5rem">' +
              'Saya konfirmasi nanti</button>' +

            '<p class="mini redup" style="margin:var(--s-md) 0 0">' +
              'Simpan nomor donasi <b class="mono">' + UI.aman(donasi.id) + '</b> dan kode ' +
              '<b class="mono">' + UI.aman(donasi.kode) + '</b> untuk memeriksa status kapan saja.</p>' +
          '</div>' +
        '</div>' +

        '<aside class="lajur" style="gap:var(--s-md)">' +
          kartuProgramMini() +
          '<div class="kartu kartu-isi">' +
            '<b style="font-size:.9375rem">Petunjuk singkat</b>' +
            '<ol class="kecil redup" style="padding-left:1.1rem;margin:.6rem 0 0;line-height:1.9">' +
              '<li>Salin nominal, lalu bayar lewat QRIS atau transfer.</li>' +
              '<li>Simpan tangkapan layar bukti pembayaran.</li>' +
              '<li>Unggah bukti, lalu tekan tombol konfirmasi WhatsApp.</li>' +
            '</ol>' +
          '</div>' +
          (cfg.no_wa_admin ? '<div class="kartu kartu-isi baris">' +
            '<span class="ikon-wadah" style="width:40px;height:40px">' + UI.ikon('obrolan', 'ikon-sm') + '</span>' +
            '<div><b style="font-size:.875rem">Butuh bantuan?</b>' +
            '<div class="mini redup">Layanan donatur ' + UI.aman(cfg.no_wa_admin) + '</div></div></div>' : '') +
        '</aside>' +
      '</div>';

    pasangPembayaran(nominal);
  }

  function pasangPembayaran(nominal) {
    var salinNominal = $('salin-nominal');
    if (salinNominal) {
      salinNominal.addEventListener('click', function () {
        UI.salin(String(Math.round(nominal)), 'Nominal ' + UI.rupiah(nominal) + ' disalin.');
      });
    }
    var salinRek = $('salin-rek');
    if (salinRek) {
      salinRek.addEventListener('click', function () {
        UI.salin(cfg.bank_rekening, 'Nomor rekening disalin.');
      });
    }

    pasangUnggah();

    $('tombol-konfirmasi').addEventListener('click', konfirmasiWA);
    $('tombol-nanti').addEventListener('click', function () {
      location.href = 'terima-kasih.html?id=' + encodeURIComponent(donasi.id) +
        '&kode=' + encodeURIComponent(donasi.kode);
    });
  }

  // ====================================================== Unggah bukti
  function pasangUnggah() {
    var input = $('input-bukti');
    var lepas = $('lepas-berkas');

    ['dragenter', 'dragover'].forEach(function (ev) {
      lepas.addEventListener(ev, function (e) { e.preventDefault(); lepas.classList.add('hover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      lepas.addEventListener(ev, function (e) { e.preventDefault(); lepas.classList.remove('hover'); });
    });
    lepas.addEventListener('drop', function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) pilihBerkas(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', function () {
      if (input.files && input.files[0]) pilihBerkas(input.files[0]);
    });
  }

  function pilihBerkas(file) {
    var izin = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (izin.indexOf(file.type) === -1) {
      UI.toast('Berkas harus JPG, PNG, atau PDF.', 'galat');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      UI.toast('Ukuran berkas melebihi 5 MB. Mohon perkecil dulu.', 'galat');
      return;
    }

    berkasBukti = file;
    $('area-bukti').innerHTML =
      '<div class="berkas-terpilih">' + UI.ikon('berkas', 'ikon-sm') +
        '<span class="lajur" style="min-width:0"><b style="font-size:.8125rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          UI.aman(file.name) + '</b>' +
        '<span class="mini redup" id="status-unggah">' + (file.size / 1024 / 1024).toFixed(2) + ' MB — menunggu diunggah</span></span>' +
        '<button class="tombol-bulat" type="button" id="batal-berkas" aria-label="Hapus berkas">' + UI.ikon('tutup', 'ikon-sm') + '</button>' +
      '</div>';

    $('batal-berkas').addEventListener('click', function () {
      berkasBukti = null;
      $('area-bukti').innerHTML =
        '<label class="lepas-berkas" id="lepas-berkas" for="input-bukti">' + UI.ikon('unggah', 'ikon-lg') +
        '<div style="margin-top:.5rem"><b>Tarik berkas ke sini, atau klik untuk memilih</b></div>' +
        '<div class="mini redup">JPG, PNG, atau PDF — maksimal 5 MB</div></label>' +
        '<input type="file" id="input-bukti" accept="image/jpeg,image/png,application/pdf" hidden>';
      pasangUnggah();
    });

    unggahBukti();
  }

  function unggahBukti() {
    if (!berkasBukti) return Promise.resolve(false);
    var status = $('status-unggah');
    if (status) status.textContent = 'Sedang diunggah…';

    return bacaSebagaiBase64(berkasBukti).then(function (base64) {
      return API.post('uploadBukti', {
        id: donasi.id, kode: donasi.kode,
        base64: base64, mimeType: berkasBukti.type
      });
    }).then(function () {
      if (status) status.textContent = 'Berhasil diunggah ✓';
      UI.toast('Bukti transfer berhasil diunggah.', 'sukses');
      return true;
    }).catch(function (err) {
      if (status) status.textContent = 'Gagal diunggah — isian Anda tidak hilang';
      UI.toast(err.message, 'galat', 7000);
      return false;
    });
  }

  /** Gambar besar dikecilkan dulu di browser supaya hemat kuota dan cepat. */
  function bacaSebagaiBase64(file) {
    if (file.type === 'application/pdf' || file.size < 700 * 1024) return bacaMentah(file);

    return new Promise(function (selesai) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var maks = 1600;
        var skala = Math.min(1, maks / Math.max(img.width, img.height));
        var c = D.createElement('canvas');
        c.width = Math.round(img.width * skala);
        c.height = Math.round(img.height * skala);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        selesai(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); bacaMentah(file).then(selesai); };
      img.src = url;
    });
  }

  function bacaMentah(file) {
    return new Promise(function (selesai, gagal) {
      var fr = new FileReader();
      fr.onload = function () { selesai(String(fr.result).split(',')[1]); };
      fr.onerror = function () { gagal(new Error('Berkas tidak bisa dibaca.')); };
      fr.readAsDataURL(file);
    });
  }

  // ====================================================== Konfirmasi WhatsApp
  function konfirmasiWA() {
    var tombol = $('tombol-konfirmasi');
    tombol.disabled = true;
    tombol.innerHTML = 'Memproses…';

    API.post('confirmWA', { id: donasi.id, kode: donasi.kode }).then(function (res) {
      if (res.data && res.data.wa_url) {
        window.open(res.data.wa_url, '_blank', 'noopener');
      }
      hapusDonasiTersimpan();
      location.href = 'terima-kasih.html?id=' + encodeURIComponent(donasi.id) +
        '&kode=' + encodeURIComponent(donasi.kode);
    }).catch(function (err) {
      tombol.disabled = false;
      tombol.innerHTML = UI.ikon('obrolan') + 'Konfirmasi via WhatsApp Sekarang';
      UI.toast(err.message, 'galat', 7000);
    });
  }
})();
