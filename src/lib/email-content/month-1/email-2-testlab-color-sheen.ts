import { EmailContent } from '../franchises';

// ============================================
// EMAIL 2: TEST LAB — COLOR & SHEEN
// Week 1 — Test Lab (Authority + Proof)
// ============================================

export const testLabColorSheen: EmailContent = {
  franchiseId: 'test_lab',
  topic: 'Color & Sheen Under Real Light',
  
  subject: 'Inside the Test Lab: Color & Sheen Under Real Light',
  previewText: 'What happens when the same color hits different lighting conditions?',
  
  heroImageUrl: 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/email-images/trish-shaun-ghost.jpeg',
  heroImageAlt: 'Trish and Shaun at Ghost Industries Test Lab',
  
  headline: 'Color & Sheen Under Real Light',
  subheadline: 'What we learned testing the same wrap film in three lighting environments.',
  
  openingCopy: `When a customer asks "what will this look like on my car?" — how do you answer?

Most shops guess. We decided to test.

This month at the Test Lab, we partnered with Shaun at Ghost Industries to answer a question we've all had: <strong>How much does lighting actually change the appearance of a wrap film?</strong>

Spoiler: More than you'd think.`,
  
  section1Title: 'The Test Setup',
  section1Copy: `We selected three popular colors from the Avery Dennison SW900 line:
<br><br>
• <strong>Gloss Black</strong> — the baseline<br>
• <strong>Satin Dark Grey</strong> — where sheen matters<br>
• <strong>Gloss Metallic Blue</strong> — where flake shows (or hides)
<br><br>
Each sample was photographed in:
<br><br>
1. Direct sunlight (outdoor, noon)<br>
2. Overcast conditions (outdoor, cloudy)<br>
3. Shop lighting (LED bay lights)
<br><br>
The results confirmed what experienced installers know intuitively — but now we have the photos to prove it to customers.`,
  
  section1ImageUrl: 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/email-images/test-lab-samples.jpeg',
  section1ImageAlt: 'Wrap film samples under different lighting conditions',
  
  section2Title: 'What This Means for Your Shop',
  section2Copy: `<strong>For salespeople:</strong> Stop showing customers swatches under shop lights and expecting them to understand what it'll look like outside.
<br><br>
<strong>For installers:</strong> If a customer complains about color after pickup, have them bring it back in the same lighting where you showed the sample.
<br><br>
<strong>For everyone:</strong> The Test Lab is building a library of these comparisons. Ghost Industries and WePrintWraps are documenting what actually happens — not what the spec sheet says.
<br><br>
This is the first of many. Real tests. Real results. No opinions.`,
  
  ctaUrl: 'https://weprintwraps.com/test-lab',
  ctaText: 'Explore the Test Lab',
};

export default testLabColorSheen;
