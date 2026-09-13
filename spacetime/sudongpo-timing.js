(() => {
  const D = window.SUDONGPO;
  const E = D.events;

  // Decimal years are only a linear coordinate for animation. The labels keep
  // the source's original precision; month/day values below are not meant to
  // convert Song lunar dates into exact Gregorian dates.
  const time = {
    '生于眉山': 1037.0192,

    // First overland journey: leave Meishan in intercalary 3rd month 1056,
    // arrive Bianjing roughly May/June; the jinshi examination is in 1057.
    '进京登第': 1056.46,
    '返眉山服丧': 1057.66,

    // Second journey: 1059-10-04 leave Meishan, 1060-02-25 arrive Bianjing.
    '再到汴京': 1060.153,
    '赴凤翔任职': 1061.953,
    '凤翔任满返京': 1065.12,

    // Carry Su Xun and Wang Fu's coffins home: Jun 1066 -> Apr 1067.
    '返眉山守父丧': 1067.30,
    // Leave Meishan around mid-Nov 1068, reach Bianjing early Feb 1069.
    '第四次入京': 1069.09,

    '第一次到杭州': 1071.8333,
    '杭州转知密州': 1074.9233,
    '知徐州': 1077.3014,
    '移知湖州': 1079.2986,
    '乌台诗案入狱': 1079.6219,
    '贬谪黄州': 1080.0849,
    '离黄州，游庐山至金陵': 1084.495,
    '常州、宜兴卜居': 1084.725,
    '知登州五日': 1085.789,
    '再召回汴京': 1085.94,
    '第二次知杭州': 1089.505,
    '杭州召还': 1091.40,
    '知颍州': 1091.64,
    '知扬州': 1092.16,
    '第八次入京': 1092.71,
    '出知定州': 1093.81,
    '远谪惠州': 1094.75,
    '再贬儋州': 1097.50,
    '北归至广州': 1100.66,
    '北归至虔州': 1101.08,
    '北归至金陵': 1101.3333,
    '卒于常州': 1101.5671
  };

  // Travel consumes real historical time. Where only a month/season is known,
  // the window deliberately keeps that coarse precision rather than inventing a day.
  const travelStart = {
    '进京登第': 1056.27,          // intercalary 3rd month -> about May/June
    '返眉山服丧': 1057.42,        // about May/June -> roughly Jul/Aug
    '再到汴京': 1059.758,         // Oct 4 1059 -> Feb 25 1060
    '赴凤翔任职': 1061.86,        // Bianjing/Zhengzhou in Nov -> Dec 14
    '凤翔任满返京': 1064.96,      // Dec 17 1064 -> Feb 1065
    '返眉山守父丧': 1066.48,      // June 1066 -> April 1067, ~10.5 months
    '第四次入京': 1068.87,        // mid-Nov 1068 -> early Feb 1069

    '第一次到杭州': 1071.58,       // early Aug -> Nov
    '杭州转知密州': 1074.75,       // late Sep -> Dec 3
    '知徐州': 1077.00,             // Jan 1 -> Apr 21
    '移知湖州': 1079.20,           // late Mar -> Apr 20
    '乌台诗案入狱': 1079.57,       // Jul 28 -> Aug 18
    '贬谪黄州': 1080.00,           // Jan 1 -> Feb 1
    '离黄州，游庐山至金陵': 1084.27, // Apr 8 -> late Jun
    '常州、宜兴卜居': 1084.62,    // Aug 14 -> Sep/Oct
    '知登州五日': 1085.58,         // late Jul -> Oct 15
    '再召回汴京': 1085.84,         // Nov 2 -> early Dec
    '第二次知杭州': 1089.25,       // Apr -> Jul 3
    '杭州召还': 1091.11,           // Feb 9 -> May 26
    '知颍州': 1091.61,             // intercalary Aug -> Aug 22
    '知扬州': 1092.07,             // late Jan -> Feb 28
    '第八次入京': 1092.67,         // early Sep -> mid-Sep
    '出知定州': 1093.735,          // Sep 26 -> Oct 23, 27 days
    '远谪惠州': 1094.28,           // intercalary Apr -> Oct 2, ~6 months
    '再贬儋州': 1097.30,           // Apr 19 -> Jul 2
    '北归至广州': 1100.45,         // mid-Jun -> late Aug
    '北归至虔州': 1100.85,         // Nov 5/6 -> late Jan
    '北归至金陵': 1101.18          // after short Qianzhou stay -> May 1
  };

  const byTitle = title => E.find(e => e.title === title);

  // Correct the early routes so the animation expresses the documented mode of travel.
  // 1059-60: Meishan -> Min River -> Yangtze -> Jiangling, then overland north.
  const secondBian = byTitle('再到汴京');
  if (secondBian) {
    secondBian.routeFromPrevious = [
      [29.55, 103.77], [28.77, 104.62], [28.88, 105.44], [29.56, 106.55],
      [29.70, 107.39], [30.30, 108.04], [31.02, 109.46], [30.69, 111.29],
      [30.33, 112.24], [32.01, 112.12], [32.99, 112.53], [34.04, 113.85]
    ];
    secondBian.dateLabel = '1060 年 2 月 25 日抵汴京';
    secondBian.source += ' 行踪考进一步记载：1059 年十月四日离眉州，沿岷江、长江至江陵，再改陆路北上，1060 年二月二十五日抵京，近五个月。';
  }

  // 1066-67: with coffins, down Bian/Grand Canal to Guazhou, then upstream Yangtze/Min.
  const fatherFuneral = byTitle('返眉山守父丧');
  if (fatherFuneral) {
    fatherFuneral.routeFromPrevious = [
      [34.45, 115.65], [33.64, 116.98], [33.61, 119.02], [32.39, 119.42],
      [32.19, 119.42], [32.06, 118.80], [31.35, 118.43], [29.71, 115.99],
      [30.59, 114.31], [30.33, 112.24], [30.69, 111.29], [29.56, 106.55],
      [28.77, 104.62], [29.55, 103.77]
    ];
    fatherFuneral.dateLabel = '1067 年 4 月返抵眉山';
    fatherFuneral.source += ' 行踪考记 1066 年六月扶苏洵、王弗灵柩离汴，循汴河、运河南下至瓜洲，再逆长江、岷江返眉山，至 1067 年四月，历时约十个半月。';
  }

  const firstBian = byTitle('进京登第');
  if (firstBian) {
    firstBian.dateLabel = '1056 年约 5–6 月抵汴京；1057 年登第';
    firstBian.source += ' 行踪考记第一次出蜀始于 1056 年闰三月，陆路经剑门、关中东行，近 1500 km，约两个月抵汴京；1057 年春再参加礼部、省试与殿试。';
  }

  const motherFuneral = byTitle('返眉山服丧');
  if (motherFuneral) {
    motherFuneral.dateLabel = '1057 年夏秋返抵眉山';
    motherFuneral.source += ' 程氏四月七日卒，三苏约五六月离京仓皇返蜀；资料多认为沿第一次出蜀的陆路原路返回，具体抵眉日期未精确到日。';
  }

  const fengxiang = byTitle('赴凤翔任职');
  if (fengxiang) {
    fengxiang.dateLabel = '1061 年 12 月 14 日到凤翔';
    fengxiang.source += ' 行踪考记十一月十九日与苏辙别于郑州西门，十二月十四日到凤翔，整段行程约一个月。';
  }

  const backBian = byTitle('凤翔任满返京');
  if (backBian) backBian.dateLabel = '1065 年 2 月还朝';

  const fourthBian = byTitle('第四次入京');
  if (fourthBian) {
    fourthBian.dateLabel = '1069 年 2 月初返抵汴京';
    fourthBian.source += ' 行踪考推定 1068 年十一月中旬离眉山，北出蜀道，经凤翔东行，约 1069 年二月初抵汴京。';
  }

  const dingzhou = byTitle('出知定州');
  if (dingzhou) {
    dingzhou.dateLabel = '1093 年 10 月 23 日到定州';
    dingzhou.source += ' 行踪考记九月二十六日朝辞赴定州，十月二十三日到任，约 27 日。';
  }

  E.forEach(e => {
    e.time = time[e.title] ?? Number(e.year);
    e.travelStart = travelStart[e.title] ?? e.time;
    e.travelEnd = e.time;
    e.travelTiming = travelStart[e.title] == null ? 'unknown-compressed' : 'documented-or-coarse-window';
  });

  // Separate arrival in Changzhou from death so the final stay is visible.
  const deathIndex = E.findIndex(e => e.title === '卒于常州');
  if (deathIndex >= 0 && !E.some(e => e.title === '抵常州养病')) {
    const death = E[deathIndex];
    death.routeFromPrevious = [];
    death.travelStart = death.time;
    death.travelEnd = death.time;
    E.splice(deathIndex, 0, {
      year: 1101.46,
      time: 1101.46,
      dateLabel: '1101 年 6 月抵常州',
      title: '抵常州养病',
      place: '江苏常州',
      mapLabel: '常州',
      lat: 31.811,
      lng: 119.974,
      summary: '北归途中病势加重，苏轼由真州乘舟赴常州，此后停留常州养病，直至七月二十八日去世。',
      tags: ['常州', '北归', '养病'],
      source: '行踪考记 1101 年六月初苏轼在真州一带始病，随后舟赴常州；常州史志记其北归后卒于常州孙氏馆。',
      routeFromPrevious: [[32.27, 119.18], [32.19, 119.42]],
      travelStart: 1101.42,
      travelEnd: 1101.46,
      travelTiming: 'month-level'
    });
  }

  D.timelineHint = '时间轴按 1037–1101 线性推进：人在任所/贬居地时保持停留；一旦进入史料可约束的旅行窗口，就在出发—到达时间内沿路线连续移动。日期只到月份或季节的路段，也只按相同精度处理，不伪造具体某日。';
  D.note = '线性真实时间 + 有时长的旅行。已知出发和到达日期/月份的行程按其真实持续时间播放；长期居住期间标记停在当地。早年几次出蜀、返蜀已按行踪考补入数月乃至十个月以上的旅行窗口。';
})();
