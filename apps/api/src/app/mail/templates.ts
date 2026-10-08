import { WRAPPED_LOOKS, type WrappedTheme } from '@sensorr/sensorr'
import type { Translator } from '@sensorr/i18n/server'

// Mail clients ignore stylesheets and most modern CSS: every mail is tables with inline styles, fonts fall back in Gmail
export interface Mail {
  subject: string
  html: string
  text: string
  picto?: Picto
}

export type Picto = 'invitation' | 'welcome' | 'reconnect' | 'requests' | 'test'

export interface Arrival {
  title: string
  detail: string
  poster?: string
  href?: string
}

const FONTS = 'https://fonts.googleapis.com/css2?family=Raleway:wght@800&family=Open+Sans:ital,wght@0,400;0,600;1,600&family=Fira+Code&family=Barlow+Condensed:ital,wght@1,800&family=Big+Shoulders+Display:wght@800&family=Tilt+Neon&family=Courier+Prime:wght@700&family=Permanent+Marker&display=swap'
const DISPLAY = `'Raleway', 'Helvetica Neue', Arial, sans-serif`
const BODY = `'Open Sans', 'Segoe UI', Verdana, sans-serif`
const MONO = `'Fira Code', Consolas, Menlo, monospace`
const GROUND = '#050505'
const CARD = '#f2f0ea'
const GREEN = '#01d076'
// The test card of the app, `apps/web/src/layout/LoadingBar.tsx`
const BARS = ['rgb(235, 235, 235)', 'rgb(235, 235, 16)', 'rgb(16, 235, 235)', 'rgb(16, 235, 16)', 'rgb(235, 16, 235)', 'rgb(235, 16, 16)', 'rgb(16, 16, 235)']

const { tele, labo, videoclub, scenario, affiche } = WRAPPED_LOOKS

const LOOKS: Record<WrappedTheme, { band: (year: number, label: string) => string, button: { background: string, color: string, font?: string } }> = {
  tele: {
    band: (year, label) => `
      ${stripe(tele.stripe, 44)}
      <tr><td style="background:${tele.ground};padding:22px 26px 20px">
        <div style="font:400 12px/1 ${MONO};letter-spacing:2px;text-transform:uppercase;color:${tele.label}">${label}</div>
        <div style="font:italic 800 44px/1 ${tele.display.family};color:${tele.display.color};padding-top:6px">${year}</div>
      </td></tr>`,
    button: { ...tele.button, font: `italic 600 16px/1 ${BODY}` },
  },
  labo: {
    band: (year, label) => `
      ${perforations()}
      <tr><td style="background:${labo.ground};padding:18px 26px">
        <div style="font:400 12px/1 ${MONO};letter-spacing:2px;text-transform:uppercase;color:${labo.label}">${label}</div>
        <div style="font:800 46px/1 ${labo.display.family};color:${labo.display.color};padding-top:6px">${year}</div>
      </td></tr>
      ${perforations()}`,
    button: labo.button,
  },
  videoclub: {
    band: (year, label) => `
      ${stripe(videoclub.stripe, 6)}
      <tr><td style="background:${videoclub.ground};padding:34px 26px 20px">
        <div style="font:400 12px/1 ${MONO};letter-spacing:2px;text-transform:uppercase;color:${videoclub.label}">${label}</div>
        <div style="font:400 44px/1 ${videoclub.display.family};color:${videoclub.display.color};text-shadow:0 0 6px ${videoclub.display.color};padding-top:6px">${year}</div>
      </td></tr>`,
    button: videoclub.button,
  },
  scenario: {
    band: (year, label) => `
      <tr><td style="background:${scenario.ground};padding:40px 26px 20px">
        <div style="font:700 14px/1 ${scenario.display.family};color:${scenario.label}">${label}</div>
        <div style="font:700 28px/1.2 ${scenario.display.family};color:${scenario.display.color};padding-top:8px"><span style="background:#fff06a;padding:0 4px">${year}</span></div>
      </td></tr>`,
    // The mail is dark, the page of the script stands out on it
    button: { background: scenario.ground, color: scenario.ink, font: `700 16px/1 ${scenario.display.family}` },
  },
  affiche: {
    band: (year, label) => `
      <tr><td style="background:${affiche.ground};padding:40px 26px 20px">
        <div style="font:600 12px/1 ${BODY};letter-spacing:2px;text-transform:uppercase;color:${affiche.label}">${label}</div>
        <div style="font:400 42px/1 ${affiche.display.family};color:${affiche.display.color};padding-top:6px">${year}</div>
      </td></tr>
      ${stripe(affiche.stripe, 8)}`,
    button: affiche.button,
  },
}

