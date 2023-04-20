import { GetHandler, Handler } from "./stacks";

const getHandler =
  (context: Accumulator): GetHandler =>
  (symbol) => {
    if (symbol.startsWith('"')) return keyValue(context, symbol);
    return handlers[symbol]?.(context);
  };

const keyValue = (context: Accumulator, key: string): Handler => {
  let value: any;
  return {
    append: (atom) => (value = context.variables.get(atom) || atom),
    build: () => ({ key, value }),
  };
};

const handlers: Record<string, AccumulatedHandler> = {
  declare(context) {
    let binding: string;
    let value: Type;
    return {
      append: (atom) => {
        if (binding) value = context.declares.get(atom) || atom;
        else binding = atom;
      },
      build: () => {
        if (binding && value) context.declares.set(binding, value);
      },
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
  KqpTxResultBinding(context) {
    let value: Type;
    return {
      append: (atom) => !value && (value = context.variables.get(atom) || atom),
      build: () => context.results.push(value),
    };
  },
  StructType() {
    const struct: Record<string, Type> = {};
    return {
      append: ({ key, value }) => (struct[key] = value),
      build: () => struct,
    };
  },
  OptionalType(context) {
    let item: Type;
    return {
      append: (atom) => (item = context.variables.get(atom) || atom),
      build: () => ({
        type: "Optional",
        item,
      }),
    };
  },
  DataType(context) {
    let type: Type;
    return {
      append: (atom) => (type = context.variables.get(atom) || atom),
      build: () => ({
        type,
      }),
    };
  },
  ListType(context) {
    const list: Type[] = [];
    return {
      append: (atom) => list.push(context.variables.get(atom) || atom),
      build: () => ({
        type: "List",
        items: list,
      }),
    };
  },
};

export type Accumulator = {
  declares: Map<string, Type>;
  variables: Map<string, Type>;
  results: any[];
};

type Type = {
  type: string;
  kind: "Primitive" | "Container";
};

type AccumulatedHandler = (accumulator: Accumulator) => Handler;

export default getHandler;
