// Static vocabulary for the synthetic BUS2010 world. Every person, company and
// record built from this is invented. Names are combinations, not real people.

export const SKILL_CATEGORY = {
  'SK-SQL-01': 'data', 'SK-PY-01': 'data', 'SK-PBI-01': 'business intelligence', 'SK-TAB-01': 'business intelligence',
  'SK-XLS-01': 'business tools', 'SK-STAT-01': 'data', 'SK-JIRA-01': 'project tools', 'SK-AGL-01': 'ways of working',
  'SK-ML-01': 'ai', 'SK-AVN-01': 'domain', 'SK-SCM-01': 'domain', 'SK-GIS-01': 'data', 'SK-ARB-01': 'language',
  'SK-COM-01': 'professional'
};

// 30 terms added for the shared database (the first 14 come from src/data.js unchanged).
export const NEW_SKILLS = [
  ['SK-JS-01', 'JavaScript web development', ['javascript', 'typescript', 'front-end scripting'], 'software'],
  ['SK-REACT-01', 'React front-end', ['react', 'next.js', 'component ui'], 'software'],
  ['SK-API-01', 'REST API design', ['rest api', 'endpoints', 'json api', 'postman'], 'software'],
  ['SK-GIT-01', 'Git version control', ['git', 'github', 'pull requests', 'branching'], 'software'],
  ['SK-CLOUD-01', 'Cloud fundamentals', ['aws', 'azure', 'google cloud', 'cloud deployment'], 'infrastructure'],
  ['SK-DOCK-01', 'Docker containers', ['docker', 'containers', 'docker compose'], 'infrastructure'],
  ['SK-SEC-01', 'Cybersecurity fundamentals', ['security', 'threat analysis', 'vulnerability scanning', 'soc'], 'security'],
  ['SK-NET-01', 'Computer networking', ['networking', 'tcp/ip', 'routing', 'network configuration'], 'infrastructure'],
  ['SK-DL-01', 'Deep learning', ['deep learning', 'pytorch', 'tensorflow', 'neural networks'], 'ai'],
  ['SK-NLP-01', 'Natural language processing', ['nlp', 'text classification', 'language models', 'arabic nlp'], 'ai'],
  ['SK-CV-01', 'Computer vision', ['computer vision', 'image classification', 'object detection', 'opencv'], 'ai'],
  ['SK-LLM-01', 'LLM application building', ['prompt engineering', 'rag', 'chatbots', 'llm apis'], 'ai'],
  ['SK-ETL-01', 'Data pipelines and ETL', ['etl', 'data pipelines', 'airflow', 'data warehouse'], 'data'],
  ['SK-SPARK-01', 'Big data with Spark', ['spark', 'pyspark', 'big data', 'databricks'], 'data'],
  ['SK-R-01', 'R programming', ['r', 'rstudio', 'tidyverse', 'ggplot'], 'data'],
  ['SK-FIN-01', 'Financial analysis', ['financial modelling', 'valuation', 'budgeting', 'forecasting'], 'business'],
  ['SK-ACC-01', 'Accounting basics', ['accounting', 'bookkeeping', 'ifrs', 'reconciliation'], 'business'],
  ['SK-MKT-01', 'Digital marketing analytics', ['digital marketing', 'google analytics', 'campaigns', 'social media analytics'], 'business'],
  ['SK-UX-01', 'UX research', ['user research', 'usability testing', 'interviews', 'personas', 'customer journey', 'customer journey mapping', 'user journey', 'usability research'], 'design'],
  ['SK-FIG-01', 'Figma prototyping', ['figma', 'wireframes', 'prototypes', 'ui design'], 'design'],
  ['SK-PMP-01', 'Project planning', ['project plan', 'gantt chart', 'ms project', 'scheduling'], 'ways of working'],
  ['SK-RISK-01', 'Risk analysis', ['risk register', 'risk assessment', 'mitigation'], 'business'],
  ['SK-ESG-01', 'Sustainability reporting', ['esg', 'sustainability', 'carbon accounting', 'ghg emissions'], 'domain'],
  ['SK-ENR-01', 'Energy systems domain', ['energy', 'solar', 'oil and gas', 'power grid', 'renewables'], 'domain'],
  ['SK-HLT-01', 'Healthcare operations domain', ['healthcare', 'hospital', 'clinic', 'patient flow'], 'domain'],
  ['SK-FINT-01', 'Fintech and payments domain', ['fintech', 'payments', 'banking', 'digital wallets'], 'domain'],
  ['SK-CAD-01', 'CAD and 3D modelling', ['autocad', 'cad', 'solidworks', '3d modelling'], 'engineering'],
  ['SK-IOT-01', 'IoT and sensors', ['iot', 'sensors', 'arduino', 'raspberry pi'], 'engineering'],
  ['SK-ROB-01', 'Robotics and ROS', ['robotics', 'ros', 'autonomous systems', 'drones'], 'engineering'],
  ['SK-WRT-01', 'Professional English writing', ['report writing', 'technical writing', 'documentation'], 'professional']
];

