/* 문제은행 공통 도우미 — 데이터 파일보다 먼저 불러와야 합니다. */
(function () {
  'use strict';
  window.QBANK = { 1: [], 2: [], 3: [] };
  window.QGEN = { 1: [], 2: [], 3: [] };

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
