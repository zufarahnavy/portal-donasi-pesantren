/* ============================================================================
   crm.js — CRM Kontak & Blast WhatsApp
   ----------------------------------------------------------------------------
   Dua halaman yang saling bersambung: dari CRM, kontak terpilih bisa langsung
   dibawa ke layar blast. Semua penyaringan tetap diulang di server, jadi
   daftar yang basi di browser tidak pernah membuat pesan terkirim ke orang
   yang sudah menolak dihubungi.
   ============================================================================ */

(function () {
  'use strict';

  var P = PANEL;

  var saring = { q: '', segmen: '', sumber: '', tag: '', status_wa: '', saring: '', page: 1 };
  var terpilih = {};
  var halamanKini = { item: [] };

  // ============================================================= CRM KONTAK
  P.P.modul.crm = function (wadah) {
    wadah.innerHTML =
      '<div id="crm-kpi">' + P.tunggu(2) + '</div>' +
      '<div class="panel-kartu">' +
        '<div class="kartu-kepala">' +
          '<h2>Daftar Kontak</h2>' +
          '<span class="aksi">' +
            '<button type="button" class="tombol tombol-lembut tombol-kecil" id="c-sinkron">↻ Sinkron sekarang</button>' +
            '<button type="button" class="tombol tombol-lembut tombol-kecil" id="c-ganda">Periksa duplikat</button>' +
            '<button type="button" class="tombol tombol-lembut tombol-kecil" id="c-impor">Impor CSV</button>' +
            '<button type="button" class="tombol tombol-lembut tombol-kecil" id="c-deteksi">Deteksi nomor WA</button>' +
          '</span>' +
        '</div>' +
        '<div class="saring">' +
          '<input type="search" class="tumbuh" id="c-q" placeholder="Cari nama, email, atau nomor…" ' +
            'aria-label="Cari kontak">' +
          '<select id="c-segmen" aria-label="Saring segmen"><option value="">Semua segmen</option></select>' +
          '<select id="c-statuswa" aria-label="Saring status WhatsApp">' +
            '<option value="">Semua nomor</option>' +
            '<option value="terdaftar">Terdaftar WhatsApp</option>' +
            '<option value="tidak">Tidak terdaftar</option>' +
          '</select>' +
          '<select id="c-khusus" aria-label="Saringan khusus">' +
            '<option value="">Tanpa saringan khusus</option>' +
            '<option value="belumCek">Belum diperiksa</option>' +
            '<option value="optout">Menolak dihubungi</option>' +
            '<option value="ganda">Kemungkinan duplikat</option>' +
            '<option value="emailTakValid">Email tidak valid</option>' +
            '<option value="takDihubungi">Tak bisa dihubungi</option>' +
          '</select>' +
          '<button type="button" class="tombol tombol-lembut tombol-kecil" id="c-reset">Bersihkan</button>' +
        '</div>' +
        '<div id="c-massal" hidden></div>' +
        '<div id="c-tabel">' + P.tunggu(6) + '</div>' +
      '</div>';

    pasang(wadah);
    return Promise.all([muatKpi(), muatDaftar()]);
  };

  function pasang(wadah) {
    var jeda = null;
    P.el('c-q').addEventListener('input', function (e) {
      clearTimeout(jeda);
      var v = e.target.value.trim();
      jeda = setTimeout(function () { saring.q = v; saring.page = 1; muatDaftar(); }, 350);
    });
    [['c-segmen', 'segmen'], ['c-statuswa', 'status_wa'], ['c-khusus', 'saring']].forEach(function (p) {
      P.el(p[0]).addEventListener('change', function (e) {
        saring[p[1]] = e.target.value; saring.page = 1; muatDaftar();
      });
    });
    P.el('c-reset').addEventListener('click', function () {
      saring = { q: '', segmen: '', sumber: '', tag: '', status_wa: '', saring: '', page: 1 };
      terpilih = {};
      P.buka('crm', true);
    });

    P.el('c-sinkron').addEventListener('click', function () { sinkron(this); });
    P.el('c-deteksi').addEventListener('click', function () { deteksi(this); });
    P.el('c-impor').addEventListener('click', impor);
    P.el('c-ganda').addEventListener('click', periksaGanda);

    wadah.addEventListener('click', function (e) {
      var hal = e.target.closest('.hal button[data-ke]');
      if (hal && !hal.disabled) { saring.page = Number(hal.getAttribute('data-ke')); muatDaftar(); return; }

      var kpi = e.target.closest('[data-kpi]');
      if (kpi) {
        saring.saring = kpi.getAttribute('data-kpi');
        saring.page = 1;
        P.el('c-khusus').value = saring.saring;
        muatDaftar();
        return;
      }

      var d = e.target.closest('[data-detail]');
      if (d) { detail(d.getAttribute('data-detail')); return; }

      var m = e.target.closest('[data-massal]');
      if (m) { aksiMassal(m.getAttribute('data-massal')); }
    });

    wadah.addEventListener('change', function (e) {
      if (e.target.matches('[data-pilih]')) {
        var id = e.target.getAttribute('data-pilih');
        if (e.target.checked) terpilih[id] = true; else delete terpilih[id];
        gambarMassal();
      }
      if (e.target.matches('#c-semua')) {
        halamanKini.item.forEach(function (k) {
          if (e.target.checked) terpilih[k.id] = true; else delete terpilih[k.id];
        });
        muatDaftar();
      }
    });
  }

  function muatKpi() {
    return P.panggil('crmStat', { _fresh: true }).then(function (d) {
      var r = d.ringkas;
      P.el('crm-kpi').innerHTML =
        '<div class="kpi-kisi">' +
          kotak('Total Kontak', P.angka(r.total),
                Object.keys(d.segmen).map(function (s) {
                  return P.aman(s) + ' ' + P.angka(d.segmen[s]);
                }).join(' · ') || 'Belum ada segmen') +
          kotakKlik('Terdaftar WhatsApp', P.angka(r.terdaftarWa),
                P.angka(r.belumCekWa) + ' belum diperiksa · ' + P.angka(r.tidakTerdaftarWa) + ' bukan WA',
                'belumCek') +
          kotak('Total Donasi Tercatat', P.rupiah(r.totalDonasi),
                P.angka(r.dihubungi30Hari) + ' kontak dihubungi 30 hari terakhir') +
          kotakKlik('Perlu Dibereskan', P.angka(r.ganda + r.optOut + r.takDapatDihubungi),
                P.angka(r.ganda) + ' duplikat · ' + P.angka(r.optOut) + ' menolak · ' +
                P.angka(r.takDapatDihubungi) + ' tanpa kontak', 'ganda') +
        '</div>' +
        '<p class="mini redup" style="margin:.5rem 0 0">Sinkron terakhir ' +
          (d.sinkronTerakhir ? P.jarakWaktu(new Date(d.sinkronTerakhir).toISOString()) : 'belum pernah') +
          '. Kontak baru dari donasi masuk seketika; sinkron penuh berjalan otomatis tiap 30 menit.</p>';
    });
  }

  function kotak(label, nilai, kaki) {
    return '<div class="kpi"><span class="kpi-label">' + P.aman(label) + '</span>' +
      '<span class="kpi-nilai">' + nilai + '</span>' +
      '<span class="kpi-kaki">' + kaki + '</span></div>';
  }

  function kotakKlik(label, nilai, kaki, saringan) {
    return '<button type="button" class="kpi kpi-klik" data-kpi="' + saringan + '">' +
      '<span class="kpi-label">' + P.aman(label) + '</span>' +
      '<span class="kpi-nilai">' + nilai + '</span>' +
      '<span class="kpi-kaki">' + kaki + '</span></button>';
  }

  function muatDaftar() {
    P.el('c-tabel').innerHTML = P.tunggu(6);
    return P.panggil('crmList', saring).then(function (d) {
      halamanKini = d;
      isiSegmen(d.facet.segmen);
      P.el('c-tabel').innerHTML = tabel(d);
      P.subJudul(P.angka(d.total) + ' kontak cocok dengan saringan ini');
      gambarMassal();
    }).catch(function (err) {
      P.galat(err);
      P.el('c-tabel').innerHTML = P.kosong('ingat', 'Gagal memuat kontak', err.message);
    });
  }

  function isiSegmen(facet) {
    var s = P.el('c-segmen');
    if (s.options.length > 1) return;
    Object.keys(facet).forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = k + ' (' + facet[k] + ')';
      s.appendChild(o);
    });
    s.value = saring.segmen;
  }

  function tabel(d) {
    if (!d.item.length) {
      return P.kosong('orangBanyak', 'Tidak ada kontak yang cocok',
        'Coba bersihkan saringan, atau tekan "Sinkron sekarang" bila data donasi baru belum muncul.');
    }

    var semuaTerpilih = d.item.every(function (k) { return terpilih[k.id]; });

    return '<div class="tabel-bungkus"><table class="tabel">' +
      '<thead><tr>' +
        '<th style="width:32px"><input type="checkbox" id="c-semua"' + (semuaTerpilih ? ' checked' : '') +
          ' aria-label="Pilih semua di halaman ini"></th>' +
        '<th>Nama</th><th>WhatsApp</th><th>Email</th><th>Segmen</th>' +
        '<th class="kanan">Donasi</th><th>Terakhir dihubungi</th><th></th>' +
      '</tr></thead><tbody>' +
      d.item.map(function (k) {
        var masalah = k.ganda || k.opt_out || !k.dapat_dihubungi;
        return '<tr' + (masalah ? ' class="baris-tanda"' : '') + '>' +
          '<td><input type="checkbox" data-pilih="' + P.aman(k.id) + '"' +
            (terpilih[k.id] ? ' checked' : '') + ' aria-label="Pilih ' + P.aman(k.nama) + '"></td>' +
          '<td><b>' + P.aman(k.nama) + '</b>' +
            (k.opt_out ? ' <span class="tag-kecil">menolak</span>' : '') +
            (k.ganda ? ' <span class="tag-kecil">duplikat</span>' : '') +
            (k.tag.length ? '<br>' + k.tag.map(function (t) {
              return '<span class="tag-kecil">' + P.aman(t) + '</span>';
            }).join('') : '') + '</td>' +
          '<td>' + (k.no_wa
            ? '<span class="mono">' + P.aman(k.no_wa) + '</span> ' + lencanaWa(k.status_wa)
            : '<span class="mini redup">—</span>') + '</td>' +
          '<td class="kecil">' + (k.email
            ? P.aman(k.email) + (k.email_valid ? '' : ' <span class="wa-lencana wa-tidak">cek</span>')
            : '<span class="redup">—</span>') + '</td>' +
          '<td class="kecil">' + P.aman(k.segmen) + '</td>' +
          '<td class="angka kanan">' + (k.total_donasi ? P.rupiah(k.total_donasi) : '—') + '</td>' +
          '<td class="kecil">' + (k.terakhir_dihubungi ? P.jarakWaktu(k.terakhir_dihubungi) : '—') +
            '<br><span class="mini redup">' + P.angka(k.jumlah_pesan) + ' pesan</span></td>' +
          '<td class="kanan"><button type="button" class="tombol tombol-lembut tombol-kecil" ' +
            'data-detail="' + P.aman(k.id) + '">Rincian</button></td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>' + P.paginasi(d, 'crm');
  }

  function lencanaWa(s) {
    if (s === 'terdaftar') return '<span class="wa-lencana wa-ya">✓ WA</span>';
    if (s === 'tidak') return '<span class="wa-lencana wa-tidak">bukan WA</span>';
    return '<span class="wa-lencana wa-belum">belum dicek</span>';
  }

  function gambarMassal() {
    var ids = Object.keys(terpilih);
    var w = P.el('c-massal');
    if (!w) return;
    if (!ids.length) { w.hidden = true; w.innerHTML = ''; return; }

    w.hidden = false;
    w.innerHTML = '<div class="pesan pesan-info" style="margin-bottom:var(--s-md);flex-wrap:wrap">' +
      '<b>' + P.angka(ids.length) + ' kontak dipilih</b>' +
      '<span style="display:flex;gap:.4rem;flex-wrap:wrap;margin-left:auto">' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" data-massal="blast">Kirim blast</button>' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" data-massal="tag">Beri tag</button>' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" data-massal="optout">Tandai menolak</button>' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" data-massal="optin">Boleh dihubungi</button>' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" data-massal="batal">Batal pilih</button>' +
      '</span></div>';
  }

  function aksiMassal(aksi) {
    var ids = Object.keys(terpilih);
    if (!ids.length) return;

    if (aksi === 'batal') { terpilih = {}; muatDaftar(); return; }

    if (aksi === 'blast') {
      var pilih = halamanKini.item.filter(function (k) { return terpilih[k.id] && k.no_wa; });
      if (!pilih.length) {
        P.toast('Kontak terpilih di halaman ini tidak punya nomor WhatsApp.', 'galat');
        return;
      }
      P.P.data.blastPenerima = pilih.map(function (k) { return { nama: k.nama, no_wa: k.no_wa }; });
      P.buka('blast', true);
      return;
    }

    if (aksi === 'tag') {
      var w = P.modal({
        judul: 'Beri Tag',
        isi: '<form id="form-tag">' + P.bidang({ nama: 'nilai', label: 'Nama tag', wajib: true,
              petunjuk: 'muhsinin tetap', bantu: 'Tag membantu menyaring penerima blast nanti.' }) + '</form>',
        kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
              '<button type="button" class="tombol tombol-primer" id="tag-ok">Terapkan ke ' +
                P.angka(ids.length) + ' kontak</button>'
      });
      w.querySelector('#tag-ok').addEventListener('click', function () {
        var nilai = P.nilaiForm(document.getElementById('form-tag')).nilai;
        if (!nilai) return;
        jalankanMassal('tag', nilai, this);
      });
      return;
    }

    var kalimat = aksi === 'optout'
      ? 'Kontak ini tidak akan pernah masuk daftar blast lagi. Notifikasi transaksional ' +
        '(ucapan terima kasih dan kuitansi donasi) tetap dikirim.'
      : 'Kontak ini boleh kembali menerima pesan blast.';

    P.konfirmasi(aksi === 'optout' ? 'Tandai menolak dihubungi?' : 'Boleh dihubungi kembali?',
      kalimat + ' Berlaku untuk ' + ids.length + ' kontak terpilih.',
      'Terapkan').then(function (ya) { if (ya) jalankanMassal(aksi, '', null); });
  }

  function jalankanMassal(aksi, nilai, tombol) {
    P.sibuk(tombol, true, 'Menerapkan…');
    P.panggil('crmMassal', { ids: Object.keys(terpilih), aksi: aksi, nilai: nilai })
      .then(function (h) {
        P.tutupModal();
        P.toast(P.angka(h.diubah) + ' kontak diperbarui.', 'sukses');
        terpilih = {};
        return Promise.all([muatKpi(), muatDaftar()]);
      })
      .catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }

  function sinkron(tombol) {
    P.sibuk(tombol, true, 'Menyinkronkan…');
    P.panggil('crmSinkron', {}).then(function (h) {
      P.toast(h.ditambah + ' kontak baru, ' + h.diperbarui + ' diperbarui.', 'sukses');
      P.sibuk(tombol, false);
      return Promise.all([muatKpi(), muatDaftar()]);
    }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }

  /** Periksa nomor 50 per putaran sampai habis, dengan laporan kemajuan. */
  function deteksi(tombol) {
    var total = 0;
    P.sibuk(tombol, true, 'Memeriksa…');

    function putaran() {
      return P.panggil('waValidasi', {}).then(function (h) {
        total += h.diperiksa || 0;
        if (h.diperiksa && h.sisa > 0) {
          tombol.innerHTML = 'Memeriksa… ' + P.angka(total) + ' nomor';
          return putaran();
        }
        P.toast(total ? P.angka(total) + ' nomor selesai diperiksa.' : 'Semua nomor sudah pernah diperiksa.',
                'sukses');
      });
    }

    putaran()
      .catch(function (e) {
        // Paket Fonnte tanpa fitur validate bukan kegagalan sistem — katakan apa adanya
        P.modal({
          judul: 'Pemeriksaan nomor tidak tersedia',
          isi: '<p style="margin:0">' + P.aman(e.message) + '</p>' +
               '<p class="kecil redup">Blast tetap bisa dijalankan. Bedanya, Anda mengirim ke seluruh ' +
               'nomor tanpa tahu lebih dulu mana yang terdaftar WhatsApp.</p>'
        });
      })
      .then(function () {
        P.sibuk(tombol, false);
        return Promise.all([muatKpi(), muatDaftar()]);
      });
  }

  function impor() {
    var w = P.modal({
      judul: 'Impor Kontak dari CSV',
      lebar: true,
      isi: '<p class="kecil redup" style="margin-top:0">Tempel data dari Excel atau Google Sheets. ' +
             'Satu kontak per baris, kolom dipisah koma, dengan urutan: ' +
             '<b>nama, nomor WhatsApp, email, segmen</b>. Email dan segmen boleh dikosongkan.</p>' +
           '<div class="kode-blok">Siti Khadijah,081234567890,siti@email.id,Jamaah\n' +
             'Ahmad Dahlan,081298765432,,Jamaah</div>' +
           '<div class="bidang" style="margin-top:var(--s-md)">' +
             '<label for="imp-teks">Data kontak</label>' +
             '<textarea id="imp-teks" rows="10" placeholder="Tempel di sini…"></textarea></div>' +
           '<div id="imp-hasil"></div>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="imp-ok">Impor kontak</button>'
    });

    w.querySelector('#imp-ok').addEventListener('click', function () {
      var tombol = this;
      var baris = document.getElementById('imp-teks').value.split(/\r?\n/)
        .map(function (b) { return b.trim(); }).filter(Boolean);

      if (!baris.length) { P.toast('Belum ada data yang ditempel.', 'galat'); return; }

      var rows = baris.map(function (b) {
        var k = b.split(',').map(function (x) { return x.trim(); });
        return { nama: k[0], no_wa: k[1], email: k[2], segmen: k[3] };
      });

      P.sibuk(tombol, true, 'Mengimpor…');
      P.panggil('crmImpor', { rows: rows }).then(function (h) {
        document.getElementById('imp-hasil').innerHTML =
          '<div class="pesan pesan-sukses" style="margin-top:var(--s-md)">' +
            '<b>' + P.angka(h.ditambah) + ' kontak diimpor.</b> ' +
            (h.ganda ? P.angka(h.ganda) + ' sudah ada sebelumnya. ' : '') +
            (h.jumlahDilewati ? P.angka(h.jumlahDilewati) + ' baris dilewati.' : '') +
          '</div>' +
          (h.dilewati.length
            ? '<div class="kode-blok" style="margin-top:.5rem">' + h.dilewati.map(function (x) {
                return 'Baris ' + x.baris + ': ' + x.sebab;
              }).join('\n') + '</div>'
            : '');
        P.sibuk(tombol, false);
        muatKpi(); muatDaftar();
      }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
    });
  }

  function periksaGanda() {
    var w = P.modal({ judul: 'Kontak Duplikat', lebar: true, isi: P.tunggu(4) });

    P.panggil('crmGanda', {}).then(function (d) {
      var isi = w.querySelector('.modal-isi');
      if (!d.grup.length) {
        isi.innerHTML = P.kosong('centang', 'Tidak ada duplikat',
          'Setiap nomor dan email hanya dipakai satu kontak.');
        return;
      }

      isi.innerHTML = '<p class="kecil redup" style="margin-top:0">Pilih satu kontak utama di tiap grup; ' +
        'tag, catatan, jumlah pesan, dan total donasi dari kontak lain ikut digabungkan ke sana.</p>' +
        d.grup.map(function (g, i) {
          return '<div class="panel-kartu" style="padding:var(--s-md);margin-bottom:var(--s-md)">' +
            '<b class="kecil">' + P.aman(g.kunci) + '</b>' +
            '<div class="daftar-pilih" style="margin:.5rem 0">' +
              g.item.map(function (k, j) {
                return '<label><input type="radio" name="utama-' + i + '" value="' + P.aman(k.id) + '"' +
                  (j === 0 ? ' checked' : '') + '>' +
                  '<span class="tumbuh"><b>' + P.aman(k.nama) + '</b> · ' + P.aman(k.segmen) +
                  ' · ' + P.angka(k.jumlah_pesan) + ' pesan · ' + P.rupiah(k.total_donasi) + '</span></label>';
              }).join('') +
            '</div>' +
            '<button type="button" class="tombol tombol-lembut tombol-kecil" data-gabung="' + i + '">' +
              'Gabungkan ' + g.item.length + ' kontak</button>' +
          '</div>';
        }).join('');

      isi.addEventListener('click', function (e) {
        var b = e.target.closest('[data-gabung]');
        if (!b) return;
        var i = Number(b.getAttribute('data-gabung'));
        var utama = isi.querySelector('input[name="utama-' + i + '"]:checked').value;
        var gabung = d.grup[i].item.map(function (k) { return k.id; })
                       .filter(function (id) { return id !== utama; });

        P.sibuk(b, true, 'Menggabungkan…');
        P.panggil('crmGabung', { utama: utama, gabung: gabung }).then(function () {
          P.toast('Kontak digabungkan.', 'sukses');
          P.tutupModal();
          muatKpi(); muatDaftar();
        }).catch(function (err) { P.galat(err); P.sibuk(b, false); });
      });
    }).catch(function (e) {
      w.querySelector('.modal-isi').innerHTML = P.kosong('ingat', 'Gagal memeriksa', e.message);
    });
  }

  function detail(id) {
    var w = P.modal({ judul: 'Rincian Kontak', lebar: true, isi: P.tunggu(5) });

    P.panggil('crmDetail', { id: id }).then(function (d) {
      var k = d.kontak;
      w.querySelector('.modal-isi').innerHTML =
        '<div class="panel-kisi-2" style="gap:var(--s-lg)">' +
          '<div>' +
            '<form id="form-kontak">' +
              P.bidang({ nama: 'nama', label: 'Nama', nilai: k.nama }) +
              P.bidang({ tipe: 'email', nama: 'email', label: 'Email', nilai: k.email }) +
              P.bidang({ nama: 'no_wa', label: 'Nomor WhatsApp', nilai: k.no_wa }) +
              P.bidang({ nama: 'tag', label: 'Tag', nilai: k.tag.join(', '),
                         bantu: 'Pisahkan dengan koma.' }) +
              P.bidang({ tipe: 'area', nama: 'catatan', label: 'Catatan internal',
                         nilai: k.catatan, baris: 3 }) +
              P.bidang({ tipe: 'saklar', nama: 'opt_out', label: 'Menolak menerima blast',
                         nilai: k.opt_out }) +
            '</form>' +
            '<div class="baris" style="gap:.4rem;flex-wrap:wrap">' +
              (k.wa_intl ? '<a class="tombol tombol-lembut tombol-kecil" target="_blank" rel="noopener" ' +
                'href="https://wa.me/' + P.aman(k.wa_intl) + '">Buka WhatsApp</a>' : '') +
              (k.email ? '<a class="tombol tombol-lembut tombol-kecil" href="mailto:' +
                P.aman(k.email) + '">Kirim email</a>' : '') +
              '<button type="button" class="tombol tombol-primer tombol-kecil" id="k-simpan">Simpan</button>' +
            '</div>' +
            '<div class="panel-kartu" style="padding:var(--s-md);margin-top:var(--s-md)">' +
              '<span class="label-atas">Catat Interaksi</span>' +
              '<div class="baris" style="gap:.4rem;flex-wrap:wrap;margin-top:.4rem">' +
                '<select id="i-kanal" style="flex:none;width:auto">' +
                  ['Telepon', 'WA Manual', 'Kunjungan', 'Surat', 'Catatan'].map(function (x) {
                    return '<option>' + x + '</option>';
                  }).join('') + '</select>' +
                '<input type="text" id="i-ringkas" placeholder="Ringkasan percakapan…" style="flex:1;min-width:160px">' +
                '<button type="button" class="tombol tombol-lembut tombol-kecil" id="i-simpan">Catat</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<div class="panel-kartu" style="padding:var(--s-md)">' +
              '<span class="label-atas">Ringkasan</span>' +
              ringkasKontak(k) +
            '</div>' +
            (d.donasi.length ? '<div class="panel-kartu" style="padding:var(--s-md);margin-top:var(--s-md)">' +
              '<span class="label-atas">Riwayat Donasi</span>' +
              d.donasi.slice(0, 8).map(function (x) {
                return '<div class="sela" style="padding:.35rem 0;border-bottom:1px dashed var(--garis)">' +
                  '<span class="kecil potong-1">' + P.aman(x.program) + '<br>' +
                  '<span class="mini redup">' + P.waktu(x.waktu) + '</span></span>' +
                  '<b class="kecil angka">' + P.rupiah(x.nominal) + '</b></div>';
              }).join('') + '</div>' : '') +
            '<div class="panel-kartu" style="padding:var(--s-md);margin-top:var(--s-md)">' +
              '<span class="label-atas">Riwayat Kontak</span>' +
              (d.interaksi.length ? d.interaksi.slice(0, 12).map(function (x) {
                return '<div style="padding:.35rem 0;border-bottom:1px dashed var(--garis)">' +
                  '<b class="mini">' + P.aman(x.kanal) + '</b> ' +
                  '<span class="mini redup">' + P.jarakWaktu(x.tanggal) + '</span>' +
                  '<div class="kecil">' + P.aman(x.ringkasan) + '</div></div>';
              }).join('') : '<p class="kecil redup" style="margin:.4rem 0 0">Belum ada riwayat.</p>') +
            '</div>' +
          '</div>' +
        '</div>';

      w.querySelector('#k-simpan').addEventListener('click', function () {
        var v = P.nilaiForm(document.getElementById('form-kontak'));
        v.id = k.id;
        P.sibuk(this, true, 'Menyimpan…');
        P.panggil('crmSimpan', v).then(function (h) {
          P.tutupModal();
          P.toast('Kontak diperbarui.', 'sukses');
          muatDaftar();
        }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#k-simpan'), false); });
      });

      w.querySelector('#i-simpan').addEventListener('click', function () {
        var ringkas = document.getElementById('i-ringkas').value.trim();
        if (!ringkas) { P.toast('Ringkasan interaksi belum diisi.', 'galat'); return; }
        P.sibuk(this, true, 'Mencatat…');
        P.panggil('crmInteraksi', {
          kontak_id: k.id, kanal: document.getElementById('i-kanal').value, ringkasan: ringkas
        }).then(function () {
          P.toast('Interaksi dicatat.', 'sukses');
          P.tutupModal();
          detail(k.id);
        }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#i-simpan'), false); });
      });
    }).catch(function (e) {
      w.querySelector('.modal-isi').innerHTML = P.kosong('ingat', 'Gagal memuat kontak', e.message);
    });
  }

  function ringkasKontak(k) {
    var b = function (l, v) {
      return '<div class="sela" style="padding:.35rem 0;border-bottom:1px dashed var(--garis)">' +
        '<span class="kecil redup">' + l + '</span><span class="kecil" style="font-weight:600">' + v + '</span></div>';
    };
    return b('Segmen', P.aman(k.segmen)) +
      b('Sumber data', P.aman(k.sumber)) +
      b('Status WhatsApp', lencanaWa(k.status_wa)) +
      b('Total donasi', P.rupiah(k.total_donasi)) +
      b('Pesan terkirim', P.angka(k.jumlah_pesan)) +
      b('Terakhir dihubungi', k.terakhir_dihubungi ? P.jarakWaktu(k.terakhir_dihubungi) : '—') +
      b('Masuk CRM', P.waktu(k.dibuat_pada));
  }

  // ============================================================ BLAST WA
  var penerimaBlast = [];
  var opsiBlast = { batch: 20, jeda: '5' };

  P.P.modul.blast = function (wadah) {
    if (P.P.data.blastPenerima) {
      penerimaBlast = P.P.data.blastPenerima;
      P.P.data.blastPenerima = null;
    }

    wadah.innerHTML =
      '<div id="blast-aktif"></div>' +
      '<div class="panel-kisi-2">' +
        '<div>' +
          '<div class="panel-kartu">' +
            '<div class="kartu-kepala"><h2>1 · Pilih Penerima</h2></div>' +
            '<div class="saring">' +
              '<select id="bl-sumber" aria-label="Sumber penerima">' +
                '<option value="crm">Dari CRM Kontak</option>' +
                '<option value="manual">Tempel nomor manual</option>' +
              '</select>' +
              '<select id="bl-segmen" aria-label="Segmen"><option value="">Semua segmen</option></select>' +
              '<select id="bl-statuswa" aria-label="Status WhatsApp">' +
                '<option value="">Semua nomor</option>' +
                '<option value="terdaftar">Hanya yang terdaftar WhatsApp</option>' +
              '</select>' +
              '<button type="button" class="tombol tombol-lembut tombol-kecil" id="bl-muat">Muat penerima</button>' +
            '</div>' +
            '<div id="bl-manual" hidden>' +
              '<div class="bidang"><label for="bl-teks">Satu baris satu nomor, format ' +
                '<span class="mono">08123456789|Nama</span></label>' +
                '<textarea id="bl-teks" rows="6"></textarea></div>' +
            '</div>' +
            '<div id="bl-ringkas"></div>' +
            '<div id="bl-daftar"></div>' +
          '</div>' +
        '</div>' +

        '<div>' +
          '<div class="panel-kartu">' +
            '<div class="kartu-kepala"><h2>2 · Tulis Pesan</h2></div>' +
            '<form id="form-blast">' +
              P.bidang({ nama: 'judul', label: 'Judul internal', wajib: true,
                         petunjuk: 'Laporan Triwulan I',
                         bantu: 'Hanya untuk catatan Anda, tidak ikut terkirim.' }) +
              P.bidang({ tipe: 'area', nama: 'pesan', label: 'Isi pesan', baris: 7, wajib: true,
                         nilai: 'Assalamu’alaikum {nama},\n\n',
                         bantu: 'Tulis {nama} untuk menyapa tiap penerima dengan namanya sendiri.' }) +
            '</form>' +
            '<div class="baris" style="gap:.4rem;flex-wrap:wrap;margin-bottom:var(--s-md)">' +
              ['{nama}', '{lembaga}', '{wa_admin}'].map(function (v) {
                return '<button type="button" class="tombol tombol-lembut tombol-kecil" data-sisip="' +
                  v + '">' + v + '</button>';
              }).join('') +
            '</div>' +
            '<span class="label-atas">Pratinjau</span>' +
            '<div class="wa-petak"><div class="pratinjau-wa" id="bl-pratinjau">—</div></div>' +
          '</div>' +

          '<div class="panel-kartu">' +
            '<div class="kartu-kepala"><h2>3 · Kecepatan Kirim</h2></div>' +
            '<p class="kecil redup" style="margin-top:0">Batch kecil dan jeda acak membuat nomor ' +
              'WhatsApp Anda jauh lebih aman dari pemblokiran.</p>' +
            '<div class="baris" style="gap:.6rem;flex-wrap:wrap;align-items:center">' +
              '<span class="seg" id="bl-batch">' +
                [10, 20, 50].map(function (n) {
                  return '<button type="button" data-batch="' + n + '" aria-pressed="' +
                    (n === opsiBlast.batch) + '">' + n + '</button>';
                }).join('') + '</span>' +
              '<label class="kecil redup">Jeda ' +
                '<input type="text" id="bl-jeda" value="' + opsiBlast.jeda + '" ' +
                'style="width:90px;display:inline-block" aria-label="Jeda antarpesan"></label>' +
              '<span class="mini redup">detik, boleh rentang seperti 3-8</span>' +
            '</div>' +
            '<p class="kecil" id="bl-perkiraan" style="margin:var(--s-md) 0 0"></p>' +
            '<button type="button" class="tombol tombol-primer tombol-penuh" id="bl-kirim" ' +
              'style="margin-top:var(--s-md)" disabled>Muat penerima dulu</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="panel-kartu"><div class="kartu-kepala"><h2>Riwayat Blast</h2></div>' +
        '<div id="bl-riwayat">' + P.tunggu(3) + '</div></div>';

    pasangBlast(wadah);
    if (penerimaBlast.length) { gambarPenerima(penerimaBlast); }
    perbaruiPratinjau();
    return muatRiwayat();
  };

  function pasangBlast(wadah) {
    P.el('bl-sumber').addEventListener('change', function (e) {
      P.el('bl-manual').hidden = e.target.value !== 'manual';
    });
    P.el('bl-muat').addEventListener('click', function () { muatPenerima(this); });
    P.el('bl-kirim').addEventListener('click', function () { kirim(this); });

    P.el('bl-batch').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-batch]');
      if (!b) return;
      opsiBlast.batch = Number(b.getAttribute('data-batch'));
      Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      perkiraan();
    });
    P.el('bl-jeda').addEventListener('input', function () {
      opsiBlast.jeda = this.value.trim();
      perkiraan();
    });

    var area = document.querySelector('#form-blast [name="pesan"]');
    area.addEventListener('input', perbaruiPratinjau);

    wadah.addEventListener('click', function (e) {
      var s = e.target.closest('[data-sisip]');
      if (s) {
        var v = s.getAttribute('data-sisip');
        var pos = area.selectionStart || area.value.length;
        area.value = area.value.slice(0, pos) + v + area.value.slice(pos);
        area.focus();
        area.selectionStart = area.selectionEnd = pos + v.length;
        perbaruiPratinjau();
        return;
      }
      var p = e.target.closest('[data-proses]');
      if (p) { prosesBatch(p.getAttribute('data-proses'), p); return; }
      var h = e.target.closest('[data-henti]');
      if (h) hentikan(h.getAttribute('data-henti'));
    });
  }

  function muatPenerima(tombol) {
    var sumber = P.el('bl-sumber').value;
    P.sibuk(tombol, true, 'Memuat…');

    P.panggil('blastPenerima', {
      sumber: sumber,
      segmen: P.el('bl-segmen').value,
      status_wa: P.el('bl-statuswa').value,
      teks: sumber === 'manual' ? P.el('bl-teks').value : ''
    }).then(function (d) {
      P.sibuk(tombol, false);

      // isi pilihan segmen sekali saja
      var s = P.el('bl-segmen');
      if (s.options.length === 1) {
        var seg = {};
        d.item.forEach(function (x) { seg[x.segmen] = (seg[x.segmen] || 0) + 1; });
        Object.keys(seg).forEach(function (k) {
          var o = document.createElement('option');
          o.value = k; o.textContent = k + ' (' + seg[k] + ')';
          s.appendChild(o);
        });
      }

      P.el('bl-ringkas').innerHTML = ringkasPenerima(d.ringkas, d.dipotong);
      gambarPenerima(d.item.filter(function (x) { return x.dipakai; }).map(function (x) {
        return { nama: x.nama, no_wa: x.no_wa, status_wa: x.status_wa };
      }));
    }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }

  function ringkasPenerima(r, dipotong) {
    return '<div class="baris" style="gap:.4rem;flex-wrap:wrap;margin-bottom:var(--s-md)">' +
      '<span class="tag-kecil">' + P.angka(r.dipakai) + ' akan dikirimi</span>' +
      '<span class="tag-kecil">' + P.angka(r.terdaftarWa) + ' terdaftar WA</span>' +
      '<span class="tag-kecil">' + P.angka(r.belumDicek) + ' belum dicek</span>' +
      '<span class="tag-kecil">' + P.angka(r.ganda) + ' nomor ganda dibuang</span>' +
      '<span class="tag-kecil">' + P.angka(r.optOut) + ' menolak dihubungi</span>' +
      (dipotong ? '<span class="tag-kecil">daftar dipotong di 3.000 baris</span>' : '') +
    '</div>';
  }

  function gambarPenerima(daftar) {
    penerimaBlast = daftar;
    P.el('bl-daftar').innerHTML = daftar.length
      ? '<div class="daftar-pilih">' + daftar.slice(0, 200).map(function (k) {
          return '<label style="cursor:default"><span class="tumbuh"><b>' + P.aman(k.nama) + '</b></span>' +
            '<span class="mono mini">' + P.aman(k.no_wa) + '</span> ' + lencanaWa(k.status_wa) + '</label>';
        }).join('') + '</div>' +
        (daftar.length > 200 ? '<p class="mini redup">Menampilkan 200 pertama dari ' +
          P.angka(daftar.length) + ' penerima.</p>' : '')
      : P.kosong('orangBanyak', 'Belum ada penerima', 'Tekan "Muat penerima" untuk menyusun daftarnya.');

    perkiraan();
    perbaruiPratinjau();
  }

  function perkiraan() {
    var n = penerimaBlast.length;
    var tombol = P.el('bl-kirim');
    if (!tombol) return;

    if (!n) {
      P.el('bl-perkiraan').textContent = '';
      tombol.disabled = true;
      tombol.textContent = 'Muat penerima dulu';
      return;
    }

    var putaran = Math.ceil(n / opsiBlast.batch);
    var jedaAngka = String(opsiBlast.jeda).split('-').map(Number);
    var rata = jedaAngka.length > 1 ? (jedaAngka[0] + jedaAngka[1]) / 2 : (jedaAngka[0] || 5);
    var menit = Math.max(1, Math.round(putaran * 5 + n * rata / 60));

    P.el('bl-perkiraan').innerHTML =
      '<b>' + P.angka(n) + ' penerima</b> → ' + putaran + ' batch, perkiraan selesai ± ' +
      P.angka(menit) + ' menit. Server mengirim satu batch tiap 5 menit, atau Anda bisa ' +
      'mempercepatnya lewat tombol “Kirim batch berikutnya”.';

    tombol.disabled = false;
    tombol.textContent = 'Mulai blast ke ' + P.angka(n) + ' nomor';
  }

  function perbaruiPratinjau() {
    var area = document.querySelector('#form-blast [name="pesan"]');
    var pra = P.el('bl-pratinjau');
    if (!area || !pra) return;

    var contoh = penerimaBlast[0] || { nama: 'Bapak/Ibu' };
    var teks = area.value
      .replace(/\{nama\}/g, contoh.nama)
      .replace(/\{lembaga\}/g, P.P.cfg.nama_pesantren || 'Pondok Pesantren')
      .replace(/\{wa_admin\}/g, P.P.cfg.no_wa_admin || '');

    pra.textContent = teks.trim() || 'Pratinjau muncul saat Anda mulai menulis.';
  }

  function kirim(tombol) {
    var v = P.nilaiForm(document.getElementById('form-blast'));
    if (!v.judul) { P.toast('Judul internal belum diisi.', 'galat'); return; }
    if (!v.pesan.trim()) { P.toast('Isi pesan belum ditulis.', 'galat'); return; }
    if (!penerimaBlast.length) { P.toast('Belum ada penerima.', 'galat'); return; }

    P.konfirmasi('Mulai blast ke ' + penerimaBlast.length + ' nomor?',
      'Pesan masuk antrean dan dikirim bertahap. Setelah dimulai, blast hanya bisa dihentikan ' +
      'untuk sisa nomor yang belum terkirim — pesan yang sudah sampai tidak bisa ditarik kembali.',
      'Mulai blast'
    ).then(function (ya) {
      if (!ya) return;
      P.sibuk(tombol, true, 'Menyusun antrean…');

      P.panggil('blastBuat', {
        judul: v.judul, pesan: v.pesan, ukuran_batch: opsiBlast.batch, jeda: opsiBlast.jeda,
        sasaran: P.el('bl-sumber').value === 'manual' ? 'Daftar manual'
                 : (P.el('bl-segmen').value || 'Semua segmen CRM'),
        penerima: penerimaBlast.map(function (k) { return { nama: k.nama, no_wa: k.no_wa }; })
      }).then(function (h) {
        P.sibuk(tombol, false);
        P.toast(h.total + ' pesan masuk antrean.', 'sukses');
        penerimaBlast = [];
        P.el('bl-daftar').innerHTML = '';
        perkiraan();
        muatRiwayat();
      }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
    });
  }

  function muatRiwayat() {
    return P.panggil('blastList', {}).then(function (d) {
      P.el('blast-aktif').innerHTML = d.berjalan.map(kartuBerjalan).join('');
      P.el('bl-riwayat').innerHTML = d.item.length
        ? '<div class="tabel-bungkus"><table class="tabel">' +
          '<thead><tr><th>Judul</th><th>Sasaran</th><th>Kemajuan</th><th>Status</th><th></th></tr></thead><tbody>' +
          d.item.map(function (b) {
            return '<tr>' +
              '<td><b>' + P.aman(b.judul) + '</b><br><span class="mini redup">' +
                P.waktu(b.dibuat_pada) + ' · ' + P.aman(b.dibuat_oleh) + '</span></td>' +
              '<td class="kecil">' + P.aman(b.sasaran) + '<br><span class="mini redup">batch ' +
                b.ukuran_batch + ' · jeda ' + P.aman(b.jeda_detik) + ' dtk</span></td>' +
              '<td style="min-width:150px"><span class="batang-rel"><span class="batang-isi" style="width:' +
                b.persen + '%"></span></span>' +
                '<span class="mini redup">' + P.angka(b.terkirim) + ' terkirim · ' +
                P.angka(b.gagal) + ' gagal · ' + P.angka(b.sisa) + ' sisa</span></td>' +
              '<td>' + statusBlast(b.status) + '</td>' +
              '<td class="kanan" style="white-space:nowrap">' +
                (b.status === 'berjalan'
                  ? '<button type="button" class="tombol tombol-lembut tombol-kecil" data-proses="' +
                      P.aman(b.id) + '">Kirim batch</button> ' +
                    '<button type="button" class="tombol tombol-lembut tombol-kecil" data-henti="' +
                      P.aman(b.id) + '">Hentikan</button>'
                  : '') + '</td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>'
        : P.kosong('obrolan', 'Belum ada blast', 'Riwayat pengiriman massal akan tampil di sini.');
    }).catch(P.galat);
  }

  function statusBlast(s) {
    if (s === 'berjalan') return P.lencana('Berjalan', 'emas');
    if (s === 'selesai') return P.lencana('Selesai', 'sukses');
    return P.lencana('Dihentikan', 'netral');
  }

  function kartuBerjalan(b) {
    return '<div class="panel-kartu" style="border-color:var(--emas);margin-bottom:var(--selang)">' +
      '<div class="sela" style="flex-wrap:wrap;gap:.5rem">' +
        '<div style="min-width:0">' +
          '<span class="label-atas">Blast sedang berjalan</span>' +
          '<b>' + P.aman(b.judul) + '</b>' +
          '<div class="mini redup">' + P.angka(b.terkirim) + ' dari ' + P.angka(b.total) +
            ' terkirim · ' + P.angka(b.gagal) + ' gagal · ' + P.angka(b.sisa) + ' menunggu</div>' +
        '</div>' +
        '<div style="white-space:nowrap">' +
          '<button type="button" class="tombol tombol-primer tombol-kecil" data-proses="' +
            P.aman(b.id) + '">Kirim batch berikutnya</button> ' +
          '<button type="button" class="tombol tombol-lembut tombol-kecil" data-henti="' +
            P.aman(b.id) + '">Hentikan</button>' +
        '</div>' +
      '</div>' +
      '<span class="batang-rel" style="margin-top:.6rem"><span class="batang-isi" style="width:' +
        b.persen + '%"></span></span>' +
      '<p class="mini redup" style="margin:.5rem 0 0">Server tetap mengirim satu batch tiap lima menit ' +
        'walaupun halaman ini ditutup.</p>' +
    '</div>';
  }

  function prosesBatch(id, tombol) {
    P.sibuk(tombol, true, 'Mengirim…');
    P.panggil('blastProses', { id: id }).then(function (h) {
      P.toast(h.diproses
        ? h.berhasil + ' terkirim, ' + h.gagal + ' gagal. Sisa ' + h.sisa + '.'
        : 'Tidak ada pesan tersisa pada blast ini.', 'sukses');
      P.sibuk(tombol, false);
      muatRiwayat();
    }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }

  function hentikan(id) {
    P.konfirmasi('Hentikan blast ini?',
      'Pesan yang sudah terkirim tidak bisa ditarik. Sisa nomor yang belum dikirimi akan dibatalkan.',
      'Hentikan', true).then(function (ya) {
      if (!ya) return;
      P.panggil('blastHenti', { id: id }).then(function (h) {
        P.toast(h.dibatalkan + ' pesan dibatalkan.', 'sukses');
        muatRiwayat();
      }).catch(P.galat);
    });
  }
})();
