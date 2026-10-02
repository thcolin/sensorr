import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectOf, withTag } from './main.mjs'

test('withTag rewrites the SENSORR_TAG line and nothing else', () => {
  assert.equal(
    withTag('SENSORR_USERNAME=me\nSENSORR_TAG=dev\nSENSORR_TAGLINE=keep\n', 'beta'),
    'SENSORR_USERNAME=me\nSENSORR_TAG=beta\nSENSORR_TAGLINE=keep\n',
  )
})

test('withTag rewrites every SENSORR_TAG line, compose reading the last one', () => {
  assert.equal(withTag('SENSORR_TAG=dev\nA=1\nSENSORR_TAG=beta', 'latest'), 'SENSORR_TAG=latest\nA=1\nSENSORR_TAG=latest')
})

test('withTag leaves a commented line alone and appends the tag', () => {
  assert.equal(withTag('# SENSORR_TAG=dev\nA=1', 'beta'), '# SENSORR_TAG=dev\nA=1\nSENSORR_TAG=beta\n')
})

test('withTag writes the tag into an empty or missing file', () => {
  assert.equal(withTag('', 'latest'), 'SENSORR_TAG=latest\n')
})

test('projectOf reads the compose labels, the env file defaulting to .env', () => {
  assert.deepEqual(projectOf({
    'com.docker.compose.project': 'sensorr',
    'com.docker.compose.project.working_dir': '/srv/sensorr',
    'com.docker.compose.project.config_files': '/srv/sensorr/docker-compose.yml,/srv/sensorr/docker-compose.override.yml',
  }), {
    name: 'sensorr',
    directory: '/srv/sensorr',
    files: ['/srv/sensorr/docker-compose.yml', '/srv/sensorr/docker-compose.override.yml'],
    env: '/srv/sensorr/.env',
  })
})
