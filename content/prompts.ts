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

type Entry = string | [answer: string, aliases: string[]]

function g(tier: TierId, entries: Entry[], quip?: string): SeedAnswer[] {
  return entries.map((entry) => {
    if (typeof entry === 'string') {
      return { answer: entry, tier, ...(quip ? { quip } : {}) }
    }
    return { answer: entry[0], tier, aliases: entry[1], ...(quip ? { quip } : {}) }
  })
}

export const CURATED_PROMPTS: CuratedPrompt[] = [
  {
    id: 'shots',
    text: 'Name a cricket shot',
    category: 'terms',
    answers: [
      ...g('duck', ['cover drive', 'pull shot', 'sweep shot', 'cut shot']),
      ...g('slog', ['helicopter shot']),
      ...g('two', [
        'on drive',
        'off drive',
        'square drive',
        'straight drive',
        'hook shot',
        'glance',
        'flick',
        'forward defensive',
        'back foot punch',
        'lofted drive',
      ]),
      ...g('four', [
        'reverse sweep',
        'paddle sweep',
        'slog sweep',
        'upper cut',
        'late cut',
        'inside out shot',
        'ramp shot',
        'dab',
        'square cut',
        'scoop',
      ]),
      ...g('four', [
        'switch hit',
        'dilscoop',
        'mcg scoop',
        'slog sweep six',
      ]),
      ...g(
        'six',
        [['French cut', ['chinese cut', 'french cut shot', 'chinese cut shot']]],
        'An inside edge that somehow misses the stumps — named after neither France nor China.',
      ),
    ],
  },
  {
    id: 'dismissals',
    text: 'Name a way to get out',
    category: 'terms',
    answers: [
      ...g('duck', ['bowled', 'caught', 'lbw', 'run out']),
      ...g('slog', ['stumped']),
      ...g('two', ['caught behind', 'caught and bowled', 'hit wicket', 'caught at slip', 'caught at cover']),
      ...g('four', ['handled the ball', 'obstructing the field', 'hit the ball twice']),
      ...g('four', ['mankad', 'retired out']),
      ...g(
        'six',
        ['timed out'],
        'The batter has three minutes to face up — or the umpire raises a finger before a ball is bowled.',
      ),
    ],
  },
  {
    id: 'fielding-positions',
    text: 'Name a fielding position',
    category: 'terms',
    answers: [
      ...g('duck', ['slip', 'cover', 'point']),
      ...g('slog', ['cow corner']),
      ...g('two', [
        'mid off',
        'mid on',
        'midwicket',
        'square leg',
        'fine leg',
        'third man',
        'long on',
        'long off',
        'gully',
        'extra cover',
      ]),
      ...g('four', [
        'silly point',
        'short leg',
        'leg slip',
        'deep midwicket',
        'sweeper cover',
        'short third man',
        'bat pad',
        'leg gully',
        'backward point',
      ]),
      ...g('four', [
        'fly slip',
        'short fine leg',
        'deep backward square leg',
        'silly mid on',
      ]),
      ...g(
        'six',
        ['long stop'],
        'The fielder behind the keeper. Modern captains pretend he never existed.',
      ),
    ],
  },
  {
    id: 'ipl-teams',
    text: 'Name an IPL team (any season)',
    category: 'ipl',
    answers: [
      ...g('duck', ['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bengaluru', 'Kolkata Knight Riders']),
      ...g('slog', ['Lucknow Super Giants']),
      ...g('two', ['Sunrisers Hyderabad', 'Rajasthan Royals', 'Delhi Capitals', 'Punjab Kings', 'Gujarat Titans']),
      ...g('four', [
        'Deccan Chargers',
        'Gujarat Lions',
        'Pune Warriors',
        ['Royal Challengers Bangalore', ['bangalore']],
        ['Kings XI Punjab', ['kings eleven punjab']],
        ['Delhi Daredevils', ['delhi daredevil']],
      ]),
      ...g('four', ['Rising Pune Supergiant', 'Pune Warriors India']),
      ...g(
        'six',
        [['Kochi Tuskers Kerala', ['kochi', 'tuskers', 'kochi tuskers']]],
        'One season, 2011. Then the franchise was terminated.',
      ),
    ],
  },
  {
    id: 'test-nations',
    text: 'Name a country that has played a Test match',
    category: 'teams',
    answers: [
      ...g('duck', ['England', 'Australia', 'India']),
      ...g('two', ['South Africa', 'Pakistan', 'West Indies', 'New Zealand', 'Sri Lanka']),
      ...g('four', ['Bangladesh', 'Zimbabwe']),
      ...g('four', ['Afghanistan']),
      ...g(
        'six',
        ['Ireland'],
        'Their first Test was in 2018, and they have played only a handful since.',
      ),
    ],
  },
  {
    id: 'english-grounds',
    text: 'Name a cricket ground in England',
    category: 'venues',
    answers: [
      ...g('duck', ["Lord's", 'The Oval']),
      ...g('slog', ['Old Trafford']),
      ...g('two', ['Edgbaston', 'Headingley', 'Trent Bridge', 'Rose Bowl', 'Ageas Bowl']),
      ...g('four', [
        'Sophia Gardens',
        'New Road',
        'Grace Road',
        'County Ground Chelmsford',
        'County Ground Derby',
        'County Ground Northampton',
        'Bristol County Ground',
      ]),
      ...g('four', [
        'Taunton',
        'Canterbury',
        'Cheltenham College',
        'Wantage Road',
        'Hove',
      ]),
      ...g(
        'six',
        ['Riverside Ground'],
        "Durham's Chester-le-Street home was the newest venue to host an Ashes Test.",
      ),
    ],
  },
  {
    id: 'australian-grounds',
    text: 'Name a cricket ground in Australia',
    category: 'venues',
    answers: [
      ...g('duck', [['MCG', ['melbourne cricket ground']], ['SCG', ['sydney cricket ground']]]),
      ...g('slog', ['The Gabba']),
      ...g('two', [
        'Adelaide Oval',
        'WACA',
        'Bellerive Oval',
        'Manuka Oval',
        'Marvel Stadium',
        'Optus Stadium',
      ]),
      ...g('four', ['Carrara Stadium', 'Sydney Showground', 'North Sydney Oval', 'Kardinia Park']),
      ...g('four', ["Cazaly's Stadium", 'TIO Stadium', 'Junction Oval']),
      ...g(
        'six',
        [['Marrara Oval', ['marrara stadium', 'darwin']]],
        "Darwin's AFL ground hosted Test cricket in the 2000s.",
      ),
    ],
  },
  {
    id: 'odi-double',
    text: 'Name a cricketer who has scored an ODI double century',
    category: 'records',
    answers: [
      ...g('duck', [
        ['Rohit Sharma', ['rohit', '264', '209', '208']],
        ['Sachin Tendulkar', ['sachin', '200 not out']],
        ['Virender Sehwag', ['sehwag', '219']],
      ]),
      ...g('two', ['Chris Gayle', 'Martin Guptill']),
      ...g('four', ['Glenn Maxwell', 'Fakhar Zaman']),
      ...g('four', ['Shubman Gill']),
      ...g(
        'six',
        ['Pathum Nissanka'],
        'His 210 not out in 2024 was Sri Lanka’s first ODI double century.',
      ),
    ],
  },
  {
    id: 'ipl-captains',
    text: 'Name a captain who has won the IPL',
    category: 'ipl',
    answers: [
      ...g('duck', [['MS Dhoni', ['dhoni']], ['Rohit Sharma', ['rohit']]]),
      ...g('two', ['Gautam Gambhir', 'David Warner', 'Hardik Pandya']),
      ...g('four', ['Shane Warne', 'Adam Gilchrist']),
      ...g('four', ['Shreyas Iyer']),
      ...g(
        'six',
        ['Rajat Patidar'],
        'Captained Royal Challengers Bengaluru to their first title in 2025.',
      ),
    ],
  },
  {
    id: 'six-sixes',
    text: 'Name a cricketer who has hit six sixes in an over',
    category: 'records',
    answers: [
      ...g('duck', [['Yuvraj Singh', ['yuvraj', 'yuvi']], ['Garfield Sobers', ['gary sobers', 'sobers']]]),
      ...g('slog', ['Herschelle Gibbs']),
      ...g('two', ['Ravi Shastri', 'Kieron Pollard']),
      ...g('four', ['Jaskaran Malhotra', 'Ross Whiteley']),
      ...g('four', ['Dipendra Singh Airee']),
      ...g(
        'six',
        [['Leo Carter', ['carter']]],
        'The Canterbury batter cleared the ropes six times in a 2020 Super Smash over.',
      ),
    ],
  },
  {
    id: 'trophies',
    text: 'Name a cricket trophy or competition',
    category: 'terms',
    answers: [
      ...g('duck', ['World Cup', 'IPL', 'Ashes']),
      ...g('slog', ['T20 World Cup']),
      ...g('two', [
        'Champions Trophy',
        'World Test Championship',
        'Asia Cup',
        'Big Bash League',
        'PSL',
        'Border Gavaskar Trophy',
      ]),
      ...g('four', [
        'Ranji Trophy',
        'County Championship',
        'Vijay Hazare Trophy',
        'Syed Mushtaq Ali Trophy',
        'Duleep Trophy',
        'Wisden Trophy',
      ]),
      ...g('four', ['Deodhar Trophy', 'Challenger Trophy', 'Everest Premier League']),
      ...g(
        'six',
        ['Irani Cup'],
        'Ranji champions versus the Rest of India, often decided on first-innings lead.',
      ),
    ],
  },
  {
    id: 'deliveries',
    text: 'Name a type of delivery',
    category: 'terms',
    answers: [
      ...g('duck', ['yorker', 'bouncer', 'slower ball']),
      ...g('slog', ['googly']),
      ...g('two', [
        'off break',
        'leg break',
        'inswinger',
        'outswinger',
        'full toss',
        'half volley',
        'length ball',
        'beamer',
        'reverse swing',
      ]),
      ...g('four', [
        'doosra',
        'carrom ball',
        'leg cutter',
        'off cutter',
        'flipper',
        'slider',
        'top spinner',
        'knuckleball',
      ]),
      ...g('four', ['moon ball', 'wide yorker', 'slower bouncer', 'dipping yorker']),
      ...g(
        'six',
        ['teesra'],
        "Saqlain Mushtaq's third variation — the one nobody could name at the time.",
      ),
    ],
  },
]
