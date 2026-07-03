/* ============ Pathfinder — data ============ */
/* Stats are approximate, for planning purposes only — always verify on the college's official site. */

const COLLEGES = [
  { name: "MIT", state: "Massachusetts", type: "Private", acc: 4,  sat25: 1520, sat75: 1580, gpa: 3.96, tags: ["Engineering", "CS", "Science"] },
  { name: "Stanford University", state: "California", type: "Private", acc: 4, sat25: 1500, sat75: 1570, gpa: 3.95, tags: ["CS", "Engineering", "Business"] },
  { name: "Harvard University", state: "Massachusetts", type: "Private", acc: 3, sat25: 1490, sat75: 1580, gpa: 3.95, tags: ["Liberal Arts", "Pre-Law", "Pre-Med"] },
  { name: "Princeton University", state: "New Jersey", type: "Private", acc: 4, sat25: 1490, sat75: 1580, gpa: 3.94, tags: ["Liberal Arts", "Engineering", "Public Policy"] },
  { name: "Duke University", state: "North Carolina", type: "Private", acc: 6, sat25: 1490, sat75: 1570, gpa: 3.93, tags: ["Pre-Med", "Public Policy", "Engineering"] },
  { name: "Johns Hopkins University", state: "Maryland", type: "Private", acc: 6, sat25: 1520, sat75: 1570, gpa: 3.93, tags: ["Pre-Med", "Biomedical", "Research"] },
  { name: "Carnegie Mellon University", state: "Pennsylvania", type: "Private", acc: 11, sat25: 1500, sat75: 1570, gpa: 3.9, tags: ["CS", "Engineering", "Arts"] },
  { name: "Rice University", state: "Texas", type: "Private", acc: 8, sat25: 1490, sat75: 1570, gpa: 3.92, tags: ["Engineering", "Science", "Music"] },
  { name: "Cornell University", state: "New York", type: "Private", acc: 8, sat25: 1470, sat75: 1560, gpa: 3.9, tags: ["Engineering", "Business", "Agriculture"] },
  { name: "Northwestern University", state: "Illinois", type: "Private", acc: 7, sat25: 1490, sat75: 1570, gpa: 3.92, tags: ["Journalism", "Business", "Theatre"] },
  { name: "UC Berkeley", state: "California", type: "Public", acc: 12, sat25: 1330, sat75: 1540, gpa: 3.89, tags: ["CS", "Engineering", "Business"] },
  { name: "UCLA", state: "California", type: "Public", acc: 9, sat25: 1330, sat75: 1530, gpa: 3.9, tags: ["Pre-Med", "Film", "Psychology"] },
  { name: "University of Michigan", state: "Michigan", type: "Public", acc: 18, sat25: 1360, sat75: 1530, gpa: 3.88, tags: ["Engineering", "Business", "Pre-Med"] },
  { name: "NYU", state: "New York", type: "Private", acc: 8, sat25: 1450, sat75: 1550, gpa: 3.8, tags: ["Business", "Film", "Arts"] },
  { name: "USC", state: "California", type: "Private", acc: 10, sat25: 1420, sat75: 1540, gpa: 3.85, tags: ["Film", "Business", "Communications"] },
  { name: "Georgia Tech", state: "Georgia", type: "Public", acc: 16, sat25: 1370, sat75: 1530, gpa: 3.9, tags: ["Engineering", "CS", "Science"] },
  { name: "UNC Chapel Hill", state: "North Carolina", type: "Public", acc: 19, sat25: 1350, sat75: 1500, gpa: 3.85, tags: ["Business", "Pre-Med", "Journalism"] },
  { name: "University of Virginia", state: "Virginia", type: "Public", acc: 17, sat25: 1400, sat75: 1520, gpa: 3.87, tags: ["Business", "Pre-Law", "Liberal Arts"] },
  { name: "Boston University", state: "Massachusetts", type: "Private", acc: 11, sat25: 1400, sat75: 1520, gpa: 3.75, tags: ["Business", "Communications", "Pre-Med"] },
  { name: "UC San Diego", state: "California", type: "Public", acc: 25, sat25: 1300, sat75: 1520, gpa: 3.85, tags: ["Biology", "CS", "Engineering"] },
  { name: "UT Austin", state: "Texas", type: "Public", acc: 29, sat25: 1230, sat75: 1480, gpa: 3.8, tags: ["Business", "CS", "Engineering"] },
  { name: "University of Florida", state: "Florida", type: "Public", acc: 24, sat25: 1300, sat75: 1470, gpa: 3.85, tags: ["Business", "Pre-Med", "Engineering"] },
  { name: "University of Washington", state: "Washington", type: "Public", acc: 43, sat25: 1220, sat75: 1470, gpa: 3.78, tags: ["CS", "Pre-Med", "Engineering"] },
  { name: "UW–Madison", state: "Wisconsin", type: "Public", acc: 43, sat25: 1300, sat75: 1480, gpa: 3.8, tags: ["Business", "Science", "Engineering"] },
  { name: "UIUC (Illinois)", state: "Illinois", type: "Public", acc: 44, sat25: 1290, sat75: 1500, gpa: 3.75, tags: ["CS", "Engineering", "Business"] },
  { name: "Purdue University", state: "Indiana", type: "Public", acc: 50, sat25: 1210, sat75: 1450, gpa: 3.7, tags: ["Engineering", "CS", "Agriculture"] },
  { name: "Ohio State University", state: "Ohio", type: "Public", acc: 51, sat25: 1240, sat75: 1440, gpa: 3.75, tags: ["Business", "Engineering", "Pre-Med"] },
  { name: "Penn State", state: "Pennsylvania", type: "Public", acc: 55, sat25: 1160, sat75: 1370, gpa: 3.6, tags: ["Business", "Engineering", "Communications"] },
  { name: "Rutgers University", state: "New Jersey", type: "Public", acc: 65, sat25: 1190, sat75: 1410, gpa: 3.6, tags: ["Business", "Pre-Med", "Psychology"] },
  { name: "Texas A&M", state: "Texas", type: "Public", acc: 63, sat25: 1150, sat75: 1390, gpa: 3.65, tags: ["Engineering", "Business", "Agriculture"] },
  { name: "Indiana University", state: "Indiana", type: "Public", acc: 82, sat25: 1140, sat75: 1360, gpa: 3.6, tags: ["Business", "Music", "Communications"] },
  { name: "Michigan State", state: "Michigan", type: "Public", acc: 84, sat25: 1100, sat75: 1320, gpa: 3.55, tags: ["Business", "Communications", "Education"] },
  { name: "University of Alabama", state: "Alabama", type: "Public", acc: 78, sat25: 1070, sat75: 1340, gpa: 3.5, tags: ["Business", "Nursing", "Communications"] },
  { name: "Arizona State University", state: "Arizona", type: "Public", acc: 90, sat25: 1120, sat75: 1360, gpa: 3.5, tags: ["Business", "Engineering", "Journalism"] },
];

