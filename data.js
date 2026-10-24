/* Vakeel Desk - sample data (demo library).
   Article texts are SHORT, SIMPLIFIED explanations written for this demo.
   Always verify against the official Constitution / the judgment itself. */
window.VD_DATA = {
  articles: [
    {
      number: "14",
      title: "Equality before law",
      plain: "Everyone in India, citizen or not, is entitled to equality before the law and equal protection of the laws. The State cannot treat people unequally without a reasonable basis.",
      keywords: ["equal", "equality", "arbitrary", "arbitrariness", "unequal", "discrimination", "treated"]
    },
    {
      number: "15",
      title: "No discrimination on grounds of religion, race, caste, sex or place of birth",
      plain: "The State cannot discriminate against citizens only on grounds of religion, race, caste, sex or place of birth. Special provisions for women, children and disadvantaged groups are allowed.",
      keywords: ["discrimination", "discriminate", "religion", "race", "caste", "sex", "gender", "birth", "women", "equal", "equality"]
    },
    {
      number: "16",
      title: "Equality of opportunity in public employment",
      plain: "There must be equality of opportunity in government jobs, with no discrimination on grounds such as religion, race, caste, sex or place of birth. The State may make reservations for backward classes not adequately represented.",
      keywords: ["job", "jobs", "employment", "reservation", "recruitment", "opportunity", "equality", "equal"]
    },
    {
      number: "17",
      title: "Abolition of untouchability",
      plain: "Untouchability is abolished and its practice in any form is forbidden. Enforcing any disability arising from untouchability is an offence.",
      keywords: ["untouchability", "caste", "dalit"]
    },
    {
      number: "19",
      title: "Freedom of speech and expression and other freedoms",
      plain: "Citizens have the freedom of speech and expression, to assemble peacefully, to form associations, to move freely, to live anywhere in India and to practise any profession or business. The State can impose only reasonable restrictions made by law.",
      keywords: ["speech", "expression", "express", "assembly", "protest", "association", "movement", "profession", "business", "freedom", "opinion", "press", "communication", "message", "messages", "phone", "calls", "surveillance", "censorship", "internet", "online"]
    },
    {
      number: "20",
      title: "Protection in respect of conviction for offences",
      plain: "People accused of offences are protected: no punishment under a law made after the act, no being punished twice for the same offence, and no one can be forced to be a witness against themselves.",
      keywords: ["accused", "offence", "punishment", "incrimination", "witness", "conviction", "double", "jeopardy", "confession"]
    },
    {
      number: "21",
      title: "Protection of life and personal liberty",
      plain: "No person can be deprived of life or personal liberty except by a procedure established by law. Courts have read this broadly: it includes the right to privacy, dignity, a fair trial and a speedy trial.",
      keywords: ["life", "liberty", "privacy", "private", "dignity", "trial", "speedy", "arrest", "arrested", "detained", "personal", "message", "messages", "phone", "calls", "surveillance", "tapping", "data", "torture", "custody", "livelihood"]
    },
    {
      number: "22",
      title: "Protection against arrest and detention in certain cases",
      plain: "A person who is arrested must be told the grounds of arrest as soon as possible, must be allowed to consult and be defended by a lawyer of their choice, and must be produced before a magistrate within 24 hours (excluding travel time), with some exceptions such as preventive detention.",
      keywords: ["arrest", "arrested", "arresting", "detention", "detained", "custody", "police", "lawyer", "magistrate", "grounds", "told"]
    },
    {
      number: "32",
      title: "Right to constitutional remedies",
      plain: "You can go directly to the Supreme Court to enforce your fundamental rights. The Court can issue writs such as habeas corpus, mandamus, prohibition, certiorari and quo warranto. High Courts have similar powers under Article 226.",
      keywords: ["remedy", "remedies", "writ", "writs", "enforce", "petition", "habeas", "supreme"]
    },
    {
      number: "368",
      title: "Power of Parliament to amend the Constitution",
      plain: "Parliament can amend the Constitution by following the procedure in this Article. Under the basic structure doctrine from Kesavananda Bharati, amendments cannot destroy the Constitution's basic features.",
      keywords: ["amend", "amendment", "amending", "basic", "structure", "parliament"]
    }
  ],

  cases: [
    {
      name: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
      year: 2017,
      summary: "A nine-judge bench held that the right to privacy is a fundamental right, protected as part of life and liberty under Article 21 and the freedoms in Part III.",
      articles: ["21", "19", "14"]
    },
    {
      name: "PUCL v. Union of India",
      year: 1997,
      summary: "On telephone tapping: the Court held it is a serious invasion of privacy and laid down procedural safeguards that authorities must follow.",
      articles: ["21", "19"]
    },
    {
      name: "Maneka Gandhi v. Union of India",
      year: 1978,
      summary: "The procedure under Article 21 must be fair, just and reasonable, and Articles 14, 19 and 21 must be read together.",
      articles: ["21", "14", "19"]
    },
    {
      name: "D.K. Basu v. State of West Bengal",
      year: 1997,
      summary: "Laid down guidelines for arrest and detention to prevent custodial torture, such as arrest memos and informing a relative or friend.",
      articles: ["21", "22"]
    },
    {
      name: "Joginder Kumar v. State of U.P.",
      year: 1994,
      summary: "Arrest should not be routine. The police need justification to arrest, and the arrested person has a right to have someone informed.",
      articles: ["21", "22"]
    },
    {
      name: "Hussainara Khatoon v. Home Secretary, State of Bihar",
      year: 1979,
      summary: "Recognised the right to a speedy trial as part of Article 21, in a case about undertrial prisoners kept in jail for years.",
      articles: ["21", "22"]
    },
    {
      name: "Kesavananda Bharati v. State of Kerala",
      year: 1973,
      summary: "Parliament can amend the Constitution but cannot alter or destroy its basic structure.",
      articles: ["368", "32"]
    },
    {
      name: "Shreya Singhal v. Union of India",
      year: 2015,
      summary: "Struck down Section 66A of the Information Technology Act as an unreasonable restriction on free speech online.",
      articles: ["19", "14", "21"]
    },
    {
      name: "E.P. Royappa v. State of Tamil Nadu",
      year: 1974,
      summary: "Arbitrariness is the opposite of equality: an arbitrary State action violates Article 14.",
      articles: ["14", "16"]
    },
    {
      name: "Indra Sawhney v. Union of India",
      year: 1992,
      summary: "Upheld reservation for other backward classes in government jobs, subject to limits such as the general 50% ceiling.",
      articles: ["16", "15", "14"]
    },
    {
      name: "Vishaka v. State of Rajasthan",
      year: 1997,
      summary: "Issued guidelines against sexual harassment at the workplace, drawing on the rights to equality, dignity and to practise a profession.",
      articles: ["14", "15", "19", "21"]
    }
  ],

  samplePosts: [
    {
      author: "Sample post · Advocate, Nagpur",
      iso: "2026-10-23T09:10:00+05:30",
      text: "Client's phone calls were recorded by a private party and filed as evidence in a civil dispute. How have others argued against admissibility? Looking for approaches based on privacy.",
      articles: ["21", "19"]
    },
    {
      author: "Sample post · Junior advocate, Pune",
      iso: "2026-10-22T18:30:00+05:30",
      text: "A person was held at a police station for a full day before anyone told the family. What checklist do you follow when you reach the station? Sharing mine: ask for the arrest memo, note the time, check that the grounds were explained.",
      articles: ["22", "21"]
    },
    {
      author: "Sample post · Advocate, Nashik",
      iso: "2026-10-21T12:00:00+05:30",
      text: "Lesson from a service-matter case: an order that gave no reasons was set aside as arbitrary. Always check whether the order explains why.",
      articles: ["14", "16"]
    }
  ],

  sampleNotice:
    "IN THE COURT OF THE CIVIL JUDGE, PUNE\n" +
    "Civil Suit No. 482 of 2026\n" +
    "Mr. Ramesh Kulkarni vs M/s Shree Traders Pvt Ltd\n" +
    "NOTICE: The defendant is directed to file a written statement on 15/12/2026. The next hearing is on 20 January 2027. " +
    "The plaintiff, resident of Flat 12, Kothrud, Pune 411038, contact 9876543210, alleges that the recording of his phone calls " +
    "and seizure of his records violated his right to privacy under Article 21 and his freedom under Article 19(1)(a).\n" +
    "(All names and numbers in this sample are fictional.)"
};
