export type TrackId = 'exam' | 'code' | 'lang';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Adaptive';

export interface PracticeQuestion {
  id: string;
  track: TrackId;
  topic: string;
  difficulty: DifficultyLevel;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  okKeywords: string[];
  partialKeywords: string[];
  hint: string;
  steps: string;
  starterCode?: string;
}

export interface PracticeSetItem {
  id: string;
  title: string;
  track: TrackId;
  topic: string;
  dueLabel: string;
  progress: number;
  score?: number;
  colorVar: '--pk' | '--bl' | '--yl' | '--gr';
  completedCount: number;
  totalCount: number;
}

export interface StudyNoteItem {
  id: string;
  title: string;
  category: string;
  dateLabel: string;
  summary: string;
  content: string;
  motif: 'flower' | 'burst' | 'squiggle';
  bgVar: '--pk' | '--yl' | '--gr' | '--bl';
}

export interface CatalogProgram {
  id: string;
  title: string;
  subject: string;
  gradeRange: string;
  goal: string;
  lessonsCount: number;
  pricePerLesson: number;
  totalPrice: number;
  rating: number;
  reviewsCount: number;
  bgVar: '--pk' | '--bl' | '--yl' | '--gr';
  description: string;
  syllabus: string[];
}

export interface MentorProfile {
  id: string;
  name: string;
  role: string;
  subject: string;
  gradeRange: string;
  pricePerLesson: number;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  studentsCount: number;
  bio: string;
  accentColor: '--pk' | '--bl' | '--yl' | '--gr';
}

