/**
 * Launch content, copied verbatim from the design comp
 * (design-source/Mercer Website v2.dc.html). See DATA-MODEL.md.
 * Rows marked isSample are the comp's own "SAMPLE CONTENT" — visible only
 * while Settings → "Show sample content" is on.
 */

export const SETTINGS_SEED = {
  companyName: 'Mercer Technology Solutions',
  contactName: 'Holden Mercer',
  email: 'holden.mercer@outlook.com',
  phone: '+1 (407) 239-8251',
  addressLine1: '301 E Jefferson St',
  addressLine2: 'Phoenix, AZ 85004',
  locationTag: 'PHOENIX, AZ · 33.45°N 112.07°W',
  companyStatement:
    'Mercer Technology Solutions helps organizations plan, build and connect the technology they run on: enterprise software, cloud environments and the integrations between them.',
  companyOverview: '',
  companyFocus: 'Enterprise software, cloud and systems integration',
  privacyPolicy: '',
  showSamples: true,
  showBudget: true,
  enquiriesOpen: true,
};

export const SERVICES_SEED = [
  {
    slug: 'enterprise-software',
    name: 'Enterprise Software',
    status: 'published',
    isSample: false,
    short: 'Software shaped around how your organization operates, from new platforms to modernizing the systems you already depend on.',
    overview:
      'We plan, design and build enterprise applications that fit the way your teams work, and modernize existing systems where they have become a constraint. Work starts with your processes and the systems around them, not a predetermined platform.',
    problems: ['Core processes run across disconnected or ageing applications', 'Off-the-shelf tools no longer fit how teams work', 'Changes to critical systems are slow and risky'],
    scope: ['Application architecture', 'Custom application development', 'Legacy system modernization', 'Workflow automation'],
    considerations: [
      { title: 'Existing system dependencies', body: 'New software rarely starts from a blank slate. Mapping the systems, data and teams it will depend on keeps scope realistic.' },
      { title: 'Data migration and continuity', body: 'Plan how existing records move across, how they are validated, and how operations continue during the transition.' },
      { title: 'Security and access', body: 'Define who needs access to what early, so roles, permissions and audit requirements are designed in rather than added later.' },
      { title: 'Adoption and change', body: 'Software only delivers value when it is used. Training, rollout sequencing and feedback loops belong in the plan.' },
    ],
    imageLabel: 'IMAGE — modern technology office, team at work',
  },
  {
    slug: 'cloud-solutions',
    name: 'Cloud Solutions',
    status: 'published',
    isSample: false,
    short: 'Cloud environments planned around your workloads, costs and compliance needs, with a clear path from where you are today.',
    overview:
      'We help organizations assess, plan and move to cloud environments, and bring structure to environments that have grown without a clear architecture. Decisions are grounded in workload needs, cost and governance.',
    problems: ['Infrastructure costs and capacity are hard to predict', 'On-premise environments limit how quickly teams can deliver', 'Cloud environments have grown without a clear architecture'],
    scope: ['Cloud readiness assessment', 'Migration planning', 'Cloud architecture', 'Governance and cost visibility'],
    considerations: [
      { title: 'Workload suitability', body: 'Not every workload benefits from moving. Assess each one for cost, performance and operational fit.' },
      { title: 'Compliance and data residency', body: 'Confirm regulatory, contractual and data-location requirements before choosing services or regions.' },
      { title: 'Cost visibility', body: 'Agree how spend will be tracked and owned so costs stay predictable after migration.' },
      { title: 'Operational ownership', body: 'Decide who runs, monitors and supports each environment once it is live.' },
    ],
    imageLabel: 'IMAGE — minimal cloud infrastructure architecture',
  },
  {
    slug: 'systems-integration',
    name: 'Systems Integration',
    status: 'published',
    isSample: false,
    short: "Connect the applications and data your teams rely on, so information moves reliably and work isn't repeated between systems.",
    overview:
      'We design and implement the connections between your business systems: APIs, data synchronization and event flows. The aim is dependable, observable integrations that reduce manual work and give teams a consistent view of their data.',
    problems: ['Data is re-entered by hand between systems', 'Reporting depends on manual reconciliation', 'Each new tool adds to the integration backlog'],
    scope: ['Integration architecture', 'API design and development', 'Data synchronization', 'Middleware and event flows'],
    considerations: [
      { title: 'System of record', body: "For each type of data, agree which system is authoritative so integrations don't create conflicting versions." },
      { title: 'Error handling and monitoring', body: 'Integrations fail occasionally. Define how failures are detected, retried and reported.' },
      { title: 'Change and versioning', body: "Plan for the systems on either side changing over time, so a vendor update doesn't break a critical flow." },
      { title: 'Security between systems', body: 'Credentials, permissions and data in transit need the same care as any user-facing application.' },
    ],
    imageLabel: 'IMAGE — connected nodes, technical diagram',
  },
  {
    // Draft in the comp: "publish only after this service is confirmed"
    slug: 'infrastructure-managed-services',
    name: 'Infrastructure & Managed Services',
    status: 'published',
    isSample: true,
    short: '[Service description — publish only after this service is confirmed]',
    overview: '[Overview pending confirmation that this service is offered.]',
    problems: ['[Problem statement — to be confirmed]'],
    scope: ['[Scope — to be confirmed]'],
    considerations: [{ title: '[Consideration — to be confirmed]', body: '[Details pending]' }],
    imageLabel: 'IMAGE — data center architecture, blue lighting',
  },
];

