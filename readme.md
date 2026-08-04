# Exit 8 - 웹 브라우저 심리 호러 퍼즐 게임

[🎮 게임 플레이하기](https://qdwe93g.github.io/test/exit8/)

## 📖 프로젝트 설명

이 저장소는 일본의 인디 게임 "The Exit 8"을 웹 브라우저에서 즐길 수 있도록 재현한 프로젝트입니다.
지하철 통로를 배경으로 이상한 점을 찾아내고 8 번 출구를 찾는 심리 호러 퍼즐 게임입니다.

## 🚀 빠른 시작

1. [GitHub Pages](https://qdwe93g.github.io/test/exit8/) 에서 바로 플레이
2. 또는 로컬에서 실행:
   ```bash
   cd exit8
   python3 -m http.server 8080
   ```
   브라우저에서 `http://localhost:8080` 으로 접속

## 📂 디렉토리 구조

```
/workspace/
├── readme.md              # 이 파일 (저장소 개요)
├── QWEN_CODER_REVIEW_GUIDE.md  # 코드 리뷰 가이드
└── exit8/                 # 게임 소스 코드
    ├── index.html         # 메인 HTML
    ├── README.md          # 상세 문서
    ├── plan.md            # 개발 계획서 (역사적 문서)
    ├── css/               # 스타일시트
    └── js/                # JavaScript 모듈
```

## ✅ 구현 완료 상태

- [x] Phase 1: 코어 게임 루프 수리
- [x] Phase 2: 데이터 기반 씬 생성
- [x] Phase 3: UX 및 접근성 개선
- [x] Phase 4: 문서화 및 배포

## 📝 상세 문서

자세한 게임 방법, 기술 스택, 테스트 방법은 [`exit8/README.md`](./exit8/README.md) 를 참조하세요.

## ⚠️ 알려진 제한사항

- 5 가지 이상 현상만 구현됨 (원래 계획: 8 가지)
- 사운드 효과 미구현
- 멀티플레이어 모드 미지원

## 📄 라이선스

MIT License
