// AsyncStorage no tiene módulo nativo en Jest: usamos su mock oficial en memoria.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
