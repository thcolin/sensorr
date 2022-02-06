import { keyframes } from '@emotion/core'

export const animations = {
  placeholder: keyframes`
    0%{
      transform: translate3d(-80%, 0, 0);
    }
    100%{
      transform: translate3d(0%, 0, 0);
    }
  `,
  bounce: keyframes`
    0%, 100% {
      transform: scale(0.0) translateZ(0);
    }
    50% {
      transform: scale(1.0) translateZ(0);
    }
  `,
  pulse: keyframes`
    0%, 100% {
      willChange: opacity,
      opacity: 0;
    }
    50% {
      willChange: opacity,
      opacity: 1;
    }
  `,
  blink: keyframes`
    0% {
      willChange: opacity,
      opacity: 1;
    }
    50% {
      willChange: opacity,
      opacity: 0;
    }
    75% {
      willChange: opacity,
      opacity: 0;
    }
    100% {
      willChange: opacity,
      opacity: 1;
    }
  `,
}
