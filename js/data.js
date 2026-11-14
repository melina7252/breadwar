// 빵들의 전쟁 - 게임 데이터 (빵, 외계인, 스테이지, 스토리, 도전 과제)
'use strict';

// 스탯 키: hp 체력, atk 공격력, def 방어력, cost 코스트, spd 이동속도(px/s),
// aspd 공격속도(회/초), range 사거리(px), cd 재투입 대기시간(초), hw 몸통 반폭(px)
// 특성 키: kb 밀쳐내기 확률, splash 범위, slow 감속, heal 치유 배율, crit 치명타, proj 투사체,
// pierce 관통, multi 동시 출격 수, hits 연타, first 첫 타 배율, burst 사망 폭발 배율, shred 방어 파괴,
// dot 지속 피해(초당 공격력 배율), aura 피해 감소 오라, stun 기절 확률, targets 다중 대상,
// lifesteal 흡혈, rage 광폭, chain 연쇄, beam 관통 광선, shield 보호막 비율, fly 비행, anim 동작
BW.BREADS = {
  // ───────── 일반 (상시 뽑기 / 전투 보상) ─────────
  loaf: {
    name: '식빵', evoName: '버터 식빵 기사', rarity: 1,
    desc: '오븐에서 가장 먼저 구워진 든든한 기본 병사. 포크 검을 휘두른다.',
    evoDesc: '버터를 바르고 기사 서임을 받았다. 황금 포크 검이 반짝인다.',
    hp: 120, atk: 14, def: 6, cost: 3, spd: 22, aspd: 1.0, range: 12, cd: 3, hw: 7,
  },
  croissant: {
    name: '크루아상', evoName: '크루아상 검객', rarity: 1,
    desc: '겹겹이 바삭한 몸으로 재빠르게 달려가 연속으로 할퀸다.',
    evoDesc: '붉은 머리띠를 질끈 묶었다. 결이 살아있는 검술의 달인.',
    hp: 70, atk: 9, def: 2, cost: 2, spd: 36, aspd: 1.6, range: 10, cd: 2, hw: 7,
  },
  baguette: {
    name: '바게트', evoName: '바게트 창기사', rarity: 1,
    desc: '길쭉한 키와 긴 창으로 적이 닿기 전에 먼저 찌른다.',
    evoDesc: '베레모를 쓴 프랑스풍 창기사. 창끝에 황금빛이 감돈다.',
    hp: 90, atk: 19, def: 4, cost: 5, spd: 20, aspd: 0.8, range: 36, cd: 5, hw: 6,
    trait: '긴 창: 근접 유닛보다 멀리서 공격',
  },
  danpat: {
    name: '단팥빵', evoName: '단팥 철갑병', rarity: 1,
    desc: '속이 꽉 찬 단팥 덕분에 맷집이 대단하다. 앞에서 적을 막아낸다.',
    evoDesc: '철 투구와 냄비뚜껑 방패로 무장했다. 쉽게 쓰러지지 않는다.',
    hp: 300, atk: 6, def: 14, cost: 6, spd: 14, aspd: 0.7, range: 10, cd: 8, hw: 8,
    trait: '탱커: 높은 체력과 방어력',
  },
  donut: {
    name: '도넛', evoName: '초코 도넛 폭주족', rarity: 1,
    desc: '데굴데굴 굴러 돌진한다. 부딪힌 적을 튕겨낸다.',
    evoDesc: '초코 코팅에 선글라스. 아무도 이 도넛을 멈출 수 없다.',
    hp: 80, atk: 15, def: 3, cost: 4, spd: 46, aspd: 1.0, range: 10, cd: 4, hw: 7,
    kb: 0.3, anim: 'roll', trait: '돌진: 30% 확률로 적을 밀쳐냄',
  },
  rolls: {
    name: '모닝빵', evoName: '모닝빵 사총사', rarity: 1,
    desc: '작지만 언제나 셋이 함께! 우르르 몰려가 적을 둘러싼다.',
    evoDesc: '깃털 모자를 쓴 총사들. 이제는 넷이서 "하나는 모두를 위해!"',
    hp: 48, atk: 7, def: 1, cost: 4, spd: 30, aspd: 1.3, range: 9, cd: 6, hw: 5,
    multi: 3, evoUp: { multi: 4 }, trait: '3개 동시 출격 (진화 시 4개)',
  },
  bungeo: {
    name: '붕어빵', evoName: '황금 잉어빵', rarity: 1,
    desc: '겨울의 인기 스타. 팔딱팔딱 뛰어가 첫 일격을 강하게 먹인다.',
    evoDesc: '황금빛으로 구워진 잉어빵. 수염까지 났다. 폭포도 거슬러 오른다.',
    hp: 85, atk: 16, def: 3, cost: 4, spd: 40, aspd: 0.9, range: 14, cd: 4.5, hw: 8,
    first: 2.5, anim: 'leap', trait: '뛰어들기: 첫 공격 2.5배 피해',
  },
  kkwabaegi: {
    name: '꽈배기', evoName: '설탕 꽈배기 쌍검사', rarity: 1,
    desc: '배배 꼬인 몸으로 양손 단검을 휘두른다. 한 번에 두 번 벤다.',
    evoDesc: '설탕을 듬뿍 묻힌 쌍검의 달인. 황금 단검이 눈부시다.',
    hp: 100, atk: 9, def: 4, cost: 3, spd: 28, aspd: 1.1, range: 12, cd: 3.5, hw: 7,
    hits: 2, trait: '쌍검: 공격할 때마다 2연타',
  },
  jjinppang: {
    name: '찐빵', evoName: '왕찐빵 대장', rarity: 1,
    desc: '김이 모락모락. 쓰러지는 순간 뜨거운 김을 터뜨려 주변을 휩쓴다.',
    evoDesc: '대나무 찜기 모자를 쓴 대장. 김의 온도가 훨씬 뜨거워졌다.',
    hp: 220, atk: 8, def: 8, cost: 5, spd: 16, aspd: 0.7, range: 10, cd: 7, hw: 8,
    burst: 6, trait: '뜨거운 김: 쓰러질 때 주변에 범위 피해',
  },
  muffin: {
    name: '블루베리 머핀', evoName: '블루베리 포병 머핀', rarity: 2,
    desc: '머리 위의 블루베리를 따서 멀리 던진다. 후방 지원 담당.',
    evoDesc: '요리사 모자를 쓰고 황금 컵으로 갈아입었다. 블루베리가 더 단단해졌다.',
    hp: 70, atk: 17, def: 3, cost: 7, spd: 18, aspd: 0.8, range: 90, cd: 7, hw: 7,
    proj: 'berry', trait: '원거리: 블루베리 투척',
  },
  melonpan: {
    name: '메론빵', evoName: '메론빵 요새', rarity: 2,
    desc: '바삭한 쿠키 껍질은 웬만한 레이저도 튕겨낸다. 움직이는 성벽.',
    evoDesc: '진짜 메론처럼 초록빛으로 익었다. 껍질이 강철처럼 단단하다.',
    hp: 520, atk: 10, def: 22, cost: 10, spd: 12, aspd: 0.6, range: 10, cd: 14, hw: 9,
    trait: '철벽: 매우 높은 체력과 방어력',
  },
  bagel: {
    name: '베이글', evoName: '참깨 베이글 마스터', rarity: 2,
    desc: '쫄깃한 베이글 링을 던진다. 링은 적을 꿰뚫고 날아간다.',
    evoDesc: '검은깨와 흰깨를 모두 두른 달인. 링이 더 멀리 날아간다.',
    hp: 110, atk: 20, def: 6, cost: 9, spd: 18, aspd: 0.7, range: 80, cd: 9, hw: 8,
    proj: 'ring', pierce: true, trait: '관통: 일직선상의 적을 모두 공격',
  },
  soboro: {
    name: '소보로빵', evoName: '소보로 폭격수', rarity: 2,
    desc: '울퉁불퉁한 소보로 가루를 뭉쳐 포물선으로 던진다. 넓게 터진다.',
    evoDesc: '비행 고글을 장착한 폭격 전문가. 소보로 폭탄이 더 크게 터진다.',
    hp: 140, atk: 18, def: 8, cost: 9, spd: 18, aspd: 0.6, range: 64, cd: 10, hw: 8,
    proj: 'crumb', splash: 22, trait: '범위 공격: 착탄 지점 주변 피해',
  },
  cinnamon: {
    name: '시나몬롤', evoName: '시나몬 마법사', rarity: 2,
    desc: '빙글빙글 시나몬 소용돌이를 쏘아 적을 어지럽혀 느리게 만든다.',
    evoDesc: '별 모자를 쓴 마법사. 소용돌이가 더 오래 지속된다.',
    hp: 130, atk: 13, def: 6, cost: 8, spd: 20, aspd: 0.9, range: 54, cd: 9, hw: 8,
    proj: 'swirl', slow: 0.45, trait: '감속: 적의 이동·공격 속도 45% 감소',
  },
  pretzel: {
    name: '프레첼', evoName: '프레첼 권법가', rarity: 2,
    desc: '꼬인 팔로 눈에 보이지 않을 만큼 빠른 연타를 날린다.',
    evoDesc: '권법의 경지에 오른 프레첼. 소금 결정이 빛난다.',
    hp: 160, atk: 11, def: 8, cost: 7, spd: 26, aspd: 2.0, range: 12, cd: 7, hw: 8,
    trait: '연타: 매우 빠른 공격 속도',
  },
  creampuff: {
    name: '슈크림빵', evoName: '슈크림 천사', rarity: 2,
    desc: '달콤한 크림으로 주변 아군 빵을 치료한다. 상처엔 역시 크림!',
    evoDesc: '천사의 날개와 고리를 얻었다. 치유의 크림이 넘쳐흐른다.',
    hp: 120, atk: 6, def: 6, cost: 10, spd: 18, aspd: 0.5, range: 56, cd: 14, hw: 8,
    proj: 'cream', heal: 2.6, trait: '치유: 공격할 때마다 주변 아군 회복',
  },
  saltbread: {
    name: '소금빵', evoName: '소금빵 암살자', rarity: 2,
    desc: '겉바속촉의 대명사. 짭짤한 단검이 적의 갑옷을 녹여버린다.',
    evoDesc: '복면을 두른 그림자. 소금 한 꼬집이면 어떤 방패도 무용지물.',
    hp: 170, atk: 16, def: 9, cost: 7, spd: 24, aspd: 1.0, range: 12, cd: 7, hw: 8,
    shred: 0.5, trait: '방어 파괴: 4초간 적 방어력 50% 감소',
  },
  sausage: {
    name: '소시지빵', evoName: '핫도그 보안관', rarity: 2,
    desc: '머스터드 병을 꾹 짜서 멀리 쏜다. 맞으면 한참 동안 따갑다.',
    evoDesc: '카우보이 모자를 쓴 서부의 보안관. 머스터드가 더 맵다.',
    hp: 110, atk: 12, def: 5, cost: 8, spd: 19, aspd: 0.8, range: 70, cd: 8, hw: 8,
    proj: 'mustard', dot: 0.6, trait: '머스터드: 4초간 지속 피해',
  },
  waffle: {
    name: '와플', evoName: '벨기에 와플 수호자', rarity: 2,
    desc: '격자무늬 방패를 든 든든한 호위병. 곁에 있는 아군까지 지켜준다.',
    evoDesc: '생크림과 딸기를 얹은 수호자. 격자 방패가 황금빛으로 빛난다.',
    hp: 260, atk: 10, def: 14, cost: 9, spd: 16, aspd: 0.7, range: 12, cd: 11, hw: 8,
    aura: 0.25, evoUp: { aura: 0.33 }, trait: '격자 방패: 주변 아군이 받는 피해 25% 감소',
  },
  croffle: {
    name: '크로플', evoName: '크로플 프레스 마스터', rarity: 2,
    desc: '와플 기계에 눌려 태어난 크루아상. 적도 똑같이 꾹 눌러버린다.',
    evoDesc: '아이스크림을 얹은 달인. 누르는 힘이 한층 강해졌다.',
    hp: 150, atk: 20, def: 7, cost: 8, spd: 24, aspd: 0.9, range: 12, cd: 8, hw: 7,
    stun: 0.25, stunT: 0.9, evoUp: { stun: 0.35 }, trait: '눌러 굽기: 25% 확률로 적 기절',
  },
  pizza: {
    name: '피자빵', evoName: '콤비네이션 피자빵', rarity: 2,
    desc: '페퍼로니를 표창처럼 날린다. 한 번에 세 명까지 맞힌다.',
    evoDesc: '토핑을 가득 올린 주방장. 한 번에 네 명까지 노린다.',
    hp: 120, atk: 13, def: 5, cost: 9, spd: 18, aspd: 0.75, range: 75, cd: 9, hw: 8,
    proj: 'pep', targets: 3, evoUp: { targets: 4 }, trait: '페퍼로니 표창: 최대 3명 동시 공격',
  },
  eggtart: {
    name: '에그타르트', evoName: '에그타르트 포수', rarity: 2,
    desc: '탱글탱글한 노른자 폭탄을 던진다. 맞은 적은 뒤로 튕겨난다.',
    evoDesc: '야구 모자를 눌러쓴 강견의 포수. 노른자가 더 무겁다.',
    hp: 130, atk: 22, def: 8, cost: 8, spd: 18, aspd: 0.55, range: 85, cd: 9, hw: 8,
    proj: 'egg', kb: 0.9, trait: '노른자 폭탄: 맞은 적을 밀쳐냄',
  },
  curry: {
    name: '카레빵', evoName: '불꽃 카레 장군', rarity: 3,
    desc: '뜨거운 카레를 품은 열혈 전사. 불꽃 펀치는 주변까지 태운다.',
    evoDesc: '머리 위에 불꽃 왕관이 타오른다. 매운맛 레벨 MAX.',
    hp: 200, atk: 42, def: 10, cost: 14, spd: 20, aspd: 0.6, range: 28, cd: 16, hw: 8,
    splash: 26, dot: 0.3, trait: '화염 범위 공격 + 화상',
  },
  pancake: {
    name: '팬케이크 타워', evoName: '팬케이크 거신', rarity: 3,
    desc: '겹겹이 쌓인 팬케이크 거인. 시럽처럼 끈질기게 버틴다.',
    evoDesc: '딸기와 생크림으로 장식된 거신. 한 대 맞으면 저 멀리 날아간다.',
    hp: 1100, atk: 18, def: 30, cost: 16, spd: 10, aspd: 0.5, range: 12, cd: 25, hw: 11, big: true,
    kb: 0.35, trait: '거대 탱커: 공격 시 35% 확률로 밀쳐냄',
  },
  garlic: {
    name: '마늘빵', evoName: '마늘 성기사', rarity: 3,
    desc: '외계인이 가장 싫어하는 냄새! 마늘 투구를 쓴 검사.',
    evoDesc: '성스러운 마늘의 가호를 받은 성기사. 일격 필살.',
    hp: 180, atk: 56, def: 10, cost: 15, spd: 24, aspd: 0.8, range: 14, cd: 15, hw: 8,
    crit: 0.3, trait: '치명타: 30% 확률로 2.5배 피해',
  },
  brioche: {
    name: '브리오슈 킹', evoName: '브리오슈 대제', rarity: 3,
    desc: '빵의 왕국을 다스리는 왕. 황금 홀을 휘두르면 적들이 날아간다.',
    evoDesc: '전설의 대제. 보라색 망토와 보석 왕관이 위엄을 더한다.',
    hp: 600, atk: 48, def: 18, cost: 22, spd: 16, aspd: 0.5, range: 30, cd: 30, hw: 11, big: true,
    splash: 30, kb: 0.5, trait: '왕의 일격: 범위 공격 + 50% 밀쳐냄',
  },
  stollen: {
    name: '슈톨렌', evoName: '크리스마스 슈톨렌 현자', rarity: 3,
    desc: '슈가파우더를 눈보라처럼 뿌리는 겨울의 현자. 적을 꽁꽁 얼린다.',
    evoDesc: '산타 모자를 쓴 대현자. 한여름에도 눈보라를 부른다.',
    hp: 240, atk: 30, def: 12, cost: 15, spd: 16, aspd: 0.45, range: 70, cd: 18, hw: 8,
    proj: 'snow', splash: 28, stun: 1, stunT: 1.2, trait: '눈보라: 범위 내 적을 1.2초 빙결',
  },
  panettone: {
    name: '파네토네', evoName: '파네토네 대포탑', rarity: 3,
    desc: '키 큰 축제의 빵. 머리에 얹은 대포로 전장 끝까지 포격한다.',
    evoDesc: '황금 포장지를 두른 이동 포탑. 쌍포가 불을 뿜는다.',
    hp: 260, atk: 70, def: 10, cost: 18, spd: 12, aspd: 0.33, range: 140, cd: 22, hw: 10, big: true,
    proj: 'shell', splash: 30, trait: '초장거리 포격: 범위 폭발',
  },
  frenchtoast: {
    name: '프렌치토스트', evoName: '시럽 프렌치토스트 광전사', rarity: 3,
    desc: '달걀물에 적셔 구운 광전사. 다칠수록 미친 듯이 빨라진다.',
    evoDesc: '베리와 시럽을 뒤집어쓴 광전사. 도끼가 황금빛으로 번뜩인다.',
    hp: 380, atk: 34, def: 12, cost: 14, spd: 26, aspd: 1.0, range: 14, cd: 15, hw: 7,
    lifesteal: 0.3, rage: 0.9, trait: '광전사: 체력이 낮을수록 공격이 빨라지고, 피해의 30% 흡수',
  },

  // ───────── 로봇 빵 (특별 뽑기 시즌 1: 메카 베이커리) ─────────
  toaster: {
    name: '토스터 T-1', evoName: '토스터 T-MAX', rarity: 2, group: 'robot',
    desc: '식빵을 쉴 새 없이 발사하는 속사형 로봇. "띵!" 소리와 함께 출격.',
    evoDesc: '황금 도금 완료. 굽기 단계 최대, 발사 속도 최대.',
    hp: 150, atk: 11, def: 10, cost: 8, spd: 18, aspd: 1.4, range: 78, cd: 8, hw: 8,
    proj: 'toast', trait: '속사: 토스트 연속 발사',
  },
  gearbagel: {
    name: '기어 베이글', evoName: '하이퍼 기어 베이글', rarity: 2, group: 'robot',
    desc: '톱니바퀴를 두른 베이글. 굴러가며 주변의 적을 한꺼번에 갈아버린다.',
    evoDesc: '황금 톱니와 붉은 코어. 회전수가 측정 불가다.',
    hp: 190, atk: 15, def: 12, cost: 8, spd: 34, aspd: 1.5, range: 10, cd: 8, hw: 8,
    splash: 14, anim: 'roll', trait: '회전 톱날: 주변 적을 함께 공격',
  },
  whipdrone: {
    name: '휘핑 드론', evoName: '휘핑 드론 Mk.II', rarity: 2, group: 'robot',
    desc: '하늘에서 생크림을 뿌려 아군을 치료하는 구급 드론.',
    evoDesc: '황금 프로펠러 장착. 크림 탱크 용량이 두 배.',
    hp: 110, atk: 8, def: 6, cost: 9, spd: 22, aspd: 0.6, range: 60, cd: 12, hw: 7,
    proj: 'cream', heal: 2.4, fly: true, trait: '공중 치유: 주변 아군 회복 (비행)',
  },
  guardian: {
    name: '가디언 식빵', evoName: '가디언 식빵 Mk.II', rarity: 2, group: 'robot',
    desc: '강철 크러스트를 두른 수호 로봇. 에너지 실드가 피해를 대신 받는다.',
    evoDesc: '황금 장갑으로 개수된 2호기. 실드 출력이 대폭 상승했다.',
    hp: 360, atk: 12, def: 20, cost: 10, spd: 14, aspd: 0.7, range: 12, cd: 13, hw: 8,
    shield: 0.5, evoUp: { shield: 0.7 }, trait: '에너지 실드: 체력의 50% 보호막, 4초 후 재충전',
  },
  laserbaguette: {
    name: '레이저 바게트', evoName: '레이저 바게트 X', rarity: 3, group: 'robot',
    desc: '바게트 속에 레이저 포를 숨겼다. 광선은 사거리 안의 모든 적을 꿰뚫는다.',
    evoDesc: '쌍열 레이저포로 개조된 X형. 광선이 붉게 타오른다.',
    hp: 200, atk: 40, def: 10, cost: 16, spd: 16, aspd: 0.5, range: 110, cd: 17, hw: 6,
    beam: true, trait: '관통 레이저: 사거리 내 모든 적 관통',
  },
  jetcroissant: {
    name: '제트 크루아상', evoName: '제트 크루아상 팰컨', rarity: 3, group: 'robot',
    desc: '제트 엔진을 단 크루아상 전투기. 유도 미사일로 적진을 폭격한다.',
    evoDesc: '미사일 두 발을 장착한 에이스 기체. 소닉붐과 함께 날아간다.',
    hp: 170, atk: 38, def: 8, cost: 14, spd: 44, aspd: 0.6, range: 90, cd: 14, hw: 8,
    proj: 'missile', splash: 26, fly: true, trait: '유도 미사일: 범위 폭발 (비행)',
  },
  teslapretzel: {
    name: '테슬라 프레첼', evoName: '테슬라 프레첼 코일', rarity: 3, group: 'robot',
    desc: '구리 코일로 꼬아 만든 프레첼. 번개가 적에서 적으로 튀어 다닌다.',
    evoDesc: '보랏빛 고압 전류. 번개가 여섯 번까지 전이된다.',
    hp: 230, atk: 30, def: 12, cost: 15, spd: 20, aspd: 0.8, range: 60, cd: 16, hw: 8,
    chain: 4, stun: 0.2, stunT: 0.5, evoUp: { chain: 6 }, trait: '연쇄 번개: 최대 4명에게 전이',
  },
  oventron: {
    name: '오븐트론', evoName: '오븐트론 오메가', rarity: 3, group: 'robot',
    desc: '마법 오븐을 본떠 만든 거대 메카. 화염 방사기로 전방을 불태운다.',
    evoDesc: '푸른 불꽃의 최종 병기. 쌍굴뚝에서 증기가 솟구친다.',
    hp: 950, atk: 24, def: 26, cost: 22, spd: 11, aspd: 1.6, range: 34, cd: 28, hw: 12, big: true,
    splash: 22, dot: 0.5, flame: true, trait: '화염 방사: 범위 공격 + 지속 화상',
  },
};
Object.keys(BW.BREADS).forEach((id) => { BW.BREADS[id].group = BW.BREADS[id].group || 'normal'; });
BW.BREAD_ORDER = Object.keys(BW.BREADS);
BW.RARITY_NAME = { 1: '일반', 2: '희귀', 3: '전설' };
BW.GROUP_NAME = { normal: '일반 빵', robot: '로봇 빵' };

