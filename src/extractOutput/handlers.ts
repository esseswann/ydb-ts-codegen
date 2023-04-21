import { GetHandler, Handler } from "./stacks";

const getHandler =
  (context: Accumulator): GetHandler =>
  (symbol) => {
    const handler = symbol.startsWith('"')
      ? keyValue(symbol)
      : handlers[symbol]?.(context);

    if (handler) {
      return {
        append: (value: unknown) => {
          if (
            typeof value === "string" &&
            value.startsWith("$") &&
            context.variables.has(value)
          ) {
            value = context.variables.get(value);
          }
          handler.append(value);
        },
        build: handler.build,
      };
    }

    return undefined;
  };

const keyValue = (key: string): Handler => {
  let value: any;

  return {
    append: (symbol) => {
      value = symbol;
    },
    build: () => ({ key, value }),
  };
};

const handlers: Record<string, (context: Accumulator) => Handler> = {
  declare: (context) => {
    let binding: string;
    let dataType: Type;

    return {
      append: (symbol) => {
        if (binding) {
          dataType = symbol;
        } else {
          binding = symbol;
        }
      },
      build: () => {
        if (binding && dataType) {
          context.declares.set(binding, dataType);
        }
      },
    };
  },
  let: (context) => {
    let binding: string;
    let value: any;

    return {
      append: (symbol) => {
        if (binding) {
          value = symbol;
        } else {
          binding = symbol;
        }
      },
      build: () => {
        if (binding && value) {
          context.variables.set(binding, value);
        }
      },
    };
  },
  KqpTxResultBinding: (context) => {
    let dataType: Type;

    return {
      append: (symbol) => {
        if (!dataType) {
          dataType = symbol;
        }
      },
      build: () => {
        context.results.push(dataType);
      },
    };
  },
  StructType: () => {
    const struct: Record<string, Type> = {};

    return {
      append: ({ key, value }: { key: string; value: Type }) => {
        struct[key] = value;
      },
      build: () => struct,
    };
  },
  OptionalType: () => {
    let optionalType: Type;

    return {
      append: (symbol) => {
        optionalType = symbol;
      },
      build: () => ({
        type: "Optional",
        item: optionalType,
      }),
    };
  },
  DataType: () => {
    let dataType: Type;

    return {
      append: (symbol) => {
        dataType = symbol;
      },
      build: () => ({
        type: dataType,
      }),
    };
  },
  ListType: () => {
    const list: Type[] = [];

    return {
      append: (symbol) => {
        list.push(symbol);
      },
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
