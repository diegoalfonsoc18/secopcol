import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================
// TIPOS
// ============================================
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface UserPreferences {
  selectedContractTypes: string[];
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  completeOnboarding: (contractTypes: string[]) => Promise<void>;
}

const STORAGE_KEYS = {
  USER: "secop-user",
  PREFERENCES: "secop-preferences",
  CREDENTIALS: "secop-credentials",
};

const DEFAULT_PREFERENCES: UserPreferences = {
  selectedContractTypes: [],
  onboardingCompleted: false,
};

// ============================================
// CONTEXTO
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al iniciar
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedUser, storedPrefs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES),
      ]);

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs));
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login (simulado - en producción conectar a backend)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Verificar credenciales guardadas
      const storedCreds = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);

      if (storedCreds) {
        const creds = JSON.parse(storedCreds);
        if (creds.email === email && creds.password === password) {
          const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Registro
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };

      // Guardar usuario y credenciales
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser)),
        AsyncStorage.setItem(
          STORAGE_KEYS.CREDENTIALS,
          JSON.stringify({ email, password })
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.PREFERENCES,
          JSON.stringify(DEFAULT_PREFERENCES)
        ),
      ]);

      setUser(newUser);
      setPreferences(DEFAULT_PREFERENCES);
      return true;
    } catch (error) {
      console.error("Register error:", error);
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.PREFERENCES,
        STORAGE_KEYS.CREDENTIALS,
      ]);
      setUser(null);
      setPreferences(DEFAULT_PREFERENCES);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Actualizar preferencias
  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    try {
      const newPrefs = { ...preferences, ...prefs };
      await AsyncStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify(newPrefs)
      );
      setPreferences(newPrefs);
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  // Completar onboarding
  const completeOnboarding = async (contractTypes: string[]) => {
    await updatePreferences({
      selectedContractTypes: contractTypes,
      onboardingCompleted: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updatePreferences,
        completeOnboarding,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
