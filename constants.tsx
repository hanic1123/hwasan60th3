
import { SemesterData, NonAcademicData, HighSchool } from './types';

export const GRADE_1_SUBJECTS = ['국어', '수학', '영어', '과학', '사회', '기가', '도덕', '한문', '미술', '음악', '체육'];
export const GRADE_2_SUBJECTS = ['국어', '수학', '영어', '과학', '역사', '기가', '도덕', '정보', '미술', '음악', '체육'];
export const GRADE_3_SUBJECTS = ['국어', '수학', '영어', '과학', '역사', '사회', '기가', '한문', '미술', '음악', '체육'];

export const INITIAL_NON_ACADEMIC: NonAcademicData = {
  attendance: {
    absences: [0, 0, 0],
    tardies: [0, 0, 0],
    earlyLeaves: [0, 0, 0],
    results: [0, 0, 0],
  },
  volunteer: {
    hours: 0,
    specialCase: 'none',
  },
  behavior: {
    grade1: { base: 3, extra: 0 },
    grade2: { base: 3, extra: 0 },
    grade3: { base: 3, extra: 0 },
  },
};

export const MOCK_SCHOOLS: HighSchool[] = [
  {
    id: 'hs1',
    name: '전북과학고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800',
    type: '과학고',
    location: '전북 익산시',
    eligibility: '전북 소재 중학교 졸업예정자',
    description: '미래 과학 인재 양성을 목표로 하는 전북 유일의 과학고등학교입니다.',
    progressionRate: '대학교 진학률 98%'
  },
  {
    id: 'hs2',
    name: '상산고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800',
    type: '자사고',
    location: '전북 전주시',
    eligibility: '전국 단위 모집',
    description: '수학 교육에 특화된 자율형 사립고등학교로, 전북의 자부심입니다.',
    progressionRate: '의치한 및 명문대 진학률 최상위'
  },
  {
    id: 'hs3',
    name: '경기과학고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=800',
    type: '영재학교',
    location: '경기 수원시',
    eligibility: '전국 단위 모집',
    description: '대한민국 최초의 과학고등학교이자 세계적인 과학 영재 교육기관입니다.',
    progressionRate: '설카포 진학률 90% 이상'
  },
  {
    id: 'hs4',
    name: '민족사관고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    type: '자사고',
    location: '강원 횡성군',
    eligibility: '전국 단위 모집',
    description: '민족 정신과 세계적 안목을 갖춘 지도자 양성을 목표로 합니다.',
    progressionRate: '국내외 명문대 진학률 최상위'
  },
  {
    id: 'hs5',
    name: '서울과학고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=800',
    type: '영재학교',
    location: '서울 종로구',
    eligibility: '전국 단위 모집',
    description: '대한민국 과학 교육의 정점에 있는 최고 수준의 과학 영재학교입니다.',
    progressionRate: '서울대 진학률 압도적 1위'
  },
  {
    id: 'hs6',
    name: '하나고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800',
    type: '자사고',
    location: '서울 은평구',
    eligibility: '서울 단위 모집',
    description: '토론식 수업과 창의적 체험 활동이 강점인 명문 자사고입니다.',
    progressionRate: '서울대 및 명문대 진학률 최상위'
  },
  {
    id: 'hs7',
    name: '전북외국어고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800',
    type: '외고',
    location: '전북 군산시',
    eligibility: '전북 소재 중학교 졸업예정자',
    description: '글로벌 리더를 꿈꾸는 전북의 외교 인재들이 모이는 곳입니다.',
    progressionRate: '주요 10대 대학 진학률 우수'
  },
  {
    id: 'hs8',
    name: '용인한국외국어대학교부설고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
    type: '자사고',
    location: '경기 용인시',
    eligibility: '전국 단위 모집',
    description: '국제/인문/자연 통합 교육의 선두주자인 외대부고입니다.',
    progressionRate: '국내 대학 및 해외 대학 진학 실적 최상'
  },
  {
    id: 'hs9',
    name: '한성과학고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1524486361537-8ad15938e1a3?auto=format&fit=crop&q=80&w=800',
    type: '과학고',
    location: '서울 서대문구',
    eligibility: '서울 소재 중학교 졸업예정자',
    description: '서울 지역 이공계 인재들의 요람입니다.',
    progressionRate: '이공계 특성화 대학 진학률 우수'
  },
  {
    id: 'hs10',
    name: '부산과학고등학교',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=800',
    type: '과학고',
    location: '부산 금정구',
    eligibility: '부산 소재 중학교 졸업예정자',
    description: '부산의 자부심, 해양 수도의 과학 인재를 육성합니다.',
    progressionRate: '대학교 진학률 95% 이상'
  }
];