// ───── 속성 ─────
// 외계인 속성: 불(강한 공격) / 바람(밀쳐내기) / 어둠(지속 피해) / 얼음(빙결)
// 빵 상성: res = 그 속성에 저항 (피해 감소 + 상태 이상 면역), bane = 그 속성에 특효 (피해 +75%)
BW.EL = {
  f: { name: '불', col: '#ff5a2a', enemy: '공격력이 매우 강해요.', res: '불 속성에게 받는 피해 60% 감소', bane: '불 속성에게 주는 피해 +75%' },
  w: { name: '바람', col: '#2fc890', enemy: '공격할 때마다 빵을 멀리 밀쳐내고 발이 빨라요.', res: '밀쳐내기 면역 · 바람 속성 피해 40% 감소', bane: '바람 속성에게 주는 피해 +75%' },
  d: { name: '어둠', col: '#a05ae0', enemy: '공격에 맞으면 저주에 걸려 계속 피해를 입어요.', res: '지속 피해 면역 · 어둠 속성 피해 40% 감소', bane: '어둠 속성에게 주는 피해 +75%' },
  i: { name: '얼음', col: '#3aa8f0', enemy: '공격에 맞으면 일정 확률로 꽁꽁 얼어붙어요.', res: '빙결·기절·감속 면역 · 얼음 속성 피해 40% 감소', bane: '얼음 속성에게 주는 피해 +75%' },
};
BW.EL_ORDER = ['f', 'w', 'd', 'i'];
// [저항, 특효]
const AFF = {
  baguette: ['', 'w'], danpat: ['w', ''], donut: ['i', ''], rolls: ['', 'd'], bungeo: ['', 'f'], kkwabaegi: ['d', ''], jjinppang: ['f', 'i'],
  muffin: ['', 'f'], melonpan: ['w', ''], bagel: ['', 'w'], soboro: ['', 'i'], cinnamon: ['', 'd'], pretzel: ['d', ''], creampuff: ['d', ''],
  saltbread: ['', 'i'], sausage: ['i', ''], waffle: ['w', ''], croffle: ['i', ''], pizza: ['f', 'i'], eggtart: ['', 'f'],
  curry: ['f', 'i'], pancake: ['w', ''], garlic: ['d', 'd'], brioche: ['w', ''], stollen: ['i', 'f'], panettone: ['', 'w'], frenchtoast: ['i', ''],
  toaster: ['f', 'i'], gearbagel: ['i', ''], whipdrone: ['d', ''], guardian: ['w', ''], laserbaguette: ['', 'd'], jetcroissant: ['', 'w'], teslapretzel: ['', 'd'], oventron: ['f', 'i'],
};
BW.BREAD_ORDER.forEach((id) => { const a = AFF[id] || ['', '']; BW.BREADS[id].res = a[0]; BW.BREADS[id].bane = a[1]; });
BW.BREADS.creampuff.cleanse = true; BW.BREADS.whipdrone.cleanse = true;
BW.BREADS.creampuff.trait = '치유: 공격할 때마다 주변 아군 회복 + 저주·빙결 정화';
BW.BREADS.whipdrone.trait = '공중 치유: 주변 아군 회복 + 저주·빙결 정화 (비행)';
// 스테이지 속성과 상성이 맞는지
BW.matchEls = (id, els) => { const b = BW.BREADS[id]; return els.filter((el) => b.res.includes(el) || b.bane.includes(el)); };

