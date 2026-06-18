export const CONFIG = {
  baseDate: { year: 2010, month: 4, day: 15 },
  base32Chars: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
  pcbSizes: {
    0: "手腕板及更小",
    1: "通用版型",
    2: "G2版型",
    3: "G2写保护版型",
    4: "37mm双头",
    5: "中款版型",
    6: "中款写保护版型",
    7: "中款双头版型",
    8: "长款版型",
    9: "G2双头版型"
  },
  dramSizes: {
    'X': -1,
    '0': 128,
    '1': 256,
    '2': 512,
    '3': 1024,
    '4': 2048,
    '5': 4096,
    '6': 8192,
    '7': 16384
  },
  packages: {
    '0': "EMMC/UFS",
    'A': "BGA100",
    'B': "BGA132/152",
    'C': "BGA168",
    'D': "BGA252/272",
    'F': "BGA291",
    'G': "BGA316",
    'H': "BGA154",
    'I': "BGA308"
  },
  chipCount: { min: 1, max: 16 }
};