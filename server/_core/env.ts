console.log("[ENV] Loading environment configuration...");

// Use getters instead of frozen object to ensure we read process.env at runtime
export const ENV = {
  get appId() {
    const value = process.env.VITE_APP_ID ?? "";
    console.log("[ENV] Getter: appId =", value);
    return value;
  },
  get cookieSecret() {
    return process.env.JWT_SECRET ?? "";
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "";
  },
  get oAuthServerUrl() {
    return process.env.OAUTH_SERVER_URL ?? "";
  },
  get ownerOpenId() {
    return process.env.OWNER_OPEN_ID ?? "";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get forgeApiUrl() {
    return process.env.BUILT_IN_FORGE_API_URL ?? "";
  },
  get forgeApiKey() {
    return process.env.BUILT_IN_FORGE_API_KEY ?? "";
  },
};

console.log("[ENV] Environment configuration loaded - getters are ready");
