/**
 * Curated all-time cricket dataset.
 *
 * `fame` drives the tier when a prompt is generated from a filter:
 *   5 = household name -> duck (10)
 *   4 = well known     -> two (30)
 *   3 = known          -> four (60)
 *   2 = deep knowledge -> six (85)
 *   1 = trivia         -> six (85), one per prompt
 *
 * Teams are only listed where the association is solid; a missing team is
 * better than a wrong one, because team prompts reject unlisted players.
 */

export type TeamId =
  | 'MI'
  | 'CSK'
  | 'RCB'
  | 'KKR'
  | 'SRH'
  | 'DC'
  | 'RR'
  | 'PBKS'
  | 'GT'
  | 'LSG'
  | 'DEC'
  | 'PWI'
  | 'KTK'
  | 'GL'
  | 'RPS'

export type Role = 'batter' | 'bowler' | 'allrounder' | 'keeper'

export type Style =
  | 'right-arm fast'
  | 'left-arm fast'
  | 'leg spin'
  | 'off spin'
  | 'left-arm spin'
  | 'mystery'

export type Flags = {
  /** won the ODI World Cup */
  wc?: boolean
  /** won the T20 World Cup */
  t20wc?: boolean
  /** won the IPL */
  ipl?: boolean
  /** captained a Test side */
  testcap?: boolean
  /** captained an IPL side */
  iplcap?: boolean
}

export type Player = {
  name: string
  country: string
  teams: TeamId[]
  role: Role
  fame: 1 | 2 | 3 | 4 | 5
  bat?: 'left' | 'right'
  style?: Style
  flags: Flags
  aliases?: string[]
  note?: string
  debut?: number
}

function p(
  name: string,
  country: string,
  teams: TeamId[],
  role: Role,
  fame: 1 | 2 | 3 | 4 | 5,
  flags: string,
  extra: Partial<Omit<Player, 'name' | 'country' | 'teams' | 'role' | 'fame' | 'flags'>> & {
    alias?: string[]
  } = {},
): Player {
  const { alias, ...rest } = extra
  const f: Flags = {}
  for (const bit of flags.split(' ').filter(Boolean)) {
    if (bit === 'wc' || bit === 't20wc' || bit === 'ipl' || bit === 'testcap' || bit === 'iplcap') {
      f[bit] = true
    }
  }
  return { name, country, teams, role, fame, flags: f, aliases: alias, ...rest }
}

export const TEAM_NAMES: Record<TeamId, string> = {
  MI: 'Mumbai Indians',
  CSK: 'Chennai Super Kings',
  RCB: 'Royal Challengers Bengaluru',
  KKR: 'Kolkata Knight Riders',
  SRH: 'Sunrisers Hyderabad',
  DC: 'Delhi Capitals',
  RR: 'Rajasthan Royals',
  PBKS: 'Punjab Kings',
  GT: 'Gujarat Titans',
  LSG: 'Lucknow Super Giants',
  DEC: 'Deccan Chargers',
  PWI: 'Pune Warriors',
  KTK: 'Kochi Tuskers Kerala',
  GL: 'Gujarat Lions',
  RPS: 'Rising Pune Supergiant',
}

