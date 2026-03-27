import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { afterEach, describe, expect, it } from 'vitest'
import { collectSkills, locateWorkspaceSkillsRoot } from '../../util/skills-sources'

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

afterEach(() => {
  if (tempRoot) {
    fs.removeSync(tempRoot)
    tempRoot = null
  }
})

describe('collectSkills', () => {
  it('collects workspace skills only', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-cli-skills-test-'))
    const workspaceRoot = path.join(tempRoot, 'repo', 'skills')
    fs.mkdirpSync(workspaceRoot)
    writeSkill(workspaceRoot, 'shared-skill', 'workspace version', '0.3.0')
    writeSkill(workspaceRoot, 'workspace-only', 'workspace only')

    const cwd = path.join(tempRoot, 'repo', 'nested', 'dir')
    fs.mkdirpSync(cwd)
    const result = collectSkills({ cwd })

    expect(result.root).toBe(path.resolve(workspaceRoot))
    expect(result.items.map((item) => item.id)).toEqual(['shared-skill', 'workspace-only'])
    expect(result.items.every((item) => item.source === 'workspace')).toBe(true)
  })

  it('locates workspace skills root from nested directory', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-cli-skills-test-'))
    const workspaceRoot = path.join(tempRoot, 'repo', 'skills')
    const nested = path.join(tempRoot, 'repo', 'packages', 'feature')
    fs.mkdirpSync(workspaceRoot)
    fs.mkdirpSync(nested)

    expect(locateWorkspaceSkillsRoot(nested)).toBe(path.resolve(workspaceRoot))
  })
})
