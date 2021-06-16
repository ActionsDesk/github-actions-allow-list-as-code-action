import {join, parse} from 'path'
import {getInput, setFailed, setOutput} from '@actions/core'
import ActionPolicy from './utils/ActionPolicy.mjs'

// action
;(async () => {
  try {
    const token = getInput('token', {required: true})
    const enterprise = getInput('enterprise', {required: false}) || null
    const organization = getInput('organization', {required: organization}) || null

    if (enterprise && organization) {
      throw new Error('Please provide only one of: enterprise, organization')
    }

    const allowList = getInput('allow_list_path')
    const workspace = process.env.GITHUB_WORKSPACE

    const allowListPath = join(workspace, allowList)
    const {dir} = parse(allowListPath)

    if (dir.indexOf(workspace) < 0) {
      throw new Error(`${allowList} is not an allowed path`)
    }

    const ap = new ActionPolicy({
      token,
      enterprise,
      organization,
      allowListPath
    })

    // load current policy
    await ap.loadCurrentEnterpriseActionsPolicy()

    // load updated allow list from YAML
    await ap.loadAllowListYAML()

    // save new policy
    await ap.updateEnterpriseActionsAllowList()

    setOutput(`GitHub Actions allow list updated for ${enterprise || organization}`)
  } catch (error) {
    setFailed(error.message)
  }
})()
