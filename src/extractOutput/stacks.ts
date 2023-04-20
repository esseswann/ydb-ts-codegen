import sex from "./sex";

const stackedParse = (str: string, getHandler: GetHandler) => {
  const stack: (Handler | undefined)[] = [];
  let isInit = true;
  for (const iterator of sex(str)) {
    const handler = stack[stack.length - 1];
    switch (iterator.type) {
      case "start":
        isInit = true;
        stack.push(undefined);
        break;
      case "atom":
        if (handler) handler.append(iterator.value);
        else if (isInit) {
          isInit = false;
          stack[stack.length - 1] = getHandler?.(iterator.value);
        }
        break;
      case "end":
        stack.pop();
        const result = handler?.build();
        if (result) stack[stack.length - 1]?.append(result);
    }
  }
};

export type GetHandler = (atom: string) => Handler | undefined;
export type Handler = {
  append(atom: any): void;
  build(): any;
};
// export type Handlers = Record<string, GetHandler>;

export default stackedParse;
