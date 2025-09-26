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

This example demonstrates managing allow lists for a specific organization, useful when you want granular control per organization within an enterprise.

```yml
name: Deploy Organization GitHub Actions Allow List

on:
  push:
    branches: [main, develop]
    paths: ['allowlists/org-*.yml']

  pull_request:
    branches: [main]
    paths: ['allowlists/org-*.yml']
    types: [opened, synchronize]

jobs:
  validate-allowlist:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5.0.0

      - name: Validate allow list format
        run: |
          # Add validation logic here
          echo "🔍 Validating allow list format..."

  deploy-org-allowlist:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    environment: production

    permissions:
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5.0.0

      - name: Deploy GitHub Actions allow list to Organization
        uses: ActionsDesk/github-actions-allow-list-as-code-action@v3.0.0
        with:
          token: ${{ secrets.ORG_ADMIN_TOKEN }}
          organization: 'your-org-name'
          allow_list_path: 'allowlists/org-production.yml'

      - name: Log deployment details
        run: |
          echo "📋 Deployed allow list for organization: your-org-name"
          echo "📁 Using file: allowlists/org-production.yml"
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

### Creating the Required Personal Access Token (PAT)

The action requires a GitHub Personal Access Token with appropriate administrative permissions. You can use either Classic or Fine-grained tokens:

#### Option 1: Classic Personal Access Token (Recommended)

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

#### Option 2: Fine-grained Personal Access Token

##### For Enterprise Administration:

1. Go to **Settings** > **Developer settings** > **Personal access tokens** > **Fine-grained tokens**
2. Click **Generate new token**
3. Select your enterprise as the resource owner
4. Configure the following permissions:
   - **Organization permissions**: `Administration` (read and write)
   - **Repository permissions**: `Actions` (read), `Contents` (read)
5. Store the token as `ENTERPRISE_ADMIN_TOKEN` in your repository secrets

##### For Organization Administration:

1. Create a fine-grained PAT with your organization as the resource owner
2. Configure the following permissions:
   - **Organization permissions**: `Administration` (read and write)
   - **Repository permissions**: `Actions` (read), `Contents` (read)
3. Store the token as `ORG_ADMIN_TOKEN` in your repository secrets

> **Note:** Fine-grained tokens provide more granular control but may have limitations with enterprise-level operations. Classic tokens are recommended for enterprise administration.

#### For GitHub Enterprise Server:

- Follow the same process as above, but ensure the token is created on your GitHub Enterprise Server instance
- Store as `GHES_ADMIN_TOKEN` in your repository secrets

### Security Considerations

- **Use environment protection rules** to restrict who can deploy allow list changes
- **Enable branch protection** on branches containing allow list files
- **Regularly rotate tokens** and update repository secrets
- **Use separate tokens** for different environments when possible
- **Monitor token usage** through GitHub's audit logs

## Allow List File Examples

The allow list file defines which GitHub Actions are permitted in your enterprise or organization. Below are comprehensive examples showing different patterns and use cases.

### Basic Allow List Example

```yml
# github-actions-allow-list.yml
actions:
  # Specific action versions (recommended for security)
  - actions/checkout@v5.0.0
  - actions/setup-node@v4.0.2
  - actions/cache@v4.0.1

  # Allow specific action with version pinning
  - hashicorp/vault-action@v2.7.4

  # Allow all versions of a specific action (use with caution)
  - aquasecurity/tfsec-sarif-action@*

  # Allow all actions from a trusted organization
  - azure/*
```

### Comprehensive Enterprise Allow List Example

```yml
# enterprise-github-actions-allow-list.yml
actions:
  # === CORE GITHUB ACTIONS ===
  # Essential GitHub-maintained actions for CI/CD workflows
  - actions/checkout@v5.0.0 # Repository checkout
  - actions/setup-node@v4.0.2 # Node.js environment setup
  - actions/setup-python@v5.0.0 # Python environment setup
  - actions/setup-java@v4.0.0 # Java environment setup
  - actions/setup-dotnet@v4.0.0 # .NET environment setup
  - actions/cache@v4.0.1 # Dependency caching
  - actions/upload-artifact@v4.3.1 # Build artifact upload
  - actions/download-artifact@v4.1.4 # Build artifact download

  # === SECURITY AND COMPLIANCE ===
  # Security scanning and compliance tools
  - github/codeql-action@v3.24.6 # CodeQL security analysis
  - anchore/sbom-action@v0.15.9 # Software Bill of Materials
  - aquasecurity/tfsec-sarif-action@* # Terraform security scanning
  - securecodewarrior/github-action-add-sarif@v1 # SARIF processing

  # === DEPLOYMENT AND INFRASTRUCTURE ===
  # Cloud deployment and infrastructure management
  - azure/login@v2.0.0 # Azure authentication
  - azure/cli@v2.0.0 # Azure CLI operations
  - aws-actions/configure-aws-credentials@v4.0.2 # AWS authentication
  - hashicorp/vault-action@v2.7.4 # HashiCorp Vault integration
  - terraform-docs/gh-actions@v1.0.0 # Terraform documentation

  # === TRUSTED ORGANIZATIONS ===
  # Allow all actions from these trusted organizations
  - microsoft/* # Microsoft-maintained actions
  - docker/* # Docker-maintained actions

  # === THIRD-PARTY TOOLS ===
  # Specific third-party tools with version constraints
  - codecov/codecov-action@v4.1.0 # Code coverage reporting
  - sonarqube-quality-gate-action@v1.3.0 # SonarQube integration
  - slack-action@v1.0.0 # Slack notifications
```

### Organization-Specific Allow List Example

```yml
# org-development-allowlist.yml
# Tailored for development teams with additional flexibility
actions:
  # === DEVELOPMENT ESSENTIALS ===
  - actions/checkout@v5.0.0
  - actions/setup-node@v4.0.2
  - actions/setup-python@v5.0.0
  - actions/cache@v4.0.1

  # === TESTING FRAMEWORKS ===
  - cypress-io/github-action@v6.6.1 # Cypress E2E testing
  - browser-actions/setup-chrome@v1.5.0 # Chrome for testing
  - pnpm/action-setup@v3.0.0 # PNPM package manager

  # === CODE QUALITY ===
  - github/super-linter@v5.7.2 # Multi-language linting
  - wearerequired/lint-action@v2.3.0 # Custom linting workflows

  # === DEVELOPMENT TOOLS ===
  # Allow flexibility for development environment
  - devcontainers/* # Development containers
  - peaceiris/* # GitHub Pages and documentation tools
```

### Security-First Restrictive Example

```yml
# security-first-allowlist.yml
# Highly restrictive allow list for security-sensitive environments
actions:
  # Only essential GitHub-maintained actions with specific versions
  - actions/checkout@v5.0.0
  - actions/cache@v4.0.1
  - github/codeql-action@v3.24.6

  # Pre-approved security tools only
  - anchore/sbom-action@v0.15.9
  - aquasecurity/tfsec-sarif-action@v1.0.6 # Note: specific version, not wildcard


  # No wildcard organizations - everything must be explicitly approved
  # No third-party actions without thorough security review
```

### Pattern Explanations

| Pattern Type              | Example                   | Description                                        | Security Recommendation                                  |
| ------------------------- | ------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| **Specific Version**      | `actions/checkout@v5.0.0` | Pins to exact version for consistency and security | ✅ **Recommended** - Most secure                         |
| **Version Wildcard**      | `actions/checkout@*`      | Allows any version of the action                   | ⚠️ **Use with caution** - May introduce breaking changes |
| **Organization Wildcard** | `microsoft/*`             | Allows all actions from the organization           | ⚠️ **Use with trusted orgs only**                        |
| **Full Wildcard**         | `*`                       | Allows any action (not supported by this tool)     | ❌ **Not recommended** - Security risk                   |

### Best Practices for Allow Lists

1. **Pin to specific versions** when possible for reproducible builds
2. **Use organization wildcards sparingly** and only for highly trusted publishers
3. **Regularly audit and update** your allow list to include security patches
4. **Test changes** in a non-production environment first
5. **Document the purpose** of each allowed action with comments
6. **Consider separate allow lists** for different environments (dev/staging/prod)

## License

- [MIT License](./license)

[pat]: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token 'Personal Access Token'