BW.MAX_LV = 20;
BW.EVO_LV = 10;

// 레벨별 스탯 계산
BW.breadStats = (id, lv) => {
  const b = BW.BREADS[id];
  const evo = lv >= BW.EVO_LV;
  const m = 1 + 0.1 * (lv - 1) + (evo ? 0.2 : 0);
  const md = 1 + 0.08 * (lv - 1) + (evo ? 0.2 : 0);
  return {
    hp: Math.round(b.hp * m),
    atk: Math.round(b.atk * m),
    def: Math.round(b.def * md),
    cost: b.cost,
    spd: Math.round(b.spd * (1 + 0.012 * (lv - 1)) * 10) / 10,
    aspd: Math.round(b.aspd * (1 + 0.015 * (lv - 1)) * 100) / 100,
    range: Math.round(b.range * (1 + 0.008 * (lv - 1)) + (evo && (b.proj || b.beam) ? 6 : 0)),
    cd: Math.round(b.cd * (1 - 0.012 * (lv - 1)) * 10) / 10,
    evo,
  };
};

BW.enhanceCost = (id, lv) => {
  const r = BW.BREADS[id].rarity;
  return Math.round((60 + 40 * (lv - 1)) * [0, 1, 1.5, 2.2][r] / 10) * 10;
};

