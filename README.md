# ClearLease

Clearlease takes a pdf or text of your rental agreement, highlights the clauses and parts worth worrying about, checks them through a database of the states' laws and hands back an easy to understand "fairness score" based on those criteria.

## The problem

Most renters sign a lease they don't fully understand. Predatory clauses such as illegal fees, waived rights, and one-sided liability terms are common and are hard to spot for the average eye. These hit low income renters hardest because they're the least likely to be able to afford a lawyer to check the rental agreement beforehand. Clearlease is a free solution to that problem. Renters upload a lease and get back exactly which clauses are risky, why they're risky, and what to do about it.

## How it works

1. **Validate** — a quick classifier check confirms the uploaded document is actually a residential lease before spending a full analysis on it.
2. **Analyze** — the lease text and the tenant-protection law for the selected state are sent to a Large Language Model with a structured prompt that returns a fairness score (0–100), a list of flagged clauses with severity ratings and exact quotes, and a list of things the lease actually gets right and not just a list of what the agreement did wrong.
3. **Chat** — for any flagged clause, the renter can ask follow-up questions and get a plain-English answer scoped to that specific clause and state.

Available as both a web app (Next.js) and a native iOS app (SwiftUI), sharing the same backend.

## State coverage

ClearLease currently covers 8 states with real, cited statutes: California, New York, Texas, Florida, Illinois, Pennsylvania, Ohio, and Washington. This is a deliberate choice, not an oversight — rather than let the AI guess at law for a state it doesn't actually have data for, the app only offers states where every claim can be traced to an actual statute. Expanding coverage means doing the legal research first, not just flipping on a state in the code.

## Tech stack

- **Web:** Next.js (App Router), TypeScript, Tailwind CSS
- **iOS:** SwiftUI
- **AI:** OpenAI API (gpt-4o-mini) with a structured JSON-output prompt
- **PDF parsing:** pdf-parse

## Running it locally

```bash
npm install
```

Create `.env.local` with:
```
OPENAI_API_KEY=your-key-here
```

Then:
```bash
npm run dev
```

The iOS app lives in `ClearLease/` and opens directly in Xcode — point `APIService.swift` at your local dev server or deployed URL.

## AI tool disclosure

This project was built with substantial help from Claude (Anthropic) and Claude Code, including code generation, debugging, and the state law research for this README's coverage list. The idea, architecture decisions, feature scope, and the final review pass were mine.

## Status

Built for the Congressional App Challenge, 2026.
