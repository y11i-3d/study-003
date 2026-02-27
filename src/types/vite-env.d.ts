interface ImportMetaEnv {
  readonly USER_NAME: string;
  readonly REPO_NAME: string;
  readonly ID: string;
  readonly KEYWORDS: string[];
  readonly TITLE: string;
  readonly DESCRIPTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
