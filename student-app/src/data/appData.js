export const STUDENT = {
  name: "Tshering Dorji",
  studentId: "02230145",
  dob: "14 March 2004",
  gender: "Male",
  programme: "Artificial Intelligence and Full-Stack Development",
  yearSemester: "2nd Year, Semester 3",
  enrollmentNumber: "02230145",
  enrolmentYear: "2024"
};

const PHONE = "+975 12345678";

export const clubs = [
  {
    id: 1,
    name: "Integrity Club",
    tagline: "Accountability through digital auditing",
    short: "Promotes accountability and digitalizes the auditing of club and college resources.",
    image: "/integrity.png",
    logo: "/integrity.png",
    advisors: ["Nima Gyeltshen"],
    members: ["Rinzin Choden", "Bishal Limbu"],
    activeMembers: 42,
    description:
      "The Integrity Club was established following recommendations by the Royal Audit Authority and the Anti-Corruption Commission to strengthen accountability and proper budget utilization across college resources. The club supports in-depth analysis of cost management, identifies significant risks, and provides guidance to improve internal control. It is the first club at any RUB college to digitalize the auditing process, and all enthusiastic students are welcome to join. Members build critical thinking, analytical, and IT skills while helping improve transparency and accountability across all clubs and the college.",
    phone: PHONE,
    email: "integrityclub@college.edu.bt"
  },
  {
    id: 3,
    name: "Literary & Interactive Arts",
    tagline: "Music, dance, theatre and creative writing",
    short: "Music, dance, theatre, creative writing, and digital content creation.",
    image: "/Literary&Interactive Arts.png",
    logo: "/Literary&Interactive Arts.png",
    advisors: ["Thubten Zepa Thegchog", "Chimi Dema"],
    members: [],
    activeMembers: null,
    description:
      "The Literary and Interactive Arts Club is a vibrant community of young artists and creative thinkers who come together to explore their passions and develop their talents. The club focuses on Visual Arts, including music, dance, instruments and theatre, Creative Writing, and Digital Content Creation. Members can develop their skills through workshops, build confidence, explore new ideas and collaborate with other students in a friendly environment.",
    phone: PHONE,
    email: "literaryarts@college.edu.bt"
  },
  {
    id: 4,
    name: "Media, Marketing & Design (MMD)",
    tagline: "Marketing, media and design with the SSO",
    short: "Runs real marketing campaigns and builds content with the Student Services Office.",
    image: "/MMD.png",
    logo: "/MMD.png",
    advisors: ["Karma Cheki", "Jigme Tshewang", "Jigme Dema"],
    members: [],
    activeMembers: null,
    description:
      "MMD is GCIT's student-driven marketing, media and design club. The club works closely with the school's Student Services Office (SSO) to manage internal and external activities by creating modern content and promoting the school's brand. Students gain practical, real-world experience by executing digital marketing campaigns and building portfolios of digital content.",
    phone: PHONE,
    email: "mmd@college.edu.bt"
  },
  {
    id: 5,
    name: "Rovers",
    tagline: "Scouting, service and adventure",
    short: "Scouting for volunteering, conservation, disaster relief, and cultural preservation.",
    image: "/Rovers.png",
    logo: "/Rovers.png",
    advisors: ["Karma Dorji"],
    members: [],
    activeMembers: null,
    description:
      "The Rover Scout Club provides opportunities for young adults to develop themselves through exploration, adventure and community service. Members can take part in tree planting, clean-up drives, waste management, disaster relief, cultural preservation and international Jamborees and Moots.",
    phone: PHONE,
    email: "rovers@college.edu.bt"
  },
  {
    id: 7,
    name: "Start-Up Agency",
    tagline: "Real software and UI/UX projects",
    short: "A student-led agency delivering real software and UI/UX projects for clients.",
    image: "/Startup.png",
    logo: "/Startup.png",
    advisors: ["Ong Kean Tat", "Karma Choden", "Choki Dorji", "Sherab Tharchen Dorji"],
    members: [],
    activeMembers: null,
    description:
      "The GCIT+ StartUp is a student-led agency that provides software development services with innovative UI/UX. Students work alongside faculty to propose and implement solutions for businesses, gaining experience in product ideation, development and digital platforms, and building professional portfolios.",
    phone: PHONE,
    email: "startup@college.edu.bt"
  },
  {
    id: 6,
    name: "Tarayana",
    tagline: "Community outreach and service",
    short: "Volunteer service uplifting rural communities through outreach, fundraising, and tutoring.",
    image: "/Tarayana.png",
    logo: "/Tarayana.png",
    advisors: ["Yeshi Tshering"],
    members: [],
    activeMembers: null,
    description:
      "The Tarayana Club was established at GCIT with inspiration from the Tarayana Foundation of Bhutan. Club activities include supporting disadvantaged families, helping children pursue education, organizing community outreach, raising funds and volunteering as tutors and mentors.",
    phone: PHONE,
    email: "tarayana@college.edu.bt"
  }
];