export const CONTENT_SEED: Record<string, { fields: Record<string, unknown>; isSample?: boolean }[]> = {
  stage: [
    ['Business needs', 'Start with the outcomes the organization needs, the constraints it works within, and who depends on the result.'],
    ['System architecture', 'Map current systems, data flows and dependencies before choosing what to build, buy or change.'],
    ['Integration', 'Plan how new and existing systems will exchange data reliably and securely.'],
    ['Delivery', 'Deliver in stages that can be tested, adopted and measured against the original need.'],
    ['Ongoing improvement', 'Treat launch as a starting point: monitor, refine and plan the next stage.'],
  ].map(([name, body]) => ({ fields: { name, body } })),
  layer: [
    { code: 'L4', name: 'Business applications', desc: 'Workflows, portals and line-of-business software', services: ['enterprise-software', 'systems-integration'] },
    { code: 'L3', name: 'Data & integration', desc: 'APIs, data flows and synchronization', services: ['systems-integration', 'enterprise-software'] },
    { code: 'L2', name: 'Cloud platform', desc: 'Hosting, environments and governance', services: ['cloud-solutions'] },
    { code: 'L1', name: 'Infrastructure', desc: 'Networks, compute and storage', services: ['cloud-solutions', 'infrastructure-managed-services'] },
  ].map((fields) => ({ fields })),
  principle: [
    ['Precise', 'Decisions are documented, scoped and traceable to the business need behind them.'],
    ['Dependable', 'Systems are built to be run, supported and changed safely over time.'],
    ['Forward-looking', 'Today’s work should make the next stage of growth easier, not harder.'],
    ['Human', 'Technology serves the people who use it. Plain language, clear ownership.'],
  ].map(([name, body]) => ({ fields: { name, body } })),
  'industry-field': [
    ['Industry name', 'The sector, named as the company describes it'],
    ['Business challenges', 'The operational problems specific to that sector'],
    ['Relevant solutions', 'Which capabilities apply, and how'],
    ['Verified use cases', 'Real, approved examples of the work'],
    ['Related case studies', 'Linked once clients approve publication'],
  ].map(([name, desc]) => ({ fields: { name, desc } })),
  industry: [
    { name: 'Healthcare', challenges: 'Patient, scheduling and billing data spread across systems that were never designed to talk to each other.', solutions: 'Systems Integration, Enterprise Software', useCase: 'Connecting scheduling, records and billing so staff enter information once.', related: 'Unifying patient scheduling across legacy systems' },
    { name: 'Financial Services', challenges: 'Core platforms that are expensive to run and slow to change, under strict compliance requirements.', solutions: 'Cloud Solutions, Systems Integration', useCase: 'Staged migration of a claims platform with compliance checks at each step.', related: 'Moving a claims platform to the cloud in stages' },
    { name: 'Manufacturing', challenges: 'Production planning held in spreadsheets, with little visibility between the floor and the office.', solutions: 'Enterprise Software, Systems Integration', useCase: 'Replacing manual planning with an application connected to inventory data.', related: 'Replacing spreadsheet-based production planning' },
    { name: 'Logistics & Distribution', challenges: 'Order, warehouse and carrier systems that drift out of sync and need manual reconciliation.', solutions: 'Systems Integration, Cloud Solutions', useCase: 'Event-driven integration between order management and warehouse systems.', related: 'None yet' },
  ].map((fields) => ({ fields, isSample: true })),
  job: [
    {
      slug: 'senior-integration-engineer',
      title: 'Senior Integration Engineer',
      department: 'Engineering',
      location: 'Phoenix, AZ',
      type: 'Full-time',
      about:
        'Design and build the integrations that connect client business systems: APIs, data synchronization and event flows. You will work directly with client teams to understand their systems before writing any code.',
      requirements: [
        'Experience designing and operating production integrations',
        'Strong knowledge of REST APIs, messaging and data mapping',
        'Comfort explaining technical trade-offs to non-technical stakeholders',
        'A habit of building monitoring and error handling in from the start',
      ],
      apply: 'Send your CV and a short note about an integration you are proud of. Sample role: confirm details before publishing.',
    },
    {
      slug: 'cloud-solutions-architect',
      title: 'Cloud Solutions Architect',
      department: 'Cloud',
      location: 'Phoenix, AZ / Hybrid',
      type: 'Full-time',
      about: 'Lead cloud readiness assessments and migration plans, and help clients bring structure to environments that have grown without a clear architecture.',
      requirements: [
        'Hands-on experience planning and running cloud migrations',
        'Understanding of governance, security and cost management',
        'Clear written communication for architecture documents',
        'Experience working with regulated organizations is a plus',
      ],
      apply: 'Send your CV and a short note on a migration you led. Sample role: confirm details before publishing.',
    },
  ].map((fields) => ({ fields, isSample: true })),
};

