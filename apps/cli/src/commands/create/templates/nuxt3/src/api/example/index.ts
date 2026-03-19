import type { exampleReq, exampleRes } from '~/api/example/type'

export async function getExample(params: exampleReq) {
  return await fetchRequest.get<exampleRes>('/example', params)
}
