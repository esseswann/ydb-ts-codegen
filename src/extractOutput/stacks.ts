import sex from "./sex";

const stackedParse = <Accumulator>(str: string, handlers: Handlers) => {
  const stack: (Handler | undefined)[] = [];
  for (const iterator of sex(str)) {
    const handler = stack[stack.length - 1];
    switch (iterator.type) {
      case "start":
        stack.push(undefined);
        break;
      case "atom":
        if (handler) handler.append(iterator.value);
        else stack[stack.length - 1] = handlers[iterator.value]?.();
        break;
      case "end":
        stack.pop();
        const result = handler?.build();
        if (result) stack[stack.length - 1]?.append(result);
    }
  }
};

type GetHandler = () => Handler;
type Handler = {
  append(atom: string): void;
  build(): any;
};
export type Handlers = Record<string, GetHandler>;

export default stackedParse;
