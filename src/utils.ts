import { Expression, factory, NodeFlags } from "typescript";

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getFunctionCall(name: string, args: string[]) {
  const functionName = factory.createIdentifier(name);
  const handler = factory.createCallExpression(
    functionName,
    undefined,
    args.map((arg) => factory.createIdentifier(arg))
  );
  return handler;
}

export function getAwaitFunctionCall(name: string, args: string[]) {
  return factory.createAwaitExpression(getFunctionCall(name, args));
}

export const getConst = (left: string, right: Expression) =>
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(left, undefined, undefined, right)],
      NodeFlags.Const
    )
  );
