export const compose = (...hocs) => (Component) => hocs.reverse().reduce((acc, hoc) => hoc(acc), Component)
