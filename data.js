const GROUPS = {
    A: {
        name: 'האדומים',
        emoji: '🔴',
        color: 'אדום',
        level: 'A',
        description: 'רצי 5 ק"מ ומעלה — מהירים וחזקים',
        trainingOptions: [
            { type: 'ריצה רציפה', desc: '5-8 ק"מ בקצב יציב, 40 דקות' },
            { type: 'פארטלק', desc: 'שילוב קצבים: 2 דקות מהיר / 1 דקה איטי, 30-40 דקות' },
            { type: 'ריצת טמפו', desc: '3-5 ק"מ בקצב מירוץ, חימום וצינון' },
            { type: 'ריצה ארוכה', desc: '8-12 ק"מ בקצב נוח, פעם בשבועיים' },
            { type: 'אינטרוולים', desc: '6-8 חזרות של 400 מטר עם מנוחה' },
        ]
    },
    B: {
        name: 'הכתומים',
        emoji: '🟠',
        color: 'כתום',
        level: 'B',
        description: 'הולכים ורצים — מתקדמים יחד',
        trainingOptions: [
            { type: 'ריצה-הליכה', desc: '3 דקות ריצה / 2 דקות הליכה, 30-40 דקות' },
            { type: 'ריצה רציפה קלה', desc: '10-15 דקות ריצה רצופה, עם הפסקות הליכה' },
            { type: 'פארטלק קל', desc: 'שינויי קצב חופשיים ב-30 דקות' },
            { type: 'ריצה-הליכה מתקדמת', desc: '4 דקות ריצה / 1 דקה הליכה, 35 דקות' },
            { type: 'אימון גבעות', desc: 'ריצה/הליכה מהירה בעליות קצרות' },
        ]
    },
    C: {
        name: 'הכחולים',
        emoji: '🔵',
        color: 'כחול',
        level: 'C',
        description: 'הולכים 5 ק"מ — מתמידים ומתקדמים',
        trainingOptions: [
            { type: 'הליכה מהירה', desc: '4-5 ק"מ בקצב מאתגר, 40 דקות' },
            { type: 'הליכה + ריצות קצרות', desc: 'הליכה עם 5 קטעי ריצה של 30 שניות' },
            { type: 'הליכה במשופע', desc: 'מסלול עם עליות וירידות, 3-4 ק"מ' },
            { type: 'הליכה מרחקית', desc: '5 ק"מ בקצב נוח, דגש על סיבולת' },
            { type: 'הליכה אינטרוולית', desc: '2 דקות מהיר / 2 דקות רגיל, 35 דקות' },
        ]
    },
    D: {
        name: 'הצהובים',
        emoji: '🟡',
        color: 'צהוב',
        level: 'D',
        description: 'הליכה, מרחק קצר — חזקים, יציבים, הולכים בביטחון',
        trainingOptions: [
            { type: 'הליכה בקצב אישי', desc: '1.5-3 ק"מ, דגש על תנועה נכונה, 30 דקות' },
            { type: 'הליכה + תרגילי כוח', desc: 'הליכה 15 דקות, עצירות לתרגילים, 15 דקות הליכה' },
            { type: 'הליכה הדרגתית', desc: 'התחלה איטית, הגברת קצב באמצע, האטה בסוף' },
            { type: 'הליכה חברתית', desc: 'הליכה בזוגות עם שיחה, 2-3 ק"מ' },
            { type: 'מסלול קצר + מתיחות', desc: '1.5 ק"מ הליכה עם מתיחות בתחנות' },
        ]
    }
};

