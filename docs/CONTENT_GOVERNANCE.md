# Content Sourcing, Import, and Verification

## Source policy
Preferred order from the PRD:
1. User-provided and authorized Drive notes/files.
2. Official Nepali sources: Lok Sewa Aayog, Nepal Law Commission, National Planning Commission, PPMO, DUDBC, National Building Code, and other relevant official publications.
3. Standard textbooks and open references.
4. Links to IndiaBIX, Sanfoundry, and ExamVeda for users to practise at the source.
5. Web search for current affairs, with dates and sources recorded.

## Copyright and permissions
- Do not bulk-scrape or republish IndiaBIX, Sanfoundry, ExamVeda, or any third-party question bank without explicit permission or a licence allowing it.
- Use source links rather than copying restricted question text.
- User-provided files may still have usage restrictions; record whether use is permitted.
- Keep source name, URL/file, page or section, access/retrieval date, attribution, rights status, and edits.
- Do not put private Drive files or question banks in a public repository.

## Question lifecycle
`draft → needs_verification → verified → live`
Other statuses: `flagged`, `retired`.

Only `verified` and `live` are practice eligible. A reported error changes the item to `flagged` until reviewed.

## Verification rules
- Numerical question: independently recompute with code or a transparent calculation.
- Conceptual question: use two agreeing references or manual subject-matter review.
- Scanned/Preeti content: manually inspect OCR and answer key.
- AI-written question/explanation: treat as draft, not authority.
- Keep the explanation and source claim aligned; drop claims that cannot be supported.
- Deduplicate by stem/options before publication.
- If a question's answer cannot be verified, keep it out of live practice.

## Import pipeline
1. Inventory file type, page count, language, and answer-key availability.
2. Parse CSV/JSON first; add PDF/DOCX/OCR only when core app is stable.
3. Show a preview and row-level errors.
4. Map questions to syllabus clauses; allow user correction.
5. Deduplicate.
6. Verify answer keys and rights metadata.
7. Publish only after review.

## Knowledge packs
Each pack should include syllabus clause, plain-language concepts, formulas/tables, worked example, common traps, Nepal-specific context, source links, last-verified date, and review status. Do not display unsupported “likely in exam” statements. Show historical frequency only when sourced past-paper data has actually been entered.
