
Goal (what you asked)
- Confirm whether the chat overcharged and what $/sqft it should be.
- Fix the backend “locked” chat agent so it always uses the correct $/sqft for standard printed wraps and does not invent/overcharge prices (especially the 3M $6.32 issue shown in your screenshot).
- Align behavior with your approved protocol:
  - Pricing flow: Deterministic pricing
  - Contact gate: Name+email gate
  - Material options: Ask “Avery or 3M?” (same price)

What happened in your screenshot (the exact overcharge math)
- The chat estimated ~450 sqft for a 14ft food trailer.
- It quoted:
  - Avery: $2,371.50  → 450 × 5.27 = 2,371.50 (correct for wrap film)
  - 3M: $2,844.00     → 450 × 6.32 = 2,844.00 (overcharged)
- Overcharge amount: $2,844.00 − $2,371.50 = $472.50
- Conclusion: Yes, it overcharged. The $6.32/sqft rate is “cut contour / decals” pricing, not standard printed wrap film.

Root causes (confirmed in code)
1) Wrong 3M wrap-film price embedded in the locked website chat knowledge
- In supabase/functions/website-chat/index.ts, WPW_KNOWLEDGE.pricing currently says:
  - “3M IJ180Cv3 … $6.32/sqft”
- That directly causes the AI to compute a higher 3M total, even though the deterministic code path uses pricePerSqft = 5.27 for the computed “PRICE” in context notes.

2) The system prompt contradicts the intended “gate” and trailer rules
- The system prompt currently contains:
  - “PRICING RULE: If customer has provided vehicle or dimensions, GIVE THE PRICE IMMEDIATELY! THEN ask for email/phone…”
- That instruction conflicts with:
  - Trailer handling (which is supposed to ask for dimensions)
  - Your approved “Name+email gate”
  - “Deterministic pricing” (AI should not compute alternative totals)

3) The conversation state save is currently broken (this explains “No email captured” even when the transcript shows it)
- website-chat/index.ts attempts to update non-existent columns on conversations:
  - updateData.customer_email / customer_name / customer_phone / shop_name
- Your conversations table does not have these columns (only chat_state JSONB does).
- Result: the .update() can fail or partially fail, causing chat_state not to persist properly, leading to:
  - “Anonymous Visitor”
  - “No email captured”
  - “0 quotes” even when the user typed them

4) Trailer behavior can still drift if the AI invents sqft from a “14ft” mention
- The code has a trailer branch that correctly asks for dimensions, but the global prompt encourages “give price immediately,” which can cause the model to ignore the dimension-collection script and invent an sqft estimate.

Implementation plan (what I will change after you approve)
A) Fix the pricing source of truth inside the locked website chat function
Files:
- supabase/functions/website-chat/index.ts (LOCKED — will edit carefully and minimally)

Changes:
1) Correct WPW_KNOWLEDGE.pricing
- Update “3M IJ180Cv3 … $6.32/sqft” → “$5.27/sqft” under PRINTED WRAP FILMS.
- Leave CUT CONTOUR pricing at $6.32/$6.92 (that’s correct for decals/cut contour).

2) Enforce “Avery or 3M?” selection without showing two totals
- Update the “ALL INFO COLLECTED” prompt block to:
  - State one deterministic total based on $5.27/sqft
  - Ask: “Do you prefer Avery MPI 1105 or 3M IJ180Cv3? Same price.”
  - Avoid printing separate Avery vs 3M totals entirely (to prevent another overcharge)

3) Align the system prompt with your approved protocol (name+email gate + deterministic)
- Replace the current global PRICING RULE text with rules that match your approvals:
  - Do not give any price until Name + Email are captured (minimum gate)
  - After giving the price, ask for phone and shop (optional but requested for follow-up)
  - If it’s a trailer/RV/camper: do not estimate sqft; ask dimensions (length × height for each side + which sides), then compute deterministically

B) Fix chat_state persistence so the admin UI can actually see captured email/name
Files:
- supabase/functions/website-chat/index.ts (LOCKED)

Changes:
4) Remove invalid conversation column updates
- Change the “Save state and response” block to only update valid columns:
  - conversations.chat_state
  - conversations.last_message_at
- Do not attempt to update conversations.customer_email/customer_name/etc. (they don’t exist)

Outcome:
- When the user types email/name, it will actually persist into chat_state.
- The /website-admin panel should stop showing “No email captured” for sessions where it was provided.

C) Prevent trailer “14ft” overconfident quoting (stop AI from inventing sqft)
Files:
- supabase/functions/website-chat/index.ts (LOCKED)

Changes:
5) Tighten trailer flow
- Ensure trailer detection path always wins when “trailer/food trailer/cargo trailer” is present:
  - Ask for dimensions first (length x height per side + which sides)
  - Only compute sqft/price after dimensions are provided
- Add explicit instruction in contextNotes: “Do not estimate sqft for trailers from length alone.”

D) Normalize the rest of the ecosystem (optional but recommended to prevent future regressions)
Reason:
- I found other backend functions still mentioning 6.32 for 3M wrap in prompts/configs even if some shared libraries were already corrected.

Files to audit/adjust:
- supabase/functions/agent-chat/index.ts (still lists 3M at $6.32)
- supabase/functions/vapi-webhook/index.ts (pricing constant still declares threeM: 6.32)
- supabase/functions/_shared/agent-config.ts (lists 3M at $6.32)
- supabase/functions/_shared/wpw-pricing.ts and _shared/wpw-knowledge-base.ts already correctly say 3M wrap is $5.27, so we’ll align the others to match.

Scope decision:
- If you want the fix only for website chat right now: we do A+B+C only.
- If you want “one pricing truth everywhere”: do A+B+C+D.

Verification checklist (how we’ll confirm it’s fixed)
1) Pricing correctness
- Start a new chat and ask about a “14ft food trailer wrap”.
- Expected:
  - The agent asks for dimensions (does NOT invent 450 sqft)
- Provide dimensions (e.g., 14ft × 6ft each side, 2 sides):
  - sqft = (14×6)=84 sqft per side → 168 sqft total
  - price = 168 × 5.27 = $885.36 (rounded per current behavior)
  - The message shows ONE total only and asks “Avery or 3M?” (no separate totals)

2) Contact capture persistence
- Provide name + email.
- Refresh /website-admin detail panel:
  - Should no longer show “No email captured”
  - Should show the email/name from chat_state

3) Regression checks
- Vehicle wrap quote (non-trailer) still returns correct sqft and uses 5.27.
- Cut contour requests still show 6.32/6.92 (decals) and proper URLs.

Notes / constraints
- website-chat/index.ts is explicitly LOCKED. I will keep edits minimal and localized to the lines that are provably wrong:
  - One incorrect price line in WPW_KNOWLEDGE
  - The global pricing rule block
  - The invalid DB update fields
  - Trailer flow guardrails
- This plan does not yet add quote-row creation in the database; it focuses on stopping overcharges and fixing “email not captured” first (the two issues causing the “lost sale” and broken admin display). If you want, next step is to ensure every priced chat creates a quote record for MightyMail.

What I need from you (only if you want the broader “everywhere” fix)
- Confirm scope:
  1) Fix website chat only, or
  2) Also align agent-chat + vapi-webhook + agent-config so no channel can ever quote 3M at $6.32 again.
