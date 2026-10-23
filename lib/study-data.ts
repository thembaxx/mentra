import type { QuestionVisualization } from "./visualization-schema";

export type TrackId = "exam" | "code" | "lang";
export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Adaptive";

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
  /** Server-validated numeric model based on the question itself. */
  visualization?: QuestionVisualization | null;
}

export interface PracticeSetItem {
  id: string;
  title: string;
  track: TrackId;
  topic: string;
  dueLabel: string;
  progress: number;
  score?: number;
  colorVar: "--pk" | "--bl" | "--yl" | "--gr";
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
  motif: "flower" | "burst" | "squiggle";
  bgVar: "--pk" | "--yl" | "--gr" | "--bl";
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
  bgVar: "--pk" | "--bl" | "--yl" | "--gr";
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
  accentColor: "--pk" | "--bl" | "--yl" | "--gr";
}

export const INITIAL_QUESTIONS: Record<TrackId, PracticeQuestion[]> = {
  exam: [
    {
      id: "exam-1",
      track: "exam",
      visualization: { type: "quadratic", a: 1, b: -6, c: 13 },
      topic: "Quadratic & nature of roots",
      difficulty: "Medium",
      prompt:
        "Grade 12 NSC Paper 1: The parabola $f(x) = x^2 - 6x + k$ has its turning point on the horizontal line $y = 4$. Determine the value of the constant $k$ and state the nature of the roots of $f(x) = 0$.",
      options: [
        "$k = 9$ (equal real roots)",
        "$k = 13$ (non-real roots, $\\Delta < 0$)",
        "$k = 15$ (rational roots)",
        "$k = -5$ (two distinct real roots)",
      ],
      correctOptionIndex: 1,
      okKeywords: ["13", "k = 13", "k=13", "non-real"],
      partialKeywords: ["x = 3", "x=3", "(x - 3)", "turning point", "-b/2a"],
      hint: "Find the turning point axis of symmetry using $x = -\\frac{b}{2a}$, substitute $(3, 4)$ into $f(x)$, and check $\\Delta = b^2 - 4ac$.",
      steps:
        "Step 1: Find the $x$-coordinate of the turning point using $x = -\\frac{b}{2a}$:\nHere $a = 1$ and $b = -6$, so $$x = -\\frac{-6}{2(1)} = 3$$\n\nStep 2: Since the turning point lies on the line $y = 4$, the minimum turning point is $(3, 4)$. Substitute $x = 3$ and $y = 4$ into $f(x) = x^2 - 6x + k$:\n$$4 = (3)^2 - 6(3) + k \\implies 4 = 9 - 18 + k \\implies k = 13$$\n\nStep 3: Check the discriminant $\\Delta = b^2 - 4ac$ for $x^2 - 6x + 13 = 0$:\n$$\\Delta = (-6)^2 - 4(1)(13) = 36 - 52 = -16 < 0$$\n\nVerification: Because $\\Delta < 0$ and the minimum value is $y = 4 > 0$, the parabola never intersects the $x$-axis, so $k = 13$ gives non-real roots.",
    },
    {
      id: "exam-2",
      track: "exam",
      topic: "Financial maths (Annuities)",
      difficulty: "Medium",
      prompt:
        "Grade 12 NSC Paper 1: Thabo sets up a sinking fund to save $\\text{R}180\\,000$ for a solar inverter system in Johannesburg. If the account earns $12\\%$ p.a. compounded monthly ($i = 0.01$ per month) over $n = 36$ months, which formula gives his required monthly deposit $x$?",
      options: [
        "$x = \\frac{180\\,000 \\times 0.01}{(1 + 0.01)^{36} - 1} \\approx \\text{R}4\\,178.57$",
        "$x = \\frac{180\\,000 \\times 0.01}{1 - (1 + 0.01)^{-36}} \\approx \\text{R}5\\,978.57$",
        "$x = \\frac{180\\,000}{36 \\times 1.01} \\approx \\text{R}4\\,950.50$",
        "$x = 180\\,000(1 + 0.01)^{-36} \\approx \\text{R}125\\,806.45$",
      ],
      correctOptionIndex: 0,
      okKeywords: ["4178", "4 178", "future value", "(1 + 0.01)^36 - 1", "1.01^36"],
      partialKeywords: ["0.01", "36", "annuity", "sinking fund"],
      hint: "Use the NSC Future Value Annuity formula $F = \\frac{x[(1 + i)^n - 1]}{i}$ with $F = 180\\,000$, $i = \\frac{0.12}{12} = 0.01$, and $n = 36$.",
      steps:
        "Step 1: Identify the NSC Future Value Annuity formula from the Grade 12 formula sheet:\n$$F = \\frac{x\\left[(1 + i)^n - 1\\right]}{i}$$\n\nStep 2: Substitute $F = 180\\,000$, monthly interest rate $i = \\frac{0.12}{12} = 0.01$, and $n = 36$ monthly payments:\n$$180\\,000 = \\frac{x\\left[(1 + 0.01)^{36} - 1\\right]}{0.01}$$\n\nStep 3: Make $x$ the subject of the formula:\n$$x = \\frac{180\\,000 \\times 0.01}{(1.01)^{36} - 1} = \\frac{1\\,800}{0.43076878} \\approx \\text{R}4\\,178.57\\text{ per month}$$\n\nVerification: Over $36$ months, Thabo contributes $36 \\times \\text{R}4\\,178.57 = \\text{R}150\\,428.52$ in capital and earns $\\text{R}29\\,571.48$ in compound interest.",
    },
    {
      id: "exam-3",
      track: "exam",
      topic: "Calculus & cubic graphs",
      difficulty: "Hard",
      prompt:
        "Grade 12 NSC Paper 1: Given the cubic function $f(x) = -x^3 + 6x^2 - 9x + 4$, determine the $x$-coordinates of the stationary (turning) points where $f'(x) = 0$ and the $x$-coordinate of the point of inflection.",
      options: [
        "Turning points at $x = 1$ and $x = 3$; inflection at $x = 2$",
        "Turning points at $x = -1$ and $x = 3$; inflection at $x = 1$",
        "Turning points at $x = 0$ and $x = 4$; inflection at $x = 2$",
        "Turning points at $x = 1$ and $x = 4$; inflection at $x = 2.5$",
      ],
      correctOptionIndex: 0,
      okKeywords: ["x = 1", "x = 3", "x=1", "x=3", "inflection at x = 2", "x = 2"],
      partialKeywords: ["-3x^2 + 12x - 9", "derivative", "f'(x) = 0"],
      hint: "Differentiate $f(x)$ using power rules to get $f'(x) = -3x^2 + 12x - 9 = 0$, then solve for $x$. For inflection, solve $f''(x) = 0$.",
      steps:
        "Step 1: Differentiate $f(x) = -x^3 + 6x^2 - 9x + 4$ with respect to $x$:\n$$f'(x) = -3x^2 + 12x - 9$$\n\nStep 2: Set $f'(x) = 0$ to find the stationary points and divide through by $-3$:\n$$-3(x^2 - 4x + 3) = 0 \\implies (x - 1)(x - 3) = 0$$\nTherefore, the stationary points occur at $x = 1$ and $x = 3$.\n\nStep 3: Find the second derivative $f''(x)$ and set $f''(x) = 0$ for the point of inflection:\n$$f''(x) = -6x + 12 = 0 \\implies x = 2$$\n\nVerification: Notice that $x = 2$ is also the midpoint $\\frac{1 + 3}{2} = 2$ between the two stationary points of a cubic parabola!",
    },
    {
      id: "exam-4",
      track: "exam",
      visualization: {
        type: "doppler",
        speedOfSound: 340,
        sourceSpeed: 30,
        emittedFrequency: 850,
        direction: "toward",
      },
      topic: "Physical Sciences (Mechanics & Doppler)",
      difficulty: "Hard",
      prompt:
        "Grade 12 NSC Physical Sciences Paper 1: An emergency ambulance in Pretoria approaches a stationary listener at $v_S = 30\\text{ m}\\cdot\\text{s}^{-1}$ while emitting a siren of frequency $f_S = 850\\text{ Hz}$. Take the speed of sound in air as $v = 340\\text{ m}\\cdot\\text{s}^{-1}$. Calculate the frequency $f_L$ heard by the stationary listener.",
      options: [
        "$f_L = 932.26\\text{ Hz}$",
        "$f_L = 781.08\\text{ Hz}$",
        "$f_L = 850.00\\text{ Hz}$",
        "$f_L = 918.50\\text{ Hz}$",
      ],
      correctOptionIndex: 0,
      okKeywords: ["932.26", "932.3", "340 / 310", "340/310"],
      partialKeywords: ["doppler", "340 - 30", "310", "f_l"],
      hint: "Use the NSC Doppler equation $f_L = \\frac{v \\pm v_L}{v \\pm v_S} f_S$. Since the source moves TOWARDS a stationary listener ($v_L = 0$), use the minus sign in the denominator ($v - v_S$).",
      steps:
        "Step 1: Write down the official NSC Doppler Effect formula from the Physical Sciences data sheet:\n$$f_L = \\frac{v \\pm v_L}{v \\pm v_S} f_S$$\n\nStep 2: The listener is stationary ($v_L = 0$) and the ambulance approaches the listener, compressing wavefronts so the observed frequency increases (subtract $v_S$ in the denominator):\n$$f_L = \\left(\\frac{v}{v - v_S}\\right) f_S$$\n\nStep 3: Substitute $v = 340\\text{ m}\\cdot\\text{s}^{-1}$, $v_S = 30\\text{ m}\\cdot\\text{s}^{-1}$, and $f_S = 850\\text{ Hz}$:\n$$f_L = \\left(\\frac{340}{340 - 30}\\right) \\times 850 = \\frac{340}{310} \\times 850 \\approx 932.26\\text{ Hz}$$\n\nVerification: Since $932.26\\text{ Hz} > 850\\text{ Hz}$, the pitch is higher as the ambulance approaches, matching physical intuition.",
    },
    {
      id: "exam-5",
      track: "exam",
      topic: "Geometry & Pythagoras",
      difficulty: "Medium",
      visualization: { type: "right_triangle", legA: 6, legB: 8, unit: "cm" },
      prompt:
        "A right-angled triangle with legs a = 6 cm and b = 8 cm is drawn. Calculate its hypotenuse and area.",
      options: [
        "Hypotenuse 10 cm; area 24 cm²",
        "Hypotenuse 14 cm; area 48 cm²",
        "Hypotenuse 7 cm; area 24 cm²",
        "Hypotenuse 10 cm; area 48 cm²",
      ],
      correctOptionIndex: 0,
      okKeywords: ["Hypotenuse 10 cm; area 24 cm²"],
      partialKeywords: ["geometry"],
      hint: "Use c² = a² + b² and A = ab/2.",
      steps:
        "Step 1: Identify known quantities and the relevant relationship.\n\nStep 2: c = √(6² + 8²) = 10 cm; area = 6 × 8 / 2 = 24 cm².\n\nStep 3: Check the result against the diagram.",
    },
    {
      id: "exam-6",
      track: "exam",
      topic: "Physical Sciences — Newton's Second Law",
      difficulty: "Medium",
      visualization: { type: "forces", mass: 5, appliedForce: 30, frictionForce: 10 },
      prompt:
        "An object in horizontal motion has mass = 5 kg, applied force = 30 N to the right, and opposing friction = 10 N to the left. Calculate the acceleration.",
      options: [
        "4 m/s² to the right",
        "8 m/s² to the right",
        "4 m/s² to the left",
        "6 m/s² to the right",
      ],
      correctOptionIndex: 0,
      okKeywords: ["4 m/s² to the right"],
      partialKeywords: ["physical"],
      hint: "Subtract opposing friction before dividing by mass.",
      steps:
        "Step 1: Identify known quantities and the relevant relationship.\n\nStep 2: The horizontal resultant force is 30 − 10 = 20 N to the right. Acceleration = F/m = 20/5 = 4 m/s².\n\nStep 3: Check the result against the diagram.",
    },
    {
      id: "exam-7",
      track: "exam",
      topic: "Mathematics — Binomial Probability",
      difficulty: "Medium",
      visualization: { type: "binomial", trials: 10, probability: 0.3 },
      prompt:
        "Let X ~ Bin(10, 0.3) represent the number of successes in 10 independent trials. Calculate P(X = 3), rounded to four decimal places.",
      options: ["0.2668", "0.3000", "0.1029", "0.2335"],
      correctOptionIndex: 0,
      okKeywords: ["0.2668"],
      partialKeywords: ["mathematics"],
      hint: "Use the binomial formula C(n,k)p^k(1−p)^(n−k).",
      steps:
        "Step 1: Identify known quantities and the relevant relationship.\n\nStep 2: C(10,3) = 120. Therefore P(X=3) = 120 × 0.3³ × 0.7⁷ ≈ 0.2668.\n\nStep 3: Check the result against the diagram.",
    },
    {
      id: "exam-8",
      track: "exam",
      topic: "Physical Sciences — Molecular Geometry",
      difficulty: "Medium",
      visualization: { type: "molecule", formula: "H2O" },
      prompt:
        "Consider the water molecule H2O. What is its molecular shape and approximate H–O–H bond angle?",
      options: [
        "Bent (V-shaped); approximately 104.5°",
        "Linear; 180°",
        "Trigonal planar; 120°",
        "Tetrahedral; 109.5°",
      ],
      correctOptionIndex: 0,
      okKeywords: ["Bent (V-shaped); approximately 104.5°"],
      partialKeywords: ["physical"],
      hint: "Oxygen has two bonding pairs and two lone pairs.",
      steps:
        "Step 1: Identify known quantities and the relevant relationship.\n\nStep 2: The central oxygen has two O–H bonds and two lone pairs. The molecular geometry is bent, with an angle of approximately 104.5°.\n\nStep 3: Check the result against the diagram.",
    },
  ],
  code: [
    {
      id: "code-1",
      track: "code",
      topic: "Two pointers",
      difficulty: "Medium",
      prompt:
        "Given a 1-indexed sorted array of transaction amounts in ZAR and a target sum, find the indices of two transactions that add up to target in $\\mathcal{O}(n)$ time and $\\mathcal{O}(1)$ auxiliary space. Explain your algorithm or write pseudocode.",
      options: [
        "Nested loops checking every pair in $\\mathcal{O}(n^2)$ time",
        "Hash map storing complements in $\\mathcal{O}(n)$ extra space",
        "Two pointers starting at $L = 0$ and $R = n - 1$ moving inward in $\\mathcal{O}(n)$ time",
        "Binary search for each element in $\\mathcal{O}(n \\log n)$ time",
      ],
      correctOptionIndex: 2,
      okKeywords: ["two pointer", "two-pointer", "left", "right", "inward"],
      partialKeywords: ["sorted", "sum", "o(n)", "o(1)"],
      hint: "Place one pointer at the smallest element ($L = 0$) and one at the largest element ($R = n - 1$). How does their sum $A[L] + A[R]$ compare to target?",
      starterCode: `function twoSumSortedZAR(amounts: number[], target: number): [number, number] {\n  let left = 0;\n  let right = amounts.length - 1;\n  // Complete your O(n) time, O(1) space logic:\n  \n}`,
      steps:
        "Step 1: Initialize two pointers at opposite ends of the sorted array: $L = 0$ and $R = n - 1$.\n\nStep 2: In a `while (L < R)` loop, compute $\\text{sum} = A[L] + A[R]$.\n\nStep 3: Compare $\\text{sum}$ with $\\text{target}$:\n• If $\\text{sum} = \\text{target}$, return $[L + 1, R + 1]$.\n• If $\\text{sum} < \\text{target}$, we need a larger value, so increment $L \\leftarrow L + 1$.\n• If $\\text{sum} > \\text{target}$, we need a smaller value, so decrement $R \\leftarrow R - 1$.\n\nStep 4: Complexity Analysis: Each step moves at least one pointer inward, visiting at most $n$ elements $\\implies \\mathcal{O}(n)$ time and $\\mathcal{O}(1)$ auxiliary memory.",
    },
    {
      id: "code-2",
      track: "code",
      topic: "Linked lists",
      difficulty: "Medium",
      prompt:
        "How do you detect whether a singly linked list contains a cycle using strictly $\\mathcal{O}(1)$ extra memory? Describe the pointer speeds and why they are guaranteed to meet.",
      options: [
        "Store visited node references in a Set in $\\mathcal{O}(n)$ space",
        "Floyd Tortoise & Hare: slow moves $1$ step, fast moves $2$ steps ($\\Delta v = 1$)",
        "Reverse the linked list and compare heads",
        "Count total nodes up to $10\\,000$ iterations",
      ],
      correctOptionIndex: 1,
      okKeywords: ["slow", "fast", "floyd", "tortoise", "hare", "2 steps"],
      partialKeywords: ["pointer", "cycle", "null"],
      hint: "Use two pointers moving at different speeds ($1\\times$ and $2\\times$). What is the relative closing speed once both enter a cycle of length $C$?",
      starterCode: `function hasCycle(head: ListNode | null): boolean {\n  let slow = head;\n  let fast = head;\n  // Write the loop condition and pointer updates:\n  \n}`,
      steps:
        "Step 1: Initialize two pointers at the head of the list: `slow = head` and `fast = head`.\n\nStep 2: Advance `slow` by $1$ node (`slow = slow.next`) and `fast` by $2$ nodes (`fast = fast.next.next`) while `fast` and `fast.next` are non-null.\n\nStep 3: If `fast` reaches `null`, the list terminates and has no cycle (return `false`).\n\nStep 4: Mathematical Proof: Once both pointers are inside a cycle of length $C$, the relative speed is $v_{\\text{rel}} = 2 - 1 = 1$ link per step. Thus `fast` closes the gap $d \\pmod C$ by $1$ node per iteration and must land on `slow` in $\\mathcal{O}(n)$ time and $\\mathcal{O}(1)$ space.",
    },
    {
      id: "code-3",
      track: "code",
      topic: "Sliding window",
      difficulty: "Hard",
      prompt:
        "Given a string $s$, find the length of the longest substring without repeating characters in $\\mathcal{O}(n)$ time. Explain how the window $[L, R]$ expands and contracts.",
      options: [
        "Generate all substrings and check uniqueness in $\\mathcal{O}(n^3)$",
        "Maintain $[L, R]$ window with a Map of last-seen character indices in $\\mathcal{O}(n)$ time",
        "Sort the string characters alphabetically in $\\mathcal{O}(n \\log n)$",
        "Divide and conquer recursion on midpoint",
      ],
      correctOptionIndex: 1,
      okKeywords: ["window", "left", "right", "map", "set", "last"],
      partialKeywords: ["substring", "duplicate", "repeat"],
      hint: "Maintain a sliding window $[L, R]$ of length $R - L + 1$ and a Map of characters currently inside the window.",
      starterCode: `function lengthOfLongestSubstring(s: string): number {\n  const seen = new Map<string, number>();\n  let left = 0, maxLen = 0;\n  // Expand right pointer and update left:\n  \n}`,
      steps:
        "Step 1: Maintain a sliding window $[L, R]$ and a hash map `seen` mapping each character to its most recent index.\n\nStep 2: Iterate $R$ from $0$ to $n - 1$. If $s[R]$ is in `seen` and its previous index $idx \\ge L$, jump $L$ directly to $\\max(L, idx + 1)$.\n\nStep 3: Record `seen.set(s[R], R)` and update $\\text{maxLen} = \\max(\\text{maxLen}, R - L + 1)$.\n\nStep 4: Both pointers move strictly forward across $n$ indices, giving $\\mathcal{O}(n)$ time and $\\mathcal{O}(\\min(n, |\\Sigma|))$ space.",
    },
  ],
  lang: [
    {
      id: "lang-1",
      track: "lang",
      topic: "isiZulu Noun Classes (Amabizo)",
      difficulty: "Easy",
      prompt:
        'SA Languages (isiZulu FAL/HL): Transform the singular sentence "Umfundi uyafunda" (The learner is studying — Class 1 umu-/um-) into the plural (Class 2 aba-) and explain the subject concord change.',
      options: [
        "Imifundi iyafunda.",
        "Abafundi bayafunda.",
        "Amakholwa ayafunda.",
        "Izifundi ziyafunda.",
      ],
      correctOptionIndex: 1,
      okKeywords: ["abafundi bayafunda", "abafundi", "baya", "ba-"],
      partialKeywords: ["plural", "aba-", "concord", "isivumelwano"],
      hint: 'Class 1 personal nouns starting with "um-" take the plural prefix "aba-" in Class 2, and the subject concord changes from "u-" (uya-) to "ba-" (baya-).',
      steps:
        'Step 1: Identify the noun class of "umfundi" (learner/student). It belongs to Class 1 (umu-/um-), which designates people in the singular.\n\nStep 2: Form the Class 2 plural by replacing the singular prefix "um-" with "aba-":\n• umfundi → abafundi (learners/students).\n\nStep 3: Match the verb’s subject concord (isivumelwano senhloko) to Class 2:\n• Class 1 present long form: u- + -ya- + funda → uyafunda\n• Class 2 present long form: ba- + -ya- + funda → bayafunda.\n\nFinal Sentence: "Abafundi bayafunda." (The learners are studying.)',
    },
    {
      id: "lang-2",
      track: "lang",
      topic: "Afrikaans Tye & STOMPI",
      difficulty: "Medium",
      prompt:
        'SA Languages (Afrikaans FAL Paper 1): Rewrite the present-tense sentence in the Verledetyd (Past Tense) using the STOMPI word-order rule: "Sipho skryf vandag sy Wiskunde-eksamen in die saal."',
      options: [
        "Sipho skryf gister sy Wiskunde-eksamen in die saal geskryf.",
        "Sipho het vandag sy Wiskunde-eksamen in die saal geskryf.",
        "Sipho het geskryf vandag sy Wiskunde-eksamen in die saal.",
        "Vandag Sipho het sy Wiskunde-eksamen in die saal geskryf.",
      ],
      correctOptionIndex: 1,
      okKeywords: ["het vandag sy wiskunde-eksamen in die saal geskryf", "het", "geskryf"],
      partialKeywords: ["stompi", "verledetyd", "ge-"],
      hint: 'In Afrikaans Verledetyd, place the helping verb "het" in the Verb 1 position (after Subject) and move the main verb with prefix "ge-" (geskryf) to the very end of the sentence (Verb 2).',
      steps:
        'Step 1: Recall the Afrikaans STOMPI rule:\nSubject · Verb 1 · Time (vandag) · Object (sy Wiskunde-eksamen) · Manner · Place (in die saal) · Verb 2 / Infinitive.\n\nStep 2: To convert to Verledetyd (past tense), insert the auxiliary verb "het" in the Verb 1 slot immediately after the subject "Sipho".\n\nStep 3: Add the past participle prefix "ge-" to the main verb "skryf" → "geskryf" and move it to the final Verb 2 slot at the end of the clause:\n"Sipho het vandag sy Wiskunde-eksamen in die saal geskryf."',
    },
    {
      id: "lang-3",
      track: "lang",
      topic: "isiZulu Past & Future Tenses",
      difficulty: "Hard",
      prompt:
        'SA Languages (isiZulu Grammar): How do you express the definite future tense "We will write the examination tomorrow" in natural isiZulu using the "-zo-" future infix?',
      options: [
        "Sibhala ukuhlolwa kusasa.",
        "Sizobhala ukuhlolwa kusasa.",
        "Sabhala ukuhlolwa izolo.",
        "Singabhala ukuhlolwa kusasa.",
      ],
      correctOptionIndex: 1,
      okKeywords: ["sizobhala", "ukuhlolwa kusasa", "-zo-"],
      partialKeywords: ["si-", "bhala", "kusasa", "future"],
      hint: 'Combine the 1st person plural subject concord "si-" (we) + immediate future marker "-zo-" + verb stem "-bhala" (write).',
      steps:
        'Step 1: Identify the components of the isiZulu future tense (Inkathi ezayo):\n[Subject Concord] + [-zo- (definite/near future)] + [Verb Stem].\n\nStep 2: Assemble the verb "we will write":\n• "We" (thina) subject concord → si-\n• Future tense infix → -zo-\n• Verb root "write" → -bhala\n• Combined verb → Sizobhala.\n\nStep 3: Add the object "ukuhlolwa" (the examination) and time adverb "kusasa" (tomorrow):\n"Sizobhala ukuhlolwa kusasa."',
    },
  ],
};

