import { factory, NodeFlags } from "typescript";

export const DEFAULT_QUERY_OPTIONS_NAME = "defaultQueryOptions";

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
    DEFAULT_QUERY_OPTIONS_NAME,
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
