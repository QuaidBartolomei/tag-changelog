const groupByType = require('./groupByType')
const translateType = require('./translateType')

function generateChangelog(releaseName, commitObjects, config) {
  const commitsByType = groupByType(commitObjects, config.types)
  let changes = ''

  commitsByType
    .filter((obj) => !config.excludeTypes.includes(obj.type))
    .map((obj) => ({ ...obj, type: translateType(obj.type, config.types) }))
    .reduce((acc, obj) => {
      const {type,commits} = obj
      const accValue = acc.find((x) => x.type === type)
      if (!accValue) acc.push({ ...obj })
      else accValue.commits = [...accValue.commits, ...commits]
      return acc
    }, [])
    .forEach((obj) => {
      changes += config.renderTypeSection(obj.type, obj.commits)
    })

  // Find all the notes of all the commits of all the types
  const notes = commitsByType
    .flatMap((obj) =>
      obj.commits
        .filter((commit) => commit.notes && commit.notes.length)
        .map((commit) =>
          commit.notes.map((note) => {
            const noteObj = note
            noteObj.commit = commit
            return noteObj
          })
        )
        .filter((o) => o)
    )
    .flatMap((o) => o)

  if (notes.length) {
    changes += config.renderNotes(notes)
  }

  changes = changes.trim()

  const changelog = config.renderChangelog(releaseName, changes)

  return {
    changelog,
    changes,
  }
}

module.exports = generateChangelog
