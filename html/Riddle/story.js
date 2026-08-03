/* =========================================================
   story.js
   All narrative content lives here (Farsi / فارسی). No rendering
   logic — just data, plus a couple of small pure helpers for
   reading it. Exposed as a single global: `Story`.

   ---------------------------------------------------------
   Shape of the story: a branching tree, not a straight line.

                              base
                             /    \
                           a1      b1
                          /  \    /  \
                        a21  b21 a22  b22
                          \  /     \  /
                          (same)  (same)
                         /   \    /   \
                      a211  b211 a213 b213
                      /  \  /  \  /  \  /  \
                    end  end  end  end  end ... (all 8 leaves -> ending)

   a21 and b21 offer the *same* two next choices (both feed into
   a211 / b211); a22 and b22 do the same thing (both feed into
   a213 / b213). Whichever branch you took to get there, you land
   on the same crossroads — a small structural echo of the whole
   point of the piece: every world leads to you.
   ========================================================= */

const Story = (() => {

  const opening = [
    'بیا ببینیم اگه تصمیم های دیگه ای میگرفتیم',
    'رابطمون همینطوری میموند ؟',
  ];

  /* ---------- the tree ---------- */

  const nodes = {
    base: {
      id: 'base',
      name: 'اولین پیام',
      prompt:
        'روزی که بهت پیام دادم و خواستم با هم باشیم. بیا ببینیم اگر' +
        'همان یک لحظه جور دیگه ای پیش می‌رفت، چی میشد',
      choices: [
        {
          label: 'جوابمو میدادی و قبول میکردی',
          outcome:
            'شروع میکردیم به حرف زدن و در مرور زمان با اخلاق های هم بیشتر آشنا میشدیم و درک بهتری راجب هم پیدا میکردیم. و بهترین لحظه های زندگیمو پیشت تجربه دارم میکنم',
          next: 'a1',
        },
        {
          label: 'پیام را بی‌جواب گذاشتی',
          outcome:
            'پیامم بی جواب میمونه ولی دلم دیوانه وار دنبالته. هرشب به فکرتم و برای کارایی که قدیم باهات کردم افسوس میخورم. میگم کاش میشد همه چیو نگه میداشتم تا الان پیشم میبودی',
          next: 'b1',
        },
      ],
    },

    a1: {
      id: 'a1',
      name: 'گرمای عشق',
      prompt:
        'از همان شب اول، انگار سال‌ها بود همدیگر را می‌شناختیم. اما ' +
        'حتی این نزدیکیِ ناگهانی هم دو راه جلوی پایمان گذاشت.',
      choices: [
        {
          label: 'همه‌چیز سریع پیش رفت',
          outcome:
            'حرف‌زدنمان از یک پیام به یک تماس رسید، از یک تماس به یک ' +
            'قرار. عجله‌ای در کار نبود؛ فقط دلمان عجله داشت.',
          next: 'a21',
        },
        {
          label: 'کمی صبر کردیم',
          outcome:
            'قرار گذاشتیم آرام پیش برویم؛ روزی یک پیام، هفته‌ای یک قدم. ' +
            'عجیب بود که صبر، به‌جای دور کردنمان، محکم‌ترمان کرد.',
          next: 'b21',
        },
      ],
    },

    b1: {
      id: 'b1',
      name: 'راهِ دیگر',
      prompt:
        'آن پیامِ اول جواب نگرفت، ولی جهان انگار حرفش را پس نگرفت. ' +
        'یک‌جای دیگر، یک راهِ دیگر، دوباره ما را روبه‌روی هم گذاشت.',
      choices: [
        {
          label: 'از طریقِ یک دوستِ مشترک',
          outcome:
            'یک اسمِ آشنا، یک معرفیِ ساده، و ناگهان دوباره همان چهره ' +
            'روبه‌رویم بود؛ این‌بار از دری دیگر وارد شده.',
          next: 'a22',
        },
        {
          label: 'ماه‌ها بعد، آنلاین',
          outcome:
            'ماه‌ها گذشت. بعد یک شب، اسمت دوباره روی صفحه ظاهر شد؛ ' +
            'انگار جهان یادش نرفته بود کارِ ناتمامی مانده.',
          next: 'b22',
        },
      ],
    },

    a21: {
      id: 'a21',
      name: 'اعتماد',
      prompt:
        'در شروعِ سریع، یک چیز باید امتحان می‌شد: آیا این سرعت، به ' +
        'اعتماد هم می‌رسید؟',
      choices: [
        {
          label: 'فاصله افتاد بینمان',
          outcome:
            'حتی وسطِ آن شروعِ تند، جغرافیا حرفِ خودش را زد. باید ' +
            'می‌دیدیم این نزدیکیِ ناگهانی، از دور هم دوام می‌آورد یا نه.',
          next: 'a211',
        },
        {
          label: 'نزدیک ماندیم',
          outcome:
            'همان نزدیکیِ اول، ادامه پیدا کرد. هر روز کنارِ هم بودیم؛ و ' +
            'این هم، به‌طرزِ خودش، امتحانِ خودش را داشت.',
          next: 'b211',
        },
      ],
    },

    b21: {
      id: 'b21',
      name: 'صبوری',
      prompt:
        'در شروعِ آرام هم، دیر یا زود، همین سؤال پیش آمد: آیا این ' +
        'آرامی، در برابرِ زندگیِ واقعی هم دوام می‌آورد؟',
      choices: [
        {
          label: 'فاصله افتاد بینمان',
          outcome:
            'درست وقتی داشتیم آرام‌آرام به هم عادت می‌کردیم، فاصله ' +
            'افتاد. همان صبوری که تا این‌جا آورده بودمان، دوباره لازم شد.',
          next: 'a211',
        },
        {
          label: 'نزدیک ماندیم',
          outcome:
            'آن آرامیِ اول، جایش را به یک نزدیکیِ ثابت داد. عجله‌ای که ' +
            'نبود، حالا به یک اطمینانِ ساده تبدیل شده بود.',
          next: 'b211',
        },
      ],
    },

    a22: {
      id: 'a22',
      name: 'از طریقِ یک دوست',
      prompt:
        'این‌بار، از طریقِ یک دوست، دوباره باید یک تصمیم گرفته می‌شد؛ ' +
        'درست مثل بارِ اول، ولی از مسیری تازه.',
      choices: [
        {
          label: 'دودل ماندیم',
          outcome:
            'می‌ترسیدیم دوباره یک شروعِ ناتمام باشد. مدتی فقط دورادور ' +
            'نگاه کردیم، بدونِ آن‌که جرأتِ قدمِ بعدی را داشته باشیم.',
          next: 'a213',
        },
        {
          label: 'دل به دریا زدیم',
          outcome:
            'این‌بار تردید را کنار گذاشتیم. اگر جهان دوباره ما را ' +
            'روبه‌روی هم گذاشته، حداقل یک‌بار دیگر باید امتحان می‌کردیم.',
          next: 'b213',
        },
      ],
    },

    b22: {
      id: 'b22',
      name: 'بعد از سکوت',
      prompt:
        'این‌بار، بعد از ماه‌ها سکوت، دوباره همان سؤالِ همیشگی ' +
        'روبه‌رویمان بود: باز هم ادامه بدهیم یا بگذاریم همین‌جا بماند؟',
      choices: [
        {
          label: 'دودل ماندیم',
          outcome:
            'آن ماه‌های سکوت، رد پای خودشان را گذاشته بودند. یک بخشی از ' +
            'من هنوز مطمئن نبود دوباره اعتماد کردن، عاقلانه است یا نه.',
          next: 'a213',
        },
        {
          label: 'دل به دریا زدیم',
          outcome:
            'سکوت، به‌جای آن‌که فراموشمان کند، انگار فقط داشت صبر ' +
            'می‌کرد. وقتی دوباره حرف زدیم، انگار هیچ‌وقت قطع نشده بودیم.',
          next: 'b213',
        },
      ],
    },

    a211: {
      id: 'a211',
      name: 'فاصله',
      prompt:
        'کیلومترها بینمان افتاد؛ دو ساعتِ محلیِ متفاوت، و یک تماسِ ' +
        'تصویری که همیشه سرِ وقت وصل نمی‌شد.',
      choices: [
        {
          label: 'نزدیک به تسلیم شدن',
          outcome:
            'یک شبِ طولانی، نزدیک بود بگذاریم همه‌چیز آرام خاموش شود. ' +
            'نزدیک بود. بعد صبح از راه رسید؛ و ما هم، به‌نوعی، از راه رسیدیم.',
          next: 'ending',
        },
        {
          label: 'امیدوار ماندیم',
          outcome:
            'گوشی را تا بعد از نیمه‌شب شارژ نگه داشتیم. روزها را ' +
            'همچنان می‌شمردیم، انگار هنوز مهم بودند. فاصله فقط با یک ' +
            'تصمیمِ لجوجانه در هر لحظه، کوچک می‌شود.',
          next: 'ending',
        },
      ],
    },

    b211: {
      id: 'b211',
      name: 'نزدیکی',
      prompt:
        'فاصله‌ای در کار نبود، ولی نزدیکی هم امتحانِ خودش را داشت؛ هر ' +
        'روز کنارِ هم بودن، خودش یک تصمیم بود که باید هر بار گرفته می‌شد.',
      choices: [
        {
          label: 'عادت کردیم',
          outcome:
            'روزها شبیهِ هم شدند، و در دلِ همان تکرار، چیزی آرام و ' +
            'مطمئن ریشه دواند؛ چیزی که هیچ‌وقت کهنه نشد.',
          next: 'ending',
        },
        {
          label: 'هر روز را تازه نگه داشتیم',
          outcome:
            'قرار گذاشتیم هیچ‌وقت عادت، جای دیدن را نگیرد. هر روز، ' +
            'دوباره یکدیگر را انتخاب کردیم؛ انگار بارِ اول است.',
          next: 'ending',
        },
      ],
    },

    a213: {
      id: 'a213',
      name: 'انتظار',
      prompt:
        'دودلی مدتی ماند؛ سؤالی که نه من جوابش را می‌دانستم، نه تو: ' +
        'آیا وقتش رسیده بود؟',
      choices: [
        {
          label: 'فراموش کردن را امتحان کردیم',
          outcome:
            'مدتی سعی کردیم بگذاریم خاطره‌اش آرام‌آرام محو شود. جواب ' +
            'نداد. بعضی چیزها حاضر نیستند گذشته شوند.',
          next: 'ending',
        },
        {
          label: 'منتظر ماندیم',
          outcome:
            'گذاشتیم روزها همان کاری را بکنند که همیشه می‌کنند، ولی یک ' +
            'چراغِ کوچک را روشن نگه داشتیم. انتظار، خودش نوعی انتخابِ ' +
            'آرام از آب درآمد.',
          next: 'ending',
        },
      ],
    },

    b213: {
      id: 'b213',
      name: 'دل به دریا',
      prompt:
        'یک تصمیم گرفته شد و راهی برای برگشتن نبود؛ فقط این سؤال ماند ' +
        'که این جسارت، آخرش به کجا می‌رسد.',
      choices: [
        {
          label: 'با ترس جلو رفتیم',
          outcome:
            'قلبمان تند می‌زد، ولی قدم برداشتیم. ترس هیچ‌وقت کامل از ' +
            'بین نرفت؛ فقط یاد گرفتیم کنارش راه برویم.',
          next: 'ending',
        },
        {
          label: 'با اطمینان جلو رفتیم',
          outcome:
            'انگار مدت‌ها بود منتظرِ همین لحظه بودیم. قدم برداشتیم، ' +
            'بی هیچ تردیدی؛ چون ته دلمان، جوابش را می‌دانستیم.',
          next: 'ending',
        },
      ],
    },
  };

  const ROOT_ID = 'base';
  // Every path through the tree — no matter which branch you take —
  // passes through exactly 4 decision points before the ending.
  const DEPTH = 4;

  // The nodes actually visited so far, in order. path[0] is always
  // the root; path[i] only exists once the choice at path[i-1] has
  // been resolved via advance().
  let path = [nodes[ROOT_ID]];

  function resetPath() {
    path = [nodes[ROOT_ID]];
  }

  /**
   * Resolve the choice made at depth `index` and extend the path
   * with whatever node it points to (if any — the four deepest
   * nodes point at 'ending', which isn't a real node in the tree).
   */
  function advance(index, choiceIndex) {
    const current = path[index];
    if (!current) return null;
    const choice = current.choices[choiceIndex];
    if (!choice) return null;
    const nextNode = nodes[choice.next] || null;
    path = path.slice(0, index + 1);
    if (nextNode) path[index + 1] = nextNode;
    return nextNode;
  }

  /**
   * Rebuild the path from a saved list of choice indices (used to
   * resume a journey after a reload). Returns true on success.
   */
  function restorePath(choiceIndices) {
    resetPath();
    for (let i = 0; i < choiceIndices.length; i++) {
      if (!advance(i, choiceIndices[i])) {
        resetPath();
        return false;
      }
    }
    return true;
  }

  /* ---------- helpers ---------- */

  function timelineCount() {
    return DEPTH;
  }

  function getTimeline(index) {
    return path[index];
  }

  function totalSceneCount() {
    const perTimeline = DEPTH * 2; // prompt + outcome, at each of the 4 depths
    const openingScenes = 1;
    const convergenceScenes = 1;
    const endingScenes = 1;
    return openingScenes + perTimeline + convergenceScenes + endingScenes;
  }

  const convergence = [
    'مهم نیست کدام پیام.',
    'مهم نیست کدام شهر، کدام سکوت، یا چند سال —',
    'هر جاده‌ای که امتحان کردیم، باز به همان سمت خم می‌شود.',
  ];

  // Each entry fades in, holds, then fades out before the next.
  const ending = [
    'در هر دنیایی...',
    'در هر زندگی‌ای...',
    'در هر احتمالی...',
    'باز هم تو را انتخاب می‌کردم.',
  ];

  const endingHeart = '\u2764';
  const endingClose = 'تو، در میان تمامِ دنیاهای ممکن، محبوب‌ترین نسخه‌ای.';

  const letter = {
    buttonLabel: 'یک خاطرهٔ آخر',
    title: 'یک خاطرهٔ آخر',
    body: [
      'هیچ نسخه‌ای از این داستان وجود ندارد که در آن متوجهِ تو نشوم.',
      'نه آن نسخه‌ای که پیام هیچ‌وقت فرستاده نمی‌شود. نه آن‌که زیرِ ' +
      'آسمان‌های متفاوت بزرگ می‌شویم، یا خیلی از هم دور می‌افتیم، ' +
      'یا وسطِ یک دعوا حرفِ اشتباه را می‌زنیم، یا می‌گذاریم زمانِ ' +
      'زیادی بگذرد بدونِ آن‌که حرفِ کافی زده شود.',
      'هر نسخه‌ای را که به فکرم رسید امتحان کردم، و هرکدام، ' +
      'به‌نوعی، باز هم راهش را به همین‌جا پیدا کرد؛ به تو، به ما، ' +
      'به آن شانسِ خاص و تکرارنشدنیِ آشنا شدن با تو.',
      'ممنون برای هر روزِ عادی و هر روزِ بزرگ و فراموش‌نشدنی. ' +
      'ممنون که ماندی، که این را هم انتخاب کردی، که دلیلِ آنی که ' +
      'هر دنیای دیگر هم مثلِ خانه به‌نظر برسد.',
      'در هر خط‌زمانی که باشیم؛ من همان را انتخاب می‌کنم، و تو را ' +
      'انتخاب می‌کنم، بارها و بارها و بارها.',
    ],
  };

  // Faint, occasional background quotes — pure atmosphere, never blocking.
  const idleQuotes = [
    'بعضی چیزها راهِ برگشت را پیدا می‌کنند.',
    'هر پایانی عوض نمی‌شود.',
    'هزار درِ کوچک، یک اتاقِ آشنا.',
    'جهان دارد راه‌حلش را نشان می‌دهد.',
    'باز هم تو. همیشه تو.',
    'هر پیش‌نویسِ این داستان، به همین صفحه ختم می‌شود.',
  ];

  return {
    opening,
    convergence,
    ending,
    endingHeart,
    endingClose,
    letter,
    idleQuotes,
    timelineCount,
    getTimeline,
    totalSceneCount,
    advance,
    resetPath,
    restorePath,
  };
})();