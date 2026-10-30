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

  /**
   * Empat status, dan hanya dua di antaranya keputusan pengurus.
   *
   * "Menunggu" dan "Dikonfirmasi donatur" datang dengan sendirinya dari
   * perilaku donatur. "Terverifikasi" dan "Ditolak" tidak pernah terjadi
   * tanpa seseorang menekannya — dan keduanya mengubah angka yang tampil
   * di beranda, jadi keduanya selalu meminta konfirmasi lebih dulu.
   */
  var STATUS = [
    { nilai: 'Masuk',           label: 'Menunggu pencocokan', warna: 'ingat'  },
    { nilai: 'Dikonfirmasi WA', label: 'Dikonfirmasi donatur', warna: 'emas'  },
    { nilai: 'Terverifikasi',   label: 'Terverifikasi',        warna: 'sukses' },
    { nilai: 'Ditolak',         label: 'Ditolak',              warna: 'galat' }
  ];

  function statusInfo(nilai) {
    for (var i = 0; i < STATUS.length; i++) if (STATUS[i].nilai === String(nilai)) return STATUS[i];
    return { nilai: String(nilai || '—'), label: String(nilai || '—'), warna: 'netral' };
  }

  function lencanaStatus(nilai) {
    var s = statusInfo(nilai);
    return P.lencana(s.label, s.warna);
  }

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
            STATUS.map(function (s) {
              return '<option value="' + P.aman(s.nilai) + '">' + P.aman(s.label) + '</option>';
            }).join('') +
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

      // Butir menu tindakan diperiksa lebih dulu, sebelum klik baris —
      // kalau tidak, menekan "Hapus" juga akan membuka rincian di belakangnya.
      var butir = e.target.closest('[data-aksi][data-id]');
      if (butir) {
        e.stopPropagation();
        jalankanAksi(butir.getAttribute('data-aksi'), butir.getAttribute('data-id'));
        return;
      }
      if (e.target.closest('.menu-aksi')) return;

      var baris = e.target.closest('tr[data-id]');
      if (baris) rincian(baris.getAttribute('data-id'));
    });
  }

  // ====================================================== Putusan atas donasi

  /**
   * Satu pintu untuk seluruh tindakan baris, dipanggil baik dari menu "⋯"
   * di tabel maupun dari tombol di dalam modal rincian. Dengan begitu
   * kalimat konfirmasinya tidak pernah berbeda antara dua tempat itu.
   */
  function jalankanAksi(aksi, id) {
    if (aksi === 'rincian')     return rincian(id);
    if (aksi === 'kuitansi')    return rincian(id);
    if (aksi === 'verifikasi')  return ubahStatus(id, 'Terverifikasi');
    if (aksi === 'tolak')       return ubahStatus(id, 'Ditolak');
    if (aksi === 'menunggu')    return ubahStatus(id, 'Masuk');
    if (aksi === 'hapus')       return hapus(id);
  }

  function ubahStatus(id, status) {
    if (status === 'Ditolak') return tanyaPenolakan(id);

    var kalimat = status === 'Terverifikasi'
      ? 'Donasi ' + id + ' akan dihitung sebagai dana yang benar-benar masuk, dan ' +
        'angka pada program terkait langsung bertambah di halaman publik. Pastikan ' +
        'nominalnya sudah Anda cocokkan dengan mutasi rekening.'
      : 'Donasi ' + id + ' dikembalikan ke status menunggu pencocokan.';

    P.konfirmasi(status === 'Terverifikasi' ? 'Tandai sudah terverifikasi?' : 'Kembalikan ke menunggu?',
                 kalimat, status === 'Terverifikasi' ? 'Ya, verifikasi' : 'Kembalikan')
      .then(function (ya) { if (ya) kirimStatus(id, status, ''); });
  }

  /** Penolakan selalu meminta alasan — backend pun menolak tanpa itu. */
  function tanyaPenolakan(id) {
    var w = P.modal({
      judul: 'Tolak donasi ' + id + '?',
      isi: '<p style="margin:0 0 var(--s-md)">Donasi ini tidak akan dihitung ke progres program, ' +
             'bahkan bila donaturnya kemudian mengunggah bukti atau menekan tombol konfirmasi. ' +
             'Barisnya tetap tersimpan sebagai catatan.</p>' +
           '<form id="form-tolak">' +
             P.bidang({ nama: 'catatan', label: 'Alasan penolakan', tipe: 'area', baris: 3, wajib: true,
                        petunjuk: 'Dana tidak pernah masuk ke rekening; sudah dikonfirmasi ke donatur.',
                        bantu: 'Tersimpan pada baris donasi dan jejak aktivitas, supaya pengurus ' +
                               'lain tidak perlu menebak di kemudian hari.' }) +
           '</form>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-bahaya" id="tolak-ok">Tolak donasi</button>'
    });

    w.querySelector('#tolak-ok').addEventListener('click', function () {
      var catatan = String(P.nilaiForm(document.getElementById('form-tolak')).catatan || '').trim();
      if (!catatan) {
        P.toast('Alasan penolakan masih kosong.', 'galat');
        document.getElementById('f-catatan').focus();
        return;
      }
      kirimStatus(id, 'Ditolak', catatan, this);
    });
  }

  function kirimStatus(id, status, catatan, tombol) {
    return P.denganSibuk(tombol, 'Menyimpan…', function () {
      return P.panggil('donasiStatus', { id: id, status: status, catatan: catatan });
    }).then(function (h) {
      P.tutupModal();
      P.toast('Donasi ' + id + ' ditandai "' + statusInfo(status).label.toLowerCase() + '".', 'sukses');
      return muat();
    }).catch(P.galat);
  }

  function hapus(id) {
    if (P.P.sesi.me.peran !== 'SUPERADMIN') {
      P.modal({
        judul: 'Penghapusan khusus Superadmin',
        isi: '<p style="margin:0">Menghapus donasi berarti membuang catatan keuangan, jadi ' +
             'hanya Superadmin yang bisa melakukannya.</p>' +
             '<p class="kecil redup">Untuk donasi yang uangnya memang tidak pernah masuk, ' +
             'pilih <b>Tolak donasi</b>. Efeknya pada angka program sama persis — bedanya ' +
             'jejaknya tetap utuh dan bisa ditinjau ulang kapan saja.</p>'
      });
      return;
    }

    var w = P.modal({
      judul: 'Hapus donasi ' + id + '?',
      isi: '<p style="margin:0 0 var(--s-md)">Barisnya dibuang dari database dan angka program ' +
             'dihitung ulang. Bukti transfer serta kuitansinya dipindahkan ke tempat sampah Google ' +
             'Drive, jadi masih bisa dipulihkan selama 30 hari.</p>' +
           '<div class="pesan pesan-ingat" style="margin-bottom:var(--s-md)">Bila yang Anda maksud ' +
             'adalah donasi yang uangnya tidak masuk, <b>Tolak donasi</b> lebih tepat: angkanya ' +
             'sama-sama tidak dihitung, tetapi catatannya tidak hilang.</div>' +
           '<form id="form-hapus">' +
             P.bidang({ nama: 'alasan', label: 'Alasan penghapusan', tipe: 'area', baris: 2, wajib: true,
                        petunjuk: 'Donasi percobaan saat pengujian sistem.',
                        bantu: 'Disalin ke jejak aktivitas bersama nama, nominal, dan programnya.' }) +
           '</form>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-bahaya" id="hapus-ok">Hapus permanen</button>'
    });

    w.querySelector('#hapus-ok').addEventListener('click', function () {
      var alasan = String(P.nilaiForm(document.getElementById('form-hapus')).alasan || '').trim();
      if (!alasan) {
        P.toast('Alasan penghapusan masih kosong.', 'galat');
        document.getElementById('f-alasan').focus();
        return;
      }
      var t = this;
      P.denganSibuk(t, 'Menghapus…', function () {
        return P.panggil('donasiHapus', { id: id, alasan: alasan });
      }).then(function () {
        P.tutupModal();
        P.toast('Donasi ' + id + ' dihapus.', 'sukses');
        return muat();
      }).catch(P.galat);
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
      '<span class="tag-kecil">' + P.angka(r.terverifikasi || 0) + ' terverifikasi</span>' +
      '<span class="tag-kecil">' + P.angka(r.terkonfirmasi) + ' dikonfirmasi donatur</span>' +
      '<span class="tag-kecil">' + P.angka(r.menunggu) + ' menunggu</span>' +
      (r.ditolak ? '<span class="tag-kecil tag-galat">' + P.angka(r.ditolak) + ' ditolak</span>' : '') +
    '</div>';
  }

  function tabel(d) {
    if (!d.item.length) {
      return P.kosong('cari', 'Tidak ada donasi yang cocok',
        'Coba ubah kata kunci, rentang tanggal, atau pilihan program.');
    }

    var sa = P.P.sesi.me.peran === 'SUPERADMIN';

    return '<div class="tabel-bungkus"><table class="tabel">' +
      '<thead><tr>' +
        '<th>Nomor &amp; Waktu</th><th>Donatur</th><th>Program</th>' +
        '<th class="kanan">Nominal</th><th>Status</th><th>Bukti</th>' +
        '<th class="kolom-aksi"><span class="sr-only">Tindakan</span></th>' +
      '</tr></thead><tbody>' +
      d.item.map(function (r) {
        var st = String(r.status);
        return '<tr data-id="' + P.aman(r.id) + '" style="cursor:pointer" ' +
          'title="Klik untuk melihat rincian">' +
          '<td><span class="mono">' + P.aman(r.id) + '</span><br>' +
            '<span class="mini redup">' + P.waktu(r.waktu) + '</span></td>' +
          '<td><b>' + P.aman(r.nama) + '</b>' + (r.anonim ? ' <span class="tag-kecil">anonim</span>' : '') +
            '<br><span class="mini redup">' + P.aman(r.wa_samar || r.email_samar || '—') + '</span></td>' +
          '<td class="kecil">' + P.aman(r.program) + '</td>' +
          '<td class="angka kanan"><b>' + P.rupiah(r.nominal) + '</b></td>' +
          '<td>' + lencanaStatus(st) + '</td>' +
          '<td>' + (r.adaBukti ? P.lencana('Ada', 'emas') : '<span class="mini redup">—</span>') +
            (r.adaKuitansi ? ' ' + P.lencana('Kuitansi', 'sukses') : '') + '</td>' +
          '<td class="kolom-aksi">' + P.menuAksi(r.id, [
            { aksi: 'rincian', label: 'Lihat rincian', ikon: 'mata' },
            { pisah: true },
            { aksi: 'verifikasi', label: 'Tandai terverifikasi', ikon: 'ceklis',
              nonaktif: st === 'Terverifikasi',
              judul: 'Hitung donasi ini sebagai dana yang benar-benar masuk' },
            { aksi: 'tolak', label: 'Tolak donasi', ikon: 'silang',
              nonaktif: st === 'Ditolak',
              judul: 'Jangan hitung donasi ini; wajib disertai alasan' },
            { aksi: 'menunggu', label: 'Kembalikan ke menunggu', ikon: 'jeda',
              nonaktif: st === 'Masuk' },
            { pisah: true },
            { aksi: 'hapus', label: 'Hapus donasi', ikon: 'sampah', bahaya: true,
              judul: sa ? 'Membuang baris ini dari database'
                        : 'Khusus Superadmin' }
          ]) + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>' + P.paginasi(d, 'donasi');
  }

  // ====================================================== Rincian donasi
  function rincian(id) {
    var w = P.modal({ judul: 'Rincian Donasi', lebar: true, isi: P.tunggu(5) });

    P.panggil('donasiDetail', { id: id }).then(function (r) {
      w.querySelector('.modal-isi').innerHTML = isiRincian(r);
      var st = String(r.status);
      w.querySelector('.modal-kaki').innerHTML =
        '<button type="button" class="tombol tombol-lembut" data-tutup>Tutup</button>' +
        P.menuAksi(r.id, [
          { aksi: 'verifikasi', label: 'Tandai terverifikasi', ikon: 'ceklis', nonaktif: st === 'Terverifikasi' },
          { aksi: 'tolak', label: 'Tolak donasi', ikon: 'silang', nonaktif: st === 'Ditolak' },
          { aksi: 'menunggu', label: 'Kembalikan ke menunggu', ikon: 'jeda', nonaktif: st === 'Masuk' },
          { pisah: true },
          { aksi: 'hapus', label: 'Hapus donasi', ikon: 'sampah', bahaya: true }
        ]) +
        (r.adaBukti ? '<button type="button" class="tombol tombol-lembut" data-bukti>Lihat bukti transfer</button>' : '') +
        '<button type="button" class="tombol tombol-primer" data-kuitansi>' +
          (r.adaKuitansi ? 'Buat ulang kuitansi' : 'Terbitkan kuitansi') + '</button>';

      // Modal punya penangan sendiri karena isinya berada di luar #isi.
      w.querySelector('.modal-kaki').addEventListener('click', function (e) {
        var butir = e.target.closest('[data-aksi][data-id]');
        if (butir) jalankanAksi(butir.getAttribute('data-aksi'), butir.getAttribute('data-id'));
      });

      w.querySelector('[data-kuitansi]').addEventListener('click', function () {
        var t = this;
        P.denganSibuk(t, 'Menyusun PDF…', function () {
          return P.panggil('kuitansiBuat', { id: r.id });
        }).then(function (h) {
          P.toast('Kuitansi siap diunduh.', 'sukses');
          window.open(h.unduh, '_blank', 'noopener');
        }).catch(P.galat);
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
        b('Status', lencanaStatus(r.status)) +
        (r.catatan_pengurus
          ? b('Catatan pengurus', '<span class="kecil" style="font-weight:400">' +
              P.aman(r.catatan_pengurus) + '</span>')
          : '') +
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
