# Qwen Coder 작업 지시를 위한 사용자 참고 가이드

> 이 문서는 Qwen Coder에게 직접 구현을 맡기는 사람이 읽는 운영 가이드입니다.
> AI도 함께 읽어도 되지만, 최종 범위와 합격 여부는 사람이 판단하는 것을 전제로 합니다.
> 실제 수정 요구사항의 기준 문서는 `QWEN_CODER_SECOND_REVIEW_FIX_REQUEST.md`입니다.

## 1. 현재 상태를 짧게 이해하기

Qwen Coder의 첫 수정은 완전한 실패는 아닙니다. 가장 큰 문제였던 “이상 현상을 맞혀도 다음 라운드로 가지 못하는 문제”는 해결됐고, 실제로 8라운드 승리 화면까지 도달할 수 있습니다. 이상 현상 레지스트리와 CSS 분리도 만들어졌습니다.

하지만 완료라고 판단하면 안 됩니다. 실제 검증에서는 다음 문제가 남아 있었습니다.

- 정답 직후 버튼을 다시 누르면 아직 보지 않은 다음 라운드가 판정됩니다.
- 테스트 파일은 페이지에서 로드되지 않으며 직접 실행해도 10개 중 1개가 실패합니다.
- `npm test`가 없습니다.
- “이상함” 버튼에 포커스한 상태에서 Enter를 누르면 “이상 없음”으로 처리됩니다.
- 모바일 화면에서 게임 영역이 뷰포트보다 넓게 계산되어 좌우가 잘립니다.
- 정상 통로에 비교할 기준 물체가 없어 이상 현상이 단순히 새 물체로 나타납니다.
- README, TODO, `.gitignore`, CSS 정리 상태가 서로 맞지 않습니다.

따라서 이번 작업의 목표는 효과를 더 추가하는 것이 아니라 다음 네 가지를 신뢰할 수 있게 만드는 것입니다.

1. 중복 입력이 불가능한 게임 상태
2. 실제 명령으로 실행되는 자동 테스트
3. 버튼 의미와 일치하는 키보드·모바일 동작
4. 코드와 일치하는 문서

## 2. AI에게 한 번에 전부 맡기지 말아야 하는 이유

이번 수정에서 Qwen Coder는 여러 개선을 만들었지만, 원래 요구사항 일부를 다른 방식으로 해석했습니다.

예를 들면:

- 두 방향 버튼만 사용하라는 요청 대신 기존 4개 버튼을 유지했습니다.
- 순수 게임 엔진을 분리하지 않았습니다.
- 실제 테스트 명령 대신 브라우저 콘솔용 테스트 함수를 만들었습니다.
- 모바일 검증을 완료했다고 기록했지만 실제 치수는 화면을 벗어났습니다.
- 남은 문제가 있는데도 TODO를 “모두 완료”로 표시했습니다.

이런 유형의 AI에는 “전부 고쳐줘”보다 작은 단계, 명시적인 금지사항, 실제 합격 명령을 함께 주는 방식이 효과적입니다.

권장 순서는 다음과 같습니다.

| 순서 | 작업 | 사람이 확인할 핵심 증거 |
| --- | --- | --- |
| 1 | 코어 상태와 테스트 | `npm test` 통과, 연속 입력 1회 처리 |
| 2 | 키보드·모바일·접근성 | 포커스 버튼 의미 일치, 375px 화면 안에 들어옴 |
| 3 | 정상 장면·문서 정리 | 정상 기준 물체 존재, README와 코드 일치 |
| 4 | 최종 검토 후 Git 작업 | diff 확인 후에만 커밋·푸시 허용 |

## 3. 작업 전에 사람이 확인할 것

Qwen Coder에게 지시하기 전에 저장소 루트에서 다음을 확인하세요.

```powershell
git status -sb
git log -1 --oneline
```

확인 기준:

