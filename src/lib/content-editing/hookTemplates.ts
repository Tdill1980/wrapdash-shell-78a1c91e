// Pre-tested hook templates for wrap industry

export type HookTemplate = {
  id: string;
  name: string;
  category: 'wpw' | 'apps';
  template: string;
  useCase: string;
};

// WPW Static Ad Templates
export const WPW_TEMPLATES: HookTemplate[] = [
  {
    id: 'wpw_installer_trust',
    name: 'Installer Trust',
    category: 'wpw',
    template: `Your wrap reflects your business.

Don't send customers low-quality prints.

Print it right.`,
    useCase: 'Brand trust, commercial wraps, high-end installs',
  },
  {
    id: 'wpw_speed_reliability',
    name: 'Speed + Reliability',
    category: 'wpw',
    template: `Your customer is ready.

Your printer should be too.

Order your wrap today.`,
    useCase: 'Speed messaging, turnaround focus',
  },
  {
    id: 'wpw_real_installers',
    name: 'Real Installers',
    category: 'wpw',
    template: `Printed for professionals.

Trusted by wrap shops across the U.S.

Wholesale wrap printing.`,
    useCase: 'B2B credibility, wholesale positioning',
  },
  {
    id: 'wpw_pain_point',
    name: 'Pain-Point Hook',
    category: 'wpw',
    template: `Bad prints cost real jobs.

We don't cut corners.

Print with confidence.`,
    useCase: 'Pain-point marketing, problem-solution',
  },
  {
    id: 'wpw_premium',
    name: 'Premium Quality',
    category: 'wpw',
    template: `High-value wraps deserve better prints.

Color accuracy. Consistency. Speed.

Upgrade your print.`,
    useCase: 'Premium positioning, quality focus',
  },
];

// App Static Ad Templates (RestylePro / WrapCommand / Visualizer)
export const APP_TEMPLATES: HookTemplate[] = [
  {
    id: 'app_stop_scroll',
    name: 'Stop Scroll Installer',
    category: 'apps',
    template: `Installers don't lose jobs because of bad installs.
They lose them before the install even happens.
Because customers can't visualize it.

That's the problem this fixes.`,
    useCase: 'Reel opens with install footage, instant relatability',
  },
  {
    id: 'app_founder_truth',
    name: 'Founder Truth',
    category: 'apps',
    template: `I didn't wake up wanting to build software.
I built this after watching installers lose jobs
over something that should've been simple.

Showing the vision.`,
    useCase: 'You\'re on camera, Shaun installing in background',
  },
  {
    id: 'app_proof_first',
    name: 'Proof First',
    category: 'apps',
    template: `This isn't a mockup.
This isn't stock footage.

This is a real shop.
A real install.
And a tool built for this exact moment.`,
    useCase: 'Real footage uploaded, want trust immediately',
  },
  {
    id: 'app_mic_drop',
    name: 'Fast Mic-Drop',
    category: 'apps',
    template: `No downloads.
No complicated software.
Just clear visuals that close jobs.`,
    useCase: 'Short reels (7-10s), story ads',
  },
  {
    id: 'app_why_matters',
    name: 'Why It Matters',
    category: 'apps',
    template: `When customers can't see it,
they hesitate.

When they hesitate,
installers lose the job.

That's the gap we fixed.`,
    useCase: 'Emotional but professional, founder + installer energy',
  },
  {
    id: 'app_side_by_side',
    name: 'Side-by-Side Visual',
    category: 'apps',
    template: `Left: guessing.
Right: seeing it clearly.

That difference?
That's a closed deal.`,
    useCase: 'Before/after visuals, split-screen ads',
  },
  {
    id: 'app_visualizer',
    name: 'Visualizer Hook',
    category: 'apps',
    template: `Stop guessing.

Show customers exactly what they're buying.

See it before it's wrapped.`,
    useCase: 'Visualizer tool promotion',
  },
  {
    id: 'app_no_downloads',
    name: 'No Downloads',
    category: 'apps',
    template: `No downloads.

Use it on your phone or desktop.

Built for real shops.`,
    useCase: 'Ease of use, accessibility focus',
  },
];

export const ALL_TEMPLATES = [...WPW_TEMPLATES, ...APP_TEMPLATES];

export function getTemplateById(id: string): HookTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: 'wpw' | 'apps'): HookTemplate[] {
  return ALL_TEMPLATES.filter(t => t.category === category);
}
