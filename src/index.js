/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const { context, getOctokit } = require('@actions/github')
const { info, getInput, setOutput, debug } = require('@actions/core')

const parseCommitMessage = require('./parseCommitMessage')
const generateChangelog = require('./generateChangelog')
const DEFAULT_CONFIG = require('./defaultConfig')

const {
  repo: { owner, repo },
} = context

function getConfig(path) {
  if (path) {
    let workspace = process.env.GITHUB_WORKSPACE
    if (process.env.ACT) {
      // Otherwise testing this in ACT doesn't work
      workspace += '/tag-changelog'
    }

    const userConfig = require(`${workspace}/${path}`)

    // Merge default config with user config
    return { ...DEFAULT_CONFIG, ...userConfig }
  }

  return DEFAULT_CONFIG
}

async function run() {
  debug('getting token')
  const token = getInput('token', { required: true })

  debug('creating octokit')
  const octokit = getOctokit(token)

  debug('preparing config')
  const configFile = getInput('config_file', { required: false })
  const config = getConfig(configFile)
  const excludeTypesString =
    getInput('exclude_types', { required: false }) || ''

  if (excludeTypesString) {
    config.excludeTypes = excludeTypesString.split(',')
  }

  // Find the two most recent tags
  debug('getting tags')
  const { data: tags } = await octokit.repos.listTags({
    owner,
    repo,
    per_page: 10,
  })

  debug(`tag 1: ${tags[1].name}`)
  debug(`tag 2: ${tags[0].name}`)

  // Find the commits between two tags
  const result = await octokit.repos.compareCommits({
    owner,
    repo,
    base: tags[1].commit.sha,
    head: tags[0].commit.sha,
  })

  // DEBUG log commits
  result.data.commits.forEach((c, i) =>
    debug(`commit #${i}: ${c.commit.message}`)
  )

  const fetchUserFunc = async (pullNumber) => {
    const pr = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    })

    return {
      username: pr.data.user.login,
      userUrl: pr.data.user.html_url,
    }
  }

  // Parse every commit, getting the type, turning PR numbers into links, etc
  const commitObjects = await Promise.all(
    result.data.commits
      .map(async (commit) => {
        const commitObj = await parseCommitMessage(
          commit.commit.message,
          `https://github.com/${owner}/${repo}`,
          fetchUserFunc
        )
        commitObj.sha = commit.sha
        commitObj.url = commit.html_url
        commitObj.author = commit.author
        return commitObj
      })
      .filter((m) => m !== false)
  )

  commitObjects.forEach((c, i) =>
    debug(`parsed commit #${i}>> ${c.type}: ${c.subject}`)
  )

  // And generate the changelog
  if (commitObjects.length === 0) {
    setOutput('changelog', '')
    setOutput('changes', '')
    return
  }

  const log = generateChangelog(tags[0].name, commitObjects, config)

  debug(`changes: ${log.changes}`)

  info(log.changelog)
  setOutput('changelog', log.changelog)
  setOutput('changes', log.changes)
}

run()