BW.STAT_LABEL = [
  ['atk', '공격력'], ['def', '방어력'], ['hp', '체력'], ['cost', '코스트'],
  ['spd', '이동 속도'], ['aspd', '공격 속도'], ['range', '사거리'], ['cd', '대기 시간'],
];

// ───── 뽑기 ─────
BW.GACHA = {
  standard: {
    name: '황금 오븐 굽기', tab: '상시 뽑기', group: 'normal', price: 100, price10: 900,
    rates: [[3, 0.08], [2, 0.30], [1, 0.62]], rateText: [['3', '전설 8%'], ['2', '희귀 30%'], ['1', '일반 62%']],
    desc: '전설의 황금 오븐에 밀가루를 넣으면 랜덤한 빵 레시피가 구워져요!',
    note: '10회 굽기는 ★★ 이상 1개 확정!',
  },
  special: {
    name: '시즌 1 · 메카 베이커리', tab: '특별 뽑기', group: 'robot', price: 150, price10: 1350, pity: 30,
    rates: [[3, 0.15], [2, 0.85]], rateText: [['3', '전설 로봇 15%'], ['2', '희귀 로봇 85%']],
    desc: '외계 로봇의 부품으로 만든 <b>로봇 빵</b>을 조립해요! 이곳에서만 만날 수 있는 한정 레시피.',
    note: '30회 안에 전설 로봇 1개 확정!',
  },
};

// ───── 외계인 ─────
BW.ENEMIES = {
  gloop: { name: '젤리 외계인', hp: 60, atk: 8, def: 0, spd: 20, aspd: 1.0, range: 10, hw: 7, bounty: 1, anim: 'ooze' },
  grey: { name: '꼬마 그레이', hp: 85, atk: 10, def: 4, spd: 22, aspd: 0.9, range: 42, hw: 6, bounty: 2, proj: 'laser' },
  zipbug: { name: '쌩쌩 벌레', hp: 45, atk: 9, def: 0, spd: 50, aspd: 1.5, range: 8, hw: 7, bounty: 1 },
  squid: { name: '촉수 문어', hp: 260, atk: 14, def: 8, spd: 14, aspd: 0.8, range: 20, hw: 8, bounty: 3 },
  drone: { name: '레이저 드론', hp: 110, atk: 15, def: 4, spd: 20, aspd: 0.7, range: 86, hw: 6, bounty: 3, proj: 'laser', fly: true },
  brute: { name: '바위 거인', hp: 720, atk: 34, def: 14, spd: 10, aspd: 0.5, range: 16, hw: 11, bounty: 7, kb: 0.4, big: true },
  spitter: { name: '산성 두꺼비', hp: 160, atk: 16, def: 5, spd: 16, aspd: 0.6, range: 70, hw: 8, bounty: 4, proj: 'acid', splash: 16 },
  shieldbot: { name: '실드 로봇', hp: 400, atk: 17, def: 34, spd: 14, aspd: 0.7, range: 12, hw: 8, bounty: 5 },
  // 시리즈 2
  crab: { name: '집게 게', hp: 300, atk: 15, def: 24, spd: 17, aspd: 0.7, range: 10, hw: 9, bounty: 4, kb: 0.25 },
  jelly: { name: '전기 해파리', hp: 120, atk: 11, def: 2, spd: 18, aspd: 0.8, range: 26, hw: 7, bounty: 3, splash: 16, fly: true, shock: true },
  boomer: { name: '폭탄 벌레', hp: 65, atk: 46, def: 0, spd: 42, aspd: 1.5, range: 6, hw: 7, bounty: 2, suicide: true, splash: 26 },
  medic: { name: '치료 외계인', hp: 120, atk: 5, def: 3, spd: 16, aspd: 0.5, range: 50, hw: 6, bounty: 4, proj: 'goo', heal: 4 },
  frost: { name: '얼음 정령', hp: 150, atk: 12, def: 6, spd: 16, aspd: 0.6, range: 72, hw: 7, bounty: 4, proj: 'ice', slow: 0.4, fly: true, low: true },
  yeti: { name: '설인 외계인', hp: 880, atk: 38, def: 16, spd: 12, aspd: 0.5, range: 16, hw: 11, bounty: 8, kb: 0.45, big: true },
  // 시리즈 3
  saucer: { name: '폭격 UFO', hp: 200, atk: 24, def: 8, spd: 22, aspd: 0.45, range: 36, hw: 9, bounty: 5, proj: 'bomb', splash: 22, fly: true },
  cyborg: { name: '사이보그 그레이', hp: 220, atk: 11, def: 14, spd: 20, aspd: 1.6, range: 60, hw: 7, bounty: 5, proj: 'laser' },
  tank: { name: '공성 전차', hp: 760, atk: 52, def: 28, spd: 8, aspd: 0.3, range: 150, hw: 13, bounty: 10, proj: 'shell', splash: 24, big: true, anim: 'drive' },
  splitter: { name: '분열 젤리', hp: 280, atk: 14, def: 4, spd: 16, aspd: 0.9, range: 10, hw: 9, bounty: 3, split: ['gloop', 2], anim: 'ooze' },
  knight: { name: '암흑 기사', hp: 500, atk: 34, def: 20, spd: 30, aspd: 0.9, range: 14, hw: 8, bounty: 7, crit: 0.2 },
  // 보스 (home = 등장 스테이지)
  zorg: { name: '사령관 조르그', hp: 3200, atk: 45, def: 20, spd: 8, aspd: 0.45, range: 40, hw: 14, bounty: 20, splash: 34, kb: 0.6, boss: true, proj: 'plasma', home: 9 },
  queen: { name: '여왕 크바르', hp: 7000, atk: 55, def: 24, spd: 7, aspd: 0.4, range: 56, hw: 17, bounty: 40, splash: 36, kb: 0.7, boss: true, proj: 'plasma', home: 19, summon: { e: 'gloop', n: 2, every: 14 } },
  kraken: { name: '심해의 크라켄', hp: 9500, atk: 78, def: 30, spd: 7, aspd: 0.45, range: 44, hw: 18, bounty: 50, splash: 40, kb: 0.6, boss: true, home: 29, summon: { e: 'squid', n: 2, every: 15 } },
  magma: { name: '마그마 킹', hp: 15000, atk: 100, def: 40, spd: 7, aspd: 0.4, range: 48, hw: 18, bounty: 60, splash: 40, kb: 0.6, dot: 0.3, boss: true, home: 39, summon: { e: 'boomer', n: 3, every: 13 } },
  mechazorg: { name: '메카 조르그', hp: 21000, atk: 120, def: 55, spd: 7, aspd: 0.45, range: 90, hw: 17, bounty: 70, splash: 32, boss: true, proj: 'missile', home: 49, summon: { e: 'drone', n: 3, every: 13 } },
  emperor: { name: '글룹 대제', hp: 34000, atk: 150, def: 60, spd: 6, aspd: 0.4, range: 60, hw: 21, bounty: 99, splash: 46, kb: 0.7, boss: true, home: 59, summon: { e: 'knight', n: 1, every: 16 }, anim: 'ooze' },
};

BW.enemyStats = (id, g) => {
  const e = BW.ENEMIES[id];
  const k = e.boss ? Math.max(0, g - e.home) : g;
  return {
    hp: Math.round(e.hp * (1 + 0.045 * k)), atk: Math.round(e.atk * (1 + 0.032 * k)),
    def: Math.round(e.def * (1 + 0.02 * k)), spd: e.spd, aspd: e.aspd, range: e.range,
  };
};

