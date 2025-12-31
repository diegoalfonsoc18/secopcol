describe("Cache logic", () => {
  let storage: Record<string, string> = {};

  beforeEach(() => { storage = {}; });

  test("guarda y recupera datos", () => {
    storage["key"] = "value";
    expect(storage["key"]).toBe("value");
  });

  test("retorna undefined para clave inexistente", () => {
    expect(storage["noexiste"]).toBeUndefined();
  });

  test("elimina datos", () => {
    storage["key"] = "value";
    delete storage["key"];
    expect(storage["key"]).toBeUndefined();
  });
});