export const senderOf = (from: string) => from.match(/^\s*"?([^"<]*?)"?\s*</)?.[1] || from.split('@')[0] || 'Sensorr'

// Every link of a mail is a web address: a stored value never becomes a `javascript:` or `data:` link
const safe = (href: string) => /^https?:\/\//i.test(href) ? href : '#'

const unescape = (value: string) => value.replace(/&(amp|lt|gt|quot|#39);/g, (entity, name) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[name]))

export const escape = (value: string | number) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))

function stripe(colors: string[], height: number) {
  return `<tr><td style="padding:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${colors.map((color) => `<td style="background:${color};height:${height}px;line-height:${height}px;font-size:0">&nbsp;</td>`).join('')}</tr></table></td></tr>`
}

function perforations() {
  const holes = Array.from({ length: 24 }, (_, index) => `<td style="background:${index % 2 ? '#f6ecd8' : '#1d130c'};width:${index % 2 ? 4 : 6}%;height:8px;line-height:8px;font-size:0">&nbsp;</td>`).join('')
  return `<tr><td style="background:#1d130c;padding:5px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${holes}</tr></table></td></tr>`
}

function button(label: string, href: string, look: { background: string, color: string, font?: string } = { background: GREEN, color: '#000000' }, center = true) {
  // Outlook on Windows ignores the padding of a link, the cell holds it there and the link everywhere else
  return `<table role="presentation" cellpadding="0" cellspacing="0"${center ? ' align="center" style="margin:0 auto"' : ''}><tr><td style="background:${look.background};mso-padding-alt:17px 24px"><a href="${escape(safe(href))}" style="display:inline-block;padding:17px 24px;font:${look.font || `600 16px/1 ${BODY}`};color:${look.color};text-decoration:none">${escape(label)}</a></td></tr></table>`
}

function plain(t: Translator, href: string) {
  return `<p style="margin:16px 0 0;font:400 13px/1.4 ${MONO};color:#808080;word-break:break-all">${escape(t('mail.or', { href }))}</p>`
}

function document(t: Translator, subject: string, rows: string, preheader = '') {
  return `<!doctype html>
<html lang="${t.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escape(subject)}</title>
<link rel="stylesheet" href="${FONTS}">
</head>
<body style="margin:0;padding:0;background:${GROUND}">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escape(preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GROUND}"><tr><td align="center" style="padding:24px 12px">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-collapse:collapse;background:${GROUND}">
${rows}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`
}

interface Layout {
  t: Translator
  subject: string
  picto: Picto
  word: string
  greeting?: string
  title: string
  paragraphs: string[]
  arrivals?: Arrival[]
  action: { label: string, href: string }
  foot: string[]
}

function layout({ t, subject, picto, word, greeting, title, paragraphs, arrivals, action, foot }: Layout): Mail {
  const html = document(t, subject, `
${stripe(BARS, 6)}
<tr><td align="center" style="background:${CARD};padding:30px 26px 24px">
  <img src="cid:${picto}" width="72" height="72" alt="" style="display:block;border:0;width:72px;height:72px">
  <div style="padding-top:12px;font:600 12px/1 ${BODY};letter-spacing:2px;text-transform:uppercase;color:#5b5a55">${escape(word)}</div>
</td></tr>
<tr><td align="center" style="padding:30px 26px 28px;text-align:center;font:400 16px/1.6 ${BODY};color:#e6e6e6">
  ${greeting ? `<p style="margin:0 0 14px;color:#bfbfbf">${escape(greeting)}</p>` : ''}
  <h1 style="margin:0 0 14px;font:800 26px/1.25 ${DISPLAY};color:#ffffff">${escape(title)}</h1>
  ${paragraphs.map((paragraph) => `<p style="margin:0 0 22px">${escape(paragraph)}</p>`).join('')}
  ${arrivals?.length ? posters(arrivals) : ''}
  ${button(action.label, action.href)}
  ${plain(t, action.href)}
</td></tr>
<tr><td style="border-top:1px solid #262626;padding:18px 26px 22px;text-align:center;font:400 13px/1.5 ${BODY};color:#8c8c8c">${foot.join(' ')}</td></tr>`, paragraphs[0])

  const text = [greeting, title, ...paragraphs, ...(arrivals || []).map(({ title, detail }) => `- ${title}, ${detail}`), `${action.label}: ${action.href}`, foot.map((line) => line.replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '$2: $1').replace(/<[^>]+>/g, '')).map(unescape).join(' ')]
    .filter(Boolean)
    .join('\n\n')

  return { subject, html, text, picto }
}

