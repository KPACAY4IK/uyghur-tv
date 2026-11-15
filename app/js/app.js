'use strict';

/* ============================================================
   УЙГУР ТВ — IPTV плеер
   ============================================================ */

var CHANNELS = [
  {
    name: 'Синьцзян Сателлит',
    lang: 'Уйгурский + Китайский',
    url: 'http://ottrrs.hl.chinamobile.com/PLTV/88888888/224/3221225635/index.m3u8'
  },
  {
    name: 'Бинтуан Сателлит',
    lang: 'Уйгурский + Китайский',
    url: 'http://ottrrs.hl.chinamobile.com/PLTV/88888888/224/3221226439/index.m3u8'
  },
  {
    name: 'Или-Уйгур',
    lang: 'Уйгурский',
    url: 'http://110.153.180.106:55555/out_2/index.m3u8'
  },
  {
    name: 'Или-Казах',
    lang: 'Казахский',
    url: 'http://110.153.180.106:55555/out_3/index.m3u8'
  },
  {
    name: 'Или Экономика',
    lang: 'Уйгурский',
    url: 'http://110.153.180.106:55555/out_4/index.m3u8'
  },
  {
    name: 'Куйтун-Казах',
    lang: 'Казахский',
    url: 'http://218.84.12.186:8002/hls/main/playlist.m3u8'
  },
  {
    name: 'Куйтун Хань',
    lang: 'Китайский',
    url: 'http://218.84.12.186:8001/hls/main/playlist.m3u8'
  },
  {
    name: 'Манас',
    lang: 'Китайский',
    url: 'http://218.84.127.245:1026/hls/main1/playlist.m3u8'
  },
  {
    name: 'Бинтуан 7-й дивизия',
    lang: 'Китайский',
    url: 'https://liveout.btzx.com.cn/ybtkau/078syl.m3u8'
  },
  {
    name: 'Бинтуан 5-й дивизия',
    lang: 'Китайский',
    url: 'http://liveout.btzx.com.cn/62ds9e/4nxdih.m3u8'
  }
];

var selIdx = 0;
var playingIdx = -1;
var volume = 80;
var listVisible = true;

var player = document.getElementById('player');
var playerLoading = document.getElementById('player-loading');
var playerLabel = document.getElementById('player-label');
var listEl = document.getElementById('channel-list');
var listChannels = document.getElementById('list-channels');

/* === Часы === */
function tickClock() {
  var now = new Date();
  var hh = String(now.getHours()).padStart(2, '0');
  var mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('hud-clock').textContent = hh + ':' + mm;
  document.getElementById('list-clock').textContent = hh + ':' + mm;
}

/* === HUD === */
var hudTimer = null;
function showHud() {
  document.body.classList.add('show-hud');
  clearTimeout(hudTimer);
  hudTimer = setTimeout(function () {
    document.body.classList.remove('show-hud');
  }, 6000);
}

/* === Громкость === */
var volTimer = null;
function showVolume() {
  var bar = document.getElementById('vol-bar');
  document.getElementById('vol-fill').style.width = volume + '%';
  document.getElementById('vol-val').textContent = volume;
  bar.classList.add('show');
  clearTimeout(volTimer);
  volTimer = setTimeout(function () { bar.classList.remove('show'); }, 3000);
}

function setVolume(val) {
  volume = Math.max(0, Math.min(100, val));
  player.volume = volume / 100;
  showVolume();
}

