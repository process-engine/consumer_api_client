'use strict'

const ConsumerApiClientService = require('./dist/commonjs/index').ConsumerApiClientService;

const routerDiscoveryTag = require('@essential-projects/core_contracts').RouterDiscoveryTag;

function registerInContainer(container) {
  container.register('ConsumerApiClientService', ConsumerApiClientService)
    .dependencies('HttpService')
    .injectPromiseLazy('HttpService')
    .configure('consumer_api_client:consumer_api_client_service');
}

module.exports.registerInContainer = registerInContainer;
