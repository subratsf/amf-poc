import * as amf from 'amf-client-js';
import fs from 'fs-extra';
import { ApiBase } from './api-base.js';
import path from 'path';
import { AmfDocument } from '@api-components/amf-components/src/helpers/amf';
/**
 * Builds a JSON file with the API definition out from the RAML file.
 */
export class JsonGenerator extends ApiBase {

  private apiFile;

  private apiType;

  private output;

  private AMF: any = amf;

  /**
   * Constructs the builder.
   *
   * @param {String} apiFile Target RAML file to build the console from.
   * @param {Object} opts Options passed from the command line.
   */
  constructor(apiFile: any, opts: any) {
    super(opts);
    if (!apiFile) {
      throw new Error('The apiFile argument is not specified.');
    }
    if (!this.opts.output) {
      this.opts.output = './api-model.json';
    }
    this.apiFile = apiFile;
    this.apiType = this.opts.apiType;
    this.output = this.opts.output;
  }
  /**
   * Runs the command.
   *
   * @return {Promise}
   */
  async run(): Promise<AmfDocument> {
    let msg = 'Generating API model from ' + this.apiFile;
    msg += ' using ' + this.apiType + ' parser';
    this.logger.info(msg);

    amf.plugins.document.WebApi.register();
    amf.plugins.document.Vocabularies.register();
    amf.plugins.features.AMFValidation.register();
    await amf.Core.init()
    const parsedFile = await this._parse(this.apiFile, this.apiType);
    const validateDoc = await this._validate(parsedFile, this.apiType);
    const resolvedDoc = await this._resolve(validateDoc, this.apiType);
    return await this._save(resolvedDoc, this.output);
  }
  /**
   * Parses API file to AMF graph.
   * @param {String} location API file location
   * @param {String} type API type.
   * @return {Promise} Promise resolved to AMF model.
   */
  _parse(location: string, type: string) {
    this.logger.info('AMF ready.');
    this.logger.info('Running API parser...');
    const parser = amf.Core.parser(type, 'application/json');
    let url;
    if (location.indexOf('http') === 0) {
      url = location;
    } else {
      url = `file://${location}`;
    }
    return parser.parseFileAsync(url);
  }
  /**
   * Validates API graph
   * @param {Object} doc Parsed document
   * @param {String} type API type.
   * @return {Promise} Promise resolved to the same document.
   */
  _validate(doc: any, type: string) {
    this.logger.info('API parsed.');
    this.logger.info('Validating API...');
    let validateProfile;
    switch (type) {
      case 'RAML 1.0': validateProfile = amf.ProfileNames.RAML; break;
      case 'RAML 0.8': validateProfile = amf.ProfileNames.RAML08; break;
      case 'OAS 2.0':
      case 'OAS 3.0':
        validateProfile = amf.ProfileNames.OAS;
        break;
    }
    return amf.AMF.validate(doc, amf.ProfileNames.RAML, {profileName: amf.ProfileNames.RAML})
    .then((report: any) => {
      if (!report.conforms) {
        this.logger.warn(report.toString());
      } else {
        this.logger.info('API valid.');
      }
      return doc;
    });
  }
  /**
   * Validates types in the model
   * @param {Object} doc Parsed document
   * @param {String} type API type.
   * @return {Promise} Promise resolved to the resolved document.
   */
  _resolve(doc: any, type: string) {
    this.logger.info('Resolving API model for API components...');
    const resolver = amf.Core.resolver(type);
    return resolver.resolve(doc, 'editing');
  }
  /**
   * Generates json-ld model and saves it to specified location.
   * @param {Object} doc Document ot use to generate the model
   * @param {String} file Output file location
   * @return {Promise} Resolved when file is saved.
   */
  _save(doc: any, file: any) {
    this.logger.info('Generating json-ld model...');
    const opts = new amf.render.RenderOptions().withSourceMaps.withCompactUris;
    const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
    const start = Date.now();
    return generator.generateString(doc, opts)
    .then((data: any) => {
      const time = Date.now() - start;
      this.logger.info(`Model ready in ${time} milliseconds`);
      this.logger.info('Storing API data model to file: ' + file);
      const dir = path.dirname(file);
      return fs.ensureDir(dir)
      .then(() => {
      fs.writeFile(file, data, 'utf8');
      return data});
    });
  }
}
