
// APIエラーの型定義！✨
export class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  }
  

  //console.log("document in client",document);