# github-actions-allow-list-as-code-action

> Automate GitHub Actions allow list for GitHub Enterprise Cloud accounts

[![Test](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/test.yml/badge.svg)](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/test.yml) [![Create Release](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/release.yml/badge.svg)](https://github.com/ActionsDesk/github-actions-allow-list-as-code-action/actions/workflows/release.yml) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

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
        uses: ./.github/actions/action-allow-list-as-code
        with:
          token: ${{ secrets.ENTERPRISE_ADMIN_TOKEN }}
          enterprise: 'your-enterprise'
          # same as defined under `on.pull_requests.paths`
          allow_list_path: github-actions-allow-list.yml
```

### Action Inputs

| Name              | Description                                                        | Default                         | Required |
| :---------------- | :----------------------------------------------------------------- | :------------------------------ | :------- |
| `token`           | GitHub Personal Access Token ([PAT]) with `admin:enterprise` scope |                                 | `true`   |
| `enterprise`      | GitHub Enterprise Cloud account slug                               |                                 | `true`   |
| `allow_list_path` | Path to the GitHub Actions allow list YML within the repository    | `github-actions-allow-list.yml` | `false`  |

## License

- [MIT License](./license)

[pat]: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token 'Personal Access Token'
