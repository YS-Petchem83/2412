// ===== 상태 관리 =====
let currentUser = null;
let currentState = {
    selectedPractice: null,
    selectedQuizType: 'safety',
    quizAnswers: {},
    questionIndex: 0,
    currentTab: 'home',
    hazardReports: [],
    communityPosts: [],
    selectedEquipment: null,
    filteredStatus: 'all',
    equipmentDeleteMode: false
};

let calendarCurrentDate = new Date();

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    initLogin();
    loadStateFromStorage();
    
    // 네비게이션 탭 이벤트
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // 홈 화면 카드 클릭 이벤트
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const tabName = card.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // 달력 네비게이션
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    if (prevMonth) prevMonth.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        renderCalendar();
    });
    if (nextMonth) nextMonth.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // 장비 필터 버튼
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterEquipment(btn.dataset.status);
        });
    });

    // 실습정보 탭 - 실습 선택
    document.querySelectorAll('.info-practice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const practice = btn.dataset.infoPractice;
            selectInfoPractice(practice);
        });
    });

    // 실습정보 탭 - 세부 탭 선택
    document.querySelectorAll('.info-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const infoTab = btn.dataset.infoTab;
            renderInfoDetail(infoTab);
            
            // 활성 버튼 표시
            document.querySelectorAll('.info-tab-btn').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
        });
    });

    // 사고대처 탭 - 사고 유형 선택
    document.querySelectorAll('.accident-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const accident = btn.dataset.accident;
            selectAccidentType(accident);
        });
    });
    
    // 초기 렌더링
    switchTab('home');
    renderHazardReports();
    renderCommunity();
    renderCalendar();
    updateEquipmentStats();
    renderEquipment();
    
    // 마스코트 상호작용 설정
    setupMascotInteraction();
});

