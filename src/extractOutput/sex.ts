export type Token = "(" | ")" | " " | "'";

const parseSex = (str: Token[], current = 0): number => {
  let handler = undefined;
  let symbol = "";
  for (let i = current + 1; i < str.length; i++) {
    const token = str[i];
    switch (token) {
      case "(":
        i = parseSex(str, i);
        break;
      case ")":
        if (symbol) {
          const nextHandler = handlers.get(symbol);
          if (nextHandler) handler = nextHandler();
          else if (handler) handler.append(symbol);
        }
        return i;
      case " ":
        if (symbol) {
          const nextHandler = handlers.get(symbol);
          if (nextHandler) handler = nextHandler();
          else if (handler) handler.append(symbol);
        }
        symbol = "";
        break;
      case "'":
        continue;
      default:
        symbol += token;
    }
  }
  if (handler) console.log(handler.build);
  return current;
};

const handlersRaw: Record<string, Handler> = {
  let: () => {
    const result: Record<string, boolean> = {};
    return {
      append(symbol) {
        console.log(symbol);
        result[symbol] = true;
      },
      build() {
        return result;
      },
    };
  },
};

const handlers: Map<string, Handler> = new Map(Object.entries(handlersRaw));

type Handler = () => {
  append: (symbol: string) => void;
  build: () => void;
};

export default parseSex;
