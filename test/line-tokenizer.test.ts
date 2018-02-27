/* ============================================================================
 * Copyright (c) Glen Marker. All rights reserved.
 * Licensed under the MIT license. See the LICENSE file in the project root for
 * license information.
 * ===========================================================================*/

import { assert } from "chai";

import { TokenParser } from "../src/server/token-parser";

describe("LineParser.constructor()", () => {
  it("sets LineParser.textStartIndex correctly", () => {
    const p = new TokenParser("  Value", 0);
    assert.strictEqual(p.textStartIndex, 2);
  });

  it("sets LineParser.textEndIndex correctly", () => {
    const p = new TokenParser("Value  ", 0);
    assert.strictEqual(p.textEndIndex, 5);
  });

  it("sets both textStartIndex and textEndIndex correctly", () => {
    const p = new TokenParser("  Value   ", 0);
    assert.strictEqual(p.textStartIndex, 2);
    assert.strictEqual(p.textEndIndex, 7);
  });

  it("sets the textStartIndex and textEndIndex correctly when there are " +
      "multiple text segments", () => {
    const p = new TokenParser("Value Test", 0);
    assert.strictEqual(p.textStartIndex, 0);
    assert.strictEqual(p.textEndIndex, 10);
  });

  it("correctly sets textStartIndex and textEndIndex when given a segment " +
      "containing numbers", () => {
    const p = new TokenParser("  Value 42", 0);
    assert.strictEqual(p.textStartIndex, 2);
    assert.strictEqual(p.textEndIndex, 10);
  });

  it("sets the start and end index correctly when there is no " +
      "whitespace", () => {
    const p = new TokenParser("Value", 0);
    assert.strictEqual(p.textStartIndex, 0);
    assert.strictEqual(p.textEndIndex, 5);
  });

  it("sets the start and end index correctly even when both would " +
      "be 0", () => {
    const p = new TokenParser("", 0);
    assert.strictEqual(p.textStartIndex, 0);
    assert.strictEqual(p.textEndIndex, 0);
  });

  it("correctly sets the original length on a string", () => {
    const p = new TokenParser("Test", 0);
    assert.strictEqual(p.originalLength, 4);
  });

  it("correctly sets the original length on an empty string", () => {
    const p = new TokenParser("", 0);
    assert.strictEqual(p.originalLength, 0);
  });

  it("correctly identifies an empty string as such", () => {
    const p = new TokenParser("", 0);
    assert(p.empty);
  });

  it("correctly identifies a commneted string as such", () => {
    const p = new TokenParser("# Test", 0);
    assert(p.isCommented());
  });
});

describe("LineParser.empty -> boolean", () => {
  it("correctly handles an empty line", () => {
    const p = new TokenParser("", 0);
    assert(p.empty);
  });

  it("correctly handles a space-only line", () => {
    const p = new TokenParser("  ", 0);
    assert(p.empty);
  });

  it("correctly handles a tab-only line", () => {
    const p = new TokenParser("\t\t", 0);
    assert(p.empty);
  });

  it("correctly handles a mixed-whitespace line", () => {
    const p = new TokenParser(" \t ", 0);
    assert(p.empty);
  });

  it("correctly handles whitespace led by a number", () => {
    const p = new TokenParser("42 \t", 0);
    p.nextNumber();
    assert(p.empty);
  });

  it("correctly handles a lone boolean", () => {
    const p = new TokenParser("True", 0);
    p.nextBoolean();
    assert(p.empty);
  });

  it("correctly handles whitespace led by an operator", () => {
    const p = new TokenParser(">= \t ", 0);
    p.nextOperator();
    assert(p.empty);
  });

  it("correctly handles whitespace led by a word", () => {
    const p = new TokenParser("text ", 0);
    p.nextWord();
    assert(p.empty);
  });

  it("correctly handles whitespace led by a string", () => {
    const p = new TokenParser(`"Test Text" \t`, 0);
    p.nextString();
    assert(p.empty);
  });

  it("correctly handles a single word", () => {
    const p = new TokenParser("Test", 0);
    assert.isFalse(p.empty);
  });

  it("correctly handles a word with leading space characters", () => {
    const p = new TokenParser("  Test", 0);
    assert.isFalse(p.empty);
  });

  it("correctly handles a word with a leading tab character", () => {
    const p = new TokenParser("\tTest", 0);
    assert.isFalse(p.empty);
  });

  it("correctly handles all filter-specific unicode characters", () => {
    const p = new TokenParser("ö", 0);
    assert.isFalse(p.empty);
  });

  it("correctly handles filter-specific unicode characters with leading " +
      "spaces", () => {
    const p = new TokenParser("   ö", 0);
    assert.isFalse(p.empty);
  });

  it("correctly handles filter-specific unicode characters with a leading " +
      "tab", () => {
    const p = new TokenParser("\tö", 0);
    assert.isFalse(p.empty);
  });

  it("thinks of Path of Exile comments as normal text", () => {
    const p = new TokenParser("#", 0);
    assert.isFalse(p.empty);
  });

  it("works properly when processing a string of many elements", () => {
    const p = new TokenParser(`42 Test "Test Value" \t`, 0);
    p.nextNumber();
    assert.isFalse(p.empty);
    p.nextWord();
    assert.isFalse(p.empty);
    p.nextString();
    assert(p.empty);
  });

  it("throws when given multiple lines", () => {
    assert.throws(() => {
      new TokenParser("\n", 0);
    });
  });
});