export const INITIAL_QUESTIONS: Record<TrackId, PracticeQuestion[]> = {
  exam: [
    {
      id: 'exam-1',
      track: 'exam',
      topic: 'Linear equations',
      difficulty: 'Easy',
      prompt: 'If 3x + 7 = 2x + 19, what is the value of 5x − 4? Show your algebraic reasoning or select the final value.',
      options: ['46', '52', '56', '60'],
      correctOptionIndex: 2,
      okKeywords: ['56', 'x = 12', 'x=12'],
      partialKeywords: ['12', '3x - 2x', '60'],
      hint: 'Solve for x first by subtracting 2x from both sides, then substitute x into 5x − 4.',
      steps:
        'Step 1: Group the x terms on the left side. Subtract 2x from both sides:\n3x − 2x + 7 = 19  ⇒  x + 7 = 19.\n\nStep 2: Isolate x by subtracting 7 from both sides:\nx = 19 − 7 = 12.\n\nStep 3: Substitute x = 12 into the target expression 5x − 4:\n5(12) − 4 = 60 − 4 = 56.\n\nVerification: Left side = 3(12) + 7 = 43. Right side = 2(12) + 19 = 43. Both sides match!',
    },
    {
      id: 'exam-2',
      track: 'exam',
      topic: 'Word problems',
      difficulty: 'Medium',
      prompt: 'A mobile plan costs $20 per month plus $0.05 per minute of call time. For how many minutes m does a monthly bill equal exactly $32.50?',
      options: ['180 minutes', '225 minutes', '250 minutes', '275 minutes'],
      correctOptionIndex: 2,
      okKeywords: ['250'],
      partialKeywords: ['12.5', '12.50', '0.05m'],
      hint: 'Set up the linear equation 20 + 0.05m = 32.50, then isolate m.',
      steps:
        'Step 1: Translate the billing structure into an algebraic equation:\nTotal Cost = Base Fee + (Rate × Minutes)\n20 + 0.05m = 32.50.\n\nStep 2: Subtract the $20 flat monthly fee from both sides:\n0.05m = 12.50.\n\nStep 3: Divide both sides by 0.05 (which is equivalent to multiplying by 20):\nm = 12.50 / 0.05 = 250 minutes.\n\nVerification: $20 + $0.05 × 250 = $20 + $12.50 = $32.50.',
    },
    {
      id: 'exam-3',
      track: 'exam',
      topic: 'Quadratic functions',
      difficulty: 'Hard',
      prompt: 'The parabola y = x² − 6x + k has its vertex on the line y = 4. What is the value of the constant k?',
      options: ['k = 9', 'k = 13', 'k = 15', 'k = −5'],
      correctOptionIndex: 1,
      okKeywords: ['13', 'k = 13', 'k=13'],
      partialKeywords: ['x = 3', 'x=3', '(x - 3)', 'vertex'],
      hint: 'Complete the square or use the vertex x-coordinate formula x = −b / (2a) to find where the minimum occurs.',
      steps:
        'Step 1: Find the x-coordinate of the vertex using x = −b / (2a):\nHere a = 1 and b = −6, so x = −(−6) / (2 × 1) = 3.\n\nStep 2: Since the vertex lies on the horizontal line y = 4, the vertex coordinates must be (3, 4).\n\nStep 3: Substitute x = 3 and y = 4 into the parabola equation:\n4 = (3)² − 6(3) + k\n4 = 9 − 18 + k\n4 = −9 + k  ⇒  k = 13.',
    },
    {
      id: 'exam-4',
      track: 'exam',
      topic: 'Probability & combinatorics',
      difficulty: 'Hard',
      prompt: 'A bag contains 4 red marbles and 6 blue marbles. If two marbles are drawn at random without replacement, what is the probability that both marbles are red?',
      options: ['2/15', '4/25', '1/6', '3/10'],
      correctOptionIndex: 0,
      okKeywords: ['2/15', '12/90', '0.133'],
      partialKeywords: ['4/10', '3/9', 'without replacement'],
      hint: 'Multiply the probability of drawing a red marble first (4/10) by the conditional probability of drawing a second red marble (3/9).',
      steps:
        'Step 1: Probability that the first marble is red:\nP(R₁) = 4 / 10 = 2 / 5.\n\nStep 2: After removing one red marble, 3 red marbles remain out of 9 total marbles:\nP(R₂ | R₁) = 3 / 9 = 1 / 3.\n\nStep 3: Multiply the two probabilities:\nP(R₁ and R₂) = (2 / 5) × (1 / 3) = 2 / 15.',
    },
  ],
  code: [
    {
      id: 'code-1',
      track: 'code',
      topic: 'Two pointers',
      difficulty: 'Medium',
      prompt: 'Given a 1-indexed sorted array of integers and a target sum, find the indices of two numbers that add up to target in O(n) time and O(1) auxiliary space. Explain your algorithm or write pseudocode.',
      options: [
        'Nested loops checking every pair in O(n²) time',
        'Hash map storing complements in O(n) space',
        'Two pointers starting at left = 0 and right = n - 1 moving inward',
        'Binary search for each element in O(n log n) time',
      ],
      correctOptionIndex: 2,
      okKeywords: ['two pointer', 'two-pointer', 'left', 'right', 'inward'],
      partialKeywords: ['sorted', 'sum', 'o(n)', 'o(1)'],
      hint: 'Place one pointer at the smallest element (start) and one at the largest element (end). How does their sum compare to target?',
      starterCode: `function twoSumSorted(nums: number[], target: number): [number, number] {\n  let left = 0;\n  let right = nums.length - 1;\n  // Complete your O(n) time, O(1) space logic:\n  \n}`,
      steps:
        'Step 1: Initialize two pointers at opposite ends of the sorted array: left = 0 and right = n − 1.\n\nStep 2: In a while (left < right) loop, compute currentSum = nums[left] + nums[right].\n\nStep 3: Compare currentSum with target:\n• If currentSum === target, return [left + 1, right + 1].\n• If currentSum < target, we need a larger sum, so increment left++.\n• If currentSum > target, we need a smaller sum, so decrement right--.\n\nStep 4: Complexity Analysis: Each step moves at least one pointer inward, visiting at most n elements → O(n) time and O(1) extra memory.',
    },
    {
      id: 'code-2',
      track: 'code',
      topic: 'Linked lists',
      difficulty: 'Medium',
      prompt: 'How do you detect whether a singly linked list contains a cycle using strictly O(1) extra memory? Describe the pointer speeds and why they are guaranteed to meet.',
      options: [
        'Store visited node references in a Set',
        'Floyd Tortoise & Hare: slow moves 1 step, fast moves 2 steps',
        'Reverse the linked list and compare heads',
        'Count total nodes up to 10,000 iterations',
      ],
      correctOptionIndex: 1,
      okKeywords: ['slow', 'fast', 'floyd', 'tortoise', 'hare', '2 steps'],
      partialKeywords: ['pointer', 'cycle', 'null'],
      hint: 'Use two pointers moving at different speeds (1x and 2x). What happens once both enter the cycle?',
      starterCode: `function hasCycle(head: ListNode | null): boolean {\n  let slow = head;\n  let fast = head;\n  // Write the loop condition and pointer updates:\n  \n}`,
      steps:
        'Step 1: Initialize two pointers at the head of the list: slow = head and fast = head.\n\nStep 2: Advance slow by 1 node (slow = slow.next) and fast by 2 nodes (fast = fast.next.next) while fast and fast.next are non-null.\n\nStep 3: If fast reaches null, the list terminates and has no cycle (return false).\n\nStep 4: Why they must meet: Once both pointers are inside the cycle, fast closes the distance to slow by exactly 1 link per iteration (2 − 1 = 1). Therefore, fast can never jump over slow without landing on the exact same node in O(n) time and O(1) space.',
    },
    {
      id: 'code-3',
      track: 'code',
      topic: 'Sliding window',
      difficulty: 'Hard',
      prompt: 'Given a string s, find the length of the longest substring without repeating characters in O(n) time. Explain how the window expands and contracts.',
      options: [
        'Generate all substrings and check uniqueness in O(n³)',
        'Maintain [left, right] window with a Map of last-seen character indices',
        'Sort the string characters alphabetically first',
        'Divide and conquer recursion on midpoint',
      ],
      correctOptionIndex: 1,
      okKeywords: ['window', 'left', 'right', 'map', 'set', 'last'],
      partialKeywords: ['substring', 'duplicate', 'repeat'],
      hint: 'Maintain a sliding window [left, right] and a Map or Set of characters currently inside the window.',
      starterCode: `function lengthOfLongestSubstring(s: string): number {\n  const seen = new Map<string, number>();\n  let left = 0, maxLen = 0;\n  // Expand right pointer and update left:\n  \n}`,
      steps:
        'Step 1: Maintain a sliding window [left, right] and a hash map `seen` mapping each character to its most recent index.\n\nStep 2: Iterate `right` from 0 to s.length − 1. If s[right] is in `seen` and its previous index ≥ left, jump `left` directly to `seen.get(s[right]) + 1`.\n\nStep 3: Record `seen.set(s[right], right)` and update `maxLen = Math.max(maxLen, right − left + 1)`.\n\nStep 4: Both pointers move strictly forward, giving O(n) time and O(min(n, alphabet)) space.',
    },
  ],
  lang: [
    {
      id: 'lang-1',
      track: 'lang',
      topic: 'Ongoing actions (Llevar + Gerund)',
      difficulty: 'Easy',
      prompt: 'Translate into natural Spanish: "I have been studying Spanish for two years." Explain which idiomatic verb construction expresses ongoing duration.',
      options: [
        'Yo estudio español por dos años.',
        'Llevo dos años estudiando español.',
        'Fui estudiando español dos años.',
        'Tengo dos años estudiar español.',
      ],
      correctOptionIndex: 1,
      okKeywords: ['llevo dos años', 'llevo 2 años', 'hace dos años que estudio'],
      partialKeywords: ['llevo', 'dos años', 'estudiando'],
      hint: 'Spanish uses "llevar + [time period] + gerund (-ando/-iendo)" for actions that started in the past and continue now.',
      steps:
        'Step 1: Recognize the English present perfect continuous ("have been studying"), which emphasizes duration continuing into the present.\n\nStep 2: Use the idiomatic Spanish structure: llevar (conjugated in present) + duration + gerund.\n• First-person singular of llevar → Llevo\n• Duration → dos años\n• Gerund of estudiar → estudiando\n\nStep 3: Combine into the complete sentence:\n"Llevo dos años estudiando español." (Alternative valid structure: "Hace dos años que estudio español.")',
    },
    {
      id: 'lang-2',
      track: 'lang',
      topic: 'Conditionals & Subjunctive',
      difficulty: 'Medium',
      prompt: 'Complete the hypothetical Spanish sentence and explain the mood: "Si yo ___ (tener) más tiempo libre, viajaría por todo el mundo."',
      options: ['tengo', 'tendría', 'tuviera', 'había tenido'],
      correctOptionIndex: 2,
      okKeywords: ['tuviera', 'tuviese'],
      partialKeywords: ['subjunctive', 'imperfect', 'viajaría', 'tendría'],
      hint: 'Never use the conditional tense immediately after "si" in a contrary-to-fact condition; pair the imperfect subjunctive with the conditional.',
      steps:
        'Step 1: Identify the main clause verb: "viajaría" (conditional tense: "I would travel"). This signals a hypothetical or contrary-to-fact situation in the present.\n\nStep 2: In Spanish "si" (if) clauses expressing unlikely or contrary-to-fact conditions, the "si" clause requires the Imperfect Subjunctive (never the conditional).\n\nStep 3: Derive the imperfect subjunctive of "tener":\n• 3rd person plural preterite: tuvieron\n• Drop "-ron" → tuvie-\n• Add "-ra" (or "-se") → tuviera (or tuviese).\n\nFinal Sentence: "Si yo tuviera más tiempo libre, viajaría por todo el mundo."',
    },
    {
      id: 'lang-3',
      track: 'lang',
      topic: 'Por vs. Para Mastery',
      difficulty: 'Hard',
      prompt: 'Fill in both blanks with "por" or "para" and justify each choice: "Pagué veinte dólares ___ el libro que compré ___ el cumpleaños de mi hermana."',
      options: [
        'por ... para',
        'para ... por',
        'por ... por',
        'para ... para',
      ],
      correctOptionIndex: 0,
      okKeywords: ['por el libro', 'para el cumpleaños', 'por ... para', 'por, para'],
      partialKeywords: ['exchange', 'recipient', 'por', 'para'],
      hint: 'Which preposition expresses financial exchange ("in exchange for"), and which expresses a recipient or goal/occasion?',
      steps:
        'Step 1: First blank — "Pagué veinte dólares ___ el libro".\nFinancial transactions and exchanges ("in exchange for") always take POR → "por el libro".\n\nStep 2: Second blank — "...que compré ___ el cumpleaños de mi hermana".\nIntended recipients, destinations, and future occasions/deadlines take PARA → "para el cumpleaños".\n\nStep 3: Complete sentence:\n"Pagué veinte dólares por el libro que compré para el cumpleaños de mi hermana."',
    },
  ],
};

