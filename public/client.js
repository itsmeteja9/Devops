// Pipeline stages configuration
const stages = [
  {
    id: 1,
    icon: '🧪',
    label: 'Unit Tests',
    description: 'Test suite',
    eyebrow: 'SOURCE EVENT',
    name: 'Source Change',
    text: 'A pull request checks the change; a merge to main starts delivery.',
    guidedDescription: 'Developers push code. GitHub Actions automatically runs unit tests to catch bugs early.',
    technicalDescription: 'npm test runs Jest test suite with coverage reporting. Fails on coverage < 75%.'
  },
  {
    id: 2,
    icon: '🔍',
    label: 'Code Quality',
    description: 'SonarQube scan',
    eyebrow: 'QUALITY GATE',
    name: 'Code Quality Analysis',
    text: 'SonarQube scans for bugs, vulnerabilities, and code smells.',
    guidedDescription: 'SonarQube analyzes code quality, coverage, and security. Reports help teams maintain standards.',
    technicalDescription: 'sonar-scanner checks coverage with LCOV reports. Fails on threshold violations.'
  },
  {
    id: 3,
    icon: '✅',
    label: 'Terraform',
    description: 'Validate IaC',
    eyebrow: 'INFRASTRUCTURE',
    name: 'Infrastructure Validation',
    text: 'Terraform syntax is validated and planned against GCP.',
    guidedDescription: 'Terraform validates the infrastructure code that will be deployed. It shows what will change.',
    technicalDescription: 'terraform validate and terraform plan check syntax and resource changes before apply.'
  },
  {
    id: 4,
    icon: '🐳',
    label: 'Docker Build',
    description: 'Build & push image',
    eyebrow: 'ARTIFACT CREATION',
    name: 'Container Build',
    text: 'Multi-stage Dockerfile builds the app and pushes to Artifact Registry.',
    guidedDescription: 'The application is containerized and pushed to Artifact Registry for storage and deployment.',
    technicalDescription: 'docker build with multi-stage build. Image tagged with commit SHA, pushed to GAR.'
  },
  {
    id: 5,
    icon: '🌍',
    label: 'Terraform Apply',
    description: 'Deploy infrastructure',
    eyebrow: 'GCP DEPLOYMENT',
    name: 'Infrastructure Deploy',
    text: 'Terraform creates GCP resources (IAM, service accounts) and applies configurations.',
    guidedDescription: 'The GCP infrastructure is created or updated. Service accounts and IAM roles are set.',
    technicalDescription: 'terraform apply provisions GCP resources. Uses data sources for existing resources.'
  },
  {
    id: 6,
    icon: '☸️',
    label: 'Kubernetes',
    description: 'Deploy to GKE',
    eyebrow: 'APPLICATION LIVE',
    name: 'Application Deployment',
    text: 'Helm deploys the application to GKE with Datadog monitoring enabled.',
    guidedDescription: 'The application is deployed to Kubernetes with health checks and autoscaling. Datadog monitoring is configured.',
    technicalDescription: 'helm deploy with image.tag set to commit SHA. Datadog env vars injected. kubectl rollout status verified.'
  }
];

const guidedExplanations = [
  {
    title: 'Tests & Code Quality',
    description: 'Before any infrastructure or cloud resources are touched, automated checks verify the code is production-ready.',
    items: [
      { title: 'Unit Tests', description: 'Jest test suite validates application logic' },
      { title: 'Code Quality', description: 'SonarQube scans for bugs, duplicates, and technical debt' }
    ]
  },
  {
    title: 'Infrastructure as Code',
    description: 'Terraform validates and applies the GCP infrastructure needed to run the application.',
    items: [
      { title: 'Validate', description: 'terraform validate checks syntax and resource configuration' },
      { title: 'Plan', description: 'Shows what changes will be made before they are applied' }
    ]
  },
  {
    title: 'Build & Registry',
    description: 'The approved container image is built and stored in Artifact Registry for secure, versioned deployments.',
    items: [
      { title: 'Docker Build', description: 'Multi-stage build creates lean, production-ready images' },
      { title: 'Push to Registry', description: 'Image tagged with commit SHA for traceability' }
    ]
  },
  {
    title: 'Deploy to Kubernetes',
    description: 'GKE receives the exact image that passed all checks. Health checks and autoscaling are configured.',
    items: [
      { title: 'Helm Deploy', description: 'Kubernetes manifests deployed via Helm charts' },
      { title: 'Datadog Integration', description: 'APM and logging enabled automatically' }
    ]
  }
];