export const PRACTICE_SETS: PracticeSetItem[] = [
  {
    id: "set-linear",
    title: "NSC Paper 1: Quadratics & Δ Roots",
    track: "exam",
    topic: "Quadratic & nature of roots",
    dueLabel: "Due Friday",
    progress: 75,
    score: 9.8,
    colorVar: "--pk",
    completedCount: 6,
    totalCount: 8,
  },
  {
    id: "set-pointers",
    title: "Two Pointers & O(n) Array Scans",
    track: "code",
    topic: "Two pointers",
    dueLabel: "Due Sunday",
    progress: 50,
    score: 9.2,
    colorVar: "--bl",
    completedCount: 4,
    totalCount: 8,
  },
  {
    id: "set-conditionals",
    title: "isiZulu Amabizo & Subject Concords",
    track: "lang",
    topic: "isiZulu Noun Classes (Amabizo)",
    dueLabel: "Due Monday",
    progress: 88,
    score: 10.0,
    colorVar: "--yl",
    completedCount: 7,
    totalCount: 8,
  },
  {
    id: "set-word-problems",
    title: "Financial Maths: ZAR Annuities & Loans",
    track: "exam",
    topic: "Financial maths (Annuities)",
    dueLabel: "Due Tuesday",
    progress: 38,
    score: 8.6,
    colorVar: "--gr",
    completedCount: 3,
    totalCount: 8,
  },
  {
    id: "set-sliding-window",
    title: "Sliding Window Substrings",
    track: "code",
    topic: "Sliding window",
    dueLabel: "Completed",
    progress: 100,
    score: 9.7,
    colorVar: "--bl",
    completedCount: 8,
    totalCount: 8,
  },
  {
    id: "set-por-para",
    title: "Afrikaans FAL: STOMPI & Tye",
    track: "lang",
    topic: "Afrikaans Tye & STOMPI",
    dueLabel: "Completed",
    progress: 100,
    score: 9.5,
    colorVar: "--pk",
    completedCount: 8,
    totalCount: 8,
  },
];

