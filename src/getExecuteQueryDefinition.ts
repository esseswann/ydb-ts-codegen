import {
  CallExpression,
  factory,
  ParameterDeclaration,
  Statement,
  SyntaxKind,
} from "typescript";
import { Driver, Session, withRetries } from "ydb-sdk";
import { IO } from "./extractIo";
import { capitalizeFirstLetter, getConst, getFunctionCall } from "./utils";

const DRIVER_NAME = "driver";
const SESSION_NAME = "session";
const VARIABLES_NAME = "variables";
const PAYLOAD_NAME = "payload";
const RESULT_NAME = "result";
const SQL_NAME = "sql";
const QUERY_OPTIONS_NAME = "queryOptions";

const getExecuteQueryDefinition = (
  name: string,
  sql: string,
  variables: IO["input"] | null
) => {
  const functionName = factory.createIdentifier(
    `execute${capitalizeFirstLetter(name)}`
  );
  const parameters: ParameterDeclaration[] = [];
  const driverParmater = factory.createParameterDeclaration(
    undefined,
    undefined,
    factory.createIdentifier(DRIVER_NAME),
    undefined,
    factory.createTypeReferenceNode(Driver.name)
  );
  parameters.push(driverParmater);
  const statements: Statement[] = [];
  if (variables) {
    const parameter = factory.createParameterDeclaration(
      undefined,
      undefined,
      factory.createIdentifier(VARIABLES_NAME),
      undefined,
      factory.createTypeReferenceNode(variables.interface.name)
    );
    parameters.push(parameter);
  }
  parameters.push(
    factory.createParameterDeclaration(
      undefined,
      undefined,
      factory.createIdentifier(QUERY_OPTIONS_NAME),
      factory.createToken(SyntaxKind.QuestionToken),
      factory.createIndexedAccessTypeNode(
        factory.createTypeReferenceNode("Parameters", [
          factory.createIndexedAccessTypeNode(
            factory.createTypeReferenceNode(Session.name),
            factory.createLiteralTypeNode(
              factory.createStringLiteral("executeQuery")
            )
          ),
        ]),
        factory.createLiteralTypeNode(factory.createNumericLiteral("2"))
      )
    )
  );
  if (variables)
    statements.push(getVariablesStatement(variables.converter.name!.text));
  else
    statements.push(
      getConst(PAYLOAD_NAME, factory.createIdentifier("undefined"))
    );
  statements.push(getConst(SQL_NAME, factory.createStringLiteral(sql)));
  const sessionHandler = getSessionHandler();
  statements.push(getSessionHandler());
  statements.push(
    getConst(
      RESULT_NAME,
      getFunctionCall(`${DRIVER_NAME}.tableClient.withSession`, [
        sessionHandler.name!.text,
      ])
    )
  );
  statements.push(
    factory.createReturnStatement(factory.createIdentifier(RESULT_NAME))
  );
  const block = factory.createBlock(statements, true);
  return factory.createFunctionDeclaration(
    undefined,
    undefined,
    functionName,
    undefined,
    parameters,
    undefined,
    block
  );
};

const getVariablesStatement = (converterName: string) => {
  const functionCall = factory.createCallExpression(
    factory.createIdentifier(converterName),
    undefined,
    [factory.createIdentifier(VARIABLES_NAME)]
  );
  return getConst(PAYLOAD_NAME, functionCall);
};

const getWithRetries = (expression: CallExpression) => {
  const arrowFunction = factory.createArrowFunction(
    undefined,
    [],
    [],
    undefined,
    undefined,
    expression
  );
  return factory.createCallExpression(
    factory.createIdentifier(withRetries.name),
    [],
    [arrowFunction]
  );
};

const getSessionHandler = () => {
  const statments: Statement[] = [];
  const executeQuery = getFunctionCall(`${SESSION_NAME}.executeQuery`, [
    SQL_NAME,
    PAYLOAD_NAME,
    QUERY_OPTIONS_NAME,
  ]);
  const withRetries = getWithRetries(executeQuery);
  statments.push(factory.createReturnStatement(withRetries));
  return factory.createFunctionDeclaration(
    [factory.createToken(SyntaxKind.AsyncKeyword)],
    undefined,
    "sessionHandler",
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier(SESSION_NAME),
        undefined,
        factory.createTypeReferenceNode(Session.name)
      ),
    ],
    undefined,
    factory.createBlock(statments, true)
  );
};

export default getExecuteQueryDefinition;
