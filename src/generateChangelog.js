const groupByType = require('./groupByType')
const translateType = require('./translateType')

function generateChangelog(releaseName, commitObjects, config) {
  const commitsByType = groupByType(commitObjects, config.types)
  let changes = ''

  commitsByType
    .filter((obj) => !config.excludeTypes.includes(obj.type))
    .forEach((obj) => {
      const niceType = translateType(obj.type, config.types)
      changes += config.renderTypeSection(niceType, obj.commits)
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
