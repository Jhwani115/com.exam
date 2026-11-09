# 컴활 1급 필기 CBT

## 폴더 구성
- `index.html` — 사이트 첫 화면
- `assets/` — 화면(app.js), 디자인(style.css), 계산형 문제 생성기(generators.js), 공통 도우미(bank.js)
- `data/` — 과목별 문제은행 (q1a·q1b = 1과목, q2a·q2b = 2과목, q3a·q3b = 3과목)

## GitHub Pages에 올리기
1. github.com에서 새 저장소(Repository)를 만듭니다. 공개(Public)로 만드세요.
2. 저장소 화면의 **Add file → Upload files**에서 이 폴더 안의 내용(index.html, assets, data 폴더)을 그대로 끌어다 놓고 **Commit changes**를 누릅니다.
3. **Settings → Pages**에서 Source를 `Deploy from a branch`, Branch를 `main` / `(root)`로 정하고 저장합니다.
4. 1~2분 뒤 표시되는 주소(예: `https://아이디.github.io/저장소이름/`)가 CBT 주소입니다.

## 구글 사이트에 넣기
1. 구글 사이트 편집 화면 오른쪽 **삽입 → 삽입(Embed)** 을 누릅니다.
2. **URL로 삽입** 탭에 위 GitHub Pages 주소를 붙여 넣고 **전체 페이지** 형태로 삽입합니다.
3. 삽입된 상자의 크기를 페이지 폭에 맞게 늘린 뒤 게시합니다.

## 문제 추가하기
`data/` 폴더에 새 파일(예: `q1c.js`)을 만들고 같은 형식으로 문항을 넣은 뒤, `index.html`의 `<script src="data/q3b.js">` 아래에 한 줄을 추가하면 됩니다.

```
['주제', '질문', ['보기1', '보기2', '보기3', '보기4'], 정답번호, ['해설1', '해설2', '해설3', '해설4']],
```
정답 보기의 해설은 `정답.`으로 시작합니다. 보기 순서는 출제할 때마다 자동으로 섞입니다.
