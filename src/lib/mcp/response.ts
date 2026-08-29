export function mcpError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function mcpJson(structured: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
  };
}
