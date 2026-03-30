export interface SkillMeta {
  id: string;
  name: string;
  version: string;
  owner: string;
  status: string;
  description: string;
  tags: string[];
}

export interface SkillsIndex {
  skills: SkillMeta[];
}