// ===== 데이터 관리 =====
const AppData = {
    quizzes: {
        drilling: {
            safety: [
                {
                    question: "드릴 작업 시 가장 위험한 사고는?",
                    options: ["옷이 드릴에 감기는 사고", "소음 노출", "피로", "따뜻함"],
                    correct: 0,
                    explanation: "드릴은 고속 회전하므로 느슨한 옷이나 긴 머리가 감기면 심각한 부상을 입을 수 있습니다."
                },
                {
                    question: "드릴 비트가 끼었을 때 해야 할 행동은?",
                    options: ["힘으로 더 누른다", "즉시 전원을 끈다", "톱질을 한다", "기름을 더 바른다"],
                    correct: 1,
                    explanation: "비트가 끼면 매우 위험하므로 즉시 전원을 차단해야 합니다."
                },
                {
                    question: "드릴 작업 전 반드시 확인해야 할 사항은?",
                    options: ["날씨 확인", "비트 고정 여부 및 워크 고정", "시간 확인", "음악 재생"],
                    correct: 1,
                    explanation: "드릴링 전에 비트와 워크가 제대로 고정되었는지 확인해야 회전 중 사고를 방지할 수 있습니다."
                },
                {
                    question: "드릴 작업 중 착용해야 할 안전 장구는?",
                    options: ["모자만 쓴다", "안전안경과 장갑", "운동화만 신는다", "반팔 옷만 입는다"],
                    correct: 1,
                    explanation: "안전안경으로 눈을 보호하고 장갑으로 손가락을 보호해야 합니다."
                },
                {
                    question: "드릴의 회전 속도는 어떻게 조절해야 하나?",
                    options: ["워크 재질에 따라 조절한다", "항상 최고 속도로 돌린다", "손으로 속도를 느껴본다", "임의로 조절한다"],
                    correct: 0,
                    explanation: "재질에 따라 적절한 회전 속도로 조절해야 효율적이고 안전한 작업이 가능합니다."
                }
            ],
            accident: [
                {
                    question: "드릴로 손가락을 찔렸을 때 우선 조치는?",
                    options: ["기름을 바른다", "물로 씻고 지혈한다", "침을 바른다", "흙을 묻힌다"],
                    correct: 1,
                    explanation: "즉시 깨끗한 물로 씻고 붕대로 감싸 지혈해야 합니다."
                },
                {
                    question: "드릴로 인한 화상이 발생했을 때 대처 방법은?",
                    options: ["기름을 바른다", "찬 물에 10-15분 담근다", "침을 바른다", "식염수를 뿌린다"],
                    correct: 1,
                    explanation: "화상 초기 대처는 찬 물에 담가 열을 식히는 것이 가장 효과적입니다."
                },
                {
                    question: "드릴에 옷이 감겼을 때 해야 할 행동은?",
                    options: ["계속 돌려서 풀어낸다", "즉시 전원을 끄고 고정한다", "손으로 잡아당긴다", "물을 분사한다"],
                    correct: 1,
                    explanation: "즉시 전원을 끄고 응급처치를 해야 더 큰 부상을 방지할 수 있습니다."
                },
                {
                    question: "드릴로 인한 심한 출혈 시 응급조치는?",
                    options: ["그냥 놔둔다", "응급실로 즉시 이송한다", "매운 음식을 먹는다", "운동을 한다"],
                    correct: 1,
                    explanation: "심한 출혈은 생명 위험이 있으므로 즉시 병원 응급실로 가야 합니다."
                },
                {
                    question: "드릴 작업 중 눈에 금속 조각이 들어갔을 때는?",
                    options: ["자기 손가락으로 빼낸다", "즉시 안경을 벗고 물로 씻는다", "누군가 빼달라고 한다", "그냥 둔다"],
                    correct: 1,
                    explanation: "이물질은 안경을 벗고 흐르는 물로 씻어내야 하며, 심하면 병원에 가야 합니다."
                }
            ]
        },
        arc_welding: {
            safety: [
                {
                    question: "직류아크용접 시 가장 중요한 안전 장비는?",
                    options: ["장갑", "용접 마스크", "앞치마", "안경"],
                    correct: 1,
                    explanation: "용접 마스크는 아크광으로부터 눈을 보호하는 가장 중요한 장비입니다."
                },
                {
                    question: "용접 작업 중 통풍이 안 될 때는?",
                    options: ["계속 작업한다", "환기를 개선한 후 작업한다", "마스크만 쓴다", "빨리 끝낸다"],
                    correct: 1,
                    explanation: "유해가스 노출을 피하기 위해 반드시 환기를 개선해야 합니다."
                },
                {
                    question: "아크용접의 아크광으로부터 눈을 보호하지 않으면?",
                    options: ["귀가 안 들린다", "전광안염(용접사의 눈병)이 생긴다", "팔이 저린다", "피부가 검어진다"],
                    correct: 1,
                    explanation: "아크광에 노출되면 전광안염으로 인한 심한 눈 통증과 시력 손상이 발생할 수 있습니다."
                },
                {
                    question: "용접 작업 시 피부를 보호하기 위한 올바른 복장은?",
                    options: ["반팔, 반바지", "긴팔, 긴바지, 앞치마", "수영복", "캐주얼 옷"],
                    correct: 1,
                    explanation: "피부 노출을 최소화해야 화상과 UV 손상을 방지할 수 있습니다."
                },
                {
                    question: "용접 작업 후 초기 냉각 처리는?",
                    options: ["물에 바로 담근다", "공기 중에서 천천히 식힌다", "재가열한다", "기름을 바른다"],
                    correct: 1,
                    explanation: "용접 부위는 자연적으로 식혀야 금속의 성질이 유지됩니다."
                }
            ],
            accident: [
                {
                    question: "화상을 입었을 때 가장 먼저 해야 할 일은?",
                    options: ["기름을 바른다", "얼음으로 찬바람을 분다", "찬 물에 15-20분 담근다", "상처를 덮는다"],
                    correct: 2,
                    explanation: "화상은 즉시 찬 물에 담가 열을 식혀야 피부 손상을 최소화할 수 있습니다."
                },
                {
                    question: "용접 중 아크광에 노출되어 눈이 아플 때는?",
                    options: ["계속 작업한다", "눈을 비비고 계속한다", "즉시 작업을 중단하고 어두운 곳에서 휴식한다", "밝은 불빛을 본다"],
                    correct: 2,
                    explanation: "전광안염 증상이 보이면 즉시 휴식하고 필요 시 병원에 가야 합니다."
                },
                {
                    question: "용접 중 불꽃이 옷에 붙었을 때 대처는?",
                    options: ["계속 작업한다", "달려서 물을 구한다", "즉시 해당 부위를 끄고 전원을 차단한다", "친구를 부른다"],
                    correct: 2,
                    explanation: "먼저 전원을 끄고 불을 꺼야 더 큰 화상을 방지할 수 있습니다."
                },
                {
                    question: "심각한 화상으로 물집이 생겼을 때는?",
                    options: ["물집을 터뜨린다", "밴드만 붙인다", "병원에 가서 치료를 받는다", "약국에서 파스를 산다"],
                    correct: 2,
                    explanation: "심각한 화상은 감염 위험이 있으므로 반드시 병원에서 치료받아야 합니다."
                },
                {
                    question: "용접 흄(연기)을 많이 흡입했을 때 증상은?",
                    options: ["배가 고프다", "기침, 호흡곤란, 두통 등", "졸음이 온다", "행복해진다"],
                    correct: 1,
                    explanation: "흄 흡입으로 호흡기 질환이 발생할 수 있으므로 환기를 개선하고 병원에 가야 합니다."
                }
            ]
        },
        gas_welding: {
            safety: [
                {
                    question: "가스용접 중 발생할 수 있는 가장 위험한 상황은?",
                    options: ["손이 더워진다", "아세틸렌 가스가 누출되고 점화된다", "목이 마른다", "피곤하다"],
                    correct: 1,
                    explanation: "아세틸렌은 폭발성 가스로, 누출되면 폭발할 수 있으므로 매우 위험합니다."
                },
                {
                    question: "가스용접 시 산소와 아세틸렌의 올바른 압력 비는?",
                    options: ["1:1", "1:2", "2:1", "3:1"],
                    correct: 2,
                    explanation: "산소 압력이 아세틸렌보다 높아야 안정적인 화염을 유지할 수 있습니다."
                },
                {
                    question: "아세틸렌 가스 취급 시 주의사항은?",
                    options: ["옆으로 누인다", "거꾸로 뒤집는다", "항상 직립 상태로 보관한다", "뜨거운 곳에 둔다"],
                    correct: 2,
                    explanation: "아세틸렌 실린더는 항상 직립 상태로 보관해야 액화되어 폭발하는 것을 방지합니다."
                },
                {
                    question: "가스용접 중 불이 꺼졌을 때 대처 방법은?",
                    options: ["계속 불을 붙이려 한다", "즉시 아세틸렌 밸브를 닫는다", "산소만 더 센다", "손으로 불을 볼 때까지 켜본다"],
                    correct: 1,
                    explanation: "불이 꺼지면 즉시 아세틸렌을 차단해야 폭발을 방지할 수 있습니다."
                },
                {
                    question: "가스용접 작업 시 개인보호장비 중 필수는?",
                    options: ["모자", "보안경, 앞치마, 장갑, 부츠", "선글라스", "숨 쉴 때만 마스크"],
                    correct: 1,
                    explanation: "화상과 눈 보호를 위해 안경, 앞치마, 장갑이 필수입니다."
                }
            ],
            accident: [
                {
                    question: "가스용접으로 손에 화상을 입었을 때는?",
                    options: ["바로 병원에 간다", "찬 물에 15-20분 담근다", "기름을 바른다", "밴드를 붙인다"],
                    correct: 1,
                    explanation: "화상은 즉시 찬 물에 담가 열을 식혀야 손상을 최소화할 수 있습니다."
                },
                {
                    question: "가스 누출로 인한 화재 발생 시 대처는?",
                    options: ["계속 작업한다", "즉시 가스 밸브를 닫고 소화기로 진화한다", "물을 뿌린다", "도움을 요청한다"],
                    correct: 1,
                    explanation: "가스 화재는 가스를 차단한 후 소화기로 진화해야 합니다."
                },
                {
                    question: "아세틸렌 가스 흡입으로 인한 응급처치는?",
                    options: ["계속 작업한다", "신선한 공기로 옮기고 산소를 공급한다", "물을 마신다", "누워있는다"],
                    correct: 1,
                    explanation: "가스 중독 시 즉시 신선한 공기로 옮기고 병원에 가야 합니다."
                },
                {
                    question: "용접 중 눈이 따끔거리고 시야가 흐려졌을 때는?",
                    options: ["계속 작업한다", "즉시 작업 중단 후 어두운 곳에서 휴식한다", "목을 만진다", "자리를 떠난다"],
                    correct: 1,
                    explanation: "자외선 노출로 인한 증상이므로 즉시 휴식하고 필요 시 병원에 가야 합니다."
                },
                {
                    question: "가스용접 작업 후 머리가 지끈거리고 속이 메스꺼울 때는?",
                    options: ["자고 있다", "즉시 신선한 공기로 나가고 의료진에게 알린다", "음식을 먹는다", "계속 작업한다"],
                    correct: 1,
                    explanation: "유해 가스 흡입 증상이므로 신선한 공기로 나가 휴식하고 필요 시 병원에 가야 합니다."
                }
            ]
        },
        file_work: {
            safety: [
                {
                    question: "파일 작업 시 가장 중요한 안전 장비는?",
                    options: ["모자만 쓴다", "안전경과 작업용 장갑", "겨울옷", "마스크"],
                    correct: 1,
                    explanation: "파일링 중 금속 가루가 튈 수 있으므로 안전경으로 눈을 보호하고, 장갑으로 손을 보호해야 합니다."
                },
                {
                    question: "파일로 작업할 때 워크를 고정하지 않으면 어떤 위험이 발생하나?",
                    options: ["시간이 오래 걸린다", "파일이 미끄러져 손상이나 부상을 입을 수 있다", "소음이 난다", "색상이 변한다"],
                    correct: 1,
                    explanation: "고정되지 않은 워크는 파일 하중에 의해 미끄러질 수 있어 손가락 절상 등의 심각한 부상을 입을 수 있습니다."
                },
                {
                    question: "파일 작업 중 옷이나 머리가 나붓거릴 때는?",
                    options: ["계속 작업한다", "안전하게 정리한 후 작업한다", "빠르게 움직인다", "무시한다"],
                    correct: 1,
                    explanation: "나붓거리는 옷이나 머리는 워크에 감겨 심각한 부상을 입을 수 있으므로 반드시 정리해야 합니다."
                },
                {
                    question: "파일의 핸들이 손상되었을 때는?",
                    options: ["그냥 사용한다", "즉시 수리하거나 교체한다", "테이프로 감싼다", "모르쇠한다"],
                    correct: 1,
                    explanation: "손상된 핸들은 파일이 빠져나가 손상이나 부상을 입을 수 있으므로 반드시 교체해야 합니다."
                },
                {
                    question: "파일 작업 후 장시간 사용하지 않을 때는?",
                    options: ["습한 곳에 둔다", "기름칠을 하여 녹슬지 않도록 보관한다", "물로 씻는다", "햇빛에 둔다"],
                    correct: 1,
                    explanation: "파일은 녹이 슬기 쉬우므로 가벼운 기름칠 후 건조한 곳에 보관해야 합니다."
                }
            ],
            accident: [
                {
                    question: "파일로 손가락을 베었을 때 응급 처치는?",
                    options: ["기름을 바른다", "깨끗한 물로 씻고 지혈한다", "침을 바른다", "흙을 묻힌다"],
                    correct: 1,
                    explanation: "먼저 깨끗한 물로 씻고 소독한 후 붕대로 감싸 지혈해야 합니다."
                },
                {
                    question: "파일 작업 중 손이 끼었을 때는?",
                    options: ["계속 작업한다", "즉시 힘을 빼고 조심스럽게 빼낸다", "반대로 돌린다", "누군가에게 도움을 청하지 않는다"],
                    correct: 1,
                    explanation: "서두르거나 급하게 움직이면 더 큰 부상을 입을 수 있으므로 조심스럽게 빼내야 합니다."
                },
                {
                    question: "파일 중 워크가 날아갈 위험이 있을 때는?",
                    options: ["계속 작업한다", "즉시 작업을 중단하고 워크를 다시 고정한다", "더 빠르게 작업한다", "무시한다"],
                    correct: 1,
                    explanation: "워크가 날아가면 타인에게 부상을 입힐 수 있으므로 즉시 중단해야 합니다."
                },
                {
                    question: "금속 가루가 눈에 들어갔을 때는?",
                    options: ["손으로 비빈다", "물이나 생리 식염수로 충분히 씻고 필요시 병원에 간다", "연고를 바른다", "방치한다"],
                    correct: 1,
                    explanation: "이물질은 물로 씻어내야 하며, 심할 경우 즉시 병원에 가야 합니다."
                },
                {
                    question: "파일 작업 중 심한 손상이 발생했을 때는?",
                    options: ["계속 작업한다", "즉시 작업을 중단하고 교사에게 알리거나 119에 신고한다", "혼자 해결한다", "나중에 말한다"],
                    correct: 1,
                    explanation: "심한 부상은 즉시 의료진의 도움을 받아야 하므로 신속한 보고가 중요합니다."
                }
            ]
        },
        pipe_machine: {
            safety: [
                {
                    question: "파이프 기계 작업 시 가장 위험한 부분은?",
                    options: ["소음", "고회전하는 회전부", "열", "냄새"],
                    correct: 1,
                    explanation: "회전하는 부분에 옷이나 머리가 감기면 심각한 부상을 입을 수 있습니다."
                },
                {
                    question: "파이프 기계 시작 전 반드시 확인해야 할 사항은?",
                    options: ["날씨", "기계의 안전장치와 손상 여부", "시간", "음악"],
                    correct: 1,
                    explanation: "안전장치가 제대로 작동하고 손상이 없는지 확인해야 안전한 작업이 가능합니다."
                },
                {
                    question: "파이프 기계 운전 중 이상이 발생하면?",
                    options: ["계속 돌린다", "즉시 전원을 끈다", "속도를 높인다", "다른 사람에게 부탁한다"],
                    correct: 1,
                    explanation: "기계 고장이나 이상이 있으면 즉시 전원을 차단해야 사고를 방지할 수 있습니다."
                },
                {
                    question: "파이프 기계 작업 시 착용해야 할 최우선 안전 장구는?",
                    options: ["모자만", "안전안경과 장갑", "귀마개", "향수"],
                    correct: 1,
                    explanation: "눈과 손 보호가 최우선이며, 필요에 따라 귀보호도 해야 합니다."
                },
                {
                    question: "파이프 기계에서 작업 중 긴 머리는?",
                    options: ["내려둔다", "반드시 묶거나 스카프로 감싼다", "자른다", "후드를 쓴다"],
                    correct: 1,
                    explanation: "긴 머리가 회전부에 감기면 심각한 두피 손상이 발생할 수 있습니다."
                }
            ],
            accident: [
                {
                    question: "파이프 기계에 손이 끼었을 때 대처는?",
                    options: ["힘으로 당긴다", "즉시 전원을 끄고 신속히 제거한다", "물을 부한다", "도움을 요청한다"],
                    correct: 1,
                    explanation: "즉시 전원을 차단하고 손을 조심히 빼내야 더 큰 손상을 방지할 수 있습니다."
                },
                {
                    question: "파이프 기계로 인한 골절이 의심될 때는?",
                    options: ["계속 작업한다", "즉시 119에 신고하고 움직이지 않는다", "팔을 움직인다", "운동을 한다"],
                    correct: 1,
                    explanation: "골절이 의심되면 움직이지 않고 즉시 병원으로 이송해야 합니다."
                },
                {
                    question: "파이프 기계에 머리카락이 감겼을 때는?",
                    options: ["흔들어서 풀어낸다", "즉시 전원을 끄고 조심히 풀어낸다", "자른다", "물을 뿌린다"],
                    correct: 1,
                    explanation: "무리하게 당기면 두피가 벗겨질 수 있으므로 조심히 풀어내야 합니다."
                },
                {
                    question: "파이프 기계로 인한 심각한 출혈 시는?",
                    options: ["응급처치를 하지 않는다", "지혈하고 즉시 병원으로 이송한다", "약을 바른다", "휴식한다"],
                    correct: 1,
                    explanation: "생명 위험이 있으므로 지혈하고 즉시 응급실로 가야 합니다."
                },
                {
                    question: "파이프 기계 작업 후 극심한 통증이 있을 때는?",
                    options: ["참는다", "의료진에게 알리고 검사를 받는다", "운동을 한다", "마사지를 한다"],
                    correct: 1,
                    explanation: "내부 손상이 있을 수 있으므로 반드시 의료진의 진찰을 받아야 합니다."
                }
            ]
        }
    },
    equipment: [],
    schedules: [
        { title: "드릴 안전교육", date: "2024-09-05", type: "education" }
    ],
    info: {
        drilling: {
            method: "1. 작업 전 안전 장비 확인 (안전경, 장갑)\n2. 드릴 전원을 끈다\n3. 드릴 비트를 교체한다\n4. 워크를 드릴 테이블에 고정한다\n5. 드릴의 회전 속도를 워크 재질에 맞게 조절한다\n6. 천천히 드릴을 하강하며 워크에 구멍을 뚫린다",
            materials: "- 드릴프레스 (수직 드릴)\n- 드릴 비트 (여러 크기)\n- 워크 (금속판)\n- 안전경\n- 작업용 장갑\n- 냉각액 (선택)\n- 작업복",
            equipment: "드릴프레스: 수직으로 회전하는 고속 드릴을 이용하여 금속에 정확한 구멍을 뚫는 정밀 장비입니다. 주로 금속 가공 작업에 사용됩니다.",
            warnings: "- 느슨한 옷이나 긴 머리는 회전부에 감기기 쉬우므로 주의하세요\n- 드릴 회전 중 절대 워크를 손으로 만지지 마세요\n- 안전경을 반드시 착용하세요\n- 비트 교체 시 반드시 전원을 끄세요\n- 한 번에 과도한 압력을 가하지 마세요"
        },
        arc_welding: {
            method: "1. 작업 전 안전 장비 확인 (용접 마스크, 앞치마, 장갑, 안전화)\n2. 용접기 전원을 켠다\n3. 전극봉을 홀더에 끼운다\n4. 용접 마스크를 착용한다\n5. 워크를 고정한다\n6. 아크를 발생시켜 일정한 속도로 용접한다\n7. 냉각을 기다린다",
            materials: "- 직류아크용접기\n- 전극봉 (여러 종류)\n- 용접 마스크\n- 가죽 앞치마\n- 가죽 장갑\n- 안전화\n- 작업복",
            equipment: "직류아크용접기: 전극봉과 워크 사이에 아크를 발생시켜 고온의 열로 금속을 녹여 용접하는 장비입니다. 금속 구조물 제작과 수리에 널리 사용됩니다.",
            warnings: "- 아크광을 직접 보면 눈이 심각하게 손상됩니다 (전광안염)\n- 반드시 용접 마스크를 착용하세요\n- 통풍이 잘 되는 환경에서 작업하세요 (유해가스 흡입 방지)\n- 근처에 가연성 물질이 없는지 확인하세요\n- 작업 후 뜨거운 용접부를 만지지 마세요"
        },
        gas_welding: {
            method: "1. 작업 전 안전 장비 확인 (용접 마스크, 장갑, 앞치마, 안전화)\n2. 산소와 아세틸렌 가스 공급을 확인한다\n3. 용접 토치를 점화한다 (라이터나 점화봉 사용)\n4. 화염의 크기를 조절한다 (중성화염)\n5. 용접봉을 녹여가며 천천히 용접한다\n6. 가스 공급을 차단한다",
            materials: "- 가스용접기 (산소와 아세틸렌)\n- 산소 실린더\n- 아세틸렌 실린더\n- 조절기 (감압기)\n- 용접 토치\n- 용접봉\n- 용접 마스크\n- 가죽 장갑\n- 가죽 앞치마\n- 안전화",
            equipment: "가스용접기: 산소와 아세틸렌 가스의 화염을 이용하여 3000℃ 이상의 고온으로 금속을 녹여 용접하는 장비입니다. 주로 얇은 금속이나 특수 재료 용접에 사용됩니다.",
            warnings: "- 가스 누출을 항상 주의하세요 (폭발 위험)\n- 화염 근처 1m 이내에 가연성 물질을 두지 마세요\n- 실린더가 안정적으로 고정되어 있는지 확인하세요\n- 환기를 충분히 하세요\n- 근처에 물이나 습기를 제거하세요"
        },
        file_work: {
            method: "1. 작업 전 안전 장비를 확인한다 (안전경, 장갑, 작업복)\n2. 워크를 바이스나 클램프로 단단히 고정한다\n3. 파일의 핸들과 상태를 확인한다\n4. 파일의 거친 정도를 선택한다 (거친 파일→중간→미세)\n5. 한 방향으로 일정한 속도로 문질러 파일링한다\n6. 자주 파일의 이빨을 확인하고 청소한다\n7. 파일링이 완료되면 워크를 제거한다",
            materials: "- 파일 (다양한 종류와 거친 정도)\n- 파일 핸들\n- 바이스 또는 클램프 (워크 고정용)\n- 안전경\n- 면장갑 또는 가죽장갑\n- 파일 청소용 칫솔\n- 금속 가루 청소용 솔\n- 작업복\n- 안전화",
            equipment: "파일: 표면을 매끄럽게 다듬거나 모양을 자유롭게 가공하는 도구입니다. 거친 파일은 빠른 가공, 미세 파일은 정밀한 마무리에 사용됩니다.",
            warnings: "- 안전경을 반드시 착용하세요 (금속 가루 비산 방지)\n- 워크를 반드시 고정하세요 (미끄러짐 방지)\n- 느슨한 옷이나 긴 머리를 정리하세요\n- 파일 끝의 예리한 부분과 돌기에 주의하세요\n- 파일 핸들이 손상되면 즉시 교체하세요"
        },
        pipe_machine: {
            method: "1. 작업 전 안전 장비 확인 (안전경, 장갑, 안전화)\n2. 파이프를 절단 장치에 정확히 고정한다\n3. 절단 깊이와 각도를 설정한다\n4. 절단 속도를 조절한다\n5. 천천히 절단한다 (급하게 밀지 마세요)\n6. 절단이 완료되면 파이프를 제거한다",
            materials: "- 파이프 절단기 (동력 또는 수동)\n- 파이프 (강철, 구리, 알루미늄 등)\n- 안전경\n- 작업용 장갑\n- 안전화\n- 절단유 (선택)\n- 작업복",
            equipment: "파이프머신: 다양한 지름의 파이프를 정확하게 절단하는 장비입니다. 동력식은 빠르고 정확한 절단이 가능하며, 수동식은 간단하고 비용 효율적입니다.",
            warnings: "- 절단 중 절대 파이프를 손으로 만지지 마세요\n- 안전경을 반드시 착용하세요\n- 장갑 끝이 절단 날에 닿지 않도록 주의하세요\n- 파이프 끝의 예리한 모서리에 주의하세요\n- 절단 후 파이프가 떨어질 수 있으니 주의하세요"
        }
    },
    accident: {
        burn: ["1단계: 즉시 찬 물에 15-20분 담그기", "2단계: 화상 부위를 깨끗하게 드레싱", "3단계: 상처 부위를 깨끗한 거즈로 감싸기", "4단계: 병원에 이송"],
        cut: ["1단계: 출혈 부위를 깨끗한 물로 씻기", "2단계: 소독액으로 상처 소독", "3단계: 멸균된 거즈로 상처 감싸기", "4단계: 필요시 병원 이송"],
        electric: ["1단계: 즉시 전원 차단", "2단계: 환자를 안전한 곳으로 이동", "3단계: 호흡 확인 및 인공호흡", "4단계: 즉시 119 신고"],
        chemical: ["1단계: 화학물질이 묻은 옷 벗기", "2단계: 15분 이상 흐르는 물로 씻기", "3단계: 화학물질명 확인", "4단계: 병원 이송"],
        fracture: ["1단계: 움직이지 않도록 고정", "2단계: 얼음 찜질", "3단계: 고정된 상태로 운반", "4단계: 병원 이송"],
        crush: ["1단계: 압박 부위 확인", "2단계: 천천히 압박 제거", "3단계: 상처 확인 및 드레싱", "4단계: 필요시 병원 이송"]
    }
};