const TRAINEES = [
    // 🔴 אדום - רמה A
    { name: 'עמית ו.', gender: 'זכר', day: 'שלישי', pace: '05:00-06:30', kmMin: 5, kmMax: 8, group: 'A', notes: 'רץ מהר, טווח ארוך', goal: '', oneToOne: false },
    { name: 'שרון', gender: 'זכר', day: 'רביעי', pace: '05:00-06:30', kmMin: 5, kmMax: 10, group: 'A', notes: 'רצים 5 ק"מ פלוס', goal: '', oneToOne: false },
    { name: 'עמרי צ.', gender: 'זכר', day: 'שלישי', pace: '05:30-07:00', kmMin: 3.5, kmMax: 6, group: 'A', notes: 'רצים 5 ק"מ פלוס', goal: '', oneToOne: false },
    { name: 'אלה', gender: 'נקבה', day: 'רביעי', pace: '07:00-09:00', kmMin: 3.5, kmMax: 5, group: 'A', notes: 'משלבת הליכה וריצה', goal: '', oneToOne: false },
    { name: 'שלומי', gender: 'זכר', day: 'שלישי', pace: '05:00-06:30', kmMin: 5, kmMax: 8, group: 'A', notes: 'רץ מהיר, טווח ארוך', goal: '', oneToOne: false },

    // 🟠 כתום - רמה B
    { name: 'תמר', gender: 'נקבה', day: 'שלישי', pace: '10:00+', kmMin: 3, kmMax: 5, group: 'B', notes: 'רצה לאט מאוד', goal: '', oneToOne: false },
    { name: 'אריאל ב.', gender: 'זכר', day: 'שלישי', pace: '06:00-07:00', kmMin: 3.5, kmMax: 6, group: 'B', notes: 'חייב כזוג, לא בשלישייה', goal: '', oneToOne: false },
    { name: 'שי', gender: 'זכר', day: 'שלישי', pace: '06:30-08:00', kmMin: 4, kmMax: 6, group: 'B', notes: 'רץ לאט', goal: '', oneToOne: false },
    { name: 'סופי', gender: 'נקבה', day: 'שלישי', pace: '10:00+', kmMin: 3, kmMax: 5, group: 'B', notes: 'נדרש 1:1', goal: '', oneToOne: true },
    { name: 'שקד', gender: 'זכר', day: 'שלישי', pace: '05:30-07:00', kmMin: 4, kmMax: 6, group: 'B', notes: 'רץ מהיר — לשבץ עם מתנדב מהיר (שמואל/אלכס ינאי/אלון), עדיף 1:1', goal: '', oneToOne: false },
    { name: 'אליזבטה', gender: 'נקבה', day: 'רביעי', pace: '07:00-09:00', kmMin: 2, kmMax: 7, group: 'B', notes: 'רצה 2-7 ק"מ', goal: '', oneToOne: false },
    { name: 'כפיר', gender: 'זכר', day: 'שלישי', pace: '06:00-07:30', kmMin: 4, kmMax: 6, group: 'B', notes: 'רץ בינוני-מהיר', goal: '', oneToOne: false },
    { name: 'אורן', gender: 'זכר', day: 'שלישי', pace: '06:00-08:00', kmMin: 4, kmMax: 6, group: 'B', notes: 'רץ-הולך, קצב בינוני', goal: '', oneToOne: false },
    { name: 'עומר', gender: 'זכר', day: 'רביעי', pace: '07:00-09:00', kmMin: 3.5, kmMax: 5, group: 'B', notes: 'משלב הליכה וריצה', goal: '', oneToOne: false },

    // 🔵 כחול - רמה C
    { name: 'ריקי', gender: 'נקבה', day: 'רביעי', pace: '09:00-12:00', kmMin: 2, kmMax: 5, group: 'C', notes: 'הולכת', goal: '', oneToOne: false },
    { name: 'דודו', gender: 'זכר', day: 'רביעי', pace: '09:00-12:00', kmMin: 2, kmMax: 5, group: 'C', notes: 'הולך', goal: '', oneToOne: false },
    { name: 'אלעד ש.', gender: 'זכר', day: 'שלישי', pace: '07:00-09:00', kmMin: 3, kmMax: 5, group: 'C', notes: 'רץ-הולך', goal: '', oneToOne: false },
    { name: 'איתן', gender: 'זכר', day: 'רביעי', pace: '06:00-08:00', kmMin: 4, kmMax: 6, group: 'C', notes: 'חייב 1:1 — עדיף: עמית רובין, קרלי, אלון, אופיר אמיתי', goal: '', oneToOne: true },
    { name: 'טופול', gender: 'נקבה', day: 'שלישי', pace: '10:00+', kmMin: 3, kmMax: 4, group: 'C', notes: 'נדרש 1:1, שיבוץ תמי חודשי', goal: '', oneToOne: true },
    { name: 'זוהר', gender: 'נקבה', day: 'שלישי', pace: '08:00-10:00', kmMin: 3.5, kmMax: 5, group: 'C', notes: 'הולכת מהר', goal: '', oneToOne: false },

    // 🟡 צהוב - רמה D
    { name: 'אנה', gender: 'נקבה', day: 'שלישי', pace: '12:00+', kmMin: 1.5, kmMax: 4, group: 'D', notes: 'נדרש 1:1, דגש מתנדבת אישה', goal: '', oneToOne: true },
    { name: 'אלעד ע.', gender: 'זכר', day: 'שלישי', pace: '11:00+', kmMin: 2, kmMax: 3.5, group: 'D', notes: 'נדרש 1:1, רק עם אורי', goal: '', oneToOne: true },
    { name: 'סברין', gender: 'נקבה', day: 'רביעי', pace: '12:00+', kmMin: 1.5, kmMax: 3, group: 'D', notes: 'נדרש 1:1', goal: '', oneToOne: true },
    { name: 'עינב', gender: 'נקבה', day: 'רביעי', pace: '09:00-11:00', kmMin: 2, kmMax: 5, group: 'D', notes: 'תמיד עם רבקה', goal: '', oneToOne: false },
    { name: 'בועז', gender: 'זכר', day: 'רביעי', pace: '11:00+', kmMin: 1.5, kmMax: 3, group: 'D', notes: 'הולך, טווח קצר', goal: '', oneToOne: false },
    { name: 'מעיין', gender: 'נקבה', day: 'רביעי', pace: '12:00+', kmMin: 1.5, kmMax: 3, group: 'D', notes: 'נדרש 1:1, דגש מתנדבת אישה, לא בשלישייה', goal: '', oneToOne: true },
    { name: 'לאה', gender: 'נקבה', day: 'רביעי', pace: '09:00-11:00', kmMin: 2, kmMax: 4, group: 'D', notes: 'הולכת', goal: '', oneToOne: false },
    { name: 'עמית רובין', gender: 'זכר', day: 'רביעי', pace: '06:00-09:00', kmMin: 2, kmMax: 10, group: 'B', notes: 'רץ, טווח רחב 2-10 ק"מ', goal: '', oneToOne: false },
];

