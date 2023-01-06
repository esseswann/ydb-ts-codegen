import { factory, NodeFlags } from "typescript";

export const QUERY_OPTIONS_NAME = "queryOptions";

const getQueryOptions = () => {
  const objectLiteral = factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment(
        "beginTx",
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            "staleReadOnly",
            factory.createObjectLiteralExpression()
          ),
        ])
      ),
      factory.createPropertyAssignment("commitTx", factory.createTrue()),
    ],
    true
  );
  const variableDeclaration = factory.createVariableDeclaration(
    QUERY_OPTIONS_NAME,
    undefined,
    undefined,
    objectLiteral
  );
  const declarationsList = factory.createVariableDeclarationList(
    [variableDeclaration],
    NodeFlags.Const
  );
  return declarationsList;
};

// , { beginTx: { staleReadOnly: {}}, commitTx: true }
export default getQueryOptions;