describe("LineParser.isCommented() -> boolean", () => {
  it("correctly detects lone pound characters as comments", () => {
    const p = new TokenParser("#", 0);
    assert(p.isCommented());
  });

  it("correctly detects standard Path of Exile comments", () => {
    const p = new TokenParser("# Test", 0);
    assert(p.isCommented());
  });

  it("correctly detects comments with leading spaces", () => {
    const p = new TokenParser("  # Test", 0);
    assert(p.isCommented());
  });

  it("correctly detects comments with a leading tab", () => {
    const p = new TokenParser("\t# Test", 0);
    assert(p.isCommented());
  });

  it("correctly handles multiple pound signs", () => {
    const p = new TokenParser("##Test", 0);
    assert(p.isCommented());
  });

  it("correctly detects comments with no spacing at all", () => {
    const p = new TokenParser("#Test", 0);
    assert(p.isCommented());
  });

  it("correctly detects comments with trailing filter-specific " +
      "unicode", () => {
    const p = new TokenParser("#ö", 0);
    assert(p.isCommented());
  });

  it("correctly handles comments led by a string", () => {
    const p = new TokenParser('"Test Value" # Test', 0);
    p.nextString();
    assert(p.isCommented());
  });

  it("correctly detects comments with leading filter-specific " +
      "unicode", () => {
    const p = new TokenParser("ö#", 0);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores comments with leading text", () => {
    const p = new TokenParser("test#", 0);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores comments a leading word", () => {
    const p = new TokenParser("test # ", 0);
    assert.isFalse(p.isCommented());
  });

  it("throws an expection if given multiple lines", () => {
    assert.throws(() => {
      new TokenParser("# Test \n # Test", 0);
    });
  });
});

describe("LineParser.isIgnored() -> boolean", () => {
  // There are only really four cases that we need to test here, as both
  // isCommented() and isEmpty() are thoroughly tested.
  it("knows that words shouldn't be ignored", () => {
    const p = new TokenParser("Test", 0);
    assert.isFalse(p.isIgnored());
  });

  it("knows that strings shouldn't be ignored", () => {
    const p = new TokenParser('"Test"', 0);
    assert.isFalse(p.isIgnored());
  });

  it("knows that numbers shouldn't be ignored", () => {
    const p = new TokenParser("42", 0);
    assert.isFalse(p.isIgnored());
  });

  it("knows that operators shouldn't be ignored", () => {
    const p = new TokenParser(">=", 0);
    assert.isFalse(p.isIgnored());
  });

  it("knows not to ignore meaningful values followed by a comment", () => {
    const p = new TokenParser(" Test # Text", 0);
    assert.isFalse(p.isIgnored());
  });

  it("knows an empty line can be ignored", () => {
    const p = new TokenParser("", 0);
    assert(p.isIgnored());
  });

  it("knows a line consisting of only whitespace can be ignored", () => {
    const p = new TokenParser(" \t \t", 0);
    assert(p.isIgnored());
  });

  it("knows a Path of Exile comment can be ignored", () => {
    const p = new TokenParser("# Test", 0);
    assert(p.isIgnored());
  });
});