export const INITIAL_STUDY_NOTES: StudyNoteItem[] = [
  {
    id: "note-1",
    title: "NSC Maths Paper 1: Nature of Roots & Calculus Checklist",
    category: "NSC / IEB STEM",
    dateLabel: "Updated Oct 14",
    summary: "Discriminant $\\Delta = b^2 - 4ac$ rules and cubic stationary/inflection shortcuts.",
    content:
      "Rule 1: For $ax^2 + bx + c = 0$, compute $\\Delta = b^2 - 4ac$. If $\\Delta \\ge 0$ roots are real; if $\\Delta$ is a perfect square, roots are rational.\nRule 2: For a cubic $f(x) = ax^3 + bx^2 + cx + d$, stationary points satisfy $f'(x) = 3ax^2 + 2bx + c = 0$.\nRule 3: The $x$-coordinate of the point of inflection is $x = -\\frac{b}{3a}$, which is always halfway between the two turning points!",
    motif: "burst",
    bgVar: "--yl",
  },
  {
    id: "note-2",
    title: "When to Pick Two Pointers vs. Sliding Window",
    category: "Coding & IT",
    dateLabel: "Updated Oct 16",
    summary:
      "Decision checklist for $\\mathcal{O}(n)$ contiguous subarrays vs. sorted pair searches.",
    content:
      "• Use Two Pointers (opposite ends $L=0, R=n-1$) when the input is sorted and you are comparing pairs in $\\mathcal{O}(n)$ time and $\\mathcal{O}(1)$ space.\n• Use Sliding Window (same direction) when optimizing a contiguous subarray or substring metric.\n• Use Fast/Slow Pointers ($1\\times$ and $2\\times$) when detecting cycles or finding the midpoint of a linked list.",
    motif: "squiggle",
    bgVar: "--gr",
  },
  {
    id: "note-3",
    title: "Afrikaans STOMPI & isiZulu Prefix Harmony",
    category: "SA Languages",
    dateLabel: "Updated Oct 18",
    summary: "Quick Paper 1 grammar rules for Afrikaans FAL and isiZulu FAL/HL.",
    content:
      '• Afrikaans STOMPI: Subject · Verb 1 · Time · Object · Manner · Place · Verb 2 (Infinitive).\n• Verledetyd: Insert "het" at Verb 1 and move "ge-" + verb to the end (except prefixes be-, ge-, her-, er-, ont-, ver- which never take ge-).\n• isiZulu Concords: Umfundi (Class 1) → uya-; Abafundi (Class 2) → baya-; Izincwadi (Class 10) → ziya-.',
    motif: "flower",
    bgVar: "--pk",
  },
];

