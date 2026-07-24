#!/bin/bash

# Script to create PRs for v5 test branches using GitHub API

GITHUB_TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is required"
  echo "Please set it with: export GITHUB_TOKEN=your_token"
  exit 1
fi

OWNER="Adarsh-Dhar"
REPO="datadog-github"
BASE="main"

echo "Creating PRs for v7 test branches..."
echo ""

# Function to create PR
create_pr() {
  local head=$1
  local title=$2
  local body=$3
  
  response=$(curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$OWNER/$REPO/pulls" \
    -d "{\"title\":\"$title\",\"head\":\"$head\",\"base\":\"$BASE\",\"body\":\"$body\"}")
  
  if echo "$response" | grep -q "number"; then
    pr_number=$(echo "$response" | grep -o '"number":[0-9]*' | grep -o '[0-9]*')
    echo "✓ Created PR #$pr_number: $title"
  else
    if echo "$response" | grep -q "already exists"; then
      echo "✗ PR for $head already exists"
    else
      echo "✗ Error creating PR for $head"
      echo "$response" | head -5
    fi
  fi
}

# Create baseline PR first
create_pr "test-join-key-baseline-v7" "Test join key baseline (v7)" "Test PR to establish baseline for join key detection. Adding a join to fct_revenue."

# Create other PRs
create_pr "test-renamed-column-v7" "Test renamed column detection (v7)" "Test PR to verify PR Guardian detects renamed columns: order_total -> total_amount"
create_pr "test-type-change-v7" "Test type change detection (v7)" "Test PR to verify PR Guardian detects type changes: order_total (decimal(12,2) -> decimal(10,2))"
create_pr "test-additive-change-v7" "Test additive change (v7)" "Test PR to verify PR Guardian correctly identifies additive changes as LOW risk (adding order_day column)"

echo ""
echo "Done! Note: test-join-key-change-v7 should be created after baseline is merged."