/* ---- Major Match quiz ----
   Traits: tech, stem, health, business, humanities, arts, social */
const QUIZ = [
  {
    q: "It's a free Saturday. Which sounds most fun?",
    opts: [
      { t: "Building or coding something — an app, a robot, a mod", w: { tech: 3, stem: 2 } },
      { t: "Volunteering at a hospital, shelter, or helping someone one-on-one", w: { health: 3, social: 1 } },
      { t: "Flipping sneakers, running a small side hustle, planning an event", w: { business: 3, social: 1 } },
      { t: "Writing, drawing, filming, or making music", w: { arts: 3, humanities: 1 } },
    ],
  },
  {
    q: "Which class do you actually look forward to?",
    opts: [
      { t: "Math or physics — I like when things have a right answer", w: { stem: 3, tech: 1 } },
      { t: "Biology or chemistry — how living things work", w: { health: 2, stem: 2 } },
      { t: "English or history — discussions, ideas, arguments", w: { humanities: 3, social: 1 } },
      { t: "Psychology, government, or economics — how people and systems behave", w: { social: 2, business: 2 } },
    ],
  },
  {
    q: "Your friends would say you're the one who…",
    opts: [
      { t: "Fixes everyone's tech and explains how things work", w: { tech: 3, stem: 1 } },
      { t: "People come to with their problems", w: { social: 2, health: 2 } },
      { t: "Organizes the group and gets things done", w: { business: 3 } },
      { t: "Has the most creative ideas", w: { arts: 3, humanities: 1 } },
    ],
  },
  {
    q: "Pick a school project you'd choose first:",
    opts: [
      { t: "Design and run an experiment, analyze the data", w: { stem: 3, health: 1 } },
      { t: "Write a persuasive essay or a short story", w: { humanities: 3, arts: 1 } },
      { t: "Build a business plan and pitch it", w: { business: 3 } },
      { t: "Create a video, poster, or performance", w: { arts: 3 } },
    ],
  },
  {
    q: "What kind of impact do you want your career to have?",
    opts: [
      { t: "Invent or build technology that people use", w: { tech: 2, stem: 2 } },
      { t: "Directly improve people's health or wellbeing", w: { health: 3, social: 1 } },
      { t: "Build companies, grow ideas, create jobs", w: { business: 3 } },
      { t: "Change how people think — through words, art, policy, or teaching", w: { humanities: 2, arts: 1, social: 1 } },
    ],
  },
  {
    q: "Which problem would you rather spend a month on?",
    opts: [
      { t: "Making an algorithm faster or a machine more efficient", w: { tech: 2, stem: 2 } },
      { t: "Figuring out why a disease spreads and how to stop it", w: { health: 3, stem: 1 } },
      { t: "Figuring out why a store is losing customers and fixing it", w: { business: 3 } },
      { t: "Understanding why two communities are in conflict", w: { social: 3, humanities: 1 } },
    ],
  },
  {
    q: "How do you feel about public speaking and leading groups?",
    opts: [
      { t: "Love it — I'm energized by presenting and persuading", w: { business: 2, social: 1, humanities: 1 } },
      { t: "Fine in small groups — I prefer deep 1-on-1 conversations", w: { health: 2, social: 2 } },
      { t: "I'd rather let my work speak for itself", w: { tech: 2, stem: 1, arts: 1 } },
      { t: "I like performing or presenting creative work specifically", w: { arts: 3 } },
    ],
  },
  {
    q: "Which headline would make you click first?",
    opts: [
      { t: "\"New AI model beats every benchmark\"", w: { tech: 3 } },
      { t: "\"Breakthrough cancer treatment enters trials\"", w: { health: 3 } },
      { t: "\"19-year-old founder raises $10M\"", w: { business: 3 } },
      { t: "\"This year's most powerful films, books & exhibitions\"", w: { arts: 2, humanities: 2 } },
    ],
  },
];

