'use strict'

const {
  ExternalAccessor,
  InternalAccessor,
  ConsumerApiClientService,
} = require('./dist/commonjs/index');

function registerInContainer(container) {

  container.register('ConsumerApiExternalAccessor', ExternalAccessor)
    .dependencies('HttpService')
    .configure('consumer_api_client:consumer_api_external_accessor');

  container.register('ConsumerApiInternalAccessor', InternalAccessor)
    .dependencies('ConsumerApiService');

  container.register('ConsumerApiClientService', ConsumerApiClientService)
    .dependencies('ConsumerApiExternalAccessor');
}

module.exports.registerInContainer = registerInContainer;