- 의도하지 않은 수정 파일이 없어야 합니다.
- 작업 기준 브랜치와 최신 커밋이 무엇인지 알아야 합니다.
- 다른 사람이 만든 변경이 있으면 AI에게 보존하라고 명시해야 합니다.
- 아직 검토 전이라면 커밋·푸시를 허용하지 않는 것이 안전합니다.

AI에게는 항상 다음 문장을 포함하는 것을 권장합니다.

```text
Do not commit, push, merge, or change deployment settings. Preserve unrelated changes and report git status at the end.
```

## 4. 1단계: 코어 상태와 자동 테스트 지시

첫 번째로 맡길 작업입니다. 다른 단계와 섞지 않는 것이 좋습니다.

### 복사해서 사용할 프롬프트

```text
Read QWEN_CODER_SECOND_REVIEW_FIX_REQUEST.md completely, then read QWEN_CODER_REVIEW_GUIDE.md and inspect the current files under exit8/.

Implement Stage A only. Do not start Stage B or Stage C yet.

Non-negotiable requirements:
- Create a DOM-free game engine.
- Progress starts at 0 and requires 8 consecutive correct choices.
- Go Forward means normal; Turn Back means anomaly.
- A correct choice increments once; a wrong choice resets progress to 0.
- Accept input only in the observing phase.
- Disable both direction buttons during transitions.
- Ten rapid actions must change progress once.
- Own and cancel timers and invalidate stale run callbacks.
- Replace the four gameplay controls with only Go Forward and Turn Back.
- Inject randomness; tests must not rely on uncontrolled Math.random results.
- Add exit8/package.json and dependency-free Node tests so `cd exit8 && npm test` works.

Before editing, report git status and a short file-level plan. After editing, run all Stage A checks and provide exact output. Do not claim completion if any test fails. Do not commit or push.
```

### 사람이 확인할 결과

AI의 설명만 읽고 통과시키지 말고 직접 다음을 확인합니다.

```powershell
Set-Location exit8
npm test
```

필수 조건:

- 명령이 실제로 존재해야 합니다.
- 테스트가 브라우저 콘솔이나 DOM에 의존하지 않아야 합니다.
- 실패한 테스트가 있으면 프로세스 종료 코드가 0이면 안 됩니다.
- 무작위 결과가 우연히 다르기를 기대하는 테스트가 없어야 합니다.
- `game-engine.js` 안에 `document`, `window`, `setTimeout`이 없어야 합니다.

코드에서 확인할 핵심 질문:

- 상태에 `observing`과 `transitioning`이 구분되어 있는가?
- 입력을 받은 즉시 `transitioning`으로 바뀌는가?
- 타이머보다 먼저 버튼이 비활성화되는가?
- 한 라운드에서 진행도가 두 번 바뀔 수 있는 경로가 없는가?
- 8번째 정상 정답과 8번째 이상 정답을 각각 테스트하는가?

## 5. 2단계: 키보드·모바일·접근성 지시

1단계가 완전히 통과한 뒤에만 맡깁니다.

### 복사해서 사용할 프롬프트

```text
Read QWEN_CODER_SECOND_REVIEW_FIX_REQUEST.md and inspect the accepted Stage A implementation.

Implement Stage B only. Preserve the tested game-engine contract.

Required outcomes:
- Pointer, touch, and keyboard use the same two direction methods.
- Enter or Space on a focused button activates that button, not a global alternative action.
- Global shortcuts ignore interactive and editable elements.
- Focus moves predictably when screens change.
- Inactive screens are not keyboard-interactive.
- At 375x667 and 390x844, no game UI extends beyond the viewport horizontally.
- Remove the mobile fixed corridor height that conflicts with aspect-ratio.
- Short-height layouts may scroll vertically instead of being hidden.
- Reduced-motion mode actually overrides all anomaly and corridor animations.
- Remove duplicate fade-in, flicker, and glow definitions.

Run all existing tests, perform every Stage B browser scenario, and report measured element bounds for both mobile viewports. Do not mark the stage complete from visual intuition alone. Do not commit or push.
```

