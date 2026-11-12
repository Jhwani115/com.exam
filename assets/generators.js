/* 계산형 자동 생성 문제 — 호출할 때마다 숫자·데이터가 바뀐 새 문제를 만듭니다. */
(function () {
  'use strict';
  var ri = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var comma = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

  /* 정답 + 후보 오답 → 서로 다른 보기 4개 */
  function build(correct, cands, filler) {
    var o = [String(correct.v)], e = [correct.e];
    cands.forEach(function (c) {
      if (o.length < 4 && o.indexOf(String(c.v)) < 0) { o.push(String(c.v)); e.push(c.e); }
    });
    var guard = 0;
    while (o.length < 4 && guard++ < 200) {
      var f = filler();
      if (o.indexOf(String(f.v)) < 0) { o.push(String(f.v)); e.push(f.e); }
    }
    return { o: o, e: e, a: 0 };
  }
  function Q(id, t, q, h, b) { return { id: id, t: t, q: q, h: h || '', o: b.o, e: b.e, a: b.a, gen: true }; }

  /* ───────── 1과목 ───────── */
  var G1 = [];

  // 진법 변환
  G1.push(function () {
    var n = ri(37, 250);
    var mode = pick(['d2b', 'd2o', 'd2h', 'h2d', 'b2d', 'o2d']);
    var BASE = { b: 2, o: 8, h: 16, d: 10 };
    var NAME = { 2: '2진수', 8: '8진수', 16: '16진수', 10: '10진수' };
    var from = BASE[mode[0]], to = BASE[mode[2]];
    var show = function (x, base) { return x.toString(base).toUpperCase(); };
    var src = show(n, from);
    var powers = function (x, base) {
      var digits = show(x, base).split(''), len = digits.length, parts = [];
      digits.forEach(function (d, i) { var v = parseInt(d, base); if (v) parts.push(d + '×' + base + '^' + (len - 1 - i)); });
      return parts.join(' + ');
    };
    var why = to === 10
      ? src + '(' + from + ') = ' + powers(n, from) + ' = ' + n + '이다.'
      : '10진수 ' + n + '을 ' + to + '로 계속 나누어 나머지를 거꾸로 읽으면 ' + show(n, to) + '이다. (검산: ' + powers(n, to) + ' = ' + n + ')';
    var corr = { v: show(n, to), e: '정답. ' + why };
    var c = [];
    var near = [n + 1, n - 1, n + to, n - to, n + 2, n ^ 4, n ^ 8];
    near.forEach(function (m) {
      if (m > 0 && m !== n) c.push({ v: show(m, to), e: to === 10 ? '10진수 ' + m + ' → ' + NAME[from] + ' ' + show(m, from) + '이므로 문제의 수와 다르다.' : '이 값을 10진수로 바꾸면 ' + m + '이므로 ' + n + '과(와) 다르다.' });
    });
    if (to !== 10) {
      var other = to === 16 ? 8 : (to === 8 ? 16 : 8);
      c.unshift({ v: show(n, other), e: '이 값은 ' + n + '을 ' + NAME[other] + '로 변환한 결과이다. 문제는 ' + NAME[to] + '를 묻고 있다.' });
    } else {
      var misread = parseInt(src.replace(/[A-F]/g, function (ch) { return String(ch.charCodeAt(0) - 55); }), 10);
      if (!isNaN(misread) && misread !== n) c.unshift({ v: misread, e: '각 자리를 10진수처럼 그대로 이어 읽은 잘못된 값이다. 자릿값(' + from + '의 거듭제곱)을 곱해야 한다.' });
    }
    var b = build(corr, shuffle(c), function () { var m = n + ri(-20, 20); return { v: show(m, to), e: '이 값은 10진수 ' + m + '에 해당한다.' }; });
    var q = NAME[from] + ' ' + src + '을(를) ' + NAME[to] + '로 변환한 값으로 옳은 것은?';
    return Q('g1-base-' + mode + n, '자료 표현 · 진법 변환', q, '', b);
  });

  // 기억 용량 비교
  G1.push(function () {
    var mbList = [256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096, 6144];
    var big = Math.random() < 0.5;
    var fmt = function (mb, u) {
      if (u === 'KB') return { s: comma(mb * 1024) + 'KB', mb: mb, face: mb * 1024 };
      if (u === 'GB') return { s: (mb / 1024) + 'GB', mb: mb, face: mb / 1024 };
      return { s: comma(mb) + 'MB', mb: mb, face: mb };
    };
    var items, target, tries = 0;
    // KB·MB·GB가 반드시 섞이고, 겉보기 숫자만 비교하면 틀리도록 만든다
    do {
      var chosen = shuffle(mbList).slice(0, 4);
      var units = shuffle(['KB', 'MB', 'GB', pick(['KB', 'MB', 'GB'])]);
      items = chosen.map(function (mb, i) { return fmt(mb, units[i]); });
      target = items.reduce(function (p, x) { return (big ? x.mb > p.mb : x.mb < p.mb) ? x : p; });
      var naive = items.reduce(function (p, x) { return (big ? x.face > p.face : x.face < p.face) ? x : p; });
    } while (naive === target && ++tries < 200);
    var o = items.map(function (x) { return x.s; });
    var e = items.map(function (x) {
      var u = x.s.slice(-2), gb = (x.mb / 1024) + 'GB', mb = comma(x.mb) + 'MB';
      var conv = u === 'KB' ? x.s + ' ÷ 1,024 = ' + mb + '(' + gb + ')' : (u === 'GB' ? x.s + ' × 1,024 = ' + mb : x.s + ' = ' + gb);
      return (x === target ? '정답. ' : '') + conv + (x === target ? '로 보기 중 ' + (big ? '가장 크다.' : '가장 작다.') : '이다.');
    });
    var q = '다음 중 기억 용량이 ' + (big ? '가장 큰' : '가장 작은') + ' 것은? (단, 1KB=1,024Byte, 1MB=1,024KB, 1GB=1,024MB)';
    return Q('g1-unit-' + o.join('|') + big, '자료 표현 · 기억 용량', q, '', { o: o, e: e, a: items.indexOf(target) });
  });

  // IPv4 클래스
  G1.push(function () {
    var cls = pick(['A', 'B', 'C', 'D']);
    var range = { A: [1, 126], B: [128, 191], C: [192, 223], D: [224, 239] }[cls];
    var ip = [ri(range[0], range[1]), ri(0, 255), ri(0, 255), ri(1, 254)].join('.');
    var info = {
      A: 'A 클래스: 첫 옥텟 1~126, 대규모 네트워크용(네트워크 8비트)',
      B: 'B 클래스: 첫 옥텟 128~191, 중대형 네트워크용(네트워크 16비트)',
      C: 'C 클래스: 첫 옥텟 192~223, 소규모 네트워크용(네트워크 24비트)',
      D: 'D 클래스: 첫 옥텟 224~239, 멀티캐스트용'
    };
    var keys = ['A', 'B', 'C', 'D'];
    var o = keys.map(function (k) { return k + ' 클래스'; });
    var e = keys.map(function (k) {
      return k === cls ? '정답. 첫 번째 옥텟이 ' + ip.split('.')[0] + '이므로 ' + info[k] + '에 해당한다.' : info[k] + '이므로 해당하지 않는다.';
    });
    return Q('g1-ip-' + ip, '인터넷 · IPv4 주소', 'IPv4 주소 ' + ip + '가 속하는 클래스로 옳은 것은?', '', { o: o, e: e, a: keys.indexOf(cls) });
  });

  // 비트 수와 표현 가능한 개수(색상 수)
  G1.push(function () {
    var pw = function (k) { return comma(Math.pow(2, k)); };
    if (Math.random() < 0.5) {
      var n = pick([3, 4, 5, 6, 8, 16, 24]);
      var corr = { v: pw(n) + '가지', e: '정답. n비트로 표현할 수 있는 경우의 수는 2^n이므로 2^' + n + ' = ' + pw(n) + '가지이다.' + (n === 24 ? ' (트루 컬러)' : '') };
      var c = [
        { v: comma(n * 2) + '가지', e: '2 × ' + n + '처럼 곱셈으로 계산한 값이다. 경우의 수는 2를 ' + n + '번 곱한 2^' + n + '이다.' },
        { v: pw(n - 1) + '가지', e: '2^' + (n - 1) + '로, ' + (n - 1) + '비트로 표현할 수 있는 개수이다.' },
        { v: pw(n + 1) + '가지', e: '2^' + (n + 1) + '로, ' + (n + 1) + '비트로 표현할 수 있는 개수이다.' },
        { v: comma(n * n) + '가지', e: n + '^2로 계산한 값이다. 밑과 지수를 바꾸어 계산하면 안 된다.' }
      ];
      var b = build(corr, c, function () { var k = n + pick([2, 3]); return { v: pw(k) + '가지', e: k + '비트로 표현할 수 있는 개수이다.' }; });
      return Q('g1-bits-n' + n, '멀티미디어 · 색상 표현', '한 픽셀을 ' + n + '비트로 표현할 때 나타낼 수 있는 색상의 수는?', '', b);
    }
    var k = ri(2, 8);
    var cnt = ri(Math.pow(2, k - 1) + 1, Math.pow(2, k));
    var corr2 = { v: k + '비트', e: '정답. ' + k + '비트는 2^' + k + ' = ' + pw(k) + '가지를 표현하므로 ' + comma(cnt) + '가지를 모두 표현할 수 있고, ' + (k - 1) + '비트(' + pw(k - 1) + '가지)로는 부족하다.' };
    var c2 = [
      { v: (k - 1) + '비트', e: (k - 1) + '비트는 ' + pw(k - 1) + '가지만 표현하므로 ' + comma(cnt) + '가지를 모두 표현할 수 없다.' },
      { v: (k + 1) + '비트', e: (k + 1) + '비트로도 표현할 수 있지만 최소 비트 수는 아니다.' },
      { v: (k + 2) + '비트', e: (k + 2) + '비트로도 표현할 수 있지만 최소 비트 수는 아니다.' }
    ];
    if (k - 2 >= 1) c2.push({ v: (k - 2) + '비트', e: (k - 2) + '비트는 ' + pw(k - 2) + '가지만 표현하므로 부족하다.' });
    var b2 = build(corr2, c2, function () { return { v: (k + 3) + '비트', e: '최소 비트 수가 아니다.' }; });
    return Q('g1-bits-c' + cnt, '자료 표현 · 비트 수', '서로 다른 ' + comma(cnt) + '가지 색상(또는 문자)을 구별하여 표현하려면 최소 몇 비트가 필요한가?', '', b2);
  });

  /* ───────── 2과목 ───────── */
  var G2 = [];

  // 반올림 계열 함수 (정수 연산으로 정확히 계산)
  G2.push(function () {
    var X = ri(100000, 9999999); // 1/1000 단위
    if (X % 10 === 0) X += ri(1, 9);
    if (Math.random() < 0.3) X = -X;
    var show = function (m) { return String(m / 1000); };
    var calc = function (f, d) {
      var s = X < 0 ? -1 : 1, A = Math.abs(X);
      if (f === 'INT') return Math.floor(X / 1000) * 1000;
      var unit = Math.pow(10, 3 - d);
      if (f === 'ROUND') return s * Math.floor((A + unit / 2) / unit) * unit;
      if (f === 'ROUNDUP') return s * Math.ceil(A / unit) * unit;
      return s * Math.floor(A / unit) * unit; // ROUNDDOWN, TRUNC
    };
    var fx = function (f, d) { return f === 'INT' ? '=INT(' + show(X) + ')' : '=' + f + '(' + show(X) + ', ' + d + ')'; };
    var rule = {
      ROUND: '지정한 자릿수로 반올림한다', ROUNDUP: '지정한 자릿수로 올림한다(0에서 멀어지는 방향)', ROUNDDOWN: '지정한 자릿수로 내림한다(0에 가까워지는 방향)',
      TRUNC: '지정한 자릿수 아래를 잘라 버린다(ROUNDDOWN과 결과가 같다)', INT: '그 수보다 크지 않은 가장 가까운 정수로 내린다(음수는 더 작은 정수가 된다)'
    };
    var place = function (d) { return d > 0 ? '소수 ' + d + '째 자리까지' : (d === 0 ? '정수(일의 자리)까지' : (d === -1 ? '십의 자리까지' : '백의 자리까지')); };
    var f = pick(['ROUND', 'ROUNDUP', 'ROUNDDOWN', 'TRUNC', 'INT', 'ROUND', 'ROUNDUP', 'ROUNDDOWN']);
    var d = ri(-2, 2);
    var v = calc(f, d);
    var corr = { v: show(v), e: '정답. ' + f + ' 함수는 ' + rule[f] + '. ' + (f === 'INT' ? '' : '자릿수 ' + d + '는 ' + place(d) + ' 나타내라는 뜻이다. ') + '따라서 결과는 ' + show(v) + '이다.' };
    var c = [];
    ['ROUND', 'ROUNDUP', 'ROUNDDOWN', 'INT'].forEach(function (g) { if (g !== f) c.push({ v: show(calc(g, d)), e: '이 값은 ' + fx(g, d) + '의 결과이다.' }); });
    [d - 1, d + 1].forEach(function (d2) { if (d2 >= -2 && d2 <= 2 && f !== 'INT') c.push({ v: show(calc(f, d2)), e: '이 값은 자릿수를 ' + d2 + '로 지정한 ' + fx(f, d2) + '의 결과이다.' }); });
    var b = build(corr, shuffle(c), function () { var k = pick([1, -1]) * Math.pow(10, ri(2, 5)); return { v: show(v + k), e: '계산 과정에서 자릿수를 잘못 처리한 값이다.' }; });
    return Q('g2-rnd-' + X + f + d, '함수 · 수학/삼각', '다음 수식의 결과로 옳은 것은?', CODE(fx(f, d)), b);
  });

  // MOD 함수
  G2.push(function () {
    var a, b;
    do { a = ri(7, 99) * (Math.random() < 0.5 ? -1 : 1); b = ri(3, 12) * (Math.random() < 0.5 ? -1 : 1); } while (a % b === 0);
    if (a > 0 && b > 0 && Math.random() < 0.7) { if (Math.random() < 0.5) a = -a; else b = -b; }
    var mod = a - b * Math.floor(a / b);
    var corr = { v: mod, e: '정답. MOD(수, 나눌 수) = 수 - 나눌 수 × INT(수/나눌 수) = ' + a + ' - (' + b + ')×(' + Math.floor(a / b) + ') = ' + mod + '. 결과의 부호는 나눌 수(' + b + ')의 부호를 따른다.' };
    var c = [
      { v: a % b, e: '나머지의 부호를 나누어지는 수(' + a + ') 기준으로 계산한 값이다. 엑셀 MOD는 나눌 수의 부호를 따른다.' },
      { v: Math.abs(a % b), e: '절댓값으로만 나머지를 구한 값이다. 엑셀 MOD는 부호까지 고려한다.' },
      { v: Math.trunc(a / b), e: '이 값은 몫을 구하는 =QUOTIENT(' + a + ', ' + b + ')의 결과이다.' },
      { v: Math.floor(a / b), e: '이 값은 =INT(' + a + '/' + b + ')로 구한 몫이다.' }
    ];
    var bb = build(corr, c, function () { var m = mod + ri(-3, 3); return { v: m, e: '나머지 계산을 잘못한 값이다.' }; });
    return Q('g2-mod-' + a + '_' + b, '함수 · 수학/삼각', '다음 수식의 결과로 옳은 것은?', CODE('=MOD(' + a + ', ' + b + ')'), bb);
  });

  // 사용자 지정 표시 형식
  G2.push(function () {
    var cents = ri(100000000, 999999999) ; // 1,000,000.00 ~ 9,999,999.99 (센트 단위)
    var neg = Math.random() < 0.25;
    if (neg) cents = -cents;
    var raw = (cents / 100).toFixed(2).replace(/\.?0+$/, '');
    // 반올림(0에서 멀어지게) 정수 연산
    var rnd = function (num, den) { var s = num < 0 ? -1 : 1, A = Math.abs(num); return s * Math.floor((2 * A + den) / (2 * den)); };
    var fmt = function (scalePow, dec, useComma) {
      var den = 100 * Math.pow(10, scalePow) / Math.pow(10, dec);
      var N = den >= 1 ? rnd(cents, den) : cents * (1 / den);
      var s = N < 0 ? '-' : '', A = Math.abs(N), ip = Math.floor(A / Math.pow(10, dec)), fp = A % Math.pow(10, dec);
      var ipS = useComma ? comma(ip) : String(ip);
      return { s: s, body: ipS + (dec ? '.' + String(fp).padStart(dec, '0') : '') };
    };
    var F = [
      { f: '#,##0', out: function () { var r = fmt(0, 0, 1); return r.s + r.body; }, why: '천 단위 구분 기호를 넣고 소수점 이하를 반올림하여 정수로 표시한다.' },
      { f: '#,##0,', out: function () { var r = fmt(3, 0, 1); return r.s + r.body; }, why: '형식 끝의 쉼표(,)는 천 단위를 생략하므로 1,000으로 나눈 뒤 반올림하여 표시한다.' },
      { f: '0.0', out: function () { var r = fmt(0, 1, 0); return r.s + r.body; }, why: '천 단위 구분 기호 없이 소수 첫째 자리까지 반올림하여 표시한다.' },
      { f: '#,##0.00', out: function () { var r = fmt(0, 2, 1); return r.s + r.body; }, why: '천 단위 구분 기호를 넣고 소수 둘째 자리까지 표시한다.' },
      { f: '0.0,"천원"', out: function () { var r = fmt(3, 1, 0); return r.s + r.body + '천원'; }, why: '쉼표(,)로 천 단위를 생략해 1,000으로 나눈 뒤 소수 첫째 자리까지 반올림하고 "천원"을 붙인다.' },
      { f: '#,##0,,"백만"', out: function () { var r = fmt(6, 0, 1); return r.s + r.body + '백만'; }, why: '쉼표 두 개(,,)는 백만 단위를 생략하므로 1,000,000으로 나눈 뒤 반올림하고 "백만"을 붙인다.' },
      { f: '#,##0"원"', out: function () { var r = fmt(0, 0, 1); return r.s + r.body + '원'; }, why: '천 단위 구분 기호를 넣어 정수로 반올림한 뒤 "원"을 붙인다.' }
    ];
    if (neg) F.push({ f: '#,##0;(#,##0)', out: function () { var r = fmt(0, 0, 1); return '(' + r.body + ')'; }, why: '세미콜론(;)으로 구분된 두 번째 구역이 음수 형식이므로, 음수는 괄호 안에 부호 없이 표시한다.' });
    var target = neg && Math.random() < 0.5 ? F[F.length - 1] : pick(F);
    var corr = { v: target.out(), e: '정답. ' + target.why };
    var c = shuffle(F.filter(function (x) { return x !== target; })).map(function (x) { return { v: x.out(), e: "이 결과는 표시 형식 '" + x.f + "'를 적용했을 때 나온다." }; });
    var b = build(corr, c, function () { return { v: raw, e: '표시 형식을 적용하지 않은 원래 값이다.' }; });
    var q = '셀에 ' + raw + '을 입력한 후 사용자 지정 표시 형식을 ' + target.f + '로 지정했을 때 표시되는 결과로 옳은 것은?';
    return Q('g2-fmt-' + cents + target.f, '서식 · 사용자 지정 표시 형식', q, '', b);
  });

  // SUMIF / COUNTIF / AVERAGEIF
  G2.push(function () {
    var names = shuffle(['김민준', '이서연', '박지호', '최유나', '정하준', '강수빈', '윤도현', '한지민']).slice(0, 6);
    var depts = ['영업', '총무', '기획'];
    var rows, mode, crit, tries = 0, res;
    do {
      tries++;
      rows = names.map(function (n) { return [n, pick(depts), ri(10, 30) * 5]; });
      var ok = depts.every(function (d) { return rows.some(function (r) { return r[1] === d; }); });
      if (!ok) continue;
      mode = pick(['SUMIF', 'COUNTIF', 'AVERAGEIF']);
      res = null;
      var by = function (d) { return rows.filter(function (r) { return r[1] === d; }); };
      var sum = function (rs) { return rs.reduce(function (p, r) { return p + r[2]; }, 0); };
      if (mode === 'SUMIF') {
        crit = pick(depts);
        var others = depts.filter(function (d) { return d !== crit; });
        res = {
          fx: '=SUMIF(B2:B7, "' + crit + '", C2:C7)', v: sum(by(crit)),
          why: '부서가 "' + crit + '"인 행의 실적(' + by(crit).map(function (r) { return r[2]; }).join('+') + ')을 더한다.',
          c: [{ v: sum(by(others[0])), e: '"' + others[0] + '" 부서의 실적 합계이다.' }, { v: sum(by(others[1])), e: '"' + others[1] + '" 부서의 실적 합계이다.' },
            { v: sum(rows), e: '조건 없이 전체 실적을 더한 값이다.' }, { v: by(crit).length, e: '"' + crit + '" 부서의 인원 수(COUNTIF 결과)이다.' }]
        };
      } else if (mode === 'COUNTIF') {
        var vals = rows.map(function (r) { return r[2]; }).sort(function (a, b) { return a - b; });
        crit = vals[ri(1, 4)];
        var ge = rows.filter(function (r) { return r[2] >= crit; }).length, gt = rows.filter(function (r) { return r[2] > crit; }).length;
        if (ge === gt) continue;
        res = {
          fx: '=COUNTIF(C2:C7, ">=' + crit + '")', v: ge,
          why: '실적이 ' + crit + ' 이상(같은 값 포함)인 셀의 개수를 센다.',
          c: [{ v: gt, e: crit + '을 초과(같은 값 제외)하는 개수이다. ">="는 같은 값도 포함한다.' }, { v: 6 - ge, e: crit + ' 미만인 셀의 개수이다.' }, { v: 6, e: '범위 전체 셀의 개수이다.' }]
        };
      } else {
        crit = pick(depts);
        var rs = by(crit), avg = sum(rs) / rs.length, all = sum(rows) / 6;
        if (avg % 1 || all % 1) continue;
        res = {
          fx: '=AVERAGEIF(B2:B7, "' + crit + '", C2:C7)', v: avg,
          why: '부서가 "' + crit + '"인 행의 실적 합계 ' + sum(rs) + '을 ' + rs.length + '명으로 나눈다.',
          c: [{ v: all, e: '조건 없이 전체 평균을 구한 값이다.' }, { v: sum(rs), e: '"' + crit + '" 부서의 실적 합계(SUMIF 결과)이다.' }, { v: rs.length, e: '"' + crit + '" 부서의 인원 수이다.' }]
        };
      }
    } while (!res && tries < 300);
    var b = build({ v: res.v, e: '정답. ' + res.why + ' 결과는 ' + res.v + '이다.' }, res.c, function () { var m = res.v + pick([-5, 5, -10, 10]); return { v: m, e: '조건에 맞는 행을 잘못 골라 계산한 값이다.' }; });
    var sheet = SHEET([['이름', '부서', '실적']].concat(rows));
    return Q('g2-if-' + res.fx + rows.map(function (r) { return r.join(''); }).join(''), '함수 · 통계/조건', '아래 시트에서 다음 수식의 결과로 옳은 것은?', sheet + CODE(res.fx), b);
  });

  /* ───────── 3과목 ───────── */
  var G3 = [];

  // 문자열 함수
  G3.push(function () {
    var w = pick(['Database', 'Microsoft', 'Information', 'Spreadsheet', 'Programming', 'Computer', 'Keyboard', 'Activities']);
    var f = pick(['Left', 'Right', 'Mid', 'Len', 'InStr', 'Mid']);
    var L = w.length, q, h, corr, c = [];
    var qs = function (s) { return '"' + s + '"'; };
    if (f === 'Len') {
      corr = { v: L, e: '정답. Len은 문자열의 길이(문자 수)를 반환하며 ' + qs(w) + '는 ' + L + '자이다.' };
      c = [{ v: L - 1, e: '마지막 문자를 빼고 센 잘못된 값이다.' }, { v: L + 1, e: '문자 수보다 1 많은 잘못된 값이다.' }, { v: qs(w.slice(0, 3)), e: 'Left(' + qs(w) + ', 3)의 결과이다. Len은 숫자를 반환한다.' }];
      h = 'Len(' + qs(w) + ')';
    } else if (f === 'InStr') {
      var st = ri(1, L - 3), len = ri(2, 3), sub = w.substr(st, len), pos = w.indexOf(sub) + 1;
      corr = { v: pos, e: '정답. InStr은 찾는 문자열이 처음 나타나는 위치를 1부터 세어 반환한다. ' + qs(sub) + '는 ' + pos + '번째 문자에서 시작한다.' };
      c = [{ v: pos - 1, e: '위치를 0부터 센 값이다. 액세스의 InStr은 1부터 센다.' }, { v: pos + sub.length - 1, e: '찾은 문자열의 마지막 문자 위치이다. InStr은 시작 위치를 반환한다.' }, { v: 0, e: '찾는 문자열이 없을 때 반환되는 값이다.' }, { v: L, e: 'Len(' + qs(w) + ')의 결과이다.' }];
      h = 'InStr(' + qs(w) + ', ' + qs(sub) + ')';
    } else {
      var n = ri(2, 4), s = ri(2, L - n);
      var cand = {
        Left: { v: w.slice(0, n), fx: 'Left(' + qs(w) + ', ' + n + ')' },
        Right: { v: w.slice(L - n), fx: 'Right(' + qs(w) + ', ' + n + ')' },
        Mid: { v: w.substr(s - 1, n), fx: 'Mid(' + qs(w) + ', ' + s + ', ' + n + ')' },
        Mid2: { v: w.substr(s, n), fx: 'Mid(' + qs(w) + ', ' + (s + 1) + ', ' + n + ')' },
        Mid3: { v: w.substr(s - 1, n + 1), fx: 'Mid(' + qs(w) + ', ' + s + ', ' + (n + 1) + ')' },
        Left2: { v: w.slice(0, n + 1), fx: 'Left(' + qs(w) + ', ' + (n + 1) + ')' }
      };
      var rule = { Left: '왼쪽에서부터 지정한 개수만큼', Right: '오른쪽에서부터 지정한 개수만큼', Mid: '지정한 시작 위치부터 지정한 개수만큼' };
      corr = { v: qs(cand[f].v), e: '정답. ' + f + ' 함수는 문자열의 ' + rule[f] + ' 문자를 추출한다.' };
      Object.keys(cand).forEach(function (k) { if (k !== f) c.push({ v: qs(cand[k].v), e: '이 값은 ' + cand[k].fx + '의 결과이다.' }); });
      h = cand[f].fx;
    }
    var b = build(corr, shuffle(c), function () { var k = ri(1, L - 2); return { v: qs(w.substr(k, 2)), e: '추출 위치나 개수를 잘못 적용한 값이다.' }; });
    return Q('g3-str-' + h, '함수 · 문자열 함수', '다음 식의 결과로 옳은 것은?', CODE(h), b);
  });

  // SQL 결과 개수
  G3.push(function () {
    var givens = ['민수', '수진', '지수', '서연', '현수', '수빈', '도윤', '하은', '준호'];
    var sur = ['김', '이', '박', '최', '정'];
    var region = ['서울', '부산', '대구', '인천'];
    var rows = [], used = {};
    while (rows.length < 7) {
      var nm = pick(sur) + pick(givens);
      if (used[nm]) continue; used[nm] = 1;
      rows.push([nm, pick(region), ri(20, 59)]);
    }
    var cnt = function (fn) { return rows.filter(fn).length; };
    var list = function (fn) { return rows.filter(fn).map(function (r) { return r[0]; }).join(', ') || '없음'; };
    var mode = pick(['between', 'like', 'in', 'and']), sql, fn, alts = [];
    if (mode === 'between') {
      var ages = rows.map(function (r) { return r[2]; }).sort(function (a, b) { return a - b; });
      var lo = ages[ri(1, 2)], hi = ages[ri(4, 5)];
      sql = 'SELECT COUNT(*) FROM 회원 WHERE 나이 BETWEEN ' + lo + ' AND ' + hi + ';';
      fn = function (r) { return r[2] >= lo && r[2] <= hi; };
      alts.push({ v: cnt(function (r) { return r[2] > lo && r[2] < hi; }), e: '경계값(' + lo + ', ' + hi + ')을 제외하고 센 값이다. BETWEEN은 경계값을 포함한다.' });
      alts.push({ v: cnt(function (r) { return !(r[2] >= lo && r[2] <= hi); }), e: 'NOT BETWEEN으로 범위 밖의 레코드를 센 값이다.' });
    } else if (mode === 'like') {
      var start = Math.random() < 0.5;
      sql = 'SELECT COUNT(*) FROM 회원 WHERE 이름 LIKE "' + (start ? '*수' : '*수*') + '";';
      fn = start ? function (r) { return /수$/.test(r[0]); } : function (r) { return r[0].indexOf('수') >= 0; };
      alts.push(start
        ? { v: cnt(function (r) { return r[0].indexOf('수') >= 0; }), e: '"*수*"처럼 "수"를 포함하는 이름을 모두 센 값이다. "*수"는 "수"로 끝나는 이름만 찾는다.' }
        : { v: cnt(function (r) { return /수$/.test(r[0]); }), e: '"수"로 끝나는 이름만 센 값이다. "*수*"는 위치와 관계없이 "수"를 포함하면 된다.' });
    } else if (mode === 'in') {
      var a2 = shuffle(region).slice(0, 2);
      sql = 'SELECT COUNT(*) FROM 회원 WHERE 지역 IN ("' + a2[0] + '", "' + a2[1] + '");';
      fn = function (r) { return a2.indexOf(r[1]) >= 0; };
      alts.push({ v: cnt(function (r) { return r[1] === a2[0]; }), e: '"' + a2[0] + '"만 센 값이다. IN은 목록 중 하나라도 일치하면 포함한다.' });
      alts.push({ v: cnt(function (r) { return a2.indexOf(r[1]) < 0; }), e: 'NOT IN처럼 목록에 없는 지역을 센 값이다.' });
    } else {
      var rg = pick(region), t = ri(30, 45);
      sql = 'SELECT COUNT(*) FROM 회원 WHERE 지역="' + rg + '" AND 나이>=' + t + ';';
      fn = function (r) { return r[1] === rg && r[2] >= t; };
      alts.push({ v: cnt(function (r) { return r[1] === rg || r[2] >= t; }), e: 'AND를 OR로 해석하여 두 조건 중 하나만 만족해도 센 값이다.' });
      alts.push({ v: cnt(function (r) { return r[1] === rg; }), e: '지역 조건만 적용하고 나이 조건을 빠뜨린 값이다.' });
    }
    var v = cnt(fn);
    var b = build({ v: v, e: '정답. 조건을 만족하는 레코드는 ' + v + '개(' + list(fn) + ')이다.' }, alts, function () {
      var m = ri(0, 7); return { v: m, e: '조건을 만족하는 레코드는 ' + v + '개이므로 ' + m + '개가 아니다.' };
    });
    var tbl = DBT('회원', ['이름', '지역', '나이'], rows);
    return Q('g3-sql-' + sql + rows.map(function (r) { return r.join(''); }).join(''), 'SQL · SELECT 조건', '<회원> 테이블에 대해 다음 SQL문을 실행했을 때의 결과로 옳은 것은?', tbl + CODE(sql), b);
  });

  // 날짜 함수
  G3.push(function () {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var ds = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var lit = function (d) { return '#' + ds(d) + '#'; };
    var mk = function (y, m, d) { return new Date(y, m - 1, d); };
    var d1 = mk(ri(2024, 2025), ri(6, 12), ri(1, 28));
    var d2 = mk(d1.getFullYear() + ri(1, 2), ri(1, 6), ri(1, 28));
    var dy = function (a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000); };
    var diff = {
      yyyy: d2.getFullYear() - d1.getFullYear(),
      m: (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth(),
      q: (d2.getFullYear() - d1.getFullYear()) * 4 + Math.floor(d2.getMonth() / 3) - Math.floor(d1.getMonth() / 3),
      d: dy(d1, d2)
    };
    var NAME = { yyyy: '연', m: '월', q: '분기', d: '일' };
    var mode = pick(['diff', 'diff', 'add', 'part']), h, corr, c = [];
    if (mode === 'diff') {
      var iv = pick(['yyyy', 'm', 'q']);
      h = 'DateDiff("' + iv + '", ' + lit(d1) + ', ' + lit(d2) + ')';
      corr = { v: diff[iv], e: '정답. DateDiff는 두 날짜 사이의 간격을 지정한 단위(' + NAME[iv] + ')로 계산하며, 경계를 넘은 횟수를 센다. 결과는 ' + diff[iv] + '이다.' };
      Object.keys(diff).forEach(function (k) { if (k !== iv) c.push({ v: diff[k], e: '이 값은 간격을 "' + k + '"(' + NAME[k] + ')로 지정했을 때의 결과이다.' }); });
      c.unshift({ v: -diff[iv], e: '두 날짜의 순서를 반대로 넣었을 때의 결과이다. 앞 날짜가 더 이르면 양수가 나온다.' });
    } else if (mode === 'add') {
      var n = ri(2, 10), base = mk(ri(2025, 2026), ri(1, 12), ri(1, 28));
      var addM = function (d, k) { var t = new Date(d.getFullYear(), d.getMonth() + k, 1); var last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(d.getDate(), last)); return t; };
      var addD = function (d, k) { var t = new Date(d); t.setDate(t.getDate() + k); return t; };
      h = 'DateAdd("m", ' + n + ', ' + lit(base) + ')';
      corr = { v: ds(addM(base, n)), e: '정답. DateAdd("m", ' + n + ', 날짜)는 날짜에 ' + n + '개월을 더한다.' };
      c = [{ v: ds(addD(base, n)), e: '"d"처럼 ' + n + '일을 더한 결과이다.' }, { v: ds(addM(base, n * 12)), e: '"yyyy"처럼 ' + n + '년을 더한 결과이다.' }, { v: ds(addM(base, -n)), e: n + '개월을 뺀 결과이다.' }];
    } else {
      var part = pick(['q', 'm']);
      var mo = d1.getMonth() + 1, qv = Math.floor(d1.getMonth() / 3) + 1;
      h = 'DatePart("' + part + '", ' + lit(d1) + ')';
      var val = part === 'q' ? qv : mo;
      corr = { v: val, e: '정답. DatePart는 날짜에서 지정한 부분을 추출한다. "' + part + '"는 ' + (part === 'q' ? '분기' : '월') + '이므로 ' + val + '이다.' };
      c = [{ v: part === 'q' ? mo : qv, e: '이 값은 "' + (part === 'q' ? 'm' : 'q') + '"(' + (part === 'q' ? '월' : '분기') + ')를 추출한 결과이다.' }, { v: d1.getDate(), e: '"d"(일)를 추출한 결과이다.' }, { v: d1.getFullYear(), e: '"yyyy"(연도)를 추출한 결과이다.' }];
    }
    var b = build(corr, c, function () { var m = ri(1, 30); return { v: m, e: '함수의 계산 방식을 잘못 적용한 값이다.' }; });
    return Q('g3-date-' + h, '함수 · 날짜/시간 함수', '다음 식의 결과로 옳은 것은?', CODE(h), b);
  });

  // IIf 중첩
  G3.push(function () {
    var t1 = pick([80, 85, 90]), t2 = pick([60, 65, 70]);
    var s = pick([t1, t2, t1 - 1, t2 - 1, ri(40, 100)]);
    var labels = ['우수', '보통', '미흡'];
    var v = s >= t1 ? '우수' : (s >= t2 ? '보통' : '미흡');
    var expr = 'IIf([점수]>=' + t1 + ', "우수", IIf([점수]>=' + t2 + ', "보통", "미흡"))';
    var o = labels.concat(['#오류']).map(function (x) { return x === '#오류' ? x : '"' + x + '"'; });
    var e = labels.map(function (x) {
      var cond = x === '우수' ? '점수가 ' + t1 + ' 이상일 때' : (x === '보통' ? '점수가 ' + t2 + ' 이상 ' + t1 + ' 미만일 때' : '점수가 ' + t2 + ' 미만일 때');
      return (x === v ? '정답. 점수 ' + s + '은(는) ' : '') + cond + ' 반환되는 값' + (x === v ? '이다.' : '이므로 점수 ' + s + '에는 해당하지 않는다.');
    });
    e.push('식의 문법에 오류가 없으므로 오류가 발생하지 않는다.');
    return Q('g3-iif-' + t1 + t2 + s, '함수 · 선택 함수', '[점수] 필드 값이 ' + s + '일 때 다음 식의 결과로 옳은 것은?', CODE(expr), { o: o, e: e, a: labels.indexOf(v) });
  });

  QGEN[1] = G1; QGEN[2] = G2; QGEN[3] = G3;
})();
