export type Token = "(" | ")" | " " | "'";

const parseSex = (str: Token[], current = 0): number => {
  let symbol = "";
  for (let i = current + 1; i < str.length; i++) {
    const token = str[i];
    switch (token) {
      case "(":
        i = parseSex(str, i);
        break;
      case ")":
        processSymbol(symbol);
        return i;
      case " ":
        processSymbol(symbol);
        symbol = "";
        break;
      case "'":
        continue;
      default:
        symbol += token;
    }
  }
  return current;
};

const processSymbol = (symbol: string) => {
  switch (symbol) {
    case "let":
      console.log("let");
      break;

    default:
      break;
  }
};

export default parseSex;
