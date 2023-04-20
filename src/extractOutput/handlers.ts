import { Handlers } from "./stacks";

const handlers = (context: Accumulator): Handlers => ({
  KqpTxResultBinding() {
    let value: any;
    return {
      append: (atom) => !value && (value = context.variables.get(atom) || atom),
      build: () => context.results.push(value),
    };
  },
  StructType() {
    const struct: Record<string, any> = {};
    return {
      append: console.log,
      build: () => struct,
    };
  },
  DataType() {
    let type: string;
    return {
      append: (atom) => (type = context.variables.get(atom) || atom),
      build: () => type,
    };
  },
  ListType() {
    const list: any[] = [];
    return {
      append: (atom) => list.push(context.variables.get(atom) || atom),
      build: () => list,
    };
  },
  let() {
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
});

export type Accumulator = {
  variables: Map<string, any>;
  results: any[];
};

export default handlers;
