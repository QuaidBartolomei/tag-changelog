const {
  parser,
  toConventionalChangelogFormat,
} = require('@conventional-commits/parser');

const PR_REGEX = /#([1-9]\d*)/;

function removeFirstWord(str) {
  const indexOfSpace = str.indexOf(' ');
  if (indexOfSpace === -1) return '';
  return str.substring(indexOfSpace + 1);
}

function firstWordToLowerCase(str) {
  const arr = str.split(' ');
  if (!arr.length) return str;
  const firstWord = arr[0];
  arr[0] = firstWord.toLowerCase();
  return arr.join(' ');
}

async function parseCommitMessage(message, repoUrl, fetchUserFunc) {
  let cAst;

  try {
    const ast = parser(firstWordToLowerCase(message));
    cAst = toConventionalChangelogFormat(ast);
  } catch (error) {
    // Not a valid commit
    const firstWord = message.split(' ')[0];

    if (firstWord === 'Merge') {
      cAst = {
        subject: message.split('\n')[0],
        type: 'merge',
      };
    } else if (
      ['fix', 'hotfix'].find(x => (firstWord.toLowerCase().startsWith(x)))
    ) {
      cAst = {
        subject: removeFirstWord(message.split('\n')[0]),
        type: 'fix',
      };
    } else {
      cAst = {
        subject: message.split('\n')[0],
        type: 'other',
      };
    }
  }

  const found = cAst.subject.match(PR_REGEX);
  if (found) {
    const pullNumber = found[1];

    try {
      const { username, userUrl } = await fetchUserFunc(pullNumber);
      cAst.subject = cAst.subject.replace(
        PR_REGEX,
        () =>
          `[#${pullNumber}](${repoUrl}/pull/${pullNumber}) by [${username}](${userUrl})`
      );
    } catch (error) {
      // We found a #123 style hash, but it wasn't a valid PR. Ignore.
    }
  }

  return cAst;
}

module.exports = parseCommitMessage;