export const PRACTICE_SETS: PracticeSetItem[] = [
  {
    id: 'set-linear',
    title: 'Linear equations & systems',
    track: 'exam',
    topic: 'Linear equations',
    dueLabel: 'Due Friday',
    progress: 75,
    score: 9.8,
    colorVar: '--pk',
    completedCount: 6,
    totalCount: 8,
  },
  {
    id: 'set-pointers',
    title: 'Two pointers & arrays',
    track: 'code',
    topic: 'Two pointers',
    dueLabel: 'Due Sunday',
    progress: 50,
    score: 9.2,
    colorVar: '--bl',
    completedCount: 4,
    totalCount: 8,
  },
  {
    id: 'set-conditionals',
    title: 'Subjunctive conditionals',
    track: 'lang',
    topic: 'Conditionals & Subjunctive',
    dueLabel: 'Due Monday',
    progress: 88,
    score: 10.0,
    colorVar: '--yl',
    completedCount: 7,
    totalCount: 8,
  },
  {
    id: 'set-word-problems',
    title: 'Rate & mixture word problems',
    track: 'exam',
    topic: 'Word problems',
    dueLabel: 'Due Tuesday',
    progress: 38,
    score: 8.6,
    colorVar: '--gr',
    completedCount: 3,
    totalCount: 8,
  },
  {
    id: 'set-sliding-window',
    title: 'Sliding window substrings',
    track: 'code',
    topic: 'Sliding window',
    dueLabel: 'Completed',
    progress: 100,
    score: 9.7,
    colorVar: '--bl',
    completedCount: 8,
    totalCount: 8,
  },
  {
    id: 'set-por-para',
    title: 'Por vs. Para idioms',
    track: 'lang',
    topic: 'Por vs. Para Mastery',
    dueLabel: 'Completed',
    progress: 100,
    score: 9.5,
    colorVar: '--pk',
    completedCount: 8,
    totalCount: 8,
  },
];