// מתנדבים — Volunteers
// gender: זכר / נקבה | fast: true = מתנדב מהיר | day: יום פעיל
const VOLUNTEERS = [
    // 🏃 שלישי — כרמיאל (גילת מאמנת / רועי מחליף)
    { name: 'יואב ארבל',          gender: 'זכר',   day: 'שלישי', kmMin: 0, kmMax: 0,  fast: false, notes: '' },
    { name: 'אלכס ינאי',          gender: 'זכר',   day: 'שלישי', kmMin: 5, kmMax: 10, fast: true,  notes: 'מתנדב מהיר' },
    { name: 'גיל',                gender: 'זכר',   day: 'שלישי', kmMin: 0, kmMax: 0,  fast: false, notes: '' },
    { name: 'רום שינשין',         gender: '',      day: 'שלישי', kmMin: 0, kmMax: 0,  fast: false, notes: '' },
    { name: 'עידית לוי בנג\'מין', gender: 'נקבה', day: 'שלישי', kmMin: 0, kmMax: 0,  fast: false, notes: 'שם: עידית (לא אידית!)' },
    { name: 'ניסן טל',            gender: 'זכר',   day: 'שלישי', kmMin: 0, kmMax: 0,  fast: false, notes: 'הולך בלבד, לא רץ' },
    { name: 'אמיר',               gender: 'זכר',   day: 'שלישי', kmMin: 3, kmMax: 5,  fast: false, notes: 'מתנדב חדש (מאי 2026)' },
    { name: 'רני',                gender: 'זכר',   day: 'שלישי', kmMin: 0, kmMax: 0,  fast: false, notes: '' },
    { name: 'שמואל',              gender: 'זכר',   day: 'שלישי', kmMin: 5, kmMax: 10, fast: true,  notes: 'מתנדב מהיר' },
    { name: 'תמי ניב אלון',       gender: 'נקבה', day: 'שלישי', kmMin: 0, kmMax: 0,  fast: false, notes: 'שיבוץ קבוע עם טופול (חודשי)' },
    { name: 'אייל',               gender: 'זכר',   day: 'שלישי', kmMin: 0, kmMax: 0,  fast: false, notes: 'Xorcom.support | +972-4-995-1992' },
    { name: 'אלון',               gender: 'זכר',   day: '',      kmMin: 5, kmMax: 10, fast: true,  notes: 'מתנדב מהיר' },
    { name: 'רחל רודי',            gender: 'נקבה', day: 'רביעי', kmMin: 1, kmMax: 5,  fast: false, notes: 'הולכת בלבד, 1-5 ק"מ' },
    { name: 'לודמילה (לודה)',      gender: 'נקבה', day: 'רביעי', kmMin: 2, kmMax: 5,  fast: false, notes: 'הולכת 2-5 ק"מ' },
];