### 사람이 확인할 모바일 기준

AI가 “모바일에서 잘 보인다”고 말하는 것만으로 부족합니다. 최소한 다음 숫자를 확인해야 합니다.

- 뷰포트 폭: 375 또는 390
- 게임 영역의 `left`: 0 이상
- 게임 영역의 `right`: 뷰포트 폭 이하
- 통로 폭: 뷰포트에서 좌우 패딩을 뺀 값 이하
- 버튼의 위·아래·좌·우 경계: 모두 화면 안
- `body` 또는 실제 스크롤 컨테이너: 필요한 경우 세로 스크롤 가능

키보드는 다음 순서로 확인합니다.

1. Tab으로 **Go Forward**에 포커스하고 Enter를 누릅니다.
2. 실제로 forward 동작과 normal 판단이 한 번 실행되는지 확인합니다.
3. Tab으로 **Turn Back**에 포커스하고 Enter를 누릅니다.
4. 실제로 back 동작과 anomaly 판단이 한 번 실행되는지 확인합니다.
5. Space로도 각각 한 번만 실행되는지 확인합니다.

## 6. 3단계: 정상 장면과 문서 정리 지시

1·2단계를 통과한 뒤 맡깁니다.

### 복사해서 사용할 프롬프트

```text
Read QWEN_CODER_SECOND_REVIEW_FIX_REQUEST.md and inspect the accepted Stage A and Stage B implementation.

Implement Stage C only.

Required outcomes:
- Render a stable normal corridor with visible reference objects.
- Every implemented anomaly mutates or augments a known reference object.
- Render the baseline first and apply one anomaly by registry ID.
- Verify every registry entry visually before counting it as implemented.
- Make the anomaly count consistent in both README files and the catalog.
- Remove Markdown fences from .gitignore and restore unintentionally removed useful patterns.
- Remove or correct false “all completed” claims in todo_list.md.
- Document the real `cd exit8 && npm test` command and actual keyboard rules.
- Record only browser scenarios and viewport sizes that were truly tested.

Do not add new anomaly types. Do not commit or push. Report files changed, tests, browser checks, remaining limitations, and git status.
```

### 정상 장면을 평가하는 방법

“normalDescription이 있다”는 것과 정상 장면이 구현됐다는 것은 다릅니다.

화면에서 직접 다음을 확인해야 합니다.

- 정상 라운드에도 포스터가 보이는가?
- 정상 라운드에도 올바른 EXIT 8 표지판이 보이는가?
- 정상 상태의 문과 조명이 항상 같은 위치에 있는가?
- 이상 라운드에서는 그중 하나가 바뀌는가?
- 단순히 빈 통로에 손·그림자·문이 새로 생기는 방식만 사용하고 있지 않은가?

좋은 이상 현상은 이전 정상 상태와 비교할 수 있어야 합니다.

## 7. AI 결과 보고서를 읽는 방법

AI가 다음과 같이 말해도 그대로 믿지 말고 증거를 확인하세요.

### “모든 테스트가 통과했습니다”

확인할 내용:

- 실행한 정확한 명령이 있는가?
- 통과/실패 개수가 있는가?
- 종료 코드가 성공인가?
- 테스트 파일이 실제 npm 스크립트에 연결되어 있는가?
- 테스트가 함수 자체를 다시 정의하여 실제 구현을 우회하지 않는가?

### “반응형 디자인을 확인했습니다”

확인할 내용:

- 실제 테스트한 뷰포트 숫자가 있는가?
- 요소 경계 측정값 또는 스크린샷이 있는가?
- 가로 넘침을 숫자로 확인했는가?
- 화면이 잘린 것을 “디자인 의도”로 합리화하지 않았는가?

### “접근성을 개선했습니다”

확인할 내용:

- 포커스된 버튼의 Enter/Space가 버튼 의미대로 작동하는가?
- 전역 키보드 이벤트가 버튼 기본 동작을 가로채지 않는가?
- disabled 상태가 실제 DOM 속성으로 적용되는가?
- reduced-motion에서 `!important` 애니메이션도 멈추는가?

