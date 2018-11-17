import React, { PureComponent } from 'react'
import theme from 'theme'

const banners = [
  {
    url: require('ressources/banners/ToyStory.jpg'),
    position: 'center',
  },
  {
    url: require('ressources/banners/2001ASpaceOdyssey.jpg'),
    position: 'top',
  },
  {
    url: require('ressources/banners/Alien.jpg'),
    position: 'top',
  },
  {
    url: require('ressources/banners/Creed.jpg'),
    position: 'top',
  },
  {
    url: require('ressources/banners/Furious7.jpg'),
    position: 'top',
  },
  {
    url: require('ressources/banners/IndianaJones.jpg'),
    position: 'top',
  },
  // {
  //   url: require('ressources/banners/IronMan.jpg'),
  //   position: 'top',
  // },
  {
    url: require('ressources/banners/Jaws.jpg'),
    position: 'center',
  },
  {
    url: require('ressources/banners/LordOfTheRings.jpg'),
    position: 'center',
  },
  {
    url: require('ressources/banners/MadMaxFuryRoad.jpg'),
    position: 'center',
  },
  {
    url: require('ressources/banners/Scream.jpg'),
    position: 'center',
  },
  {
    url: require('ressources/banners/SilenceOfTheLambs.jpg'),
    position: 'center',
  },
  {
    url: require('ressources/banners/TheBreakfastClub.jpg'),
    position: 'center',
  },
  {
    url: require('ressources/banners/TheMartian.jpg'),
    position: 'center',
  },
  {
    url: require('ressources/banners/TheMatrix.jpg'),
    position: 'top',
  },
]

const styles = {
  element: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundSize: 'cover',
    height: '15em',
    padding: '0 10em 0 0',
  },
  title: {
    color: theme.colors.white,
    fontSize: '6em',
    fontWeight: 800,
  },
  powered: {
    display: 'flex',
    color: theme.colors.white,
    padding: '0.5em 0',
  },
  logo: {
    width: '3em',
    height: '3em',
    margin: '0 1em',
  },
  github: {
    position: 'absolute',
    height: '1.5em',
    width: '1.5em',
    bottom: '1em',
    right: '1em',
  }
}

export default class Header extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      banner: banners[~~(banners.length * Math.random())],
    }
  }
  render() {
    const { banner, ...state } = this.state

    return (
      <div style={{ ...styles.element, backgroundImage: `url(${banner.url})`, backgroundPosition: banner.position }}>
        <h1 style={styles.title}>Sensorr</h1>
        <div style={styles.powered}>
          <span>powered by </span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 251.34 222.81" style={styles.logo}>
            <path fill={theme.colors.primary} d="M2944.56 2236.34c14.6 0 24.48-9.88 24.48-24.48v-159.28c0-14.6-9.88-24.48-24.48-24.48h-202.37c-14.6 0-24.48 9.88-24.48 24.48v198.33l12.56-14.56v-183.77a11.94 11.94 0 0 1 11.92-11.92h202.37a11.94 11.94 0 0 1 11.92 11.92v159.28a11.94 11.94 0 0 1-11.92 11.92h-183.74l-12.56 12.56-.08-.1" transform="translate(-2717.71 -2028.09)"/>
            <path fill={theme.colors.primary} d="M61.38 77.29h6.94V49.52h8.64v-6.89H52.74v6.89h8.64v27.77zM99.53 77.29h6.94V42.58h-6.94v13.88H89.14V42.58H82.2v34.71h6.94V63.4h10.39v13.89zM132.25 70.34h-13.02V63.4h11.12v-6.94h-11.12v-6.94h12.43v-6.94h-19.38v34.71h19.97v-6.95zM68.66 101.35L54.97 86.11h-2.23v35.24h7.04v-19.37l8.88 9.32 8.88-9.32-.04 19.37h7.03V86.11h-2.18l-13.69 15.24z"/>
            <path fill={theme.colors.primary} d="M2825.75 2114.16c-23.88 0-23.88 35.77 0 35.77s23.88-35.77 0-35.77zm0 28.59c-13.88 0-13.88-21.45 0-21.45s13.88 21.45 0 21.45z" transform="translate(-2717.71 -2028.09)"/>
            <path fill={theme.colors.primary} d="M165.37 86.65h6.94v34.7h-6.94zM185.07 114.41v-6.94h11.12v-6.94h-11.12v-6.94h12.43v-6.94h-19.37v34.7h19.96v-6.94h-13.02z"/>
            <path fill={theme.colors.primary} d="M2780.79 2158.81h-10.34v34.7h10.34c23.1 0 23.1-34.7 0-34.7zm0 27.76h-3.4v-20.82h3.4c13.49 0 13.49 20.82 0 20.82z" transform="translate(-2717.71 -2028.09)"/>
            <path fill={theme.colors.primary} d="M2824 2176.13c2.18-1.5 3.11-4.22 3.2-6.84.15-6.12-3.69-10.53-9.85-10.53h-13.74v34.75h13.74a10.32 10.32 0 0 0 10.24-10.44 8.43 8.43 0 0 0-3.59-6.94zm-13.4-10.44h6.17a3.51 3.51 0 0 1 0 7h-6.17v-7zm6.17 20.87h-6.17v-6.94h6.17a3.41 3.41 0 0 1 3.49 3.45 3.45 3.45 0 0 1-3.49 3.5z" transform="translate(-2717.71 -2028.09)"/>
            <path fill={theme.colors.primary} d="M144.01 105.38l-9.14-18.73h-8.01l16.37 35.43h1.56l16.36-35.43h-8.01l-9.13 18.73z" />
          </svg>
        </div>
        <a href="https://github.com/thcolin/sensorr" target="_blank" style={styles.github}>
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" transform="scale(64)" fill={theme.colors.primary} />
          </svg>
        </a>
      </div>
    )
  }
}