const MAJORS = [
  {
    name: "Computer Science",
    traits: { tech: 5, stem: 3 },
    desc: "Programming, algorithms, AI, and systems. One of the most flexible and in-demand degrees — it powers everything from games to medicine.",
    careers: ["Software Engineer", "AI/ML Engineer", "Cybersecurity Analyst", "Game Developer"],
    track: "cs",
    classes: ["AP Computer Science A", "AP Calculus", "AP Physics"],
  },
  {
    name: "Engineering (Mechanical / Electrical / Aero)",
    traits: { stem: 5, tech: 3 },
    desc: "Applying physics and math to design real things: engines, circuits, rockets, prosthetics. For people who like to know how everything works.",
    careers: ["Mechanical Engineer", "Electrical Engineer", "Aerospace Engineer", "Robotics Engineer"],
    track: "stem",
    classes: ["AP Physics C", "AP Calculus BC", "Robotics / Engineering electives"],
  },
  {
    name: "Biology / Pre-Med",
    traits: { health: 4, stem: 3 },
    desc: "The science of living things, and the standard road to medical, dental, or vet school. Heavy on labs, memorization, and curiosity about life.",
    careers: ["Physician", "Biomedical Researcher", "Physician Assistant", "Geneticist"],
    track: "premed",
    classes: ["AP Biology", "AP Chemistry", "Anatomy & Physiology"],
  },
  {
    name: "Nursing",
    traits: { health: 5, social: 2 },
    desc: "Hands-on patient care with strong job security and a faster path into healthcare than an MD. Direct-admit BSN programs are competitive — plan early.",
    careers: ["Registered Nurse", "Nurse Practitioner", "Nurse Anesthetist (CRNA)", "ER / ICU Nurse"],
    track: "premed",
    classes: ["AP Biology", "Chemistry", "Anatomy & Physiology", "Psychology"],
  },
  {
    name: "Business Administration",
    traits: { business: 5, social: 1 },
    desc: "Management, marketing, finance, and entrepreneurship. Great for organizers, persuaders, and future founders.",
    careers: ["Marketing Manager", "Financial Analyst", "Entrepreneur", "Consultant"],
    track: "business",
    classes: ["AP Statistics", "AP Economics", "AP Calculus AB"],
  },
  {
    name: "Economics",
    traits: { business: 3, stem: 2, social: 2 },
    desc: "How people, markets, and governments make decisions. More math than business; a favorite for finance, consulting, policy, and law school.",
    careers: ["Economist", "Investment Analyst", "Data Analyst", "Policy Advisor"],
    track: "business",
    classes: ["AP Calculus BC", "AP Economics", "AP Statistics"],
  },
  {
    name: "Psychology",
    traits: { social: 4, health: 2 },
    desc: "Why people think, feel, and act the way they do. Leads to counseling, research, UX, HR — usually with grad school for clinical roles.",
    careers: ["Clinical Psychologist", "School Counselor", "UX Researcher", "HR Specialist"],
    track: "social",
    classes: ["AP Psychology", "AP Statistics", "AP Biology"],
  },
  {
    name: "Political Science / Pre-Law",
    traits: { social: 3, humanities: 3 },
    desc: "Government, law, and power. The classic path toward law school, policy, campaigns, and public service.",
    careers: ["Lawyer", "Policy Analyst", "Legislative Aide", "Diplomat / Foreign Service"],
    track: "humanities",
    classes: ["AP US Government", "AP US History", "Debate / Mock Trial"],
  },
  {
    name: "English / Creative Writing",
    traits: { humanities: 5, arts: 2 },
    desc: "Reading deeply and writing powerfully. Underrated: strong writers stand out in law, publishing, marketing, and film.",
    careers: ["Author / Editor", "Content Strategist", "Screenwriter", "Attorney (with law school)"],
    track: "humanities",
    classes: ["AP English Literature", "AP English Language", "Journalism / Creative Writing"],
  },
  {
    name: "Communications / Media & Journalism",
    traits: { humanities: 2, social: 2, arts: 2, business: 1 },
    desc: "Storytelling at scale — news, PR, social media, broadcasting. For people who love an audience.",
    careers: ["Journalist", "PR Specialist", "Social Media Manager", "Broadcast Producer"],
    track: "humanities",
    classes: ["AP English Language", "Journalism", "Digital Media / Film"],
  },
  {
    name: "Visual Arts / Design",
    traits: { arts: 5 },
    desc: "Graphic design, illustration, animation, UX. You'll need a portfolio — start building it now, it matters more than test scores for art programs.",
    careers: ["UX/UI Designer", "Animator", "Graphic Designer", "Art Director"],
    track: "arts",
    classes: ["AP Art & Design", "Digital Media", "Art electives every year"],
  },
  {
    name: "Mathematics / Statistics & Data Science",
    traits: { stem: 4, tech: 3 },
    desc: "The language behind AI, finance, and science. Data science is one of the fastest-growing fields anywhere.",
    careers: ["Data Scientist", "Actuary", "Quantitative Analyst", "Statistician"],
    track: "stem",
    classes: ["AP Calculus BC", "AP Statistics", "AP Computer Science A"],
  },
  {
    name: "Environmental Science",
    traits: { stem: 3, health: 1, social: 2 },
    desc: "Climate, ecosystems, and sustainability — science with a mission. Combines field work, lab work, and policy.",
    careers: ["Environmental Scientist", "Conservation Biologist", "Sustainability Consultant", "Environmental Engineer"],
    track: "stem",
    classes: ["AP Environmental Science", "AP Biology", "AP Chemistry"],
  },
];

