/* 문제은행 공통 도우미 — 데이터 파일보다 먼저 불러와야 합니다. */
(function () {
  'use strict';
  window.QBANK = { 1: [], 2: [], 3: [] };
  window.QGEN = { 1: [], 2: [], 3: [] };
  window.PASTSETS = [];

  /* 2026 기출 유형 시험지: 60문항 고정 순서 (1~20 1과목, 21~40 2과목, 41~60 3과목) */
  window.addPast = function (title, desc, list) {
    var n = PASTSETS.length;
    var seed = 7919 * (n + 1);
    var rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    PASTSETS.push({ title: title, desc: desc, qs: list.map(function (x, i) {
      /* 보기 순서를 회차·문항마다 정해진 방식으로 섞어 정답 위치를 고르게 한다 (매번 같은 순서) */
      var perm = [0, 1, 2, 3];
      for (var k = 3; k > 0; k--) { var j = Math.floor(rnd() * (k + 1)); var t = perm[k]; perm[k] = perm[j]; perm[j] = t; }
      return { id: 'p' + n + '-' + (i + 1), subj: i < 20 ? 1 : (i < 40 ? 2 : 3), t: x[0], q: x[1],
        o: perm.map(function (p) { return x[2][p]; }), e: perm.map(function (p) { return x[4][p]; }), a: perm.indexOf(x[3] - 1), h: x[5] || '' };
    }) });
  };

  /* 문항 형식: [주제, 질문, [보기1~4], 정답번호(1~4), [보기별 해설1~4], 추가HTML(선택)] */
  window.addQ = function (subj, list) {
    list.forEach(function (x) {
      QBANK[subj].push({ t: x[0], q: x[1], o: x[2], a: x[3] - 1, e: x[4], h: x[5] || '' });
    });
  };

  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  window.esc = esc;

  function colName(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

  /* 엑셀 시트 모양 표: rows = 2차원 배열, o.r/o.c = 시작 행/열 번호 */
  window.SHEET = function (rows, o) {
    o = o || {};
    var r0 = o.r || 1, c0 = o.c || 1, cols = 0;
    rows.forEach(function (r) { cols = Math.max(cols, r.length); });
    var h = '<div class="sheet-wrap"><table class="sheet"><thead><tr><th class="corner"></th>';
    for (var c = 0; c < cols; c++) h += '<th>' + colName(c0 + c) + '</th>';
    h += '</tr></thead><tbody>';
    rows.forEach(function (r, i) {
      h += '<tr><th>' + (r0 + i) + '</th>';
      for (var c = 0; c < cols; c++) {
        var v = r[c];
        if (v === undefined || v === null) v = '';
        var num = typeof v === 'number';
        var txt = num && o.comma ? v.toLocaleString('ko-KR') : String(v);
        h += '<td' + (num ? ' class="num"' : '') + '>' + esc(txt) + '</td>';
      }
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  };

  /* 액세스 데이터시트 모양 표 */
  window.DBT = function (name, headers, rows) {
    var h = '<div class="sheet-wrap"><div class="dbt-tab">' + esc(name) + '</div><table class="sheet dbt"><thead><tr>';
    headers.forEach(function (x) { h += '<th>' + esc(x) + '</th>'; });
    h += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr>';
      r.forEach(function (v) { h += '<td' + (typeof v === 'number' ? ' class="num"' : '') + '>' + esc(v) + '</td>'; });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  };

  /* 코드·수식 상자 */
  window.CODE = function (text) { return '<pre class="code">' + esc(text) + '</pre>'; };
})();
