import "ace-builds/src-noconflict/mode-text";

var keywords = ("Top|adversarial|and|bool|direct|ec_requires|elif|else|end|") + 
               ("exists|functionality|fail|forall|fun|if|") +
               ("implements|in|initial|let|message|out|party|") +
               ("port|serves|simulates|simulator|subfun|then|") + 
               ("uc_requires|uses|var|with");
var builtinConstants = ("true|false");
var builtinFunctions = ("dom|envport|intport|match|oget|send|state|transition");
var invalidKeywords = ("undefined");

export class CustomHighlightRules extends window.ace.acequire(
  "ace/mode/text_highlight_rules"
).TextHighlightRules {
  constructor() {
    super();
    var keywordMapper = this.createKeywordMapper({
        "keyword": keywords,
        "constant.language": builtinConstants,
        "support.function": builtinFunctions,
        "invalid": invalidKeywords
    }, "identifier");
    var decimalInteger = "(?:(?:[1-9]\\d*)|(?:0))";
    var octInteger = "(?:0[oO]?[0-7]+)";
    var hexInteger = "(?:0[xX][\\dA-Fa-f]+)";
    var binInteger = "(?:0[bB][01]+)";
    var integer = "(?:" + decimalInteger + "|" + octInteger + "|" + hexInteger + "|" + binInteger + ")";
    var exponent = "(?:[eE][+-]?\\d+)";
    var fraction = "(?:\\.\\d+)";
    var intPart = "(?:\\d+)";
    var pointFloat = "(?:(?:" + intPart + "?" + fraction + ")|(?:" + intPart + "\\.))";
    var exponentFloat = "(?:(?:" + pointFloat + "|" + intPart + ")" + exponent + ")";
    var floatNumber = "(?:" + exponentFloat + "|" + pointFloat + ")";

    this.$rules = {
      start: [
        {
          token: "comment",
          regex: "\\(\\*.*?\\*\\)\\s*?$"
        },
        {
            token: "comment",
            regex: '\\(\\*.*',
            next: "comment"
        },
        {
            token: keywordMapper,
            regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
        },
        {
            token: "keyword.operator",
            regex: "\\+\\.|\\-\\.|\\*\\.|\\/\\.|#|;;|\\+|\\-|\\*|\\*\\*\\/|\\/\\/|%|<<|>>|&|\\||\\^|~|<|>|<=|=>|==|!=|<>|<-|=|@"
        },
        {
            token: "constant.numeric",
            regex: "(?:" + floatNumber + "|\\d+)[jJ]\\b"
        },
        {
            token: "constant.numeric",
            regex: floatNumber
        },
        {
            token: "constant.numeric",
            regex: integer + "\\b"
        },
        {
            token: "paren.lparen",
            regex: "[[({]"
        },
        {
            token: "paren.rparen",
            regex: "[\\])}]"
        },
      ],
      comment: [
        {
            token: "comment",
            regex: "\\*\\)",
            next: "start"
        },
        {
            defaultToken: "comment"
        }
      ]
    };
  }
}

export default class UcdslMode extends window.ace.acequire("ace/mode/text")
  .Mode {
  constructor() {
    super();
    this.HighlightRules = CustomHighlightRules;
  }
}
