/* ══════════════════════════════════════════════════════
   부산대학교 물리학과 — 레트로 JS (2000년대 스타일)
══════════════════════════════════════════════════════ */

// ── 1. 실시간 시계 ──────────────────────────────────
function updateClock() {
  var now = new Date();
  var h = String(now.getHours()).padStart(2, '0');
  var m = String(now.getMinutes()).padStart(2, '0');
  var s = String(now.getSeconds()).padStart(2, '0');
  var el = document.getElementById('live-clock');
  if (el) el.textContent = h + ':' + m + ':' + s;

  var days = ['일', '월', '화', '수', '목', '금', '토'];
  var dateEl = document.getElementById('live-date');
  if (dateEl) {
    dateEl.textContent = (now.getFullYear()) + '년 ' +
      (now.getMonth()+1) + '월 ' + now.getDate() + '일 (' + days[now.getDay()] + ')';
  }
}
setInterval(updateClock, 1000);
updateClock();

// ── 2. 탭 전환 ──────────────────────────────────────
function switchTab(group, tabId) {
  var tabs    = document.querySelectorAll('[data-tabgroup="' + group + '"].old-tab');
  var contents = document.querySelectorAll('[data-tabcontent="' + group + '"].tab-content');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  contents.forEach(function(c) { c.classList.remove('active'); });
  var activeTab = document.querySelector('[data-tabgroup="' + group + '"][data-tabid="' + tabId + '"]');
  var activeContent = document.querySelector('[data-tabcontent="' + group + '"][data-contentid="' + tabId + '"]');
  if (activeTab)    activeTab.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

// ── 3. 방문자 카운터 (localStorage 시뮬레이션) ──────
(function() {
  var base = 48273;
  var count = parseInt(localStorage.getItem('pnu_visit') || base);
  count++;
  localStorage.setItem('pnu_visit', count);
  var el = document.getElementById('visit-today');
  if (el) el.textContent = String(count % 300 + 47).padStart(5, '0');
  var tot = document.getElementById('visit-total');
  if (tot) tot.textContent = String(count + base).padStart(7, '0');
})();

// ── 4. 뉴스 검색 ────────────────────────────────────
function doSearch() {
  var q = document.getElementById('search-input').value.trim();
  if (!q) { alert('검색어를 입력하세요.'); return; }
  fetch('/api/search?q=' + encodeURIComponent(q))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      alert('검색결과: ' + data.count + '건\n\n' +
        data.results.map(function(r) { return '· ' + r.title; }).join('\n'));
    });
}

// Enter key search
document.addEventListener('DOMContentLoaded', function() {
  var inp = document.getElementById('search-input');
  if (inp) {
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doSearch();
    });
  }
});

// ── 5. 교수 상세 정보 펼치기 ────────────────────────
function toggleProf(id) {
  var row = document.getElementById('prof-detail-' + id);
  if (!row) return;
  if (row.style.display === 'none' || row.style.display === '') {
    row.style.display = 'table-row';
  } else {
    row.style.display = 'none';
  }
}

// ── 6. bkit 텍스트 분석 ─────────────────────────────
function runBkitAnalysis() {
  var text = document.getElementById('bkit-input').value.trim();
  var result = document.getElementById('bkit-result');
  if (!text) { result.textContent = '텍스트를 입력하세요.'; return; }
  result.textContent = '분석 중...';
  fetch('/api/text-stats?text=' + encodeURIComponent(text))
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.error) { result.textContent = '오류: ' + d.error; return; }
      result.innerHTML =
        '고유어: <b>' + (d.unique_words || '-') + '</b>개 | ' +
        '문장: <b>' + (d.total_sentences || '-') + '</b>개 | ' +
        '글자: <b>' + d.char_count + '</b>자';
    });
}

// ── 7. 팝업창 (레트로 스타일) ───────────────────────
function openNotice(title, content) {
  var w = 420, h = 300;
  var left = (screen.width - w) / 2;
  var top  = (screen.height - h) / 2;
  var popup = window.open('', '_blank',
    'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top +
    ',toolbar=no,menubar=no,scrollbars=yes');
  popup.document.write(
    '<html><head><title>' + title + '</title>' +
    '<style>body{font-family:Dotum,sans-serif;font-size:12px;padding:15px;}' +
    'h3{color:#003087;border-bottom:2px solid #003087;padding-bottom:5px;}' +
    'p{line-height:1.8;color:#333;}</style></head>' +
    '<body><h3>' + title + '</h3><p>' + content + '</p>' +
    '<hr><p style="text-align:center"><button onclick="window.close()">닫기</button></p>' +
    '</body></html>'
  );
}
