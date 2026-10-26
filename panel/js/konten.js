/* ============================================================================
   konten.js — Konten situs: bagian beranda, berita, statistik/agenda/audit/
               testimoni, pembangun formulir, dan dokumen publik
   ============================================================================ */

(function () {
  'use strict';

  var P = PANEL;

  // ======================================================= BAGIAN BERANDA
  P.P.modul.beranda = function (wadah) {
    return P.panggil('sectionList', {}).then(function (d) {
      wadah.innerHTML =
        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Bagian Halaman Beranda</h2></div>' +
          '<p class="kecil redup" style="margin-top:0">Judul, subjudul, dan isi tiap bagian ' +
            'beranda. Mematikan sebuah bagian menyembunyikannya dari situs tanpa menghapus isinya.</p>' +
          (d.item.length ? '<div class="tabel-bungkus"><table class="tabel">' +
            '<thead><tr><th>Bagian</th><th>Judul</th><th>Urutan</th><th>Tampil</th><th></th></tr></thead><tbody>' +
            d.item.map(function (s) {
              return '<tr>' +
                '<td><span class="mono">' + P.aman(s.kunci) + '</span></td>' +
                '<td><b>' + P.aman(s.judul || '—') + '</b><br>' +
                  '<span class="mini redup potong-1">' + P.aman(s.subjudul || '') + '</span></td>' +
                '<td class="angka">' + s.urutan + '</td>' +
                '<td>' + (s.tampil ? P.lencana('Tampil', 'sukses') : P.lencana('Disembunyikan', 'netral')) + '</td>' +
                '<td class="kanan"><button type="button" class="tombol tombol-lembut tombol-kecil" ' +
                  'data-sec="' + P.aman(s.id) + '">Ubah</button></td>' +
              '</tr>';
            }).join('') + '</tbody></table></div>'
            : P.kosong('pustaka', 'Belum ada bagian', 'Jalankan setup untuk menanam bagian bawaan.')) +
        '</div>';

      wadah.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sec]');
        if (!b) return;
        var s = d.item.filter(function (x) { return x.id === b.getAttribute('data-sec'); })[0];
        suntingSection(s);
      });
    });
  };

  function suntingSection(s) {
    var w = P.modal({
      judul: 'Bagian “' + s.kunci + '”',
      lebar: true,
      isi: '<form id="form-sec">' +
        P.bidang({ nama: 'judul', label: 'Judul', nilai: s.judul }) +
        P.bidang({ nama: 'subjudul', label: 'Subjudul', nilai: s.subjudul }) +
        P.bidang({ tipe: 'number', nama: 'urutan', label: 'Urutan', nilai: s.urutan, min: 1 }) +
        P.bidang({ tipe: 'saklar', nama: 'tampil', label: 'Tampilkan bagian ini di beranda', nilai: s.tampil }) +
        P.bidang({ tipe: 'area', nama: 'konten', label: 'Isi bagian (format JSON)',
                   nilai: JSON.stringify(s.konten || {}, null, 2), baris: 12,
                   bantu: 'Setiap bagian punya kunci isinya sendiri. Ubah nilainya saja, ' +
                          'jangan ubah nama kuncinya, agar tata letak di situs tetap cocok.' }) +
      '</form>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="sec-simpan">Simpan</button>'
    });

    w.querySelector('#sec-simpan').addEventListener('click', function () {
      var v = P.nilaiForm(document.getElementById('form-sec'));
      var konten;
      try { konten = JSON.parse(v.konten || '{}'); }
      catch (e) { P.toast('Isi bagian bukan JSON yang sah: ' + e.message, 'galat'); return; }

      P.sibuk(this, true, 'Menyimpan…');
      P.panggil('sectionSimpan', {
        id: s.id, kunci: s.kunci, judul: v.judul, subjudul: v.subjudul,
        urutan: v.urutan, tampil: v.tampil, konten: konten
      }).then(function () {
        P.tutupModal();
        P.toast('Bagian beranda diperbarui.', 'sukses');
        P.buka('beranda', true);
      }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#sec-simpan'), false); });
    });
  }

  // ============================================================== BERITA
  var beritaData = { item: [], program: [] };

  P.P.modul.berita = function (wadah) {
    return P.panggil('beritaPanel', {}).then(function (d) {
      beritaData = d;
      wadah.innerHTML =
        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Berita &amp; Laporan</h2>' +
            '<span class="aksi"><button type="button" class="tombol tombol-primer tombol-kecil" ' +
              'id="b-baru">+ Tulis berita</button></span></div>' +
          (d.item.length ? '<div class="tabel-bungkus"><table class="tabel">' +
            '<thead><tr><th>Judul</th><th>Kategori</th><th>Tanggal</th><th>Status</th>' +
            '<th class="kanan">Dibaca</th><th></th></tr></thead><tbody>' +
            d.item.map(function (b) {
              return '<tr>' +
                '<td><b class="potong-1">' + P.aman(b.judul) + '</b>' +
                  (b.unggulan ? ' <span class="tag-kecil">sorotan</span>' : '') +
                  '<br><span class="mini redup mono">' + P.aman(b.slug) + '</span></td>' +
                '<td class="kecil">' + P.aman(b.kategori || '—') + '</td>' +
                '<td class="kecil">' + P.aman(b.tanggal) + '</td>' +
                '<td>' + (b.status === 'terbit' ? P.lencana('Terbit', 'sukses') : P.lencana('Draf', 'netral')) + '</td>' +
                '<td class="angka kanan">' + P.angka(b.dilihat) + '</td>' +
                '<td class="kanan" style="white-space:nowrap">' +
                  '<button type="button" class="tombol tombol-lembut tombol-kecil" data-b="' +
                    P.aman(b.id) + '">Ubah</button> ' +
                  '<button type="button" class="tombol tombol-lembut tombol-kecil" data-bh="' +
                    P.aman(b.id) + '">Hapus</button></td>' +
              '</tr>';
            }).join('') + '</tbody></table></div>'
            : P.kosong('kitab', 'Belum ada berita',
                'Kabar progres dan laporan penyaluran adalah bukti amanah yang paling dicari donatur.')) +
        '</div>';

      P.el('b-baru').addEventListener('click', function () { suntingBerita(null); });
      wadah.addEventListener('click', function (e) {
        var u = e.target.closest('[data-b]');
        if (u) { suntingBerita(cariBerita(u.getAttribute('data-b'))); return; }
        var h = e.target.closest('[data-bh]');
        if (h) hapusBerita(cariBerita(h.getAttribute('data-bh')));
      });
    });
  };

  function cariBerita(id) {
    return beritaData.item.filter(function (b) { return b.id === id; })[0] || null;
  }

  function suntingBerita(b) {
    b = b || {};
    var galeri = JSON.parse(b.galeri_json || '[]');

    var w = P.modal({
      judul: b.id ? 'Ubah Berita' : 'Tulis Berita',
      lebar: true,
      isi: '<form id="form-berita">' +
        '<div class="panel-kisi-2" style="gap:var(--s-lg)">' +
          '<div>' +
            P.bidang({ nama: 'judul', label: 'Judul', nilai: b.judul, wajib: true }) +
            P.bidang({ nama: 'slug', label: 'Alamat halaman (slug)', nilai: b.slug,
                       bantu: 'Dikosongkan berarti dibuat otomatis dari judul.' }) +
            P.bidang({ nama: 'kategori', label: 'Kategori', nilai: b.kategori,
                       petunjuk: 'Progres Wakaf Fisik' }) +
            P.bidang({ nama: 'penulis', label: 'Penulis', nilai: b.penulis }) +
            P.bidang({ tipe: 'date', nama: 'tanggal', label: 'Tanggal terbit',
                       nilai: (b.tanggal || new Date().toISOString().slice(0, 10)).slice(0, 10) }) +
            P.bidang({ tipe: 'number', nama: 'menit_baca', label: 'Perkiraan menit baca',
                       nilai: b.menit_baca || 3, min: 1 }) +
            P.bidang({ tipe: 'pilihan', nama: 'status', label: 'Status', nilai: b.status,
                       opsi: [{ nilai: 'draft', label: 'Draf' }, { nilai: 'terbit', label: 'Terbit' }] }) +
            P.bidang({ tipe: 'pilihan', nama: 'program_id', label: 'Terkait program', nilai: b.program_id,
                       opsi: [{ nilai: '', label: 'Tidak terkait program' }].concat(
                         beritaData.program.map(function (p) { return { nilai: p.id, label: p.judul }; })) }) +
            P.bidang({ tipe: 'saklar', nama: 'unggulan', label: 'Jadikan sorotan utama di arsip berita',
                       nilai: b.unggulan }) +
          '</div>' +
          '<div>' +
            P.bidang({ nama: 'gambar_url', label: 'Gambar sampul (URL)', nilai: b.gambar_url }) +
            P.bidang({ tipe: 'area', nama: 'galeri_teks', label: 'Galeri (satu URL per baris)',
                       nilai: galeri.join('\n'), baris: 3 }) +
            P.bidang({ tipe: 'area', nama: 'ringkasan', label: 'Ringkasan', nilai: b.ringkasan, baris: 3,
                       bantu: 'Tampil di kartu berita dan hasil pencarian.' }) +
            P.bidang({ tipe: 'area', nama: 'isi_html', label: 'Isi artikel', nilai: b.isi_html, baris: 12,
                       bantu: 'Boleh <p>, <h2>, <h3>, <ul>, <b>, <blockquote>. ' +
                              'Script dan atribut berbahaya dibuang server.' }) +
          '</div>' +
        '</div>' +
      '</form>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="b-simpan">Simpan berita</button>'
    });

    w.querySelector('#b-simpan').addEventListener('click', function () {
      var v = P.nilaiForm(document.getElementById('form-berita'));
      if (!v.judul) { P.toast('Judul berita belum diisi.', 'galat'); return; }

      v.id = b.id || '';
      v.galeri_json = JSON.stringify(
        String(v.galeri_teks || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean));
      delete v.galeri_teks;

      P.sibuk(this, true, 'Menyimpan…');
      P.panggil('beritaSimpan', v).then(function () {
        P.tutupModal();
        P.toast('Berita disimpan.', 'sukses');
        P.buka('berita', true);
      }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#b-simpan'), false); });
    });
  }

  function hapusBerita(b) {
    if (!b) return;
    P.konfirmasi('Hapus berita “' + b.judul + '”?',
      'Artikel akan hilang dari situs dan tautannya tidak bisa dibuka lagi.', 'Hapus', true)
      .then(function (ya) {
        if (!ya) return;
        P.panggil('beritaHapus', { id: b.id }).then(function () {
          P.toast('Berita dihapus.', 'sukses');
          P.buka('berita', true);
        }).catch(P.galat);
      });
  }

  // ====================== STATISTIK · AGENDA · AUDIT · TESTIMONI =========
  var kontenData = {};
  var tabAktif = 'statistik';

  P.P.modul.konten = function (wadah) {
    return P.panggil('kontenList', {}).then(function (d) {
      kontenData = d;
      wadah.innerHTML =
        '<div class="panel-kartu">' +
          '<div class="tab-pil" id="k-tab" role="tablist">' +
            ['statistik', 'agenda', 'audit', 'testimoni'].map(function (t) {
              return '<button type="button" role="tab" data-tab="' + t + '" aria-selected="' +
                (t === tabAktif) + '">' + label(t) + '</button>';
            }).join('') +
          '</div>' +
          '<div id="k-isi" style="margin-top:var(--s-md)"></div>' +
        '</div>';

      gambarTab();
      P.el('k-tab').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-tab]');
        if (!b) return;
        tabAktif = b.getAttribute('data-tab');
        Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) {
          x.setAttribute('aria-selected', String(x === b));
        });
        gambarTab();
      });

      wadah.addEventListener('click', function (e) {
        var u = e.target.closest('[data-k-ubah]');
        if (u) { suntingKonten(tabAktif, u.getAttribute('data-k-ubah')); return; }
        var h = e.target.closest('[data-k-hapus]');
        if (h) hapusKonten(tabAktif, h.getAttribute('data-k-hapus'));
        var t = e.target.closest('[data-k-baru]');
        if (t) suntingKonten(tabAktif, null);
      });
    });
  };

  function label(t) {
    return { statistik: 'Statistik Beranda', agenda: 'Agenda Pesantren',
             audit: 'Audit Realisasi', testimoni: 'Testimoni' }[t];
  }

  function gambarTab() {
    var isi = P.el('k-isi');
    var data = kontenData[tabAktif] || [];
    var kepala = {
      statistik: ['Label', 'Nilai', 'Sumber', 'Tampil'],
      agenda:    ['Kegiatan', 'Tanggal', 'Lokasi', 'Tampil'],
      audit:     ['Pos alokasi', 'Persen', 'Nominal', 'Tampil'],
      testimoni: ['Nama', 'Isi', 'Sumber', 'Tampil']
    }[tabAktif];

    isi.innerHTML =
      '<div class="sela" style="margin-bottom:var(--s-md)">' +
        '<p class="kecil redup" style="margin:0">' + penjelasan(tabAktif) + '</p>' +
        '<button type="button" class="tombol tombol-primer tombol-kecil" data-k-baru>+ Tambah</button>' +
      '</div>' +
      (data.length
        ? '<div class="tabel-bungkus"><table class="tabel"><thead><tr>' +
          kepala.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
          data.map(function (r) { return barisKonten(tabAktif, r); }).join('') +
          '</tbody></table></div>'
        : P.kosong('bintang', 'Belum ada data', 'Tekan "Tambah" untuk mengisi bagian ini.'));
  }

  function penjelasan(t) {
    return {
      statistik: 'Angka yang tampil di bawah hero beranda. Yang bertanda otomatis dihitung sistem.',
      agenda: 'Jadwal yang tampil di panel samping halaman berita.',
      audit: 'Proporsi penyaluran dana yang digambar sebagai donat di halaman berita.',
      testimoni: 'Untaian doa dan kesan donatur yang ditampilkan di beranda.'
    }[t];
  }

  function barisKonten(t, r) {
    var sel;
    if (t === 'statistik') {
      sel = '<td><b>' + P.aman(r.label) + '</b></td>' +
            '<td class="angka">' + P.aman(r.nilai) + ' ' + P.aman(r.satuan || '') + '</td>' +
            '<td class="kecil">' + (r.otomatis ? P.lencana('Otomatis', 'emas') + ' ' +
              P.aman(r.sumber_otomatis || '') : '<span class="redup">Manual</span>') + '</td>';
    } else if (t === 'agenda') {
      sel = '<td><b>' + P.aman(r.judul) + '</b><br><span class="mini redup">' +
              P.aman(r.keterangan || '') + '</span></td>' +
            '<td class="kecil">' + P.aman(r.tanggal) + '<br><span class="mini redup">' +
              P.aman(r.waktu || '') + '</span></td>' +
            '<td class="kecil">' + P.aman(r.lokasi || '—') + '</td>';
    } else if (t === 'audit') {
      sel = '<td><b>' + P.aman(r.label) + '</b><br><span class="mini redup">periode ' +
              P.aman(r.periode || '—') + '</span></td>' +
            '<td class="angka">' + P.angka(r.persen) + '%</td>' +
            '<td class="angka">' + P.rupiah(r.nominal) + '</td>';
    } else {
      sel = '<td><b>' + P.aman(r.nama) + '</b><br><span class="mini redup">' +
              P.aman(r.kota || '') + '</span></td>' +
            '<td class="kecil potong-2" style="max-width:320px">' + P.aman(r.isi) + '</td>' +
            '<td class="kecil">' + P.aman(r.sumber || 'manual') + '</td>';
    }

    return '<tr>' + sel +
      '<td>' + (r.tampil ? P.lencana('Tampil', 'sukses') : P.lencana('Sembunyi', 'netral')) + '</td>' +
      '<td class="kanan" style="white-space:nowrap">' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" data-k-ubah="' +
          P.aman(r.id) + '">Ubah</button> ' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" data-k-hapus="' +
          P.aman(r.id) + '">Hapus</button>' +
      '</td></tr>';
  }

  var RUTE_KONTEN = { statistik: 'statistikSimpan', agenda: 'agendaSimpan',
                      audit: 'auditSimpan', testimoni: 'testimoniSimpan' };

  function suntingKonten(t, id) {
    var r = (kontenData[t] || []).filter(function (x) { return x.id === id; })[0] || {};
    var isi;

    if (t === 'statistik') {
      isi = P.bidang({ nama: 'label', label: 'Label', nilai: r.label, wajib: true }) +
            P.bidang({ nama: 'nilai', label: 'Nilai', nilai: r.nilai,
                       bantu: 'Abaikan bila memakai sumber otomatis.' }) +
            P.bidang({ nama: 'satuan', label: 'Satuan', nilai: r.satuan, petunjuk: 'santri / program' }) +
            P.bidang({ nama: 'ikon', label: 'Nama ikon', nilai: r.ikon,
                       petunjuk: 'orangBanyak, kitab, wisuda, hati' }) +
            P.bidang({ tipe: 'saklar', nama: 'otomatis', label: 'Hitung otomatis dari data', nilai: r.otomatis }) +
            P.bidang({ tipe: 'pilihan', nama: 'sumber_otomatis', label: 'Sumber otomatis',
                       nilai: r.sumber_otomatis,
                       opsi: [{ nilai: '', label: '—' }].concat(
                         (kontenData.sumber_otomatis || []).map(function (s) {
                           return { nilai: s, label: s.replace(/_/g, ' ') };
                         })) });
    } else if (t === 'agenda') {
      isi = P.bidang({ nama: 'judul', label: 'Nama kegiatan', nilai: r.judul, wajib: true }) +
            P.bidang({ tipe: 'date', nama: 'tanggal', label: 'Tanggal', nilai: r.tanggal }) +
            P.bidang({ nama: 'waktu', label: 'Waktu', nilai: r.waktu, petunjuk: '08.00 – 11.00 WIB' }) +
            P.bidang({ nama: 'lokasi', label: 'Lokasi', nilai: r.lokasi }) +
            P.bidang({ tipe: 'area', nama: 'keterangan', label: 'Keterangan', nilai: r.keterangan, baris: 2 });
    } else if (t === 'audit') {
      isi = P.bidang({ nama: 'label', label: 'Pos alokasi', nilai: r.label, wajib: true }) +
            P.bidang({ nama: 'periode', label: 'Periode', nilai: r.periode, petunjuk: 'Triwulan I 2026' }) +
            P.bidang({ tipe: 'number', nama: 'persen', label: 'Persentase', nilai: r.persen, min: 0 }) +
            P.bidang({ tipe: 'number', nama: 'nominal', label: 'Nominal (Rp)', nilai: r.nominal, min: 0 }) +
            P.bidang({ nama: 'warna', label: 'Warna donat', nilai: r.warna || '#047857',
                       petunjuk: '#047857' });
    } else {
      isi = P.bidang({ nama: 'nama', label: 'Nama', nilai: r.nama }) +
            P.bidang({ nama: 'peran', label: 'Peran', nilai: r.peran, petunjuk: 'donatur / wali santri' }) +
            P.bidang({ nama: 'kota', label: 'Kota', nilai: r.kota }) +
            P.bidang({ tipe: 'area', nama: 'isi', label: 'Isi testimoni', nilai: r.isi, baris: 4, wajib: true }) +
            P.bidang({ tipe: 'number', nama: 'nominal_tampil', label: 'Nominal yang ditampilkan (Rp)',
                       nilai: r.nominal_tampil, min: 0, bantu: 'Isi 0 bila tidak ingin menampilkan nominal.' });
    }

    isi += P.bidang({ tipe: 'number', nama: 'urutan', label: 'Urutan', nilai: r.urutan || 99, min: 1 }) +
           P.bidang({ tipe: 'saklar', nama: 'tampil', label: 'Tampilkan di situs',
                      nilai: r.id ? r.tampil : true });

    var w = P.modal({
      judul: (r.id ? 'Ubah ' : 'Tambah ') + label(t),
      isi: '<form id="form-konten">' + isi + '</form>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="k-simpan">Simpan</button>'
    });

    w.querySelector('#k-simpan').addEventListener('click', function () {
      var v = P.nilaiForm(document.getElementById('form-konten'));
      v.id = r.id || '';
      P.sibuk(this, true, 'Menyimpan…');
      P.panggil(RUTE_KONTEN[t], v).then(function () {
        P.tutupModal();
        P.toast('Perubahan disimpan.', 'sukses');
        P.buka('konten', true);
      }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#k-simpan'), false); });
    });
  }

  function hapusKonten(t, id) {
    P.konfirmasi('Hapus data ini?', 'Data akan dihapus dari ' + label(t).toLowerCase() + '.', 'Hapus', true)
      .then(function (ya) {
        if (!ya) return;
        P.panggil(RUTE_KONTEN[t], { id: id, hapus: true }).then(function () {
          P.toast('Data dihapus.', 'sukses');
          P.buka('konten', true);
        }).catch(P.galat);
      });
  }

  // ============================================================ FORMULIR
  var formData = { item: [], dipakai: {}, tipe: [] };

  P.P.modul.formulir = function (wadah) {
    return P.panggil('formulirList', {}).then(function (d) {
      formData = d;
      wadah.innerHTML =
        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Formulir Donasi</h2>' +
            '<span class="aksi"><button type="button" class="tombol tombol-primer tombol-kecil" ' +
              'id="fm-baru">+ Formulir baru</button></span></div>' +
          '<p class="kecil redup" style="margin-top:0">Isian tambahan yang diminta ke donatur pada ' +
            'program tertentu — misalnya nama orang yang diwakafkan atau pilihan paket.</p>' +
          (d.item.length ? d.item.map(kartuFormulir).join('')
            : P.kosong('kode', 'Belum ada formulir',
                'Program tanpa formulir khusus tetap memakai isian bawaan: nama, email, WhatsApp, dan doa.')) +
        '</div>';

      P.el('fm-baru').addEventListener('click', function () { suntingFormulir(null); });
      wadah.addEventListener('click', function (e) {
        var u = e.target.closest('[data-fm]');
        if (u) {
          suntingFormulir(d.item.filter(function (f) { return f.id === u.getAttribute('data-fm'); })[0]);
          return;
        }
        var h = e.target.closest('[data-fmh]');
        if (h) hapusFormulir(h.getAttribute('data-fmh'));
      });
    });
  };

  function kartuFormulir(f) {
    var dipakai = formData.dipakai[f.id] || 0;
    return '<div class="panel-kartu" style="padding:var(--s-md);margin-bottom:var(--s-md)">' +
      '<div class="sela">' +
        '<div style="min-width:0">' +
          '<b>' + P.aman(f.nama) + '</b> ' +
            (f.aktif ? P.lencana('Aktif', 'sukses') : P.lencana('Nonaktif', 'netral')) +
          '<div class="mini redup">' + P.aman(f.deskripsi || '') + '</div>' +
          '<div class="mini redup" style="margin-top:.3rem">' +
            (f.field || []).length + ' isian · dipakai ' + dipakai + ' program</div>' +
        '</div>' +
        '<div style="white-space:nowrap">' +
          '<button type="button" class="tombol tombol-lembut tombol-kecil" data-fm="' +
            P.aman(f.id) + '">Ubah</button> ' +
          '<button type="button" class="tombol tombol-lembut tombol-kecil" data-fmh="' +
            P.aman(f.id) + '">Hapus</button>' +
        '</div>' +
      '</div>' +
      ((f.field || []).length
        ? '<div style="margin-top:.5rem">' + f.field.map(function (x) {
            return '<span class="tag-kecil">' + P.aman(x.label) + ' · ' + P.aman(x.tipe) +
                   (x.wajib ? ' *' : '') + '</span>';
          }).join('') + '</div>'
        : '') +
    '</div>';
  }

  function suntingFormulir(f) {
    f = f || { field: [] };

    var w = P.modal({
      judul: f.id ? 'Ubah Formulir' : 'Formulir Baru',
      lebar: true,
      isi: '<form id="form-fm">' +
        P.bidang({ nama: 'nama', label: 'Nama formulir', nilai: f.nama, wajib: true,
                   petunjuk: 'Formulir Wakaf Lahan' }) +
        P.bidang({ nama: 'deskripsi', label: 'Keterangan', nilai: f.deskripsi }) +
        P.bidang({ tipe: 'saklar', nama: 'aktif', label: 'Formulir aktif',
                   nilai: f.id ? f.aktif : true }) +
      '</form>' +
      '<h3 class="label-atas" style="margin-top:var(--s-lg)">Daftar Isian</h3>' +
      '<div id="fm-field"></div>' +
      '<button type="button" class="tombol tombol-lembut tombol-kecil" id="fm-tambah">+ Tambah isian</button>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="fm-simpan">Simpan formulir</button>'
    });

    (f.field || []).forEach(barisField);
    w.querySelector('#fm-tambah').addEventListener('click', function () { barisField({}); });
    w.addEventListener('click', function (e) {
      var x = e.target.closest('[data-buang-field]');
      if (x) x.closest('.fm-baris').remove();
    });

    w.querySelector('#fm-simpan').addEventListener('click', function () {
      var v = P.nilaiForm(document.getElementById('form-fm'));
      if (!v.nama) { P.toast('Nama formulir belum diisi.', 'galat'); return; }

      var field = Array.prototype.map.call(document.querySelectorAll('#fm-field .fm-baris'), function (b, i) {
        return {
          label: b.querySelector('[data-f="label"]').value.trim(),
          key: b.querySelector('[data-f="key"]').value.trim(),
          tipe: b.querySelector('[data-f="tipe"]').value,
          wajib: b.querySelector('[data-f="wajib"]').checked,
          opsi: b.querySelector('[data-f="opsi"]').value.split(',')
                  .map(function (o) { return o.trim(); }).filter(Boolean),
          bantuan: b.querySelector('[data-f="bantuan"]').value.trim(),
          urutan: i + 1
        };
      }).filter(function (x) { return x.label; });

      P.sibuk(this, true, 'Menyimpan…');
      P.panggil('formulirSimpan', {
        id: f.id || '', nama: v.nama, deskripsi: v.deskripsi, aktif: v.aktif,
        field: JSON.stringify(field)
      }).then(function () {
        P.tutupModal();
        P.toast('Formulir disimpan.', 'sukses');
        P.buka('formulir', true);
      }).catch(function (e) { P.galat(e); P.sibuk(w.querySelector('#fm-simpan'), false); });
    });
  }

  function barisField(x) {
    var w = document.getElementById('fm-field');
    var d = document.createElement('div');
    d.className = 'fm-baris';
    d.style.cssText = 'border:1px solid var(--garis);border-radius:var(--r-sm);' +
                      'padding:.6rem;margin-bottom:.5rem';
    d.innerHTML =
      '<div class="baris" style="gap:.4rem;flex-wrap:wrap;align-items:center">' +
        '<input type="text" data-f="label" placeholder="Label isian" value="' +
          P.aman(x.label || '') + '" style="flex:2;min-width:160px">' +
        '<input type="text" data-f="key" placeholder="kunci_data" value="' +
          P.aman(x.key || '') + '" style="flex:1;min-width:120px">' +
        '<select data-f="tipe" style="flex:1;min-width:110px">' +
          formData.tipe.map(function (t) {
            return '<option value="' + t + '"' + (x.tipe === t ? ' selected' : '') + '>' + t + '</option>';
          }).join('') + '</select>' +
        '<label class="centang" style="flex:none"><input type="checkbox" data-f="wajib"' +
          (x.wajib ? ' checked' : '') + '><span class="mini">wajib</span></label>' +
        '<button type="button" class="tombol-bulat" data-buang-field aria-label="Hapus isian">×</button>' +
      '</div>' +
      '<div class="baris" style="gap:.4rem;margin-top:.4rem;flex-wrap:wrap">' +
        '<input type="text" data-f="opsi" placeholder="Opsi pilihan, pisahkan dengan koma" value="' +
          P.aman((x.opsi || []).join(', ')) + '" style="flex:2;min-width:180px">' +
        '<input type="text" data-f="bantuan" placeholder="Teks bantuan di bawah isian" value="' +
          P.aman(x.bantuan || '') + '" style="flex:2;min-width:180px">' +
      '</div>';
    w.appendChild(d);
  }

  function hapusFormulir(id) {
    P.konfirmasi('Hapus formulir ini?',
      'Formulir yang masih dipakai program tidak bisa dihapus. Lepaskan dulu dari programnya.',
      'Hapus', true).then(function (ya) {
      if (!ya) return;
      P.panggil('formulirHapus', { id: id }).then(function () {
        P.toast('Formulir dihapus.', 'sukses');
        P.buka('formulir', true);
      }).catch(P.galat);
    });
  }

  // ============================================================= DOKUMEN
  P.P.modul.dokumen = function (wadah) {
    return P.panggil('kontenList', {}).then(function (d) {
      var item = d.dokumen || [];
      wadah.innerHTML =
        '<div class="panel-kartu">' +
          '<div class="kartu-kepala"><h2>Dokumen Publik</h2>' +
            '<span class="aksi"><button type="button" class="tombol tombol-primer tombol-kecil" ' +
              'id="dk-baru">+ Unggah dokumen</button></span></div>' +
          '<p class="kecil redup" style="margin-top:0">Buletin, laporan keuangan, dan dokumen legalitas ' +
            'yang bisa diunduh pengunjung dari panel samping halaman berita.</p>' +
          (item.length ? '<div class="tabel-bungkus"><table class="tabel">' +
            '<thead><tr><th>Judul</th><th>Jenis</th><th>Periode</th><th class="kanan">Ukuran</th>' +
            '<th>Publik</th><th></th></tr></thead><tbody>' +
            item.map(function (r) {
              return '<tr>' +
                '<td><b>' + P.aman(r.judul) + '</b><br><span class="mini redup">' +
                  P.aman(r.nama_file || '') + '</span></td>' +
                '<td class="kecil">' + P.aman(r.jenis) + '</td>' +
                '<td class="kecil">' + P.aman(r.periode || '—') + '</td>' +
                '<td class="angka kanan">' + P.angka(r.ukuran_kb) + ' KB</td>' +
                '<td>' + (r.publik ? P.lencana('Publik', 'sukses') : P.lencana('Internal', 'netral')) + '</td>' +
                '<td class="kanan" style="white-space:nowrap">' +
                  (r.unduh ? '<a class="tombol tombol-lembut tombol-kecil" href="' + P.aman(r.unduh) +
                    '" target="_blank" rel="noopener">Unduh</a> ' : '') +
                  '<button type="button" class="tombol tombol-lembut tombol-kecil" data-dkh="' +
                    P.aman(r.id) + '">Hapus</button></td>' +
              '</tr>';
            }).join('') + '</tbody></table></div>'
            : P.kosong('berkas', 'Belum ada dokumen',
                'Unggah laporan keuangan triwulan pertama Anda untuk memulai.')) +
        '</div>';

      P.el('dk-baru').addEventListener('click', unggahDokumen);
      wadah.addEventListener('click', function (e) {
        var h = e.target.closest('[data-dkh]');
        if (!h) return;
        var id = h.getAttribute('data-dkh');
        P.konfirmasi('Hapus dokumen ini?', 'Berkasnya juga dipindahkan ke tempat sampah Google Drive.',
          'Hapus', true).then(function (ya) {
          if (!ya) return;
          P.panggil('dokumenHapus', { id: id }).then(function () {
            P.toast('Dokumen dihapus.', 'sukses');
            P.buka('dokumen', true);
          }).catch(P.galat);
        });
      });
    });
  };

  function unggahDokumen() {
    var w = P.modal({
      judul: 'Unggah Dokumen',
      isi: '<form id="form-dk">' +
        P.bidang({ nama: 'judul', label: 'Judul dokumen', wajib: true,
                   petunjuk: 'Laporan Keuangan Triwulan I 2026' }) +
        P.bidang({ tipe: 'pilihan', nama: 'jenis', label: 'Jenis',
                   opsi: [{ nilai: 'buletin', label: 'Buletin' },
                          { nilai: 'laporan', label: 'Laporan keuangan' },
                          { nilai: 'legalitas', label: 'Dokumen legalitas' },
                          { nilai: 'lain', label: 'Lainnya' }] }) +
        P.bidang({ nama: 'periode', label: 'Periode', petunjuk: '2026-Q1' }) +
        P.bidang({ tipe: 'saklar', nama: 'publik', label: 'Boleh diunduh pengunjung situs', nilai: true }) +
        '<div class="bidang"><label for="dk-berkas">Berkas (PDF, JPG, PNG, atau XLSX · maks 10 MB)</label>' +
          '<input type="file" id="dk-berkas" accept=".pdf,.jpg,.jpeg,.png,.xlsx"></div>' +
      '</form>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="dk-simpan">Unggah</button>'
    });

    w.querySelector('#dk-simpan').addEventListener('click', function () {
      var tombol = this;
      var v = P.nilaiForm(document.getElementById('form-dk'));
      var berkas = document.getElementById('dk-berkas').files[0];

      if (!v.judul) { P.toast('Judul dokumen belum diisi.', 'galat'); return; }
      if (!berkas) { P.toast('Pilih berkas yang akan diunggah.', 'galat'); return; }

      P.sibuk(tombol, true, 'Mengunggah…');
      P.bacaBerkas(berkas, 10).then(function (b) {
        return P.panggil('dokumenSimpan', {
          judul: v.judul, jenis: v.jenis, periode: v.periode, publik: v.publik,
          base64: b.base64, mimeType: b.mimeType
        });
      }).then(function () {
        P.tutupModal();
        P.toast('Dokumen diunggah.', 'sukses');
        P.buka('dokumen', true);
      }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
    });
  }
})();