// ───── 시리즈 & 스테이지 ─────
// 웨이브 표기: "적@첫등장초/간격초" (무한 반복), "적@초*횟수" (정해진 횟수)
// 트리거 표기: "체력%:적*수" (적 기지 체력이 해당 비율 이하가 되면 증원)
BW.SERIES = [
  { name: '시리즈 1 · 밀가루 대륙 방어전', short: '밀가루 대륙', map: { sea: '#3f86c8', wave: '#78b8ea', land: '#c9b07a', edge: '#f2e2b0' } },
  { name: '시리즈 2 · 설탕 바다 원정', short: '설탕 바다', map: { sea: '#2a6aa8', wave: '#9ad0f0', land: '#dfe8f0', edge: '#ffffff' } },
  { name: '시리즈 3 · 은하 대결전', short: '은하계', map: { sea: '#0a0820', wave: '#c8c0ff', land: '#4a3e6a', edge: '#8a7ac0', space: true } },
];
// 종족 기본 속성
[['frost','i'],['yeti','i'],['boomer','f'],['knight','d'],['queen','d'],['kraken','i'],['magma','f'],['mechazorg','w'],['emperor','d']].forEach(([id, el]) => { BW.ENEMIES[id].el = el; });
BW.enemyName = (id, el) => (el && BW.ENEMIES[id].el !== el ? BW.EL[el].name + ' ' : '') + BW.ENEMIES[id].name;
const ST = [
  // ── 시리즈 1 ── (속성 표기: 적.f 불 / .w 바람 / .d 어둠 / .i 얼음)
  ['오븐 앞마당', 'field', 900, 'gloop@3/7', '', { desc: '외계인 척후병이 마을 오븐 앞까지 왔다! 첫 출격이다.' }],
  ['밀밭 초입', 'field', 1100, 'gloop@2/6 zipbug@14/13', '', { recipe: 'baguette', desc: '황금빛 밀밭을 짓밟는 외계인들. 빠른 벌레를 조심하라.' }],
  ['풍차 언덕', 'field', 1300, 'gloop@2/5.5 grey@10/13 zipbug@22/15', '', { desc: '광선총을 든 그레이가 나타났다. 멀리서 쏘는 적이다.' }],
  ['버터 강가', 'river', 1500, 'gloop@2/5 grey@12/12 squid@25/24', '', { recipe: 'danpat', desc: '물컹한 촉수 문어가 강을 건너온다. 단단한 빵이 필요하다.' }],
  ['치즈 마을', 'river', 1700, 'zipbug@3/6 gloop@6/6 squid@30/28', '50%:zipbug*6', { desc: '쌩쌩 벌레 떼의 기습! 기지가 흔들리면 증원이 몰려온다.' }],
  ['잼 숲', 'forest', 1900, 'gloop@2/5 gloop.f@10/14 grey@8/10 drone@20/22', '', { recipe: 'bungeo', desc: '붉게 달아오른 불 속성 외계인이 처음 나타났다! 한 방이 매섭다.' }],
  ['설탕 협곡', 'forest', 2100, 'gloop@2/5 squid@10/16 zipbug.f@14/16 drone@24/20', '60%:squid*2', { desc: '좁은 협곡을 가득 메운 촉수 문어 부대와 불 벌레.' }],
  ['초코 늪', 'swamp', 1900, 'gloop.f@2/6 grey@8/10 spitter@16/30', '', { recipe: 'muffin', desc: '산성 침을 뱉는 두꺼비가 늪에 숨어 있다.' }],
  ['크림 언덕 요새', 'swamp', 2600, 'gloop@2/5 drone@12/18 grey.f@14/18 shieldbot@18/28', '50%:shieldbot*2', { desc: '단단한 실드 로봇이 전선을 지킨다. 방어력이 매우 높다.' }],
  ['외계 전초기지', 'alien', 4000, 'gloop@2/4.5 grey.f@8/12 squid@20/24 zorg@35*1', '70%:brute*1 35%:squid*3', { boss: 'zorg', recipe: 'melonpan', desc: '【보스】 외계 사령관 조르그가 직접 나섰다!' }],
  ['부서진 빵집 거리', 'ruins', 3000, 'zipbug.w@2/7 grey@6/9 brute@28/45', '', { recipe: 'rolls', desc: '바람 속성 외계인 등장! 맞으면 저 멀리 날아간다. 묵직한 빵으로 버티자.' }],
  ['어두운 터널', 'ruins', 2700, 'gloop@2/4 spitter@10/22 gloop.w@12/14 shieldbot@25/34', '', { desc: '산성 두꺼비와 실드 로봇의 합동 작전.' }],
  ['외계 광산', 'desert', 3400, 'zipbug.f@2/8 drone@6/11 squid.w@14/18', '', { recipe: 'cinnamon', desc: '외계인들이 밀가루를 캐내는 광산. 불과 바람이 뒤섞였다.' }],
  ['산성 호수', 'swamp', 3200, 'gloop.f@2/5 spitter@8/20 brute@55/55', '', { desc: '호수 전체가 산성으로 끓는다. 거인이 뒤에서 버틴다.' }],
  ['UFO 착륙장', 'alien', 3900, 'gloop@2/4 grey.w@5/10 drone@12/15 squid@20/20', '50%:brute.f*2', { recipe: 'kkwabaegi', desc: '수많은 UFO가 착륙하는 곳. 기지를 위협하면 불 거인이 깨어난다.' }],
  ['강철 사막', 'desert', 4200, 'zipbug@2/6 gloop.d@8/9 shieldbot@10/20 drone@14/14 brute@40/42', '', { recipe: 'soboro', desc: '어둠 속성 외계인 등장! 맞으면 저주에 걸려 계속 피해를 입는다.' }],
  ['촉수 숲', 'alien', 4000, 'zipbug.w@2/7 squid.d@3/12 spitter@12/18', '', { desc: '외계 식물이 뒤덮은 숲. 저주받은 촉수가 사방에서 뻗어 나온다.' }],
  ['모선의 그림자', 'night', 4800, 'grey.d@2/8 drone@6/10 shieldbot@15/24 brute.f@30/34', '', { desc: '하늘을 가린 모선의 그림자 아래, 정예 부대가 기다린다.' }],
  ['최후의 방어선', 'night', 4800, 'gloop.f@1/4 zipbug.w@4/7 spitter.d@10/15 squid@14/15 shieldbot@25/26', '60%:brute*1 30%:brute*2', { desc: '외계 제국 최후의 방어선. 모든 속성이 쏟아진다!' }],
  ['모선 핵심부', 'mother', 7000, 'gloop.d@1/4.5 grey@4/8 drone@10/13 squid.d@16/18 queen@40*1', '60%:zorg*1 30%:brute.f*2', { boss: 'queen', recipe: 'curry', desc: '【보스】 어둠의 여왕 크바르와의 결전!' }],
  // ── 시리즈 2 ──
  ['모래사장 상륙', 'beach', 5000, 'gloop@2/4 zipbug.w@8/8 crab@12/18', '', { recipe: 'jjinppang', desc: '설탕 바다 건너편에 상륙! 단단한 집게 게가 해변을 지킨다.' }],
  ['야자수 해변', 'beach', 5300, 'crab@4/13 grey.f@6/9 jelly@18/20', '', { desc: '하늘하늘 떠다니는 전기 해파리. 주변을 한꺼번에 감전시킨다.' }],
  ['산호초 얕은 바다', 'beach', 5600, 'gloop.d@2/5 jelly@4/11 squid@12/14', '50%:crab*2', { desc: '산호 사이로 촉수와 해파리가 뒤엉켜 몰려온다.' }],
  ['폭탄 벌레 둥지', 'beach', 5800, 'gloop@2/4 boomer@6/10 crab.f@14/18', '50%:boomer*4', { recipe: 'saltbread', desc: '폭탄 벌레는 닿는 순간 터진다! 값싼 빵으로 받아내자.' }],
  ['난파선 해안', 'night', 6100, 'grey.d@2/7 crab@8/13 medic@14/22 drone.w@16/15', '', { desc: '치료 외계인이 적들을 회복시킨다. 먼저 쓰러뜨려야 한다.' }],
  ['눈 내리는 항구', 'ice', 6400, 'gloop.i@2/5 frost@8/16 crab@10/14', '', { recipe: 'donut', desc: '얼음 속성 외계인 등장! 맞으면 꽁꽁 얼어 움직일 수 없다.' }],
  ['얼음 호수', 'ice', 6700, 'zipbug.i@2/6 frost@6/13 jelly.w@10/13', '50%:crab.i*3', { desc: '꽁꽁 언 호수 위의 미끄러운 전투.' }],
  ['설인의 숲', 'ice', 7000, 'gloop.i@2/4 frost@12/15 medic@20/24 yeti@30/40', '', { recipe: 'sausage', desc: '눈 덮인 숲에서 거대한 설인 외계인이 나타났다!' }],
  ['수정 동굴 입구', 'cave', 7300, 'boomer@5/9 shieldbot.i@10/18 frost@14/15 medic.d@22/24', '', { desc: '빛나는 수정 동굴. 어둠 속에서 폭탄 벌레가 튀어나온다.' }],
  ['심해 동굴', 'cave', 9000, 'squid.i@2/10 jelly.w@6/11 crab@14/15 kraken@40*1', '65%:yeti*1 30%:squid.i*4', { boss: 'kraken', recipe: 'waffle', desc: '【보스】 동굴 깊은 곳, 얼음장 같은 심해의 크라켄이 눈을 떴다!' }],
  ['얼음 절벽', 'ice', 7800, 'frost@6/12 drone.w@8/10 crab.i@12/14 yeti@20/34', '', { desc: '깎아지른 절벽 위에서 설인들이 내려온다.' }],
  ['눈보라 고개', 'ice', 8100, 'zipbug.w@2/5 boomer@8/9 frost@10/12 medic@18/20', '50%:yeti*2', { recipe: 'croffle', desc: '앞이 보이지 않는 눈보라 속의 난전.' }],
  ['온천 마을', 'ice', 8400, 'gloop.i@1/3.5 spitter.d@8/12 crab@10/12 medic@16/20', '', { desc: '따뜻한 온천 마을을 점령한 외계인들을 몰아내자.' }],
  ['화산섬 기슭', 'volcano', 8700, 'grey.f@2/6 boomer@6/8 spitter.f@10/13 brute@20/30', '', { recipe: 'eggtart', desc: '불타는 화산섬에 도착했다. 불 속성 적이 가득하다.' }],
  ['용암 강', 'volcano', 9000, 'boomer@4/6 shieldbot.f@10/16 squid.d@12/16 yeti@40/45', '50%:boomer*6', { desc: '용암이 흐르는 강. 폭탄 벌레가 줄지어 달려든다.' }],
  ['불타는 숲', 'volcano', 8000, 'squid.f@4/9 spitter@8/11 medic.d@14/18 brute.f@30/32', '', { recipe: 'pizza', desc: '재가 흩날리는 숲. 치료 외계인이 뒤에서 버틴다.' }],
  ['흑요석 요새', 'volcano', 9600, 'shieldbot.d@4/12 crab.f@6/10 drone.w@10/10 medic@20/22 yeti@35/40', '', { desc: '검은 유리로 지어진 요새. 방어가 철통같다.' }],
  ['분화구 가장자리', 'volcano', 9900, 'boomer@3/5 jelly.f@6/9 frost@12/14 brute.w@20/26', '60%:yeti*1 30%:yeti*2', { desc: '분화구가 코앞이다. 발밑에서 열기가 올라온다.' }],
  ['용암 궁전 문 앞', 'volcano', 8600, 'gloop.f@1/3 crab.f@5/9 spitter.d@8/11 medic@14/16 shieldbot.w@18/18 yeti@40/38', '50%:brute.f*2', { desc: '마그마 킹의 궁전 문 앞. 정예 수비대가 총출동했다.' }],
  ['마그마 왕좌', 'volcano', 10500, 'boomer@4/7 spitter.f@8/12 crab.d@10/13 medic@20/22 magma@40*1', '60%:kraken*1 30%:yeti*2', { boss: 'magma', recipe: 'stollen', desc: '【보스】 불의 지배자 마그마 킹과의 결전!' }],
  // ── 시리즈 3 ──
  ['달 착륙', 'moon', 10500, 'gloop.w@2/3.5 zipbug.d@6/6 cyborg@10/14', '', { desc: '로켓 오븐을 타고 달에 도착! 기계 몸의 그레이가 기다린다.' }],
  ['고요의 바다', 'moon', 10900, 'cyborg.f@6/11 crab.i@8/12 saucer@16/20', '', { desc: '폭격 UFO가 하늘에서 폭탄을 떨어뜨린다.' }],
  ['크레이터 기지', 'moon', 11300, 'cyborg@6/12 splitter.d@8/14 drone.w@10/10', '', { recipe: 'frenchtoast', desc: '분열 젤리는 쓰러지면 둘로 갈라진다. 범위 공격이 좋다.' }],
  ['달의 뒷면', 'moon', 11700, 'gloop.i@1/3 saucer.f@10/16 knight@20/26', '50%:splitter*3', { desc: '어둠 속에서 암흑 기사가 돌진해 온다. 치명타를 조심!' }],
  ['궤도 정거장', 'station', 12100, 'cyborg.w@4/9 shieldbot.i@8/14 saucer@14/16 medic.d@20/20', '', { desc: '달 궤도의 외계 정거장에 침투했다.' }],
  ['화물 구역', 'station', 12500, 'cyborg.f@5/10 boomer@8/8 drone.d@10/10 tank@35/50', '', { desc: '공성 전차의 포격은 전장 끝까지 닿는다. 빨리 접근하자.' }],
  ['무중력 통로', 'station', 12900, 'jelly.w@4/8 saucer.i@8/13 medic@16/20 knight@18/22', '', { desc: '둥둥 떠다니는 적들 사이를 뚫고 나아가라.' }],
  ['소행성 벨트', 'asteroid', 13300, 'splitter.f@4/10 boomer@6/7 frost@12/14 tank.w@40/48', '50%:knight*2', { desc: '소행성 사이에 숨은 외계 함대의 전초 기지.' }],
  ['운석 채굴장', 'asteroid', 13700, 'cyborg.d@4/8 brute.i@10/20 saucer.f@12/14 medic@18/18 tank@45/50', '', { desc: '운석을 캐는 외계 기계들이 가득하다.' }],
  ['기계 요새', 'station', 17000, 'cyborg.w@3/9 drone.f@6/9 shieldbot.i@12/16 saucer@18/18 mechazorg@40*1', '65%:tank*1 30%:knight*3', { boss: 'mechazorg', desc: '【보스】 폭풍의 기계 몸으로 돌아온 메카 조르그!' }],
  ['글룹 모성 궤도', 'asteroid', 14500, 'saucer.w@4/10 cyborg.i@6/10 splitter.f@8/12 knight@12/18', '', { desc: '드디어 글룹 제국의 모성이 보인다.' }],
  ['외계 정글', 'jungle', 14900, 'squid.d@2/7 spitter.f@6/9 splitter@10/12 medic.i@16/18 yeti@30/34', '', { desc: '빛나는 식물로 가득한 외계 정글에 착륙했다.' }],
  ['발광 버섯 숲', 'jungle', 15300, 'jelly.w@3/7 boomer@6/7 frost@10/12 knight.f@14/18', '50%:tank*1', { desc: '거대한 버섯 사이로 불의 기사단이 순찰을 돈다.' }],
  ['촉수 늪지', 'jungle', 15700, 'squid.i@2/6 splitter.d@6/10 spitter.w@8/10 crab.f@10/11 knight@24/24', '', { desc: '발이 푹푹 빠지는 늪지. 촉수가 끝없이 솟아난다.' }],
  ['제국 수도 외곽', 'jungle', 16100, 'cyborg.f@3/7 saucer.d@8/11 shieldbot.w@10/14 medic.i@14/16 tank@30/40', '', { desc: '글룹 제국 수도의 성벽이 눈앞에 있다.' }],
  ['제국 수도', 'core', 16500, 'cyborg.d@3/7 knight@8/14 saucer.f@10/12 splitter.i@12/14 tank.w@40/44', '', { desc: '붉은 깃발이 나부끼는 제국의 심장부.' }],
  ['황실 근위대', 'core', 16900, 'knight.w@4/10 shieldbot.f@6/11 medic.d@12/14 saucer.i@14/14 yeti@25/28', '50%:knight*3', { desc: '황제를 지키는 최정예 근위 기사단.' }],
  ['무기 공장', 'core', 17300, 'cyborg.i@3/6 boomer@5/6 drone.w@8/8 tank.f@20/30 brute.d@24/26', '', { desc: '전차와 로봇을 찍어내는 공장. 부숴야 한다!' }],
  ['황제의 회랑', 'core', 17700, 'gloop.d@1/2.5 knight.f@6/11 saucer.w@8/11 splitter.i@10/12 medic@14/15 tank@35/38', '60%:zorg*1 30%:queen*1', { desc: '옥좌로 이어지는 긴 회랑. 옛 강적들이 다시 막아선다.' }],
  ['글룹 대제의 옥좌', 'core', 24000, 'cyborg.f@3/8 knight@6/14 saucer.i@10/13 splitter.w@12/14 medic.d@16/18 emperor@60*1', '70%:mechazorg*1 40%:tank.f*2 20%:knight*4', { boss: 'emperor', recipe: 'panettone', desc: '【최종 보스】 글룹 제국의 황제, 어둠의 글룹 대제와의 최후의 결전!' }],
];
// 자동 시뮬레이션으로 구한 [적 능력치 배율, 대공세 위력] (js/sim.js 의 BW.simTune2 결과)
const TUNE = [[3.15,4.6],[3.02,4.6],[1.34,3.4],[1.16,2.5],[1.43,2.2],[1.25,2.8],[0.89,3.1],[0.8,2.2],[0.89,2.8],[0.66,4],[1.3,2.8],[0.62,2.2],[0.93,2.8],[0.48,3.7],[0.66,4.6],[0.93,2.8],[0.71,2.5],[0.93,2.8],[0.57,3.1],[0.66,4.6],
  [1.43,2.2],[0.71,3.4],[0.8,2.8],[1.02,2.8],[1.21,2.2],[1.25,2.2],[0.75,4.3],[1.25,2.2],[0.93,2.5],[0.75,2.8],[1.16,2.5],[1.07,2.8],[0.75,2.5],[0.71,2.5],[0.89,2.8],[0.3,3.1],[0.57,2.5],[0.66,4.3],[0.35,3.1],[0.35,4.6],
  [0.98,2.2],[0.75,3.1],[1.3,2.8],[0.84,2.5],[0.39,4.6],[0.53,4.6],[0.8,2.2],[0.84,2.5],[0.75,3.4],[0.39,4.6],[0.62,2.5],[0.8,3.1],[0.85,2.2],[0.75,2.2],[0.3,4.6],[0.53,2.5],[0.3,2.2],[0.44,4.6],[0.62,2.6],[0.35,2.4]];