export const announcements = [
  {
    id: 1,
    clubId: 1,
    title: "General Meeting This Friday",
    short: "All members are requested to attend the general meeting at 4:00 PM in Seminar Hall 2.",
    message:
      "All members are requested to attend the general meeting at 4:00 PM in Seminar Hall 2. We will review the progress of the digital audit system, assign responsibilities for the coming month, and discuss feedback from the last club audit. Attendance is compulsory for all active members, so please arrive on time and bring your club ID.",
    postedBy: "Nima Gyeltshen",
    date: "2 Oct 2026"
  },
  {
    id: 2,
    clubId: 1,
    title: "Integrity Pledge Week",
    short: "Join us next week as we collect pledges from students and staff across campus.",
    message:
      "Join us next week as we collect integrity pledges from students and staff across campus. Volunteers will be stationed at the main gate, library, and cafeteria from 10:00 AM to 3:00 PM. Every pledge signed helps us build a culture of honesty and accountability in our college. Come by, sign the pledge, and encourage your friends to do the same.",
    postedBy: "Rinzin Choden",
    date: "30 Sep 2026"
  },
  {
    id: 3,
    clubId: 1,
    title: "Poll Open: Next Event Theme",
    short: "Vote for the theme of our upcoming awareness event. Voting closes on Sunday.",
    message:
      "Vote for the theme of our upcoming awareness event. Voting closes on Sunday. You can cast your vote from the Poll tab.",
    postedBy: "Club Coordinator",
    date: "29 Sep 2026"
  },
  {
    id: 4,
    clubId: 1,
    title: "Volunteers Needed",
    short: "We need 10 volunteers to help set up and manage the upcoming campus talk.",
    message:
      "We need 10 volunteers to help set up and manage the upcoming campus talk. Please contact the club coordinator if you are available.",
    postedBy: "Club Coordinator",
    date: "28 Sep 2026"
  },
  {
    id: 5,
    clubId: 1,
    title: "Schedule Change: Weekly Session",
    short: "This week's session is moved to Thursday at 3:30 PM due to a college event.",
    message:
      "This week's session is moved to Thursday at 3:30 PM due to a college event.",
    postedBy: "Club Coordinator",
    date: "27 Sep 2026"
  }
];

export const polls = [
  {
    id: 1,
    title: "Next Event Theme",
    question: "What should be the theme of our upcoming awareness event?",
    closing: "Voting closes this Sunday.",
    options: [
      "Transparency in Student Funds",
      "Honesty in Academics",
      "Digital Accountability",
      "Anti-Corruption Awareness"
    ],
    results: null
  },
  {
    id: 2,
    title: "Weekly Session Day",
    question: "Which day works best for our weekly club session?",
    closing: "Voting closes this Friday.",
    options: ["Monday", "Wednesday", "Friday", "Saturday"],
    // results are shown (read only) once the student has voted on this poll
    results: [55, 32, 7, 6],
    votedIndex: 1
  }
];
