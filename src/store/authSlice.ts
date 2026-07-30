import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEMO_MODE } from '../config/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  subscription: {
    type: 'free' | 'pro' | 'pro_ultra';
    dailyRequests: number;
    usedRequests: number;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Загружаем пользователя из localStorage при инициализации
const loadUserFromStorage = (): User | null => {
  try {
    if (DEMO_MODE) {
      const demoUser: User = {
        id: 9001,
        first_name: 'Демо',
        last_name: 'Садовод',
        username: 'demo',
        phone: '+70000000000',
        subscription: {
          type: 'pro_ultra',
          dailyRequests: 100,
          usedRequests: 0,
        },
      };
      localStorage.setItem('userId', String(demoUser.id));
      localStorage.setItem('firstName', demoUser.first_name);
      localStorage.setItem('lastName', demoUser.last_name);
      localStorage.setItem('username', demoUser.username);
      return demoUser;
    }
    const userJson = localStorage.getItem('floromate_user');
    if (userJson) {
      return JSON.parse(userJson);
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователя из localStorage:', error);
  }
  return null;
};

const initialState: AuthState = {
  user: loadUserFromStorage(),
  isAuthenticated: loadUserFromStorage() !== null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      // Сохраняем в localStorage
      try {
        localStorage.setItem('floromate_user', JSON.stringify(action.payload));
      } catch (error) {
        console.error('Ошибка сохранения пользователя:', error);
      }
    },

    updateSubscription: (state, action: PayloadAction<User['subscription']>) => {
      if (state.user) {
        state.user.subscription = action.payload;
        try {
          localStorage.setItem('floromate_user', JSON.stringify(state.user));
        } catch (error) {
          console.error('Ошибка обновления подписки:', error);
        }
      }
    },

    logout: (state) => {
      if (DEMO_MODE) {
        return;
      }
      state.user = null;
      state.isAuthenticated = false;
      // Удаляем из localStorage
      try {
        localStorage.removeItem('floromate_user');
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
      }
    },
  },
});

export const { setUser, updateSubscription, logout } = authSlice.actions;
export default authSlice.reducer;
