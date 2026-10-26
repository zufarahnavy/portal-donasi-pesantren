/* ============================================================================
   donasi.js — Daftar donasi, rincian donatur, laporan & ekspor
   ----------------------------------------------------------------------------
   Kontak donatur tampil TERSAMAR di tabel dan baru terbaca utuh saat admin
   membuka rincian satu donasi. Pembukaan bukti transfer dicatat di jejak
   aktivitas, karena itu berarti melihat dokumen keuangan milik orang lain.
   ============================================================================ */

(function () {
  'use strict';

  var P = PANEL;
  var saring = { q: '', status: '', program_id: '', dari: '', sampai: '', page: 1 };

  // ====================================================== Daftar donasi
  P.P.modul.donasi = function (wadah) {
    if (P.P.data.donasiSaring) {
      saring = Object.assign({ q: '', status: '', program_id: '', dari: '', sampai: '', page: 1 },
                             P.P.data.donasiSaring);
      P.P.data.donasiSaring = null;
    }

    wadah.innerHTML =
      '<div class="panel-kartu">' +
        '<div class="saring" id="saring-donasi">' +
          '<input type="search" class="tumbuh" id="d-q" placeholder="Cari nomor donasi, nama, email, atau nomor WA…" ' +
            'value="' + P.aman(saring.q) + '" aria-label="Cari donasi">' +
          '<select id="d-status" aria-label="Saring status">' +
            '<option value="">Semua status</option>' +
            '<option value="Masuk">Menunggu pencocokan</option>' +
            '<option value="Dikonfirmasi WA">Sudah dikonfirmasi</option>' +
          '</select>' +
          '<select id="d-program" aria-label="Saring program"><option value="">Semua program</option></select>' +
          '<input type="date" id="d-dari" aria-label="Tanggal mulai" value="' + P.aman(saring.dari) + '">' +
          '<input type="date" id="d-sampai" aria-label="Tanggal akhir" value="' + P.aman(saring.sampai) + '">' +
          '<button type="button" class="tombol tombol-lembut tombol-kecil" id="d-reset">Bersihkan</button>' +
        '</div>' +
        '<div id="d-ringkas"></div>' +
        '<div id="d-tabel">' + P.tunggu(6) + '</div>' +
      '</div>';

    P.el('d-status').value = saring.status;
    pasangKendali(wadah);
    return muat();
  };

  function pasangKendali(wadah) {
    var jeda = null;
    P.el('d-q').addEventListener('input', function (e) {
      clearTimeout(jeda);
      var v = e.target.value.trim();
      jeda = setTimeout(function () { saring.q = v; saring.page = 1; muat(); }, 350);
    });
    ['d-status', 'd-program', 'd-dari', 'd-sampai'].forEach(function (id) {
      P.el(id).addEventListener('change', function (e) {
        saring[id.slice(2) === 'program' ? 'program_id' : id.slice(2)] = e.target.value;
        saring.page = 1;
        muat();
      });
    });
    P.el('d-reset').addEventListener('click', function () {
      saring = { q: '', status: '', program_id: '', dari: '', sampai: '', page: 1 };
      P.buka('donasi', true);
    });

    wadah.addEventListener('click', function (e) {
      var hal = e.target.closest('.hal button[data-ke]');
      if (hal && !hal.disabled) { saring.page = Number(hal.getAttribute('data-ke')); muat(); return; }

      var baris = e.target.closest('tr[data-id]');
      if (baris) rincian(baris.getAttribute('data-id'));
    });
  }

  function muat() {
    P.el('d-tabel').innerHTML = P.tunggu(6);
    return P.panggil('donasiList', saring).then(function (d) {
      isiProgram(d.program);
      P.el('d-ringkas').innerHTML = ringkas(d.ringkas, d.total);
      P.el('d-tabel').innerHTML = tabel(d);
      P.subJudul(P.angka(d.total) + ' donasi cocok dengan saringan ini');
    }).catch(function (err) {
      P.galat(err);
      P.el('d-tabel').innerHTML = P.kosong('ingat', 'Gagal memuat', err.message);
    });
  }

  function isiProgram(daftar) {
    var s = P.el('d-program');
    if (s.options.length > 1) return;
    daftar.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id; o.textContent = p.judul;
      s.appendChild(o);
    });
    s.value = saring.program_id;
  }

  function ringkas(r, total) {
    return '<div class="baris" style="gap:.5rem;flex-wrap:wrap;margin-bottom:var(--s-md)">' +
      '<span class="tag-kecil">Total ' + P.rupiah(r.total_nominal) + '</span>' +
      '<span class="tag-kecil">' + P.angka(total) + ' transaksi</span>' +
      '<span class="tag-kecil">' + P.angka(r.terkonfirmasi) + ' dikonfirmasi</span>' +
      '<span class="tag-kecil">' + P.angka(r.menunggu) + ' menunggu</span>' +
    '</div>';
  }

  function tabel(d) {
    if (!d.item.length) {
      return P.kosong('cari', 'Tidak ada donasi yang cocok',
        'Coba ubah kata kunci, rentang tanggal, atau pilihan program.');
    }

    return '<div class="tabel-bungkus"><table class="tabel">' +
      '<thead><tr>' +
        '<th>Nomor &amp; Waktu</th><th>Donatur</th><th>Program</th>' +
        '<th class="kanan">Nominal</th><th>Status</th><th>Bukti</th>' +
      '</tr></thead><tbody>' +
      d.item.map(function (r) {
        return '<tr data-id="' + P.aman(r.id) + '" style="cursor:pointer" ' +
          'title="Klik untuk melihat rincian">' +
          '<td><span class="mono">' + P.aman(r.id) + '</span><br>' +
            '<span class="mini redup">' + P.waktu(r.waktu) + '</span></td>' +
          '<td><b>' + P.aman(r.nama) + '</b>' + (r.anonim ? ' <span class="tag-kecil">anonim</span>' : '') +
            '<br><span class="mini redup">' + P.aman(r.wa_samar || r.email_samar || '—') + '</span></td>' +
          '<td class="kecil">' + P.aman(r.program) + '</td>' +
          '<td class="angka kanan"><b>' + P.rupiah(r.nominal) + '</b></td>' +
          '<td>' + (String(r.status).indexOf('Dikonfirmasi') > -1
            ? P.lencana('Dikonfirmasi', 'sukses') : P.lencana('Menunggu', 'ingat')) + '</td>' +
          '<td>' + (r.adaBukti ? P.lencana('Ada', 'emas') : '<span class="mini redup">—</span>') +
            (r.adaKuitansi ? ' ' + P.lencana('Kuitansi', 'sukses') : '') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>' + P.paginasi(d, 'donasi');
  }

  // ====================================================== Rincian donasi
  function rincian(id) {
    var w = P.modal({ judul: 'Rincian Donasi', lebar: true, isi: P.tunggu(5) });

    P.panggil('donasiDetail', { id: id }).then(function (r) {
      w.querySelector('.modal-isi').innerHTML = isiRincian(r);
      w.querySelector('.modal-kaki').innerHTML =
        '<button type="button" class="tombol tombol-lembut" data-tutup>Tutup</button>' +
        (r.adaBukti ? '<button type="button" class="tombol tombol-lembut" data-bukti>Lihat bukti transfer</button>' : '') +
        '<button type="button" class="tombol tombol-primer" data-kuitansi>' +
          (r.adaKuitansi ? 'Buat ulang kuitansi' : 'Terbitkan kuitansi') + '</button>';

      w.querySelector('[data-kuitansi]').addEventListener('click', function () {
        var t = this;
        P.sibuk(t, true, 'Menyusun PDF…');
        P.panggil('kuitansiBuat', { id: r.id }).then(function (h) {
          P.toast('Kuitansi siap diunduh.', 'sukses');
          window.open(h.unduh, '_blank', 'noopener');
          P.sibuk(t, false);
        }).catch(function (e) { P.galat(e); P.sibuk(t, false); });
      });

      var tb = w.querySelector('[data-bukti]');
      if (tb) tb.addEventListener('click', function () { lihatBukti(r.id, this); });
    }).catch(function (err) {
      w.querySelector('.modal-isi').innerHTML = P.kosong('ingat', 'Gagal memuat rincian', err.message);
    });
  }

  function isiRincian(r) {
    var b = function (label, nilai) {
      return '<div class="sela" style="padding:.45rem 0;border-bottom:1px dashed var(--garis)">' +
        '<span class="kecil redup">' + P.aman(label) + '</span>' +
        '<span class="kecil" style="text-align:right;font-weight:600">' + nilai + '</span></div>';
    };

    return '<div class="panel-kisi-2" style="gap:var(--s-lg)">' +
      '<div>' +
        b('Nomor donasi', '<span class="mono">' + P.aman(r.id) + '</span>') +
        b('Waktu', P.waktu(r.waktu)) +
        b('Program', P.aman(r.program)) +
        b('Nominal', '<b>' + P.rupiah(r.nominal) + '</b>') +
        b('Status', String(r.status).indexOf('Dikonfirmasi') > -1
            ? P.lencana('Dikonfirmasi', 'sukses') : P.lencana('Menunggu pencocokan', 'ingat')) +
        b('Bukti transfer', r.adaBukti ? P.lencana('Terunggah', 'emas') : '<span class="redup">Belum ada</span>') +
        b('Notifikasi email', P.aman(r.notif_email || '—')) +
        b('Notifikasi WhatsApp', P.aman(r.notif_wa || '—')) +
      '</div>' +
      '<div>' +
        '<div class="panel-kartu" style="padding:var(--s-md)">' +
          '<span class="label-atas">Identitas Donatur</span>' +
          b('Nama', P.aman(r.nama) + (r.anonim ? ' <span class="tag-kecil">tampil anonim</span>' : '')) +
          b('Email', r.email ? '<a href="mailto:' + P.aman(r.email) + '">' + P.aman(r.email) + '</a>'
                             : '<span class="redup">—</span>') +
          b('WhatsApp', r.no_wa
            ? '<a href="' + P.aman(r.wa_url) + '" target="_blank" rel="noopener">' + P.aman(r.no_wa) + '</a>'
            : '<span class="redup">—</span>') +
          '<p class="mini redup" style="margin:.6rem 0 0">Data ini hanya terlihat setelah rincian dibuka, ' +
            'dan tidak pernah dikirim ke halaman publik.</p>' +
        '</div>' +

        (r.doa ? '<div class="panel-kartu" style="padding:var(--s-md);margin-top:var(--s-md)">' +
          '<span class="label-atas">Doa &amp; Harapan</span>' +
          '<p class="kecil" style="margin:.3rem 0 0;font-style:italic">“' + P.aman(r.doa) + '”</p>' +
          '<span class="mini redup">' + (r.tampilkan_doa ? 'Ditampilkan di halaman publik' :
            'Tidak ditampilkan di publik') + '</span></div>' : '') +

        (Object.keys(r.jawaban || {}).length
          ? '<div class="panel-kartu" style="padding:var(--s-md);margin-top:var(--s-md)">' +
            '<span class="label-atas">Isian Formulir</span>' +
            Object.keys(r.jawaban).map(function (k) {
              return b(k.replace(/_/g, ' '), P.aman(r.jawaban[k]));
            }).join('') + '</div>' : '') +

        '<div id="kotak-bukti"></div>' +
      '</div>' +
    '</div>';
  }

  function lihatBukti(id, tombol) {
    P.sibuk(tombol, true, 'Mengambil…');
    P.panggil('buktiUrl', { id: id }).then(function (b) {
      P.sibuk(tombol, false);
      var kotak = document.getElementById('kotak-bukti');
      var src = 'data:' + b.mime + ';base64,' + b.base64;

      kotak.innerHTML = '<div class="panel-kartu" style="padding:var(--s-md);margin-top:var(--s-md)">' +
        '<span class="label-atas">Bukti Transfer</span>' +
        (b.mime.indexOf('pdf') > -1
          ? '<a class="tombol tombol-lembut tombol-kecil" href="' + src + '" target="_blank" rel="noopener" ' +
            'download="' + P.aman(b.nama_file) + '">Buka PDF (' + P.angka(b.ukuran_kb) + ' KB)</a>'
          : '<img src="' + src + '" alt="Bukti transfer donasi ' + P.aman(id) + '" ' +
            'style="width:100%;border-radius:var(--r-sm);margin-top:.4rem">') +
        '<p class="mini redup" style="margin:.5rem 0 0">' + P.aman(b.nama_file) + ' · ' +
          P.angka(b.ukuran_kb) + ' KB. Pembukaan berkas ini tercatat di jejak aktivitas.</p>' +
      '</div>';
    }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }

  // ====================================================== Laporan & ekspor
  P.P.modul.laporan = function (wadah) {
    var kini = new Date();
    var awalBulan = new Date(kini.getFullYear(), kini.getMonth(), 1).toISOString().slice(0, 10);
    var hariIni = kini.toISOString().slice(0, 10);

    wadah.innerHTML =
      '<div class="panel-kartu">' +
        '<div class="kartu-kepala"><h2>Rekap Penerimaan</h2></div>' +
        '<div class="saring">' +
          '<label class="kecil redup">Dari <input type="date" id="l-dari" value="' + awalBulan + '"></label>' +
          '<label class="kecil redup">Sampai <input type="date" id="l-sampai" value="' + hariIni + '"></label>' +
          '<button type="button" class="tombol tombol-primer tombol-kecil" id="l-muat">Tampilkan rekap</button>' +
        '</div>' +
        '<div id="l-hasil">' + P.tunggu(4) + '</div>' +
      '</div>' +

      '<div class="panel-kartu">' +
        '<div class="kartu-kepala"><h2>Ekspor Data Donasi</h2></div>' +
        '<p class="kecil redup" style="margin-top:0">Berkas CSV terbuka langsung di Excel maupun ' +
          'Google Sheets. Rentang tanggal mengikuti pilihan di atas.</p>' +
        '<label class="centang" style="margin-bottom:var(--s-md)">' +
          '<input type="checkbox" id="l-kontak">' +
          '<span>Sertakan email dan nomor WhatsApp donatur. ' +
          '<b>Berkasnya memuat data pribadi</b> — simpan di tempat aman dan jangan dibagikan sembarangan.</span>' +
        '</label>' +
        '<button type="button" class="tombol tombol-lembut" id="l-unduh">Unduh CSV</button>' +
      '</div>';

    P.el('l-muat').addEventListener('click', muatRekap);
    P.el('l-unduh').addEventListener('click', function () { unduh(this); });
    return muatRekap();
  };

  function muatRekap() {
    var d = { dari: P.el('l-dari').value, sampai: P.el('l-sampai').value };
    P.el('l-hasil').innerHTML = P.tunggu(4);

    return P.panggil('laporanRekap', d).then(function (r) {
      P.el('l-hasil').innerHTML =
        '<div class="kpi-kisi" style="margin-bottom:var(--selang)">' +
          kotakKecil('Total diterima', P.rupiah(r.total)) +
          kotakKecil('Jumlah transaksi', P.angka(r.transaksi)) +
          kotakKecil('Rata-rata donasi', P.rupiah(r.rata_rata)) +
          kotakKecil('Donasi terbesar', P.rupiah(r.terbesar)) +
        '</div>' +
        (r.per_bulan.length
          ? '<h3 class="label-atas">Per Bulan</h3>' +
            P.grafikBatang(r.per_bulan.map(function (b) {
              return { label: b.bulan, nilai: b.nominal };
            }), { rupiah: true }) + '<div style="height:var(--s-lg)"></div>'
          : '') +
        (r.per_program.length
          ? '<h3 class="label-atas">Per Program</h3>' +
            P.grafikBatang(r.per_program.map(function (b) {
              return { label: b.judul + ' (' + b.transaksi + '×)', nilai: b.nominal };
            }), { rupiah: true })
          : P.kosong('diagram', 'Belum ada penerimaan pada rentang ini',
                     'Pilih rentang tanggal lain untuk melihat rekapnya.'));
    }).catch(P.galat);
  }

  function kotakKecil(label, nilai) {
    return '<div class="kpi"><span class="kpi-label">' + P.aman(label) + '</span>' +
      '<span class="kpi-nilai" style="font-size:1.25rem">' + nilai + '</span></div>';
  }

  function unduh(tombol) {
    P.sibuk(tombol, true, 'Menyiapkan…');
    P.panggil('exportDonasi', {
      dari: P.el('l-dari').value,
      sampai: P.el('l-sampai').value,
      kontak: P.el('l-kontak').checked
    }).then(function (h) {
      P.unduhTeks(h.nama_file, h.csv);
      P.toast(P.angka(h.jumlah_baris) + ' baris diunduh.', 'sukses');
      P.sibuk(tombol, false);
    }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }
})();
