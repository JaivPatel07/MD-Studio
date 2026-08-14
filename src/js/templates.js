export const TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank Note',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    description: 'Start with a clean slate',
    content: ''
  },
  {
    id: 'meeting',
    title: 'Meeting Notes & Action Items',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    description: 'Agenda, attendees, key decisions & task list',
    content: `# Meeting Notes: [Project/Topic Name]

**Date:** ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}  
**Attendees:** @Alex, @Jordan, @Taylor  
**Objective:** Align on sprint priorities and deliverable timeline  

---

## Key Agenda
1. Review milestone progress from last cycle
2. Architecture breakdown & technical blockers
3. Resource allocation & release target

## Key Discussion Points
- Discussed customer feedback regarding onboarding friction.
- Decided to adopt unified API response models.
- Prioritized performance profiling on mobile viewports.

## Decisions Made
- [x] Adopt quarterly milestones instead of monthly releases
- [x] Migrate legacy endpoints to REST v2

## Action Items
- [ ] @Alex: Draft updated API documentation by Friday
- [ ] @Jordan: Create PR for responsive navigation drawer
- [ ] @Taylor: Coordinate benchmark testing on staging environment
`
  },
  {
    id: 'readme',
    title: 'GitHub Project README',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    description: 'Professional repository documentation template',
    content: `# Project Title

> A brief, compelling one-sentence summary of what this project accomplishes.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)]()

---

## Features

- **Blazing Fast**: Engineered with zero bloat and optimized runtime performance.
- **Modern Design**: Clean typography, light/dark themes, and responsive layouts.
- **Local-First**: Safe client-side storage with zero tracking.
- **Extensible**: Modular architecture with TypeScript type safety.

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/username/project-name.git

# Navigate into project directory
cd project-name

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Quick Example

\`\`\`javascript
import { createEngine } from './engine.js';

const engine = createEngine({ debug: true });
await engine.initialize();
console.log('Engine ready!');
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
`
  },
  {
    id: 'blog',
    title: 'Blog Post Draft',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    description: 'Article draft with headings, callouts & code examples',
    content: `# The Art of Crafting Clean Interfaces

*Published on ${new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · 5 min read*

---

Great software doesn't just solve problems—it eliminates friction. When building interfaces, every pixel, margin, and typography decision communicates intent to the user.

> "Simplicity is about subtracting the obvious and adding the meaningful."  
> — *John Maeda*

## Why Visual Hierarchy Matters

When a user lands on your application, their eyes scan in an F-shaped or Z-shaped pattern. A disciplined interface establishes order through:

1. **Typographic Rhythm**: Distinct contrast between titles, subtitles, and body text.
2. **Generous Whitespace**: Giving content room to breathe without clutter.
3. **Intentional Accents**: Guiding attention toward primary call-to-action buttons.

### Code in Action

\`\`\`css
/* Clean nested card styling */
.container {
  padding: 24px;
  border-radius: 12px;
  background: var(--bg-secondary);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}
\`\`\`

## Key Takeaways

- [x] Limit visual noise and remove unnecessary decorative elements
- [x] Test accessibility contrast across both light and dark themes
- [ ] Measure user feedback before rolling out breaking redesigns

---

*Thank you for reading! Feel free to share your thoughts in the discussion below.*
`
  },
  {
    id: 'planner',
    title: 'Weekly Planner & Habit Tracker',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    description: 'Habits, daily priorities, goals & reflection',
    content: `# Weekly Planner & Habit Log

**Week of:** ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - Next Sunday  
**Weekly Focus:** Finish Core Feature Launch & Exercise Daily  

---

## Daily Habit Tracker

| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Water (2L) | [x] | [x] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Reading (30m) | [x] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Exercise | [ ] | [x] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Mindfulness | [x] | [x] | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## Daily Breakdown

### Monday
- [x] Review team standup updates
- [x] Fix critical CSS layout bugs
- [ ] Read 2 chapters of design systems book

### Tuesday
- [ ] Finalize Markdown export to HTML & PDF
- [ ] Write integration test coverage

### Wednesday
- [ ] Mid-week progress review
- [ ] Refactor toolbar component state

---

## Weekly Reflection
- **What went well:** 
- **What can be improved:** 
`
  },
  {
    id: 'math',
    title: 'Math & Technical Spec',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v4H8l6 8H4v4h16"></path></svg>`,
    description: 'LaTeX math formulas, matrices, algorithms & diagrams',
    content: `# Mathematical Models & Formula Spec

Here are examples of mathematical equations rendered in Markdown via LaTeX formatting:

## Inline Formulas

The famous mass-energy equivalence is $E = mc^2$.
The Pythagorean theorem states that $a^2 + b^2 = c^2$.
Euler's identity is given by $e^{i\\pi} + 1 = 0$.

## Block Equations

The Gaussian Normal Distribution probability density function:

$$f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$

The Cauchy-Schwarz Inequality:

$$\\left( \\sum_{k=1}^n a_k b_k \\right)^2 \\leq \\left( \\sum_{k=1}^n a_k^2 \\right) \\left( \\sum_{k=1}^n b_k^2 \\right)$$

Matrix representation:

$$\\mathbf{A} = \\begin{pmatrix} 
a_{11} & a_{12} & \\cdots & a_{1n} \\\\
a_{21} & a_{22} & \\cdots & a_{2n} \\\\
\\vdots & \\vdots & \\ddots & \\vdots \\\\
a_{m1} & a_{m2} & \\cdots & a_{mn} 
\\end{pmatrix}$$
`
  }
];

export const NOTE_TEMPLATES = TEMPLATES.map(t => ({
  ...t,
  name: t.title || t.name
}));