// ===== 로그인 시스템 =====
function initLogin() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLoginModal();
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'flex';
    updateUserDisplay();
    updateAdminMenuVisibility();
}

function demoLogin(role) {
    const names = { student: "학생 사용자", admin: "관리자" };
    currentUser = {
        id: role === 'admin' ? 'admin001' : 'student001',
        name: names[role],
        role: role
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
}

function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        location.reload();
    }
}

function updateUserDisplay() {
    const roleStr = currentUser.role === 'admin' ? '관리자' : '학생';
    document.getElementById('userInfo').textContent = currentUser.name + ' (' + roleStr + ')';
}

function updateAdminMenuVisibility() {
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    });
}

// ===== 상태 저장/로드 =====
function saveStateToStorage() {
    localStorage.setItem('hazardReports', JSON.stringify(currentState.hazardReports));
    localStorage.setItem('communityPosts', JSON.stringify(currentState.communityPosts));
    localStorage.setItem('schedules', JSON.stringify(AppData.schedules));
    localStorage.setItem('equipment', JSON.stringify(AppData.equipment));
}

function loadStateFromStorage() {
    const reports = localStorage.getItem('hazardReports');
    const posts = localStorage.getItem('communityPosts');
    const schedules = localStorage.getItem('schedules');
    const equipment = localStorage.getItem('equipment');
    
    if (reports) currentState.hazardReports = JSON.parse(reports);
    if (posts) currentState.communityPosts = JSON.parse(posts);
    if (schedules) AppData.schedules = JSON.parse(schedules);
    
    // equipment 로드: localStorage가 있으면 사용, 없으면 기본값 설정 후 저장
    if (equipment) {
        AppData.equipment = JSON.parse(equipment);
    } else {
        // 첫 방문시만 기본 장비 데이터 설정
        AppData.equipment = [
            { id: 1, name: "직류아크용접기", status: "normal", room: "금속공예실", lastCheck: "2024-09-01" },
            { id: 2, name: "가스용접기", status: "caution", room: "금속공예실", lastCheck: "2024-08-20" },
            { id: 3, name: "선반", status: "normal", room: "기계실", lastCheck: "2024-09-02" },
            { id: 4, name: "밀링머신", status: "normal", room: "기계실", lastCheck: "2024-08-30" },
            { id: 5, name: "드릴프레스", status: "normal", room: "금속공예실", lastCheck: "2024-09-03" }
        ];
        // 기본값을 localStorage에 저장
        saveStateToStorage();
    }
}

