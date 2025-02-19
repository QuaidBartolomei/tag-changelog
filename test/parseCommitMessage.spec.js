/* eslint-env node, mocha */

const assert = require('assert')
const parseCommitMessage = require('../src/parseCommitMessage')

// eslint-disable-next-line no-unused-vars
const fetchUserFunc = async (pullNumber) => ({
  username: 'kevinrenskers',
  userUrl: 'https://github.com/kevinrenskers',
})

describe('parseCommitMessage', () => {
  it('should parse a basic feat', async () => {
    const result = await parseCommitMessage('feat: This is a feature')
    assert.strictEqual(result.subject, 'This is a feature')
    assert.strictEqual(result.type, 'feat')
  })

  it('should parse a basic feat without space after colon', async () => {
    const result = await parseCommitMessage('feat:This is a feature')
    assert.strictEqual(result.subject, 'this is a feature')
    assert.strictEqual(result.type, 'feat')
  })

  it('should parse a basic feat (case insensitive)', async () => {
    const result = await parseCommitMessage('Feat: This is a feature')
    assert.strictEqual(result.subject, 'This is a feature')
    assert.strictEqual(result.type, 'feat')
  })

  it('should parse a basic feat with multiple lines', async () => {
    const result = await parseCommitMessage('feat: This is a feature\n\nBody')
    assert.strictEqual(result.subject, 'This is a feature')
    assert.strictEqual(result.type, 'feat')
  })

  it('should parse basic feat with a PR number', async () => {
    const result = await parseCommitMessage(
      'feat: This is a feature [#1]',
      'https://github.com/loopwerk/tag-changelog',
      fetchUserFunc
    )

    assert.strictEqual(
      result.subject,
      'This is a feature [[#1](https://github.com/loopwerk/tag-changelog/pull/1) by [kevinrenskers](https://github.com/kevinrenskers)]'
    )
    assert.strictEqual(result.type, 'feat')
  })

  it('should parse a basic fix', async () => {
    const result = await parseCommitMessage('fix: This is a fix')
    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.type, 'fix')
  })

  it('should parse a basic fix (case insensitive)', async () => {
    const result = await parseCommitMessage('Fix: This is a fix')
    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.type, 'fix')
  })

  it("should parse a 'Fix ' commit", async () => {
    const result = await parseCommitMessage('Fix This is a fix')
    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.type, 'fix')
  })

  it("should parse a 'Fix/something ' commit", async () => {
    const result = await parseCommitMessage('Fix/something This is a fix')
    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.type, 'fix')
  })

  it("should parse a 'fix ' commit", async () => {
    const result = await parseCommitMessage('fix This is a fix')
    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.type, 'fix')
  })

  it("should parse a 'Hotfix ' commit", async () => {
    const result = await parseCommitMessage('Hotfix This is a fix')
    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.type, 'fix')
  })

  it('should parse a breaking change fix', async () => {
    const result = await parseCommitMessage('fix!: This is a fix')

    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.type, 'fix')
    assert.notStrictEqual(result.notes, [
      { text: 'This is a fix', title: 'BREAKING CHANGE' },
    ])
  })

  it('should parse a missing type', async () => {
    const result = await parseCommitMessage('This is a commit')

    assert.strictEqual(result.subject, 'This is a commit')
    assert.strictEqual(result.type, 'chore')
  })

  it('should parse a merge commit', async () => {
    const result = await parseCommitMessage('Merge commit')
    assert.strictEqual(result.subject, 'Merge commit')
    assert.strictEqual(result.type, 'merge')
  })

  it('should parse a missing type with multiple lines', async () => {
    const result = await parseCommitMessage('This is a commit\n\nBody')

    assert.strictEqual(result.subject, 'This is a commit')
    assert.strictEqual(result.type, 'chore')
  })

  it('should parse a missing type with a PR number', async () => {
    const result = await parseCommitMessage(
      'This is a commit [#1]',
      'https://github.com/loopwerk/tag-changelog',
      fetchUserFunc
    )

    assert.strictEqual(
      result.subject,
      'This is a commit [[#1](https://github.com/loopwerk/tag-changelog/pull/1) by [kevinrenskers](https://github.com/kevinrenskers)]'
    )
    assert.strictEqual(result.type, 'chore')
  })

  it('should parse a scope', async () => {
    const result = await parseCommitMessage('fix(scope): This is a fix')

    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.scope, 'scope')
    assert.strictEqual(result.type, 'fix')
  })

  it('should parse a malformed scope', async () => {
    const result = await parseCommitMessage('feat (scope): This is a fix')
    assert.strictEqual(result.subject, 'This is a fix')
    assert.strictEqual(result.scope, 'scope')
    assert.strictEqual(result.type, 'feat')
  })
})
