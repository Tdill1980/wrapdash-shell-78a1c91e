import { EmailContent } from '../franchises';

// ============================================
// EMAIL 4: WRAP OF THE WEEK — FIRST EDITION
// Week 3 — Community / Culture
// ============================================

export const wotwFirst: EmailContent = {
  franchiseId: 'wotw',
  topic: 'Matte Military Green F-150',
  
  subject: 'Wrap of the Week: Matte Military Green F-150',
  previewText: 'This week\'s featured wrap comes from Austin Smith in Phoenix.',
  
  heroImageUrl: 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/email-images/wotw-f150-green.jpeg',
  heroImageAlt: 'Matte Military Green F-150 Wrap by Austin Smith',
  
  headline: 'Matte Military Green F-150',
  subheadline: 'Featured installer: Austin Smith · Phoenix, AZ',
  
  openingCopy: `Every week, we feature one wrap that caught our attention.

This isn't about perfection — it's about execution, creativity, and the story behind the job.

<strong>This week:</strong> A 2023 Ford F-150 wrapped in Avery Dennison Matte Military Green by Austin Smith in Phoenix.`,
  
  section1Title: 'The Build Details',
  section1Copy: `<strong>Vehicle:</strong> 2023 Ford F-150 XLT
<br><br>
<strong>Material:</strong> Avery Dennison SW900 Matte Military Green<br>
<strong>Coverage:</strong> Full wrap including door jambs, fuel door, mirrors<br>
<strong>Time:</strong> 22 hours total<br>
<strong>Challenge:</strong> Phoenix heat in August — working early mornings only
<br><br>
Austin's approach: "I don't fight the weather. I work with it. Started at 5am, stopped by noon. Three days instead of two, but zero lifting."
<br><br>
The result speaks for itself.`,
  
  section1ImageUrl: 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/email-images/wotw-f150-detail.jpeg',
  section1ImageAlt: 'Detail shot of matte military green wrap finish',
  
  section2Title: 'Want to Be Featured?',
  section2Copy: `We're looking for wraps that show:
<br><br>
• <strong>Clean execution</strong> — doesn't have to be exotic, just well done<br>
• <strong>Interesting story</strong> — tough install? Creative solution? Tell us<br>
• <strong>Quality photos</strong> — daylight, multiple angles, before/after if you have it
<br><br>
Submit your wrap below. Selected installers get featured to our entire email list + social channels.
<br><br>
No entry fee. No catch. Just good work getting seen.`,
  
  ctaUrl: 'https://weprintwraps.com/wotw-submit',
  ctaText: 'Submit Your Wrap',
};

export default wotwFirst;
