// Temporary stub for Supabase client - returns empty data to unblock build
// TODO: Replace all queries with proper backend API calls

const createAsyncResult = (data: any = null) => Promise.resolve({ data, error: null });

const createChainableQuery = () => {
  const baseResult = {
    data: [],
    error: null,
    count: 0,
  };

  const chainMethods: any = {
    ...baseResult,
    eq: (...args: any[]) => createChainableQuery(),
    order: (...args: any[]) => createChainableQuery(),
    limit: (...args: any[]) => createChainableQuery(),
    neq: (...args: any[]) => createChainableQuery(),
    gte: (...args: any[]) => createChainableQuery(),
    not: (...args: any[]) => createChainableQuery(),
    maybeSingle: () => createAsyncResult(null),
    single: () => createAsyncResult(null),
    then: (resolve: any) => resolve(baseResult),
  };

  return chainMethods;
};

const createChannel = (): any => {
  const channelMethods = {
    on: (...args: any[]) => channelMethods,
    subscribe: (...args: any[]) => {},
  };
  return channelMethods;
};

export const supabase = {
  from: (table: string) => ({
    select: (...args: any[]) => createChainableQuery(),
    insert: (...args: any[]) => createAsyncResult(null),
    update: (...args: any[]) => ({
      eq: (...args: any[]) => createAsyncResult(null),
    }),
    delete: () => ({
      eq: (...args: any[]) => createAsyncResult(null),
    }),
  }),
  channel: (...args: any[]) => createChannel(),
  removeChannel: (...args: any[]) => {},
};