// ===== 탭 전환 =====
function switchTab(tabName) {
    document.querySelectorAll('[id$="-tab"]').forEach(tab => {
        tab.style.display = 'none';
    });
    const tab = document.getElementById(tabName + '-tab');
    if (tab) tab.style.display = 'block';
    currentState.currentTab = tabName;
    
    if (tabName === 'schedule') {
        renderCalendar();
    } else if (tabName === 'equipment') {
        updateEquipmentStats();
        renderEquipment();
    } else if (tabName === 'education') {
        // 교육 탭 초기화
        currentState.selectedPractice = null;
        currentState.questionIndex = 0;
        currentState.quizAnswers = {};
        
        const practiceButtons = document.getElementById('practiceButtons');
        const quizContainer = document.getElementById('quizContainer');
        const quizTypeButtons = document.getElementById('quizTypeButtons');
        const quizContent = document.getElementById('quizContent');
        const quizResult = document.getElementById('quizResult');
        
        if (practiceButtons) practiceButtons.style.display = 'block';
        if (quizContainer) quizContainer.style.display = 'none';
        if (quizTypeButtons) quizTypeButtons.style.display = 'none';
        if (quizContent) quizContent.style.display = 'none';
        if (quizResult) quizResult.style.display = 'none';
    } else if (tabName === 'info') {
        // 실습정보 탭 초기화
        const infoDetail = document.getElementById('infoDetail');
        if (infoDetail) infoDetail.style.display = 'none';
    } else if (tabName === 'accident') {
        // 사고대처 탭 초기화
        const accidentDetail = document.getElementById('accidentDetail');
        if (accidentDetail) accidentDetail.style.display = 'none';
    }
    
    // 활성 탭 버튼 표시
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 마스코트 메시지 업데이트
    updateMascotMessage(tabName);
}