/* ---- Course tracks ---- */
const TRACKS = {
  stem: {
    label: "STEM / Engineering",
    years: {
      "9th grade": { Math: "Geometry or Algebra II (get ahead if you can)", Science: "Biology", English: "English 9", "Social Studies": "World History / Geography", Other: "Foreign language · Intro to Engineering or Robotics elective" },
      "10th grade": { Math: "Algebra II or Pre-Calculus", Science: "Chemistry (Honors if offered)", English: "English 10", "Social Studies": "World History / AP World", Other: "Foreign language · CS or engineering elective" },
      "11th grade": { Math: "Pre-Calc or AP Calculus AB/BC", Science: "AP Physics 1 or AP Chemistry", English: "AP English Language", "Social Studies": "APUSH or US History", Other: "Foreign language yr 3 · Robotics / Science Olympiad" },
      "12th grade": { Math: "AP Calculus BC or AP Statistics", Science: "AP Physics C (huge for engineering)", English: "English 12 / AP Lit", "Social Studies": "Gov/Econ", Other: "AP CS A · capstone or research project" },
    },
    tip: "Engineering programs look hardest at math and physics rigor. AP Calculus (ideally BC) + AP Physics C is the strongest combo. Join a build team — FRC robotics, rocketry, Science Olympiad — and stick with it.",
  },
  cs: {
    label: "Computer Science",
    years: {
      "9th grade": { Math: "Geometry or Algebra II", Science: "Biology", English: "English 9", "Social Studies": "World History", Other: "Foreign language · Intro to CS / learn Python on your own" },
      "10th grade": { Math: "Algebra II or Pre-Calculus", Science: "Chemistry", English: "English 10", "Social Studies": "AP World or World History", Other: "Foreign language · AP CS Principles" },
      "11th grade": { Math: "Pre-Calc or AP Calculus AB/BC", Science: "AP Physics 1", English: "AP English Language", "Social Studies": "APUSH", Other: "AP Computer Science A · start a real project or club" },
      "12th grade": { Math: "AP Calculus BC or AP Stats", Science: "AP Physics C or AP Chem", English: "English 12 / AP Lit", "Social Studies": "Gov/Econ", Other: "Advanced CS / data structures · personal projects, hackathons" },
    },
    tip: "For CS, personal projects beat almost everything — build apps, contribute to open source, do hackathons, USACO if you like competition. Colleges admit CS majors largely on math strength, so treat calculus as your #1 class.",
  },
  premed: {
    label: "Pre-Med / Health Sciences",
    years: {
      "9th grade": { Math: "Geometry or Algebra II", Science: "Biology (Honors)", English: "English 9", "Social Studies": "World History", Other: "Foreign language · start volunteering (hospital, clinic, EMS explorer)" },
      "10th grade": { Math: "Algebra II or Pre-Calc", Science: "Chemistry (Honors)", English: "English 10", "Social Studies": "AP World", Other: "Foreign language · HOSA or health club" },
      "11th grade": { Math: "Pre-Calc or AP Calc AB", Science: "AP Biology + Anatomy if possible", English: "AP English Language", "Social Studies": "APUSH", Other: "AP Psychology · shadow a doctor or get CNA/EMT training" },
      "12th grade": { Math: "AP Calculus or AP Statistics", Science: "AP Chemistry", English: "English 12 / AP Lit", "Social Studies": "Gov/Econ", Other: "Continue clinical volunteering — hours and consistency matter" },
    },
    tip: "Med schools come later — for college apps, what stands out is sustained, hands-on care for other people: hospital volunteering, EMT certification, hospice work. AP Bio + AP Chem is the core science signal.",
  },
  business: {
    label: "Business / Economics",
    years: {
      "9th grade": { Math: "Geometry or Algebra II", Science: "Biology", English: "English 9", "Social Studies": "World History", Other: "Foreign language · DECA or FBLA" },
      "10th grade": { Math: "Algebra II / Pre-Calc", Science: "Chemistry", English: "English 10", "Social Studies": "AP World", Other: "Foreign language · start something small (club, resale, service)" },
      "11th grade": { Math: "Pre-Calc or AP Calc AB", Science: "Physics", English: "AP English Language", "Social Studies": "APUSH", Other: "AP Statistics · leadership role in DECA/FBLA" },
      "12th grade": { Math: "AP Calculus (top programs expect it)", Science: "Science elective or AP", English: "English 12 / AP Lit", "Social Studies": "AP Micro/Macro Economics + Gov", Other: "Internship or run a real venture" },
    },
    tip: "Top undergrad business schools (Wharton, Ross, McCombs) want calculus and evidence you've actually built or led something. A tiny real business with real customers beats five club memberships.",
  },
  humanities: {
    label: "Humanities / Pre-Law / Writing",
    years: {
      "9th grade": { Math: "Geometry or Algebra II", Science: "Biology", English: "English 9 (Honors)", "Social Studies": "World History", Other: "Foreign language · debate, Model UN, or school paper" },
      "10th grade": { Math: "Algebra II", Science: "Chemistry", English: "English 10 (Honors)", "Social Studies": "AP World History", Other: "Foreign language · keep writing/debating" },
      "11th grade": { Math: "Pre-Calculus", Science: "Physics or elective", English: "AP English Language", "Social Studies": "APUSH", Other: "AP US Government · editor/captain roles · writing contests" },
      "12th grade": { Math: "AP Stats or Calculus", Science: "Science elective", English: "AP English Literature", "Social Studies": "AP Gov / AP Euro", Other: "4th year of foreign language (selective colleges love this)" },
    },
    tip: "Rigor in English, history, and foreign language is your signal. Enter real competitions — Scholastic Writing Awards, NSDA debate, essay contests — and aim for published or award-winning work by junior year.",
  },
  arts: {
    label: "Visual & Performing Arts",
    years: {
      "9th grade": { Math: "Geometry or Algebra II", Science: "Biology", English: "English 9", "Social Studies": "World History", Other: "Foreign language · art/music/theatre class every semester" },
      "10th grade": { Math: "Algebra II", Science: "Chemistry", English: "English 10", "Social Studies": "World or AP World", Other: "Advanced art electives · start your portfolio folder now" },
      "11th grade": { Math: "Pre-Calculus", Science: "Physics or elective", English: "AP English Language", "Social Studies": "APUSH", Other: "AP Art & Design or advanced ensemble · summer arts program" },
      "12th grade": { Math: "Stats or Pre-Calc/Calc", Science: "Science elective", English: "English 12 / AP Lit", "Social Studies": "Gov/Econ", Other: "Portfolio completion — most art schools require 10–20 pieces" },
    },
    tip: "For art/music/theatre programs the portfolio or audition is 50%+ of the decision. Take an art class every single semester, do a pre-college summer intensive if you can, and start portfolio prep junior year, not senior fall.",
  },
  social: {
    label: "Social Sciences / Psychology",
    years: {
      "9th grade": { Math: "Geometry or Algebra II", Science: "Biology", English: "English 9", "Social Studies": "World History", Other: "Foreign language · volunteer with people (tutoring, seniors, crisis text line at 16+)" },
      "10th grade": { Math: "Algebra II", Science: "Chemistry", English: "English 10", "Social Studies": "AP World", Other: "Foreign language · peer counseling / mentoring" },
      "11th grade": { Math: "Pre-Calc or AP Stats", Science: "AP Biology", English: "AP English Language", "Social Studies": "APUSH + AP Psychology", Other: "Research assistant gigs — email local university labs" },
      "12th grade": { Math: "AP Statistics (psych is stats-heavy!)", Science: "Science elective", English: "English 12 / AP Lit", "Social Studies": "AP Gov or Sociology", Other: "Lead a service project · continue research if possible" },
    },
    tip: "Psychology and social science are research fields — AP Statistics matters more than calculus here, and cold-emailing professors to help in a lab junior summer is a genuinely underused move.",
  },
  undecided: {
    label: "Undecided (keep every door open)",
    years: {
      "9th grade": { Math: "Geometry or Algebra II", Science: "Biology", English: "English 9", "Social Studies": "World History", Other: "Foreign language · try 2–3 very different clubs" },
      "10th grade": { Math: "Algebra II / Pre-Calc", Science: "Chemistry", English: "English 10", "Social Studies": "AP World", Other: "Foreign language · narrow to the 1–2 activities you like most" },
      "11th grade": { Math: "Pre-Calc or AP Calc AB", Science: "Physics or AP science you like", English: "AP English Language", "Social Studies": "APUSH", Other: "One AP elective in your strongest interest" },
      "12th grade": { Math: "AP Calc or AP Stats", Science: "AP science", English: "English 12 / AP Lit", "Social Studies": "Gov/Econ", Other: "4th year of language · depth in your best activity" },
    },
    tip: "Undecided is normal — most college students change majors anyway. The safe play: 4 years of math through calculus, 4 of English, 3–4 of science, 3–4 of social studies, 3–4 of one foreign language. That satisfies every selective college.",
  },
};