BW.STAGES = ST.map(([name, theme, base, w, tr, o], g) => {
  const waves = w.split(' ').map((s) => {
    const m = s.match(/^(\w+)(?:\.([fwdi]))?@([\d.]+)(?:\/([\d.]+))?(?:\*(\d+))?$/);
    return { e: m[1], el: m[2] || BW.ENEMIES[m[1]].el || null, t: +m[3], i: m[4] ? +m[4] : 0, n: m[5] ? +m[5] : (m[4] ? 0 : 1) };
  });
  const triggers = tr ? tr.split(' ').map((s) => { const m = s.match(/^(\d+)%:(\w+)(?:\.([fwdi]))?\*(\d+)$/); return { hp: +m[1] / 100, e: m[2], el: m[3] || BW.ENEMIES[m[2]].el || null, n: +m[4] }; }) : [];
  const series = Math.floor(g / 20), local = g % 20;
  const boss = o.boss || null;
  const pool = waves.filter((x) => !BW.ENEMIES[x.e].boss && !BW.ENEMIES[x.e].big).map((x) => ({ e: x.e, el: x.el }));
  const T = TUNE[g] || [1, 2.5];
  return {
    idx: g, series, local, name, theme, base, waves, triggers, boss, recipe: o.recipe || null, desc: o.desc,
    els: ['f', 'w', 'd', 'i'].filter((el) => [...waves, ...triggers].some((x) => x.el === el)),
    energy: Math.min(9, 2 + Math.floor(g / 8)),
    gold: 100 + 18 * g + (boss ? 150 + 5 * g : 0),
    flour: boss ? (local === 19 ? 400 : 250) + 100 * series : 60 + 3 * g,
    oven: Math.round(2400 * (1 + 0.035 * g)),
    diff: Math.round(BW.clamp(T[0] * 0.92, 0.55, g < 3 ? 1 : 1.35) * 100) / 100,
    // 대공세: 일정 시간마다 강화된 적이 한꺼번에 몰려옴
    rush: g >= 2 ? { first: 55, every: 50, n: Math.min(7, 3 + Math.floor(g / 10)), pool, pow: Math.round(BW.clamp(T[1] * 0.85, 1.6, g < 6 ? 2 : 3.2) * 10) / 10 } : null,
  };
});
BW.starsFor = (ratio) => (ratio >= 0.7 ? 3 : ratio >= 0.35 ? 2 : 1);

