import {readFileSync} from 'fs'
import {Octokit} from '@octokit/core'
import {enterpriseCloud} from '@octokit/plugin-enterprise-cloud'
import {load} from 'js-yaml'

const MyOctokit = Octokit.plugin(enterpriseCloud)

class ActionPolicy {
  /**
   * @typedef {object} Organization
   * @property {string} login
   * @readonly
   */

  /**
   * @typedef {object} Policy
   * @property {string|string[]} organizations
   * @property {string} actions
   * @property {Selected} selected
   * @readonly
   */

  /**
   * @typedef {object} Selected
   * @property {boolean} selected.github_owned_allowed
   * @property {string[]} selected.patterns_allowed
   * @property {boolean} selected.verified_allowed
   * @readonly
   */

  /**
   * @param {object} options
   * @param {string} options.token GitHub Personal Access Token
   * @param {string} options.enterprise GitHub Enterprise Cloud slug
   * @param {string} options.allowListPath Path to the GitHub Actions allow list YML within the repository
   */
  constructor({token, enterprise, allowListPath}) {
    if (!token) {
      throw new Error('`token` is required')
    }

    this.octokit = new MyOctokit({auth: token})

    if (!enterprise) {
      throw new Error('`enterprise` is required')
    }

    this.enterprise = enterprise

    if (!allowListPath) {
      throw new Error('`allowListPath` is required')
    }

    this.allowListPath = allowListPath
    this.allowList = undefined

    /** @type Policy */
    this.policy = undefined
  }

  /**
   * @readonly
   * @throws
   */
  async loadCurrentEnterpriseActionsPolicy() {
    const {enterprise, octokit} = this

    // https://docs.github.com/en/rest/reference/enterprise-admin#get-github-actions-permissions-for-an-enterprise
    const {
      data: {allowed_actions, enabled_organizations}
    } = await octokit.request('GET /enterprises/{enterprise}/actions/permissions', {
      enterprise
    })

    if (enabled_organizations === 'none') {
      throw new Error(`GitHub Actions disabled`)
    }

    let organizations = enabled_organizations

    if (organizations !== 'all') {
      // https://docs.github.com/en/rest/reference/enterprise-admin#list-selected-organizations-enabled-for-github-actions-in-an-enterprise
      const {
        data: {organizations: orgs}
      } = await octokit.request('GET /enterprises/{enterprise}/actions/permissions/organizations', {
        enterprise
      })

      organizations = orgs.map(org => org.login)
    }

    // 'allowed_actions' can have the values
    //    - 'all'
    //    - 'local_only'
    //    - 'selected'
    const actions = allowed_actions

    this.policy = {organizations, actions}

    // if 'selected' is the permission for GitHub Actions, get additional details
    if (actions === 'selected') {
      // https://docs.github.com/en/rest/reference/enterprise-admin#get-allowed-actions-for-an-enterprise
      const {data} = await octokit.request('GET /enterprises/{enterprise}/actions/permissions/selected-actions', {
        enterprise
      })

      this.policy.selected = data
    } else {
      throw new Error('GitHub Actions allow list automation is only possible with "Allow select actions" selected!')
    }
  }

  /**
   * @readonly
   * @throws
   * @returns {boolean}
   */
  async updateEnterpriseActionsAllowList() {
    const {
      enterprise,
      octokit,
      policy: {actions, selected},
      allowList: patterns_allowed
    } = this

    if (actions === 'selected' && selected.patterns_allowed) {
      try {
        // https://docs.github.com/en/rest/reference/enterprise-admin#set-allowed-actions-for-an-enterprise
        const {status} = await octokit.request('PUT /enterprises/{enterprise}/actions/permissions/selected-actions', {
          enterprise,
          patterns_allowed
        })
        if (status !== 204) {
          throw new Error(`Failed to update GitHub Actions allow list!`)
        }
      } catch (error) {
        throw new Error(`Failed to update GitHub Actions allow list!`)
      }
    }

    selected.patterns_allowed = patterns_allowed

    return true
  }

  /**
   * @readonly
   * @returns {Policy}
   */
  getPolicy() {
    return this.policy
  }

  /**
   * @readonly
   * @returns {string[]}
   */
  async loadAllowListYAML() {
    const content = readFileSync(this.allowListPath, 'utf8')
    const {actions: allowList} = load(content, {json: true})

    // unique values only
    this.allowList = [...new Set(allowList)]

    return allowList
  }
}

export default ActionPolicy