const S = (code) => `SK-${code}-01`;

export const SECTORS = {
  aviation: {
    skills: ['AVN', 'SQL', 'PY', 'PBI', 'XLS', 'STAT'].map(S), adj: ['Aviation', 'Airport', 'Airline'],
    roles: ['data analyst', 'operations analyst', 'BI developer', 'data scientist'],
    aims: ['improve on-time performance for airline operations', 'understand passenger flows through airport terminals', 'reduce aircraft turnaround delays', 'forecast seat demand on regional routes', 'make crew scheduling more reliable'],
    work: ['flight delay and turnaround data', 'passenger and baggage flow data', 'route revenue and seat demand data', 'aircraft maintenance logs'],
    nouns: ['Aero Services', 'Airside Analytics', 'Air Cargo', 'Aviation Academy']
  },
  logistics: {
    skills: ['SCM', 'SQL', 'PY', 'XLS', 'GIS', 'PBI'].map(S), adj: ['Logistics', 'Freight', 'Supply Chain'],
    roles: ['data analyst', 'operations analyst', 'business analyst', 'data scientist'],
    aims: ['make freight and port logistics more reliable', 'cut empty truck kilometres in last-mile delivery', 'forecast warehouse stock levels', 'map delivery routes across the emirates'],
    work: ['shipment tracking data', 'warehouse inventory records', 'port container movements', 'delivery route and fuel data'],
    nouns: ['Freight', 'Logistics', 'Shipping Lines', 'Distribution']
  },
  healthcare: {
    skills: ['HLT', 'PBI', 'SQL', 'STAT', 'XLS', 'PY'].map(S), adj: ['Healthcare', 'Hospital', 'Clinical Operations'],
    roles: ['data analyst', 'BI developer', 'operations analyst', 'data scientist'],
    aims: ['shorten clinic waiting times', 'plan hospital bed capacity', 'improve patient flow between departments', 'track appointment no-shows'],
    work: ['bed occupancy and admissions data', 'clinic appointment records', 'patient flow timestamps', 'pharmacy stock data'],
    nouns: ['Health Partners', 'Clinics', 'Medical Centre', 'Care Network']
  },
  'public sector': {
    skills: ['GIS', 'PY', 'STAT', 'ARB', 'WRT', 'COM'].map(S), adj: ['Civic Data', 'Public Services', 'Smart City'],
    roles: ['data analyst', 'data scientist', 'business analyst', 'project coordinator'],
    aims: ['apply machine learning to open data and city services', 'make public service data easier for residents to use', 'measure the use of parks and public transport', 'publish clear open datasets in Arabic and English'],
    work: ['open city-services datasets', 'public transport ridership data', 'resident survey responses', 'building permit records'],
    nouns: ['Civic Data Office', 'Municipal Lab', 'Public Services Studio', 'Urban Data Unit']
  },
  technology: {
    skills: ['JS', 'REACT', 'API', 'GIT', 'CLOUD', 'DOCK', 'PY'].map(S), adj: ['Software', 'Platform', 'Product Engineering'],
    roles: ['software developer', 'cloud engineer', 'AI engineer', 'UX designer', 'data scientist'],
    aims: ['build web products that thousands of people use', 'ship reliable cloud services', 'build AI features into real apps', 'design apps that are easy to use in Arabic and English'],
    work: ['web application features', 'internal APIs and services', 'cloud infrastructure scripts', 'mobile app usage data'],
    nouns: ['Software', 'Digital Labs', 'Cloud Works', 'Apps Studio']
  },
  finance: {
    skills: ['FIN', 'ACC', 'XLS', 'SQL', 'PY', 'RISK', 'FINT'].map(S), adj: ['Finance', 'Banking', 'Payments'],
    roles: ['finance analyst', 'data analyst', 'business analyst', 'data scientist'],
    aims: ['understand how banks manage credit risk', 'build financial models for growing companies', 'analyse digital payment trends in the UAE', 'automate monthly financial reporting'],
    work: ['loan and repayment data', 'monthly management accounts', 'card and wallet transaction data', 'budget and forecast spreadsheets'],
    nouns: ['Capital', 'Payments', 'Finance House', 'Investments']
  },
  energy: {
    skills: ['ENR', 'ESG', 'PY', 'IOT', 'STAT', 'CAD'].map(S), adj: ['Energy', 'Renewables', 'Utilities'],
    roles: ['data analyst', 'sustainability analyst', 'data scientist', 'operations analyst'],
    aims: ['support the shift to solar and clean energy', 'measure and reduce carbon emissions', 'predict equipment faults from sensor data', 'report on sustainability targets'],
    work: ['solar plant output and sensor data', 'carbon emissions inventories', 'grid load measurements', 'equipment maintenance histories'],
    nouns: ['Energy Labs', 'Solar', 'Power Systems', 'Clean Energy']
  },
  retail: {
    skills: ['MKT', 'SQL', 'XLS', 'PBI', 'TAB', 'UX'].map(S), adj: ['Retail', 'E-commerce', 'Consumer Insights'],
    roles: ['marketing analyst', 'data analyst', 'business analyst', 'UX designer'],
    aims: ['understand why customers return to a store', 'improve online shopping journeys', 'forecast seasonal demand for Ramadan and Eid', 'measure marketing campaign results'],
    work: ['point-of-sale transactions', 'online store clickstream data', 'loyalty programme data', 'campaign performance reports'],
    nouns: ['Retail Group', 'Markets', 'Online Store', 'Trading']
  },
  hospitality: {
    skills: ['COM', 'MKT', 'XLS', 'ARB', 'UX'].map(S), adj: ['Hospitality', 'Hotel', 'Tourism'],
    roles: ['marketing analyst', 'operations analyst', 'business analyst', 'project coordinator'],
    aims: ['improve guest experience in hotels', 'understand tourism trends in the UAE', 'plan events that run smoothly', 'analyse hotel booking patterns'],
    work: ['booking and occupancy data', 'guest review text', 'event schedules and budgets', 'tourism arrival statistics'],
    nouns: ['Hotels', 'Hospitality', 'Resorts', 'Events']
  },
  'real estate': {
    skills: ['FIN', 'XLS', 'GIS', 'CAD', 'MKT'].map(S), adj: ['Real Estate', 'Property', 'Urban Development'],
    roles: ['finance analyst', 'data analyst', 'business analyst', 'project coordinator'],
    aims: ['understand rental and property price trends', 'plan sustainable new neighbourhoods', 'analyse property investment returns'],
    work: ['rental listings and transaction data', 'site plans and maps', 'property investment models'],
    nouns: ['Properties', 'Developments', 'Real Estate', 'Communities']
  },
  education: {
    skills: ['WRT', 'COM', 'UX', 'LLM', 'PY'].map(S), adj: ['EdTech', 'Learning', 'Education'],
    roles: ['AI engineer', 'UX designer', 'data analyst', 'project coordinator'],
    aims: ['build learning tools that help students study', 'use AI tutors to support schoolchildren', 'measure what makes online courses work'],
    work: ['course engagement data', 'student feedback surveys', 'learning app prototypes'],
    nouns: ['Learning', 'Academy', 'EdTech', 'Tutoring']
  },
  telecommunications: {
    skills: ['NET', 'CLOUD', 'SEC', 'PY', 'SQL'].map(S), adj: ['Telecom', 'Network', 'Connectivity'],
    roles: ['cybersecurity analyst', 'cloud engineer', 'data analyst', 'software developer'],
    aims: ['keep networks secure from cyber attacks', 'improve mobile network coverage', 'analyse network traffic at scale'],
    work: ['network traffic logs', 'security alert data', 'cell tower performance data'],
    nouns: ['Networks', 'Telecom', 'Connect', 'Communications']
  },
  media: {
    skills: ['MKT', 'NLP', 'WRT', 'FIG', 'UX'].map(S), adj: ['Media', 'Digital Content', 'Newsroom'],
    roles: ['marketing analyst', 'AI engineer', 'UX designer', 'data analyst'],
    aims: ['use language AI on Arabic news content', 'grow audiences for digital content', 'design better reading experiences'],
    work: ['article and video engagement data', 'Arabic and English news text', 'social media audience data'],
    nouns: ['Media House', 'Studios', 'Digital Media', 'Publishing']
  },
  manufacturing: {
    skills: ['IOT', 'ROB', 'CAD', 'PY', 'STAT', 'SCM'].map(S), adj: ['Manufacturing', 'Industrial', 'Factory Automation'],
    roles: ['data scientist', 'operations analyst', 'AI engineer', 'data analyst'],
    aims: ['use robots and sensors to make factories safer', 'predict machine breakdowns before they happen', 'apply computer vision to quality inspection'],
    work: ['production line sensor data', 'quality inspection images', 'machine maintenance records'],
    nouns: ['Fabrication', 'Industries', 'Advanced Manufacturing', 'Robotics']
  }
};

