describe("Haptics", () => {
  test("ImpactFeedbackStyle values", () => {
    const styles = { Light: "light", Medium: "medium", Heavy: "heavy" };
    expect(styles.Light).toBe("light");
    expect(styles.Medium).toBe("medium");
    expect(styles.Heavy).toBe("heavy");
  });

  test("NotificationFeedbackType values", () => {
    const types = { Success: "success", Warning: "warning", Error: "error" };
    expect(types.Success).toBe("success");
    expect(types.Warning).toBe("warning");
    expect(types.Error).toBe("error");
  });
});
