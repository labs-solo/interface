import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
import { DEFAULT_LANGUAGE_CODE, DEFAULT_LANGUAGE_TAG, DeviceLocale } from 'utilities/src/device/constants'
import { logger } from 'utilities/src/logger/logger'

function getNavigatorLocales(): DeviceLocale[] | undefined {
  if (typeof navigator === 'undefined') {
    return undefined
  }

  const preferred = navigator.languages.length ? navigator.languages : navigator.language ? [navigator.language] : []
  if (!preferred.length) {
    return undefined
  }

  return preferred.map((languageTag) => {
    const [languageCodeCandidate] = languageTag.split(/[-_]/)
    const languageCode = languageCodeCandidate || null
    return { languageCode, languageTag }
  })
}

export function getDeviceLocales(): DeviceLocale[] {
  try {
    const chrome = getChromeWithThrow()
    if (typeof chrome.i18n.getUILanguage === 'function') {
      const language = chrome.i18n.getUILanguage()
      if (language) {
        return [{ languageCode: language, languageTag: language }]
      }
    }
  } catch (e) {
    logger.error(e, {
      level: 'warn',
      tags: { file: 'utils.ts', function: 'getDeviceLocales' },
    })
  }

  const navigatorLocales = getNavigatorLocales()
  if (Array.isArray(navigatorLocales) && navigatorLocales.length > 0) {
    return navigatorLocales
  }

  return [
    {
      languageCode: DEFAULT_LANGUAGE_CODE,
      languageTag: DEFAULT_LANGUAGE_TAG,
    },
  ]
}
