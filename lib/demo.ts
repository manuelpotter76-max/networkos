export type Person = {
  id: string;
  name: string;
  initials: string;
  title: string;
  company: string;
  industry: string;
  relationship: "New" | "Developing" | "Strong" | "Very Strong";
  lastInteraction: string;
  metAt: string;
  needs: string[];
  offers: string[];
  notes: string[];
  introductionsReceived: number;
  referralsReceived: number;
  influencedRevenue: number;
};

export type Recommendation = {
  id: string;
  personId: string;
  score: number;
  why: string;
  help: string;
  value: string;
  connection: string;
  opener: string;
};

export const people: Person[] = [
  {
    id: "jessica",
    name: "Jessica Rodriguez",
    initials: "JR",
    title: "President",
    company: "Rodriguez Construction",
    industry: "Commercial Construction",
    relationship: "Developing",
    lastInteraction: "6 days ago",
    metAt: "Tampa Chamber Business After Hours",
    needs: ["Commercial financing", "Property management introductions"],
    offers: ["General contractor relationships", "Commercial developer connections"],
    notes: ["Opening an Orlando location", "Enjoys golf"],
    introductionsReceived: 3,
    referralsReceived: 1,
    influencedRevenue: 28000
  },
  {
    id: "robert",
    name: "Robert Chen",
    initials: "RC",
    title: "Managing Partner",
    company: "Hospitality Growth Group",
    industry: "Hospitality",
    relationship: "Strong",
    lastInteraction: "83 days ago",
    metAt: "CEO Council Dinner",
    needs: ["HR consultant", "Restaurant technology partners"],
    offers: ["Restaurant owner introductions", "Hospitality operator connections"],
    notes: ["Strong connector in multi-location restaurant groups"],
    introductionsReceived: 4,
    referralsReceived: 2,
    influencedRevenue: 62000
  },
  {
    id: "maria",
    name: "Maria Gonzalez",
    initials: "MG",
    title: "SVP, Business Banking",
    company: "First Community Bank",
    industry: "Banking",
    relationship: "Strong",
    lastInteraction: "18 days ago",
    metAt: "Business Owners Breakfast",
    needs: ["Growing businesses needing lending", "CPA partners"],
    offers: ["Commercial lending", "SBA lending", "Banking introductions"],
    notes: ["Works with several restaurant and construction groups"],
    introductionsReceived: 2,
    referralsReceived: 3,
    influencedRevenue: 41000
  },
  {
    id: "david",
    name: "David Thompson",
    initials: "DT",
    title: "Commercial Lending Director",
    company: "Bay Capital Bank",
    industry: "Banking",
    relationship: "Very Strong",
    lastInteraction: "9 days ago",
    metAt: "Tampa Chamber",
    needs: ["Qualified business owners", "Commercial real estate partners"],
    offers: ["Commercial financing", "SBA loans", "Expansion financing"],
    notes: ["Reliable introduction partner"],
    introductionsReceived: 8,
    referralsReceived: 5,
    influencedRevenue: 94000
  },
  {
    id: "anthony",
    name: "Anthony Lewis",
    initials: "AL",
    title: "Principal",
    company: "Lewis Commercial Realty",
    industry: "Commercial Real Estate",
    relationship: "New",
    lastInteraction: "Never",
    metAt: "Not yet met",
    needs: ["Property owners", "Commercial contractors"],
    offers: ["Commercial property owners", "Developers", "Tenant representatives"],
    notes: ["Six mutual business connections"],
    introductionsReceived: 0,
    referralsReceived: 0,
    influencedRevenue: 0
  },
  {
    id: "sarah",
    name: "Sarah Williams",
    initials: "SW",
    title: "Founder",
    company: "PeopleFirst HR",
    industry: "Human Resources",
    relationship: "Strong",
    lastInteraction: "42 days ago",
    metAt: "Referral partner lunch",
    needs: ["Restaurant owners", "Construction companies"],
    offers: ["HR consulting", "Hiring support", "Employee handbook services"],
    notes: ["Excellent fit for Robert's HR need"],
    introductionsReceived: 5,
    referralsReceived: 3,
    influencedRevenue: 36000
  }
];

export const eventRecommendations: Recommendation[] = [
  {
    id: "rec-jessica",
    personId: "jessica",
    score: 96,
    why: "Jessica matches your goal of meeting established construction-company owners.",
    help: "She is exploring commercial financing. You have a very strong relationship with David Thompson.",
    value: "She works with commercial developers and property owners.",
    connection: "Robert Chen already knows Jessica.",
    opener: "Ask about the Orlando expansion."
  },
  {
    id: "rec-robert",
    personId: "robert",
    score: 92,
    why: "Robert is a proven connector in restaurant and hospitality circles, one of your current target networks.",
    help: "He is looking for an HR consultant. Sarah Williams is a strong match in your network.",
    value: "People introduced through Robert have historically become strong relationships for you.",
    connection: "You have a strong existing relationship that is beginning to cool.",
    opener: "Ask how his multi-location restaurant clients are handling hiring."
  },
  {
    id: "rec-maria",
    personId: "maria",
    score: 89,
    why: "Maria is an ideal referral partner because she works with growing businesses across your target industries.",
    help: "You can introduce her to several business owners who may need commercial banking.",
    value: "She has active relationships with restaurant and construction groups.",
    connection: "You have a strong relationship but have not met one-to-one recently.",
    opener: "Ask what types of businesses she most wants to meet this quarter."
  },
  {
    id: "rec-anthony",
    personId: "anthony",
    score: 86,
    why: "Anthony works directly with commercial property owners and developers, matching one of your current networking goals.",
    help: "You know contractors and service providers who could be useful to his clients.",
    value: "His commercial real estate network could open several second-degree paths.",
    connection: "You share six business connections but have never met.",
    opener: "Mention your mutual connections and ask what property sectors he is focused on."
  }
];

export const events = [
  { id: "tampa-mixer", name: "Tampa Business After Hours", org: "Tampa Chamber", date: "Aug 27", time: "6:00 PM", attendees: 142, matches: 21, priorities: 6, status: "upcoming" },
  { id: "ceo-dinner", name: "CEO Council Dinner", org: "CEO Council", date: "Sep 12", time: "7:00 PM", attendees: 48, matches: 0, priorities: 0, status: "upcoming" },
  { id: "owners-breakfast", name: "Business Owners Breakfast", org: "Local Business Alliance", date: "Aug 11", time: "8:00 AM", attendees: 74, matches: 16, priorities: 5, status: "past" }
];
