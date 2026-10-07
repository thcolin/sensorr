import baseConfig, { literalStrings } from '../../eslint.config.mjs'
import nx from '@nx/eslint-plugin'

export default [...baseConfig, ...nx.configs['flat/react'], literalStrings(['**/wrapped/src/**'])]
