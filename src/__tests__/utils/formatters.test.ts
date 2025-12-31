describe("formatCurrency", () => {
  const formatCurrency = (value: number | string | undefined): string => {
    if (!value) return "No especificado";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "No especificado";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  test("formatea números", () => {
    expect(formatCurrency(1000000)).toContain("1");
  });

  test("retorna No especificado para undefined", () => {
    expect(formatCurrency(undefined)).toBe("No especificado");
  });

  test("formatea strings numéricos", () => {
    expect(formatCurrency("5000000")).toContain("5");
  });
});

describe("truncateText", () => {
  const truncateText = (text: string, max: number): string => {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.substring(0, max - 3) + "...";
  };

  test("no trunca texto corto", () => {
    expect(truncateText("Hola", 10)).toBe("Hola");
  });

  test("trunca texto largo", () => {
    expect(truncateText("Este es un texto largo", 10)).toBe("Este es...");
  });
});