function posters(arrivals: Arrival[]) {
  const rows = []

  for (let index = 0; index < arrivals.length; index += 3) {
    const row = arrivals.slice(index, index + 3)
    rows.push(`<tr>${[...row, ...Array(3 - row.length).fill(null)].map((arrival) => arrival ? `
      <td width="33%" valign="top" style="padding:0 6px 18px;text-align:left">
        ${arrival.href ? `<a href="${escape(safe(arrival.href))}" style="text-decoration:none">` : ''}
        ${arrival.poster
          ? `<img src="${escape(arrival.poster)}" width="160" alt="" style="display:block;width:100%;max-width:160px;height:auto;border:0;border-radius:3px">`
          : `<div style="max-width:160px;height:180px;background:#1a1a1a;border-radius:3px"></div>`}
        <div style="padding-top:8px;font:600 14px/1.3 ${BODY};color:#f2f2f2">${escape(arrival.title)}</div>
        ${arrival.href ? '</a>' : ''}
        <div style="font:400 13px/1.4 ${BODY};color:#949494">${escape(arrival.detail)}</div>
      </td>` : '<td width="33%"></td>').join('')}</tr>`)
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">${rows.join('')}</table>`
}

// A busy week stays one screen of posters
const SHOWN = 12

const link = (href: string, label: string) => `<a href="${escape(safe(href))}" style="color:#b8b8b8">${escape(label)}</a>`

export const mails = {
  test: ({ t, url }: { t: Translator, url: string }) => layout({
    t,
    subject: t('mail.test.subject'),
    picto: 'test',
    word: t('mail.test.word'),
    title: t('mail.test.subject'),
    paragraphs: [t('mail.test.paragraph')],
    action: { label: t('mail.test.action'), href: `${url}/settings/mail` },
    foot: [t('mail.test.foot')],
  }),
  invitation: ({ t, url, sender, service, name }: { t: Translator, url: string, sender: string, service: string, name?: string }) => layout({
    t,
    subject: t('mail.invitation.subject', { sender }),
    picto: 'invitation',
    word: t('mail.invitation.word'),
    greeting: name ? t('mail.greeting', { name }) : undefined,
    title: t('mail.invitation.subject', { sender }),
    paragraphs: [t('mail.invitation.paragraph', { sender, service })],
    action: { label: t('mail.invitation.action'), href: `${url}/keep-in-touch` },
    foot: [escape(t('mail.invitation.foot', { sender, named: name ? 'yes' : 'no' }))],
  }),
  welcome: ({ t, url, sender, service, name, wrapped }: { t: Translator, url: string, sender: string, service: string, name: string, wrapped?: string }) => layout({
    t,
    subject: t('mail.welcome.subject'),
    picto: 'welcome',
    word: t('mail.welcome.word'),
    greeting: t('mail.greeting', { name }),
    title: t('mail.welcome.subject'),
    paragraphs: [
      t('mail.welcome.paragraph', { service }),
      ...(wrapped ? [t('mail.welcome.wrapped', { sender, href: `${url}/wrapped/${wrapped}` })] : []),
    ],
    action: { label: t('mail.watchlist'), href: 'https://app.plex.tv/desktop/#!/watchlist' },
    foot: [escape(t('mail.sent', { sender }))],
  }),
  reconnect: ({ t, url, sender, service, name, reminder, unsubscribe }: { t: Translator, url: string, sender: string, service: string, name: string, reminder: number, unsubscribe: string }) => layout({
    t,
    subject: t('mail.reconnect.subject', { service }),
    picto: 'reconnect',
    word: t('mail.reconnect.word'),
    greeting: t('mail.greeting', { name }),
    title: t('mail.reconnect.title'),
    paragraphs: [t('mail.reconnect.paragraph', { service })],
    action: { label: t('mail.reconnect.action'), href: `${url}/keep-in-touch` },
    foot: [escape(t('mail.sent', { sender })), reminder ? escape(t('mail.reconnect.reminder', { reminder })) : '', link(unsubscribe, t('mail.reconnect.stop'))].filter(Boolean),
  }),
  reconnected: ({ t, sender, service, name }: { t: Translator, sender: string, service: string, name: string }) => layout({
    t,
    subject: t('mail.reconnected.subject', { service }),
    picto: 'reconnect',
    word: t('mail.reconnected.word'),
    greeting: t('mail.greeting', { name }),
    title: t('mail.reconnected.title'),
    paragraphs: [t('mail.reconnected.paragraph', { service })],
    action: { label: t('mail.watchlist'), href: 'https://app.plex.tv/desktop/#!/watchlist' },
    foot: [escape(t('mail.sent', { sender }))],
  }),
  requests: ({ t, sender, name, arrivals, unsubscribe }: { t: Translator, sender: string, name: string, arrivals: Arrival[], unsubscribe: string }) => layout({
    t,
    subject: t('mail.requests.subject', { count: arrivals.length, title: arrivals[0]?.title }),
    picto: 'requests',
    word: t('mail.requests.word'),
    greeting: t('mail.greeting', { name }),
    title: t('mail.requests.subject', { count: arrivals.length, title: arrivals[0]?.title }),
    paragraphs: [t('mail.requests.paragraph', { count: arrivals.length, sender }), ...(arrivals.length > SHOWN ? [t('mail.requests.more', { count: arrivals.length - SHOWN })] : [])],
    arrivals: arrivals.slice(0, SHOWN),
    action: { label: t('mail.requests.action'), href: 'https://app.plex.tv' },
    foot: [escape(t('mail.requests.foot', { sender })), link(unsubscribe, t('mail.requests.stop'))],
  }),
  wrapped: ({ t, url, sender, name, token, year, look, open = false }: { t: Translator, url: string, sender: string, name: string, token: string, year: number, look: WrappedTheme, open?: boolean }): Mail => {
    // Sent by hand before the edition closes, the page is still filling up
    const values = { open: open ? 'yes' : 'no', sender, year, previous: year - 1 }
    const subject = t('mail.wrapped.subject', values)
    const title = t('mail.wrapped.title', values)
    const body = t('mail.wrapped.body', values)
    const foot = t('mail.wrapped.foot', values)
    const href = `${url}/wrapped/${token}`
    const { band, button: colors } = LOOKS[look] || LOOKS.tele
    const html = document(t, subject, `
${band(year, escape(t('mail.wrapped.band')))}
<tr><td style="padding:30px 26px 28px;font:400 16px/1.6 ${BODY};color:#e6e6e6">
  <p style="margin:0 0 14px;color:#bfbfbf">${escape(t('mail.greeting', { name }))}</p>
  <h1 style="margin:0 0 14px;font:800 26px/1.25 ${DISPLAY};color:#ffffff">${escape(title)}</h1>
  <p style="margin:0 0 22px">${escape(body)}</p>
  ${button(t('mail.wrapped.action'), href, colors, false)}
  ${plain(t, href)}
</td></tr>
<tr><td style="border-top:1px solid #262626;padding:18px 26px 22px;font:400 13px/1.5 ${BODY};color:#8c8c8c">${escape(foot)}</td></tr>`, body)
    const text = [t('mail.greeting', { name }), title, body, `${t('mail.wrapped.action')}: ${href}`, foot].join('\n\n')
    return { subject, html, text }
  },
}

// The page behind an unsubscribe link: a mail scanner opens every link, so opening it stops nothing until the button is pressed
export const unsubscribePage = ({ t, kind, done, found }: { t: Translator, kind: string, done: boolean, found: boolean }) => {
  const known = ['reconnect', 'requests'].includes(kind) && found
  const what = known && t(`mail.unsubscribe.kinds.${kind}`)
  const state = !known ? 'broken' : done ? 'done' : 'ask'
  const title = t(`mail.unsubscribe.${state}.title`)
  const body = t(`mail.unsubscribe.${state}.body`, { what })

  return document(t, title, `
${stripe(BARS, 6)}
<tr><td align="center" style="padding:40px 26px;text-align:center;font:400 16px/1.6 ${BODY};color:#e6e6e6">
  <h1 style="margin:0 0 14px;font:800 26px/1.25 ${DISPLAY};color:#ffffff">${escape(title)}</h1>
  <p style="margin:0 0 22px">${escape(body)}</p>
  ${state === 'ask' ? `<form method="post"><button type="submit" style="border:0;cursor:pointer;background:${GREEN};color:#000000;padding:17px 24px;font:600 16px/1 ${BODY}">${escape(t('mail.unsubscribe.action'))}</button></form>` : ''}
</td></tr>`)
}
