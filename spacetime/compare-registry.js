window.SPACETIME_COMPARE_REGISTRY = [
  {
    id: 'lubu',
    label: '吕布',
    char: '吕',
    color: '#3f7a55',
    period: '约 160–199',
    defaultSelected: false,
    lifeStart: 160,
    lifeEnd: 199,
    loader: { type: 'json', url: './data/lubu.json' }
  },
  {
    id: 'sudongpo',
    label: '苏东坡',
    char: '苏',
    color: '#b64335',
    defaultSelected: true,
    loader: {
      type: 'scripts',
      urls: ['./sudongpo-data1.js', './sudongpo-data2.js', './sudongpo-timing.js'],
      global: 'SUDONGPO'
    }
  },
  {
    id: 'wanganshi',
    label: '王安石',
    char: '王',
    color: '#276a8f',
    defaultSelected: true,
    loader: { type: 'scripts', urls: ['./wanganshi-data.js'], global: 'SPACETIME_PERSON' }
  },
  {
    id: 'simaguang',
    label: '司马光',
    char: '司',
    color: '#745188',
    defaultSelected: true,
    loader: { type: 'scripts', urls: ['./simaguang-data.js'], global: 'SPACETIME_PERSON' }
  }
];
