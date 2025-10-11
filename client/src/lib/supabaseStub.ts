// Temporary stub for Supabase client - returns empty data to unblock build
// TODO: Replace all queries with proper backend API calls

const createAsyncResult = (data: any = null) => Promise.resolve({ data, error: null });

export const supabase = {
  from: (table: string) => ({
    select: (...args: any[]) => {
      const result = {
        data: [],
        error: null,
        count: 0,
      };
      
      return {
        ...result,
        eq: (...args: any[]) => ({
          ...result,
          order: (...args: any[]) => ({
            ...result,
            limit: (...args: any[]) => ({
              ...result,
              maybeSingle: () => createAsyncResult(null),
              single: () => createAsyncResult(null),
            }),
            maybeSingle: () => createAsyncResult(null),
            single: () => createAsyncResult(null),
          }),
          limit: (...args: any[]) => createAsyncResult([]),
          maybeSingle: () => createAsyncResult(null),
          single: () => createAsyncResult(null),
          neq: (...args: any[]) => ({ ...result }),
          gte: (...args: any[]) => ({
            order: (...args: any[]) => ({
              limit: (...args: any[]) => ({
                maybeSingle: () => createAsyncResult(null),
              }),
            }),
          }),
          not: (...args: any[]) => ({
            gte: (...args: any[]) => ({
              order: (...args: any[]) => ({
                limit: (...args: any[]) => ({
                  maybeSingle: () => createAsyncResult(null),
                }),
              }),
            }),
          }),
        }),
        order: (...args: any[]) => ({
          ...result,
          limit: (...args: any[]) => ({
            ...result,
            maybeSingle: () => createAsyncResult(null),
          }),
        }),
        neq: (...args: any[]) => ({ ...result }),
        not: (...args: any[]) => ({
          gte: (...args: any[]) => ({
            order: (...args: any[]) => ({
              limit: (...args: any[]) => ({
                maybeSingle: () => createAsyncResult(null),
              }),
            }),
          }),
        }),
        gte: (...args: any[]) => ({
          order: (...args: any[]) => ({
            limit: (...args: any[]) => ({
              maybeSingle: () => createAsyncResult(null),
            }),
          }),
        }),
      };
    },
    insert: (...args: any[]) => createAsyncResult(null),
    update: (...args: any[]) => ({
      eq: (...args: any[]) => createAsyncResult(null),
    }),
    delete: () => ({
      eq: (...args: any[]) => createAsyncResult(null),
    }),
  }),
  channel: (...args: any[]) => ({
    on: (...args: any[]) => ({
      subscribe: (...args: any[]) => {},
    }),
  }),
  removeChannel: (...args: any[]) => {},
};
