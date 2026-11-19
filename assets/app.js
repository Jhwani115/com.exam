/* 컴퓨터활용능력 1급 필기 CBT — 화면과 동작 */
(function () {
  'use strict';

  var SUBJ = {
    1: { name: '1과목', title: '컴퓨터 일반', desc: 'Windows 10 · 하드웨어 · 네트워크 · 보안 · 멀티미디어' },
    2: { name: '2과목', title: '스프레드시트 일반', desc: 'Excel 2021 · 함수 · 차트 · 데이터 분석 · 매크로' },
    3: { name: '3과목', title: '데이터베이스 일반', desc: 'Access 2021 · 테이블 · 쿼리/SQL · 폼 · 보고서' }
  };
  var NUM = ['①', '②', '③', '④'];
  var PER_SET = 20, GEN_PER_SET = 4, EXAM_MIN = 60;

  var app = document.getElementById('app');
  var esc = window.esc;
  var txt = function (s) { return esc(s).replace(/\n/g, '<br>'); };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

  /* 문제 ID 부여 */
  [1, 2, 3].forEach(function (s) { QBANK[s].forEach(function (q, i) { q.id = 's' + s + '-' + (i + 1); q.subj = s; }); });

  /* ── 출제 이력 (브라우저 저장소가 막혀 있어도 동작) ── */
  var mem = {};
  function getUsed(s) {
    if (!mem['u' + s]) {
      var arr = [];
      try { arr = JSON.parse(localStorage.getItem('cbt1_used_' + s) || '[]'); } catch (e) { arr = []; }
      mem['u' + s] = new Set(arr);
    }
    return mem['u' + s];
  }
  function saveUsed(s) { try { localStorage.setItem('cbt1_used_' + s, JSON.stringify(Array.from(getUsed(s)))); } catch (e) { } }
  var lastSet = { 1: [], 2: [], 3: [] };
  var genSeen = new Set();

  function shuffleOptions(q) {
    var perm = shuffle([0, 1, 2, 3]);
    return {
      id: q.id, subj: q.subj, t: q.t, q: q.q, h: q.h, gen: !!q.gen,
      o: perm.map(function (i) { return q.o[i]; }),
      e: perm.map(function (i) { return q.e[i]; }),
      a: perm.indexOf(q.a)
    };
  }

  /* 새 문제 세트: 직전 세트·이미 푼 문제를 피해 뽑음 */
  function drawSet(s, exclude) {
    var bank = QBANK[s], gens = QGEN[s] || [];
    var nGen = gens.length ? GEN_PER_SET : 0, nBank = PER_SET - nGen;
    var used = getUsed(s), cycled = false;
    var ex = exclude || new Set();   /* 지금 화면에 있는 세트는 바로 다음 세트에 다시 나오지 않게 */
    var ok = function (q) { return !used.has(q.id) && !ex.has(q.id); };
    var avail = bank.filter(ok);
    if (avail.length < nBank) {
      used.clear();
      lastSet[s].forEach(function (id) { used.add(id); });
      avail = bank.filter(ok);
      cycled = true;
    }
    var picked = shuffle(avail).slice(0, nBank);
    picked.forEach(function (q) { used.add(q.id); });
    saveUsed(s);
    lastSet[s] = picked.map(function (q) { return q.id; });
    var out = picked.slice();
    var order = shuffle(gens);
    for (var k = 0; k < nGen; k++) {
      var g = order[k % order.length], item, tries = 0;
      do { item = g(); tries++; } while (genSeen.has(item.id) && tries < 40);
      genSeen.add(item.id); item.subj = s; out.push(item);
    }
    return { qs: shuffle(out).map(shuffleOptions), cycled: cycled };
  }
  function remaining(s) { var u = getUsed(s); return QBANK[s].filter(function (q) { return !u.has(q.id); }).length; }

  /* ── 상태 ── */
  var view = 'home';
  var P = {};          // 과목별 연습 상태
  var E = null;        // 모의고사 상태
  var timerId = null;

  /* ── 공통 ── */
  function setView(v) {
    if (E && !E.done && v !== E.view) {
      modal('모의고사를 그만둘까요?', '진행 중인 실전 모의고사가 종료되고 답안은 저장되지 않습니다.', '그만두기', function () {
        stopTimer(); E = null; go(v);
      });
      return;
    }
    go(v);
  }
  function go(v) {
    view = v;
    document.querySelectorAll('.nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); });
    render();
    window.scrollTo(0, 0);
  }
  function render(keepScroll) {
    var y = window.scrollY;
    if (view === 'home') renderHome();
    else if (view === 'exam' || view === 'past') renderExam();
    else if (view === 'saved') renderSaved();
    else renderPractice(+view.slice(1));
    if (keepScroll) window.scrollTo(0, y);
    saveState();
  }

  /* ── 풀던 상태 저장·복원 ──
     휴대폰이 백그라운드에서 페이지를 지웠다가 다시 열어도 풀던 문제, 고른 답, 남은 시간이 그대로 돌아오도록 한다. */
  var STATE_KEY = 'cbt1_state_v1';
  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        view: view, P: P, E: E, lastSet: lastSet, genSeen: Array.from(genSeen),
        y: window.scrollY, at: Date.now()
      }));
    } catch (e) { }
  }
  function loadState() {
    try {
      var d = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (!d || typeof d !== 'object') return null;
      if (Date.now() - (d.at || 0) > 7 * 24 * 3600 * 1000) return null;   /* 일주일 지난 기록은 버림 */
      return d;
    } catch (e) { return null; }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') saveState(); });
  window.addEventListener('pagehide', saveState);
  var scrollTimer = null;
  window.addEventListener('scroll', function () { clearTimeout(scrollTimer); scrollTimer = setTimeout(saveState, 400); }, { passive: true });

  function modal(title, body, okText, onOk, cancelText) {
    var m = document.createElement('div');
    m.className = 'modal-bg';
    m.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><h3>' + esc(title) + '</h3><p>' + body + '</p><div class="modal-actions">' +
      (cancelText === false ? '' : '<button class="btn ghost" data-x="no">' + esc(cancelText || '취소') + '</button>') +
      '<button class="btn primary" data-x="ok">' + esc(okText) + '</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (ev) {
      var x = ev.target.getAttribute('data-x');
      if (x === 'ok') { m.remove(); if (onOk) onOk(); }
      else if (x === 'no' || ev.target === m) m.remove();
    });
    var ok = m.querySelector('[data-x="ok"]'); if (ok) ok.focus();
  }
  function toast(msg) {
    document.querySelectorAll('.toast').forEach(function (x) { x.remove(); });
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  /* 문제 본문 */
  var ICON_SAVE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path class="bm" d="M6.5 3.75h11a.75.75 0 0 1 .75.75v15.6l-6.25-4.2-6.25 4.2V4.5a.75.75 0 0 1 .75-.75z"/></svg>';
  function qBody(q, n, saveIdx) {
    var on = isSaved(q);
    return '<div class="q-head"><span class="q-no">' + n + '</span><span class="tag">' + esc(q.t) + '</span>' +
      (q.gen ? '<span class="tag calc">계산형</span>' : '') +
      '<button class="save-btn' + (on ? ' on' : '') + '" data-save="' + (saveIdx === undefined ? '' : saveIdx) + '" aria-pressed="' + on + '" aria-label="' + (on ? '저장 취소' : '다시 볼 문제로 저장') + '" title="' + (on ? '저장 취소' : '다시 볼 문제로 저장') + '">' + ICON_SAVE + '</button></div>' +
      '<p class="q-text">' + txt(q.q) + '</p>' + (q.h ? '<div class="q-extra">' + q.h + '</div>' : '');
  }
  function explainList(q, chosen) {
    var h = '<ol class="ex-list">';
    q.o.forEach(function (o, i) {
      var cls = i === q.a ? 'ok' : (i === chosen ? 'bad' : '');
      var label = i === q.a ? '정답' : (i === chosen ? '내가 고른 답' : '오답');
      h += '<li class="' + cls + '"><span class="ex-n">' + NUM[i] + '</span><div><span class="ex-label">' + label + '</span>' +
        '<span class="ex-opt">' + txt(o) + '</span><span class="ex-why">' + txt(q.e[i].replace(/^정답\.\s*/, '')) + '</span></div></li>';
    });
    return h + '</ol>';
  }

  /* ── 홈 ── */
  function renderHome() {
    var cards = [1, 2, 3].map(function (s) {
      return '<button class="card subj" data-go="s' + s + '"><span class="card-kicker">' + SUBJ[s].name + '</span>' +
        '<span class="card-title">' + SUBJ[s].title + '</span><span class="card-desc">' + SUBJ[s].desc + '</span>' +
        '<span class="card-foot">20문제 연습하기 <span aria-hidden="true">→</span></span></button>';
    }).join('');
    app.innerHTML =
      '<section class="hero"><p class="eyebrow">대한상공회의소 출제 기준 · Windows 10 · MS Office 2021</p>' +
      '<h1>컴퓨터활용능력 1급 필기 CBT</h1>' +
      '<p class="lead">과목을 골라 20문제씩 풀고, 한 문제를 풀 때마다 모든 보기의 해설을 확인하세요. ' +
      '‘새 문제 20개’를 누르면 이전과 겹치지 않는 문제로 바뀝니다.</p></section>' +
      '<div class="cards">' + cards +
      '<button class="card exam" data-go="exam"><span class="card-kicker">실전 모의고사</span><span class="card-title">전 과목 60문제 · 60분</span>' +
      '<span class="card-desc">실제 시험처럼 시간 안에 풀고 제출하면 채점 결과와 해설, 합격 여부를 보여 줍니다.</span>' +
      '<span class="card-foot">시험 시작하기 <span aria-hidden="true">→</span></span></button>' +
      '<button class="card exam" data-go="past"><span class="card-kicker">2026 기출 유형</span><span class="card-title">상시 기출 유형 3회분</span>' +
      '<span class="card-desc">2026년 상시 기출과 같은 순서·주제·유형으로 만든 고정 시험지를 60분 동안 풉니다.</span>' +
      '<span class="card-foot">회차 고르기 <span aria-hidden="true">→</span></span></button></div>' +
      '<section class="info"><h2>시험 안내</h2><dl>' +
      '<div><dt>문항 수</dt><dd>과목당 20문항, 총 60문항 (4지 선다)</dd></div>' +
      '<div><dt>시험 시간</dt><dd>60분</dd></div>' +
      '<div><dt>합격 기준</dt><dd>과목별 40점 이상, 전 과목 평균 60점 이상</dd></div>' +
      '<div><dt>문제은행</dt><dd>1과목 ' + QBANK[1].length + '문항 · 2과목 ' + QBANK[2].length + '문항 · 3과목 ' + QBANK[3].length + '문항 + 계산형 자동 생성 문제</dd></div>' +
      '</dl></section>';
    app.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { setView(b.dataset.go); }; });
  }

  /* ── 과목별 연습 ── */
  function newPractice(s) {
    var prev = P[s], cur = new Set(), unsolved = [];
    if (prev) prev.qs.forEach(function (q, i) {
      cur.add(q.id);
      if (prev.ans[i] === null && !q.gen) unsolved.push(q.id);
    });
    var d = drawSet(s, cur);
    /* 풀지 않은 문제는 출제 기록에서 빼서 나중에 다시 나오게 한다 */
    if (unsolved.length) { var u = getUsed(s); unsolved.forEach(function (id) { u.delete(id); }); saveUsed(s); }
    P[s] = { qs: d.qs, ans: new Array(PER_SET).fill(null), idx: 0, round: (prev ? prev.round + 1 : 1) };
    if (d.cycled) toast(SUBJ[s].name + ' 문제은행을 한 바퀴 다 풀었어요. 처음부터 다시 섞어 출제합니다.');
  }
  function renderPractice(s) {
    if (!P[s]) newPractice(s);
    var st = P[s], q = st.qs[st.idx], chosen = st.ans[st.idx];
    var done = st.ans.filter(function (x) { return x !== null; }).length;
    var right = st.ans.filter(function (x, i) { return x !== null && x === st.qs[i].a; }).length;
    var finished = done === PER_SET;

    var dots = st.qs.map(function (qq, i) {
      var a = st.ans[i], cls = a === null ? '' : (a === qq.a ? 'ok' : 'bad');
      return '<button class="dot ' + cls + (i === st.idx ? ' cur' : '') + '" data-i="' + i + '" aria-label="' + (i + 1) + '번 문제">' + (i + 1) + '</button>';
    }).join('');

    var opts = q.o.map(function (o, i) {
      var cls = '';
      if (chosen !== null) cls = i === q.a ? 'ok' : (i === chosen ? 'bad' : 'dim');
      return '<button class="opt ' + cls + '" data-o="' + i + '"' + (chosen !== null ? ' disabled' : '') + '><span class="opt-n">' + NUM[i] + '</span><span>' + txt(o) + '</span></button>';
    }).join('');

    var feedback = '';
    if (chosen !== null) {
      var ok = chosen === q.a;
      feedback = '<div class="verdict ' + (ok ? 'ok' : 'bad') + '">' + (ok ? '정답입니다!' : '아쉬워요. 정답은 ' + NUM[q.a] + '입니다.') + '</div>' +
        '<div class="explain"><h4>보기별 해설</h4>' + explainList(q, chosen) + '</div>';
    }

    var summary = '';
    if (finished) {
      var score = right * 5;
      summary = '<div class="summary"><div><p class="sum-k">이번 세트 결과</p><p class="sum-v">' + right + ' / 20 <small>(' + score + '점)</small></p>' +
        '<p class="sum-m">' + (score >= 60 ? '좋아요! 평균 합격선(60점)을 넘었어요.' : (score >= 40 ? '과락은 면했어요. 틀린 문제의 해설을 다시 확인해 보세요.' : '40점 미만은 과락이에요. 해설을 꼼꼼히 읽고 다시 도전해 보세요.')) + '</p></div>' +
        '<div class="sum-actions">' + (right < 20 ? '<button class="btn ghost" id="first-wrong">틀린 문제 보기</button>' : '') +
        '<button class="btn primary" id="refresh2">새 문제 20개 풀기</button></div></div>';
    }

    app.innerHTML =
      '<section class="practice">' +
      '<div class="p-top"><div><span class="kicker">' + SUBJ[s].name + ' · ' + st.round + '세트</span><h2>' + SUBJ[s].title + '</h2></div>' +
      '<button class="btn ghost refresh" id="refresh"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"/></svg>새 문제 20개</button></div>' +
      '<div class="p-stats"><span>진행 <b>' + done + '</b>/20</span><span class="s-ok">정답 <b>' + right + '</b></span><span class="s-bad">오답 <b>' + (done - right) + '</b></span>' +
      '<span class="s-left">남은 새 문제 ' + remaining(s) + '개 + 계산형 무제한</span></div>' +
      '<div class="bar"><i style="width:' + (done / PER_SET * 100) + '%"></i></div>' +
      summary +
      '<div class="dots">' + dots + '</div>' +
      '<article class="qcard">' + qBody(q, st.idx + 1) + '<div class="opts">' + opts + '</div>' + feedback + '</article>' +
      '<div class="q-nav"><button class="btn ghost" id="prev"' + (st.idx === 0 ? ' disabled' : '') + '>이전</button>' +
      '<button class="btn primary" id="next"' + (st.idx === PER_SET - 1 ? ' disabled' : '') + '>다음</button></div>' +
      '</section>';

    app.querySelectorAll('.opt').forEach(function (b) {
      b.onclick = function () { st.ans[st.idx] = +b.dataset.o; syncSaved(q, st.ans[st.idx]); render(true); };
    });
    bindSave(function () { return { q: q, my: st.ans[st.idx], src: SUBJ[s].name + ' 연습' }; });
    app.querySelectorAll('.dot').forEach(function (b) { b.onclick = function () { st.idx = +b.dataset.i; render(true); }; });
    document.getElementById('prev').onclick = function () { if (st.idx > 0) { st.idx--; render(true); } };
    document.getElementById('next').onclick = function () { if (st.idx < PER_SET - 1) { st.idx++; render(true); } };
    var doRefresh = function () { newPractice(s); render(); window.scrollTo(0, 0); };
    document.getElementById('refresh').onclick = function () {
      if (done > 0 && !finished) modal('새 문제로 바꿀까요?', '새로운 20문제가 출제됩니다. 아직 풀지 않은 문제는 남은 새 문제로 돌아가 나중에 다시 나와요.', '새 문제 받기', doRefresh);
      else doRefresh();
    };
    var r2 = document.getElementById('refresh2'); if (r2) r2.onclick = doRefresh;
    var fw = document.getElementById('first-wrong');
    if (fw) fw.onclick = function () { for (var i = 0; i < PER_SET; i++) if (st.ans[i] !== st.qs[i].a) { st.idx = i; break; } render(true); };
  }

  /* ── 실전 모의고사 ── */
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function fmtTime(ms) { var t = Math.max(0, Math.ceil(ms / 1000)); var m = Math.floor(t / 60), s = t % 60; return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }

  function startExam(setIdx) {
    var qs = [], title = '실전 모의고사';
    if (typeof setIdx === 'number') {
      var ps = window.PASTSETS[setIdx];
      qs = ps.qs.slice();
      title = ps.title;
    } else {
      [1, 2, 3].forEach(function (s) { qs = qs.concat(drawSet(s).qs); });
    }
    E = { qs: qs, ans: new Array(60).fill(null), idx: 0, endAt: Date.now() + EXAM_MIN * 60000, done: false, filter: 'all', subjF: 0, sheetOpen: false,
      view: view, setIdx: setIdx, title: title };
    startTimer();
    render();
    window.scrollTo(0, 0);
  }
  function startTimer() {
    stopTimer();
    timerId = setInterval(function () {
      if (!E || E.done) return stopTimer();
      var left = E.endAt - Date.now();
      var el = document.getElementById('timer');
      if (el) { el.textContent = fmtTime(left); el.parentNode.classList.toggle('warn', left < 5 * 60000); }
      if (left <= 0) { submitExam(true); }
    }, 500);
  }
  function grade() {
    var r = { 1: 0, 2: 0, 3: 0 };
    E.qs.forEach(function (q, i) { if (E.ans[i] === q.a) r[q.subj]++; });
    var sc = { 1: r[1] * 5, 2: r[2] * 5, 3: r[3] * 5 };
    var avg = (sc[1] + sc[2] + sc[3]) / 3;
    var fail = [1, 2, 3].filter(function (s) { return sc[s] < 40; });
    return { right: r, score: sc, avg: avg, fail: fail, pass: !fail.length && avg >= 60 };
  }
  function submitExam(auto) {
    stopTimer();
    E.done = true;
    E.usedMs = EXAM_MIN * 60000 - Math.max(0, E.endAt - Date.now());
    E.result = grade();
    render();
    window.scrollTo(0, 0);
    if (auto) modal('시험 시간이 끝났어요', '60분이 지나 자동으로 제출되었습니다. 채점 결과를 확인하세요.', '확인', null, false);
  }

  function renderExam() {
    if (!E || E.view !== view) return view === 'past' ? renderPastIntro() : renderExamIntro();
    if (E.done) return renderExamResult();
    var q = E.qs[E.idx], s = q.subj, chosen = E.ans[E.idx];
    var answered = E.ans.filter(function (x) { return x !== null; }).length;
    var opts = q.o.map(function (o, i) {
      return '<button class="opt' + (chosen === i ? ' sel' : '') + '" data-o="' + i + '"><span class="opt-n">' + NUM[i] + '</span><span>' + txt(o) + '</span></button>';
    }).join('');
    var sheet = [1, 2, 3].map(function (sj) {
      var cells = '';
      for (var i = (sj - 1) * 20; i < sj * 20; i++) {
        var a = E.ans[i];
        cells += '<button class="cell' + (a !== null ? ' done' : '') + (i === E.idx ? ' cur' : '') + '" data-i="' + i + '"><span>' + (i + 1) + '</span><b>' + (a !== null ? NUM[a] : '') + '</b></button>';
      }
      return '<div class="sheet-group"><p>' + SUBJ[sj].name + ' ' + SUBJ[sj].title + '</p><div class="cells">' + cells + '</div></div>';
    }).join('');
    var left = E.endAt - Date.now();
    var tabs = [1, 2, 3].map(function (sj) {
      return '<button class="tab' + (sj === s ? ' on' : '') + '" data-t="' + sj + '">' + SUBJ[sj].name + '</button>';
    }).join('');

    app.innerHTML =
      '<section class="exam-view">' +
      '<p class="ex-title">' + esc(E.title) + '</p>' +
      '<div class="ex-bar"><div class="ex-time' + (left < 5 * 60000 ? ' warn' : '') + '"><span>남은 시간</span><b id="timer">' + fmtTime(left) + '</b></div>' +
      '<div class="ex-count">답안 <b>' + answered + '</b>/60</div>' +
      '<button class="btn primary" id="submit">답안 제출</button></div>' +
      '<div class="tabs">' + tabs + '</div>' +
      '<div class="ex-layout"><div class="ex-main">' +
      '<article class="qcard">' + qBody(q, E.idx + 1) + '<div class="opts">' + opts + '</div></article>' +
      '<div class="q-nav"><button class="btn ghost" id="prev"' + (E.idx === 0 ? ' disabled' : '') + '>이전</button>' +
      '<button class="btn primary" id="next"' + (E.idx === 59 ? ' disabled' : '') + '>다음</button></div></div>' +
      '<aside class="ex-sheet' + (E.sheetOpen ? ' open' : '') + '"><button class="sheet-toggle" id="sheet-toggle">답안 표기란 ' + (E.sheetOpen ? '접기' : '펼치기') + '</button>' +
      '<div class="sheet-body"><h4>답안 표기란</h4>' + sheet + '</div></aside></div></section>';

    app.querySelectorAll('.opt').forEach(function (b) {
      b.onclick = function () {
        var v = +b.dataset.o;
        E.ans[E.idx] = E.ans[E.idx] === v ? null : v;
        syncSaved(q, E.ans[E.idx]);
        render(true);
      };
    });
    bindSave(function () { return { q: q, my: E.ans[E.idx], src: E.title }; });
    app.querySelectorAll('.cell').forEach(function (b) { b.onclick = function () { E.idx = +b.dataset.i; render(true); }; });
    app.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { E.idx = (+b.dataset.t - 1) * 20; render(true); }; });
    document.getElementById('prev').onclick = function () { if (E.idx > 0) { E.idx--; render(true); } };
    document.getElementById('next').onclick = function () { if (E.idx < 59) { E.idx++; render(true); } };
    document.getElementById('sheet-toggle').onclick = function () { E.sheetOpen = !E.sheetOpen; render(true); };
    document.getElementById('submit').onclick = function () {
      var miss = 60 - E.ans.filter(function (x) { return x !== null; }).length;
      modal('답안을 제출할까요?', miss ? '아직 답을 고르지 않은 문제가 <b>' + miss + '개</b> 있어요. 제출하면 수정할 수 없습니다.' : '모든 문제에 답을 표기했어요. 제출하면 수정할 수 없습니다.', '제출하기', function () { submitExam(false); });
    };
  }

  function renderExamIntro() {
    app.innerHTML =
      '<section class="intro"><span class="kicker">실전 모의고사</span><h2>전 과목 60문제 · 60분</h2>' +
      '<ul class="rules"><li>1과목 컴퓨터 일반, 2과목 스프레드시트 일반, 3과목 데이터베이스 일반에서 20문제씩 출제됩니다.</li>' +
      '<li>시험 중에는 정답과 해설이 보이지 않으며, 고른 답은 제출 전까지 언제든 바꿀 수 있어요. 같은 보기를 다시 누르면 선택이 해제됩니다.</li>' +
      '<li>60분이 지나면 자동으로 제출됩니다.</li>' +
      '<li>합격 기준: 과목별 40점 이상, 전 과목 평균 60점 이상 (문항당 5점)</li></ul>' +
      '<button class="btn primary big" id="start">시험 시작</button></section>';
    document.getElementById('start').onclick = function () { startExam(); };
  }

  function renderPastIntro() {
    var sets = window.PASTSETS || [];
    var cards = sets.map(function (ps, i) {
      return '<button class="card past-card" data-p="' + i + '"><span class="card-kicker">60문항 · 60분</span>' +
        '<span class="card-title">' + esc(ps.title) + '</span><span class="card-desc">' + esc(ps.desc) + '</span>' +
        '<span class="card-foot">시험 시작</span></button>';
    }).join('');
    app.innerHTML =
      '<section class="intro wide"><span class="kicker">2026 기출 유형</span><h2>2026년 상시 기출 유형 시험지</h2>' +
      '<p class="lead">2026년 상시 기출의 문항 순서·주제·유형을 따라 새로 작성한 시험지예요. 실제 시험과 같은 순서로 60문항을 60분 동안 풉니다.</p>' +
      '<ul class="rules"><li>문항 순서와 보기 순서는 고정되어 있어요.</li><li>시험 중에는 해설이 보이지 않고, 제출하면 채점 결과와 보기별 해설이 나와요.</li>' +
      '<li>합격 기준: 과목별 40점 이상, 평균 60점 이상 (문항당 5점)</li></ul>' +
      '<div class="cards">' + cards + '</div></section>';
    app.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { startExam(+b.dataset.p); }; });
  }

  function renderExamResult() {
    var r = E.result;
    var bars = [1, 2, 3].map(function (s) {
      var sc = r.score[s], f = sc < 40;
      return '<div class="sbar"><div class="sbar-k"><b>' + SUBJ[s].name + '</b> ' + SUBJ[s].title + '</div>' +
        '<div class="sbar-track"><i class="' + (f ? 'bad' : 'ok') + '" style="width:' + sc + '%"></i><span class="cut" style="left:40%"></span></div>' +
        '<div class="sbar-v' + (f ? ' bad' : '') + '">' + sc + '점' + (f ? ' <small>과락</small>' : '') + '</div></div>';
    }).join('');
    var reason = r.pass ? '모든 과목 40점 이상, 평균 ' + r.avg.toFixed(1) + '점으로 합격 기준을 넘었어요.'
      : (r.fail.length ? r.fail.map(function (s) { return SUBJ[s].name; }).join(', ') + '이(가) 40점 미만(과락)이에요.' : '') +
        (r.avg < 60 ? (r.fail.length ? ' ' : '') + '평균이 ' + r.avg.toFixed(1) + '점으로 60점에 못 미쳐요.' : '');
    var mm = Math.floor(E.usedMs / 60000), ss = Math.floor(E.usedMs / 1000) % 60;

    var list = E.qs.map(function (q, i) { return { q: q, i: i }; }).filter(function (x) {
      if (E.subjF && x.q.subj !== E.subjF) return false;
      if (E.filter === 'wrong') return E.ans[x.i] !== x.q.a;
      return true;
    });
    var items = list.map(function (x) {
      var q = x.q, a = E.ans[x.i], ok = a === q.a;
      return '<article class="qcard review ' + (ok ? 'r-ok' : 'r-bad') + '"><div class="r-mark">' + (ok ? '정답' : (a === null ? '미표기' : '오답')) + '</div>' +
        qBody(q, x.i + 1, x.i) + '<p class="r-line">내 답: <b>' + (a === null ? '없음' : NUM[a]) + '</b> · 정답: <b>' + NUM[q.a] + '</b></p>' +
        '<div class="explain">' + explainList(q, a) + '</div></article>';
    }).join('') || '<p class="empty">해당하는 문제가 없어요.</p>';

    var fbtn = function (k, label) { return '<button class="chip-btn' + (E.filter === k ? ' on' : '') + '" data-f="' + k + '">' + label + '</button>'; };
    var sbtn = function (k, label) { return '<button class="chip-btn' + (E.subjF === k ? ' on' : '') + '" data-s="' + k + '">' + label + '</button>'; };

    app.innerHTML =
      '<section class="result"><div class="res-head ' + (r.pass ? 'pass' : 'fail') + '"><p class="kicker">' + esc(E.title) + ' 결과</p>' +
      '<h2>' + (r.pass ? '합격' : '불합격') + '</h2><p>' + reason + '</p>' +
      '<div class="res-nums"><div><span>평균</span><b>' + r.avg.toFixed(1) + '</b></div><div><span>맞힌 문제</span><b>' + (r.right[1] + r.right[2] + r.right[3]) + '/60</b></div><div><span>걸린 시간</span><b>' + mm + '분 ' + ss + '초</b></div></div></div>' +
      '<div class="sbars">' + bars + '<p class="cut-note">세로선은 과락 기준(40점)</p></div>' +
      '<div class="res-actions"><button class="btn primary" id="again">' + (E.view === 'past' ? '다시 풀기' : '새 모의고사 보기') + '</button>' + (E.view === 'past' ? '<button class="btn ghost" id="others">다른 회차 보기</button>' : '') + '<button class="btn ghost" id="home">처음으로</button></div>' +
      '<h3 class="rv-title">문제 다시 보기와 해설</h3>' +
      '<div class="filters"><div>' + fbtn('all', '전체') + fbtn('wrong', '틀린 문제만') + '</div><div>' + sbtn(0, '전 과목') + sbtn(1, '1과목') + sbtn(2, '2과목') + sbtn(3, '3과목') + '</div></div>' +
      items + '</section>';

    var si = E.setIdx;
    document.getElementById('again').onclick = function () { E = null; startExam(si); };
    var oth = document.getElementById('others'); if (oth) oth.onclick = function () { E = null; render(); window.scrollTo(0, 0); };
    document.getElementById('home').onclick = function () { E = null; go('home'); };
    app.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { E.filter = b.dataset.f; render(true); }; });
    app.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { E.subjF = +b.dataset.s; render(true); }; });
    bindSave(function (i) { return { q: E.qs[i], my: E.ans[i], src: E.title }; });
  }

  /* ── 다시 볼 문제 저장 ── */
  var SAVED_KEY = 'cbt1_saved_v1';
  var savedMem = null;
  function savedList() {
    if (!savedMem) {
      try { savedMem = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch (e) { savedMem = []; }
      if (!Array.isArray(savedMem)) savedMem = [];
    }
    return savedMem;
  }
  function writeSaved() { try { localStorage.setItem(SAVED_KEY, JSON.stringify(savedList())); } catch (e) { } updateSavedBadge(); }
  function savedIndex(q) { var L = savedList(); for (var i = 0; i < L.length; i++) if (L[i].k === q.id) return i; return -1; }
  function isSaved(q) { return !!q && savedIndex(q) >= 0; }
  function syncSaved(q, my) { var i = savedIndex(q); if (i >= 0) { savedList()[i].my = my; writeSaved(); } }
  function toggleSaved(info) {
    var i = savedIndex(info.q);
    if (i >= 0) { savedList().splice(i, 1); writeSaved(); toast('저장을 취소했어요.'); return false; }
    savedList().unshift({ k: info.q.id, q: info.q, my: info.my === undefined ? null : info.my, src: info.src || '', at: Date.now() });
    writeSaved(); toast('저장했어요. ‘저장한 문제’ 탭에서 볼 수 있어요.');
    return true;
  }
  function bindSave(getInfo) {
    app.querySelectorAll('[data-save]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var raw = b.getAttribute('data-save');
        var on = toggleSaved(getInfo(raw === '' ? undefined : +raw));
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
        b.setAttribute('aria-label', on ? '저장 취소' : '다시 볼 문제로 저장');
        b.title = on ? '저장 취소' : '다시 볼 문제로 저장';
      };
    });
  }
  function updateSavedBadge() {
    var b = document.querySelector('.nav [data-v="saved"]');
    if (b) b.innerHTML = '저장한 문제' + (savedList().length ? ' <span class="badge">' + savedList().length + '</span>' : '');
  }

  var SV = { f: 'all', s: 0, mode: 'view', tried: {} };
  function renderSaved() {
    var L = savedList();
    var state = function (it) { return it.my === null || it.my === undefined ? 'none' : (it.my === it.q.a ? 'ok' : 'bad'); };
    var list = L.filter(function (it) {
      if (SV.s && it.q.subj !== SV.s) return false;
      if (SV.f === 'wrong') return state(it) === 'bad';
      if (SV.f === 'right') return state(it) === 'ok';
      return true;
    });
    var cnt = { all: L.length, wrong: 0, right: 0 };
    L.forEach(function (it) { var st = state(it); if (st === 'bad') cnt.wrong++; if (st === 'ok') cnt.right++; });
    var fbtn = function (k, label) { return '<button class="chip-btn' + (SV.f === k ? ' on' : '') + '" data-sf="' + k + '">' + label + '</button>'; };
    var sbtn = function (k, label) { return '<button class="chip-btn' + (SV.s === k ? ' on' : '') + '" data-ss="' + k + '">' + label + '</button>'; };
    var mbtn = function (k, label) { return '<button class="chip-btn' + (SV.mode === k ? ' on' : '') + '" data-sm="' + k + '">' + label + '</button>'; };
    var d = function (t) { var x = new Date(t); return (x.getMonth() + 1) + '월 ' + x.getDate() + '일'; };

    var items = list.map(function (it) {
      var q = it.q, st = state(it), idx = L.indexOf(it);
      var mark = st === 'ok' ? '맞힌 문제' : (st === 'bad' ? '틀린 문제' : '답 안 고름');
      var head = '<p class="sv-meta"><span class="sv-mark ' + st + '">' + mark + '</span>' + esc(it.src) + ' · ' + d(it.at) + ' 저장</p>';
      var body;
      if (SV.mode === 'retry') {
        var t = SV.tried[it.k];
        var opts = q.o.map(function (o, i) {
          var cls = t === undefined ? '' : (i === q.a ? 'ok' : (i === t ? 'bad' : 'dim'));
          return '<button class="opt ' + cls + '" data-retry="' + idx + '" data-o="' + i + '"' + (t !== undefined ? ' disabled' : '') + '><span class="opt-n">' + NUM[i] + '</span><span>' + txt(o) + '</span></button>';
        }).join('');
        body = '<div class="opts">' + opts + '</div>' + (t === undefined ? '' :
          '<div class="verdict ' + (t === q.a ? 'ok' : 'bad') + '">' + (t === q.a ? '정답입니다!' : '정답은 ' + NUM[q.a] + '입니다.') + '</div>' +
          '<div class="explain">' + explainList(q, t) + '</div>');
      } else {
        body = '<p class="r-line">내 답: <b>' + (st === 'none' ? '없음' : NUM[it.my]) + '</b> · 정답: <b>' + NUM[q.a] + '</b></p>' +
          '<div class="explain">' + explainList(q, st === 'none' ? null : it.my) + '</div>';
      }
      return '<article class="qcard review ' + (st === 'ok' ? 'r-ok' : (st === 'bad' ? 'r-bad' : '')) + '">' + head +
        qBody(q, SUBJ[q.subj] ? SUBJ[q.subj].name : '문제', idx) + body + '</article>';
    }).join('');

    var empty = L.length
      ? '<p class="empty">조건에 맞는 저장한 문제가 없어요.</p>'
      : '<div class="sv-empty"><div class="sv-empty-ic">' + ICON_SAVE + '</div><p><b>아직 저장한 문제가 없어요.</b></p>' +
        '<p>문제 오른쪽 위의 책갈피 아이콘을 누르면 여기에 모여요. 틀린 문제나 찍어서 맞힌 문제를 저장해 두고 다시 확인해 보세요.</p></div>';

    app.innerHTML =
      '<section class="saved-view"><span class="kicker">다시 볼 문제</span><h2>저장한 문제 <small>' + L.length + '개</small></h2>' +
      (L.length ? '<div class="filters"><div>' + fbtn('all', '전체 ' + cnt.all) + fbtn('wrong', '틀린 문제 ' + cnt.wrong) + fbtn('right', '맞힌 문제 ' + cnt.right) + '</div>' +
        '<div>' + sbtn(0, '전 과목') + sbtn(1, '1과목') + sbtn(2, '2과목') + sbtn(3, '3과목') + '</div></div>' +
        '<div class="filters sv-mode"><div>' + mbtn('view', '해설 보기') + mbtn('retry', '가리고 다시 풀기') + '</div>' +
        '<div><button class="chip-btn" id="sv-clear">전체 삭제</button></div></div>' : '') +
      (items || empty) + '</section>';

    app.querySelectorAll('[data-sf]').forEach(function (b) { b.onclick = function () { SV.f = b.dataset.sf; render(true); }; });
    app.querySelectorAll('[data-ss]').forEach(function (b) { b.onclick = function () { SV.s = +b.dataset.ss; render(true); }; });
    app.querySelectorAll('[data-sm]').forEach(function (b) { b.onclick = function () { SV.mode = b.dataset.sm; SV.tried = {}; render(true); }; });
    app.querySelectorAll('[data-retry]').forEach(function (b) {
      b.onclick = function () { var it = L[+b.dataset.retry]; SV.tried[it.k] = +b.dataset.o; render(true); };
    });
    var clr = document.getElementById('sv-clear');
    if (clr) clr.onclick = function () {
      modal('저장한 문제를 모두 지울까요?', '저장한 문제 ' + L.length + '개가 모두 삭제되고 되돌릴 수 없어요.', '모두 삭제', function () { savedList().length = 0; writeSaved(); render(); });
    };
    /* 저장 목록에서 아이콘을 누르면 목록에서 바로 빠진다 */
    app.querySelectorAll('[data-save]').forEach(function (b) {
      b.onclick = function () { var it = L[+b.getAttribute('data-save')]; toggleSaved({ q: it.q }); render(true); };
    });
  }

  /* ── 시작 ── */
  document.querySelectorAll('.nav button').forEach(function (b) { b.onclick = function () { setView(b.dataset.v); }; });
  document.querySelector('.brand').onclick = function () { setView('home'); };

  var saved = loadState();
  updateSavedBadge();
  if (saved && ['home', 's1', 's2', 's3', 'exam', 'past', 'saved'].indexOf(saved.view) >= 0) {
    P = saved.P || {};
    E = saved.E || null;
    if (saved.lastSet) lastSet = saved.lastSet;
    (saved.genSeen || []).forEach(function (id) { genSeen.add(id); });
    view = saved.view;
    document.querySelectorAll('.nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === view); });
    if (E && !E.done) {
      if (E.endAt <= Date.now()) {               /* 앱을 떠나 있는 동안 시험 시간이 끝난 경우 */
        view = E.view;
        document.querySelectorAll('.nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === view); });
        submitExam(true);
      } else {
        startTimer();
        render();
        window.scrollTo(0, saved.y || 0);
      }
    } else {
      render();
      window.scrollTo(0, saved.y || 0);
    }
  } else {
    go('home');
  }
})();
