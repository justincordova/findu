export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  userId: string | null; 
  email: string | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  setUserId: (id: string) => void;
  setEmail: (email: string | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setLoggedIn: (isLoggedIn: boolean) => void;
  reset: () => void;
}