export const INITIAL_STUDY_NOTES: StudyNoteItem[] = [
  {
    id: 'note-1',
    title: 'Fast Mental Math & Factoring Lifehacks',
    category: 'Exam prep',
    dateLabel: 'Updated Oct 14',
    summary: 'Difference of squares and Vieta formulas for 10-second quadratic roots.',
    content:
      'Rule 1: For x² + bx + c = 0, the sum of roots is −b and the product is c.\nRule 2: Always check x = 1 (sum of coefficients = 0) before applying the quadratic formula.\nRule 3: Difference of squares a² − b² = (a − b)(a + b) turns 53² − 47² into (6)(100) = 600 instantly.',
    motif: 'burst',
    bgVar: '--yl',
  },
  {
    id: 'note-2',
    title: 'When to Pick Two Pointers vs. Sliding Window',
    category: 'Coding interviews',
    dateLabel: 'Updated Oct 16',
    summary: 'Decision checklist for O(n) contiguous subarrays vs. sorted pair searches.',
    content:
      '• Use Two Pointers (opposite ends) when the input is sorted and you are comparing pairs or reversing in-place.\n• Use Sliding Window (same direction) when optimizing a contiguous subarray or substring metric.\n• Use Fast/Slow Pointers when detecting cycles or finding the midpoint of a linked list.',
    motif: 'squiggle',
    bgVar: '--gr',
  },
  {
    id: 'note-3',
    title: 'WEIRDO Mnemonic for the Spanish Subjunctive',
    category: 'Languages',
    dateLabel: 'Updated Oct 18',
    summary: 'Wishes, Emotions, Impersonal expressions, Recommendations, Doubt, Ojalá.',
    content:
      'Trigger the subjunctive mood whenever Clause 1 (main subject) influences or reacts to Clause 2 (different subject) across "que":\n• Wishes: Quiero que vengas.\n• Doubt: Dudo que llueva hoy.\n• Hypothetical Si-Clauses: Si tuviera tiempo, iría contigo.',
    motif: 'flower',
    bgVar: '--pk',
  },
];

