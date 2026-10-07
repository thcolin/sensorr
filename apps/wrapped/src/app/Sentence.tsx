import { ReactElement, ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'

// Rendered whole, its figures marked: Trans keeps the children of a component it is given as `<1/>`
const Marked = ({ text, figures }: { text: string, figures: (text: string) => ReactNode }) => <>{figures(text)}</>
// A piece the look leaves as the rest of the sentence
const Plain = ({ children }: { children?: ReactNode }) => children

// One sentence of the edition: `<0>` the piece the look sets in its own tag, `<1/>` a text of the sheet with its figures marked
// « Tu éteins à <0>2 h 14</0><1/>. », « En <0>mars</0> : <1/> »
export const Sentence = ({ i18nKey, values, tag, text, figures }: { i18nKey: string, values: Record<string, string>, tag?: ReactElement, text: string, figures: (text: string) => ReactNode }) => {
  const { t } = useTranslation()
  return <Trans t={t} i18nKey={i18nKey} values={values} components={[tag || <Plain />, <Marked text={text} figures={figures} />]} />
}
