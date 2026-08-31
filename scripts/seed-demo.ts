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

async function ensureTexts(teacherId: string) {
  for (const demoText of DEMO_TEXTS) {
    const { data: existing } = await supabase
      .from("texts")
      .select("id")
      .eq("title", demoText.title)
      .maybeSingle();

    if (existing) {
      console.log(`↪️  טקסט כבר קיים: ${demoText.title}`);
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

  console.log("\n✅ סיום. פרטי התחברות לדמו:");
  console.log(`   מורה  -> אימייל: ${DEMO_TEACHER.email} | סיסמה: ${DEMO_TEACHER.password}`);
  console.log(`   תלמיד -> שם משתמש: ${DEMO_STUDENTS[0].username} | סיסמה: Demo1234!`);
}

main().catch((err) => {
  console.error("❌ זריעת הדמו נכשלה:", err);
  process.exit(1);
});