export const SECTOR_WEIGHTS = [['aviation', 10], ['logistics', 9], ['healthcare', 9], ['public sector', 7], ['technology', 14], ['finance', 10],
  ['energy', 8], ['retail', 7], ['hospitality', 4], ['real estate', 4], ['education', 5], ['telecommunications', 5], ['media', 4], ['manufacturing', 6]];

export const ROLES = {
  'data analyst': { skills: ['SQL', 'PY', 'XLS', 'PBI', 'TAB', 'STAT'].map(S), title: 'Data Analyst', goalVerb: 'Use data analysis to', jobVerb: 'Analyse',
    tasks: ['Clean and join the source tables', 'Build a weekly KPI report', 'Present findings to the team lead'] },
  'operations analyst': { skills: ['XLS', 'SQL', 'PBI', 'STAT', 'PMP'].map(S), title: 'Operations Analyst', goalVerb: 'Work in operations to', jobVerb: 'Study',
    tasks: ['Map the current process', 'Find the main causes of delay', 'Suggest and test one improvement'] },
  'BI developer': { skills: ['PBI', 'TAB', 'SQL', 'ETL'].map(S), title: 'BI Developer', goalVerb: 'Build dashboards that help', jobVerb: 'Build dashboards from',
    tasks: ['Model the data for reporting', 'Build an interactive dashboard', 'Document the measures'] },
  'data scientist': { skills: ['PY', 'ML', 'STAT', 'SQL', 'R'].map(S), title: 'Data Scientist', goalVerb: 'Build predictive models to', jobVerb: 'Build models on',
    tasks: ['Explore and prepare the data', 'Train and compare simple models', 'Explain results to non-experts'] },
  'ML engineer': { skills: ['PY', 'ML', 'DL', 'CLOUD', 'GIT', 'DOCK'].map(S), title: 'ML Engineer', goalVerb: 'Deploy machine learning to', jobVerb: 'Deploy models that use',
    tasks: ['Package a model as a service', 'Monitor model quality', 'Write tests for the pipeline'] },
  'software developer': { skills: ['JS', 'REACT', 'API', 'GIT', 'DOCK'].map(S), title: 'Software Developer', goalVerb: 'Write software to', jobVerb: 'Develop features around',
    tasks: ['Build a small feature end to end', 'Write unit tests', 'Join code reviews'] },
  'cybersecurity analyst': { skills: ['SEC', 'NET', 'PY', 'CLOUD'].map(S), title: 'Cybersecurity Analyst', goalVerb: 'Work in cybersecurity to', jobVerb: 'Monitor and investigate',
    tasks: ['Triage security alerts', 'Write a short incident report', 'Harden one system configuration'] },
  'business analyst': { skills: ['XLS', 'SQL', 'COM', 'JIRA', 'AGL', 'PMP'].map(S), title: 'Business Analyst', goalVerb: 'Work as a business analyst to', jobVerb: 'Gather requirements and analyse',
    tasks: ['Interview stakeholders', 'Write user stories in Jira', 'Prioritise a backlog with the product owner'] },
  'marketing analyst': { skills: ['MKT', 'XLS', 'SQL', 'TAB', 'COM'].map(S), title: 'Marketing Analyst', goalVerb: 'Use marketing analytics to', jobVerb: 'Measure campaigns using',
    tasks: ['Set up campaign tracking', 'Report on channel performance', 'Recommend budget changes'] },
  'UX designer': { skills: ['UX', 'FIG', 'COM', 'JS'].map(S), title: 'UX Designer', goalVerb: 'Design products that', jobVerb: 'Research and redesign the experience around',
    tasks: ['Run five user interviews', 'Prototype a new flow in Figma', 'Test the prototype with users'] },
  'project coordinator': { skills: ['PMP', 'JIRA', 'AGL', 'COM', 'RISK'].map(S), title: 'Project Coordinator', goalVerb: 'Coordinate projects that', jobVerb: 'Coordinate a project team working on',
    tasks: ['Keep the project plan up to date', 'Run the weekly stand-up', 'Track risks and actions'] },
  'finance analyst': { skills: ['FIN', 'ACC', 'XLS', 'SQL'].map(S), title: 'Finance Analyst', goalVerb: 'Use financial analysis to', jobVerb: 'Model and report on',
    tasks: ['Update the monthly forecast', 'Reconcile two data sources', 'Prepare a board-ready summary'] },
  'sustainability analyst': { skills: ['ESG', 'XLS', 'PBI', 'STAT', 'WRT'].map(S), title: 'Sustainability Analyst', goalVerb: 'Use sustainability data to', jobVerb: 'Measure and report on',
    tasks: ['Collect emissions data from sites', 'Calculate a carbon baseline', 'Draft the sustainability report section'] },
  'cloud engineer': { skills: ['CLOUD', 'DOCK', 'NET', 'GIT', 'PY'].map(S), title: 'Cloud Engineer', goalVerb: 'Run cloud infrastructure to', jobVerb: 'Automate cloud infrastructure for',
    tasks: ['Write infrastructure as code', 'Set up monitoring alerts', 'Reduce cloud costs'] },
  'AI engineer': { skills: ['LLM', 'NLP', 'PY', 'API', 'CV'].map(S), title: 'AI Engineer', goalVerb: 'Build AI applications to', jobVerb: 'Prototype AI assistants for',
    tasks: ['Build a retrieval-augmented chatbot', 'Evaluate answers against a test set', 'Add human review for low-confidence answers'] }
};