export const CASE_STUDIES_SEED = [
  {
    slug: 'patient-scheduling',
    serviceSlug: 'systems-integration',
    title: 'Unifying patient scheduling across legacy systems',
    client: 'Sample client: regional healthcare network',
    context: 'A multi-site healthcare provider running separate scheduling, records and billing systems at each location.',
    challenge: 'Staff re-entered appointment details several times, and reporting relied on manual reconciliation at month end.',
    approach: 'Mapped every system and data flow first, agreed a system of record for each data type, then integrated one site before rolling out.',
    scope: 'Integration architecture, API development, data synchronization, monitoring and alerting.',
    implementation: 'Phased rollout site by site, running old and new flows in parallel until each was validated.',
    outcomes: 'Illustrative outcome: appointments entered once and visible everywhere. Replace with verified results.',
  },
  {
    slug: 'claims-cloud',
    serviceSlug: 'cloud-solutions',
    title: 'Moving a claims platform to the cloud in stages',
    client: 'Sample client: mid-size insurance provider',
    context: 'An insurer running its claims platform on ageing on-premise infrastructure approaching end of support.',
    challenge: 'Capacity was hard to predict during peak periods, and every change required a long release window.',
    approach: 'Assessed each workload for suitability, defined governance and cost ownership, then migrated in planned waves.',
    scope: 'Cloud readiness assessment, migration planning, cloud architecture, cost visibility.',
    implementation: 'Non-critical workloads moved first; the core claims engine moved last, after rehearsals.',
    outcomes: 'Illustrative outcome: predictable capacity and shorter release cycles. Replace with verified results.',
  },
  {
    slug: 'production-planning',
    serviceSlug: 'enterprise-software',
    title: 'Replacing spreadsheet-based production planning',
    client: 'Sample client: industrial components manufacturer',
    context: 'A manufacturer planning production across several lines using shared spreadsheets.',
    challenge: 'Plans went out of date within hours, and the floor had no live view of inventory or priorities.',
    approach: 'Worked with planners and supervisors to model the real process before designing the application.',
    scope: 'Custom application development, workflow automation, inventory integration.',
    implementation: 'Delivered in three releases, each adopted by one production line before the next.',
    outcomes: 'Illustrative outcome: one shared, current plan for every line. Replace with verified results.',
  },
].map((c) => ({ ...c, status: 'published' as const, isSample: true }));

export const ARTICLES_SEED = [
  {
    slug: 'integration-before-software',
    category: 'Integration',
    title: 'Map your integrations before you choose new software',
    excerpt: 'Most software projects inherit dependencies nobody wrote down. A short mapping exercise up front changes the scope, cost and risk of what you buy.',
    readingMinutes: 6,
    body: [
      'New software rarely arrives into an empty space. It has to exchange data with finance, operations and reporting systems that already exist, and each of those connections carries assumptions.',
      'Before comparing vendors, list every system the new application will touch, what data moves between them, and which system is authoritative for each type of record.',
      'This map becomes the basis for realistic scope. It also tells you which integrations are critical on day one and which can follow later.',
    ].join('\n\n'),
  },
  {
    slug: 'cloud-readiness',
    category: 'Cloud',
    title: 'What a cloud readiness review should answer',
    excerpt: 'Not every workload benefits from moving. A useful review tells you which ones do, what it will cost, and who will own them afterwards.',
    readingMinutes: 5,
    body: [
      'A cloud readiness review should end with decisions, not a slide of logos. For each workload, it should say whether to move it, when, and why.',
      'It should also cover compliance and data residency, expected running costs, and who will operate each environment once it is live.',
      'Without those answers, migrations tend to move problems rather than solve them.',
    ].join('\n\n'),
  },
  {
    slug: 'modernizing-core-systems',
    category: 'Architecture',
    title: 'Modernizing a core system without stopping the business',
    excerpt: 'Replacing a system everyone depends on is less risky when you plan it as a sequence of small, reversible steps.',
    readingMinutes: 7,
    body: [
      'Core systems are hard to replace because so much depends on them. A single cut-over date concentrates all of that risk into one weekend.',
      'A staged approach moves one capability at a time, runs old and new side by side, and keeps a way back at each step.',
      'It takes more planning, but each stage can be tested, adopted and measured before the next begins.',
    ].join('\n\n'),
  },
  {
    slug: 'system-of-record',
    category: 'Integration',
    title: 'Choosing a system of record',
    excerpt: 'When two systems both think they own customer data, integrations create conflicts instead of clarity.',
    readingMinutes: 4,
    body: [
      'For every type of data, one system should be the source of truth. Others can read it, cache it or enrich it, but they should not compete to own it.',
      'Agreeing this early is mostly an organizational conversation, not a technical one.',
      'Once it is settled, integration design becomes much simpler.',
    ].join('\n\n'),
  },
].map((a) => ({ ...a, status: 'published' as const, isSample: true, author: '' }));
