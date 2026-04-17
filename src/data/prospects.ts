export interface Prospect {
  rank: number;
  name: string;
  position: string;
  college: string;
  /** Physical measurables (first-round prospects only) */
  height?: string;
  weight?: number;
  age?: number;
  /** Relative Athletic Score (0-10 scale) */
  ras?: number;
  /** NFL player comparison */
  proComp?: string;
  /** Scouting note / summary */
  note?: string;
}

/** 71 consensus prospects for 2026 NFL Draft */
export const PROSPECTS: Prospect[] = [
  {
    rank: 1, name: "Fernando Mendoza", position: "QB", college: "Indiana",
    height: "6'5\"", weight: 236, age: 22,
    proComp: "Carson Palmer",
    note: "Led Indiana to national championship, won Heisman. #3 in CFB QBR (88.4).",
  },
  {
    rank: 2, name: "Arvell Reese", position: "EDGE", college: "Ohio State",
    height: "6'4\"", weight: 241, age: 20,
    proComp: "Raw Micah Parsons / smaller Willie McGinest",
    note: "Highest upside in class. Hybrid edge-LB, double-digit sack potential. Elite run defender and QB spy.",
  },
  {
    rank: 3, name: "David Bailey", position: "EDGE", college: "Texas Tech",
    height: "6'4\"", weight: 251, age: 22, ras: 9.65,
    proComp: "Nik Bonitto",
    note: "#2 nationally in pressures (81). Twitched-up pass rusher, relentless motor, scary first step.",
  },
  {
    rank: 4, name: "Jeremiyah Love", position: "RB", college: "Notre Dame",
    height: "6'0\"", weight: 212, age: 20,
    proComp: "Edgerrin James",
    note: "4.36 40-yard dash. 4.5 YPC after contact. Best pass-catching back in class. Home run threat every touch.",
  },
  {
    rank: 5, name: "Sonny Styles", position: "LB", college: "Ohio State",
    height: "6'5\"", weight: 244, age: 21, ras: 9.99,
    proComp: "Karlos Dansby",
    note: "DB speed (4.46) at LB size. Started career as safety. 2.2% missed tackle rate. Surest tackler in recent draft history.",
  },
  {
    rank: 6, name: "Carnell Tate", position: "WR", college: "Ohio State",
    height: "6'2\"", weight: 192, age: 21,
    proComp: "Bigger DeVonta Smith",
    note: "85.7% contested catch rate. Elite ball skills and tracking. Ascending route runner.",
  },
  {
    rank: 7, name: "Caleb Downs", position: "S", college: "Ohio State",
    height: "6'0\"", weight: 206, age: 21,
    proComp: "Bigger Budda Baker",
    note: "Three-time All-American. Started for Nick Saban as 18-year-old. Hasn't allowed a TD since 2023.",
  },
  {
    rank: 8, name: "Francis Mauigoa", position: "OT", college: "Miami (FL)",
    height: "6'5\"", weight: 329, age: 20, ras: 8.75,
    proComp: "Darnell Wright",
    note: "Mammoth who creates movement in run game. 15 pressures allowed. Can play guard or tackle.",
  },
  {
    rank: 9, name: "Mansoor Delane", position: "CB", college: "LSU",
    height: "6'0\"", weight: 187, age: 22,
    proComp: "Marshon Lattimore",
    note: "Led SEC in forced incompletions (11). Crisp footwork, elite hips, ball skills.",
  },
  {
    rank: 10, name: "Rueben Bain", position: "DL", college: "Miami (FL)",
    height: "6'2\"", weight: 263, age: 21,
    proComp: "Brandon Graham",
    note: "Led country in pressures (83), 23.5% pass rush win rate. Short arms (30 7/8\") but elite production.",
  },
  {
    rank: 11, name: "Jermod McCoy", position: "CB", college: "Tennessee",
    height: "6'1\"", weight: 188, age: 20, ras: 9.67,
    proComp: "Denzel Ward",
    note: "Would have gone top 10 without torn ACL. Elite footwork and closing speed. Top 10 forced incompletions (12) as 19-year-old.",
  },
  {
    rank: 12, name: "Makai Lemon", position: "WR", college: "USC",
    height: "5'11\"", weight: 192, age: 21,
    proComp: "Amon-Ra St. Brown",
    note: "Biletnikoff winner. Trustworthy hands, elite YAC, perfect slot receiver.",
  },
  {
    rank: 13, name: "Spencer Fano", position: "OT", college: "Utah",
    height: "6'5\"", weight: 311, age: 21, ras: 9.80,
    proComp: "Alijah Vera-Tucker",
    note: "Ridiculous movement skills. Can play RT or move inside to guard. Elite second-level blocker.",
  },
  {
    rank: 14, name: "Olaivavega Ioane", position: "IOL", college: "Penn State",
    height: "6'4\"", weight: 320, age: 22,
    proComp: "Kevin Zeitler",
    note: "Closest thing to bust-proof in class. Violent pop in hands. Can start at LG as rookie.",
  },
  {
    rank: 15, name: "Kenyon Sadiq", position: "TE", college: "Oregon",
    height: "6'3\"", weight: 241, age: 21, ras: 9.52,
    proComp: "Vernon Davis",
    note: "4.39 40-yard dash, 43.5\" vertical. Mismatch machine. Willing blocker. Can line up as Y or F.",
  },
  {
    rank: 16, name: "Jordyn Tyson", position: "WR", college: "Arizona State",
    height: "6'2\"", weight: 203, age: 21,
    proComp: "Amari Cooper",
    note: "Injury plagued but complete pass catcher. Deep release package. Devastating route runner.",
  },
  {
    rank: 17, name: "Monroe Freeling", position: "OT", college: "Georgia",
    height: "6'7\"", weight: 315, age: 21, ras: 9.99,
    proComp: "Kolton Miller",
    note: "Fast riser. Freak athlete, explodes to second level as run blocker. Needs to improve leverage/hands.",
  },
  {
    rank: 18, name: "Kadyn Proctor", position: "OT", college: "Alabama",
    height: "6'7\"", weight: 352, age: 20, ras: 8.79,
    proComp: "Orlando Brown Jr.",
    note: "Surprisingly explosive at his size. When he gets hands on defenders it's game over. Can play LT or LG.",
  },
  {
    rank: 19, name: "Dillon Thieneman", position: "S", college: "Oregon",
    height: "6'0\"", weight: 201, age: 21, ras: 9.71,
    proComp: "Faster Xavier McKinney",
    note: "Harrison Smith replacement. Can play deep safety and in box. Suddenness and route recognition elite.",
  },
  {
    rank: 20, name: "Keldric Faulk", position: "DL", college: "Auburn",
    height: "6'6\"", weight: 276, age: 21, ras: 9.11,
    proComp: "Rashan Gary",
    note: "10 sacks in 3 seasons but elite size/athleticism. Versatile across D-line. Heavy hands, power, length.",
  },
  {
    rank: 21, name: "Omar Cooper Jr.", position: "WR", college: "Indiana",
    height: "6'0\"", weight: 199, age: 22, ras: 9.15,
    proComp: "Emeka Egbuka",
    note: "#4 nationally in forced missed tackles on receptions (27). Like a RB with the ball in his hands. Physical blocker.",
  },
  {
    rank: 22, name: "Peter Woods", position: "DL", college: "Clemson",
    height: "6'2½\"", weight: 298, age: 21,
    proComp: "Christian Wilkins",
    note: "Active brawler, not a tree stump. Lower-body explosiveness, splits doubles, good shed quickness. Short arms let blockers crowd him. Solid starter in an even front.",
  },
  {
    rank: 23, name: "Kevin Concepcion", position: "WR", college: "Texas A&M",
    height: "6'0\"", weight: 196, age: 21,
    proComp: "Zay Flowers",
    note: "Dynamic route runner, speed to win vertically, elite punt returner. Also listed as KC Concepcion.",
  },
  {
    rank: 24, name: "Akheem Mesidor", position: "EDGE", college: "Miami (FL)",
    height: "6'3\"", weight: 259, age: 25,
    proComp: "Tuli Tuipulotu",
    note: "Oldest prospect in first round. 12.5 sacks, 67 pressures, top 5 nationally. Deepest pass-rush toolbox in class.",
  },
  {
    rank: 25, name: "Denzel Boston", position: "WR", college: "Washington",
    height: "6'4\"", weight: 212, age: 22,
    proComp: "Courtland Sutton",
    note: "76.9% contested catch rate. 11 TDs in 2025. Elite ball winner. Week 1 starting X-receiver.",
  },
  {
    rank: 26, name: "Emmanuel McNeil-Warren", position: "S", college: "Toledo",
    height: "6'3\"", weight: 201, age: 22, ras: 9.01,
    proComp: "Justin Reid",
    note: "Built like a condor. 9 forced fumbles in college. Can play single-high or in box. Violent enforcer.",
  },
  {
    rank: 27, name: "Kayden McDonald", position: "DL", college: "Ohio State",
    height: "6'2\"", weight: 326, age: 21,
    proComp: "Travis Jones",
    note: "Classic run-stuffing nose tackle. Occupies double teams. Eats space. Needs to develop pass rush plan.",
  },
  {
    rank: 28, name: "Caleb Lomu", position: "OT", college: "Utah",
    height: "6'6\"", weight: 313, age: 21, ras: 9.77,
    proComp: "Abe Lucas",
    note: "Top-notch athlete, light feet, lateral quickness. Needs to get stronger. Perfect system fit for Shanahan.",
  },
  {
    rank: 29, name: "Blake Miller", position: "OT", college: "Clemson",
    height: "6'7\"", weight: 317, age: 22, ras: 9.90,
    proComp: "Taylor Decker",
    note: "54 starts at Clemson. 90th percentile broad (113\"), 87th percentile vert (32\"). 34.25\" arms.",
  },
  {
    rank: 30, name: "Max Iheanachor", position: "OT", college: "Arizona State",
    height: "6'5⅝\"", weight: 325, age: 22, ras: 9.86,
    proComp: "Ikem Ekwonu",
    note: "The 'dancing bear.' Nigerian native, started football in 2021, JUCO through Hind CC. Sweet feet, violent hands at point of attack. Dominant Senior Bowl. Elite upside.",
  },
  {
    rank: 31, name: "Ty Simpson", position: "QB", college: "Alabama",
    height: "6'1\"", weight: 211, age: 22,
    proComp: "Jake Haener but from Alabama",
    note: "One-year starter with clean mechanics and decisive intermediate timing. Exceptional footwork, reads zones well, rarely forces into coverage. 64.8% completion, 8.3 YPA. Average arm limits deep ball ceiling. Needs patience and a developmental roadmap.",
  },
  {
    rank: 32, name: "T.J. Parker", position: "EDGE", college: "Clemson",
    height: "6'3\"", weight: 263, age: 21, ras: 9.39,
    proComp: "George Karlaftis",
    note: "Boye Mafe replacement. Power, edge-setting, motor. Pro Bowl potential if pass rush moves develop.",
  },
  {
    rank: 33, name: "Avieon Terrell", position: "CB", college: "Clemson",
    height: "5'11\"", weight: 186, age: 21, ras: 4.94,
    proComp: "Cortland Finnegan",
    note: "Brother of AJ Terrell. 8 forced fumbles last 2 seasons. Feisty, short-area quickness, cover instincts.",
  },
  {
    rank: 34, name: "Cashius Howell", position: "EDGE", college: "Texas A&M",
    height: "6'2½\"", weight: 253, age: 23,
    proComp: "Will McDonald IV",
    note: "Bendy rusher with wicked inside spin counter. Three straight years of big sack totals. Gets knocked around in run defense. Designated rusher floor, three-down upside.",
  },
  { rank: 35, name: "C.J. Allen", position: "LB", college: "Georgia" },
  { rank: 36, name: "Colton Hood", position: "CB", college: "Tennessee" },
  { rank: 37, name: "Zion Young", position: "EDGE", college: "Missouri" },
  { rank: 38, name: "Caleb Banks", position: "DL", college: "Florida" },
  {
    rank: 39, name: "Chris Johnson", position: "CB", college: "San Diego State",
    height: "6'0\"", weight: 193, age: 21, ras: 9.84,
    proComp: "Jaire Alexander",
    note: "First non-P4 pick. MW Defensive Player of Year. Allowed 16.1 NFL QB rating. Smoothest pedal in class.",
  },
  { rank: 40, name: "Chase Bisontis", position: "IOL", college: "Texas A&M" },
  { rank: 41, name: "Emmanuel Pregnon", position: "IOL", college: "Oregon" },
  { rank: 42, name: "Brandon Cisse", position: "CB", college: "South Carolina" },
  { rank: 43, name: "Malachi Lawrence", position: "EDGE", college: "UCF" },
  { rank: 44, name: "Jacob Rodriguez", position: "LB", college: "Texas Tech" },
  { rank: 45, name: "Jadarian Price", position: "RB", college: "Notre Dame" },
  { rank: 46, name: "Christen Miller", position: "DL", college: "Georgia" },
  { rank: 47, name: "R Mason Thomas", position: "EDGE", college: "Oklahoma" },
  { rank: 48, name: "Anthony Hill Jr.", position: "LB", college: "Texas" },
  { rank: 49, name: "Lee Hunter", position: "DL", college: "Texas Tech" },
  { rank: 50, name: "Gabe Jacas", position: "EDGE", college: "Illinois" },
  { rank: 51, name: "Eli Stowers", position: "TE", college: "Vanderbilt" },
  { rank: 52, name: "D'angelo Ponds", position: "CB", college: "Indiana" },
  { rank: 53, name: "Chris Bell", position: "WR", college: "Louisville" },
  { rank: 54, name: "Jake Golday", position: "LB", college: "Cincinnati" },
  { rank: 55, name: "Chris Brazzell", position: "WR", college: "Tennessee" },
  { rank: 56, name: "A.J. Haulcy", position: "S", college: "LSU" },
  { rank: 57, name: "Keylan Rutledge", position: "IOL", college: "Georgia Tech" },
  { rank: 58, name: "Treydan Stukes", position: "CB", college: "Arizona" },
  { rank: 59, name: "Germie Bernard", position: "WR", college: "Alabama" },
  { rank: 60, name: "Gennings Dunker", position: "OT", college: "Iowa" },
  { rank: 61, name: "Keionte Scott", position: "CB", college: "Miami (FL)" },
  { rank: 62, name: "Zachariah Branch", position: "WR", college: "Georgia" },
  { rank: 63, name: "Derrick Moore", position: "EDGE", college: "Michigan" },
  { rank: 64, name: "Josiah Trotter", position: "LB", college: "Missouri" },
  { rank: 65, name: "Caleb Tiernan", position: "OT", college: "Northwestern" },
  { rank: 66, name: "Connor Lew", position: "IOL", college: "Auburn" },
  { rank: 67, name: "Domonique Orange", position: "DL", college: "Iowa State" },
  { rank: 68, name: "Mike Washington Jr.", position: "RB", college: "Arkansas" },
  { rank: 69, name: "Keith Abney II", position: "CB", college: "Arizona State" },
  { rank: 70, name: "Max Klare", position: "TE", college: "Ohio State" },
  { rank: 71, name: "Dani Dennis-Sutton", position: "EDGE", college: "Penn State" },
];
