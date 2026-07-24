const { Octokit } = require('@octokit/rest');

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

const owner = 'Adarsh-Dhar';
const repo = 'datadog-github';

const prs = [
  {
    head: 'test-join-key-baseline-v5',
    title: 'Test join key baseline (v5)',
    body: 'Test PR to establish baseline for join key detection. Adding a join to fct_revenue.'
  },
  {
    head: 'test-renamed-column-v5',
    title: 'Test renamed column detection (v5)',
    body: 'Test PR to verify PR Guardian detects renamed columns: order_total -> total_amount'
  },
  {
    head: 'test-type-change-v5',
    title: 'Test type change detection (v5)',
    body: 'Test PR to verify PR Guardian detects type changes: order_total (decimal(12,2) -> decimal(10,2))'
  },
  {
    head: 'test-additive-change-v5',
    title: 'Test additive change (v5)',
    body: 'Test PR to verify PR Guardian correctly identifies additive changes as LOW risk (adding order_day column)'
  }
];

async function createPR(pr) {
  try {
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title: pr.title,
      head: pr.head,
      base: 'main',
      body: pr.body
    });
    console.log(`✓ Created PR #${response.data.number}: ${pr.title}`);
    return response.data.number;
  } catch (error) {
    if (error.status === 422) {
      console.log(`✗ PR for ${pr.head} already exists or cannot be created`);
    } else {
      console.error(`✗ Error creating PR for ${pr.head}:`, error.message);
    }
    return null;
  }
}

async function main() {
  console.log('Creating PRs for v5 test branches...\n');
  
  // Create baseline PR first
  const baselinePr = prs[0];
  const baselineNumber = await createPR(baselinePr);
  
  // Create other PRs
  for (const pr of prs.slice(1)) {
    await createPR(pr);
  }
  
  console.log('\nDone! Note: test-join-key-change-v5 should be created after baseline is merged.');
}

main().catch(console.error);
