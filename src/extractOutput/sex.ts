function* sex(str: Token[]): Generator<Output> {
  let atom = "";
  for (const token of str) {
    switch (token) {
      case "(":
        yield { type: "start" };
        break;
      case ")":
      case " ":
        if (atom) yield { type: "atom", value: atom };
        atom = "";
        if (token === ")") yield { type: "end" };
        break;
      case "'":
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

type Output =
  | {
      type: "start";
    }
  | {
      type: "atom";
      value: string;
    }
  | {
      type: "end";
    };

export default sex;