// ===== 장비 관리 =====
function filterEquipment(status) {
    currentState.filteredStatus = status;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.status === status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderEquipment();
}

function updateEquipmentStats() {
    const equipment = AppData.equipment;
    const total = equipment.length;
    const normal = equipment.filter(e => e.status === 'normal').length;
    const caution = equipment.filter(e => e.status === 'caution').length;
    const warning = equipment.filter(e => e.status === 'warning').length;
    
    const statTotal = document.getElementById('statTotal');
    const statNormal = document.getElementById('statNormal');
    const statCaution = document.getElementById('statCaution');
    const statWarning = document.getElementById('statWarning');
    
    if (statTotal) statTotal.textContent = total;
    if (statNormal) statNormal.textContent = normal;
    if (statCaution) statCaution.textContent = caution;
    if (statWarning) statWarning.textContent = warning;
}

function renderEquipment() {
    let equipment = AppData.equipment;
    if (currentState.filteredStatus !== 'all') {
        equipment = equipment.filter(e => e.status === currentState.filteredStatus);
    }
    
    let html = '';
    
    if (equipment.length === 0) {
        html = '<div style="text-align: center; padding: 3rem; color: #6b7280;"><p>등록된 장비가 없습니다</p></div>';
    } else {
        equipment.forEach(item => {
            const statusDisplay = {
                'normal': '✅ 정상',
                'caution': '⚠️ 점검필요',
                'warning': '🚨 사용중지'
            };
            
            const deleteMode = currentState.equipmentDeleteMode;
            const hoverStyle = deleteMode ? 'cursor: pointer; opacity: 0.8;' : '';
            const onClickHandler = deleteMode ? 'onclick="confirmDeleteEquipment(' + item.id + ')"' : '';
            
            html += '<div class="equipment-item" data-id="' + item.id + '" data-status="' + item.status + '" style="' + hoverStyle + '" ' + onClickHandler + '>';
            html += '<div class="equipment-item-header">';
            html += '<span class="equipment-name">' + item.name + '</span>';
            html += '<span class="equipment-status">' + statusDisplay[item.status] + '</span>';
            html += '</div>';
            html += '<div class="equipment-item-info">';
            html += '<div class="equipment-item-info-row"><strong>📍 위치</strong><span>' + item.room + '</span></div>';
            html += '<div class="equipment-item-info-row"><strong>🗓️ 점검</strong><span>' + item.lastCheck + '</span></div>';
            html += '</div>';
            if (deleteMode) {
                html += '<div style="position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.8rem;">클릭하여 삭제</div>';
            }
            html += '</div>';
        });
    }
    
    const equipmentList = document.getElementById('equipmentList');
    if (equipmentList) {
        equipmentList.innerHTML = html;
    }
    
    // 관리자용 버튼 표시/숨김
    updateAdminMenuVisibility();
}

function selectEquipment(id) {
    const equipment = AppData.equipment.find(e => e.id == id);
    if (equipment) {
        currentState.selectedEquipment = equipment;
        const modal = document.getElementById('equipmentDetail');
        if (modal) {
            const title = document.getElementById('detailTitle');
            const content = document.getElementById('equipmentDetailContent');
            if (title) title.textContent = equipment.name;
            if (content) {
                content.innerHTML = '<p><strong>상태:</strong> ' + equipment.status + '</p>' +
                    '<p><strong>위치:</strong> ' + equipment.room + '</p>' +
                    '<p><strong>마지막 점검:</strong> ' + equipment.lastCheck + '</p>';
            }
            modal.style.display = 'flex';
        }
    }
}

function closeEquipmentDetail() {
    const modal = document.getElementById('equipmentDetail');
    if (modal) modal.style.display = 'none';
}

function toggleAddEquipmentForm() {
    const form = document.getElementById('addEquipmentForm');
    if (form) {
        const isHidden = form.style.display === 'none';
        if (isHidden) {
            form.style.display = 'flex';
            // 첫 입력 필드에 포커스
            setTimeout(() => {
                const firstInput = document.getElementById('newEquipName');
                if (firstInput) firstInput.focus();
            }, 100);
        } else {
            form.style.display = 'none';
            // 폼 리셋
            const equipmentForm = document.querySelector('.equipment-form');
            if (equipmentForm) equipmentForm.reset();
        }
    }
}