describe("LineParser.nextNumber() -> ParseResult", () => {
  it("correctly handles a lone number", () => {
    const p = new TokenParser("42", 0);
    const currentResult = p.nextNumber();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, 42);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles leading space characters", () => {
    const p = new TokenParser(" 42", 0);
    const currentResult = p.nextNumber();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, 42);
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 3);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 3);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles leading tab characters", () => {
    const p = new TokenParser("\t42", 0);
    const currentResult = p.nextNumber();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, 42);
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 3);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 3);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles trailing text strings", () => {
    const p = new TokenParser("  42 test", 0);
    const currentResult = p.nextNumber();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, 42);
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, " test");
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles trailing comments", () => {
    const p = new TokenParser("  42 # test", 0);
    const currentResult = p.nextNumber();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, 42);
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, " # test");
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("correctly handles trailing filter-specific unicode " +
      "characters", () => {
    const p = new TokenParser("   42 ö", 0);
    const currentResult = p.nextNumber();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, 42);
    assert.strictEqual(currentResult.range.start.character, 3);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, " ö");
    assert.strictEqual(p.currentIndex, 5);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles lines with a word", () => {
    const p = new TokenParser("test", 0);
    p.nextNumber();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles a number led by a word", () => {
    const p = new TokenParser("test 42", 0);
    p.nextNumber();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles mixed number, text strings", () => {
    const p = new TokenParser("42test", 0);
    p.nextNumber();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles mixed number, strings with filter-specific unicode " +
      "characters", () => {
    const p = new TokenParser("42ö", 0);
    p.nextNumber();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles a number led by a comment", () => {
    const p = new TokenParser("# 42", 0);
    p.nextNumber();
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("doesn't mutate a following number when removing a number", () => {
    const p = new TokenParser("42 42", 0);
    p.nextNumber();
    assert.strictEqual(p.text, " 42");
    assert.strictEqual(p.currentIndex, 2);
  });

  it("doesn't mutate a following word when removing a number", () => {
    const p = new TokenParser("42 Test", 0);
    p.nextNumber();
    assert.strictEqual(p.text, " Test");
    assert.strictEqual(p.currentIndex, 2);
  });

  it("doesn't mutate a following string when removing a number", () => {
    const p = new TokenParser(' 42 "Test"', 0);
    p.nextNumber();
    assert.strictEqual(p.text, ' "Test"');
    assert.strictEqual(p.currentIndex, 3);
  });

  it("throws an error when given multiple lines", () => {
    assert.throws(() => {
      new TokenParser("42\ntest", 0);
    });
  });
});

