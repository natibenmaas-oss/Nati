// דומיין פנימי לכתובות אימייל סינתטיות של תלמידים.
// לתלמידי בית ספר יסודי אין בדרך כלל אימייל אישי — Supabase Auth דורש כתובת אימייל ייחודית,
// לכן לכל תלמיד נוצרת כתובת "{username}@students.readwise.internal" מאחורי הקלעים.
// התלמיד עצמו מתחבר עם שם משתמש + סיסמה בלבד ואינו רואה כתובת זו.
export const STUDENT_EMAIL_DOMAIN = "students.readwise.internal";

export function usernameToStudentEmail(username: string) {
  return `${username.toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}
