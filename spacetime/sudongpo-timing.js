(() => {
  const D = window.SUDONGPO;
  const E = D.events;

  // Decimal years are used only as a linear time coordinate. Where the source
  // gives only a year/season, we keep that coarse precision instead of inventing a day.
  const time = {
    '生于眉山': 1037.0192,
    '进京登第': 1057.0,
    '返眉山服丧': 1059.0,
    '再到汴京': 1060.0,
    '赴凤翔任职': 1061.0,
    '凤翔任满返京': 1065.0,
    '返眉山守父丧': 1067.0,
    '第四次入京': 1068.95,
    '第一次到杭州': 1071.8333,
    '杭州转知密州': 1074.9096,
    '知徐州': 1077.3014,
    '移知湖州': 1079.2986,
    '乌台诗案入狱': 1079.6219,
    '贬谪黄州': 1080.0849,
    '离黄州，游庐山至金陵': 1084.4917,
    '常州、宜兴卜居': 1084.725,
    '知登州五日': 1085.7781,
    '再召回汴京': 1085.925,
    '第二次知杭州': 1089.4986,
    '杭州召还': 1091.3973,
    '知颍州': 1091.6329,
    '知扬州': 1092.1562,
    '第八次入京': 1092.75,
    '出知定州': 1093.0,
    '远谪惠州': 1094.7425,
    '再贬儋州': 1097.5,
    '北归至广州': 1100.6583,
    '北归至虔州': 1101.08,
    '北归至金陵': 1101.3333,
    '卒于常州': 1101.5671
  };

  // Only documented/month-level travel windows are expanded. If the source does
  // not tell us when a journey began, travel is compressed to the known event time
  // rather than spreading a fictitious journey across years of residence.
  const travelStart = {
    '第一次到杭州': 1071.5,      // July -> November 1071
    '杭州转知密州': 1074.7292,   // late September -> Dec 3
    '知徐州': 1077.02,           // January -> Apr 21
    '移知湖州': 1079.1667,       // March -> Apr 20
    '乌台诗案入狱': 1079.5458,   // July -> Aug 18
    '贬谪黄州': 1080.01,         // early January -> Feb 1
    '离黄州，游庐山至金陵': 1084.25, // April -> late June
    '常州、宜兴卜居': 1084.5833, // August -> Sep/Oct
    '知登州五日': 1085.5667,     // late July -> Oct 15
    '再召回汴京': 1085.8333,     // November -> early December
    '第二次知杭州': 1089.25,      // April -> Jul 3
    '杭州召还': 1091.0833,       // February -> May 26
    '知颍州': 1091.6208,         // 闰八月初 -> Aug 22, month-level
    '知扬州': 1092.05,           // January -> Feb 28
    '第八次入京': 1092.6667,     // autumn, season-level
    '远谪惠州': 1094.25,          // April -> Oct 2
    '再贬儋州': 1097.25,          // April -> July
    '北归至广州': 1100.4167,      // June -> late August
    '北归至虔州': 1100.8333,      // November -> late January
    '北归至金陵': 1101.25         // April -> May 1
  };

  E.forEach(e => {
    e.time = time[e.title] ?? Number(e.year);
    e.travelStart = travelStart[e.title] ?? e.time;
    e.travelEnd = e.time;
    e.travelTiming = travelStart[e.title] == null ? 'unknown-compressed' : 'documented-or-month-level';
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
      dateLabel: '1101 年 6 月',
      title: '抵常州养病',
      place: '江苏常州',
      mapLabel: '常州',
      lat: 31.811,
      lng: 119.974,
      summary: '北归途中病势加重，苏轼由真州乘舟赴常州，此后停留常州养病，直至七月二十八日去世。',
      tags: ['常州', '北归', '养病'],
      source: '行踪考记 1101 年六月赴常；常州史志记苏轼北归后卒于常州孙氏馆。这里把“抵常州”和“去世”拆成两个节点，以真实表现最后一个多月的停留。',
      routeFromPrevious: [[32.27, 119.18], [32.19, 119.42]],
      travelStart: 1101.42,
      travelEnd: 1101.46,
      travelTiming: 'month-level'
    });
  }

  D.timelineHint = '时间轴按 1037–1101 的真实时间线性推进：停留期人物保持在当地，只有进入有资料支持的离开—到达窗口才沿路线移动；缺少具体旅行日期的早期路段不虚构持续时间，而在已知年份节点处压缩跳转。';
  D.note = '时间轴采用线性真实时间。资料给出出发/到达月份或日期的路段，只在对应旅行窗口移动；长期任官、贬居期间人物停留原地。缺少具体旅行日期的早期路段不人为编造持续时间。';
})();