export const CITIES = [['Abu Dhabi', 34], ['Dubai', 34], ['Sharjah', 8], ['Al Ain', 6], ['Ras Al Khaimah', 4], ['Ajman', 3], ['Fujairah', 2], ['Remote', 9]];
export const CITY_CODE = { 'Abu Dhabi': 'AUH', Dubai: 'DXB', Sharjah: 'SHJ', 'Al Ain': 'AAN', 'Ras Al Khaimah': 'RAK', Ajman: 'AJM', Fujairah: 'FUJ', Remote: 'REM' };

export const PROGRAMMES = ['BSc Artificial Intelligence', 'BSc Computer Science', 'BSc Data Science', 'BSc Business Analytics', 'BSc Computer Engineering'];

export const FIRST_NAMES = ['Aisha', 'Fatima', 'Hessa', 'Maitha', 'Shamma', 'Reem', 'Alya', 'Mira', 'Sara', 'Noor', 'Huda', 'Latifa', 'Mahra', 'Salama', 'Amna',
  'Khalid', 'Saeed', 'Hamad', 'Rashid', 'Sultan', 'Yousef', 'Ahmed', 'Mohammed', 'Faisal', 'Ali', 'Hassan', 'Tariq', 'Ibrahim', 'Majid', 'Obaid',
  'Priya', 'Ananya', 'Rohan', 'Aarav', 'Zara', 'Ayesha', 'Bilal', 'Hamza', 'Ivan', 'Elena', 'Chen', 'Wei', 'Lina', 'Yara', 'Karim', 'Nadia',
  'Samir', 'Leila', 'Tomas', 'Grace', 'Joseph', 'Maria', 'Sofia', 'Kwame', 'Amara', 'Mei', 'Hiro', 'Dina', 'Rania', 'Farah'];

