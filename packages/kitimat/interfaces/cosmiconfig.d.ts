declare module 'cosmiconfig' {
  type Options = {
    sync?: boolean;
  };

  type Output<T> = {
    config: T;
    filepath: string;
  };

  type Load<T> = () => Output<T>;

  function get<T>(moduleName: string, options: Options): { load: Load<T> };

  export = get;
}