// ───── 스토리 ─────
// bg: 배경 테마, cast: [스프라이트, x, 배율]
const OV = ['oven', 420, 1];
BW.STORY = {
  intro: [
    { bg: 'river', cast: [OV, ['loaf', 300, 2], ['croissant', 250, 2]], text: '2026년 가을. 평화로운 빵의 마을 「버터필드」.' },
    { bg: 'night', cast: [['gloop', 160, 2], ['grey', 220, 2], ['squid', 100, 2]], text: '어느 날 하늘이 초록빛으로 갈라지더니… 외계 함대 「글룹 제국」이 지구를 침공했다!' },
    { bg: 'night', cast: [['gloop', 160, 2], ['grey', 220, 2], ['squid', 100, 2]], text: '외계인들의 목표는 지구의 모든 밀가루. 빵이 사라진 세상이라니, 상상만 해도 끔찍하다!' },
    { who: 'granny', bg: 'field', cast: [OV, ['granny', 300, 2.5], ['loaf', 360, 2], ['croissant', 250, 2]], text: '얘야, 겁먹지 말거라. 우리 집안엔 대대로 내려온 「마법 오븐」이 있단다.' },
    { who: 'granny', bg: 'field', cast: [OV, ['granny', 300, 2.5], ['loaf', 360, 2], ['croissant', 250, 2]], text: '이 오븐에서 구운 빵들은 살아 움직이며 싸울 수 있지. 레시피를 모아 더 강한 빵을 구워 보거라!' },
    { bg: 'field', cast: [OV, ['granny', 300, 2.5], ['loaf', 360, 2], ['croissant', 250, 2]], text: '지금, 지구를 지키기 위한 빵들의 전쟁이 시작된다!' },
  ],
  pre9: [
    { who: 'zorg', bg: 'alien', cast: [['zorg', 140, 2.2], ['loaf', 360, 2], ['baguette', 400, 2]], text: '크하하! 하찮은 밀가루 덩어리들이 감히 글룹 제국에 대항하다니!' },
    { who: 'granny', bg: 'alien', cast: [['zorg', 140, 2.2], ['loaf', 360, 2], ['baguette', 400, 2]], text: '우리 빵을 얕보면 큰코다칠 게다! 모두 출격!' },
  ],
  post9: [
    { who: 'zorg', bg: 'alien', cast: [['zorg', 140, 2.2], ['loaf', 360, 2]], text: '크윽… 이, 이럴 수가! 여왕님께 보고해야…!' },
    { who: 'granny', bg: 'field', cast: [OV, ['granny', 300, 2.5]], text: '잘했다! 하지만 저 녀석, 여왕이라고 했지? 더 큰 적이 있다는 뜻이구나.' },
  ],
  pre19: [
    { who: 'queen', bg: 'mother', cast: [['queen', 150, 2], ['brioche', 380, 2]], text: '나는 글룹 제국의 여왕 크바르. 이 별의 밀가루는 전부 내 것이다!' },
    { who: 'granny', bg: 'mother', cast: [['queen', 150, 2], ['brioche', 380, 2]], text: '오븐을 최대 화력으로! 시리즈 1의 마지막 전투다, 얘들아!' },
  ],
  post19: [
    { who: 'queen', bg: 'mother', cast: [['queen', 150, 2]], text: '이… 이 고소하고 달콤한 냄새는 대체 뭐지…? 후퇴! 전군 후퇴하라!' },
    { bg: 'river', cast: [OV, ['loaf', 300, 2], ['croissant', 250, 2]], text: '외계 모선이 물러가고, 버터필드에 다시 빵 굽는 냄새가 퍼졌다.' },
    { who: 'granny', bg: 'field', cast: [OV, ['granny', 300, 2.5]], text: '하지만 녀석들의 잔당이 설탕 바다 너머로 도망쳤다는구나. 쫓아가야겠다!' },
    { bg: 'beach', cast: [['bungeo', 260, 2], ['loaf', 320, 2]], text: '시리즈 1 완료! 새로운 지역 「시리즈 2 · 설탕 바다 원정」이 열렸습니다.' },
  ],
  pre20: [
    { bg: 'beach', cast: [OV, ['granny', 300, 2.5], ['bungeo', 240, 2]], text: '설탕 바다를 건너 도착한 미지의 해변. 파도 소리 사이로 딸깍딸깍 집게 소리가 들린다.' },
    { who: 'granny', bg: 'beach', cast: [OV, ['granny', 300, 2.5], ['crab', 120, 2]], text: '저 얼음 대륙과 화산섬 어딘가에 놈들의 새 기지가 있을 게다. 가자꾸나!' },
  ],
  pre29: [
    { who: 'kraken', bg: 'cave', cast: [['kraken', 140, 1.8], ['loaf', 370, 2]], text: '쿠르르르… 누가 감히 깊은 바다의 잠을 깨우는가…' },
    { who: 'granny', bg: 'cave', cast: [['kraken', 140, 1.8], ['loaf', 370, 2]], text: '세상에, 다리가 몇 개인 게냐! 잘 구워서 타코야끼로 만들어 주마!' },
  ],
  post29: [
    { who: 'kraken', bg: 'cave', cast: [['kraken', 140, 1.8]], text: '꾸르륵… 화산의… 왕께서… 가만두지 않으실… 것이다…' },
  ],
  pre39: [
    { who: 'magma', bg: 'volcano', cast: [['magma', 140, 1.8], ['stollen', 370, 2]], text: '이 몸은 마그마 킹! 네놈들을 바삭하게, 아니 새까맣게 태워주마!' },
    { who: 'granny', bg: 'volcano', cast: [['magma', 140, 1.8], ['stollen', 370, 2]], text: '빵은 불 조절이 생명이란다. 너는 불이 너무 세구나!' },
  ],
  post39: [
    { who: 'magma', bg: 'volcano', cast: [['magma', 140, 1.8]], text: '크아악… 식는다… 내 몸이 식어간다…! 황제 폐하… 만세…' },
    { who: 'granny', bg: 'beach', cast: [OV, ['granny', 300, 2.5]], text: '황제라… 놈들의 우두머리는 저 하늘 위, 우주에 있다는 말이구나.' },
    { bg: 'moon', cast: [['oventron', 240, 2], ['loaf', 320, 2]], text: '시리즈 2 완료! 로켓 오븐이 완성되었습니다. 「시리즈 3 · 은하 대결전」이 열렸습니다.' },
  ],
  pre40: [
    { bg: 'moon', cast: [OV, ['granny', 300, 2.5]], text: '3, 2, 1… 발사! 마법 오븐에 로켓을 달고 달에 착륙했다. 지구가 파랗게 빛난다.' },
    { who: 'granny', bg: 'moon', cast: [OV, ['granny', 300, 2.5], ['cyborg', 120, 2]], text: '우주에서도 빵은 잘 부푸는구나. 글룹 제국의 모성까지 단숨에 가자!' },
  ],
  pre49: [
    { who: 'mechazorg', bg: 'station', cast: [['mechazorg', 140, 1.8], ['guardian', 370, 2]], text: '삐빅— 오랜만이다, 밀가루 덩어리들. 나는 기계의 몸으로 다시 태어났다!' },
    { who: 'granny', bg: 'station', cast: [['mechazorg', 140, 1.8], ['guardian', 370, 2]], text: '조르그 네 이놈, 깡통이 되어 돌아왔구나! 이번엔 고철로 만들어 주마!' },
  ],
  post49: [
    { who: 'mechazorg', bg: 'station', cast: [['mechazorg', 140, 1.8]], text: '시스템… 오류… 폐하… 죄송… 합… 니… ㄷ……' },
  ],
  pre59: [
    { who: 'emperor', bg: 'core', cast: [['emperor', 150, 1.7], ['brioche', 380, 2]], text: '짐이 바로 글룹 대제다. 이 우주의 모든 밀가루는 짐의 저녁 식사가 될 것이니라!' },
    { who: 'granny', bg: 'core', cast: [['emperor', 150, 1.7], ['brioche', 380, 2]], text: '배가 고프면 말을 하지 그랬냐! 자, 얘들아. 마지막 한 판이다. 화력 최대!' },
  ],
  post59: [
    { who: 'emperor', bg: 'core', cast: [['emperor', 150, 1.7]], text: '크으윽… 짐이… 고작 빵 따위에게…! …그런데 이 냄새는… 한 입만… 먹어봐도 되겠느냐…?' },
    { who: 'granny', bg: 'core', cast: [['emperor', 150, 1.7], ['granny', 320, 2.5], ['loaf', 380, 2]], text: '진작 그렇게 말할 것이지. 자, 갓 구운 식빵이다. 버터도 듬뿍 발랐단다.' },
    { who: 'emperor', bg: 'core', cast: [['emperor', 150, 1.7], ['granny', 320, 2.5], ['loaf', 380, 2]], text: '마… 맛있다…! 이런 걸 빼앗으려 했다니, 짐이 어리석었도다. 제빵을 가르쳐 다오!' },
    { bg: 'river', cast: [OV, ['granny', 300, 2.5], ['gloop', 200, 2], ['loaf', 360, 2]], text: '그렇게 글룹 제국은 우주 최초의 외계 빵집이 되었고, 지구에는 평화가 찾아왔다.' },
    { bg: 'title', cast: [OV], text: '— 빵들의 전쟁 · 완 —  끝까지 플레이해 주셔서 감사합니다!' },
  ],
};
BW.NAMES = { granny: '밀라 할머니', zorg: '사령관 조르그', queen: '여왕 크바르', kraken: '심해의 크라켄', magma: '마그마 킹', mechazorg: '메카 조르그', emperor: '글룹 대제' };