### “모든 작업이 완료됐습니다”

확인할 내용:

- TODO 체크 상태가 아니라 Definition of Done을 기준으로 판단했는가?
- 실패한 테스트와 알려진 버그가 0개인가?
- 문서의 구현 개수와 레지스트리 개수가 같은가?
- `git diff --check`가 통과하는가?

## 8. 문제가 반복될 때 사용하는 교정 프롬프트

AI가 완료 선언만 하고 증거를 제공하지 않으면 다음 프롬프트를 사용하세요.

```text
Do not make additional code changes yet. Audit your previous completion claim against the Definition of Done in QWEN_CODER_SECOND_REVIEW_FIX_REQUEST.md.

For every requirement, provide one of:
- exact automated test name and command output;
- exact browser scenario and observed state;
- exact file and line implementing it;
- INCOMPLETE with the reason.

Do not use TODO checkmarks, comments, or documentation text as proof that runtime behavior works. If any item lacks evidence, change the stage status to incomplete and propose the smallest next fix.
```

## 9. 커밋과 푸시를 허용하는 시점

다음 조건을 모두 만족하기 전에는 AI에게 푸시를 요청하지 않는 것이 좋습니다.

- 작업 단계의 자동 테스트가 전부 통과함
- 브라우저 수동 검증 결과를 사람이 확인함
- 예상하지 않은 파일 변경이 없음
- README와 코드가 같은 규칙을 설명함
- `git diff --check`가 통과함
- `git status --short`의 변경 파일을 사람이 이해함

검토 후 푸시를 요청할 때는 범위를 명확하게 지정하세요.

```text
Commit and push only the files from the accepted Stage A work. Show the staged diff summary before committing. Do not include unrelated files. Open a draft pull request targeting main and include the exact validation results in the PR body.
```

## 10. 최종 합격 체크리스트

### 코어 로직

- [ ] 진행도는 0부터 시작한다.
- [ ] 정상에서 앞으로, 이상에서 뒤로가 각각 정답이다.
- [ ] 정답 하나는 진행도를 정확히 1만 올린다.
- [ ] 오답은 진행도를 0으로 초기화한다.
- [ ] 전환 중 연속 입력이 무시된다.
- [ ] 이전 타이머가 새 게임을 바꾸지 않는다.
- [ ] 정상·이상 어느 쪽으로도 8번째 정답 승리가 가능하다.

### 테스트

- [ ] `cd exit8 && npm test`가 실행된다.
- [ ] 모든 테스트가 통과한다.
- [ ] 테스트가 DOM에 의존하지 않는다.
- [ ] 무작위 테스트가 결정적이다.
- [ ] 실패하면 명령도 실패 종료 코드를 반환한다.

### UI와 접근성

- [ ] 게임 버튼은 앞으로와 뒤로 두 개뿐이다.
- [ ] 버튼이 전환 중 실제로 disabled 된다.
- [ ] 포커스된 버튼의 Enter/Space가 버튼 의미대로 동작한다.
- [ ] 모바일 화면에 가로 넘침이 없다.
- [ ] 짧은 화면에서 필요한 내용에 접근할 수 있다.
- [ ] reduced-motion에서 반복 애니메이션이 멈춘다.

### 콘텐츠와 문서

- [ ] 정상 장면에 비교 기준 물체가 있다.
- [ ] 모든 이상 현상은 기준 장면의 변화를 표현한다.
- [ ] 레지스트리·도감·README의 이상 현상 개수가 같다.
- [ ] `.gitignore`에 Markdown 코드 펜스가 없다.
- [ ] CSS 클래스와 keyframes가 중복되지 않는다.
- [ ] 완료 문구가 실제 검증 결과와 일치한다.

이 체크리스트가 모두 충족된 뒤에만 전체 작업을 완료로 판단하는 것이 좋습니다.
