/* ============================================================================
   dashboard.js — Dasbor ringkasan
   ============================================================================ */

(function () {
  'use strict';

  var P = PANEL;

  P.P.modul.dasbor = function (wadah) {
    return P.panggil('dashboard', {}).then(function (d) {
      P.subJudul('Diperbarui ' + P.jarakWaktu(d.disegarkan));
      wadah.innerHTML =
        kpi(d.kpi) +
        '<div class="panel-kisi-2" style="margin-top:var(--selang)">' +
          '<div>' + tren(d.tren) + terbaru(d.terbaru) + '</div>' +
          '<div>' + progres(d.progres) + alokasi(d.alokasi) + doa(d.doa) + '</div>' +
        '</div>' +
        tautanSumber(d.spreadsheet_url);

      wadah.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ke-donasi]');
        if (b) { P.P.data.donasiSaring = { status: b.getAttribute('data-ke-donasi') }; P.buka('donasi', true); }
      });
    });
  };

  // ------------------------------------------------------------------ KPI
  function kpi(k) {
    var arah = k.pertumbuhan_bulan;
    var bandingan = arah === null
      ? 'Belum ada pembanding bulan lalu'
      : (arah >= 0 ? '<span class="kpi-naik">▲ ' + P.angka(Math.abs(arah)) + '%</span>'
                   : '<span class="kpi-turun">▼ ' + P.angka(Math.abs(arah)) + '%</span>') +
        ' dibanding bulan lalu';

    return '<div class="kpi-kisi">' +
      kotak('Donasi Bulan Ini', P.rupiah(k.total_bulan_ini),
            P.angka(k.transaksi_bulan_ini) + ' transaksi · ' + bandingan) +
      kotak('Hari Ini', P.rupiah(k.total_hari_ini),
            P.angka(k.transaksi_hari_ini) + ' transaksi · rata-rata harian ' + P.rupiah(k.rata_rata_harian)) +
      kotak('Terkumpul Keseluruhan', P.rupiah(k.total_keseluruhan),
            P.angka(k.donatur) + ' donatur tercatat · ' + P.angka(k.donatur_baru_pekan_ini) + ' pekan ini') +
      '<button type="button" class="kpi kpi-klik" data-ke-donasi="Masuk">' +
        '<span class="kpi-label">Menunggu Pencocokan</span>' +
        '<span class="kpi-nilai">' + P.angka(k.menunggu) + '</span>' +
        '<span class="kpi-kaki">' + P.angka(k.terkonfirmasi) + ' sudah dikonfirmasi · ' +
          P.angka(k.program_aktif) + ' program aktif</span>' +
      '</button>' +
    '</div>';
  }

  function kotak(label, nilai, kaki) {
    return '<div class="kpi">' +
      '<span class="kpi-label">' + P.aman(label) + '</span>' +
      '<span class="kpi-nilai">' + nilai + '</span>' +
      '<span class="kpi-kaki">' + kaki + '</span>' +
    '</div>';
  }

  // ----------------------------------------------------------------- Tren
  function tren(data) {
    var titik = (data || []).map(function (t) { return { label: t.tanggal, nilai: t.nominal }; });
    var total = titik.reduce(function (a, b) { return a + b.nilai; }, 0);

    return '<div class="panel-kartu">' +
      '<div class="kartu-kepala">' +
        '<h2>Arus Donasi 30 Hari</h2>' +
        '<span class="aksi kecil redup">Total ' + P.rupiah(total) + '</span>' +
      '</div>' +
      P.grafikGaris(titik, { judul: 'Arus donasi 30 hari terakhir' }) +
    '</div>';
  }

  // ------------------------------------------------------------- Mutasi
  function terbaru(item) {
    if (!item.length) {
      return '<div class="panel-kartu">' +
        P.kosong('kuitansi', 'Belum ada donasi masuk',
          'Begitu ada donasi pertama, mutasinya tampil di sini.') + '</div>';
    }

    return '<div class="panel-kartu">' +
      '<div class="kartu-kepala"><h2>Mutasi Terbaru</h2>' +
        '<span class="aksi"><button type="button" class="tombol tombol-lembut tombol-kecil" ' +
        'onclick="PANEL.buka(\'donasi\')">Lihat semua</button></span></div>' +
      '<div class="tabel-bungkus"><table class="tabel">' +
        '<thead><tr><th>Donatur</th><th>Program</th><th class="kanan">Nominal</th><th>Status</th></tr></thead>' +
        '<tbody>' + item.map(function (r) {
          return '<tr>' +
            '<td><b>' + P.aman(r.nama) + '</b><br><span class="mini redup">' + P.jarakWaktu(r.waktu) + '</span></td>' +
            '<td class="kecil">' + P.aman(r.program) + '</td>' +
            '<td class="angka kanan"><b>' + P.rupiah(r.nominal) + '</b></td>' +
            '<td>' + statusLencana(r) + '</td>' +
          '</tr>';
        }).join('') + '</tbody>' +
      '</table></div>' +
    '</div>';
  }

  function statusLencana(r) {
    if (String(r.status).indexOf('Dikonfirmasi') > -1) return P.lencana('Dikonfirmasi', 'sukses');
    if (r.adaBukti) return P.lencana('Ada bukti', 'emas');
    return P.lencana('Menunggu', 'ingat');
  }

  // ------------------------------------------------------------ Progres
  function progres(item) {
    if (!item.length) return '';
    return '<div class="panel-kartu">' +
      '<div class="kartu-kepala"><h2>Progres Program</h2></div>' +
      item.map(function (p) {
        return '<div style="margin-bottom:var(--s-md)">' +
          '<div class="sela" style="margin-bottom:.3rem">' +
            '<span class="kecil potong-1" style="font-weight:600">' + P.aman(p.judul) + '</span>' +
            '<b class="kecil angka">' + P.angka(p.persen) + '%</b>' +
          '</div>' +
          '<span class="batang-rel"><span class="batang-isi" style="width:' + p.persen + '%"></span></span>' +
          '<div class="mini redup" style="margin-top:.25rem">' +
            P.rupiah(p.terkumpul) + ' dari ' + P.rupiah(p.target_dana) +
            (p.sisa_hari !== null ? ' · sisa ' + P.angka(p.sisa_hari) + ' hari' : '') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  // ------------------------------------------------------------ Alokasi
  function alokasi(item) {
    if (!item.length) return '';
    return '<div class="panel-kartu">' +
      '<div class="kartu-kepala"><h2>Sebaran Amanah</h2></div>' +
      P.grafikBatang(item.map(function (a) {
        return { label: a.judul, nilai: a.nominal };
      }), { rupiah: true }) +
    '</div>';
  }

  // ---------------------------------------------------------------- Doa
  function doa(item) {
    if (!item.length) return '';
    return '<div class="panel-kartu">' +
      '<div class="kartu-kepala"><h2>Untaian Doa Terbaru</h2></div>' +
      item.slice(0, 4).map(function (d) {
        return '<blockquote style="margin:0 0 var(--s-md);padding-left:.8rem;' +
          'border-left:2px solid var(--emas)">' +
          '<p class="kecil" style="margin:0 0 .25rem;font-style:italic">“' + P.aman(d.isi) + '”</p>' +
          '<span class="mini redup">' + P.aman(d.nama) + ' · ' + P.jarakWaktu(d.waktu) + '</span>' +
        '</blockquote>';
      }).join('') +
    '</div>';
  }

  function tautanSumber(url) {
    if (!url) return '';
    return '<p class="mini redup" style="margin-top:var(--s-lg);text-align:center">' +
      'Seluruh data tersimpan di spreadsheet Anda sendiri — ' +
      '<a href="' + P.aman(url) + '" target="_blank" rel="noopener">buka di Google Sheets</a>.</p>';
  }
})();