function submitAddEquipment(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('newEquipName');
    const roomInput = document.getElementById('newEquipRoom');
    const statusInput = document.getElementById('newEquipStatus');
    const dateInput = document.getElementById('newEquipDate');
    
    // 입력값 검증
    if (!nameInput.value.trim()) {
        alert('장비명을 입력해주세요.');
        nameInput.focus();
        return;
    }
    
    if (!roomInput.value.trim()) {
        alert('위치를 입력해주세요.');
        roomInput.focus();
        return;
    }
    
    if (!statusInput.value) {
        alert('상태를 선택해주세요.');
        statusInput.focus();
        return;
    }
    
    if (!dateInput.value) {
        alert('마지막 점검일을 선택해주세요.');
        dateInput.focus();
        return;
    }
    
    // 날짜 유효성 검사
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    if (selectedDate > today) {
        alert('미래의 날짜를 선택할 수 없습니다.');
        dateInput.focus();
        return;
    }
    
    // 새 장비 객체 생성
    const newEquipment = {
        id: Math.max(...AppData.equipment.map(e => e.id || 0)) + 1,
        name: nameInput.value.trim(),
        room: roomInput.value.trim(),
        status: statusInput.value,
        lastCheck: dateInput.value
    };
    
    AppData.equipment.push(newEquipment);
    
    // 입력 필드 초기화
    nameInput.value = '';
    roomInput.value = '';
    statusInput.value = '';
    dateInput.value = '';
    
    // 폼 닫기
    toggleAddEquipmentForm();
    
    // 통계 업데이트 및 렌더링
    updateEquipmentStats();
    renderEquipment();
    
    // localStorage에 저장
    saveStateToStorage();
    
    alert('장비가 추가되었습니다.');
}

function toggleDeleteMode() {
    currentState.equipmentDeleteMode = !currentState.equipmentDeleteMode;
    
    const btn = document.getElementById('deleteModeBtn');
    if (btn) {
        if (currentState.equipmentDeleteMode) {
            btn.style.background = '#ef4444';
            btn.style.color = 'white';
            btn.textContent = '❌ 삭제 모드 취소';
        } else {
            btn.style.background = '';
            btn.style.color = '';
            btn.textContent = '🗑️ 장비 삭제';
        }
    }
    
    renderEquipment();
}

function confirmDeleteEquipment(id) {
    if (!currentState.equipmentDeleteMode) return;
    
    if (!confirm('이 장비를 삭제하시겠습니까?')) return;
    
    // 장비 찾기 및 삭제
    const index = AppData.equipment.findIndex(e => e.id === id);
    if (index > -1) {
        AppData.equipment.splice(index, 1);
        
        // 통계 업데이트 및 다시 렌더링 (삭제 모드는 유지)
        updateEquipmentStats();
        renderEquipment();
        closeEquipmentDetail();
        
        // localStorage에 저장
        saveStateToStorage();
        
        alert('장비가 삭제되었습니다.');
    }
}

function deleteEquipment(id) {
    if (!confirm('이 장비를 삭제하시겠습니까?')) return;
    
    // 장비 찾기 및 삭제
    const index = AppData.equipment.findIndex(e => e.id === id);
    if (index > -1) {
        AppData.equipment.splice(index, 1);
        
        // 통계 업데이트 및 다시 렌더링
        updateEquipmentStats();
        renderEquipment();
        closeEquipmentDetail();
        
        alert('장비가 삭제되었습니다.');
    }
}

// ===== 달력 =====
function renderCalendar() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    
    const currentMonthEl = document.getElementById('currentMonth');
    if (currentMonthEl) {
        currentMonthEl.textContent = year + '년 ' + monthNames[month];
    }
    
    // 달력 날짜 생성
    const calendarDaysEl = document.getElementById('calendarDays');
    if (!calendarDaysEl) return;
    
    calendarDaysEl.innerHTML = '';
    
    // 해당 월의 첫째 날과 마지막 날 구하기
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    // 빈 칸 채우기 (이전 달)
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendarDaysEl.appendChild(emptyDiv);
    }
    
    // 현재 달 날짜 채우기
    for (let date = 1; date <= lastDate; date++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        // 오늘 날짜 강조
        const today = new Date();
        if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add('today');
        }
        
        // 일정이 있는 날짜 표시
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(date).padStart(2, '0');
        let scheduleTitle = null;
        
        // 이 날짜에 해당하는 일정 찾기
        for (let schedule of AppData.schedules) {
            const startDate = schedule.startDate || schedule.date;
            const endDate = schedule.endDate || schedule.date;
            
            if (dateStr >= startDate && dateStr <= endDate) {
                // 이 일정의 시작 날짜인 경우에만 제목 표시
                if (dateStr === startDate) {
                    scheduleTitle = schedule.title;
                    dayDiv.classList.add('has-schedule');
                } else {
                    dayDiv.classList.add('has-schedule');
                }
                break;
            }
        }
        
        // 날짜와 제목 표시
        let html = '<div style="font-weight: 700; font-size: 1.1rem;">' + date + '</div>';
        if (scheduleTitle) {
            html += '<div style="font-size: 0.7rem; margin-top: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">' + scheduleTitle + '</div>';
        }
        dayDiv.innerHTML = html;
        
        dayDiv.style.cursor = 'pointer';
        dayDiv.onclick = function() {
            showScheduleDetail(year, month, date);
        };
        
        calendarDaysEl.appendChild(dayDiv);
    }
}

function showScheduleDetail(year, month, date) {
    // 이 함수 내에서 현재 날짜를 저장
    window.currentViewingDate = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(date).padStart(2, '0');
    
    const dateStr = window.currentViewingDate;
    
    // 이 날짜에 해당하는 모든 일정 찾기
    const schedules = AppData.schedules.filter(schedule => {
        const startDate = schedule.startDate || schedule.date;
        const endDate = schedule.endDate || schedule.date;
        return dateStr >= startDate && dateStr <= endDate;
    });
    
    const scheduleDetailEl = document.getElementById('scheduleDetail');
    if (!scheduleDetailEl) return;
    
    if (schedules.length === 0) {
        scheduleDetailEl.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">일정이 없습니다.</p>';
    } else {
        let html = '<h3>' + dateStr + ' 일정</h3>';
        schedules.forEach((schedule, index) => {
            html += '<div class="schedule-item" style="border-left: 4px solid #1e88e5; padding: 1rem; margin: 0.5rem 0; background: #f5f5f5; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">';
            html += '<div>';
            html += '<h4 style="margin: 0 0 0.5rem 0;">' + schedule.title + '</h4>';
            html += '<p style="margin: 0; font-size: 0.9rem; color: #666;">타입: ' + schedule.type + '</p>';
            html += '</div>';
            html += '<button onclick="deleteScheduleByDate(\'' + dateStr + '\', ' + index + ')" class="admin-only" style="background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">삭제</button>';
            html += '</div>';
        });
        scheduleDetailEl.innerHTML = html;
    }
}

function addSchedule() {
    const dateStartInput = document.getElementById('newScheduleDateStart');
    const dateEndInput = document.getElementById('newScheduleDateEnd');
    const titleInput = document.getElementById('newScheduleTitle');
    const typeInput = document.getElementById('newScheduleType');
    
    if (!dateStartInput.value || !dateEndInput.value || !titleInput.value) {
        alert('시작 날짜, 종료 날짜, 제목을 모두 입력해주세요.');
        return;
    }
    
    const startDate = new Date(dateStartInput.value);
    const endDate = new Date(dateEndInput.value);
    
    if (startDate > endDate) {
        alert('시작 날짜가 종료 날짜보다 클 수 없습니다.');
        return;
    }
    
    // 시작 날짜 문자열
    const startDateStr = String(startDate.getFullYear()) + '-' + 
                         String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(startDate.getDate()).padStart(2, '0');
    const endDateStr = String(endDate.getFullYear()) + '-' + 
                       String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(endDate.getDate()).padStart(2, '0');
    
    // 일정을 한 번만 추가 (startDate와 endDate 포함)
    const newSchedule = {
        title: titleInput.value,
        startDate: startDateStr,
        endDate: endDateStr,
        type: typeInput.value
    };
    
    AppData.schedules.push(newSchedule);
    
    // 입력 필드 초기화
    dateStartInput.value = '';
    dateEndInput.value = '';
    titleInput.value = '';
    typeInput.value = 'education';
    
    // 달력 다시 렌더링
    renderCalendar();
    
    // 데이터 저장
    saveStateToStorage();
    
    alert('일정이 추가되었습니다.');
}