const technicalExplanations = [
  {
    title: 'npm test',
    description: 'Jest runs 35+ test cases covering all endpoints, error handling, and middleware.',
    items: [
      { title: 'Coverage', description: 'Requires 75% statements, 30% branches, 70% functions' },
      { title: 'Report', description: 'Generates LCOV coverage report for SonarQube' }
    ]
  },
  {
    title: 'terraform validate && terraform plan',
    description: 'Validates Terraform syntax and previews infrastructure changes without applying.',
    items: [
      { title: 'Data Sources', description: 'References existing VPC, subnet, GKE cluster, Artifact Registry' },
      { title: 'Output', description: 'Shows 15 resources to add, changes, and destroys' }
    ]
  },
  {
    title: 'docker build && docker push',
    description: 'Multi-stage build with distroless runtime. Image tagged with commit SHA and pushed to GAR.',
    items: [
      { title: 'Builder Stage', description: 'node:24-slim for npm install' },
      { title: 'Runtime Stage', description: 'distroless/nodejs24 for minimal attack surface' }
    ]
  },
  {
    title: 'helm upgrade --install && kubectl rollout status',
    description: 'Deploys via Helm chart with image.tag override and waits for rollout completion.',
    items: [
      { title: 'Set Datadog Env', description: 'DD_API_KEY, DD_SERVICE, DD_TRACE_ENABLED injected' },
      { title: 'Verify', description: 'Waits for deployment to reach ready state' }
    ]
  }
];

// Demo log entries
const demoLog = [
  { text: '$ git commit -m "Update app.js"', type: 'input' },
  { text: '$ git push origin main', type: 'input' },
  { text: 'Running workflow devops-deploy.yml...', type: 'info' },
  { text: '', type: 'blank' },
  { text: '→ npm test', type: 'info' },
  { text: '✓ 35 passed (11.2s)', type: 'success' },
  { text: '', type: 'blank' },
  { text: '→ sonar-scanner', type: 'info' },
  { text: '✓ Code Quality gate passed (80.55% coverage)', type: 'success' },
  { text: '', type: 'blank' },
  { text: '→ terraform validate', type: 'info' },
  { text: '✓ Valid configuration', type: 'success' },
  { text: '', type: 'blank' },
  { text: '→ docker build -t us-central1-docker.pkg.dev/.../helm-demo', type: 'info' },
  { text: '✓ Image built and pushed (2.1s)', type: 'success' },
  { text: '', type: 'blank' },
  { text: '→ terraform apply', type: 'info' },
  { text: '✓ GCP resources configured (45s)', type: 'success' },
  { text: '', type: 'blank' },
  { text: '→ helm upgrade --install devops-app ./helm', type: 'info' },
  { text: '✓ Deployment complete (devops-app-helm-demo)', type: 'success' },
  { text: '✓ 2/2 pods running', type: 'success' },
  { text: '✓ LoadBalancer service: 34.44.187.173', type: 'success' },
  { text: '', type: 'blank' },
  { text: '✓ Workflow completed successfully', type: 'success' }
];

// DOM Elements
const stageGrid = document.getElementById('stage-grid');
const pipelineProgress = document.getElementById('pipeline-progress');
const summaryNumber = document.getElementById('summary-number');
const summaryEyebrow = document.getElementById('summary-eyebrow');
const summaryName = document.getElementById('summary-name');
const summaryText = document.getElementById('summary-text');
const responsibilityGrid = document.getElementById('responsibility-grid');
const activityLog = document.getElementById('activity-log');
const runState = document.getElementById('run-state');
const serviceUrl = document.getElementById('service-url');
const guidedView = document.getElementById('guided-view');
const technicalView = document.getElementById('technical-view');
const runPipelineBtn = document.getElementById('run-pipeline');
const runAgainBtn = document.getElementById('run-again');
const exploreStagesBtn = document.getElementById('explore-stages');

