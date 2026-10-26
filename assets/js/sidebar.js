/* ============================================================================
   sidebar.js — Panel samping bersama untuk berita.html & artikel.html
   Menggambar: Buletin & Laporan, Agenda Pesantren, Donut Audit Realisasi, Ajakan
   ============================================================================ */

(function (global) {
  'use strict';

  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function gambar(el, s) {
    if (!el) return;
    s = s || {};
    el.innerHTML = kotakDokumen(s.dokumen || []) + kotakAgenda(s.agenda || []) +
                   kotakAudit(s.audit) + kotakAjakan();

    // Animasi donut dijalankan setelah elemen masuk DOM
    var don = el.querySelector('#donut-audit');
    if (!don) return;
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(don.querySelectorAll('circle[data-isi]'), function (c) {
        c.style.strokeDashoffset = c.getAttribute('data-isi');
      });
    });
  }

  function rangka() {
    return '<div class="kaca sidebar-kotak">' +
      '<div class="rangka rangka-baris" style="width:50%"></div>' +
      '<div class="rangka rangka-baris"></div>' +
      '<div class="rangka rangka-baris" style="width:80%"></div></div>' +
      '<div class="kaca sidebar-kotak">' +
      '<div class="rangka rangka-baris" style="width:40%"></div>' +
      '<div class="rangka rangka-baris"></div>' +
      '<div class="rangka rangka-baris" style="width:65%"></div></div>';
  }

  // ---------------------------------------------------------------- Dokumen
  function kotakDokumen(daftar) {
    if (!daftar.length) return '';
    return '<div class="kaca sidebar-kotak">' +
      '<span class="label-atas">Publikasi Resmi</span>' +
      '<h3>Buletin &amp; Laporan</h3>' +
      daftar.slice(0, 4).map(function (d) {
        return '<div class="baris" style="padding:.55rem 0;border-bottom:1px dashed var(--garis)">' +
          '<span class="ikon-wadah" style="width:36px;height:36px">' + UI.ikon('berkas', 'ikon-sm') + '</span>' +
          '<span class="lajur tumbuh" style="min-width:0">' +
            '<b style="font-size:.8125rem">' + UI.aman(d.judul) + '</b>' +
            '<span class="mini redup">' + UI.aman(d.periode || '') +
              (d.ukuran_kb ? ' · ' + UI.angkaID(d.ukuran_kb) + ' KB' : '') + '</span>' +
          '</span>' +
          (d.unduh
            ? '<a class="tombol-bulat" href="' + UI.aman(d.unduh) + '" target="_blank" rel="noopener" ' +
              'aria-label="Unduh ' + UI.aman(d.judul) + '">' + UI.ikon('unduh', 'ikon-sm') + '</a>'
            : '<span class="mini redup">segera</span>') +
        '</div>';
      }).join('') +
    '</div>';
  }

  // ----------------------------------------------------------------- Agenda
  function kotakAgenda(daftar) {
    if (!daftar.length) return '';
    return '<div class="kaca sidebar-kotak">' +
      '<div class="baris-sela"><h3 style="margin:0">Agenda Pesantren</h3>' +
        UI.ikon('kalender', 'ikon-sm') + '</div>' +
      '<div style="margin-top:var(--s-md)">' + daftar.map(function (a) {
        var t = String(a.tanggal || '');
        var d = new Date(t.length === 10 ? t + 'T00:00:00' : t);
        var sah = !isNaN(d.getTime());
        var sub = [a.waktu, a.lokasi].filter(Boolean).join(' · ');
        return '<div class="agenda-butir">' +
          '<span class="agenda-tgl"><b>' + (sah ? d.getDate() : '–') + '</b>' +
            '<span>' + (sah ? BLN[d.getMonth()] : '') + '</span></span>' +
          '<span class="lajur" style="min-width:0">' +
            '<b style="font-size:.8125rem">' + UI.aman(a.judul) + '</b>' +
            (sub ? '<span class="mini redup">' + UI.aman(sub) + '</span>' : '') +
            (a.keterangan ? '<span class="mini redup potong-2">' + UI.aman(a.keterangan) + '</span>' : '') +
          '</span>' +
        '</div>';
      }).join('') + '</div>' +
    '</div>';
  }

  // ------------------------------------------------------------------ Audit
  function kotakAudit(audit) {
    if (!audit || !audit.item || !audit.item.length) return '';
    var keliling = 2 * Math.PI * 42;
    var mulai = 0;

    var busur = audit.item.map(function (x) {
      var panjang = Math.max(0, Math.min(100, Number(x.persen) || 0)) / 100 * keliling;
      var el = '<circle cx="54" cy="54" r="42" fill="none" stroke="' + UI.aman(x.warna || '#047857') + '" ' +
        'stroke-width="13" stroke-linecap="butt" ' +
        'stroke-dasharray="' + panjang.toFixed(2) + ' ' + (keliling - panjang).toFixed(2) + '" ' +
        'stroke-dashoffset="' + keliling.toFixed(2) + '" data-isi="' + (-mulai).toFixed(2) + '" ' +
        'style="transition:stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)"></circle>';
      mulai += panjang;
      return el;
    }).join('');

    return '<div class="kaca sidebar-kotak" id="donut-audit">' +
      '<div class="baris-sela"><h3 style="margin:0">Audit Realisasi</h3>' + UI.ikon('diagram', 'ikon-sm') + '</div>' +
      '<p class="mini redup" style="margin:.4rem 0 var(--s-md)">Proporsi penyaluran dana amanah' +
        (audit.periode ? ' periode ' + UI.aman(audit.periode) : '') + ', diaudit internal dan ditutup bulanan.</p>' +
      '<div class="donut">' +
        '<div class="donut-tengah">' +
          '<svg width="108" height="108" viewBox="0 0 108 108" role="img" ' +
            'aria-label="Diagram proporsi penyaluran dana">' +
            '<circle cx="54" cy="54" r="42" fill="none" stroke="var(--permukaan-lembut)" stroke-width="13"></circle>' +
            busur +
          '</svg>' +
          '<div class="donut-angka">' + UI.angkaID(audit.tersalurkan) + '%</div>' +
        '</div>' +
        '<div class="donut-legenda">' + audit.item.map(function (x) {
          return '<div><span class="donut-titik" style="background:' + UI.aman(x.warna || '#047857') + '"></span>' +
            '<span class="tumbuh" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
            UI.aman(x.label) + '</span><b class="angka">' + UI.angkaID(x.persen) + '%</b></div>';
        }).join('') + '</div>' +
      '</div>' +
    '</div>';
  }

  // ------------------------------------------------------------------ Ajakan
  function kotakAjakan() {
    return '<div class="sidebar-kotak sidebar-ajak">' +
      '<span class="ikon-wadah" style="background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.22)">' +
        UI.ikon('hati', 'ikon-lg') + '</span>' +
      '<h3>Ikut Menjaga Nyala Pesantren</h3>' +
      '<p>Sebutir beras, satu sak semen asrama, dan selembar mushaf yang Anda wakafkan ' +
        'terus mengalirkan pahala selama ia dibaca dan ditempati.</p>' +
      '<a class="tombol tombol-emas tombol-penuh" href="index.html#program">Tunaikan Donasi Sekarang</a>' +
    '</div>';
  }

  global.SIDEBAR = { gambar: gambar, rangka: rangka };
})(window);
