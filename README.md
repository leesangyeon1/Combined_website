# Combined_website
# Sangyeon Lee — IT Infrastructure & Systems Specialist Portfolio

Next.js (App Router) + TypeScript 기반의 개인 포트폴리오입니다. Bootstrap 5, 커스텀 SCSS 토큰, Three.js 효과를 사용해 반응형/접근성 있는 UI를 제공합니다. 모든 콘텐츠는 `content/site.json`에서 관리되며, 정적 빌드(out/)를 Cloudflare Pages 같은 정적 호스팅으로 바로 배포할 수 있도록 구성했습니다.

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
│   │   └── (resume_fin.pdf)    # Git LFS 없이 직접 업로드할 실제 이력서 (미포함)
│   └── favicon.ico             # 파비콘(플레이스홀더)
├── styles/
│   ├── _theme.scss             # Bootstrap 변수 오버라이드
│   └── globals.scss            # 글로벌 스타일 + 커스텀 유틸리티
├── next.config.mjs             # Next.js 설정 (정적 export 활성화)
├── package.json                # 의존성 및 npm scripts
├── tsconfig.json               # TypeScript 설정
├── .eslintrc.json              # ESLint 설정
├── .prettierrc.json            # Prettier 설정
└── README.md
```

## Cloudflare Pages 배포 흐름
1. **GitHub에 푸시**만 하면 됩니다. Pages가 `npm install` → `npm run build` (Next.js가 자동으로 정적 out/ 생성) 를 실행하면 `/out` 디렉터리에 정적 결과가 생성됩니다.
2. Cloudflare Pages 프로젝트 설정
   - **Framework preset**: `Next.js`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
3. 배포가 완료되면 `/resume`, `/#contact` 등 라우트가 정적으로 동작합니다. FormSubmit 리다이렉트는 `/?sent=1` 로 설정되어 있으므로 도메인이 바뀌어도 문제 없습니다.

> 로컬 개발 서버가 필요 없다면 GitHub 웹 UI에서 파일을 수정하고 커밋해도 됩니다. 다만 미리보기나 접근성 점검이 필요하면 아래 명령으로 직접 실행해 볼 수 있습니다.

## Optional – 로컬에서 미리보기
```bash
npm install
npm run dev  # http://localhost:3000
```
정적 결과 확인은 `npm run build` 후 생성되는 `out/` 폴더를 정적 서버(`npx serve out`)로 열면 됩니다.

## Content & customization
- 모든 텍스트/링크/CTA는 `content/site.json`에서 관리합니다.
- 색상/타이포그래피 토큰은 `styles/_theme.scss`와 `styles/globals.scss`에서 조정합니다.
- `public/Assets/preview.png`, `public/favicon.ico` 파일은 실제 자산으로 교체하세요.
- 이력서 PDF는 저장소에 포함되어 있지 않습니다. 아래 “Resume asset” 섹션을 참고하세요.
- Hero 카드(Clusters/IT/Networking)를 클릭하면 배경 효과가 전환됩니다.
  - Clusters: Vanta.NET 효과
  - IT: `components/LaserFlow.tsx`의 Three.js 애니메이션
  - Networking: 기본 그라데이션 유지

## Contact form
- FormSubmit 토큰(`content/site.json > contact.form.action`)을 본인의 것으로 교체하세요.
- `_next`가 `/?sent=1` 로 되어 있어 도메인에 상관없이 성공 배지를 표시합니다.

## Resume asset
- 저장소에는 PDF 이력서를 커밋하지 않았습니다. GitHub PR에서 “바이너리 diff 미지원” 경고를 피하기 위함입니다.
- PDF를 사용하려면 두 가지 방법 중 하나를 선택하세요.
  1. `public/Assets/resume_fin.pdf` 경로에 파일을 추가합니다. (큰 파일은 main 브랜치에 직접 푸시하거나 릴리스 자산으로 업로드하는 것을 권장)
  2. `content/site.json`의 `resume.filePath`에 호스팅된 PDF URL(예: Cloudflare R2, Dropbox 공유 링크 등)을 지정합니다.
- 파일 경로를 지정하면 `/resume` 페이지가 iframe/다운로드 버튼을 자동으로 표시합니다.

## Accessibility/Performance 참고
- `prefers-reduced-motion` 설정 시 애니메이션과 배경 효과가 자동으로 비활성화됩니다.
- 헤더와 각 섹션은 시맨틱 마크업(`nav`, `section`, `main`)을 사용합니다.
- Bootstrap JS는 필요할 때만 동적으로 로드되어 초기 번들을 최소화합니다.