/* === Список каналов === */
function renderList() {
  listChannels.innerHTML = '';
  CHANNELS.forEach(function (ch, i) {
    var div = document.createElement('div');
    div.className = 'channel-item' + (i === selIdx ? ' selected' : '') + (i === playingIdx ? ' playing' : '');
    div.textContent = ch.name;
    div.addEventListener('click', function () {
      selIdx = i;
      renderList();
      playChannel(i);
    });
    listChannels.appendChild(div);
  });
  /* Scroll to selected */
  var sel = listChannels.querySelector('.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

/* === Воспроизведение === */
function playChannel(idx) {
  var ch = CHANNELS[idx];
  playingIdx = idx;
  playerLoading.style.display = 'block';
  playerLoading.textContent = 'Подключение: ' + ch.name + '...';
  playerLabel.textContent = ch.name + ' · ' + ch.lang;
  playerLabel.style.display = 'block';

  player.src = ch.url;
  player.volume = volume / 100;
  player.load();

  player.oncanplay = function () {
    playerLoading.style.display = 'none';
    player.play().catch(function () {});
  };
  player.onerror = function () {
    playerLoading.style.display = 'block';
    playerLoading.textContent = 'Ошибка: ' + ch.name + ' недоступен';
  };

  renderList();
}

function toggleList() {
  listVisible = !listVisible;
  listEl.classList.toggle('hidden', !listVisible);
}

/* === Управление === */
function doBack() {
  if (listVisible) {
    toggleList();
    return;
  }
  try { window.history.back(); } catch (e) {}
  try { window.parent.postMessage('back', '*'); } catch (e) {}
}

function bindKeys() {
  document.addEventListener('keydown', function (e) {
    showHud();
    var k = e.keyCode || e.which;
    var keyName = e.key || '';

    /* Back */
    if (k === 10009 || k === 27 || k === 461) {
      e.preventDefault(); e.stopPropagation();
      doBack();
      return;
    }

    /* OK → toggle list */
    if (k === 13) {
      e.preventDefault();
      toggleList();
      return;
    }

    /* ↑ ↓ — выбор канала */
    if (k === 38 || k === 10038 || keyName === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      selIdx = ((selIdx - 1) % CHANNELS.length + CHANNELS.length) % CHANNELS.length;
      renderList();
      return;
    }
    if (k === 40 || k === 10040 || keyName === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation();
      selIdx = (selIdx + 1) % CHANNELS.length;
      renderList();
      return;
    }

    /* → — включить выбранный канал */
    if (k === 39 || k === 10039 || keyName === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation();
      playChannel(selIdx);
      return;
    }

    /* VolumeUp / VolumeDown */
    if (k === 447 || k === 175 || keyName === 'VolumeUp') {
      e.preventDefault(); e.stopPropagation();
      setVolume(volume + 10);
      return;
    }
    if (k === 448 || k === 174 || keyName === 'VolumeDown') {
      e.preventDefault(); e.stopPropagation();
      setVolume(volume - 10);
      return;
    }

    /* Красная — обновить */
    if (k === 403 || k === 82) {
      e.preventDefault();
      if (playingIdx >= 0) playChannel(playingIdx);
      return;
    }

    /* Зелёная — следующий канал */
    if (k === 404 || k === 71) {
      e.preventDefault();
      selIdx = (selIdx + 1) % CHANNELS.length;
      playChannel(selIdx);
      return;
    }

    /* Жёлтая — предыдущий канал */
    if (k === 405 || k === 89) {
      e.preventDefault();
      selIdx = ((selIdx - 1) % CHANNELS.length + CHANNELS.length) % CHANNELS.length;
      playChannel(selIdx);
      return;
    }

    /* Синяя — скрыть/показать список */
    if (k === 406 || k === 66) {
      e.preventDefault();
      toggleList();
      return;
    }
  }, true);

  document.addEventListener('mousemove', showHud);
  document.addEventListener('click', showHud);

  try {
    if (window.tizen && tizen.tvinputdevice) {
      var keys = ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
                  'Return', 'Exit', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                  'VolumeUp', 'VolumeDown', 'VolumeMute'];
      keys.forEach(function (key) {
        try { tizen.tvinputdevice.registerKey(key); } catch (e) {}
      });
    }
  } catch (e) {}
}

document.getElementById('btn-back').addEventListener('click', doBack);

/* ============================================================
   СТАРТ
   ============================================================ */
tickClock();
setInterval(tickClock, 1000);
renderList();
showHud();
bindKeys();

/* Автозапуск первого канала */
playChannel(0);
