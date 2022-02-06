@sensorr/cli
============



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@sensorr/cli.svg)](https://npmjs.org/package/@sensorr/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@sensorr/cli.svg)](https://npmjs.org/package/@sensorr/cli)
[![License](https://img.shields.io/npm/l/@sensorr/cli.svg)](https://github.com/thcolin/sensorr/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @sensorr/cli
$ sensorr COMMAND
running command...
$ sensorr (-v|--version|version)
@sensorr/cli/0.10.0 darwin-x64 node-v15.10.0
$ sensorr --help [COMMAND]
USAGE
  $ sensorr COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sensorr hello [FILE]`](#sensorr-hello-file)
* [`sensorr help [COMMAND]`](#sensorr-help-command)

## `sensorr hello [FILE]`

describe the command here

```
USAGE
  $ sensorr hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ sensorr hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/thcolin/sensorr/blob/v0.10.0/src/commands/hello.ts)_

## `sensorr help [COMMAND]`

display help for sensorr

```
USAGE
  $ sensorr help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_
<!-- commandsstop -->
