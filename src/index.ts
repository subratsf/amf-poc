import { DomEventsAmfStore } from '@api-components/amf-components';
import { JsonGenerator } from "./lib/generate-json.js";
import path from 'path';
import { AmfDocument } from '@api-components/amf-components/src/helpers/amf';
export async function getAMFModel(){
    const jsonGen = new JsonGenerator(path.resolve('./src/specs/QuipAdminAPI.json'),{apiType: 'OAS 3.0', output: './api-model.json', ga: false});
    const data:AmfDocument = await jsonGen.run();
    const apiStore = new DomEventsAmfStore();
    apiStore.amf = data;
    return data;
};

getAMFModel();