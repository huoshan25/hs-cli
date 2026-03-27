import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { execFileSync } from 'child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { cloneGitSkillSource, isGitSkillSource, normalizeGitUrl } from '../../util/skills-git'

function writeSkill(root: string, id: string) {
  fs.mkdirpSync(path.join(root, 'examples'))
  fs.mkdirpSync(path.join(root, 'tests'))
  fs.writeFileSync(path.join(root, 'SKILL.md'), `# ${id}\n`)
  fs.writeFileSync(
    path.join(root, 'metadata.yaml'),
    [
      `name: ${id}`,
      'version: 1.2.3',
      'owner: test',
      'status: active',
      'description: 当用户请求安装 git skill 时，用于校验仓库内容并完成安装。'
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

describe('git skill source', () => {
  it('detects git-style inputs', () => {
    expect(isGitSkillSource('git+https://example.com/demo.git')).toBe(true)
    expect(isGitSkillSource('https://example.com/demo.git')).toBe(true)
    expect(isGitSkillSource('git@github.com:team/demo.git')).toBe(true)
    expect(isGitSkillSource('./local-skill')).toBe(false)
    expect(normalizeGitUrl('git+https://example.com/demo.git')).toBe('https://example.com/demo.git')
  })

  it('clones a local git repository and resolves the skill root', async () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-cli-skill-git-test-'))
    const repoRoot = path.join(tempRoot, 'repo')
    fs.mkdirpSync(repoRoot)
    writeSkill(repoRoot, 'git-skill')

    execFileSync('git', ['init'], { cwd: repoRoot })
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot })
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: repoRoot })
    execFileSync('git', ['add', '.'], { cwd: repoRoot })
    execFileSync('git', ['commit', '-m', 'init'], { cwd: repoRoot })

    const cloned = await cloneGitSkillSource(repoRoot)
    try {
      expect(await fs.pathExists(path.join(cloned.sourcePath, 'SKILL.md'))).toBe(true)
      expect(await fs.pathExists(path.join(cloned.sourcePath, 'metadata.yaml'))).toBe(true)
    } finally {
      await cloned.cleanup()
    }
  })
})
