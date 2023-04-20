import { Handlers } from "./stacks";

const handlers: Handlers<Accumulator> = {
  KqpTxResultBinding(context) {
    let value: any;
    return {
      append: (atom) => !value && (value = atom),
      build: () => context.results.push(value),
    };
  },
  DataType() {
    let type: string;
    return {
      append: (atom) => (type = atom),
      build: () => type,
    };
  },
  ListType() {
    const list: any[] = [];
    return {
      append: (atom) => list.push(atom),
      build: () => list,
    };
  },
  let(context) {
    let binding: string;
    let value: any;
    return {
      append: (atom) => {
        if (binding) value = atom;
        else binding = atom;
      },
      build: () => {
        if (binding && value) context.variables.set(binding, value);
      },
    };
  },
};

type Accumulator = {
  variables: Map<string, any>;
  results: any[];
};

export default handlers;
