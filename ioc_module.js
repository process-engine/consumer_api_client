'use strict'

const {
  ExternalAccessor,
  InternalAccessor,
  ConsumerApiClientService,
} = require('./dist/commonjs/index');

function registerInContainer(container) {

  container.register('ConsumerApiExternalAccessor', ExternalAccessor)
    .dependencies('HttpService');

  container.register('ConsumerApiInternalAccessor', InternalAccessor)
    .dependencies('ConsumerApiService');

  container.register('ConsumerApiClientService', ConsumerApiClientService)
    .dependencies('ConsumerApiExternalAccessor');
}

module.exports.registerInContainer = registerInContainer;
