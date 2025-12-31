describe("Favorites", () => {
  let favorites: string[] = [];

  beforeEach(() => { favorites = []; });

  test("agrega favorito", () => {
    favorites.push("123");
    expect(favorites).toContain("123");
  });

  test("elimina favorito", () => {
    favorites = ["123", "456"];
    favorites = favorites.filter(id => id !== "123");
    expect(favorites).not.toContain("123");
    expect(favorites).toContain("456");
  });

  test("no duplica", () => {
    if (!favorites.includes("123")) favorites.push("123");
    if (!favorites.includes("123")) favorites.push("123");
    expect(favorites.length).toBe(1);
  });
});
