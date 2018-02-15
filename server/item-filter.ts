/* ============================================================================
 * Copyright (c) Glen Marker. All rights reserved.
 * Licensed under the MIT license. See the LICENSE file in the project root for
 * license information.
 * ===========================================================================*/

// TODO(glen): investigate incremental updating. We would likely need to figure
//  out the block context surrounding the lines prior to sending it into the
//  line parser again. We'd also need a way to remove diagnostics and color
//  information based on removed or modified lines. Doesn't sound that difficult,
//  but we'll see.

import * as assert from "assert";
import { Diagnostic, Range, DiagnosticSeverity } from "vscode-languageserver";
import {
  ColorInformation
} from "vscode-languageserver-protocol/lib/protocol.colorProvider.proposed";

import { ConfigurationValues, FilterData } from "./common";
import { getOrdinal } from "./helpers";
import { LineParser } from "./line-parser";

const filterData: FilterData = require("../filter.json");

export interface FilterParseResult {
  colorInformation: ColorInformation[];
  diagnostics: Diagnostic[];
}

export interface BlockContext {
  config: ConfigurationValues,
  source: "item-filter",
  root?: Range;
  blockFound: boolean;
  classes: string[];
  previousRules: Map<string, number>;
}

export class ItemFilter {
  private readonly parsed: Promise<FilterParseResult>;

  constructor(config: ConfigurationValues, text: string) {
    this.parsed = this.fullUpdate(config, text);
  }

  async getDiagnostics(): Promise<Diagnostic[]> {
    const { diagnostics } = await this.parsed;
    return diagnostics;
  }

  async getColorInformation(): Promise<ColorInformation[]> {
    const { colorInformation } = await this.parsed;
    return colorInformation;
  }

  private async fullUpdate(config: ConfigurationValues, text: string):
    Promise<FilterParseResult> {

    const lines = text.split(/\r?\n/g);
    const result: FilterParseResult = { colorInformation: [], diagnostics: [] };

    let context: BlockContext = {
      config,
      source: "item-filter",
      blockFound: false,
      classes: [],
      previousRules: new Map()
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineParser = new LineParser(config, context, line, i);
      lineParser.parse();

      if (!lineParser.keyword) continue;
      this.performBlockDiagnostics(context, lineParser);

      if (lineParser.diagnostics.length > 0) {
        result.diagnostics.push.apply(result.diagnostics, lineParser.diagnostics);
      }

      if (lineParser.color) {
        result.colorInformation.push(lineParser.color);
      }
    }

    return result;
  }

  private performBlockDiagnostics(context: BlockContext, parser: LineParser) {
    if (parser.keyword !== "Show" && parser.keyword !== "Hide") {
      if (context.blockFound) {
        const ruleLimit = filterData.ruleLimits[parser.keyword];
        assert(ruleLimit !== undefined);

        const occurrences = context.previousRules.get(parser.keyword);
        if (occurrences !== undefined && occurrences >= ruleLimit) {
          parser.diagnostics.push({
            message: `${getOrdinal(occurrences + 1)} occurrence of the` +
              ` ${parser.keyword} rule within a block with a limit of ${ruleLimit}.`,
            range: parser.keywordRange,
            severity: DiagnosticSeverity.Warning,
            source: context.source
          });
        }

        context.previousRules.set(parser.keyword, occurrences === undefined ? 1 : occurrences);
      } else {
        // We have a rule without an enclosing block.
        parser.diagnostics.push({
          message: `Block rule ${parser.keyword} found outside of a Hide or Show block.`,
          range: parser.lineRange,
          severity: DiagnosticSeverity.Error,
          source: context.source
        });
      }
    } else {
      context.blockFound = true;
    }
  }
}
