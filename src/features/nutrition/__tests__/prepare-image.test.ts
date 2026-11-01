import { targetSize } from "../prepare-image";

describe("targetSize", () => {
  it("no redimensiona imágenes que ya caben", () => {
    expect(targetSize(1200, 900)).toBeNull();
    expect(targetSize(1600, 1600)).toBeNull();
  });

  it("limita el lado mayor a 1600 px manteniendo la proporción", () => {
    expect(targetSize(4000, 3000)).toEqual({ width: 1600 });
    expect(targetSize(3000, 4000)).toEqual({ height: 1600 });
  });

  it("ignora dimensiones desconocidas", () => {
    expect(targetSize(0, 0)).toBeNull();
  });
});