export const CATALOG_PROGRAMS: CatalogProgram[] = [
  {
    id: "prog-sat-algebra",
    title: "NSC & IEB Grade 12 Mathematics & Physical Sciences Distinction",
    subject: "Mathematics",
    gradeRange: "Grade 10–12 (CAPS & IEB)",
    goal: "Level 7 Distinction (80%+)",
    lessonsCount: 16,
    pricePerLesson: 220,
    totalPrice: 3520,
    rating: 4.95,
    reviewsCount: 312,
    bgVar: "--pk",
    description:
      "Built for South African Matriculants targeting a Level 7 Distinction in DBE NSC or IEB Paper 1 & Paper 2, plus NBT MAT/AQL university entrance for UCT, Wits, UP, and Stellenbosch.",
    syllabus: [
      "Module 1: Paper 1 Algebra, Surds, $\\Delta = b^2 - 4ac$ & Financial Annuities (ZAR)",
      "Module 2: Differential Calculus First Principles & Cubic Graph Sketching",
      "Module 3: Paper 2 Analytical Geometry, Circle Tangents & Euclidean Riders",
      "Module 4: Physical Sciences Doppler Effect, Work-Energy & Past Exam Sprints",
    ],
  },
  {
    id: "prog-coding-interviews",
    title: "SA Graduate SWE & CAPS IT Algorithmic Mastery",
    subject: "Computer Science",
    gradeRange: "Grade 12 IT & BSc CS / SWE",
    goal: "Ace OfferZen & Grad Tech Interviews",
    lessonsCount: 24,
    pricePerLesson: 260,
    totalPrice: 6240,
    rating: 4.95,
    reviewsCount: 218,
    bgVar: "--bl",
    description:
      "Master the 14 core algorithmic patterns tested by top South African engineering teams (Takealot, Luno, BBD, Entelect, Discovery) and university CS honours programs with live $\\mathcal{O}(n)$ grading.",
    syllabus: [
      "Module 1: Two Pointers, Monotonic Stacks & Sliding Window Invariants",
      "Module 2: Trees, Graph Topological Sort & Dijkstra Shortest Paths",
      "Module 3: Dynamic Programming State Transitions & Memoization",
      "Module 4: Live Mock Voice & Code Explanation Grading",
    ],
  },
  {
    id: "prog-spanish-fluency",
    title: "isiZulu & Afrikaans FAL/HL Matric Paper 1 Mastery",
    subject: "Languages",
    gradeRange: "Grade 8–12 & Conversational",
    goal: "Boost FAL/HL Exam Marks",
    lessonsCount: 12,
    pricePerLesson: 190,
    totalPrice: 2280,
    rating: 4.88,
    reviewsCount: 164,
    bgVar: "--yl",
    description:
      "Conquer isiZulu noun classes (Amabizo & Izivumelwano) and Afrikaans Taalstrukture (STOMPI, Lydende & Bedrywende Vorm, Direkte & Indirekte Rede) with instant AI marking.",
    syllabus: [
      "Module 1: isiZulu Noun Classes 1–15 & Subject/Object Concords",
      "Module 2: Afrikaans STOMPI Word Order, Verledetyd & Voegwoorde",
      "Module 3: Negative Forms (Ontkenning / Ukuphika) & Tense Transformations",
      "Module 4: Paper 1 Comprehension, Summary & Oral Roleplay Drills",
    ],
  },
  {
    id: "prog-olympiad-logic",
    title: "SAMO (SA Mathematics Olympiad) & NBT Quantitative Prep",
    subject: "Mathematics",
    gradeRange: "Grade 11–12 & NBT MAT",
    goal: "Top 10% NBT & Olympiad Round 3",
    lessonsCount: 20,
    pricePerLesson: 240,
    totalPrice: 4800,
    rating: 4.92,
    reviewsCount: 94,
    bgVar: "--gr",
    description:
      "High-intensity problem solving for the South African Mathematics Olympiad (SAMO), UCT Mathematics Competition, and National Benchmark Tests (NBT MAT & AQL).",
    syllabus: [
      "Module 1: Number Theory, Modular Arithmetic & Diophantine Equations",
      "Module 2: Non-Calculator NBT Functions, Logarithms & Trig Transformations",
      "Module 3: Combinatorics, Probability & Geometric Invariants",
      "Module 4: Full Timed NBT MAT & SAMO Proof Sprints",
    ],
  },
];

