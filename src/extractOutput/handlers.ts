import { Handlers } from "./stacks";

const handlers: Handlers<Accumulator> = {
  KqpTxResultBinding(context) {
    let value: any;
    return {
      append: (atom) => !value && (value = context.variables.get(atom) || atom),
      build: () => context.results.push(value),
    };
  },
  DataType(context) {
    let type: string;
    return {
      append: (atom) => (type = context.variables.get(atom) || atom),
      build: () => type,
    };
  },
  ListType(context) {
    const list: any[] = [];
    return {
      append: (atom) => list.push(context.variables.get(atom) || atom),
      build: () => list,
    };
  },
  let(context) {
    let binding: string;
    let value: any;
    return {
      append: (atom) => {
        if (binding) value = context.variables.get(atom) || atom;
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