export const CATALOG_PROGRAMS: CatalogProgram[] = [
  {
    id: 'prog-sat-algebra',
    title: 'Mastering SAT & GRE Quantitative Reasoning',
    subject: 'Mathematics',
    gradeRange: 'High School & Grad',
    goal: 'Boost exam score',
    lessonsCount: 16,
    pricePerLesson: 14,
    totalPrice: 224,
    rating: 4.9,
    reviewsCount: 142,
    bgVar: '--pk',
    description:
      'We build a personalized study roadmap from your diagnostic sprint, combining adaptive AI problem sets with step-by-step algebraic proofs.',
    syllabus: [
      'Module 1: Linear Systems, Inequalities & Absolute Value Traps',
      'Module 2: Quadratic Vertex Geometry & Polynomial Remainder Theorem',
      'Module 3: Exponential Growth, Ratios & Statistical Margin of Error',
      'Module 4: Full Timed Adaptive Mock Sprints with AI Rubric Grading',
    ],
  },
  {
    id: 'prog-coding-interviews',
    title: 'Algorithmic Patterns for Staff & FAANG Interviews',
    subject: 'Computer Science',
    gradeRange: 'University & Pro',
    goal: 'Ace technical interviews',
    lessonsCount: 24,
    pricePerLesson: 18,
    totalPrice: 432,
    rating: 4.95,
    reviewsCount: 218,
    bgVar: '--bl',
    description:
      'Stop memorizing 500 random LeetCode solutions. Master the 14 underlying invariant patterns with live Big-O complexity grading.',
    syllabus: [
      'Module 1: Two Pointers, Monotonic Stacks & Sliding Window Invariants',
      'Module 2: Trees, Graph Topological Sort & Dijkstra Shortest Paths',
      'Module 3: Dynamic Programming State Transitions & Memoization',
      'Module 4: Live Mock Voice & Code Explanation Grading',
    ],
  },
  {
    id: 'prog-spanish-fluency',
    title: 'Spanish B1→C1 Subjunctive & Conversational Fluency',
    subject: 'Languages',
    gradeRange: 'Intermediate B1+',
    goal: 'Speak with confidence',
    lessonsCount: 12,
    pricePerLesson: 12,
    totalPrice: 144,
    rating: 4.8,
    reviewsCount: 98,
    bgVar: '--yl',
    description:
      'Transition from textbook phrases to natural idiomatic Spanish with instant grammar correction and subjunctive scenario drills.',
    syllabus: [
      'Module 1: Ongoing Actions (Llevar + Gerund, Acabar de, Volver a)',
      'Module 2: Present & Imperfect Subjunctive in Real Conversations',
      'Module 3: Por vs. Para & Nuanced Prepositional Connectors',
      'Module 4: Live Dialogue Roleplay & Idiomatic Storytelling',
    ],
  },
  {
    id: 'prog-olympiad-logic',
    title: 'Competitive Combinatorics & Number Theory',
    subject: 'Mathematics',
    gradeRange: 'Advanced / Olympiad',
    goal: 'Solve hard problems',
    lessonsCount: 20,
    pricePerLesson: 16,
    totalPrice: 320,
    rating: 4.9,
    reviewsCount: 76,
    bgVar: '--gr',
    description:
      'Deep mathematical intuition training for AMC, AIME, and university proof competitions with guided hint ladders.',
    syllabus: [
      'Module 1: Pigeonhole Principle, Invariants & Coloring Proofs',
      'Module 2: Modular Arithmetic, Fermat & Euler Theorems',
      'Module 3: Generating Functions & Recurrence Relations',
      'Module 4: Proof Writing & Automated Step Verification',
    ],
  },
];

