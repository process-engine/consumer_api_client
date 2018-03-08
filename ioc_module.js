'use strict'

const ConsumerApiClientService = require('./dist/commonjs/index').ConsumerApiClientService;

const routerDiscoveryTag = require('@essential-projects/core_contracts').RouterDiscoveryTag;

function registerInContainer(container) {
  container.register('ConsumerApiClientService', ConsumerApiClientService)
    .dependencies('HttpClient')
    .configure('consumer_api:consumer_api_service');
}

module.exports.registerInContainer = registerInContainer;