/* ---- Essay ---- */
const ESSAY_PROMPTS = [
  "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, please share your story.",
  "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn?",
  "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
  "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
  "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
  "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
  "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design.",
];

const BRAINSTORM_QS = [
  "What's something you do that your friends would say is \"so you\"?",
  "Describe a 10-minute moment from your life you still think about. Why?",
  "What do you believe that most people around you don't?",
  "When did you change your mind about something important?",
  "What's the hardest thing you've done that nobody made you do?",
  "What object in your room says the most about you?",
  "What could you teach a class on with zero preparation?",
  "When have you failed and actually done something about it afterward?",
];

const CLICHE_TOPICS = [
  { pattern: /\b(game[- ]winning|winning (shot|goal|touchdown)|championship game|big game)\b/i, label: "The Big Game — sports-victory essays are extremely common. If you write about sports, focus on a tiny, personal moment instead of the win." },
  { pattern: /\b(mission trip|volunteer(ed)? (abroad|in a third)|poverty (i saw|opened my eyes))\b/i, label: "The service/mission trip — often reads as more about them than you. If you use it, center what changed in YOUR behavior after coming home." },
  { pattern: /\btorn acl|sports injury|season[- ]ending injury\b/i, label: "The sports injury comeback — very common. Only keep it if your insight goes beyond 'I learned perseverance.'" },
  { pattern: /\bwebster'?s dictionary|dictionary defines\b/i, label: "Starting with a dictionary definition — admissions officers cite this as their least favorite opener. Cut it." },
  { pattern: /\b(my grandmother|my grandfather) (passed|died)\b/i, label: "A loss essay can be powerful, but keep the focus on you — how you changed — not a eulogy." },
  { pattern: /\bsince the dawn of time|throughout human history\b/i, label: "Grand-opening clichés ('since the dawn of time…') — start inside a specific moment instead." },
];

const WEAK_WORDS = ["very", "really", "things", "stuff", "a lot", "interesting", "amazing", "impactful", "passionate"];

/* ---- Summer programs ---- */
const PROGRAMS = [
  { name: "Research Science Institute (RSI)", cat: "STEM", cost: "free", grades: "Rising seniors", when: "Apply by ~Dec–Jan", sel: "Extremely selective", desc: "Six weeks of research at MIT — the most prestigious high school science program in the country. Free, including room and board." },
  { name: "MITES Summer (MIT)", cat: "STEM", cost: "free", grades: "Rising seniors", when: "Apply by ~Feb 1", sel: "Very selective", desc: "MIT's free six-week STEM intensive for talented students from underrepresented and underserved backgrounds." },
  { name: "Summer Science Program (SSP)", cat: "STEM", cost: "paid (strong financial aid)", grades: "Rising seniors (some juniors)", when: "Apply by ~Feb", sel: "Very selective", desc: "Real research in astrophysics, biochemistry, or genomics. Legendary among admissions officers; aid can bring cost to $0." },
  { name: "COSMOS (University of California)", cat: "STEM", cost: "paid (aid available)", grades: "Grades 8–12", when: "Apply Jan–Feb", sel: "Selective", desc: "Four-week STEM residential program across UC campuses. Great for California students." },
  { name: "Clark Scholars Program (Texas Tech)", cat: "Research", cost: "free + $750 stipend", grades: "17+ by program start", when: "Apply by ~Feb", sel: "Extremely selective (12 students)", desc: "Seven weeks of one-on-one research in any field — including humanities — with a stipend." },
  { name: "Telluride Association Summer Seminar (TASS)", cat: "Humanities", cost: "free", grades: "Rising juniors & seniors", when: "Apply by ~Dec–Jan", sel: "Very selective", desc: "Free six-week critical-thinking seminar on race, class, and power. Everything covered, even books." },
  { name: "Iowa Young Writers' Studio", cat: "Writing", cost: "paid (aid available)", grades: "Grades 10–12", when: "Apply by ~Jan–Feb", sel: "Selective", desc: "Two-week creative writing intensive at the most famous writing university in America." },
  { name: "Girls Who Code Summer Programs", cat: "STEM", cost: "free", grades: "Grades 9–12", when: "Apply spring", sel: "Accessible", desc: "Free virtual coding programs for girls and non-binary students — no experience needed." },
  { name: "Bank of America Student Leaders", cat: "Leadership", cost: "paid TO you (paid internship)", grades: "Juniors & seniors", when: "Apply by ~Jan", sel: "Selective", desc: "Eight-week paid internship at a local nonprofit plus a leadership summit in Washington, D.C." },
  { name: "LaunchX", cat: "Business", cost: "paid (aid available)", grades: "Grades 9–12", when: "Rolling, apply by ~Feb", sel: "Selective", desc: "Start a real company with a team in one summer. Strong for future business/entrepreneurship majors." },
  { name: "NIH Summer Internship Program (HS-SIP)", cat: "Research", cost: "paid TO you (stipend)", grades: "17+ juniors & seniors", when: "Apply by ~Feb", sel: "Very selective", desc: "Work in a real NIH biomedical research lab and get paid for it. Ideal for pre-med students." },
  { name: "Your state's Governor's School", cat: "Varies", cost: "free (most states)", grades: "Usually rising juniors/seniors", when: "Nominations in fall/winter", sel: "Selective", desc: "Most states run free summer honors programs in STEM, arts, or humanities. Ask your counselor about nomination — many students never do." },
  { name: "Boys State / Girls State", cat: "Leadership", cost: "free (sponsored)", grades: "Rising seniors", when: "Ask counselor in spring", sel: "Selective", desc: "Week-long civics and leadership program run by the American Legion — build and run a mock state government." },
  { name: "Community college dual enrollment", cat: "Academics", cost: "free or cheap (most states)", grades: "Any", when: "Enroll each semester", sel: "Open", desc: "Real college credit over the summer. Unglamorous but genuinely effective — shows you can handle college work." },
];

/* ---- Scholarships ---- */
const SCHOLARSHIPS = [
  { name: "QuestBridge National College Match", cat: "Full ride", amount: "Full 4-year scholarship", who: "High-achieving seniors from families typically earning under ~$65k", when: "Apply Sept (senior year)", desc: "Matches top low-income students with full scholarships to 50+ elite colleges (Stanford, MIT, Yale…). If your family income qualifies, this should be priority #1 — also apply as a junior for College Prep Scholars." },
  { name: "The Gates Scholarship", cat: "Full ride", amount: "Full cost of attendance", who: "Pell-eligible minority students with top grades", when: "Opens July, due ~Sept 15", desc: "300 full scholarships a year covering everything federal aid doesn't." },
  { name: "Coca-Cola Scholars", cat: "Merit", amount: "$20,000", who: "Seniors with strong leadership + service", when: "Due ~Sept 30 (senior year)", desc: "One of the most prestigious merit awards — 150 winners a year. Application is short; apply early senior fall." },
  { name: "Jack Kent Cooke College Scholarship", cat: "Full ride", amount: "Up to ~$55,000/year", who: "Top students with financial need", when: "Due ~Nov (senior year)", desc: "Huge award plus advising and a strong scholar network. Also runs a Young Scholars program you apply to in 7th grade." },
  { name: "National Merit Scholarship", cat: "Merit", amount: "$2,500 – full tuition (college-dependent)", who: "Top ~1% PSAT scorers by state", when: "Take PSAT in October of junior year", desc: "It all starts with the junior-year PSAT — worth genuinely studying for. Some colleges give National Merit Finalists full rides." },
  { name: "Amazon Future Engineer Scholarship", cat: "STEM", amount: "$40,000 + internship", who: "Seniors pursuing CS with financial need", when: "Opens fall, due ~Jan", desc: "$10k/year for CS majors plus a guaranteed paid Amazon internship offer after freshman year." },
  { name: "Ron Brown Scholar Program", cat: "Merit", amount: "$40,000", who: "Black/African American seniors, leadership + need", when: "Due Nov 1 / Jan 9", desc: "Prestigious award plus a lifelong professional network." },
  { name: "Elks Most Valuable Student", cat: "Merit", amount: "$1,000 – $7,500/yr (up to $30k)", who: "Seniors; based on leadership, need, scholarship", when: "Opens Aug, due ~Nov", desc: "500 awards a year and far less famous than Coca-Cola — meaning better odds." },
  { name: "Horatio Alger Scholarship", cat: "Need-based", amount: "$25,000", who: "Students who've overcome significant adversity, <$65k income", when: "Due ~Oct 25 (apply as junior/senior)", desc: "Specifically for students who've faced real hardship and kept going." },
  { name: "Burger King Scholars", cat: "Accessible", amount: "$1,000 – $50,000", who: "Any senior with a 2.5+ GPA", when: "Opens Oct, due ~Dec", desc: "Thousands of awards a year and a low GPA bar — a high-volume 'why not' application." },
  { name: "Cameron Impact Scholarship", cat: "Full ride", amount: "Full tuition (4 years)", who: "Juniors (yes, juniors!) with 3.7+ GPA + leadership", when: "Due May–Sept of JUNIOR year", desc: "One of the few full rides you apply for as a junior. Mark the deadline now." },
  { name: "Regeneron Science Talent Search", cat: "STEM", amount: "Up to $250,000", who: "Seniors with an original research project", when: "Due ~Nov (senior year)", desc: "America's oldest science competition. Even semifinalist status ($2,000) is a major admissions signal — start the research junior year." },
  { name: "Local & community scholarships", cat: "Accessible", amount: "$500 – $5,000 (often stack!)", who: "Everyone — your school, city, employers, churches", when: "Mostly spring of senior year", desc: "The best-kept secret: local awards have tiny applicant pools. Ask your counselor for the school's local scholarship list — students routinely stack several." },
];

/* ---- Default to-do tasks by grade level ---- */
const DEFAULT_TASKS = {
  9: [
    "Aim for the strongest GPA you can — 9th grade counts",
    "Join 2–3 clubs or activities and see what sticks",
    "Start a foreign language (plan for 3–4 years of it)",
    "Meet your school counselor once this year",
  ],
  10: [
    "Take the PSAT for practice",
    "Go deeper in 1–2 activities instead of joining more",
    "Plan next summer NOW — program deadlines are Dec–Feb",
    "Draft your 11th–12th grade course plan with APs",
  ],
  11: [
    "Take the PSAT in October — it's the National Merit qualifier",
    "Prep for and take the SAT/ACT (spring)",
    "Build your college list (safeties, matches, reaches)",
    "Ask 2 teachers for recommendation letters before summer",
    "Visit colleges (even local ones) over breaks",
    "Start your Common App essay the summer before senior year",
  ],
  12: [
    "Finalize your college list (aim for 8–12 schools)",
    "Finish your personal statement by October",
    "Submit FAFSA as soon as it opens",
    "Apply Early Action anywhere it's free to do so",
    "Track every deadline in the Colleges tab",
    "Apply to at least 5 scholarships",
  ],
};

/* ---- Per-college application requirements checklist ---- */
const REQUIREMENTS = [
  ["form", "Application form completed"],
  ["essay", "Personal statement finalized"],
  ["supp", "Supplemental essays done"],
  ["transcript", "Transcript requested"],
  ["recs", "Rec letters requested (2+)"],
  ["scores", "Test scores sent (or test-optional)"],
  ["fafsa", "FAFSA / financial aid submitted"],
  ["fee", "Fee paid or waiver applied"],
];

/* ---- Clubs & activities picker ---- */
const CLUBS = [
  "Robotics / FRC", "Coding / CS Club", "Science Olympiad", "Math Team",
  "Debate / Speech", "Model UN", "Mock Trial", "Student Government",
  "DECA / FBLA", "HOSA / Med Club", "Key Club / Volunteering", "National Honor Society",
  "School Newspaper", "Yearbook", "Band / Orchestra", "Choir",
  "Theatre / Drama", "Art Club", "Dance", "Chess Club",
  "Varsity Sport", "JV / Club Sport", "Environmental Club", "Cultural / Language Club",
];

/* ---- Timeline for the dashboard ---- */
const TIMELINE = [
  { grade: "9th grade", items: ["Build strong grades and habits", "Explore clubs, sports, and interests", "Start your foreign language sequence"] },
  { grade: "10th grade", items: ["Practice PSAT", "Take on more rigor (honors/AP)", "Apply to summer programs (deadlines Dec–Feb)", "Go deep in your best activities"] },
  { grade: "11th grade", items: ["PSAT in Oct (National Merit!)", "SAT/ACT in spring", "Lead something", "Build your college list", "Ask for rec letters in spring", "Start essays in summer"] },
  { grade: "12th grade (fall)", items: ["Finish essays by Oct", "Early Action/Decision apps due ~Nov 1", "FAFSA opens — file early", "Regular Decision apps due Jan 1–15"] },
  { grade: "12th grade (spring)", items: ["Decisions arrive Dec–Apr", "Compare financial aid offers", "Apply to local scholarships", "Commit by May 1 🎉"] },
];
