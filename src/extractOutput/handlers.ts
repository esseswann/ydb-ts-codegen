import { GetHandler, Handler } from "./stacks";

const getHandler =
  (context: Accumulator): GetHandler =>
  (symbol) => {
    if (symbol.startsWith('"')) return keyValue(context, symbol);
    const handler = handlers[symbol]?.(context);
    if (handler)
      return {
        append: (atom: unknown) => {
          if (
            typeof atom === "string" &&
            atom.startsWith("&") &&
            context.variables.has(atom)
          )
            atom = context.variables.get(atom);
          handler.append(atom);
        },
        build: handler.build,
      };
    return undefined;
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
        if (binding) value = atom;
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
        if (binding) value = atom;
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
      append: (atom) => !value && (value = atom),
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
  OptionalType() {
    let item: Type;
    return {
      append: (atom) => (item = atom),
      build: () => ({
        type: "Optional",
        item,
      }),
    };
  },
  DataType() {
    let type: Type;
    return {
      append: (atom) => (type = atom),
      build: () => ({
        type,
      }),
    };
  },
  ListType() {
    const list: Type[] = [];
    return {
      append: (atom) => list.push(atom),
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