export const LAST_NAMES = ['Al Mansoori', 'Al Ketbi', 'Al Nuaimi', 'Al Shamsi', 'Al Dhaheri', 'Al Mazrouei', 'Al Blooshi', 'Al Hosani', 'Al Kaabi', 'Al Mheiri',
  'Al Ameri', 'Al Rumaithi', 'Al Qubaisi', 'Al Marri', 'Haddad', 'Khoury', 'Nasser', 'Saleh', 'Rahman', 'Qureshi', 'Iyer', 'Menon', 'Nair', 'Sharma',
  'Kapoor', 'Siddiqui', 'Chaudhry', 'Petrov', 'Novak', 'Zhang', 'Li', 'Wang', 'Tanaka', 'Mensah', 'Adeyemi', 'Okoro', 'Santos', 'Fernandes', 'Costa',
  'Rossi', 'Schmidt', 'Hughes', 'Walsh', 'Kim', 'Park', 'Farouk', 'Yilmaz', 'Demir'];

export const EMPLOYER_PREFIX = ['Ghaf', 'Sidr', 'Dhow', 'Mangrove', 'Saffron', 'Hajar Ridge', 'Wadi', 'Areej', 'Naseem', 'Qamar', 'Rimal', 'Tilal', 'Bahar',
  'Samar', 'Falaj', 'Sahil', 'Nakhla', 'Zahra', 'Layan', 'Durra', 'Marjan', 'Yaqoot', 'Fanar', 'Sareen', 'Jood', 'Waha', 'Seef', 'Oryx Bay', 'Liwa Dunes', 'Saluki'];

// Free-text skills students type. Some have a clear vocabulary term, some do not.
export const PHRASES = ['agile board hygiene', 'excel wizardry', 'dashboarding in looker', 'customer journey mapping', 'prompt engineering for chatbots',
  'drone photography', 'arabic calligraphy', 'pitch decks', 'social media growth', 'data storytelling', 'kubernetes basics',
  'python scripting for automation', 'ms project scheduling', 'tableau prep', 'airport ops knowledge', 'kanban ticket triage',
  'cleaning messy spreadsheets', 'hackathon prototyping', 'scrum master certificate', 'reading financial statements',
  'cyber threat hunting', 'figma wireframing', 'solar panel monitoring', 'interviewing users', 'writing api docs'];

export const REVIEWERS = ['Dr. R. Mensah (synthetic)', 'Ms. H. Al Zaabi (synthetic)', 'Mr. J. Varghese (synthetic)', 'Dr. L. Haddad (synthetic)'];
export const COORDINATOR = 'Sara Al-Marzouqi (coordinator, synthetic)';
export const P03_REVIEWERS = ['P03 reviewer: M. Al Suwaidi (synthetic)', 'P03 reviewer: K. Thomas (synthetic)', 'P03 reviewer: N. Rahimi (synthetic)'];
