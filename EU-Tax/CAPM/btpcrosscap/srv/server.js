const cds = require('@sap/cds')
const express = require('express')
module.exports = cds.server

//if (process.env.NODE_ENV !== 'production') {
const cds_swagger = require('cds-swagger-ui-express')
cds.on('bootstrap', app => {
  app.use(cds_swagger());
  app.use(express.static(__dirname + '/public'));
})