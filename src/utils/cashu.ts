import { CashuMint } from "@cashu/cashu-ts";

export const lookupMint = async (url: string) => {
  /* create new instance of mint */
  const mint = new CashuMint(url);

  /* GET /v1/info */
  const mintInfo = await mint.getInfo();
  console.log("Mint info:", mintInfo);

  /* GET /v1/keysets */
  const keysets = await mint.getKeySets();

  /* get unique units mint supports */
  const units = Array.from(new Set(keysets.keysets.map((k) => k.unit)));
  console.log("Supported units:", units);

  return { units };
};
