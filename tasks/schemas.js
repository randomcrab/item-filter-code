/* ============================================================================
 * Copyright (c) Glen Marker. All rights reserved.
 * Licensed under the MIT license. See the LICENSE file in the project root for
 * license information.
 * ===========================================================================*/

// Generates JSON schemas from our TypeScript files, allowing us to validate
// JSON files directly against those types.

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const TJS = require('typescript-json-schema');

const projectRoot = path.join(__dirname, '..');
const schemaOutputDir = path.join(projectRoot, 'out', 'schemas');

const options = {
  noExtraProps: true,
  required: true
};

const schemas = [
  {
    sourceFilePath: path.join(projectRoot, 'src', 'types', 'data.ts'),
    type: 'FilterData',
    outputFileName: 'filter.json'
  },
  {
    sourceFilePath: path.join(projectRoot, 'src', 'types', 'data.ts'),
    type: 'ItemSourceData',
    outputFileName: 'items-source.json'
  },
  {
    sourceFilePath: path.join(projectRoot, 'src', 'types', 'data.ts'),
    type: 'ItemData',
    outputFileName: 'items-generated.json'
  },
  {
    sourceFilePath: path.join(projectRoot, 'src', 'types', 'data.ts'),
    type: 'ModData',
    outputFileName: 'mods.json'
  },
  {
    sourceFilePath: path.join(projectRoot, 'src', 'types', 'data.ts'),
    type: 'SoundEffectData',
    outputFileName: 'sfx.json'
  },
  {
    sourceFilePath: path.join(projectRoot, 'src', 'types', 'data.ts'),
    type: 'SuggestionData',
    outputFileName: 'suggestions.json'
  },
  {
    sourceFilePath: path.join(projectRoot, 'src', 'types', 'data.ts'),
    type: 'UniqueData',
    outputFileName: 'uniques.json'
  },
  {
    sourceFilePath: path.join(projectRoot, 'src', 'parsers-nextgen', 'inputs.ts'),
    type: 'FilterParseData',
    outputFileName: 'parser-inputs.json'
  }
];

mkdirp.sync(schemaOutputDir);

for (const e of schemas) {
  const file = e.sourceFilePath;
  const program = TJS.getProgramFromFiles([path.resolve(file)]);
  const schema = TJS.generateSchema(program, e.type, options);
  const outputFile = path.join(schemaOutputDir, e.outputFileName);

  fs.writeFileSync(outputFile, JSON.stringify(schema));
}
