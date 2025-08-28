export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  userId: string | null; 
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  setUserId: (id: string) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setLoggedIn: (isLoggedIn: boolean) => void;
  reset: () => void;
}


