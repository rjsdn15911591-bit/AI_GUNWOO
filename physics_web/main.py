from fastapi import FastAPI, Request, Query
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path
import importlib, sys

def _load_bkit_module(name):
    """bkit의 일부 서브모듈(lemmatizer 등)은 Python 2 의존성(bnlp)으로 import 불가.
    사용 가능한 서브모듈만 선택적으로 로드한다."""
    try:
        return importlib.import_module(name)
    except Exception:
        return None

bkit_analysis   = _load_bkit_module("bkit.analysis")
bkit_tokenizer  = _load_bkit_module("bkit.tokenizer")
bkit_transform  = _load_bkit_module("bkit.transform")

BASE_DIR = Path(__file__).parent

app = FastAPI(
    title="부산대학교 물리학과",
    description="Pusan National University - Department of Physics",
    version="1.0.0",
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# ─────────────────────────── Mock Data ────────────────────────────────────── #

NEWS_DATA = [
    {"id": 1,  "category": "공지사항", "title": "2026년도 1학기 물리학과 신입생 오리엔테이션 안내",              "date": "2026-03-10", "views": 342},
    {"id": 2,  "category": "학사공지", "title": "2026년도 1학기 수강신청 일정 및 유의사항 안내",                "date": "2026-03-08", "views": 521},
    {"id": 3,  "category": "공지사항", "title": "물리학과 졸업논문 제출 마감 일정 안내",                        "date": "2026-03-05", "views": 189},
    {"id": 4,  "category": "취업정보", "title": "삼성전자 반도체연구소 2026 상반기 채용설명회 안내",             "date": "2026-03-03", "views": 674},
    {"id": 5,  "category": "학사공지", "title": "2026년 1학기 국가장학금 및 교내장학금 신청 안내",              "date": "2026-03-01", "views": 445},
    {"id": 6,  "category": "공지사항", "title": "제21회 물리학과 학술제 개최 안내",                            "date": "2026-02-28", "views": 213},
    {"id": 7,  "category": "취업정보", "title": "LG에너지솔루션 배터리연구소 인턴십 모집",                      "date": "2026-02-25", "views": 398},
    {"id": 8,  "category": "학사공지", "title": "2026년 전기 대학원 입학식 일정 안내",                         "date": "2026-02-20", "views": 276},
]

RESEARCH_AREAS = [
    {
        "id": 1, "name": "응집물질물리", "en_name": "Condensed Matter Physics",
        "symbol": "⬡",
        "color_from": "#1d4ed8", "color_to": "#3b82f6",
        "description": "초전도체, 자성체, 나노구조 등 고체 및 액체 상태 물질의 양자역학적 특성과 창발 현상을 탐구합니다.",
        "labs": 4, "papers": 287, "professors": 5,
        "keywords": ["초전도", "나노구조", "위상물질", "양자자성"],
    },
    {
        "id": 2, "name": "핵물리 및 입자물리", "en_name": "Nuclear & Particle Physics",
        "symbol": "⊕",
        "color_from": "#7c3aed", "color_to": "#a855f7",
        "description": "원자핵과 기본 입자의 구조 및 상호작용을 탐구하고, CERN 협력 연구를 통해 표준모형을 검증합니다.",
        "labs": 3, "papers": 214, "professors": 4,
        "keywords": ["표준모형", "핵반응", "중성미자", "CERN"],
    },
    {
        "id": 3, "name": "광학 및 레이저물리", "en_name": "Optics & Laser Physics",
        "symbol": "◎",
        "color_from": "#0891b2", "color_to": "#06b6d4",
        "description": "극초단 레이저 기술과 광학 현상을 활용하여 정밀 측정과 차세대 광소자 개발 및 양자광학을 연구합니다.",
        "labs": 3, "papers": 253, "professors": 4,
        "keywords": ["극초단레이저", "양자광학", "광집게", "비선형광학"],
    },
    {
        "id": 4, "name": "이론물리", "en_name": "Theoretical Physics",
        "symbol": "∞",
        "color_from": "#0f766e", "color_to": "#14b8a6",
        "description": "양자장론, 일반상대성이론, 통계역학 등 물리학의 근본 이론 체계와 수리물리적 구조를 연구합니다.",
        "labs": 2, "papers": 178, "professors": 3,
        "keywords": ["양자장론", "끈이론", "상대론", "통계역학"],
    },
    {
        "id": 5, "name": "천체물리 및 우주론", "en_name": "Astrophysics & Cosmology",
        "symbol": "✦",
        "color_from": "#b45309", "color_to": "#f59e0b",
        "description": "별과 은하의 형성, 암흑물질과 암흑에너지의 본질, 우주의 기원과 진화를 관측과 이론으로 탐구합니다.",
        "labs": 2, "papers": 143, "professors": 3,
        "keywords": ["암흑물질", "빅뱅", "중력파", "외계행성"],
    },
    {
        "id": 6, "name": "계산물리 및 물리생물학", "en_name": "Computational & Biophysics",
        "symbol": "⎔",
        "color_from": "#be123c", "color_to": "#f43f5e",
        "description": "수치 시뮬레이션과 머신러닝을 융합하여 복잡계 물리 현상과 생체분자 동역학을 분석합니다.",
        "labs": 2, "papers": 97, "professors": 3,
        "keywords": ["분자동역학", "몬테카를로", "뉴럴네트워크", "생체물리"],
    },
]

FACULTY_DATA = [
    {"name": "강해용",  "en_name": "Haeyong Kang",     "rank": "부교수", "specialty": "고체물리 실험",         "email": "haeyong.kang@pusan.ac.kr", "lab": "고체전자물성 연구실",         "phone": "(051) 510-2228", "office": "공동연구기기동 508호"},
    {"name": "계범석",  "en_name": "Beom Seok Kye",    "rank": "교수",   "specialty": "입자물리 이론",         "email": "bkyae@pusan.ac.kr",        "lab": "입자물리이론 연구실",         "phone": "(051) 510-2180", "office": "제1물리관 201호"},
    {"name": "김복기",  "en_name": "Boggi Kim",         "rank": "교수",   "specialty": "고체물리 실험",         "email": "boggikim@pusan.ac.kr",     "lab": "차세대 정보소재 연구실",      "phone": "(051) 510-2223", "office": "제1물리관 307호"},
    {"name": "김지희",  "en_name": "Jihee Kim",         "rank": "부교수", "specialty": "고체물리 실험",         "email": "kimjihee@pusan.ac.kr",     "lab": "펨토초 연구실",               "phone": "(051) 510-2975", "office": "공동실험실습관 610호"},
    {"name": "문한섭",  "en_name": "Han Seob Moon",     "rank": "교수",   "specialty": "광학 실험",             "email": "hsmoon@pusan.ac.kr",       "lab": "원자광학 연구실",             "phone": "(051) 510-2182", "office": "제2물리관 305-1호"},
    {"name": "박성균",  "en_name": "Sung Kyun Park",    "rank": "교수",   "specialty": "고체물리 실험",         "email": "psk@pusan.ac.kr",          "lab": "표면/계면특성 연구실",        "phone": "(051) 510-2595", "office": "공동연구기기동 613호"},
    {"name": "안재석",  "en_name": "Jae Seok Ahn",      "rank": "교수",   "specialty": "고체물리 실험",         "email": "jaisahn@pusan.ac.kr",      "lab": "다강체산화물 연구실",         "phone": "(051) 510-2229", "office": "제1물리관 203호"},
    {"name": "양임정",  "en_name": "Im Jung Yang",      "rank": "교수",   "specialty": "고체물리 실험",         "email": "ijyang@pusan.ac.kr",       "lab": "나노물질 특성 연구실",        "phone": "(051) 510-2221", "office": "공동연구기기동 511호"},
    {"name": "옥종목",  "en_name": "Jongmok Ok",        "rank": "부교수", "specialty": "고체물리 실험",         "email": "okjongmok@pusan.ac.kr",    "lab": "양자물질 연구실",             "phone": "(051) 510-2224", "office": "제1물리관 205호"},
    {"name": "유인권",  "en_name": "In Kwon Yoo",       "rank": "교수",   "specialty": "핵물리 실험 (중이온)",  "email": "yoo@pusan.ac.kr",          "lab": "중이온물리 실험 연구실",      "phone": "(051) 510-2594", "office": "공동연구기기동 602호"},
    {"name": "이미진",  "en_name": "Mi Jin Lee",        "rank": "조교수", "specialty": "통계물리 이론",         "email": "mijinlee@pusan.ac.kr",     "lab": "복잡계 네트워크과학 연구실",  "phone": "(051) 510-2297", "office": "제1물리관 405-1호"},
    {"name": "이재광",  "en_name": "Jaekwang Lee",      "rank": "교수",   "specialty": "고체물리 이론",         "email": "jaekwangl@pusan.ac.kr",   "lab": "재료설계 및 시뮬레이션 연구실","phone": "(051) 510-2227", "office": "공동연구기기동 614호"},
    {"name": "이주연",  "en_name": "Juyeon Yi",         "rank": "교수",   "specialty": "통계물리 이론",         "email": "jyi@pusan.ac.kr",          "lab": "분자전자학 연구실",           "phone": "(051) 510-2225", "office": "제2물리관 207호"},
    {"name": "이창환",  "en_name": "Chang Hwan Lee",    "rank": "교수",   "specialty": "천체물리 이론",         "email": "clee@pusan.ac.kr",         "lab": "천체 강입자물리 연구실",      "phone": "(051) 510-2165", "office": "제1물리관 401호"},
    {"name": "임상훈",  "en_name": "Sang Hoon Lim",     "rank": "부교수", "specialty": "핵물리 실험",           "email": "shlim@pusan.ac.kr",        "lab": "핵물리 연구실",               "phone": "(051) 510-2234", "office": "공동연구기기동 510호"},
    {"name": "정광식",  "en_name": "Kwang Sik Jeong",   "rank": "교수",   "specialty": "입자물리 이론",         "email": "ksjeong@pusan.ac.kr",      "lab": "입자물리이론 및 우주론 연구실","phone": "(051) 510-2231", "office": "제1물리관 204호"},
    {"name": "정윤철",  "en_name": "Yun Chul Chung",    "rank": "교수",   "specialty": "고체물리 실험",         "email": "ycchung@pusan.ac.kr",      "lab": "양자소자 연구실",             "phone": "(051) 510-2729", "office": "제1물리관 403호"},
    {"name": "정진유",  "en_name": "Andy Chinyu Chong", "rank": "부교수", "specialty": "광학 실험",             "email": "chong0422@pusan.ac.kr",    "lab": "극초단 광학 연구실",          "phone": "(051) 510-2233", "office": "제1물리관 301호"},
    {"name": "진형진",  "en_name": "Hyung Jin Jeen",    "rank": "교수",   "specialty": "고체물리 실험",         "email": "hjeen@pusan.ac.kr",        "lab": "복합물질물성 연구실",         "phone": "(051) 510-2978", "office": "공동연구기기동 414호"},
    {"name": "황춘규",  "en_name": "Chun Kyu Hwang",    "rank": "교수",   "specialty": "고체물리 실험",         "email": "ckhwang@pusan.ac.kr",      "lab": "나노물리 연구실",             "phone": "(051) 510-2961", "office": "공동연구기기동 615호"},
]

EVENTS_DATA = [
    {"date": "2026-03-15", "month": "03", "day": "15", "title": "물리학과 콜로퀴움 — 위상 초전도체의 최근 발전",     "type": "학술", "location": "제1물리관 201호"},
    {"date": "2026-03-20", "month": "03", "day": "20", "title": "신입생 환영회 및 선후배 교류의 밤",                  "type": "행사", "location": "물리학관 로비"},
    {"date": "2026-04-01", "month": "04", "day": "01", "title": "BK21 Plus 연구 세미나 시리즈 #1",                    "type": "학술", "location": "제2물리관 302호"},
    {"date": "2026-04-22", "month": "04", "day": "22", "title": "국제 물리학 심포지엄 2026",                          "type": "국제", "location": "부산대 컨벤션센터"},
    {"date": "2026-05-10", "month": "05", "day": "10", "title": "물리학과 졸업논문 최종 발표회",                      "type": "학사", "location": "제1물리관 대강당"},
]

STATS = {"professors": 22, "students": 267, "labs": 16, "papers": 1175}

# ─────────────────────────── Routes ───────────────────────────────────────── #

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "news": NEWS_DATA,
        "research_areas": RESEARCH_AREAS,
        "faculty": FACULTY_DATA,
        "events": EVENTS_DATA,
        "stats": STATS,
    })


