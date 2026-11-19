export interface ProjectItem {
  id: string;
  title: string;
  category: 'Poster' | 'Technical' | 'Video';
  aspect: '4:5' | '16:10' | '16:9';
  subtitle: string;
  description: string;
  tools: string[];
  year: string;
  color: string;
  videoUrl?: string;
  featured?: boolean;
}

export interface SkillItem {
  name: string;
  category: 'Design & Visual' | 'Video & Motion' | 'IT & Networking';
  level: 'Expert' | 'Advanced';
  tag: string;
  shortCode: string;
}

export interface WallFrameData {
  index: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  accentColor: string;
  primaryMetric: string;
  tags: string[];
}

export interface ExperienceItem {
  period: string;
  role: string;
  organization: string;
  location: string;
  responsibilities: string[];
}

export interface EducationItem {
  period: string;
  degree: string;
  institution: string;
  location: string;
  focus: string;
}

export const PORTFOLIO_DATA = {
  profile: {
    name: 'SareyBoth',
    role: 'Designer · Video Editor · IT Support',
    location: 'Phnom Penh, Cambodia',
    availability: 'Available for work',
    kicker: 'SareyBoth / Portfolio',
    headline: 'SareyBoth.',
    subhead: 'I design posters, edit video, and support computers and networks in Phnom Penh.',
    bioLong:
      'Management Information Systems student at SETEC Institute with cross-disciplinary expertise spanning visual print design, high-tempo commercial video editing, and hands-on IT infrastructure (MikroTik RouterOS, hardware diagnostics, and enterprise lab deployment).',
    rolesCycling: [
      'Designer.',
      'Video Editor.',
      'IT Support.',
      'MikroTik Admin.',
    ],
    contact: {
      email: 'sareyboth@gmail.com',
      phone: '+855 85 743 431',
      telegram: '@sareyboth',
      telegramUrl: 'https://t.me/sareyboth',
      facebook: 'SareyBoth',
      facebookUrl: 'https://facebook.com',
      locationShort: 'Phnom Penh, KH',
      timezone: 'UTC+7 (Indochina Time)',
    },
    disciplines: [
      {
        index: '01',
        title: 'Poster Design',
        desc: 'Editorial typography, traditional & modern cultural iconography, and high-impact commercial print key visuals.',
      },
      {
        index: '02',
        title: 'Video & Motion',
        desc: 'Rhythmic speed ramps, film emulation color grading, sound design, and commercial multi-camera cuts.',
      },
      {
        index: '03',
        title: 'IT & MikroTik',
        desc: 'RouterOS PPPoE servers, queue tree traffic management, workstation imaging, and component-level repairs.',
      },
    ],
  },

  wallFrames: [
    {
      index: '01 / 06',
      title: 'Khmer New Year Visual Campaign',
      subtitle: 'Cultural Identity & Print Direction',
      category: 'Design & Visual',
      description:
        'National celebration visual system celebrating Sangkranta with modern high-contrast typographic lockups and ceremonial motifs.',
      accentColor: '#d7ff3f',
      primaryMetric: '300 DPI CMYK',
      tags: ['Photoshop', 'Illustrator', 'Editorial Print'],
    },
    {
      index: '02 / 06',
      title: 'Commercial Product Key Visuals',
      subtitle: 'Commercial Advertising Suite',
      category: 'Design & Visual',
      description:
        'High-octane commercial product lighting, depth-of-field styling, and liquid splash dynamics created for brand campaign collateral.',
      accentColor: '#2549ff',
      primaryMetric: '4K Master Asset',
      tags: ['Key Visual', 'Photoshop', 'Art Direction'],
    },
    {
      index: '03 / 06',
      title: 'Automotive Motion & Speed-Ramp Reel',
      subtitle: 'Dynamic Speed Ramp Montage',
      category: 'Video & Motion',
      description:
        'Aggressive velocity curve editing synced to bass transients, dynamic motion blur transitions, and custom punchy sound design.',
      accentColor: '#ff6b12',
      primaryMetric: '60 FPS 4K DCI',
      tags: ['Premiere Pro', 'After Effects', 'Speed Ramping'],
    },
    {
      index: '04 / 06',
      title: 'Commercial & Wedding Editorial Cuts',
      subtitle: 'Narrative Wedding Teasers',
      category: 'Video & Motion',
      description:
        'Warm 35mm film emulation, atmospheric pacing, multi-track audio mastering, and clean dialogue restoration.',
      accentColor: '#f59e0b',
      primaryMetric: '10-Bit 4:2:2 Color',
      tags: ['Lumetri Color', 'Audio Mastering', 'Storytelling'],
    },
    {
      index: '05 / 06',
      title: 'MikroTik RouterOS & PPPoE Infrastructure',
      subtitle: 'ISP-Grade Bandwidth Queuing',
      category: 'IT & Networking',
      description:
        'PPPoE server configuration with dynamic simple queues, parent PCQ queues for fair bandwidth sharing, VLAN trunking, and NAT firewall rules.',
      accentColor: '#06b6d4',
      primaryMetric: 'RouterOS v7 / PPPoE',
      tags: ['MikroTik', 'Bandwidth Queue', 'Firewall'],
    },
    {
      index: '06 / 06',
      title: 'Lab Workstation & Network Deployment',
      subtitle: '40-Seat Enterprise Workstation Lab',
      category: 'IT & Networking',
      description:
        'End-to-end hardware testing, thermal paste re-piping, automated Windows system image broadcasting, and structured Cat6 cabling.',
      accentColor: '#10b981',
      primaryMetric: '40 Node Deployment',
      tags: ['Hardware Diagnostics', 'Cat6 LAN', 'Lab Ops'],
    },
  ] as WallFrameData[],

  projects: [
    {
      id: 'victory-day',
      title: 'Victory Over Genocide Day',
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'National Commemoration Key Visual',
      description:
        'Bold editorial poster designed for January 7 Victory Day, featuring monumental Khmer typography and dramatic atmospheric lighting.',
      tools: ['Adobe Photoshop', 'Adobe Illustrator'],
      year: '2025',
      color: '#d7ff3f',
      featured: true,
    },
    {
      id: 'khmer-new-year',
      title: 'Happy Khmer New Year',
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'Festival Poster & Cultural Visuals',
      description:
        'Celebratory Sangkranta poster intertwining sacred geometric patterns with clean contemporary typography and gold foil accents.',
      tools: ['Adobe Photoshop', 'Vector Assets'],
      year: '2025',
      color: '#f59e0b',
      featured: true,
    },
    {
      id: 'coffee-poster',
      title: 'Coffee Poster',
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'Artisanal Cafe Print Concept',
      description:
        'Minimalist Swiss-inspired coffee editorial print celebrating bean origins, roasting temperatures, and rich espresso textures.',
      tools: ['Adobe Illustrator', 'Photoshop'],
      year: '2024',
      color: '#b45309',
    },
    {
      id: 'independence-day',
      title: 'Independence Day',
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'November 9 National Day Visual',
      description:
        'Tribute to the Independence Monument of Cambodia with metallic copper hues, architectural precision lines, and formal Khmer heraldry.',
      tools: ['Photoshop', 'Illustrator'],
      year: '2024',
      color: '#2549ff',
      featured: true,
    },
    {
      id: 'kings-coronation',
      title: "King's Coronation Day",
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'Royal Celebration Design',
      description:
        'Regal deep-sapphire and gold foil composition commemorating His Majesty the King of Cambodia coronation.',
      tools: ['Photoshop', 'Typography'],
      year: '2024',
      color: '#fbbf24',
    },
    {
      id: 'ben2',
      title: 'Ben 2 (Pchum Ben)',
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'Ancestral Festival Graphic Series',
      description:
        'Traditional lantern glow and dawn reflections interpreting the spiritual atmosphere of Pchum Ben season.',
      tools: ['Photoshop', 'Branding'],
      year: '2024',
      color: '#ef4444',
    },
    {
      id: 'constitution-day',
      title: 'Constitution Day',
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'National Civic Poster',
      description:
        'Editorial legal typography honoring the Supreme Law of Cambodia with balanced layout ratios and clean emblem vectors.',
      tools: ['Illustrator', 'InDesign'],
      year: '2024',
      color: '#06b6d4',
    },
    {
      id: 'womens-day',
      title: "International Women's Day",
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'March 8 Empowerment Key Visual',
      description:
        'Vibrant coral and violet floral geometric poster expressing strength, equality, and leadership in modern Cambodia.',
      tools: ['Photoshop', 'Illustrator'],
      year: '2024',
      color: '#ec4899',
    },
    {
      id: 'king-father-day',
      title: "King Father's Commemoration Day",
      category: 'Poster',
      aspect: '4:5',
      subtitle: 'October 15 Memorial Tribute',
      description:
        'Somber high-contrast black-and-white portraiture accented by subtle gold foil framing in remembrance of the Late King Father Norodom Sihanouk.',
      tools: ['Photoshop', 'Retouching'],
      year: '2024',
      color: '#94a3b8',
    },

    // Technical Works
    {
      id: 'network-infra-01',
      title: 'Network Infrastructure Setup 01',
      category: 'Technical',
      aspect: '16:10',
      subtitle: 'MikroTik RouterOS Dual-WAN Deployment',
      description:
        'Configured MikroTik CCR/hEX hardware with dual-WAN load balancing, PPPoE server authentication, dynamic queuing per client IP, and strict firewall chains.',
      tools: ['MikroTik RouterOS', 'WinBox', 'Cat6 Cabling', 'PPPoE'],
      year: '2025',
      color: '#06b6d4',
      featured: true,
    },
    {
      id: 'system-lab-02',
      title: 'System & Lab Deployment 02',
      category: 'Technical',
      aspect: '16:10',
      subtitle: 'SETEC & Omnor Computer Lab Provisioning',
      description:
        'Multi-station workstation rollout: structured patch-panel punch-down, cable tracing, PXE boot imaging, and student permission policies.',
      tools: ['Workstation Imaging', 'Windows Server', 'Structured Cabling'],
      year: '2025',
      color: '#10b981',
      featured: true,
    },
    {
      id: 'hardware-diag-03',
      title: 'Hardware Diagnostics & Setup 03',
      category: 'Technical',
      aspect: '16:10',
      subtitle: 'Component-Level PC Overhaul & Tuning',
      description:
        'Diagnostic troubleshooting for motherboards, power delivery circuits, RAM timing stability, GPU repasting, and performance thermal benching.',
      tools: ['Hardware Diagnostics', 'Thermal Tuning', 'BIOS Config'],
      year: '2024',
      color: '#f59e0b',
    },
    {
      id: 'pppoe-config',
      title: 'PPPoE Configuration & Queue Trees',
      category: 'Technical',
      aspect: '16:10',
      subtitle: 'Bandwidth QoS & Subscriber Profile Management',
      description:
        'Configured subscriber rate limits, burst thresholds, IP pools, and automated lease expiry scripts in RouterOS terminal.',
      tools: ['MikroTik CLI', 'RouterOS Scripting', 'Bandwidth Queues'],
      year: '2024',
      color: '#6366f1',
    },

    // Video Works
    {
      id: 'video-foodpanda',
      title: 'VideoFoodpanda',
      category: 'Video',
      aspect: '16:9',
      subtitle: 'Commercial Delivery Social Campaign',
      description:
        'High-energy vertical and horizontal video edits with quick match cuts, kinetic text animation, and ambient sound design.',
      tools: ['Premiere Pro', 'After Effects', 'Sound Foley'],
      year: '2025',
      color: '#ec4899',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      featured: true,
    },
    {
      id: 'carmotion',
      title: 'Carmotion',
      category: 'Video',
      aspect: '16:9',
      subtitle: 'Automotive Rolling Reel & Speed-Ramping',
      description:
        'Smooth gimbal roller footage enhanced with aggressive speed ramps, directional sound design, and rich automotive reflections.',
      tools: ['Premiere Pro', 'Speed Ramps', 'Color Grading'],
      year: '2024',
      color: '#ff6b12',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      featured: true,
    },
    {
      id: 'acleda-bank',
      title: 'Acleda Bank',
      category: 'Video',
      aspect: '16:9',
      subtitle: 'Corporate Event & Executive Highlights',
      description:
        'Professional corporate documentary cut with broadcast-standard lower thirds, noise-denoised speech tracks, and clean brand pacing.',
      tools: ['Premiere Pro', 'Speech Denoise', 'Color Space'],
      year: '2024',
      color: '#2549ff',
    },
    {
      id: 'wedding-coming-soon',
      title: 'Wedding Coming Soon',
      category: 'Video',
      aspect: '16:9',
      subtitle: 'Cinematic Teaser Trailer',
      description:
        'Emotional wedding teaser featuring anamorphic letterboxing, soft highlight rolls, and custom orchestrated audio transitions.',
      tools: ['Premiere Pro', 'Lumetri Color', 'Sound Design'],
      year: '2024',
      color: '#f59e0b',
    },
    {
      id: 'prewedding-preview',
      title: 'Prewedding Preview',
      category: 'Video',
      aspect: '16:9',
      subtitle: 'Golden Hour Cinematic Montage',
      description:
        'Captured during sunset in Phnom Penh with 35mm film emulation LUTs, natural bloom, and romantic musical pacing.',
      tools: ['Premiere Pro', 'Film Emulsion', 'Slow Motion'],
      year: '2024',
      color: '#d7ff3f',
    },
    {
      id: 'kl-pain',
      title: 'KL Pain',
      category: 'Video',
      aspect: '16:9',
      subtitle: 'High-Intensity Fitness Reel',
      description:
        'Rhythmic sync cuts to industrial trap beats, motion shakes, flash frames, and stylized contrast grading.',
      tools: ['Premiere Pro', 'After Effects', 'Beat Sync'],
      year: '2024',
      color: '#ef4444',
    },
  ] as ProjectItem[],

  skills: [
    // Design & Visual
    {
      name: 'Adobe Photoshop',
      category: 'Design & Visual',
      level: 'Expert',
      tag: 'Print & Digital',
      shortCode: 'Ps',
    },
    {
      name: 'Adobe Illustrator',
      category: 'Design & Visual',
      level: 'Advanced',
      tag: 'Vector & Identity',
      shortCode: 'Ai',
    },
    {
      name: 'Poster & Print Layout',
      category: 'Design & Visual',
      level: 'Expert',
      tag: 'Typography & Grid',
      shortCode: 'Print',
    },
    {
      name: 'Brand Key Visuals',
      category: 'Design & Visual',
      level: 'Advanced',
      tag: 'Art Direction',
      shortCode: 'KV',
    },

    // Video & Motion
    {
      name: 'Adobe Premiere Pro',
      category: 'Video & Motion',
      level: 'Expert',
      tag: 'Editorial & Pacing',
      shortCode: 'Pr',
    },
    {
      name: 'Adobe After Effects',
      category: 'Video & Motion',
      level: 'Advanced',
      tag: 'Motion Graphics',
      shortCode: 'Ae',
    },
    {
      name: 'Color Grading & Speed-Ramping',
      category: 'Video & Motion',
      level: 'Advanced',
      tag: 'Lumetri & Curves',
      shortCode: 'Grade',
    },
    {
      name: 'Sound Design & Audio Pacing',
      category: 'Video & Motion',
      level: 'Advanced',
      tag: 'Foley & EQ',
      shortCode: 'Audio',
    },

    // IT & Networking
    {
      name: 'MikroTik RouterOS',
      category: 'IT & Networking',
      level: 'Advanced',
      tag: 'PPPoE & Queuing',
      shortCode: 'MikroTik',
    },
    {
      name: 'Computer Hardware Diagnostics',
      category: 'IT & Networking',
      level: 'Expert',
      tag: 'Troubleshooting & Thermal',
      shortCode: 'HW',
    },
    {
      name: 'Workstation & Lab Setup',
      category: 'IT & Networking',
      level: 'Expert',
      tag: 'Bulk OS Imaging',
      shortCode: 'Lab',
    },
    {
      name: 'Microsoft Office Instruction',
      category: 'IT & Networking',
      level: 'Expert',
      tag: 'Curriculum & Teaching',
      shortCode: 'Office',
    },
    {
      name: 'LAN / Cabling & Network Infrastructure',
      category: 'IT & Networking',
      level: 'Advanced',
      tag: 'Cat6 & Patch Panels',
      shortCode: 'LAN',
    },
  ] as SkillItem[],

  experience: [
    {
      period: '2025 - 2026',
      role: 'Computer Teacher',
      organization: 'Omnor Cambodia / Joy of Cambodia Organization',
      location: 'Phnom Penh, Cambodia',
      responsibilities: [
        'Taught Microsoft Office (Word, Excel, PowerPoint) and computer foundational literacy to eager students.',
        'Maintained computer lab reliability, assisting students and staff in troubleshooting hardware issues and repairing workstations.',
        'Configured classroom local area network cabling and performed software reinstalls across lab machines.',
      ],
    },
  ] as ExperienceItem[],

  education: [
    {
      period: '2022 Feb - Present',
      degree: 'Associate and Bachelor of Management Information System (MIS)',
      institution: 'SETEC Institute',
      location: 'Phnom Penh, Cambodia',
      focus: 'Information Systems, Network Administration, Database Management, and Enterprise IT.',
    },
    {
      period: '2010 - 2021',
      degree: 'High School Diploma',
      institution: 'Psa Derm Thkov High School',
      location: 'Phnom Penh, Cambodia',
      focus: 'General High School Studies with foundational mathematics, literature, and sciences.',
    },
  ] as EducationItem[],

  terminalStatuses: [
    'online',
    'designing posters',
    'grading motion cuts',
    'configuring MikroTik',
    'tuning RouterOS queues',
    'rendering 4K speed ramps',
    'benchmarking workstation thermals',
  ],
};
