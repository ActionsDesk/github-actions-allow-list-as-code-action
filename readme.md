# github-actions-allow-list-as-code-action

> Automate GitHub Actions allow list for GitHub Enterprise accounts

[![test](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/test.yml/badge.svg)](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/test.yml) [![codeql](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/codeql.yml/badge.svg)](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/codeql.yml) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Usage

```yml
name: Deploy GitHub Actions allow list

on:
  push:
    branches: [main]
    paths: [github-actions-allow-list.yml]

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions: read-all

    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.4

      - name: Setup node
        uses: actions/setup-node@v2.1.5
        with:
          node-version: 14.x

      - name: Deploy GitHub Actions allow list
        uses: ActionsDesk/github-actions-allow-list-as-code-action@v1.1.2
        with:
          token: ${{ secrets.ENTERPRISE_ADMIN_TOKEN }}
          enterprise: 'your-enterprise'
          # same as defined under `on.pull_requests.paths`
          allow_list_path: github-actions-allow-list.yml
          # gh_api_url: 'https://github.example.com/api/v3' # Only required for GitHub Enterprise Server
```

### Action Inputs

| Name              | Description                                                                                                      | Default                         | Required |
| :---------------- | :--------------------------------------------------------------------------------------------------------------- | :------------------------------ | :------- |
| `token`           | GitHub Personal Access Token ([PAT]) with `admin:enterprise` or `admin:org` scope                                |                                 | `true`   |
| `organization`    | GitHub organization slug                                                                                         |                                 | `false`  |
| `enterprise`      | GitHub Enterprise account slug                                                                                   |                                 | `false`  |
| `allow_list_path` | Path to the GitHub Actions allow list YML within the repository                                                  | `github-actions-allow-list.yml` | `false`  |
| `gh_api_url`      | GitHub Enterprise Servier - URL to the GitHub API endpoint. <br /> Example: `https://github.example.com/api/v3.` | `https://api.github.com`        | `false`  |

ℹ️ Notes for providing `enterprise` or `organization`:

- Either provide `enterprise` to update the [GitHub Enterprise Cloud's actions allow list](https://docs.github.com/en/github/setting-up-and-managing-your-enterprise/setting-policies-for-organizations-in-your-enterprise-account/enforcing-github-actions-policies-in-your-enterprise-account#allowing-specific-actions-to-run), or `organization` to update a single [organization's allow list](https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#allowing-specific-actions-to-run).
- Providing both will result in the action run failing with `Please provide only one of: enterprise, organization`.
- If providing `organization`, but the allow list is handled via [GitHub Enterprise Cloud's actions allow list](https://docs.github.com/en/github/setting-up-and-managing-your-enterprise/setting-policies-for-organizations-in-your-enterprise-account/enforcing-github-actions-policies-in-your-enterprise-account#allowing-specific-actions-to-run), the action run will fail with `Selected actions are already set at the enterprise level`.

## Allow List file

Example content for Allow List file containing `actions:` key and list with two allowed actions.

```yml
actions:
  - actionsdesk/github-actions-allow-list-as-code-action@v1.1.2
  - hashicorp/vault-action@v2.4.0
```

## License

- [MIT License](./license)

[pat]: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token 'Personal Access Token'
