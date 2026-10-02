import type { WrappedTheme } from '@sensorr/sensorr'

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

const LOOKS: Record<WrappedTheme, { band: (year: number) => string, button: { background: string, color: string, font?: string } }> = {
  tele: {
    band: (year) => `
      ${stripe(['#f4efe4', '#f8d44a', '#63b7c9', '#5aa457', '#b14e9e', '#d1312b', '#2135a3'], 44)}
      <tr><td style="background:#f4efe4;padding:22px 26px 20px">
        <div style="font:400 12px/1 ${MONO};letter-spacing:2px;text-transform:uppercase;color:#5c564a">Rétrospective</div>
        <div style="font:italic 800 44px/1 'Barlow Condensed','Arial Narrow',Arial,sans-serif;color:#d1312b;padding-top:6px">${year}</div>
      </td></tr>`,
    button: { background: '#d1312b', color: '#ffffff', font: `italic 600 16px/1 ${BODY}` },
  },
  labo: {
    band: (year) => `
      ${perforations()}
      <tr><td style="background:#2a1c12;padding:18px 26px">
        <div style="font:400 12px/1 ${MONO};letter-spacing:2px;text-transform:uppercase;color:#ff4b1f">Rétrospective</div>
        <div style="font:800 46px/1 'Big Shoulders Display','Arial Narrow',Arial,sans-serif;color:#ffb238;padding-top:6px">${year}</div>
      </td></tr>
      ${perforations()}`,
    button: { background: '#ffb238', color: '#120c08' },
  },
  videoclub: {
    band: (year) => `
      ${stripe(['#ff3fa4', '#3ef2ff', '#ff3fa4'], 6)}
      <tr><td style="background:#221a3d;padding:34px 26px 20px">
        <div style="font:400 12px/1 ${MONO};letter-spacing:2px;text-transform:uppercase;color:#3ef2ff">Rétrospective</div>
        <div style="font:400 44px/1 'Tilt Neon','Trebuchet MS',sans-serif;color:#ff3fa4;text-shadow:0 0 6px #ff3fa4;padding-top:6px">${year}</div>
      </td></tr>`,
    button: { background: '#ff3fa4', color: '#0c0a1a' },
  },
  scenario: {
    band: (year) => `
      <tr><td style="background:#fbfaf5;padding:40px 26px 20px">
        <div style="font:700 14px/1 'Courier Prime','Courier New',monospace;color:#a3201a">Rétrospective</div>
        <div style="font:700 28px/1.2 'Courier Prime','Courier New',monospace;color:#1b1a17;padding-top:8px"><span style="background:#fff06a;padding:0 4px">${year}</span></div>
      </td></tr>`,
    button: { background: '#fbfaf5', color: '#1b1a17', font: `700 16px/1 'Courier Prime','Courier New',monospace` },
  },
  affiche: {
    band: (year) => `
      <tr><td style="background:#b8955a;padding:40px 26px 20px">
        <div style="font:600 12px/1 ${BODY};letter-spacing:2px;text-transform:uppercase;color:#241a2e">Rétrospective</div>
        <div style="font:400 42px/1 'Permanent Marker',Impact,'Arial Black',sans-serif;color:#241a2e;padding-top:6px">${year}</div>
      </td></tr>
      ${stripe(['#5c4668', '#b3221a', '#5c4668'], 8)}`,
    button: { background: '#b3221a', color: '#e9dcc0' },
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

function plain(href: string) {
  return `<p style="margin:16px 0 0;font:400 13px/1.4 ${MONO};color:#808080;word-break:break-all">or open ${escape(href)}</p>`
}

function document(subject: string, rows: string, preheader = '') {
  return `<!doctype html>
<html lang="en">
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

function layout({ subject, picto, word, greeting, title, paragraphs, arrivals, action, foot }: Layout): Mail {
  const html = document(subject, `
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
  ${plain(action.href)}
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
  test: ({ url }: { url: string }) => layout({
    subject: 'Mail works',
    picto: 'test',
    word: 'Test',
    title: 'Mail works',
    paragraphs: ['Your friends will get their invitation, welcome, reminders, movies ready to watch and wrapped from this address.'],
    action: { label: 'Open the Mail settings', href: `${url}/settings/mail` },
    foot: ['Sent by your Sensorr from its Mail settings.'],
  }),
  invitation: ({ url, sender, service, name }: { url: string, sender: string, service: string, name?: string }) => layout({
    subject: `${sender} invites you to share your movie wishes`,
    picto: 'invitation',
    word: 'Invitation',
    greeting: name ? `Hi ${name},` : undefined,
    title: `${sender} invites you to share your movie wishes`,
    paragraphs: [`Add movies to your Plex Watchlist, and ${service} gets them for you on ${sender}'s Plex. Connect your Plex account once to start, it takes a minute.`],
    action: { label: 'Connect my Plex', href: `${url}/keep-in-touch` },
    foot: [`Sent by ${escape(sender)} with Sensorr. You got this mail because ${escape(sender)} ${name ? 'shares their Plex with you' : 'typed your address'}.`],
  }),
  welcome: ({ url, sender, service, name, wrapped }: { url: string, sender: string, service: string, name: string, wrapped?: string }) => layout({
    subject: "You're all set",
    picto: 'welcome',
    word: 'Welcome',
    greeting: `Hi ${name},`,
    title: "You're all set",
    paragraphs: [
      `Every movie you add to your Plex Watchlist now reaches ${service}. You will get a mail when your movies are ready to watch.`,
      ...(wrapped ? [`Your year on ${sender}'s Plex has its own page too, it fills up as you watch: ${url}/wrapped/${wrapped}`] : []),
    ],
    action: { label: 'Open my Watchlist', href: 'https://app.plex.tv/desktop/#!/watchlist' },
    foot: [`Sent by ${escape(sender)} with Sensorr.`],
  }),
  reconnect: ({ url, sender, service, name, reminder, unsubscribe }: { url: string, sender: string, service: string, name: string, reminder: number, unsubscribe: string }) => layout({
    subject: `Your movie wishes no longer reach ${service}`,
    picto: 'reconnect',
    word: 'Reconnect',
    greeting: `Hi ${name},`,
    title: 'Reconnect your Plex account',
    paragraphs: [`Plex disconnected your account from ${service}, so the movies you add to your Watchlist no longer reach it. Reconnect once and it works again.`],
    action: { label: 'Reconnect Plex', href: `${url}/keep-in-touch` },
    foot: [`Sent by ${escape(sender)} with Sensorr.`, reminder ? `Reminder ${reminder} of 3.` : '', link(unsubscribe, 'Stop these reminders')].filter(Boolean),
  }),
  requests: ({ sender, name, arrivals, unsubscribe }: { sender: string, name: string, arrivals: Arrival[], unsubscribe: string }) => layout({
    subject: arrivals.length === 1 ? `${arrivals[0].title} is ready to watch` : `${arrivals.length} of your requests are ready to watch`,
    picto: 'requests',
    word: 'Ready to watch',
    greeting: `Hi ${name},`,
    title: arrivals.length === 1 ? `${arrivals[0].title} is ready to watch` : `${arrivals.length} of your requests are ready to watch`,
    paragraphs: [`${arrivals.length === 1 ? 'It just reached' : 'They just reached'} ${sender}'s Plex.`, ...(arrivals.length > SHOWN ? [`And ${arrivals.length - SHOWN} more, all on Plex.`] : [])],
    arrivals: arrivals.slice(0, SHOWN),
    action: { label: 'Open Plex', href: 'https://app.plex.tv' },
    foot: [`Sent by ${escape(sender)} with Sensorr, once a week when something new arrives.`, link(unsubscribe, 'Stop these mails')],
  }),
  wrapped: ({ url, sender, name, token, year, look, open = false }: { url: string, sender: string, name: string, token: string, year: number, look: WrappedTheme, open?: boolean }): Mail => {
    // Sent by hand before the edition closes, the page is still filling up
    const subject = open ? `Your ${year} on Plex, so far` : `Your ${year} on Plex is ready`
    const title = open ? 'Your year on Plex, so far' : 'Your year on Plex is ready'
    const body = open
      ? `Every evening you spent on ${sender}'s Plex since 1 December ${year - 1}, on one page made for you. It fills up until 1 December ${year}.`
      : `Every evening you spent on ${sender}'s Plex, from 1 December ${year - 1} to 1 December ${year}, on one page made for you.`
    const href = `${url}/wrapped/${token}`
    const { band, button: colors } = LOOKS[look] || LOOKS.tele
    const html = document(subject, `
${band(year)}
<tr><td style="padding:30px 26px 28px;font:400 16px/1.6 ${BODY};color:#e6e6e6">
  <p style="margin:0 0 14px;color:#bfbfbf">Hi ${escape(name)},</p>
  <h1 style="margin:0 0 14px;font:800 26px/1.25 ${DISPLAY};color:#ffffff">${escape(title)}</h1>
  <p style="margin:0 0 22px">${escape(body)}</p>
  ${button('Open my wrapped', href, colors, false)}
  ${plain(href)}
</td></tr>
<tr><td style="border-top:1px solid #262626;padding:18px 26px 22px;font:400 13px/1.5 ${BODY};color:#8c8c8c">Sent by ${escape(sender)} with Sensorr${open ? '' : ', once a year'}.</td></tr>`, body)
    const text = [`Hi ${name},`, title, body, `Open my wrapped: ${href}`, `Sent by ${sender} with Sensorr${open ? '' : ', once a year'}.`].join('\n\n')
    return { subject, html, text }
  },
}

const KINDS: Record<string, string> = { reconnect: 'the reminders to reconnect your Plex account', requests: 'the weekly mail of your requests ready to watch' }

// The page behind an unsubscribe link: a mail scanner opens every link, so opening it stops nothing until the button is pressed
export const unsubscribePage = ({ kind, done, found }: { kind: string, done: boolean, found: boolean }) => {
  const what = KINDS[kind]
  const title = !what || !found ? 'This link no longer works' : done ? 'Done, no more of these mails' : 'Stop these mails?'
  const body = !what || !found
    ? 'Ask the person who sent you the mail to stop it for you.'
    : done ? `You will no longer get ${what}.` : `You will no longer get ${what}. The other mails keep coming.`

  return document(title, `
${stripe(BARS, 6)}
<tr><td align="center" style="padding:40px 26px;text-align:center;font:400 16px/1.6 ${BODY};color:#e6e6e6">
  <h1 style="margin:0 0 14px;font:800 26px/1.25 ${DISPLAY};color:#ffffff">${escape(title)}</h1>
  <p style="margin:0 0 22px">${escape(body)}</p>
  ${what && found && !done ? `<form method="post"><button type="submit" style="border:0;cursor:pointer;background:${GREEN};color:#000000;padding:17px 24px;font:600 16px/1 ${BODY}">Stop these mails</button></form>` : ''}
</td></tr>`)
}
