// Pre-built professional email templates for wrap shops
// Each template includes Unlayer design JSON and metadata

export interface PrebuiltTemplate {
  id: string;
  name: string;
  description: string;
  category: 'quote' | 'order' | 'followup' | 'welcome' | 'proof' | 'promo';
  tone: 'installer' | 'luxury' | 'hype';
  thumbnail: string;
  design: any;
}

// Helper to create consistent Unlayer designs
const createUnlayerDesign = (config: {
  headerColor: string;
  headerText: string;
  bodyContent: string[];
  ctaText?: string;
  ctaColor?: string;
  footerText?: string;
}) => ({
  body: {
    id: "body",
    rows: [
      // Header row
      {
        id: "header",
        cells: [1],
        columns: [
          {
            id: "header-col",
            contents: [
              {
                id: "header-bg",
                type: "divider",
                values: {
                  containerPadding: "40px 20px",
                  anchor: "",
                  backgroundColor: config.headerColor,
                  width: "100%"
                }
              },
              {
                id: "header-text",
                type: "heading",
                values: {
                  containerPadding: "20px 30px",
                  anchor: "",
                  headingType: "h1",
                  fontSize: "28px",
                  textAlign: "center",
                  lineHeight: "140%",
                  fontWeight: 700,
                  color: "#ffffff",
                  text: config.headerText,
                  backgroundColor: config.headerColor
                }
              }
            ]
          }
        ]
      },
      // Body content rows
      ...config.bodyContent.map((text, index) => ({
        id: `content-${index}`,
        cells: [1],
        columns: [
          {
            id: `content-col-${index}`,
            contents: [
              {
                id: `text-${index}`,
                type: "text",
                values: {
                  containerPadding: index === 0 ? "30px 30px 15px" : "15px 30px",
                  anchor: "",
                  fontSize: "16px",
                  textAlign: "left",
                  lineHeight: "160%",
                  color: "#374151",
                  text: text
                }
              }
            ]
          }
        ]
      })),
      // CTA button row (if provided)
      ...(config.ctaText ? [
        {
          id: "cta-row",
          cells: [1],
          columns: [
            {
              id: "cta-col",
              contents: [
                {
                  id: "cta-button",
                  type: "button",
                  values: {
                    containerPadding: "20px 30px 30px",
                    anchor: "",
                    href: {
                      name: "web",
                      values: { href: "{{portal_url}}" }
                    },
                    buttonColors: {
                      color: "#ffffff",
                      backgroundColor: config.ctaColor || config.headerColor,
                      hoverColor: "#ffffff",
                      hoverBackgroundColor: config.headerColor
                    },
                    size: { autoWidth: false, width: "100%" },
                    padding: "15px 30px",
                    borderRadius: "8px",
                    textAlign: "center",
                    lineHeight: "100%",
                    text: config.ctaText,
                    fontSize: "16px",
                    fontWeight: 600
                  }
                }
              ]
            }
          ]
        }
      ] : []),
      // Footer row
      {
        id: "footer",
        cells: [1],
        columns: [
          {
            id: "footer-col",
            contents: [
              {
                id: "footer-divider",
                type: "divider",
                values: {
                  containerPadding: "20px 30px",
                  border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#e5e7eb" }
                }
              },
              {
                id: "footer-text",
                type: "text",
                values: {
                  containerPadding: "10px 30px 30px",
                  fontSize: "13px",
                  textAlign: "center",
                  color: "#9ca3af",
                  text: config.footerText || "{{company_name}} • Professional Vehicle Wraps"
                }
              }
            ]
          }
        ]
      }
    ],
    values: {
      backgroundColor: "#f3f4f6",
      contentWidth: "600px",
      contentAlign: "center",
      fontFamily: { label: "Arial", value: "arial,helvetica,sans-serif" },
      preheaderText: "",
      linkStyle: { inherit: false, linkColor: config.headerColor, linkUnderline: true }
    }
  },
  counters: { u_column: 10, u_row: 10, u_content_text: 10, u_content_button: 1, u_content_heading: 1, u_content_divider: 2 },
  schemaVersion: 16
});

