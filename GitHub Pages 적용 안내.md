# AED Lab 연구 페이지 적용

## 기존 dshanlab.org에 적용

1. ZIP을 풉니다. GitHub 저장소의 현재 Pages 배포 소스에서 기존 `research.html`이 있는 폴더를 엽니다. 배포 소스는 저장소의 **Settings → Pages**에서 확인할 수 있습니다.
2. 같은 폴더에 `research.html`, `research-aed.css`, `research-aed.js`를 복사합니다. GitHub에서는 변경 파일 세 개를 커밋하고, 현재 사용 중인 배포 브랜치 또는 배포 워크플로로 반영합니다.
3. `style.css`, `header-brand.css`, `Images/`는 미리보기에도 사용할 수 있도록 이번 ZIP에 원본을 담았습니다. 기존 dshan 저장소에는 같은 파일이 있으므로 그 복사본을 그대로 사용하면 됩니다. WIKI 메뉴는 저장소의 기존 `private-app-config.js`를 사용합니다. 다른 홈페이지 파일, 도메인 및 Pages 설정을 변경할 필요가 없습니다.
4. GitHub의 **Actions**에서 Pages 배포가 성공하면 [공개 연구 페이지](https://dshanlab.org/research.html)를 열어 로고, 메뉴, 5개 탭 및 그림을 확인합니다. 기존 링크 `#transport`, `#computing`, `#materials`와 새 링크 `#dynamics`, `#probabilistic`도 확인합니다. 복구하려면 해당 커밋을 되돌립니다.

## 로컬 미리보기

ZIP을 푼 폴더에서 `research.html`을 브라우저로 엽니다. 본문, 그림, 연구 탭 및 SVG 데모를 볼 수 있습니다. 사이트의 다른 메뉴 페이지와 WIKI 연결은 기존 저장소 안에서 확인합니다.

키보드의 좌우 화살표 키와 Home/End로 연구 탭을 전환할 수 있습니다. 운영체제에서 동작 줄이기를 켜면 연속 애니메이션 대신 정적 상태를 선택할 수 있습니다. P-bit는 이 설정에서도 한 번씩 샘플링할 수 있습니다. 도식과 P-bit 시퀀스는 개념 예시이며, 정량적 연구 결과는 본문의 공개 논문에서 확인할 수 있습니다.

[GitHub Pages 배포 소스 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
