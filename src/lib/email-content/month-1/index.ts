// ============================================
// MONTH 1 EMAIL CONTENT INDEX
// ============================================

export { testLabColorSheen } from './email-2-testlab-color-sheen';
export { onTheRoadChelsea } from './email-3-execution-chelsea';
export { wotwFirst } from './email-4-wotw-first';

import { EmailContent } from '../franchises';
import { testLabColorSheen } from './email-2-testlab-color-sheen';
import { onTheRoadChelsea } from './email-3-execution-chelsea';
import { wotwFirst } from './email-4-wotw-first';

// Month 1 schedule (after Declaration email)
export const MONTH_1_EMAILS: EmailContent[] = [
  testLabColorSheen,  // Week 1 - Test Lab
  onTheRoadChelsea,   // Week 2 - Execution
  wotwFirst,          // Week 3 - WOTW
];

export default MONTH_1_EMAILS;
