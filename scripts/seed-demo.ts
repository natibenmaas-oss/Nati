/**
 * יצירת נתוני דמו לצורך בדיקת המערכת: מורה אחד, כיתה אחת, 8 תלמידים.
 * (טקסטים, שאלות ונתוני קריאה היסטוריים יתווספו בהמשך יחד עם Text/Question Engine.)
 *
 * הרצה:
 *   npx tsx scripts/seed-demo.ts
 *
 * דורש את משתני הסביבה מתוך .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * הסקריפט אידמפוטנטי: אפשר להריץ אותו כמה פעמים בלי ליצור כפילויות
 * (משתמש ב-upsert / בדיקת קיום לפי email).
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { Database } from "../types/database";
import { usernameToStudentEmail } from "../lib/constants";
import { recomputeStudentSkillScores } from "../lib/scoring/skill-scores";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "❌ חסרים NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ב-.env.local"
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_TEACHER = {
  email: "teacher.demo@readwise.local",
  password: "Demo12345!",
  full_name: "רונית לוי",
};

const DEMO_STUDENTS = [
  { username: "shlomi", full_name: "שלומי כהן" },
  { username: "yehonatan", full_name: "יהונתן מזרחי" },
  { username: "israel", full_name: "ישראל דוד" },
  { username: "noa", full_name: "נועה אברהם" },
  { username: "tamar", full_name: "תמר גולן" },
  { username: "eitan", full_name: "איתן שפירא" },
  { username: "maya", full_name: "מאיה בן דוד" },
  { username: "amit", full_name: "עמית פרץ" },
];

interface DemoText {
  title: string;
  content: string;
  grade_level: string;
  difficulty: "קל" | "בינוני" | "מאתגר";
  genre: string;
  estimated_reading_time: number;
  vocabulary_level: string;
  tags: string[];
  cover_icon: string;
  vocab: { word: string; definition: string }[];
}

const DEMO_TEXTS: DemoText[] = [
  {
    title: "תעלומת הכדור שנעלם",
    cover_icon: "⚽",
    genre: "סיפור",
    difficulty: "קל",
    grade_level: "ג׳",
    estimated_reading_time: 5,
    vocabulary_level: "בסיסי",
    tags: ["מסתורין", "חברים", "בית ספר"],
    content:
      "בהפסקה הגדולה שיחקו דניאל ואורי כדורגל בחצר בית הספר. לפתע נשמע פעמון, וכל הילדים מיהרו לכיתות. כשדניאל חזר לחצר בסוף היום כדי לקחת את הכדור, הוא לא היה שם.\n\n" +
      '"מישהו לקח את הכדור שלי!" אמר דניאל בעצב. אורי הציע לחפש רמזים. הם מצאו עקבות בוץ שהובילו אל מאחורי הספרייה. שם, מתחת לספסל, מצאו את הכדור - הוא התגלגל לשם לבד כשהרוח נשבה חזק.\n\n' +
      '"כל הפעם חשבנו שמישהו לקח אותו, וזו הייתה רק הרוח!" צחק אורי. דניאל הבין שלפני שמאשימים מישהו, כדאי לחפש הסבר פשוט יותר. מאז, בכל פעם שמשהו נעלם, הוא בודק קודם אם יש הסבר הגיוני.',
    vocab: [
      { word: "עקבות", definition: "סימנים שמישהו או משהו השאיר אחריו" },
      { word: "רמז", definition: "פרט קטן שעוזר לפתור תעלומה" },
      { word: "הגיוני", definition: "הסבר שמתקבל על הדעת ויש בו היגיון" },
    ],
  },
  {
    title: "מסע אל תוך החלל",
    cover_icon: "🚀",
    genre: "מידע",
    difficulty: "בינוני",
    grade_level: "ד׳",
    estimated_reading_time: 6,
    vocabulary_level: "בינוני",
    tags: ["חלל", "מדע", "כוכבים"],
    content:
      "החלל הוא המקום העצום שמסביב לכדור הארץ, ובו נמצאים השמש, הירח, הכוכבים והפלנטות. במערכת השמש שלנו יש שמונה כוכבי לכת שמקיפים את השמש, וכדור הארץ הוא רק אחד מהם.\n\n" +
      "כדי לחקור את החלל, בני אדם בנו חלליות ולוויינים. בשנת 1969 נחתו בני אדם על הירח בפעם הראשונה, בטיסת אפולו 11. מאז, נשלחו למאדים רכבים רובוטיים שמצלמים ואוספים מידע על הפלנטה האדומה.\n\n" +
      "בחלל אין אוויר, ולכן אסטרונאוטים חייבים ללבוש חליפת חלל מיוחדת שמספקת להם חמצן לנשימה. בתחנת החלל הבינלאומית, שחגה סביב כדור הארץ, חיים ועובדים אסטרונאוטים מארצות שונות יחד, ועורכים ניסויים מדעיים שאי אפשר לעשות על פני כדור הארץ.\n\n" +
      "מדענים ממשיכים לחקור את החלל כדי להבין טוב יותר את היקום, ואולי יום אחד למצוא סימנים לחיים בכוכבים רחוקים אחרים.",
    vocab: [
      { word: "מערכת השמש", definition: "השמש וכל כוכבי הלכת שמסתובבים סביבה" },
      { word: "אסטרונאוט", definition: "אדם שהוכשר לטוס ולעבוד בחלל" },
      { word: "לוויין", definition: "מכשיר שנשלח לחלל ומקיף את כדור הארץ" },
    ],
  },
  {
    title: "איך נוצר גשם",
    cover_icon: "🌧️",
    genre: "מדע",
    difficulty: "קל",
    grade_level: "ג׳",
    estimated_reading_time: 4,
    vocabulary_level: "בסיסי",
    tags: ["מזג אוויר", "מים", "טבע"],
    content:
      "כשהשמש מחממת את המים באגמים, בנהרות ובים, חלק מהמים הופך לאדים ועולה לשמיים. תהליך זה נקרא אידוי. האדים הם קטנים כל כך שאי אפשר לראות אותם.\n\n" +
      "כשהאדים מגיעים לגובה רב, האוויר שם קר יותר, והאדים הופכים בחזרה לטיפות מים זעירות. טיפות המים מתקבצות יחד ויוצרות עננים. זהו תהליך שנקרא התעבות.\n\n" +
      'כשהעננים מתמלאים בהרבה מים, הטיפות נעשות כבדות מכדי להישאר באוויר, והן נופלות אלינו כגשם. לפעמים, כשקר מאוד בעננים, הטיפות קופאות ונופלות כשלג או ברד במקום גשם.\n\n' +
      "כל המים שיורדים כגשם חוזרים בסוף לנהרות, לאגמים ולים - וכך המחזור מתחיל שוב מההתחלה. תהליך זה נקרא מחזור המים בטבע, והוא קורה שוב ושוב, כל הזמן.",
    vocab: [
      { word: "אידוי", definition: "תהליך שבו מים הופכים לאדים ועולים לאוויר" },
      { word: "התעבות", definition: "תהליך שבו אדים הופכים בחזרה לטיפות מים" },
      { word: "מחזור המים", definition: "התהליך החוזר על עצמו שבו מים עוברים בין הים, העננים והגשם" },
    ],
  },
  {
    title: "דוד בן-גוריון ומגילת העצמאות",
    cover_icon: "🇮🇱",
    genre: "היסטוריה",
    difficulty: "בינוני",
    grade_level: "ה׳",
    estimated_reading_time: 6,
    vocabulary_level: "עשיר",
    tags: ["עצמאות", "היסטוריה", "מדינת ישראל"],
    content:
      'ב-14 במאי 1948, בבניין מוזיאון תל אביב, עמד דוד בן-גוריון וקרא בקול את מגילת העצמאות. באותו רגע הוכרזה הקמתה של מדינת ישראל - מדינה יהודית עצמאית לאחר אלפי שנים בהם היהודים חיו בפזורה, בארצות רבות ברחבי העולם.\n\n' +
      "בן-גוריון היה מנהיג בכיר בתנועה הציונית, שפעלה במשך שנים רבות כדי להקים בית לאומי לעם היהודי בארץ ישראל. הוא ואנשים רבים אחרים עבדו קשה, כתבו, נאמו ושכנעו מדינות בעולם לתמוך ברעיון הזה.\n\n" +
      "מגילת העצמאות שקרא בן-גוריון קבעה את העקרונות שעליהם תוקם המדינה החדשה: שוויון זכויות לכל אזרחיה, חופש דת ומצפון, ושמירה על זכויות האדם. מיד לאחר ההכרעה, פרצה מלחמה, שכן מדינות שכנות לא הסכימו להקמת המדינה.\n\n" +
      "היום, יום העצמאות מצוין בישראל מדי שנה בחגיגות, בטקסים ובזיכרון לחשיבות אותו רגע היסטורי.",
    vocab: [
      { word: "עצמאות", definition: "מצב שבו מדינה שולטת בעצמה, ולא נשלטת על ידי מדינה אחרת" },
      { word: "פזורה", definition: "פיזור של קבוצת אנשים (כאן: העם היהודי) במקומות רבים בעולם" },
      { word: "ציונות", definition: "התנועה שפעלה להקמת בית לאומי לעם היהודי בארץ ישראל" },
    ],
  },
  {
    title: "מיחזור בעיר שלנו",
    cover_icon: "♻️",
    genre: "אקטואליה",
    difficulty: "קל",
    grade_level: "ד׳",
    estimated_reading_time: 4,
    vocabulary_level: "בסיסי",
    tags: ["סביבה", "מיחזור", "קיימות"],
    content:
      'בשנים האחרונות מתרבים בישראל פחי המיחזור הכתומים, שנועדו לאיסוף אריזות - בקבוקי פלסטיק, קופסאות קרטון ושקיות ניילון נקיות. כשמפרידים את הפסולת נכון, אפשר להשתמש בחומרים שוב, במקום לזרוק אותם לטבע.\n\n' +
      "מיחזור עוזר לסביבה בכמה דרכים: הוא מפחית את כמות האשפה שמצטברת במזבלות, חוסך משאבי טבע כמו עצים ומים, ומפחית זיהום אוויר שנגרם מייצור חומרים חדשים.\n\n" +
      'תלמידים רבים בבתי ספר בארץ משתתפים בפרויקטים של מיחזור - הם אוספים בקבוקים, יוצרים מהם דברים חדשים, ולומדים כמה חשוב לשמור על כדור הארץ. "כל בקבוק שממחזרים הוא צעד קטן שעוזר לכולנו," אומרת מורה לטבע בבית ספר יסודי.\n\n' +
      "גם בבית אפשר לעזור: להפריד זבל, לכבות אורות מיותרים ולחסוך במים. שינויים קטנים כאלה, כשכולם עושים אותם ביחד, יכולים לעשות הבדל גדול.",
    vocab: [
      { word: "מיחזור", definition: "תהליך שבו חומרים משומשים הופכים לחומרים חדשים במקום להיזרק" },
      { word: "משאבי טבע", definition: "דברים שהטבע נותן לנו כמו מים, עצים ואוויר" },
      { word: "זיהום אוויר", definition: "כשהאוויר מתלכלך מעשן וחומרים מזיקים" },
    ],
  },
  {
    title: "הנסיכה שלא רצתה לישון",
    cover_icon: "🌙",
    genre: "טקסט דמיוני",
    difficulty: "קל",
    grade_level: "ג׳",
    estimated_reading_time: 5,
    vocabulary_level: "בסיסי",
    tags: ["דמיון", "פנטזיה", "לילה"],
    content:
      'בממלכה רחוקה גרה נסיכה קטנה בשם לירז, שלא אהבה ללכת לישון. בכל ערב היא הייתה מתחבאת מתחת למיטה, מטפסת על העץ בחצר, או בורחת אל גן הארמון.\n\n' +
      '"למה עלייך לישון?" שאלה אותה ינשוף חכם שישב על ענף. "כי אני לא רוצה לפספס שום דבר!" ענתה לירז. הינשוף חייך ואמר: "בואי איתי, אראה לך מה קורה בלילה."\n\n' +
      "הינשוף לקח את לירז לטיסה קסומה מעל הממלכה. הם ראו כוכבים נוצצים, ציפורי לילה עפות בשקט, ופרחים מיוחדים שנפתחים רק בחשיכה. לירז הבינה שיש קסם גם בלילה, לא רק ביום.\n\n" +
      '"אבל אם לא אישן, לא אהיה ערנית מחר לראות את כל הקסם הזה," אמרה לירז לינשוף. הוא ליווה אותה חזרה למיטה, ולירז נרדמה עם חיוך, כי הבינה ששינה טובה היא חלק מההרפתקה - היא נותנת כוח לגלות עוד ועוד קסמים בכל יום חדש.',
    vocab: [
      { word: "ממלכה", definition: "מדינה שבה שולט מלך או מלכה" },
      { word: "קסום", definition: "משהו מיוחד ומופלא, כמו בסיפורי קסמים" },
      { word: "ערנית", definition: "ערה, מרוכזת ומוכנה לפעולה" },
    ],
  },
  {
    title: "איך בנוי טלפון חכם",
    cover_icon: "📱",
    genre: "טקסט עיוני",
    difficulty: "בינוני",
    grade_level: "ה׳",
    estimated_reading_time: 6,
    vocabulary_level: "בינוני",
    tags: ["טכנולוגיה", "מדעים"],
    content:
      "טלפון חכם נראה כמו מכשיר פשוט, אבל בתוכו מסתתרים חלקים רבים שעובדים יחד. המסך, למשל, הוא לא רק מקום להצגת תמונות - הוא גם חיישן מגע, שמזהה בדיוק היכן האצבע שלנו נוגעת בו.\n\n" +
      "בתוך הטלפון נמצא המעבד - מעין 'מוח' קטן שמבצע את כל החישובים ומריץ את האפליקציות. לצידו יושבת הזיכרון, ששומרת את התמונות, ההודעות והמשחקים שלנו.\n\n" +
      "הסוללה מספקת חשמל לכל החלקים האלה, וכשהיא נגמרת, צריך לחבר את הטלפון לטעינה. המצלמות, שנמצאות בקדמת המכשיר ובגבו, קולטות אור והופכות אותו לתמונה דיגיטלית באמצעות חיישן מיוחד.\n\n" +
      "כדי להתחבר לאינטרנט, הטלפון משתמש בגלי רדיו - אותה טכנולוגיה שמשמשת גם למכשירי רדיו ולוויינים - כדי לשלוח ולקבל מידע דרך האוויר, בלי שום כבל.",
    vocab: [
      { word: "חיישן", definition: "חלק במכשיר שמזהה ומודד דברים כמו מגע, אור או תנועה" },
      { word: "מעבד", definition: "החלק שמבצע את החישובים במחשב או בטלפון" },
      { word: "דיגיטלי", definition: "מידע שנשמר ומעובד באמצעות מספרים ומחשבים" },
    ],
  },
  {
    title: "החברות של יעל ונועה",
    cover_icon: "🤝",
    genre: "סיפור",
    difficulty: "בינוני",
    grade_level: "ד׳",
    estimated_reading_time: 6,
    vocabulary_level: "בינוני",
    tags: ["חברות", "רגשות", "בית ספר"],
    content:
      'יעל ונועה היו חברות הכי טובות מגן חובה. אבל השבוע, כשנועה קיבלה ציון גבוה יותר ממנה במבחן, יעל הרגישה קנאה - והפסיקה לדבר איתה בהפסקות.\n\n' +
      'נועה לא הבינה מה קרה. "למה את מתעלמת ממני?" שאלה בעצב בהפסקת הצהריים. יעל הסתכלה הצידה ולא ענתה מיד. לבסוף אמרה בשקט: "התבאסתי שקיבלת ציון יותר גבוה ממני. הרגשתי שאני לא מספיק טובה."\n\n' +
      'נועה התיישבה לידה. "אבל את הכי טובה בציור בכל הכיתה! אני בכלל מקנאה בך על זה." יעל הופתעה - היא לא ידעה שגם לנועה יש דברים שהיא מקנאה בהם.\n\n' +
      'הן הבינו שלכל אחת יש דברים שהיא טובה בהם, ושאי אפשר להיות הכי טובות בהכל. "בואי נעזור אחת לשנייה במקום להתחרות," הציעה נועה. יעל חייכה והנהנה. מאותו יום, כשאחת מהן הצליחה במשהו, השנייה שמחה איתה באמת.',
    vocab: [
      { word: "קנאה", definition: "תחושה לא נעימה כשמישהו אחר מצליח או מקבל משהו שרצינו" },
      { word: "התבאסתי", definition: "הרגשתי מאוכזב/ת או עצוב/ה (לשון דיבור)" },
      { word: "להתחרות", definition: "לנסות להיות הכי טוב לעומת מישהו אחר" },
    ],
  },
  {
    title: "בעלי חיים שמתחפשים",
    cover_icon: "🦎",
    genre: "מדע",
    difficulty: "מאתגר",
    grade_level: "ה׳",
    estimated_reading_time: 7,
    vocabulary_level: "עשיר",
    tags: ["בעלי חיים", "טבע", "הישרדות"],
    content:
      "בטבע, בעלי חיים רבים פיתחו יכולת מיוחדת להסתתר מפני אויבים - הסוואה. הסוואה היא היכולת להיראות דומה מאוד לסביבה, כך שקשה מאוד לזהות את בעל החיים.\n\n" +
      "הזיקית, למשל, מסוגלת לשנות את צבע עורה בהתאם לצבעי הסביבה שבה היא נמצאת. תהליך זה קורה בזכות תאים מיוחדים בעורה שמכילים פיגמנטים - חומרים צבעוניים שמתרחבים או מתכווצים.\n\n" +
      "חרק המקל, לעומת זאת, נראה בדיוק כמו ענף עץ יבש. הוא נשאר בלתי נע במשך שעות ארוכות, וכך אפילו ציפורים שמחפשות אותו כמעט ולא מצליחות להבחין בו על רקע הענפים.\n\n" +
      'גם דגי הים השטוח מסוגלים להסתוות לקרקעית הים - הם משנים את דוגמת עורם כדי להתמזג עם החול או האבנים. יש הבדל בין הסוואה "פסיבית", שמטרתה להסתתר מטורפים, לבין הסוואה "אקטיבית", שבה טורף מתחפש כדי לתפוס טרף מבלי שיבחינו בו.\n\n' +
      "היכולת הזו התפתחה במשך מיליוני שנות אבולוציה, כאשר בעלי חיים שהיו טובים יותר בהסתוות שרדו והעבירו את התכונה הזו לצאצאיהם.",
    vocab: [
      { word: "הסוואה", definition: "יכולת של בעל חיים להיראות דומה לסביבתו כדי להסתתר" },
      { word: "טורף", definition: "בעל חיים שצד ואוכל בעלי חיים אחרים" },
      { word: "אבולוציה", definition: "תהליך ארוך שבו מינים של בעלי חיים משתנים במשך דורות רבים" },
    ],
  },
  {
    title: "הצב והארנב",
    cover_icon: "🐢",
    genre: "סיפור",
    difficulty: "קל",
    grade_level: "ג׳",
    estimated_reading_time: 4,
    vocabulary_level: "בסיסי",
    tags: ["משל", "מוסר השכל", "חיות"],
    content:
      'ארנב אחד היה גאה מאוד במהירות שלו, ותמיד צחק על הצב האיטי. יום אחד הציע הצב תחרות ריצה, והארנב הסכים מיד בביטחון עצום. "אני אנצח בקלות!" חשב לעצמו.\n\n' +
      "כשהתחרות התחילה, הארנב זינק קדימה ומהר מאוד השאיר את הצב הרחק מאחור. הוא היה כל כך בטוח בניצחון שהחליט לעצור לנוח קצת בצל עץ, ובלי לשים לב - נרדם.\n\n" +
      "בינתיים, הצב המשיך לצעוד לאט אך בלי הפסקה, צעד אחר צעד, בלי לוותר. הוא לא היה הכי מהיר, אבל הוא היה עקבי ומתמיד.\n\n" +
      'כשהארנב התעורר, הוא ראה שהצב כבר קרוב מאוד לקו הסיום. הוא רץ במלוא הכוח, אבל היה מאוחר מדי - הצב חצה את הקו ראשון! מהסיפור הזה למדים שהתמדה וסבלנות חשובות לפעמים יותר מכישרון או מהירות.',
    vocab: [
      { word: "עקבי", definition: "מי שממשיך לעשות משהו באופן קבוע, בלי להפסיק" },
      { word: "התמדה", definition: "היכולת להמשיך לנסות ולא לוותר" },
      { word: "מוסר השכל", definition: "הלקח או המסר שאפשר ללמוד מסיפור" },
    ],
  },
  {
    title: "איך בונים גשר",
    cover_icon: "🌉",
    genre: "טקסט עיוני",
    difficulty: "מאתגר",
    grade_level: "ו׳",
    estimated_reading_time: 7,
    vocabulary_level: "עשיר",
    tags: ["הנדסה", "בנייה", "מדעים"],
    content:
      "גשרים מאפשרים לנו לחצות נהרות, ערוצים וכבישים בבטחה. לפני שמתחילים לבנות גשר, מהנדסים צריכים לתכנן אותו בקפידה, כדי שיוכל לשאת את משקל המכוניות, הרכבות או ההולכים רגל שיעברו עליו.\n\n" +
      "אחד האתגרים המרכזיים בבניית גשר הוא ההתמודדות עם כוחות פיזיקליים כמו משקל, מתיחה ולחיצה. הגשר חייב להיות חזק דיו כדי לא לקרוס, אך גם גמיש דיו כדי להתמודד עם רוח ורעידות.\n\n" +
      'סוג אחד נפוץ הוא גשר קורות, הפשוט ביותר לבנייה - שני עמודים תומכים בקורה ישרה שמונחת ביניהם. סוג מתקדם יותר הוא גשר תלוי, שבו כבלים חזקים ותלויים מגדלים גבוהים מחזיקים את הגשר באוויר, כמו גשר הזהב בסן פרנסיסקו.\n\n' +
      "לפני הבנייה בפועל, מהנדסים בונים דגמים קטנים ומריצים סימולציות במחשב כדי לבדוק שהגשר יעמוד בעומסים ובתנאי מזג האוויר השונים. רק לאחר שהתכנון אושר, מתחילה הבנייה עצמה, שיכולה להימשך חודשים ואף שנים.",
    vocab: [
      { word: "מהנדס", definition: "אדם שמתכנן ובונה מבנים, מכונות או מערכות" },
      { word: "עומס", definition: "המשקל או הכוח שמופעל על מבנה" },
      { word: "סימולציה", definition: "בדיקה או ניסוי הנעשים במחשב כדי לחזות מה יקרה במציאות" },
    ],
  },
];

interface DemoQuestion {
  type: "explicit" | "vocabulary" | "main_idea" | "evidence" | "inference" | "mcq";
  skillKey: string;
  question_text: string;
  correct_answer?: string;
  options?: { label: string; correct: boolean }[];
}

// 5 שאלות לכל טקסט (מידע מפורש, אוצר מילים, רעיון מרכזי, הוכחה, הסקת מסקנות) —
// סה"כ 55 שאלות, לפי דרישת ה-Seed Data (סעיף 25 במפרט: לפחות 50 שאלות)
const DEMO_QUESTIONS: Record<string, DemoQuestion[]> = {
  "תעלומת הכדור שנעלם": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "מי שיחק כדורגל עם דניאל בהפסקה?",
      options: [
        { label: "אורי", correct: true },
        { label: "יעל", correct: false },
        { label: "נועה", correct: false },
        { label: "הינשוף", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה המשמעות של המילה 'עקבות' בטקסט?",
      correct_answer: "סימנים שמישהו או משהו השאיר אחריו, כמו סימני בוץ",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הסיפור?",
      correct_answer: "לפני שמאשימים מישהו כדאי לחפש קודם הסבר הגיוני ופשוט",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזו שורה בטקסט עוזרת לדעת שהכדור לא נגנב על ידי מישהו?",
      correct_answer: "הוא התגלגל לשם לבד כשהרוח נשבה חזק",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "למה דניאל ואורי חשבו בהתחלה שמישהו לקח את הכדור?",
      correct_answer: "כי הכדור נעלם בפתאומיות והם לא ידעו שהרוח היא זו שהזיזה אותו",
    },
  ],
  "מסע אל תוך החלל": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "כמה כוכבי לכת יש במערכת השמש?",
      options: [
        { label: "6", correct: false },
        { label: "7", correct: false },
        { label: "8", correct: true },
        { label: "9", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה זה 'אסטרונאוט'?",
      correct_answer: "אדם שהוכשר לטוס ולעבוד בחלל",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הטקסט?",
      correct_answer: "בני אדם חוקרים את החלל באמצעות חלליות, לוויינים ותחנות חלל",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזה משפט בטקסט מסביר למה אסטרונאוטים לובשים חליפת חלל?",
      correct_answer: "בחלל אין אוויר, ולכן אסטרונאוטים חייבים ללבוש חליפת חלל מיוחדת שמספקת להם חמצן לנשימה",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "למה אי אפשר לנשום בחלל בלי חליפה מיוחדת?",
      correct_answer: "כי אין בחלל אוויר או חמצן",
    },
  ],
  "איך נוצר גשם": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "איך נקרא התהליך שבו מים הופכים לאדים?",
      options: [
        { label: "התעבות", correct: false },
        { label: "אידוי", correct: true },
        { label: "קיפאון", correct: false },
        { label: "מחזור", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה ההבדל בין אידוי להתעבות?",
      correct_answer: "אידוי הוא הפיכת מים לאדים, והתעבות היא הפיכת אדים בחזרה לטיפות מים",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הטקסט?",
      correct_answer: "מחזור המים בטבע - איך מים עוברים בין הים, העננים והגשם וחוזר חלילה",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזו שורה מסבירה למה לפעמים יורד שלג במקום גשם?",
      correct_answer: "כשקר מאוד בעננים, הטיפות קופאות ונופלות כשלג או ברד במקום גשם",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "מה יקרה אם השמש תפסיק לחמם את המים באגמים ובימים?",
      correct_answer: "לא יהיה אידוי, לא ייווצרו עננים, ולא יירד גשם",
    },
  ],
  "דוד בן-גוריון ומגילת העצמאות": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "באיזה תאריך הוכרזה מדינת ישראל?",
      options: [
        { label: "14 במאי 1948", correct: true },
        { label: "5 ביוני 1967", correct: false },
        { label: "29 בנובמבר 1947", correct: false },
        { label: "1 בינואר 1948", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה המשמעות של המילה 'פזורה'?",
      correct_answer: "פיזור של קבוצת אנשים, כמו העם היהודי, במקומות רבים בעולם",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הטקסט?",
      correct_answer: "הכרזת העצמאות של מדינת ישראל בהובלת דוד בן-גוריון, לאחר שנים של פעילות ציונית",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "אילו עקרונות קבעה מגילת העצמאות? הביאו שורה מהטקסט",
      correct_answer: "שוויון זכויות לכל אזרחיה, חופש דת ומצפון, ושמירה על זכויות האדם",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "למה פרצה מלחמה מיד לאחר ההכרזה על המדינה?",
      correct_answer: "כי מדינות שכנות לא הסכימו להקמת המדינה",
    },
  ],
  "מיחזור בעיר שלנו": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "מה צבע פחי המיחזור לאיסוף אריזות בישראל?",
      options: [
        { label: "ירוק", correct: false },
        { label: "כתום", correct: true },
        { label: "כחול", correct: false },
        { label: "אדום", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה זה 'זיהום אוויר'?",
      correct_answer: "כשהאוויר מתלכלך מעשן וחומרים מזיקים",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הטקסט?",
      correct_answer: "מיחזור עוזר לסביבה, וכל אחד יכול לתרום לכך גם בבית וגם בבית הספר",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזו שורה בטקסט מסבירה איך מיחזור עוזר לסביבה?",
      correct_answer: "מיחזור מפחית את כמות האשפה, חוסך משאבי טבע ומפחית זיהום אוויר",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "למה חשוב להפריד בין סוגי הפסולת השונים?",
      correct_answer: "כדי שיהיה אפשר למחזר כל חומר בנפרד ולהשתמש בו שוב",
    },
  ],
  "הנסיכה שלא רצתה לישון": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "מי לקח את לירז לטיסה קסומה בלילה?",
      options: [
        { label: "מלך", correct: false },
        { label: "ינשוף", correct: true },
        { label: "דרקון", correct: false },
        { label: "חברה שלה", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה המשמעות של המילה 'קסום' בטקסט?",
      correct_answer: "משהו מיוחד ומופלא, כמו בסיפורי קסמים",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הסיפור?",
      correct_answer: "יש קסם גם בלילה, אבל שינה טובה חשובה כדי ליהנות מהיום שלמחרת",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזו שורה מראה שלירז הבינה בסוף למה חשוב לישון?",
      correct_answer: "שינה טובה היא חלק מההרפתקה - היא נותנת כוח לגלות עוד ועוד קסמים בכל יום חדש",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "למה לירז לא רצתה לישון בהתחלה?",
      correct_answer: "היא חששה שתפספס דברים מעניינים שקורים בזמן שהיא ישנה",
    },
  ],
  "איך בנוי טלפון חכם": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "מה תפקיד המעבד בטלפון?",
      options: [
        { label: "לצלם תמונות", correct: false },
        { label: "לבצע חישובים ולהריץ אפליקציות", correct: true },
        { label: "לשמור חשמל", correct: false },
        { label: "לקלוט גלי רדיו", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה זה 'חיישן'?",
      correct_answer: "חלק במכשיר שמזהה ומודד דברים כמו מגע, אור או תנועה",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הטקסט?",
      correct_answer: "טלפון חכם בנוי מחלקים רבים שעובדים יחד - מסך, מעבד, זיכרון, סוללה ומצלמות",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזה משפט מסביר איך הטלפון מתחבר לאינטרנט?",
      correct_answer: "הטלפון משתמש בגלי רדיו כדי לשלוח ולקבל מידע דרך האוויר, בלי כבל",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "מה יקרה לטלפון אם הסוללה תיגמר?",
      correct_answer: "כל החלקים האחרים לא יקבלו חשמל והטלפון ייכבה, עד שיטענו אותו מחדש",
    },
  ],
  "החברות של יעל ונועה": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "למה יעל הפסיקה לדבר עם נועה?",
      options: [
        { label: "היא הייתה עסוקה", correct: false },
        { label: "היא הרגישה קנאה בגלל הציון", correct: true },
        { label: "היא כעסה על ציור", correct: false },
        { label: "היא עברה כיתה", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה המשמעות של המילה 'קנאה'?",
      correct_answer: "תחושה לא נעימה כשמישהו אחר מצליח או מקבל משהו שרצינו",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הסיפור?",
      correct_answer: "עדיף לעזור ולשמוח אחת בשביל השנייה מאשר להתחרות",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזו שורה מראה שגם נועה מקנאה ביעל?",
      correct_answer: "את הכי טובה בציור בכל הכיתה! אני בכלל מקנאה בך על זה",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "מה לדעתך גרם ליעל להרגיש טוב יותר בסוף הסיפור?",
      correct_answer: "היא גילתה שגם לנועה יש דברים שהיא מקנאה בהם, וזה גרם לה להרגיש פחות לבד",
    },
  ],
  "בעלי חיים שמתחפשים": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "איזה בעל חיים נראה כמו ענף עץ יבש?",
      options: [
        { label: "זיקית", correct: false },
        { label: "חרק המקל", correct: true },
        { label: "דג ים שטוח", correct: false },
        { label: "ינשוף", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה זה 'הסוואה'?",
      correct_answer: "יכולת של בעל חיים להיראות דומה לסביבתו כדי להסתתר",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הטקסט?",
      correct_answer: "בעלי חיים רבים פיתחו הסוואה כדי להסתתר מטורפים או לצוד טרף",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזה משפט מסביר איך הזיקית משנה צבע?",
      correct_answer: "תאים מיוחדים בעורה מכילים פיגמנטים שמתרחבים או מתכווצים",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "למה בעלי חיים עם הסוואה טובה שורדים יותר?",
      correct_answer: "כי קשה יותר לטורפים למצוא אותם, ולכן יש להם סיכוי גבוה יותר לשרוד ולהתרבות",
    },
  ],
  "הצב והארנב": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "מי ניצח במרוץ?",
      options: [
        { label: "הארנב", correct: false },
        { label: "הצב", correct: true },
        { label: "תיקו", correct: false },
        { label: "אף אחד לא סיים", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מה המשמעות של המילה 'התמדה'?",
      correct_answer: "היכולת להמשיך לנסות ולא לוותר",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו מוסר ההשכל של הסיפור?",
      correct_answer: "התמדה וסבלנות חשובות לפעמים יותר מכישרון או מהירות",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזו שורה מראה שהארנב היה בטוח מדי בעצמו?",
      correct_answer: "הוא היה כל כך בטוח בניצחון שהחליט לעצור לנוח קצת בצל עץ",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "למה הצב הצליח לנצח למרות שהוא איטי יותר מהארנב?",
      correct_answer: "כי הוא המשיך לצעוד בלי הפסקה בזמן שהארנב נרדם באמצע המרוץ",
    },
  ],
  "איך בונים גשר": [
    {
      type: "mcq",
      skillKey: "explicit_info",
      question_text: "מהו גשר הקורות?",
      options: [
        { label: "גשר עם כבלים תלויים", correct: false },
        { label: "הגשר הפשוט ביותר לבנייה", correct: true },
        { label: "גשר שנבנה מתחת למים", correct: false },
        { label: "גשר זמני בלבד", correct: false },
      ],
    },
    {
      type: "vocabulary",
      skillKey: "vocabulary",
      question_text: "מהו תפקידו של מהנדס?",
      correct_answer: "אדם שמתכנן ובונה מבנים, מכונות או מערכות",
    },
    {
      type: "main_idea",
      skillKey: "main_idea",
      question_text: "מהו הרעיון המרכזי של הטקסט?",
      correct_answer: "בניית גשר דורשת תכנון קפדני כדי שיהיה גם חזק וגם גמיש",
    },
    {
      type: "evidence",
      skillKey: "explicit_info",
      question_text: "איזה משפט מסביר למה גשר חייב להיות גם חזק וגם גמיש?",
      correct_answer: "הגשר חייב להיות חזק דיו כדי לא לקרוס, אך גם גמיש דיו כדי להתמודד עם רוח ורעידות",
    },
    {
      type: "inference",
      skillKey: "inference",
      question_text: "למה מהנדסים בונים דגמים קטנים ומריצים סימולציות לפני הבנייה בפועל?",
      correct_answer: "כדי לבדוק שהגשר יעמוד בעומסים ובתנאי מזג האוויר, לפני שמשקיעים בבנייה האמיתית",
    },
  ],
};

async function findUserByEmail(email: string) {
  // Admin API אינו תומך בחיפוש לפי email ישירות בכל הגרסאות — נשתמש ב-listUsers עם pagination קטנה,
  // מספיק לכמות הדמו הקטנה כאן.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureTeacher() {
  let user = await findUserByEmail(DEMO_TEACHER.email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_TEACHER.email,
      password: DEMO_TEACHER.password,
      email_confirm: true,
      user_metadata: { role: "teacher", full_name: DEMO_TEACHER.full_name },
    });
    if (error) throw error;
    user = data.user;
    console.log(`✅ נוצר משתמש מורה: ${DEMO_TEACHER.email}`);
  } else {
    console.log(`↪️  משתמש מורה כבר קיים: ${DEMO_TEACHER.email}`);
  }

  return user!;
}

async function ensureClass(teacherId: string) {
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("name", 'כיתה ד׳1')
    .maybeSingle();

  if (existing) {
    console.log("↪️  כיתת הדמו כבר קיימת");
    return existing.id;
  }

  const { data, error } = await supabase
    .from("classes")
    .insert({ teacher_id: teacherId, name: 'כיתה ד׳1', grade_level: "ד׳" })
    .select("id")
    .single();
  if (error) throw error;
  console.log("✅ נוצרה כיתת דמו: כיתה ד׳1");
  return data.id;
}

async function ensureStudent(
  student: { username: string; full_name: string },
  classId: string
) {
  const email = usernameToStudentEmail(student.username);
  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "Demo1234!",
      email_confirm: true,
      user_metadata: { role: "student", full_name: student.full_name, username: student.username },
    });
    if (error) throw error;
    user = data.user;
    console.log(`✅ נוצר תלמיד: ${student.full_name} (${student.username})`);
  } else {
    console.log(`↪️  תלמיד כבר קיים: ${student.full_name}`);
  }

  await supabase.from("students").update({ class_id: classId }).eq("id", user!.id);
  await supabase
    .from("class_members")
    .upsert({ class_id: classId, student_id: user!.id }, { onConflict: "class_id,student_id" });
}

async function ensureQuestionsForText(textId: string, title: string, skillIdByKey: Map<string, string>) {
  const demoQuestions = DEMO_QUESTIONS[title];
  if (!demoQuestions) return;

  const { data: existingQuestions } = await supabase
    .from("questions")
    .select("question_text")
    .eq("text_id", textId);
  const existingTexts = new Set((existingQuestions ?? []).map((q) => q.question_text));

  let created = 0;
  for (const [index, q] of demoQuestions.entries()) {
    if (existingTexts.has(q.question_text)) continue;

    const skillId = skillIdByKey.get(q.skillKey);
    const options = q.options?.map((o, i) => ({ key: String(i + 1), label: o.label }));
    const correctOption = q.options?.findIndex((o) => o.correct);
    const correctAnswer =
      q.type === "mcq" && correctOption !== undefined && correctOption >= 0
        ? String(correctOption + 1)
        : q.correct_answer;

    const { error } = await supabase.from("questions").insert({
      text_id: textId,
      skill_id: skillId ?? null,
      type: q.type,
      question_text: q.question_text,
      options: options ?? null,
      correct_answer: correctAnswer ?? null,
      difficulty: "בינוני",
      order_index: index,
    });
    if (error) console.error(`❌ יצירת שאלה נכשלה (${title}):`, error);
    else created += 1;
  }
  if (created > 0) console.log(`   ↳ נוספו ${created} שאלות ל"${title}"`);
}

async function ensureTexts(teacherId: string) {
  const { data: skills } = await supabase.from("skills").select("id, key");
  const skillIdByKey = new Map((skills ?? []).map((s) => [s.key, s.id]));

  for (const demoText of DEMO_TEXTS) {
    const { data: existing } = await supabase
      .from("texts")
      .select("id")
      .eq("title", demoText.title)
      .maybeSingle();

    if (existing) {
      console.log(`↪️  טקסט כבר קיים: ${demoText.title}`);
      await ensureQuestionsForText(existing.id, demoText.title, skillIdByKey);
      continue;
    }

    const { vocab, ...textFields } = demoText;
    const { data: created, error } = await supabase
      .from("texts")
      .insert({ ...textFields, created_by: teacherId, is_ai_generated: false })
      .select("id")
      .single();

    if (error || !created) {
      console.error(`❌ יצירת הטקסט "${demoText.title}" נכשלה:`, error);
      continue;
    }

    if (vocab.length > 0) {
      await supabase
        .from("vocabulary_words")
        .insert(vocab.map((v) => ({ text_id: created.id, word: v.word, definition: v.definition })));
    }

    console.log(`✅ נוצר טקסט: ${demoText.title}`);
    await ensureQuestionsForText(created.id, demoText.title, skillIdByKey);
  }
}

interface HistoricalAnswer {
  // אחוז ההתאמה: לשאלת mcq - true/false, לשאלה פתוחה - ai_score מדומה (0-100)
  // (בסביבת אמת, ai_score נקבע ע"י lib/ai/evaluateAnswer - כאן מדמים תוצאה כדי שיהיו
  // נתוני קריאה היסטוריים אמיתיים להדגמה, כנדרש בסעיף 25 במפרט)
  mcqCorrect: boolean;
  vocabularyScore: number;
  mainIdeaScore: number;
  evidenceScore: number;
  inferenceScore: number;
  wpmEstimated: number;
  reflection: string;
}

const HISTORICAL_PATTERNS: Record<string, HistoricalAnswer> = {
  shlomi: {
    mcqCorrect: true,
    vocabularyScore: 85,
    mainIdeaScore: 80,
    evidenceScore: 82,
    inferenceScore: 45, // מתקשה בהסקת מסקנות
    wpmEstimated: 95,
    reflection: "למדתי שיש שמונה כוכבי לכת במערכת השמש ושאסטרונאוטים צריכים חליפה מיוחדת.",
  },
  yehonatan: {
    mcqCorrect: true,
    vocabularyScore: 75,
    mainIdeaScore: 40, // מתקשה בזיהוי רעיון מרכזי
    evidenceScore: 70,
    inferenceScore: 65,
    wpmEstimated: 58, // קצב קריאה נמוך יחסית
    reflection: "למדתי על החלל ועל אסטרונאוטים.",
  },
  israel: {
    mcqCorrect: true,
    vocabularyScore: 35, // מתקשה באוצר מילים
    mainIdeaScore: 78,
    evidenceScore: 80,
    inferenceScore: 72,
    wpmEstimated: 88,
    reflection: "החלל הוא מקום ענק עם הרבה כוכבים.",
  },
  noa: {
    mcqCorrect: true,
    vocabularyScore: 88,
    mainIdeaScore: 90,
    evidenceScore: 85,
    inferenceScore: 80,
    wpmEstimated: 102,
    reflection: "אני חושבת שהכי מעניין זה שאנשים גרים בתחנת החלל ועושים שם ניסויים מדעיים.",
  },
};

async function ensureAssignmentAndHistory(teacherId: string, classId: string) {
  const { data: text } = await supabase
    .from("texts")
    .select("id")
    .eq("title", "מסע אל תוך החלל")
    .maybeSingle();
  if (!text) return;

  const { data: questions } = await supabase
    .from("questions")
    .select("id, type, skill_id")
    .eq("text_id", text.id)
    .order("order_index");
  if (!questions || questions.length < 5) return;
  const [mcqQ, vocabQ, mainIdeaQ, evidenceQ, inferenceQ] = questions;

  const { data: inferenceSkill } = await supabase
    .from("skills")
    .select("id")
    .eq("key", "inference")
    .single();

  let { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("class_id", classId)
    .eq("text_id", text.id)
    .maybeSingle();

  if (!assignment) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    const { data: created, error } = await supabase
      .from("assignments")
      .insert({
        teacher_id: teacherId,
        class_id: classId,
        text_id: text.id,
        title: 'משימת קריאה - "מסע אל תוך החלל"',
        instructions: "קראו את הטקסט וענו על השאלות",
        skill_focus: inferenceSkill ? [inferenceSkill.id] : [],
        due_date: dueDate.toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    if (error || !created) {
      console.error("❌ יצירת משימת הדמו נכשלה:", error);
      return;
    }
    assignment = created;
    console.log('✅ נוצרה משימת קריאה: "מסע אל תוך החלל"');
  } else {
    console.log("↪️  משימת הדמו כבר קיימת");
  }

  for (const [username, pattern] of Object.entries(HISTORICAL_PATTERNS)) {
    const user = await findUserByEmail(usernameToStudentEmail(username));
    if (!user) continue;

    const { data: existingSession } = await supabase
      .from("reading_sessions")
      .select("id")
      .eq("student_id", user.id)
      .eq("assignment_id", assignment.id)
      .maybeSingle();
    if (existingSession) {
      console.log(`↪️  נתוני קריאה היסטוריים כבר קיימים עבור ${username}`);
      continue;
    }

    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - 3);
    const durationSeconds = 210;

    const { data: session, error: sessionError } = await supabase
      .from("reading_sessions")
      .insert({
        student_id: user.id,
        text_id: text.id,
        assignment_id: assignment.id,
        reading_mode: "silent",
        status: "completed",
        duration_seconds: durationSeconds,
        wpm_estimated: pattern.wpmEstimated,
        is_estimated: true,
        reflection_text: pattern.reflection,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error(`❌ יצירת מפגש קריאה היסטורי נכשלה (${username}):`, sessionError);
      continue;
    }

    await supabase.from("answers").insert([
      {
        session_id: session.id,
        question_id: mcqQ.id,
        student_answer: "1",
        is_correct: pattern.mcqCorrect,
      },
      {
        session_id: session.id,
        question_id: vocabQ.id,
        student_answer: "תשובת דמו",
        ai_score: pattern.vocabularyScore,
        is_correct: pattern.vocabularyScore >= 60,
      },
      {
        session_id: session.id,
        question_id: mainIdeaQ.id,
        student_answer: "תשובת דמו",
        ai_score: pattern.mainIdeaScore,
        is_correct: pattern.mainIdeaScore >= 60,
      },
      {
        session_id: session.id,
        question_id: evidenceQ.id,
        student_answer: "תשובת דמו",
        ai_score: pattern.evidenceScore,
        is_correct: pattern.evidenceScore >= 60,
      },
      {
        session_id: session.id,
        question_id: inferenceQ.id,
        student_answer: "תשובת דמו",
        ai_score: pattern.inferenceScore,
        is_correct: pattern.inferenceScore >= 60,
      },
    ]);

    await supabase.from("assignment_submissions").upsert(
      {
        assignment_id: assignment.id,
        student_id: user.id,
        session_id: session.id,
        status: "completed",
        submitted_at: new Date().toISOString(),
        score: Math.round(
          (pattern.vocabularyScore + pattern.mainIdeaScore + pattern.evidenceScore + pattern.inferenceScore) / 4
        ),
      },
      { onConflict: "assignment_id,student_id" }
    );

    await recomputeStudentSkillScores(user.id);
    console.log(`✅ נוצרו נתוני קריאה היסטוריים עבור ${username}`);
  }
}

async function main() {
  console.log("🌱 מתחיל זריעת נתוני דמו ל-ReadWise AI...\n");

  const teacher = await ensureTeacher();
  const classId = await ensureClass(teacher.id);

  for (const student of DEMO_STUDENTS) {
    await ensureStudent(student, classId);
  }

  await ensureTexts(teacher.id);
  await ensureAssignmentAndHistory(teacher.id, classId);

  console.log("\n✅ סיום. פרטי התחברות לדמו:");
  console.log(`   מורה  -> אימייל: ${DEMO_TEACHER.email} | סיסמה: ${DEMO_TEACHER.password}`);
  console.log(`   תלמיד -> שם משתמש: ${DEMO_STUDENTS[0].username} | סיסמה: Demo1234!`);
}

main().catch((err) => {
  console.error("❌ זריעת הדמו נכשלה:", err);
  process.exit(1);
});
