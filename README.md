# i18n-automation
i18n으로 번역되는 국가별 리소스 파일을 자동화하는 모듈 입니다.

## Guide

### 1. 자동화 모듈 install
    > npm install -g swingpapago
    > spago init // root/spago.creds.json 생성 및 초기 설정

### 2. Google Spreadsheet API 인증
    1. Google Cloud 로그인
    2. IAM 및 관리자 > 리소스 관리 > 프로젝트 생성
    3. 생성된 프로젝트 > API 및 서비스 > 사용자 인증 정보 > 서비스 계정 생성
    4. 생성한 계정의 서비스 계정 세부정보 > 키 항목 탭
    5. 키 추가 > JSON 키 유형을 선택 > JSON 키 파일 생성
    6. spago.creds.json에 생성된 JSON 파일 내용 넣기
    7. .gitignore에 spago.creds.json 추가

### 3. Google Spreadsheet 연동
    1. 번역본을 작성할 구글 스프레드시트 생성
    2. 스프레드시트의 공유 > 사용자 및 그룹추가에 spago.creds.json에 적힌 client_email 추가
    3. 스프레드시트 첫 번째 열에 헤더 작성
    4. spago.creds.json의 spreadsheet_doc_id 키 값에 스프레드시트 doc id 작성
    5. 스프레드시트 doc id는 해당 스프레드 시트 url에서 확인
    6. https://docs.google.com/spreadsheets/d/{{spreadsheet_doc_id}}/edit#gid=0
    7. 스프레드시트 key에 번역할 키, ko에 한국어 번역, en에 영어 번역 작성

### 4. 구글 스프레드시트 리소스 다운로드 (CLI 명령어 실행)
    > npm run sl

### 5. 다운받은 리소스 파일 확인
    src/i18n/locales/{ko or en}/translation.json 생성