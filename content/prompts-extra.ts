import type { CuratedPrompt, SeedAnswer } from './prompts'
import type { TierId } from '@/lib/tiers'

type Entry = string | [answer: string, aliases: string[]]

function g(tier: TierId, entries: Entry[], quip?: string): SeedAnswer[] {
  return entries.map((entry) => {
    if (typeof entry === 'string') {
      return { answer: entry, tier, ...(quip ? { quip } : {}) }
    }
    return { answer: entry[0], tier, aliases: entry[1], ...(quip ? { quip } : {}) }
  })
}

/**
 * Broad "name anything in this category" prompts. Each bank holds 20+ answers
 * so the rarity ladder has room to separate the obvious from the obscure.
 */
export const EXTRA_PROMPTS: CuratedPrompt[] = [
  {
    id: 'city-test-host',
    text: 'Name a city that has hosted a Test match',
    category: 'venues',
    answers: [
      ...g('legbye', ['Melbourne', 'Sydney', 'London', 'Delhi', 'Mumbai']),
      ...g('slog', ['Lahore']),
      ...g('two', ['Kolkata', 'Chennai', 'Bengaluru', 'Adelaide', 'Perth', 'Brisbane', 'Manchester', 'Birmingham']),
      ...g('four', [
        'Leeds', 'Nottingham', 'Southampton', 'Canberra', 'Hobart', 'Colombo', 'Kandy',
        'Cape Town', 'Wellington', 'Dhaka', 'Harare',
      ]),
      ...g('six', ['Darwin'], "Marrara Oval in Darwin hosted a Test in 2003 — better known as an Aussie Rules ground."),
    ],
  },
  {
    id: 'city-worldcup-host',
    text: 'Name a city that has hosted a World Cup match',
    category: 'venues',
    answers: [
      ...g('legbye', ['Mumbai', 'Delhi', 'London', 'Melbourne']),
      ...g('slog', ['Sydney']),
      ...g('two', ['Kolkata', 'Chennai', 'Bengaluru', 'Birmingham', 'Manchester', 'Karachi']),
      ...g('four', [
        'Leeds', 'Nottingham', 'Southampton', 'Bristol', 'Cape Town', 'Auckland',
        'Wellington', 'Galle', 'Dhaka', 'Chester-le-Street',
      ]),
      ...g('six', ['Cardiff'], "Sophia Gardens only joined the World Cup rota in 2019."),
    ],
  },
  {
    id: 'city-ipl-host',
    text: 'Name a city that has hosted an IPL match',
    category: 'ipl',
    answers: [
      ...g('legbye', ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai']),
      ...g('slog', ['Kolkata']),
      ...g('two', ['Hyderabad', 'Jaipur', 'Ahmedabad', 'Mohali', 'Pune', 'Visakhapatnam']),
      ...g('four', [
        'Chandigarh', 'Kochi', 'Kanpur', 'Guwahati', 'Indore', 'Nagpur', 'Dharamsala',
        'Dubai', 'Sharjah', 'Abu Dhabi',
      ]),
      ...g('six', [['Port Elizabeth', ['gqeberha']]], 'The whole 2009 IPL decamped to South Africa; Port Elizabeth was one of the hosts.'),
    ],
  },
  {
    id: 'india-grounds',
    text: 'Name a cricket stadium in India',
    category: 'venues',
    answers: [
      ...g('legbye', ['Wankhede Stadium', 'Eden Gardens', 'M. A. Chidambaram Stadium']),
      ...g('slog', ['Chinnaswamy Stadium']),
      ...g('two', [
        'Arun Jaitley Stadium', 'Punjab Cricket Association Stadium', 'Sardar Patel Stadium',
        'Vidarbha Cricket Association Ground', 'Rajiv Gandhi International Stadium', 'Green Park',
      ]),
      ...g('four', [
        'Barabati Stadium', 'Reliance Stadium', 'Jawaharlal Nehru Stadium Kochi',
        'Sawai Mansingh Stadium', 'Himachal Pradesh Cricket Association Stadium',
        'Maharashtra Cricket Association Stadium', 'Ekana Cricket Stadium',
        'Captain Roop Singh Stadium', 'ACA-VDCA Stadium', 'Nehru Stadium Guwahati',
      ]),
      ...g('six', ['Barkatullah Khan Stadium'], "Indore's ground hosted a couple of ODIs in the early 2000s, then went quiet."),
    ],
  },
  {
    id: 'odi-nations',
    text: 'Name a country that has played ODI cricket',
    category: 'teams',
    answers: [
      ...g('legbye', ['India', 'Australia', 'England']),
      ...g('slog', ['Pakistan']),
      ...g('two', ['Sri Lanka', 'West Indies', 'South Africa', 'New Zealand', 'Bangladesh', 'Zimbabwe']),
      ...g('four', [
        'Afghanistan', 'Ireland', 'Scotland', 'Netherlands', 'Kenya', 'Canada', 'USA',
        'Nepal', 'Oman', 'UAE', 'Hong Kong',
      ]),
      ...g('six', ['Bermuda'], 'Bermuda punched above its weight at the 2006 and 2009 World Cups.'),
    ],
  },
  {
    id: 't20i-nations',
    text: 'Name a country that has played T20I cricket',
    category: 'teams',
    answers: [
      ...g('legbye', ['India', 'Australia', 'England']),
      ...g('slog', ['Pakistan']),
      ...g('two', ['Sri Lanka', 'West Indies', 'South Africa', 'New Zealand', 'Bangladesh', 'Afghanistan']),
      ...g('four', [
        'Ireland', 'Scotland', 'Netherlands', 'USA', 'Canada', 'Nepal', 'Oman', 'UAE',
        'Hong Kong', 'PNG', 'Namibia', 'Uganda', 'Indonesia', 'Japan',
      ]),
      ...g('six', ['Bhutan'], 'One of the newer associates to step into the T20I arena.'),
    ],
  },
  {
    id: 'firstclass-nations',
    text: 'Name a country that has played first-class cricket',
    category: 'teams',
    answers: [
      ...g('legbye', ['India', 'England', 'Australia']),
      ...g('slog', ['South Africa']),
      ...g('two', ['Pakistan', 'Sri Lanka', 'West Indies', 'New Zealand', 'Bangladesh', 'Zimbabwe']),
      ...g('four', [
        'Ireland', 'Scotland', 'Netherlands', 'Kenya', 'Canada', 'USA', 'Afghanistan',
        'Namibia', 'Denmark', 'Oman', 'UAE', 'Hong Kong', 'Nepal', 'Malaysia',
      ]),
      ...g('six', ['Argentina'], 'Yes — Argentina has played first-class cricket, mostly against touring MCC sides.'),
    ],
  },
  {
    id: 'icc-associates',
    text: 'Name an associate member of the ICC',
    category: 'teams',
    answers: [
      ...g('legbye', ['Nepal', 'Oman', 'UAE', 'USA']),
      ...g('slog', ['Hong Kong']),
      ...g('two', ['Canada', 'Kenya', 'Namibia', 'PNG', 'Singapore', 'Malaysia']),
      ...g('four', [
        'Uganda', 'Tanzania', 'Nigeria', 'Ghana', 'Indonesia', 'Japan', 'Thailand',
        'Philippines', 'Kuwait', 'Bahrain', 'Qatar', 'Vanuatu', 'Samoa', 'Fiji',
      ]),
      ...g('six', ['Bhutan'], 'A relative newcomer on the associate list.'),
    ],
  },
  {
    id: 'cricket-boards',
    text: 'Name a national cricket board',
    category: 'orgs',
    answers: [
      ...g('legbye', ['BCCI', 'ECB', 'Cricket Australia']),
      ...g('slog', ['PCB']),
      ...g('two', [
        'Sri Lanka Cricket', 'Cricket West Indies', 'Cricket South Africa',
        'New Zealand Cricket', 'BCB', 'Zimbabwe Cricket',
      ]),
      ...g('four', [
        'Cricket Ireland', 'Cricket Scotland', 'KNCB', 'Cricket Kenya', 'USA Cricket',
        'Cricket Canada', 'Oman Cricket', 'Emirates Cricket Board',
        'Hong Kong Cricket Association', 'Cricket PNG', 'Namibia Cricket',
      ]),
      ...g('six', ['Japan Cricket Association'], 'The JCA has been pushing hard to develop the game in East Asia.'),
    ],
  },
  {
    id: 'city-t20wc-host',
    text: 'Name a city that has hosted a T20 World Cup match',
    category: 'venues',
    answers: [
      ...g('legbye', ['Mumbai', 'Delhi', 'London', 'Melbourne']),
      ...g('slog', ['Dubai']),
      ...g('two', ['Kolkata', 'Chennai', 'Bengaluru', 'Birmingham', 'Manchester', 'Cape Town']),
      ...g('four', [
        'Sharjah', 'Abu Dhabi', 'Colombo', 'Kandy', 'Mirpur', 'Chittagong', 'Gros Islet',
        'Bridgetown', 'Kingston', 'Durban', 'Johannesburg', 'Centurion',
      ]),
      ...g('six', ['North Sound'], 'The Sir Vivian Richards Stadium at North Sound has hosted T20 World Cup matches.'),
    ],
  },
  {
    id: 'test-centurions',
    text: 'Name a cricketer who has scored a Test century',
    category: 'records',
    answers: [
      ...g('legbye', ['Sachin Tendulkar', 'Virat Kohli', 'Don Bradman']),
      ...g('slog', ['Ricky Ponting']),
      ...g('two', [
        'Jacques Kallis', 'Rahul Dravid', 'Brian Lara', 'Virender Sehwag',
        'Kumar Sangakkara', 'Mahela Jayawardene', 'Joe Root',
      ]),
      ...g('four', [
        'Steve Smith', 'David Warner', 'Hashim Amla', 'AB de Villiers', 'Sunil Gavaskar',
        'Gundappa Viswanath', 'Greg Chappell', 'Allan Border', 'Steve Waugh', 'Wally Hammond',
        'Len Hutton', 'Garfield Sobers', 'Viv Richards', 'David Gower', 'Graham Gooch',
        'Alastair Cook', 'Ben Stokes',
      ]),
      ...g('six', ['Hanif Mohammad'], 'His 337* at Bridgetown in 1958 took nearly 10 hours.'),
    ],
  },
  {
    id: 'odi-centurions',
    text: 'Name a cricketer who has scored an ODI century',
    category: 'records',
    answers: [
      ...g('legbye', ['Sachin Tendulkar', 'Virat Kohli', 'Rohit Sharma']),
      ...g('slog', ['Ricky Ponting']),
      ...g('two', [
        'Jacques Kallis', 'Rahul Dravid', 'Sourav Ganguly', 'Virender Sehwag',
        'MS Dhoni', 'Yuvraj Singh', 'Shubman Gill',
      ]),
      ...g('four', [
        'Hashim Amla', 'AB de Villiers', 'Kumar Sangakkara', 'Mahela Jayawardene',
        'Brian Lara', 'David Warner', 'Aaron Finch', 'Glenn Maxwell', 'Martin Guptill',
        'Brendon McCullum', 'Babar Azam', 'Fakhar Zaman', 'Shikhar Dhawan', 'K. L. Rahul',
      ]),
      ...g('six', ['Desmond Haynes'], 'The West Indies opener made 17 ODI hundreds and rarely gets the credit.'),
    ],
  },
  {
    id: 't20i-centurions',
    text: 'Name a cricketer who has scored a T20I century',
    category: 'records',
    answers: [
      ...g('legbye', ['Rohit Sharma', 'Yuvraj Singh']),
      ...g('slog', ['Virat Kohli']),
      ...g('two', [
        'Glenn Maxwell', 'Chris Gayle', 'Brendon McCullum', 'Martin Guptill',
        'Colin Munro', 'Aaron Finch', 'David Warner',
      ]),
      ...g('four', [
        'AB de Villiers', 'Fakhar Zaman', 'Babar Azam', 'Ahmed Shehzad', 'Tillakaratne Dilshan',
        'Pathum Nissanka', 'Johnson Charles', 'Kevin Pietersen', 'Hashim Amla', 'Shane Watson',
      ]),
      ...g('six', ['Dipendra Singh Airee'], 'Nepal’s middle-order batter cleared the ropes for a T20I hundred.'),
    ],
  },
  {
    id: 'test-five-fors',
    text: 'Name a bowler who has taken five wickets in a Test innings',
    category: 'records',
    answers: [
      ...g('legbye', ['Muttiah Muralitharan', 'Shane Warne', 'Anil Kumble']),
      ...g('slog', ['James Anderson']),
      ...g('two', [
        'Glenn McGrath', 'Courtney Walsh', 'Malcolm Marshall', 'Curtly Ambrose',
        'Richard Hadlee', 'Ian Botham', 'Kapil Dev', 'Imran Khan',
      ]),
      ...g('four', [
        'Waqar Younis', 'Wasim Akram', 'Dennis Lillee', 'Michael Holding', 'Andy Roberts',
        'Joel Garner', 'Colin Croft', 'Derek Underwood', 'Nathan Lyon', 'Ravichandran Ashwin',
        'Stuart Broad', 'Hedley Verity',
      ]),
      ...g('six', ['Hugh Trumble'], 'The Australian off-spinner took eight five-fors in 14 Tests.'),
    ],
  },
  {
    id: 'odi-five-fors',
    text: 'Name a bowler who has taken five wickets in an ODI innings',
    category: 'records',
    answers: [
      ...g('legbye', ['Muttiah Muralitharan', 'Glenn McGrath', 'Shane Warne']),
      ...g('slog', ['Lasith Malinga']),
      ...g('two', [
        'Wasim Akram', 'Waqar Younis', 'Allan Donald', 'Shaheen Afridi', 'Shaun Tait' /* verify */,
        'Mitchell Starc', 'Adam Zampa', 'Kagiso Rabada',
      ]),
      ...g('four', [
        'Saeed Ajmal', 'Shahid Afridi', 'Trent Boult', 'Tim Southee', 'Ravichandran Ashwin',
        'Dwayne Bravo', 'Sunil Narine', 'Thisara Perera', 'Maheesh Theekshana',
      ]),
      ...g('six', ['Kuldeep Yadav'], 'The left-arm wrist-spinner has twice taken five in an ODI innings.'),
    ],
  },
  {
    id: 'test-100-wickets',
    text: 'Name a bowler who has taken 100+ Test wickets',
    category: 'records',
    answers: [
      ...g('legbye', ['Muttiah Muralitharan', 'Shane Warne', 'James Anderson']),
      ...g('slog', ['Anil Kumble']),
      ...g('two', [
        'Glenn McGrath', 'Courtney Walsh', 'Malcolm Marshall', 'Curtly Ambrose',
        'Richard Hadlee', 'Ian Botham', 'Kapil Dev', 'Imran Khan',
      ]),
      ...g('four', [
        'Waqar Younis', 'Wasim Akram', 'Dennis Lillee', 'Michael Holding', 'Andy Roberts',
        'Joel Garner', 'Colin Croft', 'Derek Underwood', 'Stuart Broad', 'Nathan Lyon',
        'Ravichandran Ashwin', 'Graeme Swann',
      ]),
      ...g('six', ['Hugh Trumble'], 'A 19th-century off-spinner with 141 Test wickets.'),
    ],
  },
  {
    id: 'odi-5000-runs',
    text: 'Name a cricketer who has scored 5,000+ ODI runs',
    category: 'records',
    answers: [
      ...g('legbye', ['Sachin Tendulkar', 'Virat Kohli', 'Ricky Ponting']),
      ...g('slog', ['Rohit Sharma']),
      ...g('two', [
        'Jacques Kallis', 'Rahul Dravid', 'Sourav Ganguly', 'MS Dhoni', 'Virender Sehwag',
        'Kumar Sangakkara', 'Mahela Jayawardene',
      ]),
      ...g('four', [
        'Hashim Amla', 'AB de Villiers', 'Brian Lara', 'Shivnarine Chanderpaul',
        'Tillakaratne Dilshan', 'Desmond Haynes', 'Steve Waugh', 'Allan Border',
        'Michael Bevan', 'Kevin Pietersen', 'Shikhar Dhawan',
      ]),
      ...g('six', ['Babar Azam'], 'Fast-forward to the modern era: Babar joined the 10,000-run club in 2025.'),
    ],
  },
  {
    id: 'test-1000-runs',
    text: 'Name a cricketer who has scored 1,000+ Test runs',
    category: 'records',
    answers: [
      ...g('legbye', ['Sachin Tendulkar', 'Virat Kohli', 'Don Bradman']),
      ...g('slog', ['Joe Root']),
      ...g('two', [
        'Ricky Ponting', 'Jacques Kallis', 'Rahul Dravid', 'Brian Lara', 'Kumar Sangakkara',
        'Mahela Jayawardene', 'Sunil Gavaskar',
      ]),
      ...g('four', [
        'Greg Chappell', 'Allan Border', 'Steve Waugh', 'Wally Hammond', 'Len Hutton',
        'Garfield Sobers', 'Viv Richards', 'David Gower', 'Graham Gooch', 'Alastair Cook',
        'Ben Stokes', 'Hashim Amla', 'AB de Villiers', 'Virender Sehwag',
      ]),
      ...g('six', ['Herbert Sutcliffe'], 'The Yorkshire opener averaged over 60 in 54 Tests.'),
    ],
  },
  {
    id: 'test-captains',
    text: 'Name a cricketer who has captained a Test team',
    category: 'players',
    answers: [
      ...g('legbye', ['MS Dhoni', 'Virat Kohli', 'Don Bradman']),
      ...g('slog', ['Ricky Ponting']),
      ...g('two', [
        'Sourav Ganguly', 'Rahul Dravid', 'Anil Kumble', 'Sunil Gavaskar', 'Greg Chappell',
        'Allan Border', 'Steve Waugh',
      ]),
      ...g('four', [
        'Joe Root', 'Alastair Cook', 'Andrew Strauss', 'Michael Clarke', 'Steve Smith',
        'Imran Khan', 'Javed Miandad', 'Garfield Sobers', 'Clive Lloyd', 'Viv Richards',
      ]),
      ...g('six', ['Bill Woodfull'], 'The stoic Australian captain of the 1930s Bodyline series.'),
    ],
  },
  {
    id: 'odi-captains',
    text: 'Name a cricketer who has captained an ODI team',
    category: 'players',
    answers: [
      ...g('legbye', ['MS Dhoni', 'Virat Kohli', 'Rohit Sharma']),
      ...g('slog', ['Sourav Ganguly']),
      ...g('two', [
        'Rahul Dravid', 'Sachin Tendulkar', 'Ricky Ponting', 'Michael Clarke',
        'Aaron Finch', 'Joe Root', 'Eoin Morgan',
      ]),
      ...g('four', [
        'Imran Khan', 'Javed Miandad', 'Inzamam-ul-Haq', 'Sarfaraz Ahmed', 'Babar Azam',
        'Mahela Jayawardene', 'Angelo Mathews', 'Clive Lloyd',
        'Darren Sammy', 'Stephen Fleming', 'Brendon McCullum',
      ]),
      ...g('six', ['Arjuna Ranatunga'], 'He transformed Sri Lanka into 1996 world champions with a canny, confrontational style.'),
    ],
  },
  {
    id: 't20i-captains',
    text: 'Name a cricketer who has captained a T20I team',
    category: 'players',
    answers: [
      ...g('legbye', ['Virat Kohli', 'Rohit Sharma', 'MS Dhoni']),
      ...g('slog', ['Eoin Morgan']),
      ...g('two', [
        'Jos Buttler', 'Ben Stokes', 'Aaron Finch', 'Steve Smith', 'David Warner',
        'Babar Azam', 'Shoaib Malik',
      ]),
      ...g('four', [
        'Nicholas Pooran', 'Kieron Pollard', 'Shakib Al Hasan',
        'Mashrafe Mortaza', 'Angelo Mathews', 'Lasith Malinga', 'Kane Williamson',
        'Sarfaraz Ahmed',
      ]),
      ...g('six', ['Darren Sammy'], 'The Windies captain won both 2012 and 2016 T20 World Cups.'),
    ],
  },
  {
    id: 't20i-fifties',
    text: 'Name a cricketer who has scored a T20I half-century',
    category: 'records',
    answers: [
      ...g('legbye', ['Virat Kohli', 'Rohit Sharma', 'Babar Azam']),
      ...g('slog', ['Shoaib Malik']),
      ...g('two', [
        'MS Dhoni', 'Yuvraj Singh', 'Suresh Raina', 'Rahul', 'Shikhar Dhawan',
        'David Warner', 'Steve Smith', 'Aaron Finch',
      ]),
      ...g('four', [
        'Glenn Maxwell', 'Brendon McCullum', 'Martin Guptill', 'Kane Williamson',
        'Colin Munro', 'AB de Villiers', 'Fakhar Zaman', 'Mohammad Hafeez',
        'Tillakaratne Dilshan', 'Mahela Jayawardene', 'Dwayne Smith', 'Chris Gayle',
      ]),
      ...g('six', ['Dipendra Singh Airee'], 'Nepal’s explosive batter has racked up T20I fifties too.'),
    ],
  },
  {
    id: 't20i-50-wickets',
    text: 'Name a bowler who has taken 50+ T20I wickets',
    category: 'records',
    answers: [
      ...g('legbye', ['Lasith Malinga', 'Yuzvendra Chahal', 'Bhuvneshwar Kumar']),
      ...g('slog', ['Jasprit Bumrah']),
      ...g('two', [
        'Mohammed Shami', 'Kuldeep Yadav', 'Ravichandran Ashwin', 'Shaheen Afridi',
        'Shadab Khan', 'Hasan Ali', 'Trent Boult', 'Tim Southee',
      ]),
      ...g('four', [
        'Mitchell Starc', 'Adam Zampa', 'Dwayne Bravo', 'Sunil Narine', 'Kagiso Rabada',
        'Tabraiz Shamsi', 'Thisara Perera', 'Wanindu Hasaranga', 'Nuwan Kulasekara',
        'Mashrafe Mortaza', 'Shakib Al Hasan',
      ]),
      ...g('six', ['Sandeep Lamichhane'], 'Nepal’s leg-spinner has been a wicket-machine on the associate circuit.'),
    ],
  },
  {
    id: 'ipl-winners',
    text: 'Name a cricketer who has won the IPL as a player',
    category: 'ipl',
    answers: [
      ...g('legbye', ['MS Dhoni', 'Rohit Sharma', 'Virat Kohli']),
      ...g('slog', ['Gautam Gambhir']),
      ...g('two', [
        'Suresh Raina', 'Kieron Pollard', 'Dwayne Bravo', 'Hardik Pandya',
        'Ravindra Jadeja', 'Dwayne Smith', 'Michael Hussey',
      ]),
      ...g('four', [
        'Shane Warne', 'Adam Gilchrist', 'Andrew Symonds', 'Matthew Hayden',
        'Muttiah Muralitharan', 'Lasith Malinga', 'Brendon McCullum', 'Jacques Kallis',
        'Yuvraj Singh', 'Harbhajan Singh', 'Piyush Chawla',
      ]),
      ...g('six', ['Rajat Patidar'], 'He captained RCB to their first IPL title in 2025.'),
    ],
  },
  {
    id: 'ipl-final-players',
    text: 'Name a cricketer who has played in an IPL final',
    category: 'ipl',
    answers: [
      ...g('legbye', ['MS Dhoni', 'Rohit Sharma', 'Virat Kohli']),
      ...g('slog', ['Gautam Gambhir']),
      ...g('two', [
        'Suresh Raina', 'Kieron Pollard', 'Dwayne Bravo', 'Hardik Pandya',
        'Ravindra Jadeja', 'Michael Hussey', 'Malinga',
      ]),
      ...g('four', [
        'Shane Warne', 'Adam Gilchrist', 'Andrew Symonds', 'Matthew Hayden',
        'Brendon McCullum', 'Jacques Kallis', 'Yuvraj Singh', 'Harbhajan Singh',
        'Piyush Chawla', 'Amit Mishra', 'Naman Ojha', 'Manish Pandey',
      ]),
      ...g('six', ['Rajat Patidar'], 'The 2025 final made him a champion as captain as well as a finalist as a player.'),
    ],
  },
  {
    id: 'ipl-three-teams',
    text: 'Name a player who has played for three or more IPL teams',
    category: 'ipl',
    answers: [
      ...g('legbye', ['Yuvraj Singh', 'Chris Gayle']),
      ...g('slog', ['Harbhajan Singh']),
      ...g('two', [
        'Yusuf Pathan', 'Irfan Pathan', 'Amit Mishra', 'Piyush Chawla',
        'Naman Ojha', 'Manish Pandey', 'Ashok Dinda',
      ]),
      ...g('four', [
        'Praveen Kumar', 'Mohit Sharma', 'Kedar Jadhav', 'Suresh Raina', 'Rohit Sharma',
        'Parthiv Patel', 'Wriddhiman Saha', 'Manoj Tiwary', 'Jalaj Saxena',
        'Varun Aaron', 'Stuart Binny',
      ]),
      ...g('six', ['Amit Bhandari'], 'A fringe seamer who turned out for several early IPL franchises.'),
    ],
  },
  {
    id: 'women-odi-players',
    text: 'Name a woman who has played ODI cricket',
    category: 'players',
    answers: [
      ...g('legbye', ['Mithali Raj', 'Smriti Mandhana', 'Ellyse Perry']),
      ...g('slog', ['Harmanpreet Kaur']),
      ...g('two', [
        'Suzie Bates', 'Sophie Devine', 'Meg Lanning', 'Alyssa Healy',
        'Beth Mooney', 'Charlotte Edwards', 'Heather Knight',
      ]),
      ...g('four', [
        'Sarah Taylor', 'Katherine Brunt', 'Isa Guha', 'Jenny Gunn', 'Claire Taylor',
        'Karen Rolton', 'Lisa Keightley', 'Belinda Clark', 'Amy Satterthwaite',
        'Rachael Haynes', 'Debbie Hockley', 'Haidee Tiffen',
      ]),
      ...g('six', ['Betty Snowball'], 'An English pioneer from the 1930s who also played Test cricket.'),
    ],
  },
  {
    id: 'women-odi-fifties',
    text: 'Name a woman who has scored an ODI half-century',
    category: 'records',
    answers: [
      ...g('legbye', ['Mithali Raj', 'Smriti Mandhana', 'Ellyse Perry']),
      ...g('slog', ['Harmanpreet Kaur']),
      ...g('two', [
        'Suzie Bates', 'Sophie Devine', 'Meg Lanning', 'Alyssa Healy',
        'Beth Mooney', 'Charlotte Edwards', 'Heather Knight',
      ]),
      ...g('four', [
        'Sarah Taylor', 'Katherine Brunt', 'Jenny Gunn', 'Claire Taylor',
        'Karen Rolton', 'Lisa Keightley', 'Belinda Clark', 'Amy Satterthwaite',
        'Rachael Haynes', 'Holly Colvin', 'Lydia Greenway',
      ]),
      ...g('six', ['Debbie Hockley'], 'The New Zealand opener was the first woman to score 4,000 ODI runs.'),
    ],
  },
  {
    id: 'women-t20i-players',
    text: 'Name a woman who has played T20I cricket',
    category: 'players',
    answers: [
      ...g('legbye', ['Smriti Mandhana', 'Harmanpreet Kaur', 'Ellyse Perry']),
      ...g('slog', ['Mithali Raj']),
      ...g('two', [
        'Suzie Bates', 'Sophie Devine', 'Meg Lanning', 'Alyssa Healy',
        'Beth Mooney', 'Heather Knight', 'Sarah Taylor',
      ]),
      ...g('four', [
        'Shafali Verma', 'Jemimah Rodrigues', 'Deepti Sharma', 'Pooja Vastrakar',
        'Sophie Ecclestone', 'Katherine Brunt', 'Natasha Sciver-Brunt', 'Amy Jones',
        'Laura Wolvaardt', 'Lizelle Lee', 'Sune Luus', 'Chamari Athapaththu',
      ]),
      ...g('six', ['Nashra Sandhu'], 'Pakistan’s left-arm spinner has been a T20I regular.'),
    ],
  },
  {
    id: 'odi-100-wickets',
    text: 'Name a bowler who has taken 100+ ODI wickets',
    category: 'records',
    answers: [
      ...g('legbye', ['Muttiah Muralitharan', 'Glenn McGrath', 'Wasim Akram']),
      ...g('slog', ['Lasith Malinga']),
      ...g('two', [
        'Waqar Younis', 'Shane Warne', 'Allan Donald', 'Javed Miandad' /* verify */,
        'Saeed Ajmal', 'Shahid Afridi', 'Mitchell Starc',
      ]),
      ...g('four', [
        'Chaminda Vaas', 'Sanath Jayasuriya', 'Ravichandran Ashwin', 'Yuzvendra Chahal',
        'Kagiso Rabada', 'Imran Tahir', 'Trent Boult', 'Tim Southee', 'Dwayne Bravo',
        'Sunil Narine', 'Thisara Perera', 'Shaheen Afridi',
      ]),
      ...g('six', ['Shoaib Akhtar'], 'The Rawalpindi Express claimed 163 ODI wickets.'),
    ],
  },
  {
    id: 'umpires',
    text: 'Name an international cricket umpire',
    category: 'people',
    answers: [
      ...g('legbye', ['Simon Taufel', 'Aleem Dar']),
      ...g('slog', ['Richard Kettleborough']),
      ...g('two', [
        'Michael Gough', 'Ian Gould', 'Nigel Llong', 'Billy Bowden', 'Rod Tucker',
        'Bruce Oxenford', 'Steve Davis',
      ]),
      ...g('four', [
        'Joel Wilson', 'Paul Wilson', 'Marais Erasmus', 'Adrian Holdstock',
        'Kumar Dharmasena', 'Ruchira Palliyaguruge', 'Chris Gaffaney',
        'Sundaram Ravi', 'Anil Chaudhary', 'Billy Taylor' /* verify */,
      ]),
      ...g('six', ['Jeff Evans'], 'The Welsh umpire stood in the 2019 World Cup final.'),
    ],
  },
  {
    id: 'commentators',
    text: 'Name a cricket commentator',
    category: 'people',
    answers: [
      ...g('legbye', ['Harsha Bhogle', 'Ravi Shastri']),
      ...g('slog', ['Michael Holding']),
      ...g('two', [
        'Nasser Hussain', 'Jonathan Agnew', 'Geoffrey Boycott', 'David Lloyd',
        'Andrew Flintoff', 'Sunil Gavaskar', 'Sanjay Manjrekar',
      ]),
      ...g('four', [
        'Richie Benaud', 'Tony Greig', 'Ian Chappell', 'Alan Wilkins', 'Jim Maxwell',
        'Anjum Chopra', 'Derek Pringle', 'Mike Atherton', 'Ed Smith' /* verify */,
      ]),
      ...g('six', ['Brian Johnston'], '"Johnners" — the voice of Test Match Special for decades.'),
    ],
  },
  {
    id: 'coaches',
    text: 'Name a cricket coach',
    category: 'people',
    answers: [
      ...g('legbye', ['John Wright', 'Gary Kirsten']),
      ...g('slog', ['Ravi Shastri']),
      ...g('two', [
        'Duncan Fletcher', 'Andy Flower', 'Rahul Dravid', 'Anil Kumble',
        'Trevor Bayliss', 'Chris Silverwood', 'Brendon McCullum',
      ]),
      ...g('four', [
        'John Buchanan', 'Mickey Arthur', 'Bob Woolmer', 'Dav Whatmore',
        'Mike Brearley', 'Greg Chappell', 'Daryl Cullinan' /* verify */,
        'Andy Bichel' /* verify */, 'Richard McInnes' /* verify */,
      ]),
      ...g('six', ['Dudley Nourse'], 'A South African batting great who also coached.'),
    ],
  },
  {
    id: 'cricket-nicknames',
    text: 'Name a nickname of a famous cricketer',
    category: 'culture',
    answers: [
      ...g('legbye', ['The Don', 'The Little Master']),
      ...g('slog', ['The King']),
      ...g('two', [
        'Mr. Dependable', 'The Wall', 'The Captain Cool', 'The Hitman',
        'The Iceman', 'The God',
      ]),
      ...g('four', [
        'The Professor', 'The Tiger', 'The Maestro', 'The Prince', 'The Pigeon',
        'The Guesser', 'The King of Spin', 'The Little General', 'The Rock',
        'The Magician',
      ]),
      ...g('six', ['The Master Blaster'], 'Sachin Tendulkar’s other great nickname.'),
    ],
  },
  {
    id: 'bat-brands',
    text: 'Name a brand of cricket bat',
    category: 'gear',
    answers: [
      ...g('legbye', ['MRF', 'Gray-Nicolls']),
      ...g('slog', ['Kookaburra']),
      ...g('two', ['Gunn & Moore', 'SS', 'CEAT', 'Puma', 'Adidas', 'Reebok']),
      ...g('four', [
        'Nivia', 'BDM', 'DSC', 'VKS', 'Sareen', 'Slazenger', 'Ton', 'Striker',
        'Whit', 'Atlas', 'Chase', 'Bownet',
      ]),
      ...g('six', ['Hillerich & Bradsby'], 'The Louisville Slugger maker once tried cricket bats too.'),
    ],
  },
  {
    id: 'equipment',
    text: 'Name a piece of cricket equipment',
    category: 'gear',
    answers: [
      ...g('legbye', ['Bat', 'Ball', 'Helmet']),
      ...g('slog', ['Pads']),
      ...g('two', [
        'Batting gloves', 'Wicketkeeping gloves', 'Arm guard', 'Chest guard',
        'Thigh pad', 'Abdominal guard', 'Spikes', 'Cap',
      ]),
      ...g('four', [
        'Sunglasses', 'Sunscreen', 'Grip', 'Wicket', 'Stumps', 'Bails', 'Sight screen',
        'Boundary rope', 'Scoreboard', 'Practice net', 'Cones', 'Bat cover',
      ]),
      ...g('six', ['Box'], 'The humble protector — technically the abdominal guard.'),
    ],
  },
  {
    id: 'cricket-terms',
    text: 'Name a cricket term',
    category: 'terms',
    answers: [
      ...g('legbye', ['Over', 'Wicket', 'Run']),
      ...g('slog', ['Maiden over']),
      ...g('two', [
        'Wide', 'No-ball', 'Bye', 'Leg bye', 'LBW', 'Follow-on', 'Declaration',
        'Duck', 'Hat-trick', 'Partnership',
      ]),
      ...g('four', [
        'Run rate', 'Net run rate', 'Super over', 'Review', 'Nightwatchman',
        'Tailender', 'Opener', 'All-rounder', 'Crease', 'Bails', 'Third umpire',
        'Silly point', 'Long stop', 'Carry',
      ]),
      ...g('six', ['Nelson'], '111 — the score cricketers are oddly superstitious about.'),
    ],
  },
  {
    id: 'formats',
    text: 'Name a format or variant of cricket',
    category: 'terms',
    answers: [
      ...g('legbye', ['Test cricket', 'ODI', 'T20']),
      ...g('slog', ['The Hundred']),
      ...g('two', [
        'T20I', 'List A', 'First-class cricket', 'Four-day cricket',
        'Three-day cricket', '50-over cricket', '20-over cricket',
      ]),
      ...g('four', [
        'T10', 'Six-a-side cricket', 'Indoor cricket', 'Street cricket',
        'Gully cricket', 'Beach cricket', 'Blind cricket', 'Wheelchair cricket',
        'Women’s cricket', 'Two-day cricket', '10-over cricket',
      ]),
      ...g('six', ['Underarm cricket'], 'The original form of the game, still played in some village fixtures.'),
    ],
  },
  {
    id: 'ground-parts',
    text: 'Name a part of a cricket ground or pitch',
    category: 'terms',
    answers: [
      ...g('legbye', ['Pitch', 'Wicket', 'Outfield']),
      ...g('slog', ['Crease']),
      ...g('two', [
        'Popping crease', 'Bowling crease', 'Stumps', 'Bails',
        'Boundary rope', 'Sight screen', 'Square',
      ]),
      ...g('four', [
        'Infield', 'Deep', 'Slip cordon', 'Dugout', 'Pavilion',
        'Scoreboard', 'Grandstand', 'Floodlight tower', 'Practice net',
        'Third-man area', 'Cow corner', 'Dead ball area',
      ]),
      ...g('six', ['Return crease'], 'The often-forgotten line that decides whether a bowler wide is called.'),
    ],
  },
  {
    id: 'domestic-competitions',
    text: 'Name a domestic cricket competition',
    category: 'terms',
    answers: [
      ...g('legbye', ['Ranji Trophy', 'County Championship']),
      ...g('slog', ['Sheffield Shield']),
      ...g('two', [
        'Plunket Shield', 'Currie Cup', 'Logan Cup', 'Quaid-e-Azam Trophy',
        'Duleep Trophy', 'Deodhar Trophy', 'Irani Cup',
      ]),
      ...g('four', [
        'Vijay Hazare Trophy', 'Syed Mushtaq Ali Trophy', 'Intercontinental Cup',
        'C. K. Nayudu Trophy', 'Vinoo Mankad Trophy', 'National Cricket League',
        'Bangladesh Cricket League', 'Inter-Provincial Championship', 'President’s Trophy',
      ]),
      ...g('six', ['MCC Trophy'], 'A nod to the Marylebone Cricket Club’s own domestic competition.'),
    ],
  },
  {
    id: 'cricket-awards',
    text: 'Name a cricket award',
    category: 'terms',
    answers: [
      ...g('legbye', ['Player of the Match', 'Player of the Series']),
      ...g('slog', ['Orange Cap']),
      ...g('two', [
        'Purple Cap', 'ICC Player of the Year', 'Emerging Player of the Year',
        'Wisden Cricketer of the Year', 'Player of the Tournament',
      ]),
      ...g('four', [
        'ICC Test Player of the Year', 'ICC ODI Player of the Year',
        'ICC T20I Player of the Year', 'ICC Hall of Fame', 'Most Valuable Player',
        'Golden Ball' /* verify */, 'Fielder of the Series' /* verify */,
        'Best Batsman of the Tournament', 'Best Bowler of the Tournament',
        'Fielder of the Tournament', 'Most Runs Award',
      ]),
      ...g('six', ['Wisden Leading Cricketer in the World'], 'The almanac’s pick of the best in the world each year.'),
    ],
  },
  {
    id: 'worldcup-winners',
    text: 'Name a cricketer who has won the ODI World Cup',
    category: 'records',
    answers: [
      ...g('legbye', ['Sachin Tendulkar', 'MS Dhoni', 'Virat Kohli']),
      ...g('slog', ['Ricky Ponting']),
      ...g('two', [
        'Sourav Ganguly', 'Rahul Dravid', 'Yuvraj Singh', 'Rohit Sharma',
        'Clive Lloyd', 'Viv Richards', 'Imran Khan', 'Arjuna Ranatunga',
      ]),
      ...g('four', [
        'Gautam Gambhir', 'Harbhajan Singh', 'Ashish Nehra', 'Zaheer Khan',
        'Michael Clarke', 'Steve Waugh', 'Glenn McGrath', 'Shane Warne',
        'Adam Gilchrist', 'Andrew Symonds', 'Eoin Morgan', 'Ben Stokes',
        'Mahela Jayawardene', 'Kumar Sangakkara', 'Muttiah Muralitharan',
      ]),
      ...g('six', ['Marvan Atapattu'], 'The 1996 world champion opener, later Sri Lanka’s captain.'),
    ],
  },
  {
    id: 'firstclass-centurions',
    text: 'Name a cricketer who has scored a first-class century',
    category: 'records',
    answers: [
      ...g('legbye', ['Sachin Tendulkar', 'Virat Kohli', 'Don Bradman']),
      ...g('slog', ['Sunil Gavaskar']),
      ...g('two', [
        'Rahul Dravid', 'Ricky Ponting', 'Brian Lara', 'Joe Root',
        'Jacques Kallis', 'Virender Sehwag',
      ]),
      ...g('four', [
        'Gundappa Viswanath', 'Hanif Mohammad', 'Wally Hammond', 'Len Hutton',
        'W. G. Grace', 'Herbert Sutcliffe', 'C. B. Fry',
        'Phil Mead', 'George Headley', 'Everton Weekes', 'Clyde Walcott',
        'Garfield Sobers', 'Viv Richards', 'Greg Chappell', 'Allan Border',
        'Steve Waugh', 'Graham Gooch', 'Alastair Cook',
      ]),
      ...g('six', ['Jack Hobbs'], 'The Master scored 197 first-class centuries — still the record.'),
    ],
  },
  {
    id: 'odi-fifties',
    text: 'Name a cricketer who has scored an ODI half-century',
    category: 'records',
    answers: [
      ...g('legbye', ['Sachin Tendulkar', 'Virat Kohli', 'Rohit Sharma']),
      ...g('slog', ['Ricky Ponting']),
      ...g('two', [
        'Jacques Kallis', 'Rahul Dravid', 'Sourav Ganguly', 'MS Dhoni',
        'Yuvraj Singh', 'Virender Sehwag', 'Shubman Gill',
      ]),
      ...g('four', [
        'Hashim Amla', 'AB de Villiers', 'Kumar Sangakkara', 'Mahela Jayawardene',
        'Brian Lara', 'David Warner', 'Aaron Finch', 'Martin Guptill',
        'Brendon McCullum', 'Babar Azam', 'Fakhar Zaman', 'Shikhar Dhawan',
        'K. L. Rahul', 'Joe Root', 'Eoin Morgan',
      ]),
      ...g('six', ['Desmond Haynes'], 'The West Indies opener made 18 ODI fifties beyond his 17 hundreds.'),
    ],
  },
  {
    id: 't20-leagues',
    text: 'Name a T20 league',
    category: 'leagues',
    answers: [
      ...g('legbye', ['IPL', 'PSL']),
      ...g('slog', ['BBL']),
      ...g('two', [
        'CPL', 'SA20', 'ILT20', 'LPL', 'BPL', 'The Hundred', 'WBBL', 'WPL',
      ]),
      ...g('four', [
        'Mzansi Super League', 'Everest Premier League', 'Kashmir Premier League',
        'Bangladesh Premier League', 'Afghanistan Premier League' /* verify */,
        'Global T20 Canada', 'Minor League Cricket', 'Bangabandhu T20 Cup',
      ]),
      ...g('six', ['Shpageeza Cricket League'], 'Afghanistan’s domestic T20 competition.'),
    ],
  },
  {
    id: 'slang',
    text: 'Name a piece of cricket slang',
    category: 'terms',
    answers: [
      ...g('legbye', ['Duck', 'Golden duck', 'Pair']),
      ...g('slog', ['Cow corner']),
      ...g('two', [
        'Nelson', 'King pair', 'Nervous nineties', 'Slog', 'Yorker' /* term */,
        'Silver duck',
      ]),
      ...g('four', [
        'Duck egg', 'Pair of spectacles' /* verify */, 'Gold ball' /* verify */,
        'Nurdling' /* verify */, 'Gardening' /* verify */, 'Mankad',
        'Sledging', 'Chin music', 'Pavilion',
      ]),
      ...g('six', ['Diamond duck'], 'Dismissed without facing a single ball.'),
    ],
  },
  {
    id: 'players-200-odis',
    text: 'Name a cricketer who has played 200+ ODIs',
    category: 'records',
    answers: [
      ...g('legbye', ['Sachin Tendulkar', 'Virat Kohli', 'Rohit Sharma']),
      ...g('slog', ['MS Dhoni']),
      ...g('two', [
        'Ricky Ponting', 'Jacques Kallis', 'Rahul Dravid', 'Sourav Ganguly',
        'Kumar Sangakkara', 'Mahela Jayawardene', 'Shivnarine Chanderpaul',
      ]),
      ...g('four', [
        'Tillakaratne Dilshan', 'Brian Lara', 'Yuvraj Singh', 'Gautam Gambhir',
        'Virender Sehwag', 'Hashim Amla', 'AB de Villiers', 'Joe Root',
        'Eoin Morgan', 'Chris Gayle', 'Shikhar Dhawan',
      ]),
      ...g('six', ['Michael Clarke'], 'The Australian captain played 245 ODIs.'),
    ],
  },
  {
    id: 't20i-2000-runs',
    text: 'Name a cricketer who has scored 2,000+ T20I runs',
    category: 'records',
    answers: [
      ...g('legbye', ['Virat Kohli', 'Rohit Sharma', 'Babar Azam']),
      ...g('slog', ['Shoaib Malik']),
      ...g('two', [
        'MS Dhoni', 'Yuvraj Singh', 'Suresh Raina', 'Shikhar Dhawan',
        'David Warner', 'Aaron Finch', 'Martin Guptill',
      ]),
      ...g('four', [
        'Brendon McCullum', 'Glenn Maxwell', 'Kane Williamson', 'Colin Munro',
        'Fakhar Zaman', 'Mohammad Hafeez', 'Tillakaratne Dilshan',
        'Mahela Jayawardene', 'Chris Gayle', 'Dwayne Smith', 'Kevin Pietersen',
      ]),
      ...g('six', ['K. L. Rahul'], 'He joined the 2,000-run club during the 2024–25 season.'),
    ],
  },
  {
    id: 'women-test-players',
    text: 'Name a woman who has played Test cricket',
    category: 'players',
    answers: [
      ...g('legbye', ['Ellyse Perry', 'Charlotte Edwards', 'Beth Mooney']),
      ...g('slog', ['Heather Knight']),
      ...g('two', [
        'Jan Brittin', 'Sarah Taylor', 'Katherine Brunt',
        'Isa Guha', 'Holly Colvin', 'Claire Taylor',
      ]),
      ...g('four', [
        'Karen Rolton', 'Lisa Keightley', 'Belinda Clark', 'Suzie Bates',
        'Sophie Devine', 'Leah Poulton', 'Alex Blackwell', 'Jodie Fields',
        'Amelia Kerr', 'Maddie Green' /* verify */,
      ]),
      ...g('six', ['Betty Snowball'], 'One of the earliest women Test players, back in the 1930s.'),
    ],
  },
  {
    id: 'cricket-records',
    text: 'Name a cricket record or statistic',
    category: 'records',
    answers: [
      ...g('legbye', ['Highest team score', 'Highest individual score', 'Most runs']),
      ...g('slog', ['Most wickets']),
      ...g('two', [
        'Fastest century', 'Fastest fifty', 'Best bowling figures', 'Highest partnership',
        'Most sixes', 'Most centuries', 'Most matches',
      ]),
      ...g('four', [
        'Most ducks', 'Most stumpings', 'Most run-outs', 'Highest seventh-wicket stand',
        'Most maidens', 'Longest career', 'Most Player of the Match awards',
        'Best strike rate', 'Best economy rate', 'Most catches',
      ]),
      ...g('six', ['Most bids at an auction'], 'Not an on-field record — but the IPL auction has its own lore.'),
    ],
  },
]
