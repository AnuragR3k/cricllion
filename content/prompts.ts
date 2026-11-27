import type { TierId } from '@/lib/tiers'

export type SeedAnswer = {
  answer: string
  tier: TierId
  aliases?: string[]
  quip?: string
}

export type CuratedPrompt = {
  id: string
  text: string
  category: string
  answers: SeedAnswer[]
}

/** Tier points: single 1, leg bye 10, slog 50, two 100, four 200, six 500. */
function g(tier: TierId, names: string[]): SeedAnswer[] {
  return names.map((answer) => ({ answer, tier }))
}

export const CURATED_PROMPTS: CuratedPrompt[] = [
  {
    id: 'test-grounds',
    text: "Name a ground that has hosted a men's Test match",
    category: 'venues',
    answers: [
      ...g('single', ["Lord's", 'MCG', 'Eden Gardens']),
      ...g('legbye', ['SCG', 'The Oval', 'Old Trafford', 'Wankhede']),
      ...g('slog', [
        'Gabba',
        'Trent Bridge',
        'Headingley',
        'Edgbaston',
        'Adelaide Oval',
        'Galle',
        'Chepauk',
        'Newlands',
      ]),
      ...g('two', [
        'Kensington Oval',
        'Sabina Park',
        'Wanderers',
        'Basin Reserve',
        'WACA',
        'Kingsmead',
        'SuperSport Park',
        'Sophia Gardens',
      ]),
      ...g('four', [
        'Bellerive Oval',
        "Queen's Park Oval",
        'Harare Sports Club',
        'Hagley Oval',
        'Sher-e-Bangla',
      ]),
      ...g('six', [
        'Bourda',
        'Queens Sports Club (Bulawayo)',
        'Antigua Recreation Ground',
        'Brisbane Exhibition Ground',
        'Sheikh Zayed Stadium',
        'Riverside Durham',
      ]),
    ],
  },
  {
    id: 'ipl-centurions',
    text: 'Name a batter who has scored an IPL century',
    category: 'players',
    answers: [
      ...g('single', ['Virat Kohli', 'Chris Gayle', 'Rohit Sharma']),
      ...g('legbye', ['KL Rahul', 'Jos Buttler', 'David Warner', 'AB de Villiers']),
      ...g('slog', [
        'Sanju Samson',
        'Shubman Gill',
        'Shikhar Dhawan',
        'Shane Watson',
        'Rishabh Pant',
        'Suryakumar Yadav',
      ]),
      ...g('two', [
        'Brendon McCullum',
        'Virender Sehwag',
        'Yashasvi Jaiswal',
        'Heinrich Klaasen',
        'Travis Head',
        'Ishan Kishan',
        'Abhishek Sharma',
        'Ruturaj Gaikwad',
      ]),
      ...g('four', [
        'Adam Gilchrist',
        'Michael Hussey',
        'Ajinkya Rahane',
        'Wriddhiman Saha',
        'Devdutt Padikkal',
        'Mayank Agarwal',
        'Ben Stokes',
        'Hashim Amla',
        'Harry Brook',
      ]),
      ...g('six', [
        'Paul Valthaty',
        'Manish Pandey',
        'Murali Vijay',
        'Vaibhav Suryavanshi',
        'Priyansh Arya',
      ]),
    ],
  },
  {
    id: 'india-captains',
    text: 'Name someone who has captained India in an international match',
    category: 'players',
    answers: [
      ...g('single', ['Virat Kohli', 'MS Dhoni', 'Rohit Sharma']),
      ...g('legbye', ['Sourav Ganguly', 'Rahul Dravid', 'Sachin Tendulkar']),
      ...g('slog', [
        'Mohammad Azharuddin',
        'Kapil Dev',
        'Sunil Gavaskar',
        'Hardik Pandya',
        'KL Rahul',
      ]),
      ...g('two', [
        'Anil Kumble',
        'Virender Sehwag',
        'Mansur Ali Khan Pataudi',
        'Shubman Gill',
        'Jasprit Bumrah',
        'Suryakumar Yadav',
        'Rishabh Pant',
        'Shikhar Dhawan',
      ]),
      ...g('four', [
        'Bishan Bedi',
        'Srinivas Venkataraghavan',
        'Dilip Vengsarkar',
        'Ajit Wadekar',
        'Vijay Hazare',
        'Ravi Shastri',
        'Ajay Jadeja',
      ]),
      ...g('six', [
        'Krishnamachari Srikkanth',
        'Lala Amarnath',
        'Polly Umrigar',
        'Nari Contractor',
      ]),
    ],
  },
  {
    id: 'odi-teams',
    text: "Name a team that has played a men's ODI",
    category: 'teams',
    answers: [
      ...g('single', ['India', 'Australia', 'England']),
      ...g('legbye', ['South Africa', 'New Zealand']),
      ...g('slog', ['Sri Lanka', 'West Indies', 'Bangladesh']),
      ...g('two', ['Afghanistan', 'Zimbabwe', 'Ireland']),
      ...g('four', ['Scotland', 'Netherlands', 'UAE', 'Canada', 'Kenya']),
      ...g('six', [
        'Namibia',
        'Nepal',
        'Oman',
        'USA',
        'Papua New Guinea',
        'Bermuda',
        'Hong Kong',
      ]),
    ],
  },
  {
    id: 'test-nations',
    text: 'Name a Test-playing nation',
    category: 'teams',
    answers: [
      ...g('single', ['India', 'Australia', 'England']),
      ...g('legbye', ['South Africa']),
      ...g('slog', ['West Indies', 'New Zealand', 'Sri Lanka']),
      ...g('two', ['Bangladesh']),
      ...g('four', ['Zimbabwe', 'Afghanistan']),
      ...g('six', ['Ireland']),
    ],
  },
  {
    id: 'odi-world-cup-winners',
    text: "Name a country that has won the men's ODI World Cup",
    category: 'records',
    answers: [
      ...g('single', ['India', 'Australia']),
      ...g('legbye', ['West Indies', 'England']),
      ...g('two', ['Sri Lanka']),
    ],
  },
  {
    id: 'odi-double-century',
    text: 'Name a batter with an ODI double century',
    category: 'records',
    answers: [
      ...g('single', ['Rohit Sharma', 'Sachin Tendulkar']),
      ...g('legbye', ['Virender Sehwag']),
      ...g('slog', ['Chris Gayle', 'Shubman Gill']),
      ...g('two', ['Martin Guptill', 'Ishan Kishan']),
      ...g('four', ['Glenn Maxwell']),
      ...g('six', ['Pathum Nissanka']),
    ],
  },
  {
    id: 'test-triple-century',
    text: 'Name a batter with a Test triple century',
    category: 'records',
    answers: [
      ...g('single', ['Don Bradman', 'Brian Lara', 'Virender Sehwag']),
      ...g('legbye', ['Karun Nair', 'Chris Gayle']),
      ...g('slog', ['Mahela Jayawardene', 'Graham Gooch']),
      ...g('two', ['Gary Sobers', 'Hanif Mohammad', 'Harry Brook']),
      ...g('four', ['Hashim Amla', 'Len Hutton', 'Mark Taylor']),
      ...g('six', ['Wiaan Mulder']),
    ],
  },
]