export const MENTOR_PROFILES: MentorProfile[] = [
  {
    id: "mentor-1",
    name: "Dr. Naledi Khumalo",
    role: "NSC / IEB STEM Lead & NBT Specialist (Wits PhD)",
    subject: "Mathematics",
    gradeRange: "Grade 10–12 CAPS / IEB / NBT",
    pricePerLesson: 250,
    rating: 4.95,
    reviewsCount: 184,
    experienceYears: 11,
    studentsCount: 460,
    bio: "Former NSC national marker and Wits Mathematics lecturer. Designed the KaTeX step-by-step hint ladder for Paper 1 Calculus, Financial Maths, and Physical Sciences.",
    accentColor: "--pk",
  },
  {
    id: "mentor-2",
    name: "Sipho Ndlovu",
    role: "Principal Systems Architect & SA Tech Interview Grader",
    subject: "Computer Science",
    gradeRange: "CAPS IT · UCT/Wits CS · SWE",
    pricePerLesson: 320,
    rating: 4.96,
    reviewsCount: 259,
    experienceYears: 12,
    studentsCount: 510,
    bio: "Conducted over 400 technical interviews across Cape Town and Johannesburg fintech teams. Trains learners and grads to articulate Big-O trade-offs clearly.",
    accentColor: "--bl",
  },
  {
    id: "mentor-3",
    name: "Annelize van der Merwe",
    role: "Afrikaans FAL & Multilingual Curriculum Specialist",
    subject: "Languages",
    gradeRange: "Grade 8–12 FAL & HL",
    pricePerLesson: 210,
    rating: 4.9,
    reviewsCount: 148,
    experienceYears: 9,
    studentsCount: 330,
    bio: "Stellenbosch & UKZN linguistics graduate specializing in high-yield Paper 1 grammar patterns across Afrikaans (STOMPI) and isiZulu (Amabizo & Concords).",
    accentColor: "--yl",
  },
];

