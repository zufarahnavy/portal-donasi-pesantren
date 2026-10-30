/* ============================================================================
   api.js — Penghubung ke backend Google Apps Script
   ----------------------------------------------------------------------------
   Aturan yang tidak boleh dilanggar:
   • POST WAJIB memakai Content-Type text/plain. JSON memicu permintaan
     preflight CORS yang selalu ditolak Apps Script.
   • Tidak ada rahasia di berkas ini. Hanya URL /exec, yang memang publik.
   • Setiap pembacaan identik yang berbarengan digabung jadi satu permintaan,
     supaya satu halaman tidak membangunkan beberapa eksekusi server sekaligus.
   ============================================================================ */

(function (global) {
  'use strict';

  var CFG = global.APP_CONFIG || {};
  var URL_GAS = String(CFG.GAS_URL || '');
  var SIAP = !!URL_GAS && !/GANTI|XXXX|^$/.test(URL_GAS);

  // ------------------------------------------------------------ Penyimpanan aman
  // localStorage bisa dilarang (mode penyamaran, cookie diblokir). Semua akses
  // dibungkus supaya halaman tetap jalan tanpanya.
  function simpanAmbil(k) { try { return global.localStorage.getItem(k); } catch (e) { return null; } }
  function simpanTaruh(k, v) { try { global.localStorage.setItem(k, v); } catch (e) {} }
  function simpanHapus(k) { try { global.localStorage.removeItem(k); } catch (e) {} }

  // Penanda perangkat — hanya untuk membatasi kiriman beruntun, bukan pengaman.
  var CID = simpanAmbil('pd_cid');
  if (!CID) {
    CID = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    simpanTaruh('pd_cid', CID);
  }

  // ------------------------------------------------------------ Galat ramah
  function Galat(pesan, kode) {
    var e = new Error(pesan);
    e.kode = kode || 0;
    return e;
  }

  function pastiSiap() {
    if (!SIAP) {
      throw Galat('Aplikasi belum terhubung ke server. Isi GAS_URL di berkas assets/js/config.js ' +
                  'dengan alamat Web App Apps Script Anda.', 0);
    }
  }

  // ------------------------------------------------------------ Penggabung baca
  var _berjalan = {};
  var _epochTulis = 0;

  /**
   * Aksi panel yang hanya MEMBACA, dan karena itu boleh digabungkan serta
   * disimpan sebentar di memori.
   *
   * Daftarnya ditulis tangan, bukan ditebak dari nama. Dua aksi di bawah ini
   * sengaja TIDAK ada di sini meski namanya terdengar seperti pembacaan:
   *   • notifTes   — benar-benar mengirim pesan WhatsApp
   *   • buktiUrl   — memuat berkas besar dan tercatat di jejak aktivitas,
   *                  jadi tiap pembukaannya memang harus sampai ke server
   * Hal yang sama berlaku untuk exportDonasi dan crmEkspor.
   */
  var BACA_PANEL = {
    dashboard: 1, donasiList: 1, donasiDetail: 1, laporanRekap: 1, programPanel: 1,
    crmList: 1, crmStat: 1, crmDetail: 1, crmGanda: 1,
    waPerangkat: 1, blastPenerima: 1, blastList: 1,
    sectionList: 1, beritaPanel: 1, formulirList: 1, kontenList: 1,
    pengaturanList: 1, penggunaList: 1, notifTemplate: 1, notifAntrean: 1,
    logList: 1, migrasiCek: 1, sistemStatus: 1
  };

  /** Umur simpanan di memori: cukup untuk bolak-balik menu, terlalu pendek untuk basi. */
  var UMUR_BACA_MS = 15000;
  var _simpanBaca = {};

  function kunciBaca(action, data, token) {
    return action + '|' + JSON.stringify(data || {}) + '|' + String(token || '').slice(-12);
  }

  function buangSimpananBaca() { _simpanBaca = {}; }

  function jalankanGet(action, params) {
    var q = ['action=' + encodeURIComponent(action), 'cid=' + encodeURIComponent(CID)];
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      if (v === undefined || v === null || v === '') return;
      q.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });

    return fetch(URL_GAS + '?' + q.join('&'), { method: 'GET', redirect: 'follow' })
      .then(bacaJawaban);
  }

  function bacaJawaban(res) {
    return res.text().then(function (teks) {
      var data;
      try { data = JSON.parse(teks); }
      catch (e) {
        throw Galat('Jawaban server tidak terbaca. Pastikan URL /exec sudah benar dan ' +
                    'Web App di-deploy dengan akses "Anyone".', 0);
      }
      if (!data.ok) throw Galat(data.error || 'Permintaan gagal.', data.code || 400);
      if (data.nq || (data.data && data.data.antrean)) jadwalkanDrain();
      return data;
    });
  }

  /** Pembacaan publik — hasil identik yang berbarengan ikut menumpang. */
  function get(action, params) {
    pastiSiap();
    var kunci = _epochTulis + '|' + action + '|' + JSON.stringify(params || {});
    if (_berjalan[kunci]) return _berjalan[kunci];

    var p = jalankanGet(action, params);
    _berjalan[kunci] = p;
    p.then(function () { delete _berjalan[kunci]; }, function () { delete _berjalan[kunci]; });
    return p;
  }

  function kirimPost(action, data, token) {
    return fetch(URL_GAS, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // WAJIB, jangan diubah
      redirect: 'follow',
      body: JSON.stringify({
        action: action,
        data: data || {},
        token: token || null,
        cid: CID,
        origin: global.location ? global.location.origin : ''
      })
    }).then(bacaJawaban);
  }

  /**
   * Semua aksi tulis dan aksi panel.
   *
   * Pembacaan panel diperlakukan berbeda dari penulisan, dan perbedaan itu
   * yang membuat panel terasa cepat:
   *
   *   • Dua permintaan baca yang identik dan berbarengan digabung menjadi
   *     satu. Dulu satu klik bisa membangunkan tiga eksekusi server sekaligus
   *     ketika ada penangan klik yang menumpuk.
   *   • Hasil baca disimpan 15 detik di memori, sehingga bolak-balik antar
   *     menu tidak menunggu perjalanan ke server untuk kedua kalinya.
   *   • Begitu ada satu saja penulisan, seluruh simpanan dibuang. Data basi
   *     setelah menyimpan perubahan jauh lebih berbahaya daripada lambat.
   */
  function post(action, data, token) {
    pastiSiap();
    var baca = !!BACA_PANEL[action] && !(data && data._fresh);

    if (!baca) {
      _epochTulis++;
      buangSimpananBaca();                       // apa pun yang ditulis, anggap semua basi
      return kirimPost(action, data, token);
    }

    var kunci = kunciBaca(action, data, token);
    var simpan = _simpanBaca[kunci];
    if (simpan && Date.now() - simpan.t < UMUR_BACA_MS) return Promise.resolve(simpan.r);
    if (_berjalan[kunci]) return _berjalan[kunci];

    var p = kirimPost(action, data, token).then(function (res) {
      _simpanBaca[kunci] = { t: Date.now(), r: res };
      delete _berjalan[kunci];
      return res;
    }, function (err) {
      delete _berjalan[kunci];
      throw err;
    });
    _berjalan[kunci] = p;
    return p;
  }

  /**
   * Mulai mengambil data sebelum diminta — dipakai panel saat kursor
   * menyentuh sebuah menu. Kegagalannya sengaja didiamkan: ini hanya
   * ancang-ancang, bukan permintaan yang ditunggu siapa pun.
   */
  function prefetch(action, data, token) {
    if (!SIAP || !BACA_PANEL[action]) return;
    var kunci = kunciBaca(action, data, token);
    if (_berjalan[kunci] || _simpanBaca[kunci]) return;
    try { post(action, data, token).catch(function () {}); } catch (e) {}
  }

  /**
   * Beberapa pembacaan dalam satu eksekusi server.
   * `token` diperlukan bila salah satu aksi berada di balik login (panel).
   */
  function batch(daftar, token) {
    pastiSiap();
    return fetch(URL_GAS, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({ action: 'batch', calls: daftar, token: token || null, cid: CID })
    }).then(bacaJawaban);
  }

  // ------------------------------------------------------------ Simpan sementara
  function cacheAmbil(kunci, umurDetik) {
    var mentah = simpanAmbil('pd_' + kunci);
    if (!mentah) return null;
    try {
      var o = JSON.parse(mentah);
      var umur = (Date.now() - o.t) / 1000;
      return { data: o.d, basi: umur > (umurDetik || CFG.UMUR_CACHE || 600) };
    } catch (e) { return null; }
  }

  function cacheTaruh(kunci, data) {
    try { simpanTaruh('pd_' + kunci, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
  }

  /**
   * Tampilkan dulu dari simpanan, lalu segarkan dari server di belakang layar.
   * `saatData` bisa dipanggil dua kali: sekali dari cache, sekali dari server.
   */
  function swr(kunci, action, params, saatData, opsi) {
    opsi = opsi || {};
    var adaCache = false;

    if (!opsi.segar) {
      var c = cacheAmbil(kunci, opsi.umur);
      if (c) {
        adaCache = true;
        try { saatData(c.data, true); } catch (e) { console.error(e); }
        if (!c.basi) return Promise.resolve(c.data);
      }
    }

    return get(action, params).then(function (res) {
      cacheTaruh(kunci, res.data);
      saatData(res.data, false);
      return res.data;
    }).catch(function (err) {
      if (!adaCache) throw err;
      console.warn('Gagal menyegarkan ' + action + ': ' + err.message);
      return null;
    });
  }

  function bersihkanCache() {
    buangSimpananBaca();
    try {
      Object.keys(global.localStorage).forEach(function (k) {
        if (k.indexOf('pd_') === 0 && k !== 'pd_cid' && k !== 'pd_tema') simpanHapus(k);
      });
    } catch (e) {}
  }

  // ------------------------------------------------------------ Pemanasan & antrean
  var _warmTerakhir = 0;
  function panaskan(lingkup) {
    if (!SIAP) return;
    var kunci = 'pd_warm_' + (lingkup || 'pub');
    var lalu = Number(simpanAmbil(kunci) || 0);
    if (Date.now() - lalu < 4 * 60 * 1000) return;
    simpanTaruh(kunci, String(Date.now()));
    _warmTerakhir = Date.now();
    try { fetch(URL_GAS + '?w=' + encodeURIComponent(lingkup || 'pub'), { mode: 'no-cors' }); } catch (e) {}
  }

  var _timerDrain = null, _sisaDrain = 3;
  function jadwalkanDrain() {
    if (_timerDrain) return;
    _timerDrain = setTimeout(function () {
      _timerDrain = null;
      if (!SIAP || _sisaDrain <= 0) return;
      _sisaDrain--;
      post('drain', {}).then(function (res) {
        if (res.data && res.data.sisa > 0) jadwalkanDrain();
      }).catch(function () {});
    }, 500);
  }

  // ------------------------------------------------------------ Ekspor
  global.API = {
    siap: SIAP,
    url: URL_GAS,
    cid: CID,
    get: get,
    post: post,
    prefetch: prefetch,
    batch: batch,
    swr: swr,
    cacheAmbil: cacheAmbil,
    cacheTaruh: cacheTaruh,
    bersihkanCache: bersihkanCache,
    panaskan: panaskan,
    drain: jadwalkanDrain,
    simpanAmbil: simpanAmbil,
    simpanTaruh: simpanTaruh,
    simpanHapus: simpanHapus
  };
})(window);
