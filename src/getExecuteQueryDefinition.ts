import {
  factory,
  NodeFlags,
  ParameterDeclaration,
  Statement,
  SyntaxKind,
} from "typescript";
import {
  Driver,
  Session,
  snakeToCamelCaseConversion,
  TypedValues,
  Types,
} from "ydb-sdk";
import { Variable } from "./extractVariables";
import { QUERY_OPTIONS_NAME } from "./getQueryOptions";
import { capitalizeFirstLetter, getConst, getFunctionCall } from "./utils";

const DRIVER_NAME = "driver";
const SESSION_NAME = "session";
const VARIABLES_NAME = "variables";
const PAYLOAD_NAME = "payload";
const RESULT_NAME = "result";
const SQL_NAME = "sql";

const getExecuteQueryDefinition = (
  name: string,
  sql: string,
  variablesName: string,
  variables: Variable[]
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
  if (variables.length) {
    const parameter = factory.createParameterDeclaration(
      undefined,
      undefined,
      factory.createIdentifier(VARIABLES_NAME),
      undefined,
      factory.createTypeReferenceNode(variablesName)
    );
    parameters.push(parameter);
  }
  statements.push(getVariablesStatement(variables));
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
    [factory.createToken(SyntaxKind.ExportKeyword)],
    undefined,
    functionName,
    undefined,
    parameters,
    undefined,
    // factory.createTypeReferenceNode(TypedData.name),
    block
  );
};

const getVariablesStatement = (variables: Variable[]): Statement => {
  const objectLiteral = factory.createObjectLiteralExpression(
    variables.map(getPropertyAssignment),
    true
  );
  const variableDeclaration = factory.createVariableDeclaration(
    PAYLOAD_NAME,
    undefined,
    undefined,
    objectLiteral
  );
  const declarationsList = factory.createVariableDeclarationList(
    [variableDeclaration],
    NodeFlags.Const
  );
  return factory.createVariableStatement(undefined, declarationsList);
};

const getPropertyAssignment = (member: Variable) => {
  const name = member.name;
  const typeName = member.type;
  const handler = getFunctionCall(
    `${TypedValues.name}.${TypedValues.fromNative.name}`,
    [
      `${Types.name}.${String(typeName).toUpperCase()}`,
      `${VARIABLES_NAME}.${snakeToCamelCaseConversion.ydbToJs(name)}`,
    ]
  );
  return factory.createPropertyAssignment(`$${name}`, handler);
};

const getSessionHandler = () => {
  const statments: Statement[] = [];
  const executeQuery = getFunctionCall(`${SESSION_NAME}.executeQuery`, [
    SQL_NAME,
    PAYLOAD_NAME,
    QUERY_OPTIONS_NAME,
  ]);
  statments.push(factory.createReturnStatement(executeQuery));
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
