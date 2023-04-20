import sex from "./sex";

const parseSex = (str: string) => {
  const stack: (Handler | null)[] = [];
  for (const iterator of sex(str)) {
    const handler = stack[stack.length - 1];
    switch (iterator.type) {
      case "start":
        stack.push(null);
        break;
      case "atom":
        if (handler) handler.append(iterator.value);
        else {
          const getHandler = handlers[iterator.value];
          if (getHandler) stack[stack.length - 1] = getHandler();
        }
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
type Handlers = Record<string, GetHandler>;

const handlers: Handlers = {
  DataType() {
    let type: string;
    return {
      append: (atom) => (type = atom),
      build: () => type,
    };
  },
  let() {
    let binding: string;
    let value: any;
    return {
      append: (atom) => {
        if (binding) value = atom;
        else binding = atom;
      },
      build: () => ({ [binding]: value }),
    };
  },
};

export default parseSex;