export interface FlashcardItem {
  id: string;
  track: TrackId;
  topic: string;
  difficulty: DifficultyLevel;
  frontTitle: string;
  frontPrompt: string;
  backDefinition: string;
  codeOrFormulaSnippet: string;
  snippetLabel: string;
  memoryTip: string;
  colorVar: "--pk" | "--yl" | "--gr" | "--bl";
}

export const INITIAL_FLASHCARDS: Record<TrackId, FlashcardItem[]> = {
  exam: [
    {
      id: "fc-exam-1",
      track: "exam",
      topic: "Quadratic & nature of roots",
      difficulty: "Medium",
      frontTitle: "Discriminant & Nature of Roots (NSC Paper 1)",
      frontPrompt:
        "How does the discriminant $\\Delta = b^2 - 4ac$ determine the nature of roots for $ax^2 + bx + c = 0$?",
      backDefinition:
        "The discriminant $\\Delta$ under the square root in $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ determines whether roots are real, equal, rational, or non-real.",
      codeOrFormulaSnippet: `$$x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}, \\quad \\Delta = b^2 - 4ac$$

• $\\Delta > 0$ (perfect square) $\\implies$ Real, rational & unequal
• $\\Delta > 0$ (not square) $\\implies$ Real, irrational & unequal
• $\\Delta = 0 \\implies$ Real, rational & equal (turning point on $x$-axis)
• $\\Delta < 0 \\implies$ Non-real roots (no $x$-intercepts)`,
      snippetLabel: "NSC Paper 1 · KaTeX Quadratic Invariants",
      memoryTip:
        "Think of $\\Delta = 0$ as the exact moment the parabola touches the $x$-axis at a single tangent turning point.",
      colorVar: "--pk",
    },
    {
      id: "fc-exam-2",
      track: "exam",
      topic: "Financial maths (Annuities)",
      difficulty: "Hard",
      frontTitle: "Future vs. Present Value Annuities (ZAR)",
      frontPrompt:
        "When solving NSC Paper 1 Financial Maths, when do you choose the Future Value formula $F$ vs. the Present Value formula $P$?",
      backDefinition:
        "Use Future Value $F$ when accumulating savings or a sinking fund into the future. Use Present Value $P$ when amortizing a home loan or vehicle finance taken out today.",
      codeOrFormulaSnippet: `$$F = \\frac{x\\left[(1 + i)^n - 1\\right]}{i} \\quad \\text{(Savings / Sinking Fund)}$$
$$P = \\frac{x\\left[1 - (1 + i)^{-n}\\right]}{i} \\quad \\text{(Bond / Loan Repayment)}$$

Monthly compounding: $i = \\frac{r}{12}, \\quad n = \\text{years} \\times 12$`,
      snippetLabel: "NSC Paper 1 · Financial Mathematics Sheet",
      memoryTip:
        "Loans have a negative exponent $(1 + i)^{-n}$ because you are discounting future monthly instalments back to today’s loan value $P$.",
      colorVar: "--yl",
    },
    {
      id: "fc-exam-3",
      track: "exam",
      topic: "Calculus & cubic graphs",
      difficulty: "Medium",
      frontTitle: "First Principles & Cubic Inflection Point",
      frontPrompt:
        "What is the First Principles derivative definition, and how do you find the turning points and inflection point of $f(x) = ax^3 + bx^2 + cx + d$?",
      backDefinition:
        "Differentiate from first principles using the limit as $h \\to 0$. Stationary points occur where $f'(x) = 0$, and concavity changes where $f''(x) = 0$.",
      codeOrFormulaSnippet: `$$f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}$$

• Stationary / Turning points: $f'(x) = 3ax^2 + 2bx + c = 0$
• Point of inflection: $f''(x) = 6ax + 2b = 0 \\implies x = -\\frac{b}{3a}$`,
      snippetLabel: "NSC Paper 1 · Differential Calculus",
      memoryTip:
        'Never drop the "$\\lim_{h \\to 0}$" notation until the very step where you substitute $h = 0$, or you lose 1 notation mark in NSC marking!',
      colorVar: "--gr",
    },
    {
      id: "fc-exam-4",
      track: "exam",
      topic: "Physical Sciences (Mechanics & Doppler)",
      difficulty: "Medium",
      frontTitle: "Doppler Effect Sign Convention",
      frontPrompt:
        "Given the NSC Physical Sciences formula $f_L = \\frac{v \\pm v_L}{v \\pm v_S} f_S$, which signs apply when source and listener move TOWARDS each other?",
      backDefinition:
        "Approaching increases the observed frequency $f_L > f_S$. Therefore, make the numerator larger ($+v_L$) and the denominator smaller ($-v_S$).",
      codeOrFormulaSnippet: `$$f_L = \\left(\\frac{v \\pm v_L}{v \\pm v_S}\\right) f_S$$

• Towards each other ($f_L > f_S$): $f_L = \\left(\\frac{v + v_L}{v - v_S}\\right) f_S$
• Away from each other ($f_L < f_S$): $f_L = \\left(\\frac{v - v_L}{v + v_S}\\right) f_S$`,
      snippetLabel: "NSC Physical Sciences Paper 1 · Waves & Sound",
      memoryTip: "Towards = Higher pitch: Top goes UP ($+$), Bottom goes DOWN ($-$).",
      colorVar: "--bl",
    },
  ],
  code: [
    {
      id: "fc-code-1",
      track: "code",
      topic: "Sliding window",
      difficulty: "Medium",
      frontTitle: "Variable-Size Sliding Window Template",
      frontPrompt:
        "What is the $\\mathcal{O}(n)$ two-pointer window expansion and contraction pattern for finding the longest valid substring/subarray?",
      backDefinition:
        "Expand the right pointer $R$ step-by-step to ingest elements into window state, and shrink the left pointer $L$ in a while-loop only when the window invariant is violated.",
      codeOrFormulaSnippet: `function longestValidWindow(s: string): number {
  const freq = new Map<string, number>();
  let left = 0, maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    freq.set(s[right], (freq.get(s[right]) ?? 0) + 1);
    while ((freq.get(s[right]) ?? 0) > 1) {
      freq.set(s[left], freq.get(s[left])! - 1);
      left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen; // Time: O(n) | Space: O(k)
}`,
      snippetLabel: "TypeScript · O(n) Sliding Window",
      memoryTip:
        "Each index is visited at most twice (once by $R$, once by $L$), guaranteeing linear $\\mathcal{O}(n)$ runtime.",
      colorVar: "--bl",
    },
    {
      id: "fc-code-2",
      track: "code",
      topic: "Linked lists",
      difficulty: "Medium",
      frontTitle: "Floyd’s Tortoise & Hare Cycle Detection",
      frontPrompt:
        "How do you detect a cycle in a singly linked list in $\\mathcal{O}(1)$ extra space and find its exact entry node?",
      backDefinition:
        "Advance a slow pointer by $1$ step and a fast pointer by $2$ steps. If they meet, reset one pointer to head and advance both by $1$ step; their next meeting point is the cycle start.",
      codeOrFormulaSnippet: `function detectCycleStart(head: ListNode | null): ListNode | null {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let entry = head;
      while (entry !== slow) {
        entry = entry!.next;
        slow = slow!.next;
      }
      return entry;
    }
  }
  return null;
}`,
      snippetLabel: "TypeScript · O(1) Space Cycle Entry",
      memoryTip:
        "Distance $L_1$ from head to cycle start equals distance $L_2$ from meeting point to cycle start ($\\pmod C$).",
      colorVar: "--pk",
    },
    {
      id: "fc-code-3",
      track: "code",
      topic: "Binary tree BFS",
      difficulty: "Easy",
      frontTitle: "Level-Order BFS Traversal",
      frontPrompt:
        "How do you process a binary tree level-by-level so you can isolate nodes belonging to the same depth $d$?",
      backDefinition:
        "Snapshot the queue length at the start of each while-loop iteration; that exact count equals the number of nodes in the current depth level $d$.",
      codeOrFormulaSnippet: `function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const res: number[][] = [], queue: TreeNode[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: number[] = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(currentLevel);
  }
  return res;
}`,
      snippetLabel: "TypeScript · Level Snapshot BFS",
      memoryTip:
        "Capture `const levelSize = queue.length` BEFORE pushing child nodes inside the inner for-loop.",
      colorVar: "--gr",
    },
    {
      id: "fc-code-4",
      track: "code",
      topic: "Dynamic programming",
      difficulty: "Hard",
      frontTitle: "1D Space-Optimized 0/1 Knapsack",
      frontPrompt:
        "Why must you iterate capacity $w$ BACKWARDS from $W$ down to $w_i$ when optimizing 0/1 Knapsack to a 1D array?",
      backDefinition:
        "Iterating backwards ensures $dp[w - w_i]$ still holds values from the PREVIOUS item row ($i - 1$), preventing the same item from being picked multiple times.",
      codeOrFormulaSnippet: `function knapsack01(weights: number[], values: number[], W: number): number {
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    // Backwards loop = 0/1 Knapsack (use item once)
    for (let w = W; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }
  return dp[W]; // Time: O(n·W) | Space: O(W)
}`,
      snippetLabel: "TypeScript · 1D DP State Compression",
      memoryTip:
        "Backwards loop = 0/1 Knapsack (once per item); Forwards loop = Unbounded Knapsack (infinite copies).",
      colorVar: "--yl",
    },
  ],
  lang: [
    {
      id: "fc-lang-1",
      track: "lang",
      topic: "isiZulu Noun Classes (Amabizo)",
      difficulty: "Medium",
      frontTitle: "isiZulu Noun Classes 1 & 2 (Umu- / Aba-)",
      frontPrompt:
        "How do personal nouns in isiZulu shift from singular (Class 1) to plural (Class 2), and how does the subject concord (isivumelwano senhloko) change?",
      backDefinition:
        'Singular personal nouns prefix "um-" / "umu-" with subject concord "u-". Plural personal nouns prefix "aba-" with subject concord "ba-".',
      codeOrFormulaSnippet: `Class 1 (Singular: um- / umu-) → Concord: u- (uya-)
• Umfundi uyafunda. (The student is studying.)
• Uthisha uyafundisa. (The teacher is teaching.)

Class 2 (Plural: aba- / o-) → Concord: ba- (baya-)
• Abafundi bayafunda. (The students are studying.)
• Othisha bayafundisa. (The teachers are teaching.)`,
      snippetLabel: "isiZulu FAL/HL · Amabizo & Izivumelwano",
      memoryTip:
        'Listen for alliteration: ABafundi BAyafunda (the prefix "aba-" echoes directly in the concord "ba-").',
      colorVar: "--yl",
    },
    {
      id: "fc-lang-2",
      track: "lang",
      topic: "Afrikaans Tye & STOMPI",
      difficulty: "Hard",
      frontTitle: "Afrikaans STOMPI & Verledetyd Rule",
      frontPrompt:
        'What is the exact word order of an Afrikaans clause, and which verb prefixes NEVER take "ge-" in the past tense?',
      backDefinition:
        'Follow S-v1-T-O-M-P-v2-I. In the past tense, "het" sits at v1 and "ge-" + verb moves to v2, unless the verb starts with an inseparable prefix.',
      codeOrFormulaSnippet: `STOMPI Formula:
[Subject] + [v1: het/sal] + [Time] + [Object] + [Manner] + [Place] + [v2: ge-verb]

• Present: Lerato skryf vandag haar eksamen by die skool.
• Past:    Lerato HET vandag haar eksamen by die skool GESKRYF.
• No "ge-" prefixes: be-, ge-, her-, er-, ont-, ver- (bv. besoek, verstaan, onthou).`,
      snippetLabel: "Afrikaans Paper 1 · Taalstrukture",
      memoryTip:
        'Mnemonic for verbs that never take "ge-": "BE-GE-HER-ER-ONT-VER" (e.g., "Hy het die vraag verstaan").',
      colorVar: "--pk",
    },
    {
      id: "fc-lang-3",
      track: "lang",
      topic: "isiZulu Past & Future Tenses",
      difficulty: "Medium",
      frontTitle: "isiZulu Tense Markers (-ya-, -zo-, -ile)",
      frontPrompt:
        "How do you distinguish between Present Continuous, Definite Future, and Recent Past in isiZulu verb morphology?",
      backDefinition:
        "isiZulu agglutinates tense markers between the subject concord and verb root, or modifies the final vowel for completed past actions.",
      codeOrFormulaSnippet: `Root: -fund- (study / read) with "si-" (we):

• Present (Long form): Si + ya + funda → Siyafunda (We are studying)
• Definite Future:     Si + zo + funda → Sizofunda (We will study)
• Recent Past (Full):  Si + fund + ile → Sifundile (We studied)
• Negative Present:    A + si + fundi  → Asifundi  (We do not study)`,
      snippetLabel: "isiZulu Verb Morphology Matrix",
      memoryTip: '"-zo-" comes from "ukuza" (to come) — the future is coming towards you!',
      colorVar: "--gr",
    },
    {
      id: "fc-lang-4",
      track: "lang",
      topic: "Afrikaans Voegwoorde (Groups 1, 2 & 3)",
      difficulty: "Medium",
      frontTitle: "Afrikaans Conjunctions (Voegwoorde) Groups 1–3",
      frontPrompt:
        "How do Group 1, Group 2, and Group 3 conjunctions affect the position of the verb in the second Afrikaans clause?",
      backDefinition:
        "Group 1 leaves word order unchanged; Group 2 pulls the verb immediately after the conjunction; Group 3 pushes the verb to the very end of the clause.",
      codeOrFormulaSnippet: `• Groep 1 (Normal STOMPI — en, maar, want, of):
  Hy leer hard, WANT hy wil slaag.
• Groep 2 (Verb immediately after — daarom, dus, dan, toe):
  Hy het hard geleer; DAAROM HET hy geslaag.
• Groep 3 (Verb to the end — omdat, dat, terwyl, as):
  Hy het geslaag OMDAT hy elke dag geoefen HET.`,
      snippetLabel: "Afrikaans Paper 1 · Voegwoorde",
      memoryTip: '"Want" = Groep 1 (normal order); "Omdat" = Groep 3 (verb kicked to the back!).',
      colorVar: "--bl",
    },
  ],
};