function deleteScheduleByDate(dateStr, scheduleIndex) {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    
    // 이 날짜에 해당하는 모든 일정 찾기
    const schedulesOnDate = AppData.schedules.filter(schedule => {
        const startDate = schedule.startDate || schedule.date;
        const endDate = schedule.endDate || schedule.date;
        return dateStr >= startDate && dateStr <= endDate;
    });
    
    if (scheduleIndex < schedulesOnDate.length) {
        const scheduleToDelete = schedulesOnDate[scheduleIndex];
        const mainIndex = AppData.schedules.indexOf(scheduleToDelete);
        if (mainIndex > -1) {
            AppData.schedules.splice(mainIndex, 1);
        }
    }
    
    // 달력 다시 렌더링
    renderCalendar();
    
    // 일정 상세 다시 표시
    const parts = dateStr.split('-');
    showScheduleDetail(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    
    // 데이터 저장
    saveStateToStorage();
    
    alert('일정이 삭제되었습니다.');
}

// ===== 위험제보 =====
function renderHazardReports() {
    const list = document.getElementById('hazardReportList');
    if (!list) return;
    
    if (currentState.hazardReports.length === 0) {
        list.innerHTML = '<p>신고된 위험 상황이 없습니다.</p>';
    } else {
        let html = '';
        currentState.hazardReports.forEach(report => {
            html += '<div class="report-item">' +
                '<strong>' + report.location + '</strong> (' + report.date + ')' +
                '<p>' + report.description + '</p>' +
                '</div>';
        });
        list.innerHTML = html;
    }
}

// ===== 커뮤니티 =====
function renderCommunity() {
    const list = document.getElementById('communityPosts');
    if (!list) return;
    
    if (currentState.communityPosts.length === 0) {
        list.innerHTML = '<p>게시물이 없습니다.</p>';
    } else {
        let html = '';
        currentState.communityPosts.forEach(post => {
            html += '<div class="post-item">' +
                '<h4>' + post.title + '</h4>' +
                '<p>' + post.content + '</p>' +
                '<small>' + post.author + ' | ' + post.date + '</small>' +
                '</div>';
        });
        list.innerHTML = html;
    }
}

// ===== 실습정보 시스템 =====
function selectInfoPractice(practice) {
    const infoDetail = document.getElementById('infoDetail');
    const infoContent = document.getElementById('infoContent');
    
    if (!infoDetail || !infoContent) return;
    
    // 먼저 선택된 실습을 설정
    currentState.selectedPractice = practice;
    
    // 그 후에 정보 렌더링 (첫 번째 탭 - 실습 방법)
    renderInfoDetail('method');
    
    // 활성 버튼 표시
    document.querySelectorAll('.info-practice-btn').forEach(btn => {
        if (btn.dataset.infoPractice === practice) {
            btn.style.borderBottom = '3px solid #2563eb';
        } else {
            btn.style.borderBottom = 'none';
        }
    });
    
    // 모든 탭 버튼 활성화
    document.querySelectorAll('.info-tab-btn').forEach(btn => {
        btn.style.display = 'block';
    });
    
    infoDetail.style.display = 'block';
}

function renderInfoDetail(infoTab) {
    const infoContent = document.getElementById('infoContent');
    const practice = currentState.selectedPractice;
    
    if (!infoContent || !practice) return;
    if (!AppData.info[practice]) return;
    
    const content = AppData.info[practice][infoTab] || '정보가 없습니다.';
    let html = '<div class="info-content-detail">';
    
    if (infoTab === 'method') {
        html += '<div class="info-section">';
        html += '<h3>📋 실습 방법</h3>';
        html += '<ol class="info-list">';
        const steps = content.split('\n').filter(s => s.trim());
        steps.forEach(step => {
            html += '<li>' + escapeHtml(step.replace(/^\d+\.\s*/, '')) + '</li>';
        });
        html += '</ol></div>';
    } else if (infoTab === 'materials') {
        html += '<div class="info-section">';
        html += '<h3>🛠️ 준비물</h3>';
        html += '<ul class="info-list">';
        const items = content.split('\n').filter(s => s.trim());
        items.forEach(item => {
            const cleanItem = item.replace(/^[-•]\s*/, '');
            html += '<li>' + escapeHtml(cleanItem) + '</li>';
        });
        html += '</ul></div>';
    } else if (infoTab === 'equipment') {
        html += '<div class="info-section">';
        html += '<h3>⚙️ 장비 사용법</h3>';
        html += '<div class="equipment-description">';
        html += '<p>' + escapeHtml(content) + '</p>';
        html += '</div></div>';
    } else if (infoTab === 'warnings') {
        html += '<div class="info-section warning-section">';
        html += '<h3>⚠️ 주의사항</h3>';
        html += '<ul class="info-list warning-list">';
        const warnings = content.split('\n').filter(s => s.trim());
        warnings.forEach(warning => {
            const cleanWarning = warning.replace(/^[-•]\s*/, '');
            html += '<li>' + escapeHtml(cleanWarning) + '</li>';
        });
        html += '</ul></div>';
    }
    
    html += '</div>';
    infoContent.innerHTML = html;
}

// ===== 사고대처 시스템 =====
function selectAccidentType(accident) {
    const accidentDetail = document.getElementById('accidentDetail');
    const accidentSteps = document.querySelector('.accident-steps');
    
    if (!accidentDetail || !accidentSteps) return;
    
    const steps = AppData.accident[accident] || [];
    let html = '<div class="accident-steps-content">';
    html += '<h3>' + getAccidentTypeName(accident) + '</h3>';
    html += '<ol>';
    
    steps.forEach(step => {
        html += '<li>' + escapeHtml(step) + '</li>';
    });
    
    html += '</ol></div>';
    accidentSteps.innerHTML = html;
    
    // 활성 버튼 표시
    document.querySelectorAll('.accident-type-btn').forEach(btn => {
        if (btn.dataset.accident === accident) {
            btn.style.borderBottom = '3px solid #ef4444';
        } else {
            btn.style.borderBottom = 'none';
        }
    });
    
    accidentDetail.style.display = 'block';
}

function getAccidentTypeName(type) {
    const names = {
        'burn': '🔥 화상',
        'cut': '🩸 베임/상처',
        'electric': '⚡ 감전',
        'chemical': '☠️ 화학물질 접촉',
        'fracture': '🦴 골절',
        'crush': '💔 압박/납작함'
    };
    return names[type] || type;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== 마스코트 메시지 시스템 =====
const mascotMessages = {
    home: ['안전이 최고야!', '반갑습니다! 😊', '즐거운 학습이 되세요!'],
    education: ['퀴즈 화이팅!', '안전을 배워봐요!', '집중력 up! 📚'],
    info: ['유용한 정보네요!', '꼼꼼히 읽어봐요!', '실습이 즐거워!'],
    accident: ['비상상황 대처법이야', '침착함이 중요해요', '안전 제일!'],
    hazard: ['좋은 제보 감사해요!', '위험요소를 찾았어!', '함께 안전하자!'],
    equipment: ['장비를 잘 관리해요!', '정기 점검 필수!', '체계적 관리!'],
    schedule: ['일정을 잘 챙겨봐요!', '계획이 중요해요!', '시간 관리 GOOD!'],
    community: ['소통하며 배워봐요!', '의견 나누기 좋아!', '함께라서 행복해!'],
    admin: ['관리자님 반갑습니다!', '안전을 책임져주세요!', '감사합니다! 👏']
};

function updateMascotMessage(tabName) {
    const mascotBubble = document.getElementById('mascotMessage');
    if (!mascotBubble) return;
    
    const messages = mascotMessages[tabName] || ['안녕하세요!'];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // 페이드 아웃 후 메시지 변경 및 페이드 인
    mascotBubble.style.animation = 'none';
    setTimeout(() => {
        mascotBubble.textContent = randomMessage;
        mascotBubble.style.animation = 'fadeInOut 0.5s ease-in-out';
    }, 10);
}

// 마스코트 클릭 이벤트
function setupMascotInteraction() {
    const mascot = document.querySelector('.mascot');
    if (mascot) {
        mascot.addEventListener('click', () => {
            const messages = ['클릭해주셔서 감사해요! 🎉', '응원합니다! 💪', '화이팅! 🚀', '안전이 제일이에요! ⭐'];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            const mascotBubble = document.getElementById('mascotMessage');
            mascotBubble.textContent = randomMessage;
            
            // 진동 애니메이션
            mascot.style.animation = 'none';
            setTimeout(() => {
                mascot.style.animation = 'float 3s ease-in-out infinite';
            }, 10);
        });
    }
}

// ===== 안전교육 시스템 =====
function selectPractice(practice) {
    currentState.selectedPractice = practice;
    currentState.quizAnswers = {};
    currentState.questionIndex = 0;
    currentState.selectedQuizType = 'safety';
    
    const quizContainer = document.getElementById('quizContainer');
    const practiceButtons = document.getElementById('practiceButtons');
    const quizTypeButtons = document.getElementById('quizTypeButtons');
    
    if (quizContainer) quizContainer.style.display = 'block';
    if (practiceButtons) practiceButtons.style.display = 'block';
    if (quizTypeButtons) quizTypeButtons.style.display = 'block';
    
    // 안전수칙 퀴즈 자동 선택 및 렌더링
    selectQuizType('safety');
}

function selectQuizType(quizType) {
    currentState.selectedQuizType = quizType;
    currentState.questionIndex = 0;
    currentState.quizAnswers = {};
    
    document.querySelectorAll('.quiz-type-btn').forEach(btn => {
        if (btn.getAttribute('data-quizType') === quizType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    const quizContent = document.getElementById('quizContent');
    const quizResult = document.getElementById('quizResult');
    if (quizContent) quizContent.style.display = 'block';
    if (quizResult) quizResult.style.display = 'none';
    
    renderQuiz();
}

function renderQuiz() {
    if (!currentState.selectedPractice) return;
    
    const quizzes = AppData.quizzes[currentState.selectedPractice];
    if (!quizzes) return;
    
    const questions = quizzes[currentState.selectedQuizType];
    if (!questions) return;
    
    const currentQuestion = questions[currentState.questionIndex];
    if (!currentQuestion) return;
    
    const total = questions.length;
    const current = currentState.questionIndex + 1;
    
    let html = '<div class="quiz-question">';
    html += '<div style="text-align: center; margin-bottom: 20px; font-size: 14px; color: #666;">';
    html += '문제 ' + current + '/' + total;
    html += '</div>';
    html += '<h3>' + currentQuestion.question + '</h3>';
    html += '<div class="question-options">';
    
    currentQuestion.options.forEach((option, index) => {
        const isSelected = currentState.quizAnswers[0] === index ? 'selected' : '';
        html += '<button class="option-btn ' + isSelected + '" onclick="selectOption(0, ' + index + ')">' + option + '</button>';
    });
    
    html += '</div>';
    html += '<button class="btn-primary" onclick="submitQuiz()" style="margin-top: 20px; width: 100%;">제출</button>';
    html += '</div>';
    
    const quizContent = document.getElementById('quizContent');
    if (quizContent) {
        quizContent.innerHTML = html;
    }
}

function selectOption(questionIndex, optionIndex) {
    currentState.quizAnswers[0] = optionIndex;
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.option-btn')[optionIndex].classList.add('selected');
}

function submitQuiz() {
    if (currentState.quizAnswers[0] === undefined) {
        alert('선택지를 선택해주세요.');
        return;
    }
    
    const quizzes = AppData.quizzes[currentState.selectedPractice];
    const questions = quizzes[currentState.selectedQuizType];
    const currentQuestion = questions[currentState.questionIndex];
    
    const isCorrect = currentState.quizAnswers[0] === currentQuestion.correct;
    const score = isCorrect ? 1 : 0;
    
    const results = [{
        question: currentQuestion.question,
        userAnswer: currentQuestion.options[currentState.quizAnswers[0]],
        correctAnswer: currentQuestion.options[currentQuestion.correct],
        isCorrect: isCorrect,
        explanation: currentQuestion.explanation
    }];
    
    displayQuizResult(score, 1, results);
}

function displayQuizResult(score, total, results) {
    const quizContent = document.getElementById('quizContent');
    if (quizContent) quizContent.style.display = 'none';
    
    let html = '<div class="quiz-result">';
    html += '<h3>결과: ' + score + '/' + total + ' 정답</h3>';
    html += '<div style="margin: 20px 0;">';
    
    results.forEach(result => {
        const resultClass = result.isCorrect ? 'correct' : 'incorrect';
        html += '<div class="result-item ' + resultClass + '">';
        html += '<p><strong>문제:</strong> ' + result.question + '</p>';
        html += '<p><strong>당신의 답:</strong> ' + result.userAnswer + '</p>';
        html += '<p><strong>정답:</strong> ' + result.correctAnswer + '</p>';
        html += '<p><strong>해설:</strong> ' + result.explanation + '</p>';
        html += '</div>';
    });
    
    html += '</div>';
    html += '<button class="btn-primary" onclick="retakeQuiz()" style="margin-right: 10px;">다시 풀기</button>';
    
    const quizzes = AppData.quizzes[currentState.selectedPractice];
    const totalQuestions = quizzes[currentState.selectedQuizType].length;
    
    if (currentState.questionIndex < totalQuestions - 1) {
        html += '<button class="btn-primary" onclick="nextQuiz()">다음 문제 풀기</button>';
    } else {
        html += '<button class="btn-primary" onclick="resetQuiz()">처음부터 시작</button>';
    }
    
    html += '</div>';
    
    const quizResult = document.getElementById('quizResult');
    if (quizResult) {
        quizResult.innerHTML = html;
        quizResult.style.display = 'block';
    }
}

function retakeQuiz() {
    currentState.quizAnswers = {};
    currentState.questionIndex = 0;
    
    const quizContent = document.getElementById('quizContent');
    const quizResult = document.getElementById('quizResult');
    if (quizContent) quizContent.style.display = 'block';
    if (quizResult) quizResult.style.display = 'none';
    
    renderQuiz();
}

function nextQuiz() {
    const quizzes = AppData.quizzes[currentState.selectedPractice][currentState.selectedQuizType];
    
    if (currentState.questionIndex < quizzes.length - 1) {
        currentState.questionIndex++;
        currentState.quizAnswers = {};
        
        const quizContent = document.getElementById('quizContent');
        const quizResult = document.getElementById('quizResult');
        if (quizContent) quizContent.style.display = 'block';
        if (quizResult) quizResult.style.display = 'none';
        
        renderQuiz();
    }
}

function resetQuiz() {
    currentState.questionIndex = 0;
    currentState.quizAnswers = {};
    
    const quizContent = document.getElementById('quizContent');
    const quizResult = document.getElementById('quizResult');
    
    if (quizContent) quizContent.style.display = 'block';
    if (quizResult) quizResult.style.display = 'none';
    
    // 현재 퀴즈를 처음부터 다시 렌더링
    renderQuiz();
}
