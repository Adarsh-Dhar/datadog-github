function splitSelectList(selectBody) {
  const items = [];
  let current = "";
  let depth = 0;
  let quote = null;

  for (const char of selectBody) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
    } else if (char === "(") {
      depth += 1;
      current += char;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
      current += char;
    } else if (char === "," && depth === 0) {
      if (current.trim()) items.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) items.push(current.trim());
  return items;
}

function extractSelectBody(sql) {
  const match = sql.match(/\bselect\b([\s\S]*?)\bfrom\b/i);
  return match ? match[1] : "";
}

function columnFromExpression(expression) {
  // Anchoring to the end avoids mistaking CAST(... AS type) for an alias.
  const aliasMatch = expression.match(/\s+as\s+([\w$]+)\s*$/i);
  const expressionWithoutAlias = aliasMatch
    ? expression.slice(0, aliasMatch.index).trim()
    : expression.trim();
  const fallbackName = expressionWithoutAlias
    .split(".")
    .pop()
    .replace(/["`]/g, "")
    .trim();
  const name = (aliasMatch?.[1] || fallbackName).replace(/["`]/g, "");
  const castTypeMatch = expressionWithoutAlias.match(
    /\bcast\s*\([\s\S]*?\s+as\s+([a-z][\w]*(?:\s*\([^)]*\))?)/i,
  );
  const shorthandTypeMatch = expressionWithoutAlias.match(
    /::\s*([a-z][\w]*(?:\s*\([^)]*\))?)/i,
  );

  return {
    name,
    expression: expressionWithoutAlias.replace(/\s+/g, " ").toLowerCase(),
    type: (castTypeMatch || shorthandTypeMatch)
      ? (castTypeMatch || shorthandTypeMatch)[1].replace(/\s+/g, " ").toLowerCase()
      : null,
  };
}

function extractColumns(sql) {
  return splitSelectList(extractSelectBody(sql))
    .map(columnFromExpression)
    .filter((column) => column.name && !column.name.startsWith("--"));
}

function extractJoinKeys(sql) {
  return [...sql.matchAll(/\bjoin\b[\s\S]*?\bon\b\s*([^\n;]+?)(?=\bjoin\b|\bwhere\b|\bgroup\b|\border\b|$)/gi)]
    .map((match) => match[1].replace(/\s+/g, " ").trim().toLowerCase());
}

function analyzeSchemaChange(baseSql, headSql) {
  const baseColumns = extractColumns(baseSql);
  const headColumns = extractColumns(headSql);
  const baseByName = new Map(baseColumns.map((column) => [column.name, column]));
  const headByName = new Map(headColumns.map((column) => [column.name, column]));
  const droppedColumns = baseColumns
    .filter((column) => !headByName.has(column.name))
    .map((column) => column.name);
  const addedColumns = headColumns
    .filter((column) => !baseByName.has(column.name))
    .map((column) => column.name);
  const renamedColumns = [];
  const remainingAdded = new Set(addedColumns);

  for (const oldName of droppedColumns) {
    const oldColumn = baseByName.get(oldName);
    const replacement = headColumns.find(
      (column) =>
        remainingAdded.has(column.name) &&
        column.expression === oldColumn.expression,
    );
    if (replacement) {
      renamedColumns.push({ from: oldName, to: replacement.name });
      remainingAdded.delete(replacement.name);
    }
  }

  const typeChanges = headColumns.flatMap((column) => {
    const previous = baseByName.get(column.name);
    if (!previous || previous.type === column.type || !previous.type || !column.type) {
      return [];
    }
    return [{ column: column.name, from: previous.type, to: column.type }];
  });

  const baseJoinKeys = new Set(extractJoinKeys(baseSql));
  const headJoinKeys = new Set(extractJoinKeys(headSql));
  const removedJoinKeys = [...baseJoinKeys].filter((key) => !headJoinKeys.has(key));
  const addedJoinKeys = [...headJoinKeys].filter((key) => !baseJoinKeys.has(key));

  return {
    droppedColumns: droppedColumns.filter(
      (name) => !renamedColumns.some((rename) => rename.from === name),
    ),
    addedColumns: addedColumns.filter((name) => remainingAdded.has(name)),
    renamedColumns,
    typeChanges,
    joinKeyChanges: { removed: removedJoinKeys, added: addedJoinKeys },
  };
}

function hasBreakingChange(change) {
  return Boolean(
    change.droppedColumns.length ||
      change.renamedColumns.length ||
      change.typeChanges.length ||
      change.joinKeyChanges.removed.length ||
      change.joinKeyChanges.added.length,
  );
}

module.exports = {
  analyzeSchemaChange,
  extractColumns,
  extractJoinKeys,
  hasBreakingChange,
};
