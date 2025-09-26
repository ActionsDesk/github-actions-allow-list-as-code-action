# github-actions-allow-list-as-code-action

> Automate GitHub Actions allow list for GitHub Enterprise accounts

[![test](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/test.yml/badge.svg)](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/test.yml) [![CodeQL](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/github-code-scanning/codeql) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Usage

This action helps you automate the management of GitHub Actions allow lists for GitHub Enterprise Cloud accounts or individual organizations. Below are comprehensive examples for different use cases.

### Example 1: Enterprise-wide Allow List Management

This example shows how to automatically update the allow list whenever changes are pushed to the main branch. This is ideal for enterprise administrators who want to maintain a centralized allow list.

```yml
name: Deploy GitHub Actions Enterprise Allow List

on:
  push:
    branches: [main]
    paths: [github-actions-allow-list.yml]

  # Allow manual triggering for immediate updates
  workflow_dispatch:

jobs:
  deploy-enterprise-allowlist:
    runs-on: ubuntu-latest

    # Restrict to specific environments for security
    environment: production

    permissions:
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5.0.0

      - name: Deploy GitHub Actions allow list to Enterprise
        uses: ActionsDesk/github-actions-allow-list-as-code-action@v3.0.0
        with:
          token: ${{ secrets.ENTERPRISE_ADMIN_TOKEN }}
          enterprise: 'your-enterprise-name'
          allow_list_path: github-actions-allow-list.yml

      - name: Notify on success
        if: success()
        run: echo "✅ Enterprise allow list updated successfully"

      - name: Notify on failure
        if: failure()
        run: echo "❌ Failed to update enterprise allow list"
```

### Example 2: Organization-specific Allow List Management

This example demonstrates managing allow lists for multiple organizations using a matrix strategy that reads organization names from the allowlist filenames.

```yml
name: Deploy Organization GitHub Actions Allow Lists

on:
  push:
    branches: [main, develop]
    paths: ['allowlists/org-*.yml']

  pull_request:
    branches: [main]
    paths: ['allowlists/org-*.yml']
    types: [opened, synchronize]

jobs:
  get-changed-orgs:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v5.0.0
        with:
          fetch-depth: 2

      - name: Get changed org allowlists
        id: set-matrix
        run: |
          # Get changed org allowlist files
          CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | grep 'allowlists/org-.*\.yml$' || true)

          if [ -z "$CHANGED_FILES" ]; then
            echo "matrix={\"include\":[]}" >> $GITHUB_OUTPUT
            exit 0
          fi

          # Extract org names from filenames and create matrix
          MATRIX_JSON="{\"include\":["
          FIRST=true
          for file in $CHANGED_FILES; do
            # Extract org name from filename (e.g., allowlists/org-myorg.yml -> myorg)
            ORG_NAME=$(basename "$file" .yml | sed 's/^org-//')
            
            if [ "$FIRST" = true ]; then
              FIRST=false
            else
              MATRIX_JSON="$MATRIX_JSON,"
            fi
            
            MATRIX_JSON="$MATRIX_JSON{\"org\":\"$ORG_NAME\",\"file\":\"$file\"}"
          done
          MATRIX_JSON="$MATRIX_JSON]}"

          echo "matrix=$MATRIX_JSON" >> $GITHUB_OUTPUT
          echo "Generated matrix: $MATRIX_JSON"

  validate-allowlist:
    runs-on: ubuntu-latest
    needs: get-changed-orgs
    if: github.event_name == 'pull_request' && needs.get-changed-orgs.outputs.matrix != '{"include":[]}'
    strategy:
      matrix: ${{ fromJson(needs.get-changed-orgs.outputs.matrix) }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5.0.0

      - name: Validate allow list format for ${{ matrix.org }}
        run: |
          echo "🔍 Validating allow list format for organization: ${{ matrix.org }}"
          echo "📁 File: ${{ matrix.file }}"
          # Add your YAML validation logic here

  deploy-org-allowlist:
    runs-on: ubuntu-latest
    needs: get-changed-orgs
    if: github.event_name == 'push' && needs.get-changed-orgs.outputs.matrix != '{"include":[]}'
    strategy:
      matrix: ${{ fromJson(needs.get-changed-orgs.outputs.matrix) }}

    environment: production

    permissions:
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5.0.0

      - name: Deploy allow list for ${{ matrix.org }}
        uses: ActionsDesk/github-actions-allow-list-as-code-action@v3.0.0
        with:
          token: ${{ secrets.ORG_ADMIN_TOKEN }}
          organization: ${{ matrix.org }}
          allow_list_path: ${{ matrix.file }}

      - name: Log deployment details
        run: |
          echo "✅ Deployed allow list for organization: ${{ matrix.org }}"
          echo "📁 Using file: ${{ matrix.file }}"
```

### Example 3: GitHub Enterprise Server

For GitHub Enterprise Server instances, you can specify a custom API URL:

```yml
name: Deploy GitHub Actions Allow List (Enterprise Server)

on:
  schedule:
    # Run daily at 9 AM UTC to sync any manual changes
    - cron: '0 9 * * *'
  push:
    branches: [main]
    paths: [enterprise-actions-allowlist.yml]

jobs:
  deploy-allowlist:
    runs-on: self-hosted # Use self-hosted runner for Enterprise Server

    environment: enterprise-server

    permissions:
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5.0.0

      - name: Deploy to Enterprise Server
        uses: ActionsDesk/github-actions-allow-list-as-code-action@v3.0.0
        with:
          token: ${{ secrets.GHES_ADMIN_TOKEN }}
          enterprise: 'your-enterprise'
          allow_list_path: enterprise-actions-allowlist.yml
          gh_api_url: 'https://github.yourcompany.com/api/v3'
```

### Action Inputs

| Name              | Description                                                                                                     | Default                         | Required |
| :---------------- | :-------------------------------------------------------------------------------------------------------------- | :------------------------------ | :------- |
| `token`           | GitHub Personal Access Token ([PAT]) with `admin:enterprise` or `admin:org` scope                               |                                 | `true`   |
| `organization`    | GitHub organization slug                                                                                        |                                 | `false`  |
| `enterprise`      | GitHub Enterprise account slug                                                                                  |                                 | `false`  |
| `allow_list_path` | Path to the GitHub Actions allow list YML within the repository                                                 | `github-actions-allow-list.yml` | `false`  |
| `gh_api_url`      | GitHub Enterprise Server - URL to the GitHub API endpoint. <br /> Example: `https://github.example.com/api/v3.` | `${{ github.api_url }}`         | `false`  |

ℹ️ Notes for providing `enterprise` or `organization`:

- Either provide `enterprise` to update the [GitHub Enterprise Cloud's actions allow list](https://docs.github.com/en/github/setting-up-and-managing-your-enterprise/setting-policies-for-organizations-in-your-enterprise-account/enforcing-github-actions-policies-in-your-enterprise-account#allowing-specific-actions-to-run), or `organization` to update a single [organization's allow list](https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#allowing-specific-actions-to-run).
- Providing both will result in the action run failing with `Please provide only one of: enterprise, organization`.
- If providing `organization`, but the allow list is handled via [GitHub Enterprise Cloud's actions allow list](https://docs.github.com/en/github/setting-up-and-managing-your-enterprise/setting-policies-for-organizations-in-your-enterprise-account/enforcing-github-actions-policies-in-your-enterprise-account#allowing-specific-actions-to-run), the action run will fail with `Selected actions are already set at the enterprise level`.

## Token Setup Guide

#### Creating the Required Personal Access Token (PAT)

The action requires a GitHub Personal Access Token with appropriate administrative permissions. Use Classic Personal Access Tokens for the required enterprise and organization administration scopes.

##### For Enterprise Administration:

1. Go to **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
2. Click **Generate new token** > **Generate new token (classic)**
3. Select the following scopes:
   - `admin:enterprise` - Required for enterprise-level allow list management
   - `read:org` - Required to read organization information
4. Set the token expiration according to your security policies
5. Store the token as `ENTERPRISE_ADMIN_TOKEN` in your repository secrets

##### For Organization Administration:

1. Create a classic PAT with the following scopes:
   - `admin:org` - Required for organization-level allow list management
   - `read:org` - Required to read organization information
2. Store the token as `ORG_ADMIN_TOKEN` in your repository secrets

#### For GitHub Enterprise Server:

- Follow the same process as above, but ensure the token is created on your GitHub Enterprise Server instance
- Store as `GHES_ADMIN_TOKEN` in your repository secrets

### Security Considerations

- **Use environment protection rules** to restrict who can deploy allow list changes
- **Enable branch protection** on branches containing allow list files
- **Regularly rotate tokens** and update repository secrets
- **Use separate tokens** for different environments when possible
- **Monitor token usage** through GitHub's audit logs

## Allow List File

The allow list file defines which GitHub Actions are permitted in your enterprise or organization. Create a YAML file with the following structure:

```yml
# github-actions-allow-list.yml
actions:
  # Specific versions (recommended for security)
  - actions/checkout@4f81bc57d3d6c1a48505cf8b1ad4555eb6ffeed5 # v4.2.2
  - actions/setup-node@v4.0.2

  # Allow all versions of a specific action (use with caution)
  - aquasecurity/tfsec-sarif-action@*

  # Allow all actions from a trusted organization
  - azure/*
```

For more information about action versioning and security best practices, see:

- [Using immutable releases and tags to manage your actions releases](https://docs.github.com/en/actions/how-tos/create-and-publish-actions/using-immutable-releases-and-tags-to-manage-your-actions-releases)
- [Enforcing policies for GitHub Actions in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#policies)

## License

- [MIT License](./license)

[pat]: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token 'Personal Access Token'
