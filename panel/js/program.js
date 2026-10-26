/* ============================================================================
   program.js — Kelola program donasi (CRUD + RAB + legalitas + galeri)
   ============================================================================ */

(function () {
  'use strict';

  var P = PANEL;
  var simpanan = { item: [], formulir: [], kategori: [] };

  P.P.modul.program = function (wadah) {
    return P.panggil('programPanel', {}).then(function (d) {
      simpanan = d;
      wadah.innerHTML =
        '<div class="panel-kartu">' +
          '<div class="kartu-kepala">' +
            '<h2>Program Donasi</h2>' +
            '<span class="aksi">' +
              '<button type="button" class="tombol tombol-primer tombol-kecil" id="p-baru">+ Program baru</button>' +
            '</span>' +
          '</div>' +
          daftar(d.item) +
        '</div>';

      P.subJudul(P.angka(d.item.length) + ' program · ' +
        P.angka(d.item.filter(function (p) { return p.status === 'aktif'; }).length) + ' sedang berjalan');

      P.el('p-baru').addEventListener('click', function () { sunting(null); });
      wadah.addEventListener('click', function (e) {
        var s = e.target.closest('[data-sunting]');
        if (s) { sunting(cari(s.getAttribute('data-sunting'))); return; }
        var h = e.target.closest('[data-hapus]');
        if (h) hapus(cari(h.getAttribute('data-hapus')));
      });
    });
  };

  function cari(id) {
    return simpanan.item.filter(function (p) { return p.id === id; })[0] || null;
  }

  function daftar(item) {
    if (!item.length) {
      return P.kosong('hati', 'Belum ada program',
        'Buat program pertama agar donatur punya tujuan yang jelas untuk berdonasi.');
    }

    return '<div class="tabel-bungkus"><table class="tabel">' +
      '<thead><tr><th>Program</th><th>Kategori</th><th class="kanan">Target</th>' +
      '<th class="kanan">Terkumpul</th><th>Status</th><th></th></tr></thead><tbody>' +
      item.map(function (p) {
        return '<tr>' +
          '<td><b>' + P.aman(p.judul) + '</b><br>' +
            '<span class="mini redup mono">' + P.aman(p.slug) + '</span>' +
            (p.unggulan ? ' <span class="tag-kecil">unggulan</span>' : '') + '</td>' +
          '<td>' + P.lencana(p.kategori, 'netral') + '</td>' +
          '<td class="angka kanan">' + P.rupiah(p.target_dana) + '</td>' +
          '<td class="angka kanan"><b>' + P.rupiah(p.terkumpul) + '</b><br>' +
            '<span class="mini redup">' + P.angka(p.persen) + '% · ' +
            P.angka(p.jumlah_donatur) + ' donatur</span></td>' +
          '<td>' + statusLencana(p.status) + '</td>' +
          '<td class="kanan" style="white-space:nowrap">' +
            '<button type="button" class="tombol tombol-lembut tombol-kecil" data-sunting="' +
              P.aman(p.id) + '">Ubah</button> ' +
            '<button type="button" class="tombol tombol-lembut tombol-kecil" data-hapus="' +
              P.aman(p.id) + '">Hapus</button>' +
          '</td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function statusLencana(s) {
    if (s === 'aktif') return P.lencana('Aktif', 'sukses');
    if (s === 'selesai') return P.lencana('Selesai', 'emas');
    return P.lencana('Draf', 'netral');
  }

  // ====================================================== Formulir program
  function sunting(p) {
    p = p || {};
    var rab = JSON.parse(p.rab_json || '[]');
    var legal = JSON.parse(p.legalitas_json || '[]');
    var galeri = JSON.parse(p.galeri_json || '[]');

    var w = P.modal({
      judul: p.id ? 'Ubah Program' : 'Program Baru',
      lebar: true,
      isi: '<form id="form-program">' +
        '<div class="panel-kisi-2" style="gap:var(--s-lg)">' +
          '<div>' +
            P.bidang({ nama: 'judul', label: 'Judul program', nilai: p.judul, wajib: true,
                       petunjuk: 'Wakaf Pembebasan Lahan Asrama Tahfidz' }) +
            P.bidang({ nama: 'slug', label: 'Alamat halaman (slug)', nilai: p.slug,
                       bantu: 'Dikosongkan berarti dibuatkan otomatis dari judul.' }) +
            P.bidang({ tipe: 'pilihan', nama: 'kategori', label: 'Kategori', nilai: p.kategori,
                       opsi: simpanan.kategori }) +
            P.bidang({ tipe: 'area', nama: 'ringkasan', label: 'Ringkasan singkat', nilai: p.ringkasan,
                       baris: 3, bantu: 'Satu-dua kalimat yang tampil di kartu program.' }) +
            P.bidang({ tipe: 'number', nama: 'target_dana', label: 'Target dana (Rp)',
                       nilai: p.target_dana || 0, min: 0, langkah: 100000 }) +
            '<div class="baris" style="gap:.6rem">' +
              '<div class="tumbuh">' + P.bidang({ tipe: 'date', nama: 'tanggal_mulai',
                  label: 'Mulai', nilai: (p.tanggal_mulai || '').slice(0, 10) }) + '</div>' +
              '<div class="tumbuh">' + P.bidang({ tipe: 'date', nama: 'tanggal_selesai',
                  label: 'Selesai', nilai: (p.tanggal_selesai || '').slice(0, 10) }) + '</div>' +
            '</div>' +
            P.bidang({ tipe: 'pilihan', nama: 'status', label: 'Status', nilai: p.status,
                       opsi: [{ nilai: 'draft', label: 'Draf — belum tampil di situs' },
                              { nilai: 'aktif', label: 'Aktif — menerima donasi' },
                              { nilai: 'selesai', label: 'Selesai — target tercapai' }] }) +
            P.bidang({ tipe: 'saklar', nama: 'unggulan', label: 'Tandai sebagai program unggulan',
                       nilai: p.unggulan }) +
            P.bidang({ tipe: 'number', nama: 'urutan', label: 'Urutan tampil', nilai: p.urutan || 99, min: 1 }) +
          '</div>' +

          '<div>' +
            P.bidang({ nama: 'gambar_url', label: 'Gambar utama (URL)', nilai: p.gambar_url,
                       bantu: 'Unggah gambar lewat menu Identitas & Pengaturan, lalu tempel alamatnya di sini.' }) +
            P.bidang({ tipe: 'area', nama: 'galeri_teks', label: 'Galeri (satu URL per baris)',
                       nilai: galeri.join('\n'), baris: 3 }) +
            P.bidang({ tipe: 'area', nama: 'deskripsi_html', label: 'Penjelasan lengkap',
                       nilai: p.deskripsi_html, baris: 7,
                       bantu: 'Boleh memakai <p>, <h3>, <ul>, <b>. Tag berbahaya otomatis dibuang server.' }) +
            P.bidang({ tipe: 'area', nama: 'kutipan_dalil', label: 'Kutipan dalil', nilai: p.kutipan_dalil,
                       baris: 2 }) +
            P.bidang({ tipe: 'pilihan', nama: 'form_id', label: 'Formulir donasi', nilai: p.form_id,
                       opsi: [{ nilai: '', label: 'Formulir bawaan' }].concat(
                         simpanan.formulir.map(function (f) { return { nilai: f.id, label: f.nama }; })) }) +
          '</div>' +
        '</div>' +

        '<h3 class="label-atas" style="margin-top:var(--s-lg)">Rincian Anggaran (RAB)</h3>' +
        '<div id="rab-daftar"></div>' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" id="rab-tambah">+ Baris RAB</button>' +

        '<h3 class="label-atas" style="margin-top:var(--s-lg)">Legalitas &amp; Jaminan</h3>' +
        '<div id="legal-daftar"></div>' +
        '<button type="button" class="tombol tombol-lembut tombol-kecil" id="legal-tambah">+ Baris legalitas</button>' +
      '</form>',
      kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
            '<button type="button" class="tombol tombol-primer" id="p-simpan">Simpan program</button>'
    });

    gambarBaris('rab-daftar', rab, RAB, RAB_LABEL);
    gambarBaris('legal-daftar', legal, LEGAL, LEGAL_LABEL);

    w.querySelector('#rab-tambah').addEventListener('click', function () {
      tambahBaris('rab-daftar', RAB, RAB_LABEL);
    });
    w.querySelector('#legal-tambah').addEventListener('click', function () {
      tambahBaris('legal-daftar', LEGAL, LEGAL_LABEL);
    });
    w.addEventListener('click', function (e) {
      var x = e.target.closest('[data-buang]');
      if (x) x.closest('.baris-dinamis').remove();
    });

    w.querySelector('#p-simpan').addEventListener('click', function () { simpan(p, this); });
  }

  // Bentuk kedua daftar harus sama persis dengan yang dibaca halaman publik
  // (assets/js/program.js), bukan nama kolom karangan panel.
  var RAB         = ['label', 'ket', 'nominal', 'persen'];
  var RAB_LABEL   = ['Uraian pekerjaan', 'Keterangan', 'Nominal (Rp)', '% anggaran'];
  var LEGAL       = ['judul', 'ket', 'nomor'];
  var LEGAL_LABEL = ['Nama dokumen', 'Keterangan', 'Nomor registrasi'];

  function gambarBaris(idWadah, data, kunci, label) {
    var w = document.getElementById(idWadah);
    w.innerHTML = '';
    (data || []).forEach(function (d) { tambahBaris(idWadah, kunci, label, d); });
  }

  function tambahBaris(idWadah, kunci, label, nilai) {
    nilai = nilai || {};
    var w = document.getElementById(idWadah);
    var d = document.createElement('div');
    d.className = 'baris baris-dinamis';
    d.style.cssText = 'gap:.4rem;margin-bottom:.5rem;align-items:center;flex-wrap:wrap';

    d.innerHTML = kunci.map(function (k, i) {
      var angkaan = k === 'nominal' || k === 'persen';
      var lebar = k === 'persen' ? '70px' : (i === 0 ? '180px' : '140px');
      return '<input type="' + (angkaan ? 'number' : 'text') + '" data-k="' + k + '" ' +
        'placeholder="' + P.aman(label[i]) + '" aria-label="' + P.aman(label[i]) + '" ' +
        'value="' + P.aman(nilai[k] === undefined ? '' : nilai[k]) + '" ' +
        'style="flex:' + (i === 0 ? '2' : '1') + ';min-width:' + lebar + '">';
    }).join('') +
      '<button type="button" class="tombol-bulat" data-buang aria-label="Hapus baris">×</button>';

    w.appendChild(d);
  }

  function bacaBaris(idWadah, kunci) {
    return Array.prototype.map.call(
      document.getElementById(idWadah).querySelectorAll('.baris-dinamis'),
      function (b) {
        var o = {};
        kunci.forEach(function (k) {
          var i = b.querySelector('[data-k="' + k + '"]');
          o[k] = i ? (i.type === 'number' ? Number(i.value) || 0 : i.value.trim()) : '';
        });
        return o;
      }
    ).filter(function (o) { return o[kunci[0]]; });
  }

  function simpan(p, tombol) {
    var form = document.getElementById('form-program');
    var v = P.nilaiForm(form);

    if (!v.judul) { P.toast('Judul program belum diisi.', 'galat'); return; }

    v.id = p.id || '';
    v.rab_json = JSON.stringify(bacaBaris('rab-daftar', RAB));
    v.legalitas_json = JSON.stringify(bacaBaris('legal-daftar', LEGAL));
    v.galeri_json = JSON.stringify(
      String(v.galeri_teks || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean));
    delete v.galeri_teks;

    P.sibuk(tombol, true, 'Menyimpan…');
    P.panggil('programSimpan', v).then(function () {
      P.tutupModal();
      P.toast(p.id ? 'Program diperbarui.' : 'Program baru dibuat.', 'sukses');
      P.buka('program', true);
    }).catch(function (e) { P.galat(e); P.sibuk(tombol, false); });
  }

  function hapus(p) {
    if (!p) return;
    P.konfirmasi('Hapus program “' + p.judul + '”?',
      'Program yang sudah pernah menerima donasi tidak bisa dihapus — riwayatnya harus tetap utuh. ' +
      'Untuk program seperti itu, ubah statusnya menjadi "Selesai" agar berhenti menerima donasi ' +
      'tanpa menghilangkan catatannya.',
      'Hapus program', true
    ).then(function (ya) {
      if (!ya) return;
      P.panggil('programHapus', { id: p.id }).then(function () {
        P.toast('Program dihapus.', 'sukses');
        P.buka('program', true);
      }).catch(P.galat);
    });
  }
})();
