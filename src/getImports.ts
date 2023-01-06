import { factory } from "typescript";

const getImports = (targets: string[], from: string) =>
  factory.createImportDeclaration(
    [],
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports(
        targets.map((target) =>
          factory.createImportSpecifier(
            false,
            undefined,
            factory.createIdentifier(target)
          )
        )
      )
    ),
    factory.createStringLiteral(from)
  );

export default getImports;
