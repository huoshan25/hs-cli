import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { afterEach, describe, expect, it } from 'vitest'
import { collectOfficialSkills, resolveOfficialSkillsRoot } from '../../util/skills-official'

function writeSkill(root: string, id: string, description: string, version = '1.0.0') {
  const skillRoot = path.join(root, id)
  fs.mkdirpSync(path.join(skillRoot, 'examples'))
  fs.mkdirpSync(path.join(skillRoot, 'tests'))
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), `# ${id}\n`)
  fs.writeFileSync(
    path.join(skillRoot, 'metadata.yaml'),
    [
      `name: ${id}`,
      `version: ${version}`,
      'owner: test',
      'status: active',
      `description: ${description}`
    ].join('\n')
  )
}

let tempRoot: string | null = null
const envOfficialDir = process.env.HS_CLI_OFFICIAL_SKILLS_DIR

afterEach(() => {
  process.env.HS_CLI_OFFICIAL_SKILLS_DIR = envOfficialDir
  if (tempRoot) {
    fs.removeSync(tempRoot)
    tempRoot = null
  }
})

describe('official skills', () => {
  it('resolves official skills root from env and collects official skills', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-cli-official-test-'))
    const officialRoot = path.join(tempRoot, 'official-skills')
    fs.mkdirpSync(officialRoot)
    writeSkill(officialRoot, 'official-skill', 'official skill description', '0.3.0')

    process.env.HS_CLI_OFFICIAL_SKILLS_DIR = officialRoot

    expect(resolveOfficialSkillsRoot()).toBe(path.resolve(officialRoot))

    const result = collectOfficialSkills()
    expect(result.root).toBe(path.resolve(officialRoot))
    expect(result.items.map((item) => item.id)).toEqual(['official-skill'])
    expect(result.items[0]?.source).toBe('official')
  })
})
