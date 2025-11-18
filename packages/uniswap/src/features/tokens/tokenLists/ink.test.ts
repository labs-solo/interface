import fs from 'fs'
import path from 'path'
import { INK_VELODROME_TOKEN_LIST } from 'uniswap/src/features/tokens/tokenLists/ink'

describe('Ink token list artifact', () => {
  it('matches the public JSON payload served by apps/web', () => {
    const jsonPath = path.resolve(__dirname, '../../../../../..', 'apps/web/public/tokenlists/ink.velodrome.json')
    const fileContents = fs.readFileSync(jsonPath, 'utf-8')
    const parsed = JSON.parse(fileContents)

    expect(parsed).toEqual(INK_VELODROME_TOKEN_LIST)
  })
})
