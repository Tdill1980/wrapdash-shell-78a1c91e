// WPW Team Configuration for Luigi escalations
// Trish is SILENTLY CC'd on all escalations - never mentioned to customers

export interface TeamMember {
  email: string;
  name: string;
  role: string;
  customerFacing: boolean;
  triggers: string[];
}

export const WPW_TEAM: Record<string, TeamMember> = {
  jackson: {
    email: 'Jackson@WePrintWraps.com',
    name: 'Jackson',
    role: 'Operations Manager',
    customerFacing: true,
    triggers: ['bulk', 'fleet', 'wholesale', 'rush', 'urgent', 'discount', 'multiple vehicles', '10+', '10 trucks', '10 vans', 'volume']
  },
  lance: {
    email: 'Lance@WePrintWraps.com',
    name: 'Lance',
    role: 'Graphics Manager',
    customerFacing: true,
    triggers: ['bubble', 'defect', 'reprint', 'quality', 'blurry', 'color match', 'wrong color', 'damaged', 'issue with']
  },
  design: {
    email: 'Design@WePrintWraps.com',
    name: 'Design Team',
    role: 'File Review & Quotes',
    customerFacing: true,
    triggers: [
      // Existing file check triggers
      'check my files', 'review my files', 'look at my design', 'file check', 
      'artwork check', 'review my artwork', 'can you check',
      // NEW: Customer offering to send files
      'send it your way', 'send you the', 'sending you the', 'got the edit ready',
      'file ready', 'design ready', 'artwork ready', 'sending files',
      'send my files', 'can i send', 'send over my', 'here is the file',
      'here are the files', 'attached', 'sending the design', 'send it over',
      'gonna send', 'about to send', 'sending now', 'uploading now',
      'just sent', 'i sent', 'files sent', 'design sent',
      // File type mentions
      '.pdf', '.ai', '.eps', '.psd', '.png', '.jpg', 'illustrator', 'photoshop'
    ]
  },
  trish: {
    email: 'Trish@WePrintWraps.com',
    name: 'Trish',
    role: 'Main Developer - Silent Oversight',
    customerFacing: false,
    triggers: [] // Trish doesn't have triggers - she's CC'd on everything
  }
};

// Trish is SILENTLY CC'd on all escalation emails
// Never mentioned to customers - for dev oversight only
export const SILENT_CC = ['Trish@WePrintWraps.com'];

// Detect which team member should handle based on message content
export function detectEscalation(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  for (const [key, member] of Object.entries(WPW_TEAM)) {
    if (key === 'trish') continue; // Skip Trish - she doesn't handle directly
    
    for (const trigger of member.triggers) {
      if (lowerMessage.includes(trigger.toLowerCase())) {
        return key;
      }
    }
  }
  
  return null;
}

// Detect if message indicates file sending intent
export function hasFileIntent(message: string): boolean {
  const fileIntentPhrases = [
    'send', 'file', 'design', 'artwork', 'upload', 'attached', 'sending',
    '.pdf', '.ai', '.eps', '.psd', '.png', '.jpg', 'illustrator', 'photoshop'
  ];
  
  const lowerMessage = message.toLowerCase();
  return fileIntentPhrases.some(phrase => lowerMessage.includes(phrase));
}

// Get escalation response for Luigi to say to customer
export function getEscalationResponse(escalationType: string, customerName?: string): string {
  const responses: Record<string, string> = {
    jackson: `Great question! Let me check with Jackson, our Operations Manager. He'll email you the pricing details shortly. What's your email so he can reach you?`,
    lance: `I'm sorry to hear that! Let me get Lance, our Graphics Manager, on this right away. He'll contact you directly to make this right. What's your email?`,
    design: `Absolutely! Send it right over - I'll forward your files to our design team. They'll check everything and get you a quote. What's your email so they can send it over?`
  };
  
  return responses[escalationType] || `Let me check with the team on that. What's your email so we can follow up?`;
}

// Response when files are actually received
export function getFileReceivedResponse(): string {
  return `Got it! 👊 Forwarding to Lance and the design team now - they'll review your files and email your quote shortly. What's your email so they can reach you?`;
}
