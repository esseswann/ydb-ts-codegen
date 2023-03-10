import { randomUUID } from "crypto";
import ts, { Node } from "typescript";

const emit = (nodes: Node[], filename: string = randomUUID()) => {
  const resultFile = ts.createSourceFile(
    filename,
    "",
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ false,
    ts.ScriptKind.TS
  );
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });
  const result = nodes
    .map((node) => printer.printNode(ts.EmitHint.Unspecified, node, resultFile))
    .join("\n\n");
  return result;
};

export default emit;
