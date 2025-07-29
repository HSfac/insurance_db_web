# 보험 DB 관리 시스템

Next.js와 Supabase를 활용한 보험 고객 데이터 수집 및 관리 웹 애플리케이션입니다.

## 🎯 주요 기능

- **고객 정보 관리**: 개인정보 및 보험 관련 정보 입력/수정/삭제
- **보험사 전송**: 고객 데이터를 여러 보험사에 일괄 전송
- **통계 대시보드**: 고객 등록 현황 및 전송 통계 시각화
- **시스템 설정**: 보험사 관리 및 시스템 설정
- **원페이지 구성**: 탭 형태의 직관적인 인터페이스

## 🛠 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend & Database**: Supabase (PostgreSQL)
- **Form Management**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## 🚀 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd insurance_db_web
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. Supabase 데이터베이스 설정

Supabase 프로젝트를 생성하고 다음 테이블들을 만들어주세요:

#### users 테이블
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### customers 테이블
```sql
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR CHECK (gender IN ('male', 'female')) NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR NOT NULL,
  occupation VARCHAR NOT NULL,
  income INTEGER NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### insurance_info 테이블
```sql
CREATE TABLE insurance_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  current_insurance JSONB,
  desired_insurance JSONB NOT NULL,
  coverage_amount INTEGER NOT NULL,
  coverage_period INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### insurance_companies 테이블
```sql
CREATE TABLE insurance_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  contact_email VARCHAR NOT NULL,
  api_endpoint VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### transmissions 테이블
```sql
CREATE TABLE transmissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  company_id UUID REFERENCES insurance_companies(id),
  status VARCHAR CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  transmitted_data JSONB,
  response_data JSONB,
  transmitted_by UUID REFERENCES users(id),
  transmitted_at TIMESTAMP DEFAULT NOW()
);
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 📋 사용법

### 1. 고객 등록
- **고객 등록** 탭에서 새 고객의 개인정보와 보험 정보를 입력
- 필수 항목을 모두 채우고 **고객 등록** 버튼 클릭

### 2. 고객 목록 관리
- **고객 목록** 탭에서 등록된 고객 조회
- 검색, 필터링, 엑셀 다운로드 기능 사용
- 고객 상세 정보 확인 및 삭제

### 3. 보험사 전송
- **전송 관리** 탭에서 보험사 선택
- 전송할 고객 선택 후 일괄 전송
- 전송 이력 및 상태 확인

### 4. 통계 확인
- **통계** 탭에서 다양한 차트와 지표 확인
- 월별 고객 등록 현황
- 보험 종류별 분포
- 전송 성공률 등

### 5. 시스템 설정
- **설정** 탭에서 보험사 정보 관리
- 시스템 설정 및 보안 설정 조정

## 🔧 개발 가이드

### 프로젝트 구조
```
src/
  ├── app/                 # Next.js App Router
  ├── components/          # React 컴포넌트
  │   ├── ui/             # Shadcn/ui 컴포넌트
  │   ├── CustomerForm.tsx
  │   ├── CustomerList.tsx
  │   ├── TransmissionManager.tsx
  │   ├── Dashboard.tsx
  │   └── SettingsPanel.tsx
  └── lib/
      ├── supabase.ts     # Supabase 클라이언트 설정
      └── utils.ts        # 유틸리티 함수
```

### 주요 스크립트
```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run lint         # ESLint 실행
```

## 🔒 보안 고려사항

- 환경 변수를 통한 API 키 관리
- Supabase Row Level Security (RLS) 적용 권장
- 개인정보 암호화 처리
- HTTPS 사용 필수

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 연락처

프로젝트에 대한 문의사항이 있으시면 언제든 연락해주세요.

---

**프로젝트 버전**: 1.0.0  
**최종 업데이트**: 2024년 12월