let currentStage = 0;
let isRunning = false;

// Initialize
function init() {
  renderStages();
  renderResponsibilityGrid();
  getServiceUrl();

  runPipelineBtn?.addEventListener('click', startDemo);
  runAgainBtn?.addEventListener('click', startDemo);
  guidedView?.addEventListener('click', () => switchView('guided'));
  technicalView?.addEventListener('click', () => switchView('technical'));
  exploreStagesBtn?.addEventListener('click', () => {
    document.getElementById('stage-details')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function renderStages() {
  stageGrid.innerHTML = stages.map((stage, i) => `
    <div class="stage" data-index="${i}">
      <div class="stage-circle">${stage.icon}</div>
      <div class="stage-label">${stage.label}</div>
      <div class="stage-description">${stage.description}</div>
    </div>
  `).join('');

  document.querySelectorAll('.stage').forEach((el, i) => {
    el.addEventListener('click', () => selectStage(i));
  });
}

function selectStage(index) {
  currentStage = index;
  updateStageSummary(index);
  updateStageVisuals(index);
}

function updateStageSummary(index) {
  const stage = stages[index];
  summaryNumber.textContent = String(index + 1).padStart(2, '0');
  summaryEyebrow.textContent = stage.eyebrow;
  summaryName.textContent = stage.name;
  summaryText.textContent = stage.text;
}

function updateStageVisuals(index) {
  document.querySelectorAll('.stage').forEach((el, i) => {
    el.classList.remove('active', 'completed');
    if (i === index) el.classList.add('active');
    if (i < index) el.classList.add('completed');
  });

  const progress = ((index + 1) / stages.length) * 100;
  pipelineProgress.style.width = progress + '%';
}

function switchView(view) {
  const isGuided = view === 'guided';
  guidedView.classList.toggle('is-active', isGuided);
  technicalView.classList.toggle('is-active', !isGuided);

  const explanations = isGuided ? guidedExplanations : technicalExplanations;
  renderResponsibilityGrid(explanations);
}

function renderResponsibilityGrid(explanations = guidedExplanations) {
  responsibilityGrid.innerHTML = explanations.map((group, i) => `
    <div class="responsibility-item">
      <h3>
        <div class="responsibility-icon">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <text x="12" y="16" text-anchor="middle" font-size="12" fill="currentColor">${i + 1}</text>
          </svg>
        </div>
        ${group.title}
      </h3>
      <p>${group.description}</p>
      <ul style="margin-top: 1rem; padding-left: 1.5rem;">
        ${group.items.map(item => `
          <li style="margin-bottom: 0.75rem;">
            <strong>${item.title}:</strong> ${item.description}
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}

async function startDemo() {
  if (isRunning) return;
  isRunning = true;

  activityLog.innerHTML = '';
  runState.textContent = 'RUNNING';
  runState.style.background = 'rgba(255, 153, 0, 0.1)';
  runState.style.color = '#ff9900';

  currentStage = 0;
  updateStageVisuals(0);

  for (let i = 0; i < demoLog.length; i++) {
    const entry = demoLog[i];
    const logEl = document.createElement('div');
    logEl.className = `log-entry ${entry.type}`;
    logEl.textContent = entry.text;
    activityLog.appendChild(logEl);
    activityLog.scrollTop = activityLog.scrollHeight;

    // Progress stages
    const stageProgress = Math.floor((i / demoLog.length) * stages.length);
    if (stageProgress !== currentStage && stageProgress < stages.length) {
      currentStage = stageProgress;
      updateStageVisuals(currentStage);
      updateStageSummary(currentStage);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  runState.textContent = 'SUCCESS';
  runState.style.background = 'rgba(0, 170, 68, 0.1)';
  runState.style.color = '#00aa44';

  currentStage = stages.length - 1;
  updateStageVisuals(currentStage);
  updateStageSummary(currentStage);

  isRunning = false;
}

async function getServiceUrl() {
  try {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? ':' + window.location.port : '';
    const baseUrl = `${protocol}//${hostname}${port}`;

    serviceUrl.textContent = baseUrl;
  } catch (error) {
    console.error('Error getting service URL:', error);
    serviceUrl.textContent = window.location.href;
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