export const MENTOR_PROFILES: MentorProfile[] = [
  {
    id: 'mentor-1',
    name: 'Svetlana Petrova',
    role: 'Lead Quantitative Coach + AI Curriculum Twin',
    subject: 'Mathematics',
    gradeRange: 'SAT / GRE / Olympiad',
    pricePerLesson: 15,
    rating: 4.9,
    reviewsCount: 128,
    experienceYears: 10,
    studentsCount: 340,
    bio: 'Former Olympiad medalist who designed LearnFlow’s algebraic hint ladder. Specializes in turning intimidating word problems into visual 3-step diagrams.',
    accentColor: '--pk',
  },
  {
    id: 'mentor-2',
    name: 'Alexander Konstantinov',
    role: 'Staff Systems Architect & Interview Grader',
    subject: 'Computer Science',
    gradeRange: 'L4–L6 SWE Prep',
    pricePerLesson: 22,
    rating: 4.95,
    reviewsCount: 259,
    experienceYears: 12,
    studentsCount: 510,
    bio: 'Conducted over 400 technical interviews. Trains engineers to articulate space-time trade-offs clearly before writing a single line of code.',
    accentColor: '--bl',
  },
  {
    id: 'mentor-3',
    name: 'Elena Morales',
    role: 'Cervantes Certified Linguistics Specialist',
    subject: 'Languages',
    gradeRange: 'A2 to C1 Fluency',
    pricePerLesson: 14,
    rating: 4.85,
    reviewsCount: 144,
    experienceYears: 8,
    studentsCount: 290,
    bio: 'Focuses on high-frequency conversational patterns and eliminating direct English-to-Spanish translation habits through contextual storytelling.',
    accentColor: '--yl',
  },
];
