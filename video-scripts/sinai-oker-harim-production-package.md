# 시나이 대 오케르 하림 — 제작용 상세 패키지

이 문서는 `sinai-vs-oker-harim.md`에 있는 원본 대본을 실제로 HeyGen / Synthesia / InVideo 등에 올려
영상을 만들 때 바로 쓸 수 있도록, 장면(씬) 단위로 이미지 프롬프트·자막·타이밍을 정리한 것입니다.

인터랙티브 스토리보드(브라우저 내장 음성으로 흐름과 타이밍을 미리 들어볼 수 있는 프리뷰)는
별도로 아티팩트로 게시되어 있습니다: **https://claude.ai/code/artifact/af8a5cb5-fa85-4fd4-8519-a650cb23eb55**
(원본 대본의 타임코드를 그대로 사용해 장면을 자동 배분한 것으로, 실제 완성 영상과 초 단위까지
정확히 일치하지는 않습니다 — 흐름 확인용 프리뷰입니다.)

---

## 1. 제작 도구 배정

| 파트 | 시간대(대본 기준) | 권장 도구 | 이유 |
|---|---|---|---|
| 1부 · 케이스 | 0:00–0:45 | InVideo | 내레이션 + 사무실/인물 스톡 푸티지·애니메이션으로 빠르게 조립 |
| 2부 · 질문 | 0:45–1:00 | InVideo | 타이틀 카드 전환 |
| 3부 · 탈무드 본론 | 1:00–2:45 | HeyGen / Synthesia | 한국어 아바타 "선생님"이 카메라를 보고 직접 설명, 아람어 원문+번역 슬라이드 병기 |
| 4부 · 반전 | 2:45–3:15 | HeyGen / Synthesia | 같은 아바타로 이어서 진행 |
| 5부 · 정리 | 3:15–3:45 | InVideo | 오프닝 케이스로 복귀, 클로징 CTA |

---

## 2. 장면별 프롬프트 & 자막표

각 행의 "이미지/영상 프롬프트"는 Midjourney·DALL·E·Sora류 AI 이미지·영상 생성 도구에 바로 넣을 수 있는
영어 프롬프트입니다. HeyGen/Synthesia 구간은 아바타가 카메라를 보고 말하는 장면이므로 배경 프롬프트만
제공합니다.

### 1부 — 케이스 (0:00–0:45)

| # | 자막(한국어) | 화면 프롬프트 | 연출 노트(עברית) |
|---|---|---|---|
|1|회사에 팀장 자리가 하나 비었습니다. 두 명의 후보가 있습니다.|`modern tech office, wide establishing shot, two empty chairs facing a manager's desk, soft daylight, minimal corporate style, no text`|סצנה קצרה, שני עמיתים צעירים במשרד|
|2|첫 번째 사람은 '민수'입니다… 정확한 답을 즉시 꺼내옵니다.|`split-screen left panel: young Korean office worker confidently presenting a thick binder of manuals and contracts, archive shelves behind him, clean corporate photography`|תמונה: מסמכים, ספרים, ארכיון|
|3|두 번째 사람은 '지훈'입니다… '산을 뽑는 사람'이라고 불립니다.|`split-screen right panel: young Korean office worker at a whiteboard covered in diagrams, lightbulb-moment expression, dramatic side light`|עצירה דרמטית|
|4|누구를 팀장으로 뽑아야 할까요?|`both split-screen panels held together, a bold question mark graphic overlay in the center, dramatic pause framing`|שתי התמונות במסך|

### 2부 — 질문 (0:45–1:00)

| # | 자막(한국어) | 화면 프롬프트 | 연출 노트(עברית) |
|---|---|---|---|
|5|사실 이 질문은 새로운 것이 아닙니다… 탈무드의 랍비들도 똑같은 질문을 놓고 논쟁했습니다.|`ancient scroll dissolving into a modern office scene, sepia-to-color transition, symbolic timeless-question motif`|טקסט גדול על המסך|
|6|(내레이션 없음 — 타이틀 카드)|`title card: "סיני ועוקר הרים / 시나이와 오케르 하림", parchment texture background, gold Hebrew calligraphy, minimalist`|מעבר לכותרת|

### 3부 — 탈무드 본론 (1:00–2:45) · HeyGen/Synthesia 아바타 구간

