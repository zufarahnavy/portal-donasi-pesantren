/* ============================================================================
   sistem.js — Identitas & pengaturan, notifikasi, akun panel, jejak aktivitas,
               status sistem, migrasi skema, dan impor dari aplikasi lama
   ============================================================================ */

(function () {
  'use strict';

  var P = PANEL;

  // ================================================ IDENTITAS & PENGATURAN
  var GRUP_LABEL = {
    identitas: 'Identitas Lembaga',
    kontak: 'Kontak & Alamat',
    pembayaran: 'Rekening & QRIS',
    donasi: 'Aturan Donasi',
    tampilan: 'Tampilan Situs',
    notifikasi: 'Notifikasi',
    kuitansi: 'Kuitansi',
    sistem: 'Sistem',
    crm: 'CRM',
    lain: 'Lainnya'
  };

  P.P.modul.pengaturan = function (wadah) {
    return P.panggil('pengaturanList', { _fresh: true }).then(function (d) {
      var grup = d.grup;
      wadah.innerHTML =
        '<form id="form-set">' +
        Object.keys(grup).sort().map(function (g) {
          return '<div class="panel-kartu">' +
            '<div class="kartu-kepala"><h2>' + P.aman(GRUP_LABEL[g] || g) + '</h2></div>' +
            '<div class="kisi kisi-2">' +
              grup[g].map(bidangSetting).join('') +
            '</div>' +
          '</div>';
        }).join('') +
        '</form>' +

        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Gambar Situs</h2></div>' +
          '<p class="kecil redup" style="margin-top:0">Unggah di sini, alamatnya langsung tersimpan ' +
            'ke pengaturan yang bersangkutan. Maksimal 3 MB, format JPG, PNG, WEBP, atau SVG.</p>' +
          '<div class="baris" style="gap:.5rem;flex-wrap:wrap">' +
            [['logo_url', 'Logo'], ['favicon_url', 'Favicon'], ['qris_url', 'Gambar QRIS']]
              .map(function (a) {
                return '<button type="button" class="tombol tombol-lembut tombol-kecil" ' +
                  'data-aset="' + a[0] + '">Unggah ' + a[1] + '</button>';
              }).join('') +
          '</div>' +
        '</div>' +

        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Kunci Rahasia</h2></div>' +
          '<p class="kecil redup" style="margin-top:0">Nilainya disimpan di Script Properties, ' +
            'bukan di spreadsheet, dan tidak pernah dikirim utuh ke browser — yang tampil hanya ' +
            'potongan awal dan akhir.</p>' +
          Object.keys(d.rahasia).map(function (k) {
            var r = d.rahasia[k];
            return '<div class="sela" style="padding:.6rem 0;border-bottom:1px dashed var(--garis);flex-wrap:wrap;gap:.5rem">' +
              '<span class="lajur" style="min-width:0">' +
                '<b class="kecil mono">' + P.aman(k) + '</b>' +
                '<span class="mini redup">' + (r.ada ? P.aman(r.samar) : 'belum diisi') + '</span>' +
              '</span>' +
              '<span style="white-space:nowrap">' +
                '<button type="button" class="tombol tombol-lembut tombol-kecil" data-rahasia="' +
                  P.aman(k) + '">' + (r.ada ? 'Ganti' : 'Isi') + '</button>' +
                (r.ada ? ' <button type="button" class="tombol tombol-lembut tombol-kecil" ' +
                  'data-hapus-rahasia="' + P.aman(k) + '">Hapus</button>' : '') +
              '</span>' +
            '</div>';
          }).join('') +
        '</div>' +

        '<div class="panel-kartu" style="position:sticky;bottom:var(--s-md)">' +
          '<button type="button" class="tombol tombol-primer tombol-penuh" id="set-simpan">' +
            'Simpan semua pengaturan</button>' +
        '</div>';

      P.el('set-simpan').addEventListener('click', function () { simpanSetting(this, grup); });

      wadah.addEventListener('click', function (e) {
        var a = e.target.closest('[data-aset]');
        if (a) { unggahAset(a.getAttribute('data-aset')); return; }
        var r = e.target.closest('[data-rahasia]');
        if (r) { isiRahasia(r.getAttribute('data-rahasia')); return; }
        var h = e.target.closest('[data-hapus-rahasia]');
        if (h) hapusRahasia(h.getAttribute('data-hapus-rahasia'));
      });
    });
  };

  function bidangSetting(s) {
    var t = String(s.tipe || 'teks');
    if (t === 'saklar') {
      return P.bidang({ tipe: 'saklar', nama: s.key, label: labelKunci(s.key),
                        bantu: s.keterangan, nilai: String(s.value) === 'true' });
    }
    if (t === 'json' || String(s.value || '').length > 90) {
      return P.bidang({ tipe: 'area', nama: s.key, label: labelKunci(s.key),
                        bantu: s.keterangan, nilai: s.value, baris: 3 });
    }
    if (t === 'angka') {
      return P.bidang({ tipe: 'number', nama: s.key, label: labelKunci(s.key),
                        bantu: s.keterangan, nilai: s.value });
    }
    return P.bidang({ nama: s.key, label: labelKunci(s.key), bantu: s.keterangan, nilai: s.value });
  }

  function labelKunci(k) {
    return String(k).replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function simpanSetting(tombol, grup) {
    var v = P.nilaiForm(document.getElementById('form-set'));
    var kirim = {};
    Object.keys(grup).forEach(function (g) {
      grup[g].forEach(function (s) {
        if (v[s.key] !== undefined) kirim[s.key] = v[s.key];
      });
    });

    P.sibuk(tombol, true, 'Menyimpan…');
    P.panggil('pengaturanSimpan', { pengaturan: kirim }).then(function (h) {
      P.toast('Pengaturan disimpan.', 'sukses');
      API.bersihkanCache && API.bersihkanCache();
      P.sibuk(tombol, false);
    }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }

  function unggahAset(kunci) {
    var w = P.modal({
      judul: 'Unggah ' + labelKunci(kunci),
      isi: '<div class="bidang"><label for="as-berkas">Pilih gambar</label>' +
           '<input type="file" id="as-berkas" accept="image/*"></div>' +
           '<div id="as-pratinjau"></div>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="as-ok">Unggah</button>'
    });

    w.querySelector('#as-ok').addEventListener('click', function () {
      var tombol = this;
      var f = document.getElementById('as-berkas').files[0];
      if (!f) { P.toast('Pilih gambar dulu.', 'galat'); return; }

      P.sibuk(tombol, true, 'Mengunggah…');
      P.bacaBerkas(f, 3).then(function (b) {
        return P.panggil('asetUnggah', {
          kunci: kunci, jenis: 'gambar', nama: kunci,
          base64: b.base64, mimeType: b.mimeType
        });
      }).then(function (h) {
        P.tutupModal();
        P.toast('Gambar diunggah dan tersimpan ke pengaturan.', 'sukses');
        API.bersihkanCache && API.bersihkanCache();
        P.buka('pengaturan', true);
      }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
    });
  }

  function isiRahasia(kunci) {
    var w = P.modal({
      judul: labelKunci(kunci),
      isi: '<div class="bidang"><label for="rh-nilai">Nilai baru</label>' +
           '<input type="password" id="rh-nilai" autocomplete="off" spellcheck="false">' +
           '<span class="bantu">Nilai lama tidak bisa dibaca kembali dari panel. ' +
           'Yang Anda ketik di sini langsung menggantikannya.</span></div>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="rh-ok">Simpan</button>'
    });

    w.querySelector('#rh-ok').addEventListener('click', function () {
      var nilai = document.getElementById('rh-nilai').value.trim();
      if (!nilai) { P.toast('Nilai belum diisi.', 'galat'); return; }
      P.sibuk(this, true, 'Menyimpan…');
      P.panggil('rahasiaSimpan', { kunci: kunci, nilai: nilai }).then(function () {
        P.tutupModal();
        P.toast('Kunci rahasia diperbarui.', 'sukses');
        P.buka('pengaturan', true);
      }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#rh-ok'), false); });
    });
  }

  function hapusRahasia(kunci) {
    P.konfirmasi('Hapus ' + labelKunci(kunci) + '?',
      'Fitur yang bergantung pada kunci ini berhenti bekerja sampai diisi kembali.',
      'Hapus', true).then(function (ya) {
      if (!ya) return;
      P.panggil('rahasiaSimpan', { kunci: kunci, nilai: '__HAPUS__' }).then(function () {
        P.toast('Kunci dihapus.', 'sukses');
        P.buka('pengaturan', true);
      }).catch(P.galat);
    });
  }

  // ========================================================== NOTIFIKASI
  var tabNotif = 'matriks';

  P.P.modul.notifikasi = function (wadah) {
    return P.panggil('notifTemplate', { _fresh: true }).then(function (d) {
      wadah.innerHTML =
        kartuSaluran(d) +
        '<div class="panel-kartu">' +
          '<div class="tab-pil" id="n-tab" role="tablist">' +
            [['matriks', 'Kejadian Otomatis'], ['template', 'Isi Pesan'], ['antrean', 'Antrean Kirim']]
              .map(function (t) {
                return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' +
                  (t[0] === tabNotif) + '">' + t[1] + '</button>';
              }).join('') +
          '</div>' +
          '<div id="n-isi" style="margin-top:var(--s-md)"></div>' +
        '</div>';

      gambarTabNotif(d);

      P.el('n-tab').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-tab]');
        if (!b) return;
        tabNotif = b.getAttribute('data-tab');
        Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) {
          x.setAttribute('aria-selected', String(x === b));
        });
        gambarTabNotif(d);
      });

      wadah.addEventListener('click', function (e) {
        var t = e.target.closest('[data-tes]');
        if (t) { tesKirim(t.getAttribute('data-tes')); return; }
        var u = e.target.closest('[data-tpl]');
        if (u) { suntingTemplate(d, u.getAttribute('data-tpl')); return; }
        var p = e.target.closest('#n-proses');
        if (p) prosesAntrean(p);
      });

      wadah.addEventListener('change', function (e) {
        var s = e.target.closest('[data-matriks]');
        if (s) ubahMatriks(s.getAttribute('data-matriks'), s.checked, s);
      });
    });
  };

  function kartuSaluran(d) {
    var f = d.fonnte;
    var perangkat = f.perangkat;

    return '<div class="kpi-kisi" style="margin-bottom:var(--selang)">' +
      '<div class="kpi"><span class="kpi-label">Email Donatur</span>' +
        '<span class="kpi-nilai" style="font-size:1.125rem">' +
          (d.saklar.email_donatur ? 'Aktif' : 'Nonaktif') + '</span>' +
        '<span class="kpi-kaki">Sisa kuota Google hari ini: ' +
          (d.email.kuota_tersisa >= 0 ? P.angka(d.email.kuota_tersisa) : 'tidak terbaca') + '</span></div>' +

      '<div class="kpi"><span class="kpi-label">Email Pengelola</span>' +
        '<span class="kpi-nilai" style="font-size:1.125rem">' +
          (d.saklar.email_admin ? 'Aktif' : 'Nonaktif') + '</span>' +
        '<span class="kpi-kaki">Dikirim ke ' + P.aman(d.email.tujuan_admin) + '</span></div>' +

      '<div class="kpi"><span class="kpi-label">WhatsApp (Fonnte)</span>' +
        '<span class="kpi-nilai" style="font-size:1.125rem">' +
          (d.saklar.wa_aktif ? 'Aktif' : 'Nonaktif') + '</span>' +
        '<span class="kpi-kaki">' + (f.terpasang
          ? 'Token ' + P.aman(f.token_samar) +
            (perangkat && perangkat.nomor
              ? ' · ' + P.aman(perangkat.nomor) + ' (' + P.aman(perangkat.status) + ')'
              : perangkat && perangkat.error ? ' · ' + P.aman(perangkat.error) : '')
          : 'Token Fonnte belum diisi') + '</span></div>' +

      '<div class="kpi"><span class="kpi-label">Uji Pengiriman</span>' +
        '<div class="baris" style="gap:.4rem;margin-top:.3rem">' +
          '<button type="button" class="tombol tombol-lembut tombol-kecil" data-tes="email">Tes email</button>' +
          '<button type="button" class="tombol tombol-lembut tombol-kecil" data-tes="wa">Tes WA</button>' +
        '</div>' +
        '<span class="kpi-kaki">Saklar email dan WhatsApp diatur di menu Identitas &amp; Pengaturan.</span></div>' +
    '</div>';
  }

  function gambarTabNotif(d) {
    var isi = P.el('n-isi');

    if (tabNotif === 'matriks') {
      isi.innerHTML =
        '<p class="kecil redup" style="margin-top:0">Matikan satu kejadian untuk berhenti mengirim ' +
          'pesan jenis itu, tanpa mematikan seluruh kanal email atau WhatsApp.</p>' +
        '<div class="tabel-bungkus"><table class="tabel">' +
        '<thead><tr><th>Kejadian</th><th>Pemicu</th><th>Penerima</th><th>Kanal</th><th>Aktif</th></tr></thead><tbody>' +
        d.matriks.map(function (m) {
          return '<tr>' +
            '<td><b>' + P.aman(m.label) + '</b><br><span class="mini redup mono">' + P.aman(m.kode) + '</span></td>' +
            '<td class="kecil">' + P.aman(m.pemicu) + '</td>' +
            '<td class="kecil">' + P.aman(m.penerima) + '</td>' +
            '<td>' + P.lencana(m.kanal === 'wa' ? 'WhatsApp' : 'Email', m.kanal === 'wa' ? 'sukses' : 'netral') + '</td>' +
            '<td><label class="saklar"><input type="checkbox" data-matriks="' + P.aman(m.kode) + '"' +
              (m.aktif ? ' checked' : '') + '><span class="saklar-rel"></span></label></td>' +
          '</tr>';
        }).join('') + '</tbody></table></div>';

    } else if (tabNotif === 'template') {
      isi.innerHTML =
        '<p class="kecil redup" style="margin-top:0">Variabel yang tersedia: ' +
          d.variabel.map(function (v) { return '<span class="tag-kecil">{' + v + '}</span>'; }).join('') + '</p>' +
        d.template.map(function (t) {
          return '<div class="panel-kartu" style="padding:var(--s-md);margin-bottom:var(--s-md)">' +
            '<div class="sela" style="flex-wrap:wrap;gap:.5rem">' +
              '<div style="min-width:0"><b>' + P.aman(t.label) + '</b> ' +
                (t.diubah ? P.lencana('Diubah', 'emas') : '') +
                '<div class="mini redup mono">' + P.aman(t.kode) + '</div></div>' +
              '<button type="button" class="tombol tombol-lembut tombol-kecil" data-tpl="' +
                P.aman(t.kode) + '">Ubah isi</button>' +
            '</div>' +
            (t.subjek ? '<div class="mini redup" style="margin-top:.4rem">Subjek: ' +
              P.aman(t.subjek) + '</div>' : '') +
            '<div class="kode-blok" style="margin-top:.4rem">' + P.aman(t.isi) + '</div>' +
          '</div>';
        }).join('');

    } else {
      isi.innerHTML = P.tunggu(4);
      P.panggil('notifAntrean', {}).then(function (a) {
        isi.innerHTML =
          '<div class="baris" style="gap:.4rem;flex-wrap:wrap;margin-bottom:var(--s-md)">' +
            ['antre', 'proses', 'terkirim', 'gagal', 'batal'].map(function (k) {
              return '<span class="tag-kecil">' + k + ': ' + P.angka(a.ringkas[k] || 0) + '</span>';
            }).join('') +
            '<button type="button" class="tombol tombol-lembut tombol-kecil" id="n-proses" ' +
              'style="margin-left:auto">Proses antrean sekarang</button>' +
          '</div>' +
          (a.item.length ? '<div class="tabel-bungkus"><table class="tabel">' +
            '<thead><tr><th>Waktu</th><th>Kanal</th><th>Tujuan</th><th>Jenis pesan</th>' +
            '<th>Status</th><th>Catatan</th></tr></thead><tbody>' +
            a.item.slice(0, 80).map(function (r) {
              return '<tr>' +
                '<td class="kecil">' + P.waktu(r.dibuat_pada) + '</td>' +
                '<td>' + P.lencana(r.jenis === 'wa' ? 'WA' : 'Email', r.jenis === 'wa' ? 'sukses' : 'netral') + '</td>' +
                '<td class="kecil mono">' + P.aman(r.tujuan) + '</td>' +
                '<td class="kecil">' + P.aman(r.template || '—') + '</td>' +
                '<td>' + statusAntrean(r.status) + '</td>' +
                '<td class="mini redup">' + P.aman(r.error_terakhir || '') + '</td>' +
              '</tr>';
            }).join('') + '</tbody></table></div>'
            : P.kosong('surat', 'Antrean kosong', 'Semua notifikasi sudah terkirim.'));
      }).catch(function (e) {
        isi.innerHTML = P.kosong('ingat', 'Gagal memuat antrean', e.message);
      });
    }
  }

  function statusAntrean(s) {
    if (s === 'terkirim') return P.lencana('Terkirim', 'sukses');
    if (s === 'gagal') return P.lencana('Gagal', 'galat');
    if (s === 'batal') return P.lencana('Dibatalkan', 'netral');
    if (s === 'proses') return P.lencana('Diproses', 'emas');
    return P.lencana('Antre', 'netral');
  }

  function ubahMatriks(kode, aktif, saklar) {
    saklar.disabled = true;
    P.panggil('notifMatriks', { kode: kode, aktif: aktif }).then(function () {
      P.toast(aktif ? 'Kejadian dinyalakan.' : 'Kejadian dimatikan.', 'sukses');
      saklar.disabled = false;
    }).catch(function (e) {
      P.galat(e);
      saklar.checked = !aktif;
      saklar.disabled = false;
    });
  }

  function suntingTemplate(d, kode) {
    var t = d.template.filter(function (x) { return x.kode === kode; })[0];
    if (!t) return;

    var w = P.modal({
      judul: t.label,
      lebar: true,
      isi: '<form id="form-tpl">' +
        (t.kanal === 'email'
          ? P.bidang({ nama: 'subjek', label: 'Subjek email', nilai: t.subjek }) : '') +
        P.bidang({ tipe: 'area', nama: 'isi', label: 'Isi pesan', nilai: t.isi, baris: 12 }) +
        '</form>' +
        '<p class="mini redup">Variabel: ' + d.variabel.map(function (v) {
          return '<span class="tag-kecil">{' + v + '}</span>';
        }).join('') + '</p>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-lembut" id="tpl-bawaan">Kembalikan bawaan</button>' +
            '<button type="button" class="tombol tombol-primer" id="tpl-simpan">Simpan</button>'
    });

    w.querySelector('#tpl-simpan').addEventListener('click', function () {
      var v = P.nilaiForm(document.getElementById('form-tpl'));
      P.sibuk(this, true, 'Menyimpan…');
      P.panggil('notifSimpan', { kode: kode, subjek: v.subjek || '', isi: v.isi }).then(function () {
        P.tutupModal();
        P.toast('Template disimpan.', 'sukses');
        P.buka('notifikasi', true);
      }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#tpl-simpan'), false); });
    });

    w.querySelector('#tpl-bawaan').addEventListener('click', function () {
      P.panggil('notifSimpan', { kode: kode, kembalikan_bawaan: true }).then(function () {
        P.tutupModal();
        P.toast('Template dikembalikan ke bawaan.', 'sukses');
        P.buka('notifikasi', true);
      }).catch(P.galat);
    });
  }

  function tesKirim(jenis) {
    var w = P.modal({
      judul: 'Kirim Pesan Percobaan',
      isi: '<div class="bidang"><label for="tes-tujuan">' +
             (jenis === 'wa' ? 'Nomor WhatsApp tujuan' : 'Alamat email tujuan') + '</label>' +
           '<input type="text" id="tes-tujuan" placeholder="' +
             (jenis === 'wa' ? '081234567890' : 'nama@email.com') + '"></div>' +
           '<p class="kecil redup">Pesan percobaan memakai data contoh, bukan data donatur sungguhan.</p>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="tes-ok">Kirim</button>'
    });

    w.querySelector('#tes-ok').addEventListener('click', function () {
      var tujuan = document.getElementById('tes-tujuan').value.trim();
      if (!tujuan) { P.toast('Tujuan belum diisi.', 'galat'); return; }
      P.sibuk(this, true, 'Mengirim…');
      P.panggil('notifTes', {
        jenis: jenis, tujuan: tujuan,
        template: jenis === 'wa' ? 'terima_kasih_wa' : 'terima_kasih'
      }).then(function () {
        P.tutupModal();
        P.toast('Pesan percobaan dikirim.', 'sukses');
      }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#tes-ok'), false); });
    });
  }

  function prosesAntrean(tombol) {
    P.sibuk(tombol, true, 'Memproses…');
    P.panggil('notifAntrean', { proses: true }).then(function () {
      P.toast('Antrean diproses.', 'sukses');
      gambarTabNotif({ matriks: [], template: [], variabel: [] });
      P.buka('notifikasi', true);
    }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }

  // =========================================================== PENGGUNA
  P.P.modul.pengguna = function (wadah) {
    return P.panggil('penggunaList', { _fresh: true }).then(function (d) {
      wadah.innerHTML =
        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Akun Panel</h2>' +
            '<span class="aksi"><button type="button" class="tombol tombol-primer tombol-kecil" ' +
              'id="u-baru">+ Akun baru</button></span></div>' +
          '<div class="tabel-bungkus"><table class="tabel">' +
            '<thead><tr><th>Nama</th><th>Nama pengguna</th><th>Peran</th><th>Status</th>' +
            '<th>Login terakhir</th><th></th></tr></thead><tbody>' +
            d.item.map(function (u) {
              return '<tr>' +
                '<td><b>' + P.aman(u.nama) + '</b><br><span class="mini redup">' +
                  P.aman(u.email || '—') + '</span></td>' +
                '<td class="mono">' + P.aman(u.username) + '</td>' +
                '<td>' + P.lencana(u.peran === 'SUPERADMIN' ? 'Superadmin' : 'Admin',
                  u.peran === 'SUPERADMIN' ? 'emas' : 'netral') + '</td>' +
                '<td>' + (u.status === 'active' ? P.lencana('Aktif', 'sukses') : P.lencana('Nonaktif', 'netral')) +
                  (u.terkunci ? ' ' + P.lencana('Terkunci', 'galat') : '') + '</td>' +
                '<td class="kecil">' + (u.login_terakhir ? P.jarakWaktu(u.login_terakhir) : 'belum pernah') + '</td>' +
                '<td class="kanan" style="white-space:nowrap">' +
                  '<button type="button" class="tombol tombol-lembut tombol-kecil" data-u="' +
                    P.aman(u.id) + '">Ubah</button> ' +
                  '<button type="button" class="tombol tombol-lembut tombol-kecil" data-uh="' +
                    P.aman(u.id) + '">Hapus</button></td>' +
              '</tr>';
            }).join('') + '</tbody></table></div>' +
        '</div>' +

        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Akses Darurat</h2></div>' +
          '<p class="kecil redup" style="margin-top:0">Akun cadangan yang tersimpan di Script Properties, ' +
            'bukan di spreadsheet. Gunanya satu: tetap bisa masuk kalau seluruh akun panel di atas ' +
            'terkunci atau terhapus.</p>' +
          '<div class="sela" style="flex-wrap:wrap;gap:.5rem">' +
            '<span class="lajur"><b class="mono">' + P.aman(d.akses_darurat.username) + '</b>' +
              '<span class="mini redup">' +
                (d.akses_darurat.aktif ? 'Aktif' : 'Belum disiapkan') +
                (d.akses_darurat.terkunci_sampai ? ' · terkunci sampai ' +
                  P.waktu(d.akses_darurat.terkunci_sampai) : '') + '</span></span>' +
          '</div>' +
          '<p class="mini redup" style="margin:.6rem 0 0">Sandinya hanya bisa diputar ulang dari editor ' +
            'Apps Script dengan menjalankan fungsi <span class="mono">resetAksesDarurat()</span>, lalu ' +
            'membaca sandi baru di jendela Log. Itu disengaja — sandi darurat tidak boleh bisa diubah ' +
            'lewat jaringan.</p>' +
        '</div>';

      P.el('u-baru').addEventListener('click', function () { suntingPengguna(null, d.peran); });
      wadah.addEventListener('click', function (e) {
        var u = e.target.closest('[data-u]');
        if (u) {
          suntingPengguna(d.item.filter(function (x) { return x.id === u.getAttribute('data-u'); })[0], d.peran);
          return;
        }
        var h = e.target.closest('[data-uh]');
        if (h) hapusPengguna(d.item.filter(function (x) { return x.id === h.getAttribute('data-uh'); })[0]);
      });
    });
  };

  function suntingPengguna(u, peran) {
    u = u || {};
    var w = P.modal({
      judul: u.id ? 'Ubah Akun' : 'Akun Panel Baru',
      isi: '<form id="form-u">' +
        P.bidang({ nama: 'nama', label: 'Nama lengkap', nilai: u.nama, wajib: true }) +
        P.bidang({ nama: 'username', label: 'Nama pengguna', nilai: u.username, wajib: true,
                   bantu: 'Minimal 4 karakter, tanpa spasi.' }) +
        P.bidang({ tipe: 'email', nama: 'email', label: 'Email', nilai: u.email }) +
        P.bidang({ tipe: 'pilihan', nama: 'peran', label: 'Peran', nilai: u.peran,
                   opsi: (peran || ['ADMIN', 'SUPERADMIN']).map(function (p) {
                     return { nilai: p, label: p === 'SUPERADMIN'
                       ? 'Superadmin — seluruh menu, termasuk pengaturan & akun'
                       : 'Admin — donasi, program, laporan, CRM' };
                   }) }) +
        P.bidang({ tipe: 'pilihan', nama: 'status', label: 'Status', nilai: u.status,
                   opsi: [{ nilai: 'active', label: 'Aktif' },
                          { nilai: 'inactive', label: 'Nonaktif — tidak bisa masuk' }] }) +
        P.bidang({ tipe: 'password', nama: 'password', label: u.id ? 'Sandi baru' : 'Sandi',
                   bantu: u.id ? 'Kosongkan bila sandi tidak diganti.' : 'Minimal 10 karakter.' }) +
      '</form>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="u-simpan">Simpan akun</button>'
    });

    w.querySelector('#u-simpan').addEventListener('click', function () {
      var v = P.nilaiForm(document.getElementById('form-u'));
      v.id = u.id || '';
      if (!v.password) delete v.password;

      P.sibuk(this, true, 'Menyimpan…');
      P.panggil('penggunaSimpan', v).then(function () {
        P.tutupModal();
        P.toast('Akun disimpan.', 'sukses');
        P.buka('pengguna', true);
      }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#u-simpan'), false); });
    });
  }

  function hapusPengguna(u) {
    if (!u) return;
    P.konfirmasi('Hapus akun ' + u.nama + '?',
      'Akun tidak bisa dipakai masuk lagi. Jejak aktivitas yang pernah dicatatnya tetap tersimpan.',
      'Hapus akun', true).then(function (ya) {
      if (!ya) return;
      P.panggil('penggunaHapus', { id: u.id }).then(function () {
        P.toast('Akun dihapus.', 'sukses');
        P.buka('pengguna', true);
      }).catch(P.galat);
    });
  }

  // ================================================================ LOG
  var saringLog = { q: '', aksi: '', page: 1 };

  P.P.modul.log = function (wadah) {
    wadah.innerHTML =
      '<div class="panel-kartu">' +
        '<div class="kartu-kepala"><h2>Jejak Aktivitas</h2></div>' +
        '<p class="kecil redup" style="margin-top:0">Setiap tindakan penting di panel tercatat di sini: ' +
          'siapa, kapan, dan apa yang diubah. Termasuk pembukaan bukti transfer dan ekspor data.</p>' +
        '<div class="saring">' +
          '<input type="search" class="tumbuh" id="g-q" placeholder="Cari pelaku, aksi, atau target…" ' +
            'aria-label="Cari jejak aktivitas">' +
          '<select id="g-aksi" aria-label="Saring jenis aksi"><option value="">Semua jenis aksi</option></select>' +
        '</div>' +
        '<div id="g-tabel">' + P.tunggu(6) + '</div>' +
      '</div>';

    var jeda = null;
    P.el('g-q').addEventListener('input', function (e) {
      clearTimeout(jeda);
      var v = e.target.value.trim();
      jeda = setTimeout(function () { saringLog.q = v; saringLog.page = 1; muatLog(); }, 350);
    });
    P.el('g-aksi').addEventListener('change', function (e) {
      saringLog.aksi = e.target.value; saringLog.page = 1; muatLog();
    });
    wadah.addEventListener('click', function (e) {
      var h = e.target.closest('.hal button[data-ke]');
      if (h && !h.disabled) { saringLog.page = Number(h.getAttribute('data-ke')); muatLog(); }
    });

    return muatLog();
  };

  function muatLog() {
    P.el('g-tabel').innerHTML = P.tunggu(6);
    return P.panggil('logList', saringLog).then(function (d) {
      var s = P.el('g-aksi');
      if (s.options.length === 1) {
        d.jenisAksi.forEach(function (a) {
          var o = document.createElement('option');
          o.value = a; o.textContent = a;
          s.appendChild(o);
        });
        s.value = saringLog.aksi;
      }

      P.el('g-tabel').innerHTML = d.item.length
        ? '<div class="tabel-bungkus"><table class="tabel">' +
          '<thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th><th>Target</th><th>Rincian</th></tr></thead><tbody>' +
          d.item.map(function (r) {
            return '<tr>' +
              '<td class="kecil">' + P.waktu(r.waktu) + '</td>' +
              '<td class="kecil"><b>' + P.aman(r.pelaku) + '</b><br>' +
                '<span class="mini redup">' + P.aman(r.peran) + '</span></td>' +
              '<td><span class="tag-kecil">' + P.aman(r.aksi) + '</span></td>' +
              '<td class="kecil mono">' + P.aman(r.target) + '</td>' +
              '<td class="mini redup">' + P.aman(r.rincian || '') + '</td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>' +
          P.paginasi({ total: d.total, halaman: d.halaman, totalHalaman: d.totalHalaman, perHalaman: 50 }, 'log')
        : P.kosong('jam', 'Belum ada jejak', 'Aktivitas panel akan tercatat di sini.');
    }).catch(P.galat);
  }

  // ================================================= STATUS & MIGRASI
  P.P.modul.sistem = function (wadah) {
    return P.panggil('sistemStatus', { _fresh: true }).then(function (d) {
      wadah.innerHTML =
        '<div class="kpi-kisi" style="margin-bottom:var(--selang)">' +
          '<div class="kpi"><span class="kpi-label">Versi Aplikasi</span>' +
            '<span class="kpi-nilai" style="font-size:1.125rem">' + P.aman(d.aplikasi.versi) + '</span>' +
            '<span class="kpi-kaki">Skema kode ' + P.aman(d.aplikasi.skema_kode) + '</span></div>' +
          '<div class="kpi"><span class="kpi-label">Skema Database</span>' +
            '<span class="kpi-nilai" style="font-size:1.125rem">' +
              (d.skema.perlu_migrasi ? 'Perlu migrasi' : 'Sesuai') + '</span>' +
            '<span class="kpi-kaki">Tersimpan ' + P.aman(d.skema.versi_tersimpan) + '</span></div>' +
          '<div class="kpi"><span class="kpi-label">Pemicu Terjadwal</span>' +
            '<span class="kpi-nilai" style="font-size:1.125rem">' +
              ((d.trigger.antrean_notif && d.trigger.harian) ? 'Lengkap' : 'Belum lengkap') + '</span>' +
            '<span class="kpi-kaki">' + (d.trigger.antrean_notif ? '✓' : '✕') + ' antrean notifikasi · ' +
              (d.trigger.harian ? '✓' : '✕') + ' tugas harian</span></div>' +
          '<div class="kpi"><span class="kpi-label">Antrean Notifikasi</span>' +
            '<span class="kpi-nilai" style="font-size:1.125rem">' +
              P.angka(d.antrean.antre || 0) + '</span>' +
            '<span class="kpi-kaki">menunggu dikirim · kuota email ' +
              (d.kuota.email_tersisa >= 0 ? P.angka(d.kuota.email_tersisa) : '—') + '</span></div>' +
        '</div>' +

        (!d.trigger.antrean_notif || !d.trigger.harian
          ? '<div class="pesan pesan-ingat" style="margin-bottom:var(--selang)">' +
            '<b>Pemicu terjadwal belum terpasang.</b> Buka editor Apps Script, pilih fungsi ' +
            '<span class="mono">pasangTrigger</span>, lalu jalankan sekali. Tanpa itu notifikasi dan ' +
            'blast hanya terkirim saat ada yang membuka panel.</div>'
          : '') +

        // Tombol migrasi SELALU ada, bukan hanya saat struktur berubah.
        // Versi skema bisa saja sudah cocok sementara perapian datanya belum
        // pernah berjalan — dan dulu, dalam keadaan itu, tombolnya menghilang
        // dan pengelola kehabisan cara untuk menjalankannya dari panel.
        '<div class="panel-kartu"' +
          (d.skema.perlu_migrasi ? ' style="border-color:var(--ingat)"' : '') + '>' +
          '<div class="kartu-kepala"><h2>' +
            (d.skema.perlu_migrasi ? 'Struktur Database Perlu Disesuaikan' : 'Perawatan Struktur &amp; Data') +
          '</h2></div>' +
          '<p class="kecil">' + (d.skema.perlu_migrasi
            ? 'Ada sheet atau kolom yang belum sesuai dengan versi kode ini.'
            : 'Struktur sudah sesuai. Menjalankannya sekarang hanya merapikan data: ' +
              'memindahkan pengaturan yang sudah digantikan menu baru dan menanam contoh ' +
              'yang belum ada.') +
            ' Migrasi hanya <b>menambah</b> — data lama tidak dihapus, tidak dipindah, ' +
            'dan tidak ditimpa. Aman dijalankan berulang kali.</p>' +
          (d.skema.sheet_hilang.length ? '<p class="kecil">Sheet hilang: <span class="mono">' +
            d.skema.sheet_hilang.map(P.aman).join(', ') + '</span></p>' : '') +
          (Object.keys(d.skema.kolom_hilang).length
            ? '<div class="kode-blok">' + Object.keys(d.skema.kolom_hilang).map(function (s) {
                return s + ': ' + d.skema.kolom_hilang[s].join(', ');
              }).join('\n') + '</div>' : '') +
          '<button type="button" class="tombol ' +
            (d.skema.perlu_migrasi ? 'tombol-primer' : 'tombol-lembut') + '" id="s-migrasi" ' +
            'style="margin-top:var(--s-md)">' +
            (d.skema.perlu_migrasi ? 'Jalankan migrasi' : 'Periksa &amp; rapikan sekarang') +
          '</button>' +
          '<div id="s-migrasi-hasil"></div>' +
        '</div>' +

        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Isi Database</h2></div>' +
          P.grafikBatang(Object.keys(d.baris).map(function (k) {
            return { label: k, nilai: d.baris[k] };
          }).sort(function (a, b) { return b.nilai - a.nilai; }), { kosong: 'Database masih kosong.' }) +
          '<div class="baris" style="gap:.5rem;margin-top:var(--s-lg);flex-wrap:wrap">' +
            '<a class="tombol tombol-lembut tombol-kecil" href="' + P.aman(d.penyimpanan.spreadsheet_url) +
              '" target="_blank" rel="noopener">Buka spreadsheet</a>' +
            (d.penyimpanan.drive_url ? '<a class="tombol tombol-lembut tombol-kecil" href="' +
              P.aman(d.penyimpanan.drive_url) + '" target="_blank" rel="noopener">Buka folder Drive</a>' : '') +
          '</div>' +
        '</div>' +

        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Impor dari Aplikasi Lama</h2></div>' +
          '<p class="kecil redup" style="margin-top:0">Menyalin program, donasi, berita, dan testimoni ' +
            'dari spreadsheet aplikasi sebelumnya. Baris yang ID-nya sudah ada akan dilewati, ' +
            'jadi impor aman diulang.</p>' +
          '<div class="bidang"><label for="s-sumber">ID atau tautan spreadsheet sumber</label>' +
            '<input type="text" id="s-sumber" placeholder="1AbC… atau tautan lengkap Google Sheets"></div>' +
          '<div class="baris" style="gap:.6rem;flex-wrap:wrap;margin-bottom:var(--s-md)">' +
            ['Program', 'Donasi', 'Berita', 'Testimoni', 'Agenda', 'Dokumen'].map(function (s) {
              return '<label class="centang"><input type="checkbox" data-sheet="' + s + '"' +
                (['Program', 'Donasi', 'Berita', 'Testimoni'].indexOf(s) > -1 ? ' checked' : '') +
                '><span>' + s + '</span></label>';
            }).join('') +
          '</div>' +
          '<div class="baris" style="gap:.5rem;flex-wrap:wrap">' +
            '<button type="button" class="tombol tombol-lembut" id="s-pindai">Pindai dulu (tanpa menulis)</button>' +
            '<button type="button" class="tombol tombol-primer" id="s-impor" disabled>Jalankan impor</button>' +
          '</div>' +
          '<div id="s-hasil"></div>' +
        '</div>';

      var m = P.el('s-migrasi');
      if (m) m.addEventListener('click', function () { migrasi(this); });
      P.el('s-pindai').addEventListener('click', function () { impor(this, true); });
      P.el('s-impor').addEventListener('click', function () { impor(this, false); });
    });
  };

  function migrasi(tombol) {
    P.konfirmasi('Jalankan perawatan struktur & data?',
      'Sheet dan kolom yang hilang ditambahkan, pengaturan yang sudah digantikan menu baru ' +
      'dipindahkan, dan contoh yang belum ada ditanam. Tidak ada data Anda yang dihapus ' +
      'atau ditimpa, dan aman dijalankan berulang kali.',
      'Jalankan').then(function (ya) {
      if (!ya) return;
      P.sibuk(tombol, true, 'Menyesuaikan…');
      P.panggil('migrasiJalankan', {}).then(function (h) {
        var wadah = P.el('s-migrasi-hasil');
        if (wadah) {
          wadah.innerHTML = '<div class="pesan pesan-sukses" style="margin-top:var(--s-md)">' +
            (h.tindakan.length
              ? '<div><b>' + P.angka(h.tindakan.length) + ' perubahan diterapkan:</b><br>' +
                h.tindakan.map(P.aman).join('<br>') + '</div>'
              : '<span>Struktur dan data sudah rapi — tidak ada yang perlu diubah.</span>') +
            '</div>';
        }
        P.toast(h.tindakan.length
          ? h.tindakan.length + ' perubahan diterapkan.'
          : 'Sudah rapi, tidak ada yang diubah.', 'sukses');
        P.sibuk(tombol, false);
        API.bersihkanCache && API.bersihkanCache();
      }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
    });
  }

  function impor(tombol, pindai) {
    var sumber = P.el('s-sumber').value.trim();
    if (!sumber) { P.toast('ID atau tautan spreadsheet sumber belum diisi.', 'galat'); return; }

    var sheet = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-sheet]'), function (c) {
      sheet[c.getAttribute('data-sheet')] = c.checked;
    });

    P.sibuk(tombol, true, pindai ? 'Memindai…' : 'Mengimpor…');
    P.panggil(pindai ? 'importPindai' : 'importJalankan', { sumber: sumber, sheet: sheet })
      .then(function (h) {
        P.el('s-hasil').innerHTML =
          '<div class="pesan ' + (pindai ? 'pesan-info' : 'pesan-sukses') + '" style="margin-top:var(--s-md)">' +
            '<b>' + (pindai ? 'Hasil pemindaian' : 'Impor selesai') + '</b> — sumber: ' +
            P.aman(h.sumber.nama) + '</div>' +
          '<div class="tabel-bungkus" style="margin-top:.5rem"><table class="tabel">' +
          '<thead><tr><th>Sheet</th><th class="kanan">Ditambah</th><th class="kanan">Diperbarui</th>' +
          '<th class="kanan">Dilewati</th></tr></thead><tbody>' +
          Object.keys(h.laporan).map(function (k) {
            var r = h.laporan[k];
            return '<tr><td>' + P.aman(k) + '</td>' +
              '<td class="angka kanan">' + P.angka(r.ditambah) + '</td>' +
              '<td class="angka kanan">' + P.angka(r.diperbarui) + '</td>' +
              '<td class="angka kanan">' + P.angka(r.dilewati || 0) + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          (h.peringatan.length
            ? '<div class="kode-blok" style="margin-top:.5rem">' +
              h.peringatan.map(P.aman).join('\n') + '</div>' : '');

        if (pindai) P.el('s-impor').disabled = false;
        else P.toast('Impor selesai.', 'sukses');
        P.sibuk(tombol, false);
      })
      .catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }
})();
