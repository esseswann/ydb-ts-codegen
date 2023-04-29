function* sex(str: string): Generator<Output> {
  let atom = "";
  let quoted = false;
  for (const token of str) {
    switch (token as Token) {
      case "(":
        yield { type: "start", quoted };
        quoted = false;
        break;
      case ")":
      case " ":
        if (atom) yield { type: "atom", value: atom, quoted };
        atom = "";
        if (token === ")") yield { type: "end" };
        quoted = false;
        break;
      case "'":
        quoted = true;
        break;
      case "\n":
      case "\r":
      case "\t":
        break;
      default:
        atom += token;
    }
  }
}

export type Token = "(" | ")" | " " | "'" | "\n" | "\r" | "\t";

export type Output =
  | {
      type: "start";
      quoted: boolean;
    }
  | {
      type: "atom";
      value: string;
      quoted: boolean;
    }
  | {
      type: "end";
    };

export default sex;