export const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  // ============ QUOTE TEMPLATES ============
  {
    id: 'quote-initial-installer',
    name: 'Initial Quote - Installer',
    description: 'Professional quote delivery with clear pricing breakdown',
    category: 'quote',
    tone: 'installer',
    thumbnail: '💰',
    design: createUnlayerDesign({
      headerColor: '#2563eb',
      headerText: 'Your Custom Wrap Quote',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">Hey <strong>{{customer_name}}</strong>,</p><p>Thanks for reaching out! I put together a quote for your <strong>{{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</strong>.</p>',
        '<div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 10px 0;"><p style="margin: 0 0 10px;"><strong>Project:</strong> {{product_name}}</p><p style="margin: 0 0 10px;"><strong>Vehicle:</strong> {{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</p><p style="margin: 0; font-size: 24px; color: #2563eb;"><strong>Total: {{total_price}}</strong></p></div>',
        '<p>This includes premium materials and professional installation by our certified team. Quote is valid for 30 days.</p><p>Ready to get started? Click below to review and approve your quote, or hit reply if you have any questions!</p>'
      ],
      ctaText: 'View Full Quote Details →',
      ctaColor: '#2563eb',
      footerText: '{{company_name}} • Quote #{{quote_number}}'
    })
  },
  {
    id: 'quote-initial-luxury',
    name: 'Initial Quote - Luxury',
    description: 'Elegant quote presentation for high-end clients',
    category: 'quote',
    tone: 'luxury',
    thumbnail: '✨',
    design: createUnlayerDesign({
      headerColor: '#1f2937',
      headerText: 'Your Bespoke Quote',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">Dear <strong>{{customer_name}}</strong>,</p><p>Thank you for considering us for your <strong>{{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</strong>. We\'ve prepared a tailored proposal for your consideration.</p>',
        '<div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 25px; margin: 15px 0; color: #fff;"><p style="margin: 0 0 10px; opacity: 0.9; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Investment Summary</p><p style="margin: 0 0 8px;"><strong>Service:</strong> {{product_name}}</p><p style="margin: 0 0 8px;"><strong>Vehicle:</strong> {{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</p><p style="margin: 0; font-size: 28px; font-weight: 300;">{{total_price}}</p></div>',
        '<p>This investment includes only the finest materials sourced from premier manufacturers, paired with meticulous craftsmanship from our master installers.</p><p>We would be honored to transform your vehicle. Please review your personalized proposal at your convenience.</p>'
      ],
      ctaText: 'Review Your Proposal',
      ctaColor: '#1f2937',
      footerText: '{{company_name}} • Crafted Excellence • Quote {{quote_number}}'
    })
  },
  {
    id: 'quote-initial-hype',
    name: 'Initial Quote - Hype',
    description: 'Bold, energetic quote for enthusiast customers',
    category: 'quote',
    tone: 'hype',
    thumbnail: '🔥',
    design: createUnlayerDesign({
      headerColor: '#dc2626',
      headerText: '🔥 YOUR QUOTE IS READY!',
      bodyContent: [
        '<p style="font-size: 20px; margin-bottom: 10px;">What\'s up <strong>{{customer_name}}</strong>! 🚗💨</p><p>Your <strong>{{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</strong> is about to look INSANE! Check out what we put together:</p>',
        '<div style="background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); border-radius: 12px; padding: 25px; margin: 15px 0; color: #fff; text-align: center;"><p style="margin: 0 0 5px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">YOUR TRANSFORMATION</p><p style="margin: 0 0 10px; font-size: 18px;"><strong>{{product_name}}</strong></p><p style="margin: 0; font-size: 36px; font-weight: 800;">{{total_price}}</p></div>',
        '<p><strong>What you\'re getting:</strong> ✅ Premium wrap materials ✅ Expert installation ✅ Head-turning results</p><p>Don\'t wait – these prices won\'t last forever! Let\'s make your ride the talk of the town! 🏆</p>'
      ],
      ctaText: "LET'S DO THIS! 🚀",
      ctaColor: '#dc2626',
      footerText: '{{company_name}} • Making Dreams Reality • #{{quote_number}}'
    })
  },

  // ============ FOLLOW-UP TEMPLATES ============
  {
    id: 'followup-day1',
    name: 'Follow-up - Day 1',
    description: 'Quick check-in after sending initial quote',
    category: 'followup',
    tone: 'installer',
    thumbnail: '📨',
    design: createUnlayerDesign({
      headerColor: '#0891b2',
      headerText: 'Quick Check-In',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">Hey {{customer_name}},</p><p>Just wanted to make sure you got the quote I sent over for your <strong>{{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</strong>.</p>',
        '<p>Sometimes these emails end up in spam, so I wanted to double-check! If you have any questions about the quote or want to talk through options, just hit reply – I\'m here to help.</p>',
        '<p>Looking forward to hearing from you!</p>'
      ],
      ctaText: 'View Your Quote',
      ctaColor: '#0891b2',
      footerText: '{{company_name}} • Quote #{{quote_number}}'
    })
  },
  {
    id: 'followup-day3',
    name: 'Follow-up - Day 3',
    description: 'Value-add follow-up with project highlights',
    category: 'followup',
    tone: 'installer',
    thumbnail: '💡',
    design: createUnlayerDesign({
      headerColor: '#7c3aed',
      headerText: 'A Few Things to Consider...',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">Hi {{customer_name}},</p><p>I know you\'re probably weighing your options for your <strong>{{vehicle_make}} {{vehicle_model}}</strong> wrap project. Here are a few things worth considering:</p>',
        '<div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 15px 0;"><p style="margin: 0 0 10px;"><strong>🎨 Protection + Style:</strong> A quality wrap protects your paint while completely transforming your look.</p><p style="margin: 0 0 10px;"><strong>💰 Resale Value:</strong> Wraps preserve your original paint, which can actually increase resale value.</p><p style="margin: 0;"><strong>⚡ Reversible:</strong> Want to change it up later? Wraps can be removed without damaging your paint.</p></div>',
        '<p>Got questions? I\'m happy to walk through everything. Just reply to this email or give us a call!</p>'
      ],
      ctaText: 'Schedule a Call',
      ctaColor: '#7c3aed',
      footerText: '{{company_name}} • Here to Help'
    })
  },
  {
    id: 'followup-day7',
    name: 'Follow-up - Day 7',
    description: 'Urgency-focused follow-up with limited offer',
    category: 'followup',
    tone: 'installer',
    thumbnail: '⏰',
    design: createUnlayerDesign({
      headerColor: '#ea580c',
      headerText: 'Your Quote Expires Soon',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">Hey {{customer_name}},</p><p>Just a heads up – your quote for the <strong>{{vehicle_make}} {{vehicle_model}}</strong> project expires in about a week.</p>',
        '<div style="background: #fff7ed; border: 2px solid #ea580c; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center;"><p style="margin: 0 0 10px; font-size: 14px; color: #ea580c; font-weight: 600;">YOUR QUOTED PRICE</p><p style="margin: 0; font-size: 32px; font-weight: 700; color: #ea580c;">{{total_price}}</p><p style="margin: 10px 0 0; font-size: 13px; color: #9a3412;">Valid for 7 more days</p></div>',
        '<p>Material costs fluctuate, so I can\'t guarantee this price after the quote expires. If you\'re ready to move forward or have any final questions, now\'s the time!</p>'
      ],
      ctaText: 'Lock In This Price',
      ctaColor: '#ea580c',
      footerText: '{{company_name}} • Quote #{{quote_number}}'
    })
  },
  {
    id: 'followup-day14',
    name: 'Follow-up - Day 14 (Final)',
    description: 'Last chance message with special offer',
    category: 'followup',
    tone: 'installer',
    thumbnail: '🎁',
    design: createUnlayerDesign({
      headerColor: '#059669',
      headerText: 'One Last Thing...',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">{{customer_name}},</p><p>I know life gets busy, and your <strong>{{vehicle_make}} {{vehicle_model}}</strong> wrap project might have gotten pushed to the back burner. Totally get it!</p>',
        '<div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px; padding: 25px; margin: 15px 0; color: #fff; text-align: center;"><p style="margin: 0 0 10px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">SPECIAL OFFER</p><p style="margin: 0 0 5px; font-size: 20px;">Book this week and get</p><p style="margin: 0; font-size: 32px; font-weight: 800;">FREE Ceramic Coating</p><p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">on all wrapped surfaces ($299 value)</p></div>',
        '<p>This is my last follow-up, so I won\'t bug you again after this. But if the timing works out, I\'d love to make your wrap project happen!</p>'
      ],
      ctaText: 'Claim Your Bonus',
      ctaColor: '#059669',
      footerText: '{{company_name}} • Let\'s Make It Happen'
    })
  },

  // ============ ORDER TEMPLATES ============
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    description: 'Professional order confirmation with next steps',
    category: 'order',
    tone: 'installer',
    thumbnail: '✅',
    design: createUnlayerDesign({
      headerColor: '#16a34a',
      headerText: '✓ Order Confirmed!',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">Awesome news, {{customer_name}}!</p><p>Your order is confirmed and we\'re getting everything ready for your <strong>{{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</strong>.</p>',
        '<div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 15px 0;"><p style="margin: 0 0 8px;"><strong>Order Number:</strong> {{order_number}}</p><p style="margin: 0 0 8px;"><strong>Project:</strong> {{product_name}}</p><p style="margin: 0;"><strong>Total:</strong> {{total_price}}</p></div>',
        '<p><strong>What happens next:</strong></p><ul style="margin: 10px 0; padding-left: 20px;"><li>Our design team will prepare your proof within 2-3 business days</li><li>You\'ll receive an email to review and approve the design</li><li>Once approved, we\'ll schedule your installation</li></ul>',
        '<p>Track your project status anytime using the link below!</p>'
      ],
      ctaText: 'Track Your Order',
      ctaColor: '#16a34a',
      footerText: '{{company_name}} • Order #{{order_number}}'
    })
  },
  {
    id: 'order-shipped',
    name: 'Order Shipped',
    description: 'Shipping notification with tracking info',
    category: 'order',
    tone: 'installer',
    thumbnail: '📦',
    design: createUnlayerDesign({
      headerColor: '#0284c7',
      headerText: '📦 Your Order Has Shipped!',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">Great news, {{customer_name}}!</p><p>Your wrap for the <strong>{{vehicle_make}} {{vehicle_model}}</strong> is on its way!</p>',
        '<div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center;"><p style="margin: 0 0 10px;"><strong>Order #{{order_number}}</strong></p><p style="margin: 0; font-size: 14px; color: #0284c7;">Estimated arrival: 3-5 business days</p></div>',
        '<p>Once your materials arrive, our team will contact you to schedule your installation appointment. Make sure you have a clean vehicle ready – that\'ll help us deliver the best results!</p>'
      ],
      ctaText: 'Track Shipment',
      ctaColor: '#0284c7',
      footerText: '{{company_name}} • Almost There!'
    })
  },

  // ============ PROOF TEMPLATES ============
  {
    id: 'proof-ready',
    name: 'Design Proof Ready',
    description: 'Design proof delivery with approval request',
    category: 'proof',
    tone: 'installer',
    thumbnail: '🎨',
    design: createUnlayerDesign({
      headerColor: '#8b5cf6',
      headerText: '🎨 Your Design is Ready!',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">{{customer_name}}, check this out!</p><p>Our design team just finished your <strong>{{product_name}}</strong> proof for your <strong>{{vehicle_make}} {{vehicle_model}}</strong>. It\'s looking great!</p>',
        '<div style="background: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 25px; margin: 15px 0; text-align: center;"><p style="margin: 0 0 15px; font-size: 16px;">📎 Click below to view your design proof</p><p style="margin: 0; font-size: 14px; color: #6b7280;">Review it on our approval portal where you can leave feedback, request changes, or give it the green light!</p></div>',
        '<p><strong>What to look for:</strong></p><ul style="margin: 10px 0; padding-left: 20px;"><li>Overall design placement and flow</li><li>Colors and graphics look correct</li><li>Text/logos are positioned right</li></ul><p>If you need any tweaks, just let us know through the portal!</p>'
      ],
      ctaText: 'Review Your Design',
      ctaColor: '#8b5cf6',
      footerText: '{{company_name}} • Order #{{order_number}}'
    })
  },

  // ============ WELCOME/PROMO TEMPLATES ============
  {
    id: 'welcome-new-customer',
    name: 'Welcome New Customer',
    description: 'Warm welcome for first-time customers',
    category: 'welcome',
    tone: 'installer',
    thumbnail: '👋',
    design: createUnlayerDesign({
      headerColor: '#0ea5e9',
      headerText: 'Welcome to the Family! 👋',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px;">Hey {{customer_name}}!</p><p>Thanks for choosing us for your vehicle transformation journey. We\'re stoked to have you!</p>',
        '<div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 15px 0;"><p style="margin: 0 0 15px; font-weight: 600;">🎁 New Customer Perks:</p><ul style="margin: 0; padding-left: 20px;"><li style="margin-bottom: 8px;"><strong>10% OFF</strong> your first project</li><li style="margin-bottom: 8px;"><strong>Free consultation</strong> on any vehicle</li><li><strong>Priority scheduling</strong> for new customers</li></ul></div>',
        '<p>Whether you\'re thinking color change, graphics, PPF, or something totally custom – we\'ve got you covered. Browse our recent work and get inspired!</p>'
      ],
      ctaText: 'See Our Work',
      ctaColor: '#0ea5e9',
      footerText: '{{company_name}} • Welcome Aboard!'
    })
  },
  {
    id: 'promo-seasonal',
    name: 'Seasonal Promotion',
    description: 'Eye-catching promotional template',
    category: 'promo',
    tone: 'hype',
    thumbnail: '🎉',
    design: createUnlayerDesign({
      headerColor: '#be185d',
      headerText: '🔥 LIMITED TIME OFFER!',
      bodyContent: [
        '<p style="font-size: 18px; margin-bottom: 10px; text-align: center;">{{customer_name}}, you don\'t want to miss this!</p>',
        '<div style="background: linear-gradient(135deg, #be185d 0%, #db2777 100%); border-radius: 16px; padding: 30px; margin: 15px 0; color: #fff; text-align: center;"><p style="margin: 0 0 10px; font-size: 16px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9;">This Week Only</p><p style="margin: 0 0 5px; font-size: 48px; font-weight: 800;">20% OFF</p><p style="margin: 0; font-size: 18px;">All Color Change Wraps</p></div>',
        '<p style="text-align: center;"><strong>Why wait?</strong> Book your consultation this week and lock in these savings. Spots fill up fast!</p><p style="text-align: center; font-size: 14px; color: #9ca3af;">*Offer valid through end of month. Cannot be combined with other promotions.</p>'
      ],
      ctaText: 'CLAIM YOUR DISCOUNT',
      ctaColor: '#be185d',
      footerText: '{{company_name}} • Don\'t Miss Out!'
    })
  }
];

export const getTemplatesByCategory = (category?: string) => {
  if (!category || category === 'all') return PREBUILT_TEMPLATES;
  return PREBUILT_TEMPLATES.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
  return PREBUILT_TEMPLATES.find(t => t.id === id);
};
