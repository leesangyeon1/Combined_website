# Combined_website
# Sangyeon Lee — IT Infrastructure & Systems Specialist Portfolio

Next.js (App Router) + TypeScript 기반의 개인 포트폴리오 사이트 코드입니다. Bootstrap 5와 커스텀 SCSS 토큰을 사용해 반응형/접근성 있는 UI를 구성하고, Three.js + Vanta.js 배경 효과를 Hero 섹션 카드 클릭에 따라 전환합니다.

## Website structure
```
.
├── app/
│   ├── layout.tsx              # 전역 레이아웃, 메타데이터, 헤더/푸터, 글로벌 스크립트
│   ├── page.tsx                # 홈 (Hero, About, Experience, Projects, Skills, Contact)
│   └── resume/
│       └── page.tsx            # 이력서 PDF 뷰어 (iframe)
├── components/
│   ├── BootstrapClient.tsx     # Bootstrap JS 동적 import (client)
│   ├── ContactForm.tsx         # FormSubmit 연동 + 동적 subject/reply-to (client)
│   ├── Footer.tsx              # 공통 푸터
│   ├── Header.tsx              # 고정 헤더 + 스크롤 그림자 (client)
│   ├── Hero.tsx                # Hero 콘텐츠 + 배경 효과 전환 (client)
│   ├── LaserFlow.tsx           # Three.js 기반 레이저 플로우 배경 (client)
│   ├── SectionAbout.tsx        # About 섹션
│   ├── SectionContact.tsx      # Contact 섹션 wrapper (Form 포함)
│   ├── SectionExperience.tsx   # Experience 타임라인
│   ├── SectionProjects.tsx     # Projects 카드 그리드
│   └── SectionSkills.tsx       # Skills 칩 리스트
├── content/
│   └── site.json               # 내비게이션/카피/링크 등 콘텐츠 소스
├── public/
│   ├── Assets/
│   │   ├── preview.png         # OG 이미지(플레이스홀더)
│   │   └── resume_fin.pdf      # PDF 뷰어용 이력서(플레이스홀더)
│   └── favicon.ico             # 파비콘(플레이스홀더)
├── styles/
│   ├── _theme.scss             # Bootstrap 변수 오버라이드
│   └── globals.scss            # 글로벌 스타일 + 커스텀 유틸리티
├── next.config.mjs             # Next.js 설정
├── package.json                # 의존성 및 npm scripts
├── tsconfig.json               # TypeScript 설정
├── .eslintrc.json              # ESLint 설정
├── .prettierrc.json            # Prettier 설정
└── README.md
```

## Getting started
1. 의존성 설치
   ```bash
   npm install
   ```
2. 개발 서버 실행
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:3000` 접속.
3. 프로덕션 빌드/검증
   ```bash
   npm run build
   npm run start
   ```
4. 코드 검사
   ```bash
   npm run lint
   ```

## Content & customization
- 모든 텍스트/링크/CTA는 `content/site.json`에서 관리합니다.
- 색상/타이포그래피 토큰은 `styles/_theme.scss`와 `styles/globals.scss`에서 조정합니다.
- `public/Assets/preview.png`, `public/Assets/resume_fin.pdf`, `public/favicon.ico` 파일은 실제 자산으로 교체하세요.
- Hero 카드(Clusters/IT/Networking)를 클릭하면 배경 효과가 전환됩니다.
  - Clusters: Vanta.NET 효과
  - IT: `components/LaserFlow.tsx`의 Three.js 애니메이션
  - Networking: 기본 그라데이션 유지

## Deployment notes
- 정적 파일은 `/public` 하위에 위치하며 Next.js가 자동 서빙합니다.
- FormSubmit을 그대로 사용하려면 `content/site.json`의 `contact.form.action`을 자신의 토큰으로 교체하세요.
- 배경 효과는 `prefers-reduced-motion` 설정을 존중해 자동으로 비활성화됩니다.