BW.TIPS = [
  '빵 카드를 누르거나 숫자 키 1~7로 빵을 출격시킬 수 있어요.',
  '「화력 업」을 하면 코스트가 더 빨리, 더 많이 쌓여요.',
  '오븐 대포는 화면의 적을 한꺼번에 날려버려요. 위기 때 써 보세요!',
  '원거리 빵은 탱커 빵 뒤에 있을 때 가장 강해요.',
  '레벨 10이 되면 빵이 진화해서 외형과 능력치가 크게 변해요.',
  '같은 레시피를 다시 뽑으면 레벨이 1 올라가요.',
  '외계인을 쓰러뜨리면 코스트를 조금 얻을 수 있어요.',
  '실드 로봇과 집게 게는 방어력이 높아요. 소금빵으로 방어를 깎아 보세요.',
  '슈크림빵과 휘핑 드론은 공격할 때마다 주변 아군을 치료해요.',
  '에너지는 1분마다 1씩 회복돼요.',
  '「적의 대공세!」 경고가 뜨면 탱커를 미리 내보내세요.',
  '폭탄 벌레는 닿으면 터져요. 모닝빵 같은 값싼 빵으로 받아내면 좋아요.',
  '오븐 체력을 많이 남기고 이기면 별을 더 많이 받아요. 별마다 밀가루 보너스!',
  '특별 뽑기의 로봇 빵은 그곳에서만 얻을 수 있어요.',
  '치료 외계인은 뒤에 숨어 있어요. 원거리 빵이나 관통 공격으로 노려 보세요.',
  '도전 과제를 달성하면 밀가루와 골드를 받을 수 있어요.',
  '불 외계인은 공격력이 강해요. 불 저항 빵(찐빵, 피자빵, 카레빵)을 앞세우세요.',
  '바람 외계인은 빵을 날려버려요. 단팥빵·메론빵처럼 묵직한 빵은 밀려나지 않아요.',
  '어둠 외계인의 저주는 슈크림빵이 정화해 줘요. 모닝빵과 시나몬롤은 어둠 특효!',
  '얼음 외계인에게 맞으면 얼어붙어요. 도넛·소시지빵은 얼지 않고, 소금빵은 얼음 특효!',
  '맵에서 전투를 고르면 등장 속성과 내 파티의 상성을 확인할 수 있어요.',
];

// ───── 도전 과제 ─────
const cnt = (d) => Object.keys(d.cleared).length;
const starSum = (d) => Object.values(d.cleared).reduce((a, b) => a + b, 0);
const own = (d) => Object.keys(d.owned).length;
const evo = (d) => Object.values(d.owned).filter((l) => l >= BW.EVO_LV).length;
const robots = (d) => Object.keys(d.owned).filter((id) => BW.BREADS[id] && BW.BREADS[id].group === 'robot').length;
const maxLv = (d) => Math.max(...Object.values(d.owned));
BW.ACH = [
  ['c5', '첫걸음', '전투 5개 클리어', cnt, 5, 100, 0],
  ['c10', '사령관 격파', '전투 10개 클리어', cnt, 10, 200, 0],
  ['c20', '밀가루 대륙의 영웅', '시리즈 1 완료', cnt, 20, 300, 1000],
  ['c40', '설탕 바다의 정복자', '시리즈 2 완료', cnt, 40, 500, 3000],
  ['c60', '은하의 제빵왕', '시리즈 3 완료', cnt, 60, 1000, 10000],
  ['s15', '반짝반짝', '별 15개 모으기', starSum, 15, 100, 0],
  ['s45', '별빛 수집가', '별 45개 모으기', starSum, 45, 200, 0],
  ['s90', '별의 지휘관', '별 90개 모으기', starSum, 90, 400, 0],
  ['s180', '완벽주의자', '별 180개 모으기 (모든 전투 ★3)', starSum, 180, 1000, 0],
  ['o6', '새내기 제빵사', '빵 레시피 6종 수집', own, 6, 100, 0],
  ['o15', '동네 빵집 사장님', '빵 레시피 15종 수집', own, 15, 200, 0],
  ['o25', '빵 박사', '빵 레시피 25종 수집', own, 25, 400, 0],
  ['o37', '전설의 레시피 북', '모든 빵 레시피 수집', own, 37, 1000, 0],
  ['r1', '삐빅, 조립 완료', '로봇 빵 1종 획득', robots, 1, 100, 0],
  ['r4', '메카 정비사', '로봇 빵 4종 획득', robots, 4, 300, 0],
  ['r8', '메카 베이커리 완성', '로봇 빵 8종 모두 획득', robots, 8, 600, 0],
  ['e1', '첫 진화', '빵 1종 진화 (Lv.10)', evo, 1, 150, 500],
  ['e5', '진화 연구가', '빵 5종 진화', evo, 5, 300, 2000],
  ['e12', '진화의 대가', '빵 12종 진화', evo, 12, 600, 5000],
  ['m20', '한계 돌파', '빵 1종 Lv.20 달성', maxLv, 20, 500, 0],
  ['p10', '오븐 단골', '뽑기 10회', (d) => d.stats.pulls, 10, 100, 0],
  ['p50', '오븐 VIP', '뽑기 50회', (d) => d.stats.pulls, 50, 300, 0],
  ['k300', '외계인 사냥꾼', '외계인 300마리 처치', (d) => d.stats.kills, 300, 100, 500],
  ['k2000', '은하 청소부', '외계인 2,000마리 처치', (d) => d.stats.kills, 2000, 300, 3000],
  ['w50', '역전의 용사', '전투 50회 승리', (d) => d.stats.wins, 50, 300, 2000],
].map(([id, name, desc, val, goal, flour, gold]) => ({ id, name, desc, val, goal, flour, gold }));
BW.achReady = (d) => BW.ACH.filter((a) => !d.claimed[a.id] && a.val(d) >= a.goal).length;
