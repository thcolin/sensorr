// mingo declares its entry points in `exports`, which the `node` module resolution of this workspace does not read
declare module 'mingo/aggregator' { export * from 'mingo/types/aggregator' }
declare module 'mingo/query' { export * from 'mingo/types/query' }
declare module 'mingo/core' { export * from 'mingo/types/core' }
declare module 'mingo/util' { export * from 'mingo/types/util' }
declare module 'mingo/operators/accumulator' { export * from 'mingo/types/operators/accumulator' }
declare module 'mingo/operators/expression' { export * from 'mingo/types/operators/expression' }
declare module 'mingo/operators/pipeline' { export * from 'mingo/types/operators/pipeline' }
declare module 'mingo/operators/projection' { export * from 'mingo/types/operators/projection' }
declare module 'mingo/operators/query' { export * from 'mingo/types/operators/query' }
declare module 'mingo/operators/window' { export * from 'mingo/types/operators/window' }
