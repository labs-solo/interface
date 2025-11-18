/** biome-ignore-all lint/style/noRestrictedGlobals: need to reference chrome for test setup */
import { DEFAULT_LANGUAGE_CODE, DEFAULT_LANGUAGE_TAG } from 'utilities/src/device/constants'
import { getDeviceLocales } from 'utilities/src/device/locales.web'
import { Mock, vi } from 'vitest'

// Mock the chrome utilities to return the global chrome mock from vitest setup
vi.mock('utilities/src/chrome/chrome', () => ({
  getChromeWithThrow: (): typeof chrome => global.chrome,
}))

describe(getDeviceLocales, () => {
  const MOCK_LANGUAGE = 'es-ES'
  const originalLanguagesDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'languages')
  const originalLanguageDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'language')

  beforeEach(() => {
    // eslint-disable-next-line no-extra-semi
    ;(chrome.i18n.getUILanguage as Mock).mockImplementation(() => MOCK_LANGUAGE)
  })

  afterEach(() => {
    if (originalLanguagesDescriptor) {
      Object.defineProperty(window.navigator, 'languages', originalLanguagesDescriptor)
    } else {
      delete (window.navigator as Navigator & { languages?: string[] }).languages
    }

    if (originalLanguageDescriptor) {
      Object.defineProperty(window.navigator, 'language', originalLanguageDescriptor)
    } else {
      delete (window.navigator as Navigator & { language?: string }).language
    }
  })

  it('should return the device locale', () => {
    expect(getDeviceLocales).not.toThrow()
    expect(getDeviceLocales()).toEqual([{ languageCode: MOCK_LANGUAGE, languageTag: MOCK_LANGUAGE }])
  })

  it('should return the default locale if an error occurs', () => {
    // eslint-disable-next-line no-extra-semi
    ;(chrome.i18n.getUILanguage as Mock).mockImplementation(() => {
      throw new Error('test error')
    })
    Object.defineProperty(window.navigator, 'languages', { value: [], configurable: true })
    Object.defineProperty(window.navigator, 'language', { value: '', configurable: true })

    expect(getDeviceLocales).not.toThrow()
    expect(getDeviceLocales()).toEqual([{ languageCode: DEFAULT_LANGUAGE_CODE, languageTag: DEFAULT_LANGUAGE_TAG }])
  })
})