describe("LineParser.nextOperator() -> ParseResult", () => {
  it("correctly handles the '<' operator", () => {
    const p = new TokenParser("<", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, "<");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 1);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 1);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles the '>' operator", () => {
    const p = new TokenParser(">", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, ">");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 1);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 1);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles the '=' operator", () => {
    const p = new TokenParser("=", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, "=");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 1);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 1);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles the '<=' operator", () => {
    const p = new TokenParser("<=", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, "<=");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles the '>=' operator", () => {
    const p = new TokenParser(">=", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, ">=");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles the '>=' operator", () => {
    const p = new TokenParser(" >", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, ">");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles trailing whitespace", () => {
    const p = new TokenParser("< ", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, "<");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 1);
    assert.strictEqual(p.text, " ");
    assert.strictEqual(p.currentIndex, 1);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles surrounding whitespace", () => {
    const p = new TokenParser(" > ", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, ">");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, " ");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles tab whitespace characters", () => {
    const p = new TokenParser("\t<\t", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, "<");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, "\t");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles filter-specific unicode characters", () => {
    const p = new TokenParser("< ö", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, "<");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 1);
    assert.strictEqual(p.text, " ö");
    assert.strictEqual(p.currentIndex, 1);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles an operator trailed by a commnet", () => {
    const p = new TokenParser("> # Test", 0);
    const currentResult = p.nextOperator();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.strictEqual(currentResult.value, ">");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 1);
    assert.strictEqual(p.text, " # Test");
    assert.strictEqual(p.currentIndex, 1);
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("correctly ignores an operaotr surrounded by text", () => {
    const p = new TokenParser("a > b", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("ignores operators suffixed by a word", () => {
    const p = new TokenParser(">test", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("ignores operators suffixed by a filter-specific unicode " +
      "character", () => {
    const p = new TokenParser(">ö", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("ignores operators prefixed by a filter-specific unicode " +
      "character", () => {
    const p = new TokenParser("ö>", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("ignores operators prefixed and suffixed by characters", () => {
    const p = new TokenParser("a>b", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider multiple '>' characters to be an operator", () => {
    const p = new TokenParser(">>", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider multiple '<' characters to be an operator", () => {
    const p = new TokenParser("<<", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it('does not consider "=<" to be an operator', () => {
    const p = new TokenParser("=<", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it('does not consider "==" to be an operator', () => {
    const p = new TokenParser("==", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("ignores operators surrounded by double quotes", () => {
    const p = new TokenParser('">"', 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("ignores operators surrounded by single quotes", () => {
    const p = new TokenParser("'<'", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles an operator led by a comment", () => {
    const p = new TokenParser("#Test >", 0);
    p.nextOperator();
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("doesn't mutate a following number when removing an operator", () => {
    const p = new TokenParser("> 42", 0);
    p.nextOperator();
    assert.strictEqual(p.text, " 42");
    assert.strictEqual(p.currentIndex, 1);
  });

  it("doesn't mutate a following word when removing an operator", () => {
    const p = new TokenParser("< Test", 0);
    p.nextOperator();
    assert.strictEqual(p.text, " Test");
    assert.strictEqual(p.currentIndex, 1);
  });

  it("doesn't mutate a following string when removing an operator", () => {
    const p = new TokenParser(' >= "Test"', 0);
    p.nextOperator();
    assert.strictEqual(p.text, ' "Test"');
    assert.strictEqual(p.currentIndex, 3);
  });

  it("throws an error when given multiple lines", () => {
    assert.throws(() => {
      new TokenParser("=\ntest", 0);
    });
  });
});

describe("LineParser.nextWord() -> ParseResult", () => {
  it("properly handles a lone word", () => {
    const p = new TokenParser("test", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 4);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles words with leading spaces", () => {
    const p = new TokenParser(" test", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 5);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles words with leading tabs", () => {
    const p = new TokenParser("\ttest", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 5);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles words with leading and trailing spaces", () => {
    const p = new TokenParser("  test ", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, " ");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles words with leading and trailing tabs", () => {
    const p = new TokenParser("\t\ttest\t", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "\t");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles a filter-specific unicode character", () => {
    const p = new TokenParser(" ö", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "ö");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles multiple filter-specific unicode " +
      "characters", () => {
    const p = new TokenParser("öö", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "öö");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles filter-specific unicode characters with leading " +
      "whitespace", () => {
    const p = new TokenParser("\t\töö", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "öö");
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 4);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles a word trailed by another word", () => {
    const p = new TokenParser("test\tword", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, "\tword");
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles a word with a trailing number", () => {
    const p = new TokenParser("test \t42", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, " \t42");
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles a word with a trailing string", () => {
    const p = new TokenParser('test "Test String"', 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, ' "Test String"');
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles a word trailed by a comment", () => {
    const p = new TokenParser("test #Comment", 0);
    const currentResult = p.nextWord();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, " #Comment");
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("doesn't mutate a following number when removing a word", () => {
    const p = new TokenParser("Test 42", 0);
    p.nextWord();
    assert.strictEqual(p.text, " 42");
    assert.strictEqual(p.currentIndex, 4);
  });

  it("doesn't mutate a following word when removing a word", () => {
    const p = new TokenParser("Test Word", 0);
    p.nextWord();
    assert.strictEqual(p.text, " Word");
    assert.strictEqual(p.currentIndex, 4);
  });

  it("doesn't mutate a following boolean when removing a word", () => {
    const p = new TokenParser("Test >=", 0);
    p.nextWord();
    assert.strictEqual(p.text, " >=");
    assert.strictEqual(p.currentIndex, 4);
  });

  it("doesn't mutate a following string when removing a word", () => {
    const p = new TokenParser(' Test "Word"', 0);
    p.nextWord();
    assert.strictEqual(p.text, ' "Word"');
    assert.strictEqual(p.currentIndex, 5);
  });

  it("does not consider pound as a valid character", () => {
    const p = new TokenParser("#", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("does not consider a word prefixed with pound as valid", () => {
    const p = new TokenParser(" #test", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("does not consider numbers as characters of a word", () => {
    const p = new TokenParser("test42", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not ignore leading numbers to match a trailing word", () => {
    const p = new TokenParser("42test", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given text with mixed words and numbers", () => {
    const p = new TokenParser("test42test", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider double quotation marks to be a word", () => {
    const p = new TokenParser('"', 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not ignore leading quotes to match a trailing word", () => {
    const p = new TokenParser('"Test', 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider a word wrapped in double quotes as valid", () => {
    const p = new TokenParser('"Test"', 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider single quotation marks to be a word", () => {
    const p = new TokenParser("'", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not ignore leading single quotes to match a trailing " +
      "word", () => {
    const p = new TokenParser("'Test", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider a word wrapped in single quotes as valid", () => {
    const p = new TokenParser("'Test'", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("ignores a string followed by a word", () => {
    const p = new TokenParser('"test" test', 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores a word led by a comment", () => {
    const p = new TokenParser("# Test", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("does not consider the '<' operator as a valid character", () => {
    const p = new TokenParser("test<value", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider the '>' operator as a valid character", () => {
    const p = new TokenParser("test>value", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider the '>=' operator as a valid character", () => {
    const p = new TokenParser("test>=value", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider the '<=' operator as a valid character", () => {
    const p = new TokenParser("test<=value", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consider the '=' operator as a valid character", () => {
    const p = new TokenParser("test=value", 0);
    p.nextWord();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("throws an error when given multiple lines", () => {
    assert.throws(() => {
      new TokenParser("Test\nWord", 0);
    });
  });
});

describe("LineParser.nextString() -> ParseResult", () => {
  it("properly hands a lone word", () => {
    const p = new TokenParser("test", 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 4);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles back-to-back words", () => {
    const p = new TokenParser("test value", 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, " value");
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles words led by spaces", () => {
    const p = new TokenParser("  test", 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles words led by tabs", () => {
    const p = new TokenParser("\t\ttest", 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles words surrounded by whitespace", () => {
    const p = new TokenParser(" \ttest\t ", 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "\t ");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles strings", () => {
    const p = new TokenParser('"test"', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles a string led by a space", () => {
    const p = new TokenParser(' "test"', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 7);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 7);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles empty strings", () => {
    const p = new TokenParser('""', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 2);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles strings surrounded by whitespace", () => {
    const p = new TokenParser(' \t""\t ', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "");
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, "\t ");
    assert.strictEqual(p.currentIndex, 4);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles strings with multiple words", () => {
    const p = new TokenParser('"test test"', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 11);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 11);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles strings follow by words", () => {
    const p = new TokenParser('"test" test text', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, " test text");
    assert.strictEqual(p.currentIndex, 6);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles filter-specific unicode strings", () => {
    const p = new TokenParser('"ööö" test', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "ööö");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, " test");
    assert.strictEqual(p.currentIndex, 5);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles filter-specific unicode words", () => {
    const p = new TokenParser('öö "test"', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "öö");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 2);
    assert.strictEqual(p.text, ' "test"');
    assert.strictEqual(p.currentIndex, 2);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("properly handles strings using multiple character sets", () => {
    const p = new TokenParser("testöövalue", 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "testöövalue");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 11);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 11);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("allows a filter-specific unicode string to be followed by a " +
      "word", () => {
    const p = new TokenParser('"testöövalue" test', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "testöövalue");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 13);
    assert.strictEqual(p.text, " test");
    assert.strictEqual(p.currentIndex, 13);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("allows numbers to be used within strings", () => {
    const p = new TokenParser(" test42", 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test42");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 7);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 7);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("allows numbers to be used within words", () => {
    const p = new TokenParser("\t42test \t", 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "42test");
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 7);
    assert.strictEqual(p.text, " \t");
    assert.strictEqual(p.currentIndex, 7);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("behaves properly when trailed by a number", () => {
    const p = new TokenParser('"42 test" 321', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "42 test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 9);
    assert.strictEqual(p.text, " 321");
    assert.strictEqual(p.currentIndex, 9);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("behaves properly when trailed by a comment", () => {
    const p = new TokenParser('"Test" # Value', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "Test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, " # Value");
    assert.strictEqual(p.currentIndex, 6);
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("supports words followed by number-only strings", () => {
    const p = new TokenParser('test "42"', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, ' "42"');
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("supports operators if they are contained within a string", () => {
    const p = new TokenParser('"> test"', 0);
    const currentResult = p.nextString();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "> test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 8);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 8);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("doesn't mutate a following number when removing a string", () => {
    const p = new TokenParser('"Test" 42', 0);
    p.nextString();
    assert.strictEqual(p.text, " 42");
    assert.strictEqual(p.currentIndex, 6);
  });

  it("doesn't mutate a following word when removing a string", () => {
    const p = new TokenParser('"Test" Text', 0);
    p.nextString();
    assert.strictEqual(p.text, " Text");
    assert.strictEqual(p.currentIndex, 6);
  });

  it("doesn't mutate a following boolean when removing a string", () => {
    const p = new TokenParser('"Test" <', 0);
    p.nextString();
    assert.strictEqual(p.text, " <");
    assert.strictEqual(p.currentIndex, 6);
  });

  it("doesn't mutate a following string when removing a string", () => {
    const p = new TokenParser('"Test" "Value"', 0);
    p.nextString();
    assert.strictEqual(p.text, ' "Value"');
    assert.strictEqual(p.currentIndex, 6);
  });

  it("fails when given neither a word or string", () => {
    const p = new TokenParser("", 0);
    p.nextString();
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given a word containing a quotation mark", () => {
    const p = new TokenParser('test"test', 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("failes when given a string conjoined with a word", () => {
    const p = new TokenParser('"test"test', 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given a word conjoined with a string", () => {
    const p = new TokenParser('test"test"', 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not support single-quotation mark strings", () => {
    const p = new TokenParser("'test'", 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not support single quote strings led by spaces", () => {
    const p = new TokenParser(" 'test'", 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not support single quote strings led by tabs", () => {
    const p = new TokenParser("/t'test'", 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given a stray followed by a word", () => {
    const p = new TokenParser("> test", 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given an operator joined by a word", () => {
    const p = new TokenParser("<test", 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given an operator attached to a string", () => {
    const p = new TokenParser('>"test"', 0);
    p.nextString();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("throws when given multiple lines", () => {
    assert.throws(() => {
      new TokenParser('"Test"\n"Value"', 0);
    });
  });
});

describe("LineParser.nextBoolean() -> ParseResult", () => {
  it("correctly handles a lone 'true'", () => {
    const p = new TokenParser("TRUE", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 4);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles a lone 'false'", () => {
    const p = new TokenParser("FALSE", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.isFalse(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 5);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("is case insensitive for true", () => {
    const p = new TokenParser("tRuE", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 4);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("is case insensitive for false", () => {
    const p = new TokenParser("fAlSe", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.isFalse(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 5);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly handles boolean strings", () => {
    const p = new TokenParser('"true"', 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("is still case insensitive when handling strings", () => {
    const p = new TokenParser('"FAlse"', 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.isFalse(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 7);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 7);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores leading space characters", () => {
    const p = new TokenParser(" true", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 1);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 5);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores leading tab characters", () => {
    const p = new TokenParser("\t\ttrue", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores surrounding whitespace", () => {
    const p = new TokenParser(" \tfalse\t ", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.isFalse(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 7);
    assert.strictEqual(p.text, "\t ");
    assert.strictEqual(p.currentIndex, 7);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores trailing words", () => {
    const p = new TokenParser("true test", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 4);
    assert.strictEqual(p.text, " test");
    assert.strictEqual(p.currentIndex, 4);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores trailing strings", () => {
    const p = new TokenParser('false\t"test"', 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.isFalse(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, '\t"test"');
    assert.strictEqual(p.currentIndex, 5);
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly ignores trailing commnets", () => {
    const p = new TokenParser("false # Test", 0);
    const currentResult = p.nextBoolean();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.isFalse(currentResult.value);
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 5);
    assert.strictEqual(p.text, " # Test");
    assert.strictEqual(p.currentIndex, 5);
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("doesn't mutate a following number when removing a boolean", () => {
    const p = new TokenParser("True 42", 0);
    p.nextBoolean();
    assert.strictEqual(p.text, " 42");
    assert.strictEqual(p.currentIndex, 4);
  });

  it("doesn't mutate a following word when removing a boolean", () => {
    const p = new TokenParser("False Test", 0);
    p.nextBoolean();
    assert.strictEqual(p.text, " Test");
    assert.strictEqual(p.currentIndex, 5);
  });

  it("doesn't mutate a following boolean when removing a boolean", () => {
    const p = new TokenParser('"True" =', 0);
    p.nextBoolean();
    assert.strictEqual(p.text, " =");
    assert.strictEqual(p.currentIndex, 6);
  });

  it("doesn't mutate a following string when removing a boolean", () => {
    const p = new TokenParser('"False" "Test"', 0);
    p.nextBoolean();
    assert.strictEqual(p.text, ' "Test"');
    assert.strictEqual(p.currentIndex, 7);
  });

  it("correctly handles a boolean led by a comment", () => {
    const p = new TokenParser("# True", 0);
    p.nextBoolean();
    assert.isFalse(p.empty);
    assert(p.isCommented());
  });

  it("fails when given a word", () => {
    const p = new TokenParser("test", 0);
    p.nextBoolean();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given a valid value led by a word", () => {
    const p = new TokenParser("test true", 0);
    p.nextBoolean();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given a valid string value led by a word", () => {
    const p = new TokenParser('test "true"', 0);
    p.nextBoolean();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given a valid value led by a string", () => {
    const p = new TokenParser('"test" true', 0);
    p.nextBoolean();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given only a number", () => {
    const p = new TokenParser("42", 0);
    p.nextBoolean();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not use a naive regex for false", () => {
    const p = new TokenParser("TALSE", 0);
    p.nextBoolean();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not use a naive regex for true", () => {
    const p = new TokenParser("frue", 0);
    p.nextBoolean();
    assert.isFalse(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given an empty line", () => {
    const p = new TokenParser("", 0);
    p.nextBoolean();
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("fails when given a line containing only whitespace", () => {
    const p = new TokenParser(" \t", 0);
    p.nextBoolean();
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("throws an expection if given multiple lines", () => {
    assert.throws(() => {
      new TokenParser("\n", 0);
    });
  });
});

describe("LineParser.parseComment() -> ParseResult", () => {
  it("correctly parses a line comment", () => {
    const p = new TokenParser("# Test", 0);
    assert(p.isCommented());
    const currentResult = p.parseComment();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "# Test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("correctly deals with leading whitespace", () => {
    const p = new TokenParser("  # Test", 0);
    const currentResult = p.parseComment();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "# Test");
    assert.strictEqual(currentResult.range.start.character, 2);
    assert.strictEqual(currentResult.range.end.character, 8);
    assert.strictEqual(p.text, "");
    assert.strictEqual(p.currentIndex, 8);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("does not consume trailing whitespace", () => {
    const p = new TokenParser("# Test  ", 0);
    const currentResult = p.parseComment();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "# Test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 6);
    assert.strictEqual(p.text, "  ");
    assert.strictEqual(p.currentIndex, 6);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });

  it("consumes '#' same as any other character", () => {
    const p = new TokenParser("# Test#Test  ", 0);
    const currentResult = p.parseComment();

    assert.isDefined(currentResult);
    if (!currentResult) return;

    assert.isDefined(currentResult.value);
    assert.strictEqual(currentResult.value, "# Test#Test");
    assert.strictEqual(currentResult.range.start.character, 0);
    assert.strictEqual(currentResult.range.end.character, 11);
    assert.strictEqual(p.text, "  ");
    assert.strictEqual(p.currentIndex, 11);
    assert(p.empty);
    assert.isFalse(p.isCommented());
  });
});
