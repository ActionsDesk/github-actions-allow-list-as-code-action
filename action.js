import {join, parse} from 'path'
import {getInput, isDebug, setFailed, setOutput, info} from '@actions/core'
import ActionPolicy from './utils/ActionPolicy'

// action
;(async () => {
  try {
    const token = getInput('token', {required: true})
    const enterprise = getInput('enterprise', {required: false}) || null
    const organization = getInput('organization', {required: false}) || null
    const ghApiUrl = getInput('gh_api_url', {required: false}) || 'https://api.github.com'

    if (enterprise && organization) {
      throw new Error('❗ Please provide only one of: enterprise, organization')
    }

    const allowList = getInput('allow_list_path')
    const workspace = process.env.GITHUB_WORKSPACE

    const allowListPath = join(workspace, allowList)
    const {dir} = parse(allowListPath)

    if (dir.indexOf(workspace) < 0) {
      throw new Error(`❗ ${allowList} is not an allowed path`)
    }

    const ap = new ActionPolicy({
      token,
      enterprise,
      organization,
      allowListPath,
      ghApiUrl,
    })

    // load current policy
    if (enterprise) await ap.loadCurrentEnterpriseActionsPolicy()
    if (organization) await ap.loadCurrentOrganizationActionsPolicy()
    info(`✅ Loaded Existing GitHub Actions allow list for ${enterprise || organization}`)

    // load updated allow list from YAML
    await ap.loadAllowListYAML()
    info(`✅ Loaded updated allow list from file ${allowListPath}`)

    // save new policy
    if (enterprise) await ap.updateEnterpriseActionsAllowList()
    if (organization) await ap.updateOrganizationActionsAllowList()
    info(`✅ Updated GitHub Actions allow list for ${enterprise || organization}`)
    setOutput('output', `GitHub Actions allow list updated for ${enterprise || organization}`)
  } catch (error) {
    if (isDebug()) {
      // print stack trace
      console.error(error.stack)
    }

    info(`❗ GitHub Actions allow list update failed with error: ${error.message}`)
    setFailed(error.message)
  }
})()