export const PLAYERS: Player[] = [
  // ---------------------------------------------------------------- India
  p('Sachin Tendulkar', 'India', ['MI'], 'batter', 5, 'wc testcap', { debut: 1989, alias: ['sachin', 'tendulkar', 'sachin ramesh tendulkar'] }),
  p('Virat Kohli', 'India', ['RCB'], 'batter', 5, 'wc t20wc testcap', { debut: 2008, alias: ['kohli'] }),
  p('MS Dhoni', 'India', ['CSK'], 'keeper', 5, 'wc t20wc ipl iplcap testcap', { debut: 2004, alias: ['dhoni', 'mahendra singh dhoni'] }),
  p('Rohit Sharma', 'India', ['MI'], 'batter', 5, 'wc t20wc ipl iplcap testcap', { debut: 2007, alias: ['rohit'] }),
  p('Sourav Ganguly', 'India', ['KKR'], 'batter', 5, 'testcap', { debut: 1996, alias: ['ganguly', 'dada'] }),
  p('Rahul Dravid', 'India', ['RCB'], 'batter', 5, 'testcap', { debut: 1996, alias: ['dravid', 'the wall'] }),
  p('Kapil Dev', 'India', [], 'allrounder', 5, 'wc testcap', { debut: 1978, alias: ['kapil'] }),
  p('Sunil Gavaskar', 'India', [], 'batter', 5, 'wc testcap', { debut: 1971, alias: ['gavaskar'] }),
  p('Anil Kumble', 'India', ['RCB'], 'bowler', 5, 'testcap', { style: 'leg spin', debut: 1990, alias: ['kumble'] }),
  p('Yuvraj Singh', 'India', ['PBKS'], 'allrounder', 5, 'wc t20wc ipl', { debut: 2000, alias: ['yuvraj', 'yuvi'] }),
  p('Virender Sehwag', 'India', ['DC'], 'batter', 5, 'wc testcap', { debut: 1999, alias: ['sehwag', 'viru'] }),
  p('Gautam Gambhir', 'India', ['KKR', 'DC'], 'batter', 5, 'wc t20wc ipl iplcap testcap', { debut: 2003, alias: ['gambhir'] }),
  p('Suresh Raina', 'India', ['CSK'], 'batter', 4, 'wc t20wc ipl', { debut: 2005, alias: ['raina'] }),
  p('Harbhajan Singh', 'India', ['MI', 'CSK'], 'bowler', 4, 'wc t20wc ipl', { style: 'off spin', debut: 1998, alias: ['harbhajan', 'bhajji'] }),
  p('Zaheer Khan', 'India', ['MI'], 'bowler', 4, 'wc', { style: 'left-arm fast', debut: 2000, alias: ['zaheer'] }),
  p('Jasprit Bumrah', 'India', ['MI'], 'bowler', 5, 'wc t20wc ipl', { style: 'right-arm fast', debut: 2016, alias: ['bumrah'] }),
  p('Ravindra Jadeja', 'India', ['CSK', 'RR'], 'allrounder', 5, 'wc t20wc ipl', { style: 'left-arm spin', debut: 2009, alias: ['jadeja', 'jaddu'] }),
  p('Ravichandran Ashwin', 'India', ['CSK', 'DC', 'RR'], 'bowler', 4, 'wc t20wc ipl testcap', { style: 'off spin', debut: 2010, alias: ['ashwin'] }),
  p('Ajinkya Rahane', 'India', ['CSK', 'RR', 'DC'], 'batter', 3, 'testcap', { debut: 2011, alias: ['rahane'] }),
  p('Shikhar Dhawan', 'India', ['PBKS', 'SRH', 'DC'], 'batter', 4, 'ipl', { bat: 'left', debut: 2010, alias: ['dhawan', 'gabbar'] }),
  p('KL Rahul', 'India', ['LSG', 'PBKS', 'DC'], 'keeper', 5, 'iplcap', { debut: 2013, alias: ['rahul', 'kl'] }),
  p('Hardik Pandya', 'India', ['MI', 'GT'], 'allrounder', 5, 't20wc ipl iplcap', { debut: 2016, alias: ['hardik'] }),
  p('Mohammed Shami', 'India', ['GT', 'PBKS', 'SRH'], 'bowler', 4, '', { style: 'right-arm fast', debut: 2013, alias: ['shami'] }),
  p('Bhuvneshwar Kumar', 'India', ['SRH', 'RCB'], 'bowler', 3, 'ipl', { style: 'right-arm fast', debut: 2012, alias: ['bhuvneshwar', 'bhuvi'] }),
  p('Yuzvendra Chahal', 'India', ['RR', 'RCB'], 'bowler', 4, 'ipl', { style: 'leg spin', debut: 2013, alias: ['chahal'] }),
  p('Kuldeep Yadav', 'India', ['DC', 'KKR'], 'bowler', 4, '', { style: 'mystery', debut: 2014, alias: ['kuldeep'] }),
  p('Piyush Chawla', 'India', ['KKR', 'PBKS', 'MI'], 'bowler', 3, '', { style: 'leg spin', debut: 2006, alias: ['chawla'] }),
  p('Amit Mishra', 'India', ['DC', 'SRH', 'PBKS'], 'bowler', 3, '', { style: 'leg spin', debut: 2008, alias: ['amit mishra'] }),
  p('Karn Sharma', 'India', ['SRH', 'CSK', 'RCB'], 'bowler', 2, '', { style: 'leg spin', alias: ['karn'] }),
  p('Mayank Markande', 'India', ['MI', 'SRH'], 'bowler', 1, '', { style: 'leg spin', alias: ['markande'] }),
  p('Rahul Chahar', 'India', ['MI', 'PBKS'], 'bowler', 1, '', { style: 'leg spin', alias: ['rahul chahar'] }),
  p('Ravi Bishnoi', 'India', ['LSG', 'PBKS'], 'bowler', 2, '', { style: 'leg spin', alias: ['bishnoi'] }),
  p('Suryakumar Yadav', 'India', ['MI'], 'batter', 5, 't20wc ipl', { debut: 2010, alias: ['suryakumar', 'sky'] }),
  p('Rishabh Pant', 'India', ['LSG', 'DC'], 'keeper', 5, 't20wc ipl iplcap', { bat: 'left', debut: 2015, alias: ['pant'] }),
  p('Shreyas Iyer', 'India', ['PBKS', 'KKR', 'DC'], 'batter', 4, 'ipl iplcap', { debut: 2014, alias: ['shreyas'] }),
  p('Shubman Gill', 'India', ['GT', 'KKR'], 'batter', 5, 'iplcap', { debut: 2017, alias: ['gill'] }),
  p('Ruturaj Gaikwad', 'India', ['CSK'], 'batter', 4, 'ipl iplcap', { debut: 2020, alias: ['ruturaj', 'gaikwad'] }),
  p('Sanju Samson', 'India', ['RR'], 'keeper', 4, 'iplcap', { debut: 2013, alias: ['sanju'] }),
  p('Axar Patel', 'India', ['DC', 'PBKS'], 'allrounder', 3, 't20wc', { style: 'left-arm spin', debut: 2014, alias: ['axar'] }),
  p('Ishan Kishan', 'India', ['SRH', 'MI'], 'keeper', 3, '', { bat: 'left', debut: 2014, alias: ['ishan'] }),
  p('Prithvi Shaw', 'India', ['DC'], 'batter', 2, '', { debut: 2018, alias: ['prithvi'] }),
  p('Cheteshwar Pujara', 'India', [], 'batter', 3, 'testcap', { debut: 2010, alias: ['pujara'] }),
  p('Ajit Agarkar', 'India', ['KKR', 'DC'], 'bowler', 3, 'wc', { style: 'right-arm fast', debut: 1998, alias: ['agarkar'] }),
  p('Irfan Pathan', 'India', ['PBKS'], 'allrounder', 3, 'wc', { style: 'left-arm fast', debut: 2003, alias: ['irfan'] }),
  p('Munaf Patel', 'India', ['MI', 'RR'], 'bowler', 2, 'wc', { style: 'right-arm fast', debut: 2003, alias: ['munaf'] }),
  p('Robin Uthappa', 'India', ['CSK', 'KKR'], 'keeper', 3, 'wc t20wc', { debut: 2006, alias: ['uthappa'] }),
  p('Dinesh Karthik', 'India', ['KKR', 'RCB', 'MI'], 'keeper', 3, 't20wc', { debut: 2004, alias: ['karthik', 'dk'] }),
  p('Venkatesh Iyer', 'India', ['KKR'], 'allrounder', 2, '', { bat: 'left', debut: 2021, alias: ['venkatesh'] }),
  p('Rinku Singh', 'India', ['KKR'], 'batter', 3, '', { bat: 'left', debut: 2018, alias: ['rinku'] }),
  p('Tilak Varma', 'India', ['MI'], 'batter', 3, '', { bat: 'left', debut: 2022, alias: ['tilak'] }),
  p('Abhishek Sharma', 'India', ['SRH'], 'allrounder', 3, '', { bat: 'left', style: 'left-arm spin', debut: 2018, alias: ['abhishek'] }),
  p('Yashasvi Jaiswal', 'India', ['RR'], 'batter', 4, 't20wc', { bat: 'left', debut: 2019, alias: ['yashasvi', 'jaiswal'] }),
  p('Mohammed Siraj', 'India', ['GT', 'RCB'], 'bowler', 3, 't20wc', { style: 'right-arm fast', debut: 2015, alias: ['siraj'] }),
  p('Washington Sundar', 'India', ['SRH', 'RCB'], 'allrounder', 2, '', { style: 'off spin', debut: 2016, alias: ['washington', 'sundar'] }),
  p('Deepak Chahar', 'India', ['CSK'], 'bowler', 2, '', { style: 'right-arm fast', debut: 2016, alias: ['deepak chahar'] }),
  p('Arshdeep Singh', 'India', ['PBKS'], 'bowler', 3, 't20wc', { style: 'left-arm fast', debut: 2019, alias: ['arshdeep'] }),
  p('Varun Chakravarthy', 'India', ['KKR'], 'bowler', 2, '', { style: 'mystery', debut: 2019, alias: ['varun'] }),
  p('Sai Sudharsan', 'India', ['GT'], 'batter', 2, '', { bat: 'left', debut: 2021, alias: ['sai sudharsan'] }),
  p('Rajat Patidar', 'India', ['RCB'], 'batter', 2, 'ipl iplcap', { debut: 2021, alias: ['patidar'] }),
  p('Nitish Kumar Reddy', 'India', ['SRH'], 'allrounder', 2, '', { debut: 2023, alias: ['nitish reddy'] }),
  p('Harshal Patel', 'India', ['PBKS', 'RCB'], 'bowler', 2, '', { style: 'right-arm fast', debut: 2011, alias: ['harshal'] }),
  p('Murali Vijay', 'India', ['CSK'], 'batter', 2, '', { debut: 2008, alias: ['vijay'] }),
  p('Ambati Rayudu', 'India', ['CSK', 'MI'], 'batter', 3, 'ipl', { debut: 2010, alias: ['rayudu'] }),
  p('Pravin Tambe', 'India', ['RR'], 'bowler', 1, '', {
    style: 'leg spin',
    debut: 2013,
    alias: ['tambe'],
    note: 'Made his IPL debut at 41 — the oldest player to do so.',
  }),
  p('Vidyut Sivaramakrishnan', 'India', ['CSK'], 'batter', 1, '', {
    alias: ['vidyut'],
    note: 'Opened for Chennai in the very first IPL season, then vanished from the league.',
  }),

  // ------------------------------------------------------------ Australia
  p('Shane Warne', 'Australia', ['RR'], 'bowler', 5, 'wc iplcap', { style: 'leg spin', alias: ['warne'] }),
  p('Ricky Ponting', 'Australia', ['KKR'], 'batter', 5, 'wc testcap', { alias: ['ponting'] }),
  p('Adam Gilchrist', 'Australia', ['DEC'], 'keeper', 5, 'wc iplcap', { bat: 'left', alias: ['gilchrist', 'gilly'] }),
  p('Glenn McGrath', 'Australia', [], 'bowler', 5, 'wc', { style: 'right-arm fast', alias: ['mcgrath'] }),
  p('Shane Watson', 'Australia', ['RR', 'CSK', 'RCB'], 'allrounder', 4, 'wc ipl', { alias: ['watson'] }),
  p('Steve Smith', 'Australia', ['RR', 'DC', 'RPS'], 'batter', 5, 'wc testcap', { alias: ['smith'] }),
  p('David Warner', 'Australia', ['SRH', 'DC'], 'batter', 5, 'wc ipl iplcap', { bat: 'left', alias: ['warner'] }),
  p('Glenn Maxwell', 'Australia', ['RCB', 'PBKS', 'MI'], 'allrounder', 5, 'wc ipl', { alias: ['maxwell'] }),
  p('Mitchell Starc', 'Australia', ['KKR', 'RCB'], 'bowler', 4, 'wc', { style: 'left-arm fast', alias: ['starc'] }),
  p('Pat Cummins', 'Australia', ['SRH', 'KKR'], 'bowler', 4, 'wc testcap iplcap', { style: 'right-arm fast', alias: ['cummins'] }),
  p('Josh Hazlewood', 'Australia', ['RCB', 'CSK'], 'bowler', 3, 'wc', { style: 'right-arm fast', alias: ['hazlewood'] }),
  p('Mitchell Johnson', 'Australia', ['MI', 'PBKS'], 'bowler', 4, 'wc', { style: 'left-arm fast', alias: ['johnson'] }),
  p('Matthew Hayden', 'Australia', ['CSK'], 'batter', 5, 'wc', { alias: ['hayden'] }),
  p('Michael Hussey', 'Australia', ['CSK'], 'batter', 4, 'wc', { alias: ['hussey', 'mr cricket'] }),
  p('Michael Clarke', 'Australia', ['PWI'], 'batter', 3, 'wc testcap', { alias: ['clarke'] }),
  p('Brett Lee', 'Australia', ['KKR', 'PBKS'], 'bowler', 4, 'wc', { style: 'right-arm fast', alias: ['lee'] }),
  p('Brad Hogg', 'Australia', ['KKR', 'RR'], 'bowler', 2, '', { style: 'mystery', alias: ['hogg'] }),
  p('Andrew Symonds', 'Australia', ['DEC', 'MI'], 'allrounder', 4, 'wc', { alias: ['symonds', 'roy'] }),
  p('Michael Bevan', 'Australia', [], 'batter', 3, 'wc', { alias: ['bevan'] }),
  p('Dean Jones', 'Australia', [], 'batter', 2, 'wc', { alias: ['dean jones'] }),
  p('Allan Border', 'Australia', [], 'batter', 3, 'wc testcap', { alias: ['border'] }),
  p('Steve Waugh', 'Australia', [], 'batter', 3, 'wc testcap', { alias: ['steve waugh'] }),
  p('Mark Waugh', 'Australia', [], 'batter', 2, 'wc', { alias: ['mark waugh'] }),
  p('Adam Zampa', 'Australia', ['RR', 'RCB'], 'bowler', 3, '', { style: 'leg spin', alias: ['zampa'] }),
  p('Travis Head', 'Australia', ['SRH'], 'batter', 4, 'wc', { bat: 'left', alias: ['head'] }),
  p('Marnus Labuschagne', 'Australia', [], 'batter', 2, '', { alias: ['labuschagne', 'marnus'] }),
  p('Usman Khawaja', 'Australia', [], 'batter', 2, '', { bat: 'left', alias: ['khawaja'] }),
  p('Alex Carey', 'Australia', [], 'keeper', 2, '', { bat: 'left', alias: ['carey'] }),
  p('Tim Paine', 'Australia', [], 'keeper', 2, 'testcap', { alias: ['paine'] }),
  p('Mitchell Marsh', 'Australia', ['SRH', 'LSG'], 'allrounder', 3, 'wc t20wc', { alias: ['mitch marsh'] }),
  p('Marcus Stoinis', 'Australia', ['LSG', 'PBKS'], 'allrounder', 3, '', { alias: ['stoinis'] }),
  p('Aaron Finch', 'Australia', ['RCB', 'PBKS'], 'batter', 4, 't20wc', { alias: ['finch'] }),
  p('Matthew Wade', 'Australia', ['GT'], 'keeper', 2, 't20wc', { bat: 'left', alias: ['wade'] }),
  p('Cameron Green', 'Australia', ['RCB', 'MI'], 'allrounder', 2, '', { alias: ['green'] }),
  p('Jake Fraser-McGurk', 'Australia', ['DC'], 'batter', 2, '', { alias: ['Fraser-McGurk', 'jfm'] }),

  // -------------------------------------------------------------- England
  p('Ian Botham', 'England', [], 'allrounder', 5, '', { alias: ['botham', 'beefy'] }),
  p('Kevin Pietersen', 'England', ['RCB', 'DC'], 'batter', 4, '', { alias: ['pietersen', 'kp'] }),
  p('Andrew Flintoff', 'England', ['CSK'], 'allrounder', 4, '', { alias: ['flintoff', 'freddie'] }),
  p('James Anderson', 'England', [], 'bowler', 5, '', { style: 'right-arm fast', alias: ['anderson', 'jimmy'] }),
  p('Stuart Broad', 'England', [], 'bowler', 4, '', { style: 'right-arm fast', alias: ['broad'] }),
  p('Ben Stokes', 'England', ['CSK', 'RR'], 'allrounder', 5, 'wc testcap', { alias: ['stokes'] }),
  p('Joe Root', 'England', [], 'batter', 5, 'wc testcap', { alias: ['root'] }),
  p('Jonny Bairstow', 'England', ['SRH', 'PBKS'], 'keeper', 4, 'wc', { alias: ['bairstow'] }),
  p('Jos Buttler', 'England', ['RR', 'MI'], 'keeper', 5, 'wc t20wc ipl', { alias: ['buttler'] }),
  p('Eoin Morgan', 'England', ['KKR'], 'batter', 4, 'wc t20wc iplcap', { alias: ['morgan'] }),
  p('Alastair Cook', 'England', [], 'batter', 4, 'testcap', { alias: ['cook'] }),
  p('Graham Gooch', 'England', [], 'batter', 3, '', { alias: ['gooch'] }),
  p('Alec Stewart', 'England', [], 'keeper', 3, '', { alias: ['stewart'] }),
  p('Michael Vaughan', 'England', [], 'batter', 3, 'testcap', { alias: ['vaughan'] }),
  p('Nasser Hussain', 'England', [], 'batter', 2, 'testcap', { alias: ['hussain'] }),
  p('Michael Atherton', 'England', [], 'batter', 2, 'testcap', { alias: ['atherton'] }),
  p('Jofra Archer', 'England', ['RR', 'MI'], 'bowler', 3, 'wc', { style: 'right-arm fast', alias: ['archer'] }),
  p('Adil Rashid', 'England', [], 'bowler', 3, 'wc', { style: 'leg spin', alias: ['adil rashid'] }),
  p('Moeen Ali', 'England', ['CSK', 'RCB'], 'allrounder', 3, 'wc', { style: 'off spin', alias: ['moeen'] }),
  p('Chris Woakes', 'England', ['KKR', 'DC'], 'allrounder', 2, 'wc', { alias: ['woakes'] }),
  p('Sam Curran', 'England', ['CSK', 'PBKS'], 'allrounder', 3, 'wc t20wc', { style: 'left-arm fast', alias: ['sam curran'] }),
  p('Tom Curran', 'England', [], 'allrounder', 2, '', { alias: ['tom curran'] }),
  p('Harry Brook', 'England', ['SRH'], 'batter', 3, '', { alias: ['brook'] }),
  p('Ben Duckett', 'England', [], 'batter', 2, '', { bat: 'left', alias: ['duckett'] }),
  p('Ollie Pope', 'England', [], 'batter', 2, '', { alias: ['pope'] }),
  p('Mark Wood', 'England', ['LSG'], 'bowler', 3, 'wc', { style: 'right-arm fast', alias: ['mark wood'] }),
  p('Liam Livingstone', 'England', ['PBKS', 'RCB'], 'allrounder', 2, '', { alias: ['livingstone'] }),
  p('Phil Salt', 'England', ['RCB', 'KKR'], 'keeper', 2, 't20wc', { alias: ['salt'] }),
  p('Will Jacks', 'England', ['RCB', 'MI'], 'allrounder', 2, '', { alias: ['jacks'] }),
  p('Dawid Malan', 'England', ['PBKS'], 'batter', 2, 't20wc', { alias: ['malan'] }),
  p('Jason Roy', 'England', ['GL'], 'batter', 2, 'wc', { alias: ['roy'] }),
  p('Alex Hales', 'England', ['SRH'], 'batter', 2, 't20wc', { alias: ['hales'] }),
  p('James Vince', 'England', [], 'batter', 2, '', { alias: ['vince'] }),
  p('Chris Jordan', 'England', ['CSK'], 'bowler', 2, 't20wc', { style: 'right-arm fast', alias: ['jordan'] }),
  p('Reece Topley', 'England', ['MI'], 'bowler', 1, '', { style: 'left-arm fast', alias: ['topley'] }),
  p('Monty Panesar', 'England', [], 'bowler', 2, '', { style: 'left-arm spin', alias: ['panesar', 'monty'] }),
  p('Graeme Swann', 'England', [], 'bowler', 3, '', { style: 'off spin', alias: ['swann'] }),
  p('Marcus Trescothick', 'England', [], 'batter', 3, '', { alias: ['trescothick'] }),
  p('Andrew Strauss', 'England', [], 'batter', 3, 'testcap', { alias: ['strauss'] }),
  p('Paul Collingwood', 'England', [], 'allrounder', 3, 't20wc', { alias: ['collingwood'] }),
  p('Ian Bell', 'England', [], 'batter', 3, '', { alias: ['ian bell'] }),

  // ------------------------------------------------------------- Pakistan
  p('Imran Khan', 'Pakistan', [], 'allrounder', 5, 'wc testcap', { alias: ['imran'] }),
  p('Wasim Akram', 'Pakistan', [], 'bowler', 5, 'wc', { style: 'left-arm fast', alias: ['wasim'] }),
  p('Waqar Younis', 'Pakistan', [], 'bowler', 4, 'testcap', { style: 'right-arm fast', alias: ['waqar'] }),
  p('Javed Miandad', 'Pakistan', [], 'batter', 4, 'wc testcap', { alias: ['miandad'] }),
  p('Inzamam-ul-Haq', 'Pakistan', [], 'batter', 4, 'wc testcap', { alias: ['inzamam', 'inzy'] }),
  p('Younis Khan', 'Pakistan', [], 'batter', 4, 'testcap', { alias: ['younis'] }),
  p('Mohammad Yousuf', 'Pakistan', [], 'batter', 3, '', { alias: ['yousuf', 'youhana'] }),
  p('Saeed Anwar', 'Pakistan', [], 'batter', 3, 'wc', { bat: 'left', alias: ['saeed anwar'] }),
  p('Shoaib Akhtar', 'Pakistan', ['KKR'], 'bowler', 4, '', { style: 'right-arm fast', alias: ['shoaib', 'rawalpindi express'] }),
  p('Shahid Afridi', 'Pakistan', [], 'allrounder', 5, 't20wc', { alias: ['afridi', 'boom boom'] }),
  p('Misbah-ul-Haq', 'Pakistan', [], 'batter', 3, 'testcap', { alias: ['misbah'] }),
  p('Babar Azam', 'Pakistan', [], 'batter', 5, 'testcap', { alias: ['babar'] }),
  p('Mohammad Rizwan', 'Pakistan', [], 'keeper', 4, '', { alias: ['rizwan'] }),
  p('Shaheen Afridi', 'Pakistan', [], 'bowler', 4, '', { style: 'left-arm fast', alias: ['shaheen'] }),
  p('Fakhar Zaman', 'Pakistan', [], 'batter', 3, '', { bat: 'left', alias: ['fakhar'] }),
  p('Haris Rauf', 'Pakistan', [], 'bowler', 2, '', { style: 'right-arm fast', alias: ['haris'] }),
  p('Naseem Shah', 'Pakistan', [], 'bowler', 2, '', { style: 'right-arm fast', alias: ['naseem'] }),
  p('Imad Wasim', 'Pakistan', [], 'allrounder', 2, '', { style: 'left-arm spin', alias: ['imad'] }),
  p('Shadab Khan', 'Pakistan', [], 'allrounder', 2, '', { style: 'leg spin', alias: ['shadab'] }),
  p('Sarfaraz Ahmed', 'Pakistan', [], 'keeper', 2, '', { alias: ['sarfaraz'] }),
  p('Mohammad Amir', 'Pakistan', [], 'bowler', 3, '', { style: 'left-arm fast', alias: ['amir'] }),
  p('Umar Gul', 'Pakistan', ['KKR'], 'bowler', 3, '', { style: 'right-arm fast', alias: ['gul'] }),
  p('Abdul Razzaq', 'Pakistan', [], 'allrounder', 2, 't20wc', { alias: ['razzaq'] }),
  p('Mohammad Hafeez', 'Pakistan', [], 'allrounder', 2, '', { alias: ['hafeez'] }),
  p('Sohail Tanvir', 'Pakistan', ['RR'], 'bowler', 2, 'ipl', { style: 'left-arm fast', alias: ['tanvir'] }),
  p('Kamran Akmal', 'Pakistan', [], 'keeper', 2, '', { alias: ['kamran'] }),
  p('Rashid Latif', 'Pakistan', [], 'keeper', 2, '', { alias: ['rashid latif'] }),
  p('Moin Khan', 'Pakistan', [], 'keeper', 2, 'wc', { alias: ['moin'] }),
  p('Mushtaq Ahmed', 'Pakistan', [], 'bowler', 2, 'wc', { style: 'leg spin', alias: ['mushtaq'] }),

  // -------------------------------------------------------- South Africa
  p('Jacques Kallis', 'South Africa', ['RCB', 'KKR'], 'allrounder', 5, 'testcap', { alias: ['kallis'] }),
  p('AB de Villiers', 'South Africa', ['RCB'], 'keeper', 5, 'iplcap', { alias: ['ab', 'abd', 'de villiers', 'ab de villiers'] }),
  p('Graeme Smith', 'South Africa', [], 'batter', 3, 'testcap', { bat: 'left', alias: ['graeme smith'] }),
  p('Hashim Amla', 'South Africa', [], 'batter', 4, '', { alias: ['amla'] }),
  p('Dale Steyn', 'South Africa', ['SRH', 'RCB'], 'bowler', 5, '', { style: 'right-arm fast', alias: ['steyn'] }),
  p('Allan Donald', 'South Africa', [], 'bowler', 4, '', { style: 'right-arm fast', alias: ['donald'] }),
  p('Shaun Pollock', 'South Africa', ['MI'], 'allrounder', 4, '', { alias: ['pollock'] }),
  p('Makhaya Ntini', 'South Africa', ['CSK'], 'bowler', 3, '', { style: 'right-arm fast', alias: ['ntini'] }),
  p('Mark Boucher', 'South Africa', [], 'keeper', 3, '', { alias: ['boucher'] }),
  p('Herschelle Gibbs', 'South Africa', ['DEC'], 'batter', 3, '', { alias: ['gibbs'] }),
  p('Jonty Rhodes', 'South Africa', [], 'batter', 3, '', { alias: ['jonty'] }),
  p('Lance Klusener', 'South Africa', [], 'allrounder', 3, '', { alias: ['klusener', 'zulu'] }),
  p('Faf du Plessis', 'South Africa', ['RCB', 'CSK'], 'batter', 4, 'iplcap', { alias: ['faf'] }),
  p('Quinton de Kock', 'South Africa', ['LSG', 'MI'], 'keeper', 4, '', { bat: 'left', alias: ['de kock', 'quinton'] }),
  p('Kagiso Rabada', 'South Africa', ['PBKS', 'DC'], 'bowler', 4, '', { style: 'right-arm fast', alias: ['rabada'] }),
  p('Anrich Nortje', 'South Africa', ['DC'], 'bowler', 3, '', { style: 'right-arm fast', alias: ['nortje'] }),
  p('Marco Jansen', 'South Africa', ['SRH'], 'allrounder', 2, '', { style: 'left-arm fast', alias: ['jansen'] }),
  p('David Miller', 'South Africa', ['GT', 'RR', 'PBKS'], 'batter', 3, 'ipl', { bat: 'left', alias: ['miller', 'killer miller'] }),
  p('Imran Tahir', 'South Africa', ['CSK'], 'bowler', 3, 'ipl', { style: 'leg spin', alias: ['tahir'] }),
  p('JP Duminy', 'South Africa', ['MI', 'DC'], 'allrounder', 2, '', { alias: ['duminy'] }),
  p('Albie Morkel', 'South Africa', ['CSK'], 'allrounder', 2, '', { alias: ['albie'] }),
  p('Morne Morkel', 'South Africa', ['KKR'], 'bowler', 2, '', { style: 'right-arm fast', alias: ['morne'] }),
  p('Vernon Philander', 'South Africa', [], 'bowler', 2, '', { style: 'right-arm fast', alias: ['philander'] }),
  p('Tabraiz Shamsi', 'South Africa', [], 'bowler', 2, '', { style: 'mystery', alias: ['shamsi'] }),
  p('Keshav Maharaj', 'South Africa', [], 'bowler', 2, '', { style: 'left-arm spin', alias: ['maharaj'] }),
  p('Aiden Markram', 'South Africa', ['SRH'], 'batter', 2, 'iplcap', { alias: ['markram'] }),
  p('Heinrich Klaasen', 'South Africa', ['SRH'], 'keeper', 3, '', { alias: ['klaasen'] }),
  p('Tristan Stubbs', 'South Africa', ['DC'], 'batter', 2, '', { alias: ['stubbs'] }),
  p('Ryan Rickelton', 'South Africa', ['MI'], 'keeper', 1, '', { alias: ['rickelton'] }),
  p('Lungi Ngidi', 'South Africa', ['CSK'], 'bowler', 2, '', { style: 'right-arm fast', alias: ['ngidi'] }),
  p('Wayne Parnell', 'South Africa', [], 'allrounder', 2, '', { style: 'left-arm fast', alias: ['parnell'] }),
  p('Johan Botha', 'South Africa', ['RR'], 'allrounder', 1, '', { style: 'off spin', alias: ['botha'] }),
  p('Paul Adams', 'South Africa', [], 'bowler', 1, '', { style: 'mystery', alias: ['paul adams', 'gogga'] }),

  // ------------------------------------------------------------ West Indies
  p('Brian Lara', 'West Indies', [], 'batter', 5, 'testcap', { bat: 'left', alias: ['lara'] }),
  p('Viv Richards', 'West Indies', [], 'batter', 5, 'wc testcap', { alias: ['viv', 'richards'] }),
  p('Clive Lloyd', 'West Indies', [], 'batter', 4, 'wc testcap', { alias: ['lloyd'] }),
  p('Gordon Greenidge', 'West Indies', [], 'batter', 3, 'wc', { alias: ['greenidge'] }),
  p('Desmond Haynes', 'West Indies', [], 'batter', 3, 'wc', { alias: ['haynes'] }),
  p('Courtney Walsh', 'West Indies', [], 'bowler', 4, '', { style: 'right-arm fast', alias: ['walsh'] }),
  p('Curtly Ambrose', 'West Indies', [], 'bowler', 4, '', { style: 'right-arm fast', alias: ['ambrose'] }),
  p('Michael Holding', 'West Indies', [], 'bowler', 4, '', { style: 'right-arm fast', alias: ['holding', 'whispering death'] }),
  p('Andy Roberts', 'West Indies', [], 'bowler', 3, 'wc', { style: 'right-arm fast', alias: ['andy roberts'] }),
  p('Malcolm Marshall', 'West Indies', [], 'bowler', 4, 'wc', { style: 'right-arm fast', alias: ['marshall'] }),
  p('Joel Garner', 'West Indies', [], 'bowler', 4, 'wc', { style: 'right-arm fast', alias: ['garner', 'big bird'] }),
  p('Chris Gayle', 'West Indies', ['RCB', 'KKR', 'PBKS'], 'allrounder', 5, 't20wc ipl', { alias: ['gayle', 'universe boss'] }),
  p('Kieron Pollard', 'West Indies', ['MI'], 'allrounder', 4, 't20wc ipl', { alias: ['pollard'] }),
  p('Dwayne Bravo', 'West Indies', ['CSK', 'MI'], 'allrounder', 4, 't20wc ipl', { alias: ['bravo', 'dj bravo'] }),
  p('Andre Russell', 'West Indies', ['KKR'], 'allrounder', 4, 't20wc ipl', { alias: ['russell', 'dre russ'] }),
  p('Sunil Narine', 'West Indies', ['KKR'], 'bowler', 4, 't20wc ipl', { style: 'mystery', alias: ['narine'] }),
  p('Shimron Hetmyer', 'West Indies', ['RR', 'DC'], 'batter', 2, '', { bat: 'left', alias: ['hetmyer'] }),
  p('Nicholas Pooran', 'West Indies', ['LSG', 'PBKS'], 'keeper', 4, '', { bat: 'left', alias: ['pooran'] }),
  p('Shai Hope', 'West Indies', [], 'keeper', 2, '', { alias: ['hope'] }),
  p('Jason Holder', 'West Indies', ['SRH'], 'allrounder', 2, '', { alias: ['holder'] }),
  p('Carlos Brathwaite', 'West Indies', [], 'allrounder', 2, 't20wc', { alias: ['brathwaite', 'carlos'] }),
  p('Marlon Samuels', 'West Indies', [], 'batter', 2, 't20wc', { alias: ['samuels'] }),
  p('Ramnaresh Sarwan', 'West Indies', [], 'batter', 2, '', { alias: ['sarwan'] }),
  p('Shivnarine Chanderpaul', 'West Indies', [], 'batter', 3, '', { bat: 'left', alias: ['chanderpaul'] }),
  p('Denesh Ramdin', 'West Indies', [], 'keeper', 2, '', { alias: ['ramdin'] }),
  p('Rovman Powell', 'West Indies', ['RR'], 'batter', 2, '', { alias: ['powell'] }),
  p('Akeal Hosein', 'West Indies', [], 'bowler', 2, '', { style: 'left-arm spin', alias: ['hosein'] }),
  p('Alzarri Joseph', 'West Indies', [], 'bowler', 2, '', { style: 'right-arm fast', alias: ['alzarri'] }),
  p('Fidel Edwards', 'West Indies', [], 'bowler', 1, '', { style: 'right-arm fast', alias: ['fidel'] }),
  p('Jerome Taylor', 'West Indies', [], 'bowler', 1, '', { style: 'right-arm fast', alias: ['jerome'] }),
  p('Kemar Roach', 'West Indies', [], 'bowler', 2, '', { style: 'right-arm fast', alias: ['roach'] }),
  p('Darren Sammy', 'West Indies', [], 'allrounder', 2, 't20wc', { alias: ['sammy'] }),

  // ------------------------------------------------------------- Sri Lanka
  p('Kumar Sangakkara', 'Sri Lanka', ['PBKS', 'SRH'], 'keeper', 5, 'testcap', { bat: 'left', alias: ['sangakkara', 'sanga'] }),
  p('Mahela Jayawardene', 'Sri Lanka', ['PBKS', 'DC'], 'batter', 5, 'testcap', { alias: ['jayawardene', 'mahela'] }),
  p('Sanath Jayasuriya', 'Sri Lanka', ['MI'], 'allrounder', 5, 'wc testcap', { bat: 'left', alias: ['jayasuriya', 'sanath'] }),
  p('Muttiah Muralitharan', 'Sri Lanka', ['CSK'], 'bowler', 5, 'wc testcap', { style: 'off spin', alias: ['murali', 'muralitharan'] }),
  p('Chaminda Vaas', 'Sri Lanka', [], 'bowler', 3, '', { style: 'left-arm fast', alias: ['vaas'] }),
  p('Lasith Malinga', 'Sri Lanka', ['MI'], 'bowler', 5, 'ipl', { style: 'right-arm fast', alias: ['malinga', 'slinga'] }),
  p('Angelo Mathews', 'Sri Lanka', ['PWI'], 'allrounder', 3, '', { alias: ['mathews'] }),
  p('Tillakaratne Dilshan', 'Sri Lanka', [], 'batter', 3, '', { alias: ['dilshan'] }),
  p('Aravinda de Silva', 'Sri Lanka', [], 'batter', 4, 'wc', { alias: ['aravinda', 'de silva'] }),
  p('Arjuna Ranatunga', 'Sri Lanka', [], 'batter', 4, 'wc testcap', { alias: ['ranatunga'] }),
  p('Dinesh Chandimal', 'Sri Lanka', [], 'keeper', 2, '', { alias: ['chandimal'] }),
  p('Kusal Perera', 'Sri Lanka', [], 'keeper', 2, '', { bat: 'left', alias: ['kusal perera'] }),
  p('Kusal Mendis', 'Sri Lanka', [], 'keeper', 2, '', { alias: ['kusal mendis'] }),
  p('Wanindu Hasaranga', 'Sri Lanka', ['RCB'], 'bowler', 3, '', { style: 'leg spin', alias: ['hasaranga'] }),
  p('Pathum Nissanka', 'Sri Lanka', [], 'batter', 2, '', { alias: ['nissanka'] }),
  p('Dasun Shanaka', 'Sri Lanka', [], 'allrounder', 2, '', { alias: ['shanaka'] }),
  p('Nuwan Kulasekara', 'Sri Lanka', [], 'bowler', 1, '', { style: 'right-arm fast', alias: ['kulasekara'] }),
  p('Thisara Perera', 'Sri Lanka', [], 'allrounder', 2, '', { alias: ['thisara'] }),
  p('Ajantha Mendis', 'Sri Lanka', [], 'bowler', 2, '', { style: 'mystery', alias: ['ajantha'] }),
  p('Rangana Herath', 'Sri Lanka', [], 'bowler', 2, '', { style: 'left-arm spin', alias: ['herath'] }),
  p('Upul Tharanga', 'Sri Lanka', [], 'batter', 1, '', { bat: 'left', alias: ['tharanga'] }),
  p('Lahiru Thirimanne', 'Sri Lanka', [], 'batter', 1, '', { alias: ['thirimanne'] }),

  // ------------------------------------------------------------ New Zealand
  p('Stephen Fleming', 'New Zealand', ['CSK'], 'batter', 4, 'iplcap testcap', { alias: ['fleming'] }),
  p('Brendon McCullum', 'New Zealand', ['KKR', 'CSK'], 'batter', 5, 'ipl iplcap', { alias: ['mccullum', 'baz'] }),
  p('Daniel Vettori', 'New Zealand', ['RCB'], 'bowler', 4, 'testcap', { style: 'left-arm spin', alias: ['vettori'] }),
  p('Ross Taylor', 'New Zealand', ['RCB'], 'batter', 4, '', { alias: ['ross taylor'] }),
  p('Kane Williamson', 'New Zealand', ['SRH'], 'batter', 5, 'testcap iplcap', { alias: ['williamson', 'kane'] }),
  p('Trent Boult', 'New Zealand', ['RR', 'MI'], 'bowler', 4, '', { style: 'left-arm fast', alias: ['boult'] }),
  p('Tim Southee', 'New Zealand', ['KKR'], 'bowler', 3, '', { style: 'right-arm fast', alias: ['southee'] }),
  p('Chris Cairns', 'New Zealand', [], 'allrounder', 3, '', { alias: ['cairns'] }),
  p('Richard Hadlee', 'New Zealand', [], 'allrounder', 5, 'testcap', { alias: ['hadlee', 'paddles'] }),
  p('Martin Crowe', 'New Zealand', [], 'batter', 3, 'testcap', { alias: ['crowe'] }),
  p('Nathan Astle', 'New Zealand', [], 'batter', 2, '', { alias: ['astle'] }),
  p('Craig McMillan', 'New Zealand', [], 'batter', 2, '', { alias: ['mcmillan'] }),
  p('Scott Styris', 'New Zealand', [], 'allrounder', 2, '', { alias: ['styris'] }),
  p('Jacob Oram', 'New Zealand', ['CSK'], 'allrounder', 2, '', { alias: ['oram'] }),
  p('Kyle Mills', 'New Zealand', [], 'bowler', 2, '', { style: 'right-arm fast', alias: ['mills'] }),
  p('Lockie Ferguson', 'New Zealand', ['GT', 'KKR'], 'bowler', 3, '', { style: 'right-arm fast', alias: ['lockie'] }),
  p('Mitchell Santner', 'New Zealand', ['CSK'], 'allrounder', 3, '', { style: 'left-arm spin', alias: ['santner'] }),
  p('Devon Conway', 'New Zealand', ['CSK'], 'keeper', 3, '', { bat: 'left', alias: ['conway'] }),
  p('Glenn Phillips', 'New Zealand', [], 'batter', 2, '', { alias: ['glenn phillips'] }),
  p('Daryl Mitchell', 'New Zealand', ['CSK'], 'allrounder', 2, '', { alias: ['daryl mitchell'] }),
  p('Rachin Ravindra', 'New Zealand', ['CSK'], 'allrounder', 3, '', { bat: 'left', alias: ['rachin'] }),
  p('Matt Henry', 'New Zealand', [], 'bowler', 2, '', { style: 'right-arm fast', alias: ['matt henry'] }),
  p('Neil Wagner', 'New Zealand', [], 'bowler', 1, '', { style: 'left-arm fast', alias: ['wagner'] }),
  p('Jeetan Patel', 'New Zealand', [], 'bowler', 1, '', { style: 'off spin', alias: ['jeetan'] }),
  p('Ish Sodhi', 'New Zealand', ['RR'], 'bowler', 2, '', { style: 'leg spin', alias: ['sodhi'] }),
  p('Tom Latham', 'New Zealand', [], 'keeper', 2, '', { bat: 'left', alias: ['latham'] }),
  p('BJ Watling', 'New Zealand', [], 'keeper', 1, '', { alias: ['watling'] }),
  p('Colin de Grandhomme', 'New Zealand', [], 'allrounder', 1, '', { alias: ['de grandhomme', 'cdg'] }),

  // ------------------------------------------------------------ Bangladesh
  p('Shakib Al Hasan', 'Bangladesh', ['KKR', 'SRH'], 'allrounder', 5, 'testcap', { style: 'left-arm spin', alias: ['shakib'] }),
  p('Tamim Iqbal', 'Bangladesh', [], 'batter', 4, '', { bat: 'left', alias: ['tamim'] }),
  p('Mushfiqur Rahim', 'Bangladesh', [], 'keeper', 3, '', { alias: ['mushfiqur'] }),
  p('Mahmudullah', 'Bangladesh', [], 'allrounder', 3, '', { alias: ['mahmudullah', 'riyad'] }),
  p('Mashrafe Mortaza', 'Bangladesh', ['KKR'], 'bowler', 3, '', { style: 'right-arm fast', alias: ['mashrafe'] }),
  p('Mustafizur Rahman', 'Bangladesh', ['CSK', 'SRH'], 'bowler', 3, '', { style: 'left-arm fast', alias: ['mustafizur', 'fizz'] }),
  p('Litton Das', 'Bangladesh', [], 'keeper', 2, '', { alias: ['litton'] }),
  p('Soumya Sarkar', 'Bangladesh', [], 'allrounder', 1, '', { bat: 'left', alias: ['soumya'] }),
  p('Taskin Ahmed', 'Bangladesh', [], 'bowler', 1, '', { style: 'right-arm fast', alias: ['taskin'] }),
  p('Mehidy Hasan Miraz', 'Bangladesh', [], 'allrounder', 1, '', { style: 'off spin', alias: ['mehidy'] }),
  p('Najmul Hossain Shanto', 'Bangladesh', [], 'batter', 1, '', { alias: ['shanto'] }),
  p('Towhid Hridoy', 'Bangladesh', [], 'batter', 1, '', { alias: ['hridoy'] }),

  // ----------------------------------------------------------- Afghanistan
  p('Rashid Khan', 'Afghanistan', ['GT', 'SRH'], 'bowler', 4, 'ipl', { style: 'leg spin', alias: ['rashid'] }),
  p('Mohammad Nabi', 'Afghanistan', ['SRH'], 'allrounder', 3, '', { style: 'off spin', alias: ['nabi'] }),
  p('Mujeeb Ur Rahman', 'Afghanistan', ['PBKS'], 'bowler', 2, '', { style: 'mystery', alias: ['mujeeb'] }),
  p('Rahmanullah Gurbaz', 'Afghanistan', ['KKR'], 'keeper', 3, '', { alias: ['gurbaz'] }),
  p('Ibrahim Zadran', 'Afghanistan', [], 'batter', 2, '', { alias: ['ibrahim'] }),
  p('Naveen-ul-Haq', 'Afghanistan', ['LSG'], 'bowler', 2, '', { style: 'right-arm fast', alias: ['naveen'] }),
  p('Fazalhaq Farooqi', 'Afghanistan', ['SRH'], 'bowler', 1, '', { style: 'left-arm fast', alias: ['farooqi'] }),
  p('Noor Ahmad', 'Afghanistan', ['GT'], 'bowler', 2, '', { style: 'mystery', alias: ['noor'] }),

  // ---------------------------------------------------------------- others
  p('Andy Flower', 'Zimbabwe', [], 'keeper', 1, '', { bat: 'left', alias: ['andy flower'] }),
  p('Brendan Taylor', 'Zimbabwe', [], 'batter', 1, '', { alias: ['brendan taylor'] }),
  p('Heath Streak', 'Zimbabwe', [], 'allrounder', 1, '', { alias: ['streak'] }),
  p('Sikandar Raza', 'Zimbabwe', [], 'allrounder', 1, '', { alias: ['raza'] }),
  p('Paul Stirling', 'Ireland', [], 'batter', 1, '', { alias: ['stirling'] }),
  p("Kevin O'Brien", 'Ireland', [], 'allrounder', 1, '', { alias: ['kevin obrien'] }),
  p('Andy Balbirnie', 'Ireland', [], 'batter', 1, '', { alias: ['balbirnie'] }),
  p('Josh Little', 'Ireland', [], 'bowler', 1, '', { style: 'left-arm fast', alias: ['josh little'] }),
  p('Sandeep Lamichhane', 'Nepal', [], 'bowler', 1, '', { style: 'leg spin', alias: ['lamichhane'] }),
  p('Dipendra Singh Airee', 'Nepal', [], 'allrounder', 1, '', { alias: ['airee'] }),
  p('Jaskaran Malhotra', 'United States', [], 'batter', 1, '', { alias: ['malhotra'] }),
  p('Ryan ten Doeschate', 'Netherlands', ['KKR'], 'allrounder', 1, '', { alias: ['ten doeschate', 'rtd'] }),
]

export const COUNTRY_PROMPTS = [
  'India',
  'Australia',
  'England',
  'Pakistan',
  'South Africa',
  'West Indies',
  'Sri Lanka',
  'New Zealand',
  'Bangladesh',
] as const

/** Countries whose English article is "an". */
export const AN_COUNTRIES = new Set(['Australia', 'England', 'Afghanistan', 'Ireland'])
