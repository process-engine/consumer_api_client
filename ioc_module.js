'use strict'

const ConsumerApiClientService = require('./dist/commonjs/index').ConsumerApiClientService;

function registerInContainer(container) {
  container.register('ConsumerApiClientService', ConsumerApiClientService)
    .dependencies('HttpService')
    .injectPromiseLazy('HttpService')
    .configure('consumer_api_client:consumer_api_client_service');
}

module.exports.registerInContainer = registerInContainer;
