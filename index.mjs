import {join, parse} from 'path'
import {getInput, setFailed, setOutput} from '@actions/core'
import ActionPolicy from './utils/ActionPolicy.mjs'

// action
;(async () => {
  try {
    const token = getInput('token', {required: true})
    const enterprise = getInput('enterprise', {required: true})
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
      allowListPath
    })

    // load current policy
    await ap.loadCurrentEnterpriseActionsPolicy()

    // load updated allow list from YAML
    await ap.loadAllowListYAML()

    // save new policy
    await ap.updateEnterpriseActionsAllowList()

    setOutput(`GitHub Actions allow list updated`)
  } catch (error) {
    setFailed(error.message)
  }
})()