| # | 자막(한국어) | 배경/슬라이드 프롬프트 | 연출 노트(עברית) |
|---|---|---|---|
|7|바빌로니아의 폼베디타 예시바에는 두 명의 위대한 스승이 있었습니다…|`ancient Babylonian study hall (beit midrash) interior, two robed sages seated at wooden lecterns, warm candlelight, historical illustration style`|שני דמויות בלבוש מסורתי, בית מדרש|
|8|라브 요세프는 '시나이'라고 불렸습니다… 시나이산에서 받은 그대로…|`Mount Sinai glowing with light, ancient scrolls unfurling from its peak, symbolic illustration, warm gold tones`|—|
|9|라바는 '오케르 하림', 즉 '산을 뽑는 자'라고 불렸습니다…|`a mountain being uprooted at its base, cracks of light breaking through rock, dynamic dramatic illustration`|—|
|10|예시바의 학장 자리가 비었을 때… "시나이가 나은가, 오케르 하림이 나은가?"|`empty ornate scholar's chair on a raised platform in a study hall, spotlight, question mark motif`|המקור המקורי בארמית מוצג על המסך|
|11|어떤 랍비들은 오케르 하림이 낫다고… 하지만 다른 랍비들은 시나이가 낫다고…|`two groups of robed sages facing each other in respectful debate, illustrated, warm vs. cool lighting split`|שתי קבוצות חכמים|
|12|**아람어 원문 인용 슬라이드**|`ancient parchment/manuscript card, Aramaic calligraphy in gold ink, Korean translation subtitle beneath` — 화면 텍스트: `סיני עדיף, דאמר מר: הכל צריכין למרי חטיא` / "시나이가 낫다. 왜냐하면 '모두가 밀 주인을 필요로 한다'고 했기 때문이다." (출처: הוריות י"ד ע"א)|—|
|13|여기서 '밀'은 '탈무드' 그 자체를 뜻합니다… 밀가루 없이는 빵을 구울 수 없는 것처럼요.|`stalks of golden wheat transforming into a warm loaf of bread, stop-motion style animation, simple visual metaphor`|אנימציה קלה: קמח -> לחם|
|14|최종 결정은 이스라엘 땅의 랍비들에게 보내졌고… "시나이가 우선한다."|`a sealed scroll/letter being opened, Mount Sinai motif glowing softly behind it, resolution lighting`|—|

### 4부 — 반전 (2:45–3:15)

| # | 자막(한국어) | 화면 프롬프트 | 연출 노트(עברית) |
|---|---|---|---|
|15|그런데 흥미로운 점이 있습니다… 라바가 학장이 되도록 했습니다.|`one sage humbly bowing and stepping aside, gesturing for the other to take the seat of honor, illustrated, gentle warm light`|הבעת ענווה — רב יוסף מסרב|
|16|예루살렘 탈무드는 이렇게 결론짓습니다: "체계적으로 정리하여 가르치는 사람이…"|`open ancient manuscript page, Jerusalem Talmud styling, soft glow on the text`|—|
|17|즉, 탈무드가 말하는 것은… "공동체에 무엇이 더 필요한가"라는 질문입니다.|`a small circle of diverse people illustrated in warm gold linework, community motif`|—|

### 5부 — 정리 (3:15–3:45)

| # | 자막(한국어) | 화면 프롬프트 | 연출 노트(עברית) |
|---|---|---|---|
|18|그렇다면, 민수와 지훈 중 누가 팀장이 되어야 할까요?…|`return to the opening split-screen office scene, both candidates now shown side by side calmly, resolution framing`|חזרה לתמונת הפתיחה|
|19|하지만 동시에, 라브 요세프처럼 겸손하게 물러설 줄 아는 것…|`single warm-lit portrait silhouette, quiet contemplative mood`|—|
|20|여러분의 생각은 어떻습니까? 시나이가 나을까요, 오케르 하림이 나을까요?|`black screen with bold closing title text treatment, mountain silhouette watermark`|מסך שחור, כותרת מסיימת|
|CTA|(자막 없음 — 엔드카드)|`end card: "이 질문, 우리 수업에서 함께 이야기해봐요" + 프로젝트 로고 자리`|קריאה לפעולה: "בואו נדון בזה בשיעור" / לוגו הפרויקט|

---

## 3. 번역 정확도 검수 항목

최종 녹음/업로드 전에 탈무드를 아는 한국어 화자가 아래 용어의 번역을 검수할 것을 권장합니다.

- **מרי חטיא (마레 히트야)** — "밀 주인"으로 옮긴 부분. 문맥상 "밀가루/밀의 원천이 되는 사람"이라는 뉘앙스가 살아있는지 확인.
- **פלפול (필풀)** — 날카로운 논증·변증법적 논리를 뜻하는 전문 용어. 괄호 병기 표현이 자연스러운지 확인.
- 아람어 인용문(`סיני עדיף, דאמר מר: הכל צריכין למרי חטיא`)의 발음/억양 — 성우가 히브리어/아람어 낭독에 익숙하지 않다면 별도 코칭 필요.

## 4. 실제 낭독 길이

대본을 보통 속도로 낭독하면 약 **3:30–4:00분**. 시간이 부족하면 3부(탈무드 본론)를 줄이는 것을 권장합니다(원본 대본 기준).

## 5. 출처

תלמוד בבלי, מסכת הוריות דף י"ד ע"א; ברכות דף ס"ד ע"א; ותוספת מהתלמוד הירושלמי (הוריות פ"ג ה"ה).