@app.get("/api/news")
async def get_news(category: str = Query(default=None)):
    if category and category != "전체":
        filtered = [n for n in NEWS_DATA if n["category"] == category]
        return JSONResponse(content=filtered)
    return JSONResponse(content=NEWS_DATA)


@app.get("/api/search")
async def search(q: str = Query(default="")):
    results = []
    q_lower = q.lower()
    for item in NEWS_DATA:
        if q_lower in item["title"].lower() or q_lower in item["category"].lower():
            results.append({"type": "news", **item})
    for event in EVENTS_DATA:
        if q_lower in event["title"].lower():
            results.append({"type": "event", **event})
    return JSONResponse(content={"query": q, "results": results, "count": len(results)})


@app.get("/api/text-stats")
async def text_stats(text: str = Query(default="")):
    """Backend text analysis powered by bkit."""
    if not text.strip():
        return JSONResponse(content={"error": "텍스트를 입력하세요."}, status_code=400)
    try:
        results: dict = {"char_count": len(text)}

        # bkit.tokenizer — available
        if bkit_tokenizer:
            tokens = bkit_tokenizer.tokenize(text)
            results["tokens"]        = tokens[:20]
            results["unique_words"]  = len(set(tokens))
            results["total_tokens"]  = len(tokens)

        # bkit.transform — available
        if bkit_transform:
            cleaned = bkit_transform.clean_multiple_spaces(
                bkit_transform.clean_special_characters(text)
            )
            results["cleaned_preview"] = cleaned[:200]

        # bkit.analysis — falls back to pure Python if unavailable
        if bkit_analysis:
            results["word_freq"]       = dict(list(bkit_analysis.count_words(text).items())[:10])
            results["total_sentences"] = bkit_analysis.count_sentences(text)
        else:
            import re
            results["total_sentences"] = len(re.findall(r'[.!?।]+', text)) or 1

        return JSONResponse(content=results)
    except Exception as exc:
        return JSONResponse(content={"error": str(exc)}, status_code=500)
